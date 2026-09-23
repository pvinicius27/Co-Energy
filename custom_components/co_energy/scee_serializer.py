"""Explicit public serialization for official SCEE billing data."""

from __future__ import annotations

from datetime import date, datetime
import math
from typing import Any

from .scee import OfficialSceeRecord


class SceeSerializationError(ValueError):
    """Raised when official SCEE data cannot be serialized safely."""


def _required_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise SceeSerializationError(f"{field} must be a non-empty string")
    return value


def _optional_string(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise SceeSerializationError(
            f"{field} must be a non-empty string or None"
        )
    return value


def _optional_literal_string(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise SceeSerializationError(f"{field} must be a string or None")
    return value


def _optional_date(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, date) or isinstance(value, datetime):
        raise SceeSerializationError(f"{field} must be a date or None")
    return value.isoformat()


def _required_bool(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        raise SceeSerializationError(f"{field} must be a boolean")
    return value


def _optional_number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SceeSerializationError(f"{field} must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized) or normalized < 0:
        raise SceeSerializationError(
            f"{field} must be finite and non-negative"
        )
    return normalized


def _optional_percent(value: Any) -> float | None:
    normalized = _optional_number(value, "record.distribution_percent")
    if normalized is not None and normalized > 100:
        raise SceeSerializationError(
            "record.distribution_percent must be between 0 and 100"
        )
    return normalized


def _alerts(value: Any) -> list[str]:
    if not isinstance(value, tuple):
        raise SceeSerializationError("record.extraction_alerts must be a tuple")
    if any(not isinstance(item, str) for item in value):
        raise SceeSerializationError(
            "every record.extraction_alerts item must be a string"
        )
    return list(value)


def serialize_official_scee_record(
    record: OfficialSceeRecord,
) -> dict[str, object]:
    """Serialize one official SCEE record through an explicit allowlist."""
    if not isinstance(record, OfficialSceeRecord):
        raise SceeSerializationError("record must be an OfficialSceeRecord")
    return {
        "unit_id": _required_string(record.unit_id, "record.unit_id"),
        "billing_reference": _required_string(
            record.billing_reference, "record.billing_reference"
        ),
        "period": {
            "start": _optional_date(record.period_start, "record.period_start"),
            "end": _optional_date(record.period_end, "record.period_end"),
        },
        "extraction": {
            "status": _optional_string(
                record.extraction_status, "record.extraction_status"
            ),
            "alerts": _alerts(record.extraction_alerts),
        },
        "official": {
            "applicable": _required_bool(
                record.applicable, "record.applicable"
            ),
            "consumption_total_kwh": _optional_number(
                record.consumption_total_kwh,
                "record.consumption_total_kwh",
            ),
            "consumption_scee_kwh": _optional_number(
                record.consumption_scee_kwh,
                "record.consumption_scee_kwh",
            ),
            "energy_compensated_kwh": _optional_number(
                record.energy_compensated_kwh,
                "record.energy_compensated_kwh",
            ),
            "non_compensated_consumption_kwh": _optional_number(
                record.non_compensated_consumption_kwh,
                "record.non_compensated_consumption_kwh",
            ),
            "scee_cycle": _optional_literal_string(
                record.scee_cycle, "record.scee_cycle"
            ),
            "cycle_generation_kwh": _optional_number(
                record.cycle_generation_kwh, "record.cycle_generation_kwh"
            ),
            "credit_received_kwh": _optional_number(
                record.credit_received_kwh, "record.credit_received_kwh"
            ),
            "excess_received_kwh": _optional_number(
                record.excess_received_kwh, "record.excess_received_kwh"
            ),
            "balance_kwh": _optional_number(
                record.balance_kwh, "record.balance_kwh"
            ),
            "balance_expiring_30_days_kwh": _optional_number(
                record.balance_expiring_30_days_kwh,
                "record.balance_expiring_30_days_kwh",
            ),
            "balance_expiring_60_days_kwh": _optional_number(
                record.balance_expiring_60_days_kwh,
                "record.balance_expiring_60_days_kwh",
            ),
            "distribution_percent": _optional_percent(
                record.distribution_percent
            ),
        },
    }
