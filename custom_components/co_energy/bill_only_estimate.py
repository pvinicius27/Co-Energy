"""Pure cycle estimate from a previous official cycle value."""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any

from .periods import Period


SECONDS_PER_DAY = 86400.0


class BillOnlyEstimateError(ValueError):
    """Raised when a bill-only cycle estimate cannot be calculated."""


@dataclass(frozen=True)
class BillOnlyCycleEstimate:
    """Transparent inputs and result of one bill-only cycle estimate."""

    reference_period: Period
    target_period: Period
    reference_value: float | None
    reference_seconds: float
    target_seconds: float
    reference_days_equivalent: float
    target_days_equivalent: float
    average_daily_value: float | None
    estimated_value: float | None


def _normalize_reference_value(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise BillOnlyEstimateError("reference_value must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized) or normalized < 0:
        raise BillOnlyEstimateError("reference_value must be finite and non-negative")
    return normalized


def calculate_bill_only_cycle_estimate(
    reference_value: Any,
    reference_period: Period,
    target_period: Period,
) -> BillOnlyCycleEstimate:
    """Estimate a target cycle from the exact duration of a reference cycle."""
    if not isinstance(reference_period, Period):
        raise BillOnlyEstimateError("reference_period must be a Period")
    if not isinstance(target_period, Period):
        raise BillOnlyEstimateError("target_period must be a Period")
    if reference_period.mode != "cycle":
        raise BillOnlyEstimateError("reference_period mode must be cycle")
    if target_period.mode != "cycle":
        raise BillOnlyEstimateError("target_period mode must be cycle")

    normalized_value = _normalize_reference_value(reference_value)
    reference_seconds = (
        reference_period.end - reference_period.start
    ).total_seconds()
    target_seconds = (target_period.end - target_period.start).total_seconds()
    reference_days = reference_seconds / SECONDS_PER_DAY
    target_days = target_seconds / SECONDS_PER_DAY
    average_daily = (
        None if normalized_value is None else normalized_value / reference_days
    )
    estimated = None if average_daily is None else average_daily * target_days

    return BillOnlyCycleEstimate(
        reference_period=reference_period,
        target_period=target_period,
        reference_value=normalized_value,
        reference_seconds=reference_seconds,
        target_seconds=target_seconds,
        reference_days_equivalent=reference_days,
        target_days_equivalent=target_days,
        average_daily_value=average_daily,
        estimated_value=estimated,
    )
