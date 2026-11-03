"""Explicit public serializer for the daily energy balance contract."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
import math
from typing import Any

from .daily_energy_balance import DailyEnergyBalance


class DailyEnergyBalanceSerializationError(ValueError):
    """Raised when a daily energy balance cannot be serialized safely."""


def _energy(value: Any, field: str, *, allow_negative: bool = False) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise DailyEnergyBalanceSerializationError(f"{field} must be numeric or None")
    numeric = float(value)
    if not math.isfinite(numeric):
        raise DailyEnergyBalanceSerializationError(f"{field} must be finite")
    if not allow_negative and numeric < 0:
        raise DailyEnergyBalanceSerializationError(f"{field} must not be negative")
    return numeric


def _share(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, Decimal) or not value.is_finite() or value < 0:
        raise DailyEnergyBalanceSerializationError(
            f"{field} must be a non-negative finite Decimal or None"
        )
    return format(value, "f")


def _instant(value: Any, field: str) -> str:
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise DailyEnergyBalanceSerializationError(
            f"{field} must be an aware datetime"
        )
    return value.isoformat()


def serialize_daily_energy_balance(result: DailyEnergyBalance) -> dict[str, Any]:
    """Serialize through an explicit allowlist; the domain owns every value."""
    if not isinstance(result, DailyEnergyBalance):
        raise DailyEnergyBalanceSerializationError(
            "result must be a DailyEnergyBalance"
        )
    if result.classification != "estimated":
        raise DailyEnergyBalanceSerializationError(
            "classification must be 'estimated'"
        )
    return {
        "unit_id": result.unit_id,
        "classification": result.classification,
        "period": {
            "start": _instant(result.day_start, "day_start"),
            "end": _instant(result.day_end, "day_end"),
        },
        "energy": {
            "consumed_kwh": _energy(result.consumed_kwh, "consumed_kwh"),
            "received_kwh": _energy(result.received_kwh, "received_kwh"),
            # O saldo e o unico que aceita negativo: e o que significa um dia
            # em que o consumo superou o credito rateado.
            "balance_kwh": _energy(
                result.balance_kwh, "balance_kwh", allow_negative=True
            ),
            "distributable_kwh": _energy(
                result.distributable_kwh, "distributable_kwh"
            ),
            # Do gerador, nao da unidade: e o que produziu o credito do dia.
            "generator_generation_kwh": _energy(
                result.generator_generation_kwh, "generator_generation_kwh"
            ),
            "generator_export_kwh": _energy(
                result.generator_export_kwh, "generator_export_kwh"
            ),
        },
        "share_percent": _share(result.share_percent, "share_percent"),
        "warnings": list(result.warnings),
    }
