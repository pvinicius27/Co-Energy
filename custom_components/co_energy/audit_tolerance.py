"""Pure numeric tolerance evaluation for an existing audit calculation."""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any

from .audit import AuditCalculation


class AuditToleranceError(ValueError):
    """Raised when an audit tolerance evaluation receives invalid input."""


@dataclass(frozen=True)
class AuditToleranceEvaluation:
    """Numeric tolerance result for one existing audit calculation."""

    calculation: AuditCalculation
    tolerance_percent: float
    within_tolerance: bool | None


def evaluate_audit_tolerance(
    calculation: AuditCalculation,
    tolerance_percent: Any,
) -> AuditToleranceEvaluation:
    """Evaluate the deviation magnitude against an inclusive tolerance."""
    if not isinstance(calculation, AuditCalculation):
        raise AuditToleranceError("calculation must be an AuditCalculation")
    if isinstance(tolerance_percent, bool) or not isinstance(
        tolerance_percent, (int, float)
    ):
        raise AuditToleranceError("tolerance_percent must be numeric")
    normalized_tolerance = float(tolerance_percent)
    if not math.isfinite(normalized_tolerance) or normalized_tolerance < 0:
        raise AuditToleranceError(
            "tolerance_percent must be finite and non-negative"
        )

    deviation_percent = calculation.deviation_percent
    within_tolerance = (
        None
        if deviation_percent is None
        else abs(deviation_percent) <= normalized_tolerance
    )
    return AuditToleranceEvaluation(
        calculation=calculation,
        tolerance_percent=normalized_tolerance,
        within_tolerance=within_tolerance,
    )
