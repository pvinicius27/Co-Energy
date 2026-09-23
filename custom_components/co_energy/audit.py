"""Pure calculation of official versus measured energy deviation."""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any


class AuditCalculationError(ValueError):
    """Raised when an audit calculation receives an invalid value."""


@dataclass(frozen=True)
class AuditCalculation:
    """Raw numeric result of one official versus measured comparison."""

    official_value: float | None
    measured_value: float | None
    deviation: float | None
    deviation_percent: float | None


def _normalize_value(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise AuditCalculationError(f"{field} must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized) or normalized < 0:
        raise AuditCalculationError(f"{field} must be finite and non-negative")
    return normalized


def calculate_audit(
    official_value: Any,
    measured_value: Any,
) -> AuditCalculation:
    """Calculate signed deviation using the measured value as denominator."""
    official = _normalize_value(official_value, "official_value")
    measured = _normalize_value(measured_value, "measured_value")

    deviation = (
        None if official is None or measured is None else official - measured
    )
    deviation_percent = (
        None
        if deviation is None or measured == 0
        else deviation / measured * 100.0
    )
    return AuditCalculation(
        official_value=official,
        measured_value=measured,
        deviation=deviation,
        deviation_percent=deviation_percent,
    )
