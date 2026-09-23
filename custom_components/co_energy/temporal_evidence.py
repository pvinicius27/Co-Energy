"""Project logical-series observations onto a nominal temporal grid."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from .logical_series import (
    LogicalSeriesIssue,
    LogicalSeriesPoint,
    LogicalSeriesResult,
    LogicalSourceSegment,
)
from .temporal_grid import (
    TemporalGridBucket,
    TemporalGridError,
    build_temporal_grid,
)


class TemporalEvidenceError(ValueError):
    """Raised when temporal evidence cannot be built consistently."""


@dataclass(frozen=True)
class TemporalEvidenceSlice:
    """One structural evidence slice within a nominal grid bucket."""

    bucket: TemporalGridBucket
    start: datetime
    end: datetime
    segment: LogicalSourceSegment | None
    kind: str
    points: tuple[LogicalSeriesPoint, ...]
    issues: tuple[LogicalSeriesIssue, ...]


def _as_utc(value: datetime, field: str) -> datetime:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise TemporalEvidenceError(f"{field} must be a timezone-aware datetime")
    return value.astimezone(timezone.utc)


def _validated_segments(
    series: LogicalSeriesResult,
    series_start: datetime,
    series_end: datetime,
) -> tuple[tuple[LogicalSourceSegment, datetime, datetime], ...]:
    validated: list[tuple[LogicalSourceSegment, datetime, datetime]] = []
    for segment in series.segments:
        if not isinstance(segment, LogicalSourceSegment):
            raise TemporalEvidenceError(
                "series segments must be LogicalSourceSegment objects"
            )
        segment_start = _as_utc(segment.start, "segment start")
        segment_end = _as_utc(segment.end, "segment end")
        if segment_start >= segment_end:
            raise TemporalEvidenceError("segment start must be earlier than end")
        if segment_start < series_start or segment_end > series_end:
            raise TemporalEvidenceError("segment must be contained in series interval")
        validated.append((segment, segment_start, segment_end))

    validated.sort(key=lambda item: item[1])
    for previous, current in zip(validated, validated[1:]):
        if current[1] < previous[2]:
            raise TemporalEvidenceError("series segments must not overlap")
    return tuple(validated)


def _empty_slices(
    buckets: tuple[TemporalGridBucket, ...],
    segments: tuple[tuple[LogicalSourceSegment, datetime, datetime], ...],
) -> list[TemporalEvidenceSlice]:
    slices: list[TemporalEvidenceSlice] = []
    for bucket in buckets:
        cursor = bucket.start
        for segment, segment_start, segment_end in segments:
            start = max(bucket.start, segment_start)
            end = min(bucket.end, segment_end)
            if start >= end:
                continue
            if cursor < start:
                slices.append(
                    TemporalEvidenceSlice(
                        bucket=bucket,
                        start=cursor,
                        end=start,
                        segment=None,
                        kind="outside_configured_source",
                        points=(),
                        issues=(),
                    )
                )
            slices.append(
                TemporalEvidenceSlice(
                    bucket=bucket,
                    start=start,
                    end=end,
                    segment=segment,
                    kind="missing_observation",
                    points=(),
                    issues=(),
                )
            )
            cursor = end
        if cursor < bucket.end:
            slices.append(
                TemporalEvidenceSlice(
                    bucket=bucket,
                    start=cursor,
                    end=bucket.end,
                    segment=None,
                    kind="outside_configured_source",
                    points=(),
                    issues=(),
                )
            )
    return slices


def _build_slice_index(
    slices: list[TemporalEvidenceSlice],
) -> dict[tuple[datetime, datetime, str], int]:
    """Index the configured slices by their exact interval and source.

    Existe por custo, nao por elegancia. A busca era linear e rodava uma vez
    por observacao: numa janela de um dia sao 24 fatias e 24 pontos, 576
    comparacoes — irrelevante. Num ano sao ~6.000 de cada, 36 milhoes por
    serie e mais de 100 milhoes nas tres, tudo dentro do laco de eventos. O
    pedido do ano simplesmente nunca voltava.

    `setdefault` preserva a semantica antiga: havendo fatias identicas, vale a
    primeira, que era a que a varredura encontrava.
    """
    indice: dict[tuple[datetime, datetime, str], int] = {}
    for index, evidence_slice in enumerate(slices):
        segment = evidence_slice.segment
        if segment is None:
            continue
        indice.setdefault(
            (evidence_slice.start, evidence_slice.end, segment.entity_id), index
        )
    return indice


def _index_by_entity(
    slices: list[TemporalEvidenceSlice],
) -> dict[str, list[int]]:
    """Group configured slice positions by source entity, in order.

    O balde parcial precisa de todas as fatias da mesma entidade que cruzem o
    intervalo dele. Varrer a lista inteira por intervalo tinha o mesmo custo
    quadratico; agrupando por entidade, so as fatias daquela fonte sao
    percorridas — e elas ja saem em ordem crescente de tempo.
    """
    grupos: dict[str, list[int]] = {}
    for index, evidence_slice in enumerate(slices):
        segment = evidence_slice.segment
        if segment is None:
            continue
        grupos.setdefault(segment.entity_id, []).append(index)
    return grupos


def _exact_configured_slice_index(
    indice: dict[tuple[datetime, datetime, str], int],
    start: datetime,
    end: datetime,
    source_entity_id: str,
) -> int:
    posicao = indice.get((start, end, source_entity_id))
    if posicao is None:
        raise TemporalEvidenceError(
            "observation interval does not match a configured source slice"
        )
    return posicao


def _associate_points(
    series: LogicalSeriesResult,
    slices: list[TemporalEvidenceSlice],
) -> list[list[LogicalSeriesPoint]]:
    associated: list[list[LogicalSeriesPoint]] = [[] for _ in slices]
    indice = _build_slice_index(slices)
    for point in series.points:
        if not isinstance(point, LogicalSeriesPoint):
            raise TemporalEvidenceError(
                "series points must be LogicalSeriesPoint objects"
            )
        point_start = _as_utc(point.start, "point start")
        point_end = _as_utc(point.end, "point end")
        if point_start >= point_end:
            raise TemporalEvidenceError("point start must be earlier than end")
        index = _exact_configured_slice_index(
            indice, point_start, point_end, point.source_entity_id
        )
        associated[index].append(point)
    return associated


def _associate_issues(
    series: LogicalSeriesResult,
    slices: list[TemporalEvidenceSlice],
) -> list[list[LogicalSeriesIssue]]:
    associated: list[list[LogicalSeriesIssue]] = [[] for _ in slices]
    indice = _build_slice_index(slices)
    por_entidade = _index_by_entity(slices)
    for issue in series.issues:
        if not isinstance(issue, LogicalSeriesIssue):
            raise TemporalEvidenceError(
                "series issues must be LogicalSeriesIssue objects"
            )
        issue_start = _as_utc(issue.start, "issue start")
        issue_end = _as_utc(issue.end, "issue end")
        if issue_start >= issue_end:
            raise TemporalEvidenceError("issue start must be earlier than end")
        if issue.reason != "partial_bucket":
            index = _exact_configured_slice_index(
                indice, issue_start, issue_end, issue.source_entity_id
            )
            associated[index].append(issue)
            continue

        matching_indices = [
            index
            for index in por_entidade.get(issue.source_entity_id, ())
            if issue_start < slices[index].end
            and issue_end > slices[index].start
        ]
        if not matching_indices:
            raise TemporalEvidenceError(
                "partial bucket does not intersect its configured source"
            )
        for index in matching_indices:
            associated[index].append(issue)
    return associated


def _kind(
    segment: LogicalSourceSegment | None,
    points: tuple[LogicalSeriesPoint, ...],
    issues: tuple[LogicalSeriesIssue, ...],
) -> str:
    if segment is None:
        return "outside_configured_source"
    if points and issues:
        return "mixed_observation"
    if points:
        return "accepted_observation"
    if issues:
        if all(issue.reason == "skip_first_change" for issue in issues):
            return "transition_protected"
        return "rejected_observation"
    return "missing_observation"


def build_temporal_evidence(
    series: LogicalSeriesResult,
) -> tuple[TemporalEvidenceSlice, ...]:
    """Return a continuous structural partition of one logical series."""
    if not isinstance(series, LogicalSeriesResult):
        raise TemporalEvidenceError("series must be a LogicalSeriesResult")
    try:
        buckets = build_temporal_grid(series.start, series.end, series.period)
    except TemporalGridError as error:
        raise TemporalEvidenceError("could not build temporal evidence grid") from error

    series_start = buckets[0].start
    series_end = buckets[-1].end
    segments = _validated_segments(series, series_start, series_end)
    empty_slices = _empty_slices(buckets, segments)
    points_by_slice = _associate_points(series, empty_slices)
    issues_by_slice = _associate_issues(series, empty_slices)

    result: list[TemporalEvidenceSlice] = []
    for index, evidence_slice in enumerate(empty_slices):
        points = tuple(points_by_slice[index])
        issues = tuple(issues_by_slice[index])
        result.append(
            TemporalEvidenceSlice(
                bucket=evidence_slice.bucket,
                start=evidence_slice.start,
                end=evidence_slice.end,
                segment=evidence_slice.segment,
                kind=_kind(evidence_slice.segment, points, issues),
                points=points,
                issues=issues,
            )
        )
    return tuple(result)
