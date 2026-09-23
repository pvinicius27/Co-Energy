"""Compose Recorder statistics into one declarative logical series."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from . import recorder_adapter
from .energy_model import EnergyModelError, get_series_definition


ALLOWED_PERIODS = frozenset({"5minute", "hour"})
ISSUE_REASONS = frozenset(
    {
        "partial_bucket",
        "missing_change",
        "skip_first_change",
        "negative_change",
        "max_change_exceeded",
    }
)


class LogicalSeriesError(ValueError):
    """Raised when a logical series cannot be resolved or composed."""


def _is_aware(value: datetime) -> bool:
    return value.tzinfo is not None and value.utcoffset() is not None


@dataclass(frozen=True)
class LogicalSourceSegment:
    """Effective half-open interval for one physical source."""

    entity_id: str
    label: str | None
    start: datetime
    end: datetime
    skip_first_change: bool
    max_change: float | None

    def __post_init__(self) -> None:
        if not isinstance(self.entity_id, str) or not self.entity_id.strip():
            raise LogicalSeriesError("segment entity_id must be a non-empty string")
        if self.label is not None and not isinstance(self.label, str):
            raise LogicalSeriesError("segment label must be a string or None")
        if not isinstance(self.start, datetime) or not _is_aware(self.start):
            raise LogicalSeriesError("segment start must be timezone-aware")
        if not isinstance(self.end, datetime) or not _is_aware(self.end):
            raise LogicalSeriesError("segment end must be timezone-aware")
        if self.start >= self.end:
            raise LogicalSeriesError("segment start must be earlier than end")


@dataclass(frozen=True)
class LogicalSeriesPoint:
    """Accepted change value from one logical-series source."""

    start: datetime
    end: datetime | None
    value: float
    source_entity_id: str
    source_label: str | None


@dataclass(frozen=True)
class LogicalSeriesIssue:
    """Evidence for one discarded Recorder point."""

    start: datetime | None
    end: datetime | None
    source_entity_id: str
    source_label: str | None
    reason: str
    value: float | None = None


@dataclass(frozen=True)
class LogicalSeriesResult:
    """Normalized points and discard evidence for one logical series."""

    logical_id: str
    quantity: str
    unit: str
    classification: str
    start: datetime
    end: datetime
    period: str
    segments: tuple[LogicalSourceSegment, ...]
    points: tuple[LogicalSeriesPoint, ...]
    issues: tuple[LogicalSeriesIssue, ...]


def _parse_source_datetime(value: Any, field: str) -> datetime:
    if not isinstance(value, str):
        raise LogicalSeriesError(f"{field} must be an ISO 8601 string")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as error:
        raise LogicalSeriesError(f"{field} must be valid ISO 8601") from error
    if not _is_aware(parsed):
        raise LogicalSeriesError(f"{field} must include a timezone offset")
    return parsed


def _validate_interval(start: datetime, end: datetime) -> None:
    if not isinstance(start, datetime) or not _is_aware(start):
        raise LogicalSeriesError("start must be a timezone-aware datetime")
    if not isinstance(end, datetime) or not _is_aware(end):
        raise LogicalSeriesError("end must be a timezone-aware datetime")
    if start >= end:
        raise LogicalSeriesError("end must be later than start")


def resolve_source_segments(
    series_definition: Mapping[str, Any],
    start: datetime,
    end: datetime,
) -> tuple[LogicalSourceSegment, ...]:
    """Resolve and order source intersections with ``[start, end)``."""
    _validate_interval(start, end)
    segments: list[LogicalSourceSegment] = []
    for index, source in enumerate(series_definition["sources"]):
        source_from = (
            _parse_source_datetime(source["from"], f"sources[{index}].from")
            if "from" in source
            else None
        )
        configured_skip = source.get("skip_first_change", False)
        if configured_skip and source_from is None:
            raise LogicalSeriesError(
                f"sources[{index}].skip_first_change requires from"
            )
        source_until = (
            _parse_source_datetime(source["until"], f"sources[{index}].until")
            if "until" in source
            else None
        )
        segment_start = max(start, source_from) if source_from else start
        segment_end = min(end, source_until) if source_until else end
        if segment_start >= segment_end:
            continue
        max_change = source.get("max_change")
        effective_skip = (
            configured_skip
            and source_from is not None
            and segment_start == source_from
        )
        segments.append(
            LogicalSourceSegment(
                entity_id=source["entity_id"],
                label=source.get("label"),
                start=segment_start,
                end=segment_end,
                skip_first_change=effective_skip,
                max_change=float(max_change) if max_change is not None else None,
            )
        )

    segments.sort(key=lambda segment: segment.start)
    for previous, current in zip(segments, segments[1:]):
        if current.start < previous.end:
            raise LogicalSeriesError(
                f"overlapping sources: {previous.entity_id} and {current.entity_id}"
            )
    return tuple(segments)


def _issue(
    segment: LogicalSourceSegment,
    point: recorder_adapter.RecorderStatisticsPoint,
    reason: str,
    value: float | None,
) -> LogicalSeriesIssue:
    return LogicalSeriesIssue(
        start=point.start,
        end=point.end,
        source_entity_id=segment.entity_id,
        source_label=segment.label,
        reason=reason,
        value=value,
    )


def _process_segment_points(
    segment: LogicalSourceSegment,
    recorder_points: Sequence[recorder_adapter.RecorderStatisticsPoint],
) -> tuple[tuple[LogicalSeriesPoint, ...], tuple[LogicalSeriesIssue, ...]]:
    """Apply source protections in their required order."""
    points: list[LogicalSeriesPoint] = []
    issues: list[LogicalSeriesIssue] = []
    skip_pending = segment.skip_first_change

    for recorder_point in recorder_points:
        if recorder_point.start < segment.start or recorder_point.end > segment.end:
            issues.append(
                _issue(
                    segment,
                    recorder_point,
                    "partial_bucket",
                    (
                        float(recorder_point.change)
                        if recorder_point.change is not None
                        else None
                    ),
                )
            )
            continue
        change = recorder_point.change
        if change is None:
            issues.append(_issue(segment, recorder_point, "missing_change", None))
            continue

        value = float(change)
        if skip_pending:
            issues.append(_issue(segment, recorder_point, "skip_first_change", value))
            skip_pending = False
            continue
        if value < 0:
            issues.append(_issue(segment, recorder_point, "negative_change", value))
            continue
        if segment.max_change is not None and value > segment.max_change:
            issues.append(
                _issue(segment, recorder_point, "max_change_exceeded", value)
            )
            continue
        points.append(
            LogicalSeriesPoint(
                start=recorder_point.start,
                end=recorder_point.end,
                value=value,
                source_entity_id=segment.entity_id,
                source_label=segment.label,
            )
        )
    return tuple(points), tuple(issues)


async def async_get_logical_series(
    hass: Any,
    model: Mapping[str, Any],
    logical_id: str,
    start: datetime,
    end: datetime,
    period: str = "hour",
) -> LogicalSeriesResult:
    """Resolve, query, protect, and combine one logical series."""
    _validate_interval(start, end)
    if period not in ALLOWED_PERIODS:
        raise LogicalSeriesError(f"unsupported logical-series period: {period}")
    try:
        series_definition = get_series_definition(model, logical_id)
    except EnergyModelError as error:
        raise LogicalSeriesError(f"invalid logical series {logical_id}: {error}") from error

    segments = resolve_source_segments(series_definition, start, end)
    quantity = series_definition["quantity"]
    unit = series_definition["unit"]
    classification = series_definition["classification"]
    accepted_points: list[LogicalSeriesPoint] = []
    issues: list[LogicalSeriesIssue] = []

    for segment in segments:
        try:
            statistics = await recorder_adapter.async_get_statistics(
                hass=hass,
                statistic_id=segment.entity_id,
                start=segment.start,
                end=segment.end,
                period=period,
                types={"change"},
                units={quantity: unit},
            )
        except recorder_adapter.RecorderAdapterError as error:
            raise LogicalSeriesError(
                f"failed logical series {logical_id} source {segment.entity_id}"
            ) from error
        segment_points, segment_issues = _process_segment_points(
            segment, statistics.points
        )
        accepted_points.extend(segment_points)
        issues.extend(segment_issues)

    accepted_points.sort(key=lambda point: point.start)
    issues.sort(
        key=lambda issue: (
            issue.start is None,
            issue.start.timestamp() if issue.start is not None else 0.0,
        )
    )
    return LogicalSeriesResult(
        logical_id=logical_id,
        quantity=quantity,
        unit=unit,
        classification=classification,
        start=start,
        end=end,
        period=period,
        segments=segments,
        points=tuple(accepted_points),
        issues=tuple(issues),
    )
