"""Total physical energy for an explicit logical period."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from .energy import EnergyCalculationError, sum_logical_series
from .logical_series import (
    LogicalSeriesError,
    LogicalSeriesIssue,
    async_get_logical_series,
)
from .periods import Period
from .temporal_evidence import (
    TemporalEvidenceError,
    TemporalEvidenceSlice,
    build_temporal_evidence,
)


class EnergyPeriodError(ValueError):
    """Raised when physical energy cannot be totaled for a period."""


@dataclass(frozen=True)
class EnergyIssueCount:
    """Aggregate count for one preserved logical-series issue reason."""

    reason: str
    count: int

    def __post_init__(self) -> None:
        if not isinstance(self.reason, str) or not self.reason.strip():
            raise EnergyPeriodError("reason must be a non-empty string")
        if isinstance(self.count, bool) or not isinstance(self.count, int) or self.count <= 0:
            raise EnergyPeriodError("count must be a positive integer")


@dataclass(frozen=True)
class EnergyPeriodResult:
    """Physical energy total and structural counts for one logical period."""

    logical_id: str
    quantity: str
    unit: str
    classification: str
    period: Period
    statistics_period: str
    value: float | None
    point_count: int
    issue_count: int
    issue_counts: tuple[EnergyIssueCount, ...] = ()
    temporal_evidence: tuple[TemporalEvidenceSlice, ...] = ()


def _summarize_issue_counts(
    issues: Sequence[LogicalSeriesIssue],
) -> tuple[EnergyIssueCount, ...]:
    counts: dict[str, int] = {}
    for issue in issues:
        counts[issue.reason] = counts.get(issue.reason, 0) + 1
    return tuple(EnergyIssueCount(reason, count) for reason, count in counts.items())


async def async_get_energy_period(
    hass: Any,
    model: Mapping[str, Any],
    logical_id: str,
    period: Period,
    statistics_period: str,
) -> EnergyPeriodResult:
    """Resolve and total one physical logical series over an exact period."""
    if not isinstance(period, Period):
        raise EnergyPeriodError("period must be a Period")
    try:
        series = await async_get_logical_series(
            hass=hass,
            model=model,
            logical_id=logical_id,
            start=period.start,
            end=period.end,
            period=statistics_period,
        )
    except LogicalSeriesError as error:
        raise EnergyPeriodError(
            f"could not resolve energy period for {logical_id!r}"
        ) from error

    try:
        temporal_evidence = build_temporal_evidence(series)
    except TemporalEvidenceError as error:
        raise EnergyPeriodError(
            f"could not build temporal evidence for {logical_id!r}"
        ) from error

    try:
        value = sum_logical_series(series)
    except EnergyCalculationError as error:
        raise EnergyPeriodError(
            f"could not total energy period for {logical_id!r}"
        ) from error

    return EnergyPeriodResult(
        logical_id=series.logical_id,
        quantity=series.quantity,
        unit=series.unit,
        classification=series.classification,
        period=period,
        statistics_period=statistics_period,
        value=value,
        point_count=len(series.points),
        issue_count=len(series.issues),
        issue_counts=_summarize_issue_counts(series.issues),
        temporal_evidence=temporal_evidence,
    )


async def async_get_energy_periods(
    hass: Any,
    model: Mapping[str, Any],
    logical_ids: Sequence[str],
    period: Period,
    statistics_period: str,
) -> tuple[EnergyPeriodResult, ...]:
    """Total logical energy series sequentially in requested order."""
    if isinstance(logical_ids, str) or not isinstance(logical_ids, Sequence):
        raise EnergyPeriodError("logical_ids must be a sequence of logical IDs")
    results: list[EnergyPeriodResult] = []
    for logical_id in logical_ids:
        results.append(
            await async_get_energy_period(
                hass,
                model,
                logical_id,
                period,
                statistics_period,
            )
        )
    return tuple(results)
