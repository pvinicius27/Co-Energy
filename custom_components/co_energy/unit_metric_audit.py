"""Apply the pure audit calculation to one explicit unit energy metric."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .audit import AuditCalculation, AuditCalculationError, calculate_audit
from .billing import BillingRecord
from .periods import Period
from .unit_energy_summary import UnitEnergyMetricResult, UnitEnergySummary


class UnitMetricAuditError(ValueError):
    """Raised when a unit metric audit cannot be assembled."""


@dataclass(frozen=True)
class UnitMetricAudit:
    """Official comparison for one energy metric over one billing period."""

    unit_id: str
    billing_reference: str
    period: Period
    metric: UnitEnergyMetricResult
    calculation: AuditCalculation


def build_unit_metric_audit(
    bill: BillingRecord,
    billing_period: Period,
    energy_summary: UnitEnergySummary,
    logical_id: str,
    official_value: Any,
) -> UnitMetricAudit:
    """Audit one explicitly selected metric over an exact billing period."""
    if not isinstance(bill, BillingRecord):
        raise UnitMetricAuditError("bill must be a BillingRecord")
    if not isinstance(billing_period, Period):
        raise UnitMetricAuditError("billing_period must be a Period")
    if billing_period.mode != "cycle":
        raise UnitMetricAuditError("billing_period mode must be cycle")
    if not isinstance(energy_summary, UnitEnergySummary):
        raise UnitMetricAuditError("energy_summary must be a UnitEnergySummary")
    if bill.unit_id != energy_summary.unit_id:
        raise UnitMetricAuditError("bill and energy summary must belong to the same unit")
    if energy_summary.period is not billing_period:
        raise UnitMetricAuditError("energy summary must use the exact billing period")
    if (
        not isinstance(logical_id, str)
        or not logical_id.strip()
        or logical_id != logical_id.strip()
    ):
        raise UnitMetricAuditError(
            "logical_id must be a non-empty string without surrounding whitespace"
        )

    matches = tuple(
        metric
        for metric in energy_summary.metrics
        if metric.logical_id == logical_id
    )
    if len(matches) != 1:
        raise UnitMetricAuditError(
            f"expected exactly one metric {logical_id!r} for unit {energy_summary.unit_id!r}"
        )
    metric = matches[0]
    if metric.quantity != "energy":
        raise UnitMetricAuditError(f"metric {logical_id!r} must have quantity energy")

    try:
        calculation = calculate_audit(official_value, metric.value)
    except AuditCalculationError as error:
        raise UnitMetricAuditError(
            f"could not audit unit {energy_summary.unit_id!r}, bill {bill.reference!r}, metric {logical_id!r}"
        ) from error

    return UnitMetricAudit(
        unit_id=energy_summary.unit_id,
        billing_reference=bill.reference,
        period=billing_period,
        metric=metric,
        calculation=calculation,
    )
