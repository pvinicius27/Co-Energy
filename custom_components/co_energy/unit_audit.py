"""Orchestrate declarative audits for one unit and official billing period."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .billing import BillingRecord
from .energy_model import EnergyModelError, get_audit_pairs
from .periods import Period
from .unit_energy_summary import UnitEnergySummary
from .unit_metric_audit import UnitMetricAudit, build_unit_metric_audit


class UnitAuditError(ValueError):
    """Raised when unit audit orchestration receives an invalid context."""


def _resolve_official_value(
    bill: BillingRecord, official_source: str
) -> float | None:
    if official_source == "meter_active_kwh":
        return bill.meter_active_kwh
    if official_source == "meter_generation_kwh":
        return bill.meter_generation_kwh
    raise UnitAuditError(f"unsupported official source: {official_source!r}")


def build_unit_audits(
    model: Mapping[str, Any],
    bill: BillingRecord,
    billing_period: Period,
    energy_summary: UnitEnergySummary,
) -> tuple[UnitMetricAudit, ...]:
    """Build all configured audits for one unit and official period."""
    if not isinstance(bill, BillingRecord):
        raise UnitAuditError("bill must be a BillingRecord")
    if not isinstance(billing_period, Period):
        raise UnitAuditError("billing_period must be a Period")
    if billing_period.mode != "cycle":
        raise UnitAuditError("billing_period mode must be cycle")
    if not isinstance(energy_summary, UnitEnergySummary):
        raise UnitAuditError("energy_summary must be a UnitEnergySummary")
    if bill.unit_id != energy_summary.unit_id:
        raise UnitAuditError("bill and energy summary must belong to the same unit")
    if energy_summary.period is not billing_period:
        raise UnitAuditError("energy summary must use the exact billing period")

    try:
        pairs = get_audit_pairs(model, energy_summary.unit_id)
    except EnergyModelError as error:
        raise UnitAuditError(
            f"could not resolve audit pairs for unit {energy_summary.unit_id!r}"
        ) from error

    return tuple(
        build_unit_metric_audit(
            bill,
            billing_period,
            energy_summary,
            pair.logical_id,
            _resolve_official_value(bill, pair.official_source),
        )
        for pair in pairs
    )
