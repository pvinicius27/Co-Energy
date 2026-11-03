"""Explicit public serializer for the operational energy-flow contract."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from .energy_flow import PERIOD_KINDS, EnergyFlowAllocation, EnergyFlowResult


class EnergyFlowSerializationError(ValueError):
    """Raised when an energy-flow result cannot be serialized safely."""


def _decimal(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, Decimal) or not value.is_finite() or value < 0:
        raise EnergyFlowSerializationError(f"{field} must be a non-negative Decimal or None")
    text = format(value, "f")
    return text.rstrip("0").rstrip(".") if "." in text else text


def _allocation(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, EnergyFlowAllocation):
        raise EnergyFlowSerializationError(f"{field} must be an EnergyFlowAllocation")
    return {
        "unit_id": value.unit_id,
        "name": value.name,
        "share_percent": _decimal(value.share_percent, f"{field}.share_percent"),
        "allocated_energy_kwh": _decimal(value.allocated_energy_kwh, f"{field}.allocated_energy_kwh"),
        "classification": value.classification,
    }


def serialize_energy_flow(result: EnergyFlowResult) -> dict[str, Any]:
    """Serialize through an explicit allowlist; calculations remain in the domain."""
    if not isinstance(result, EnergyFlowResult):
        raise EnergyFlowSerializationError("result must be an EnergyFlowResult")
    if result.quality.status not in ("confirmed", "partial", "unavailable"):
        raise EnergyFlowSerializationError("quality.status is invalid")
    if result.cycle_status not in ("closed", "provisional", "open"):
        raise EnergyFlowSerializationError("cycle_status is invalid")
    if result.period_kind not in PERIOD_KINDS:
        raise EnergyFlowSerializationError("period_kind is invalid")
    return {
        "billing_reference": result.billing_reference,
        "cycle_status": result.cycle_status,
        # So "cycle" tem apuracao oficial. A interface precisa deste campo para
        # nao apresentar compensacao e saldo de um dia como se fossem faturados.
        "period_kind": result.period_kind,
        "period": {"start": result.period_start.isoformat(), "end": result.period_end.isoformat()},
        "generation_kwh": _decimal(result.generation_kwh, "generation_kwh"),
        "self_consumption_kwh": _decimal(result.self_consumption_kwh, "self_consumption_kwh"),
        "export_kwh": _decimal(result.export_kwh, "export_kwh"),
        "import_kwh": _decimal(result.import_kwh, "import_kwh"),
        "generator_compensation_kwh": _decimal(result.generator_compensation_kwh, "generator_compensation_kwh"),
        "distributable_balance_kwh": _decimal(result.distributable_balance_kwh, "distributable_balance_kwh"),
        "allocations": [_allocation(item, f"allocations[{index}]") for index, item in enumerate(result.allocations)],
        "quality": {"status": result.quality.status, "warnings": list(result.quality.warnings)},
    }
