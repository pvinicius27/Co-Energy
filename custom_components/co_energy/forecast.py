"""Pure linear projection for an observed operational billing cycle."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import math
from typing import Any

from .periods import Period


class ForecastError(ValueError):
    """Raised when a linear cycle forecast cannot be calculated."""


@dataclass(frozen=True)
class LinearCycleForecast:
    """Transparent inputs and result of one linear cycle projection."""

    observed_period: Period
    expected_end: datetime
    observed_value: float | None
    projected_value: float | None
    elapsed_seconds: float
    total_seconds: float
    progress_ratio: float


def _normalize_observed_value(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ForecastError("observed_value must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized) or normalized < 0:
        raise ForecastError("observed_value must be finite and non-negative")
    return normalized


def calculate_linear_cycle_forecast(
    observed_value: Any,
    observed_period: Period,
    expected_end: datetime,
) -> LinearCycleForecast:
    """Extrapolate an observed value linearly to an expected cycle end."""
    if not isinstance(observed_period, Period):
        raise ForecastError("observed_period must be a Period")
    if observed_period.mode != "cycle":
        raise ForecastError("observed_period mode must be cycle")
    if not isinstance(expected_end, datetime):
        raise ForecastError("expected_end must be a datetime")
    if expected_end.tzinfo is None or expected_end.utcoffset() is None:
        raise ForecastError("expected_end must be timezone-aware")
    if expected_end <= observed_period.end:
        raise ForecastError("expected_end must be later than observed_period.end")

    normalized_value = _normalize_observed_value(observed_value)
    elapsed_seconds = (
        observed_period.end - observed_period.start
    ).total_seconds()
    total_seconds = (expected_end - observed_period.start).total_seconds()
    progress_ratio = elapsed_seconds / total_seconds
    projected_value = (
        None
        if normalized_value is None
        else normalized_value / elapsed_seconds * total_seconds
    )

    return LinearCycleForecast(
        observed_period=observed_period,
        expected_end=expected_end,
        observed_value=normalized_value,
        projected_value=projected_value,
        elapsed_seconds=elapsed_seconds,
        total_seconds=total_seconds,
        progress_ratio=progress_ratio,
    )
