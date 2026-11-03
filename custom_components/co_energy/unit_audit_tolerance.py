"""Associate unit metric audits with the configured global tolerance."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .audit_tolerance import AuditToleranceEvaluation, evaluate_audit_tolerance
from .energy_model import EnergyModelError, get_audit_tolerance_percent
from .unit_metric_audit import UnitMetricAudit


class UnitAuditToleranceError(ValueError):
    """Raised when unit audit tolerance association receives invalid input."""


@dataclass(frozen=True)
class UnitMetricAuditTolerance:
    """One unit metric audit and its optional tolerance evaluation."""

    audit: UnitMetricAudit
    evaluation: AuditToleranceEvaluation | None


def evaluate_unit_audit_tolerances(
    model: Mapping[str, Any],
    audits: tuple[UnitMetricAudit, ...],
) -> tuple[UnitMetricAuditTolerance, ...]:
    """Evaluate configured global tolerance for an ordered audit tuple."""
    try:
        tolerance_percent = get_audit_tolerance_percent(model)
    except EnergyModelError as error:
        raise UnitAuditToleranceError(
            "could not resolve global audit tolerance"
        ) from error

    if not isinstance(audits, tuple):
        raise UnitAuditToleranceError("audits must be a tuple")

    results: list[UnitMetricAuditTolerance] = []
    for audit in audits:
        if not isinstance(audit, UnitMetricAudit):
            raise UnitAuditToleranceError(
                "every audits item must be a UnitMetricAudit"
            )
        evaluation = (
            None
            if tolerance_percent is None
            else evaluate_audit_tolerance(
                audit.calculation,
                tolerance_percent,
            )
        )
        results.append(
            UnitMetricAuditTolerance(
                audit=audit,
                evaluation=evaluation,
            )
        )
    return tuple(results)
