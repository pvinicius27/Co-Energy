"""Explicit public serializer for the projected cycle cost contract."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from .cycle_cost_estimate import CycleCostEstimate


class CycleCostEstimateSerializationError(ValueError):
    """Raised when a cycle cost estimate cannot be serialized safely."""


def _decimal(value: Any, field: str) -> str | None:
    """Serialize as string: dinheiro e tarifa nao sobrevivem a um float JSON."""
    if value is None:
        return None
    if not isinstance(value, Decimal) or not value.is_finite() or value < 0:
        raise CycleCostEstimateSerializationError(
            f"{field} must be a non-negative finite Decimal or None"
        )
    text = format(value, "f")
    return text


def serialize_cycle_cost_estimate(result: CycleCostEstimate) -> dict[str, Any]:
    """Serialize through an explicit allowlist; the domain owns every value."""
    if not isinstance(result, CycleCostEstimate):
        raise CycleCostEstimateSerializationError(
            "result must be a CycleCostEstimate"
        )
    if result.classification != "projected":
        raise CycleCostEstimateSerializationError("classification must be 'projected'")
    return {
        "unit_id": result.unit_id,
        "billing_reference": result.billing_reference,
        "currency": result.currency,
        "classification": result.classification,
        "connection_type": result.connection_type,
        "energy": {
            "forecast_consumption_kwh": _decimal(
                result.forecast_consumption_kwh, "forecast_consumption_kwh"
            ),
            "compensated_kwh": _decimal(result.compensated_kwh, "compensated_kwh"),
            "minimum_billable_kwh": _decimal(
                result.minimum_billable_kwh, "minimum_billable_kwh"
            ),
            "billable_kwh": _decimal(result.billable_kwh, "billable_kwh"),
            "availability_floor_applied": result.availability_floor_applied,
        },
        "money": {
            "tariff_with_taxes": _decimal(
                result.tariff_with_taxes, "tariff_with_taxes"
            ),
            "tariff_source": result.tariff_source,
            "energy_amount": _decimal(result.energy_amount, "energy_amount"),
            "cip_cosip_amount": _decimal(
                result.cip_cosip_amount, "cip_cosip_amount"
            ),
            "total_amount": _decimal(result.total_amount, "total_amount"),
        },
        "warnings": list(result.warnings),
    }
