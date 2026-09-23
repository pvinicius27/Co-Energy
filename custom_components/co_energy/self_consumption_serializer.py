"""Explicit public serialization for physical self-consumption data."""

from __future__ import annotations

from datetime import datetime
import math
from typing import Any

from .self_consumption import SelfConsumptionResult


class SelfConsumptionSerializationError(ValueError):
    """Raised when a SelfConsumptionResult cannot be serialized safely."""


_ALLOWED_STATUSES = frozenset(("confirmed", "partial", "unavailable"))


def _required_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise SelfConsumptionSerializationError(
            f"{field} must be a non-empty string"
        )
    return value


def _status(value: Any, field: str) -> str:
    text = _required_string(value, field)
    if text not in _ALLOWED_STATUSES:
        raise SelfConsumptionSerializationError(
            f"{field} must be one of {sorted(_ALLOWED_STATUSES)}"
        )
    return text


def _optional_datetime_iso(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, datetime):
        raise SelfConsumptionSerializationError(
            f"{field} must be a datetime or None"
        )
    return value.isoformat()


def _optional_energy(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SelfConsumptionSerializationError(
            f"{field} must be numeric or None"
        )
    normalized = float(value)
    if not math.isfinite(normalized) or normalized < 0:
        raise SelfConsumptionSerializationError(
            f"{field} must be finite and non-negative"
        )
    return normalized


def _optional_ratio(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SelfConsumptionSerializationError(
            f"{field} must be numeric or None"
        )
    normalized = float(value)
    if not math.isfinite(normalized) or not 0 <= normalized <= 1:
        raise SelfConsumptionSerializationError(
            f"{field} must be a ratio between 0 and 1, or None"
        )
    return normalized


def _required_bool(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        raise SelfConsumptionSerializationError(
            f"{field} must be a boolean"
        )
    return value


def _string_list(value: Any, field: str) -> list[str]:
    if not isinstance(value, tuple):
        raise SelfConsumptionSerializationError(
            f"{field} must be a tuple"
        )
    if any(not isinstance(item, str) for item in value):
        raise SelfConsumptionSerializationError(
            f"every {field} item must be a string"
        )
    return list(value)


def serialize_self_consumption_result(
    result: SelfConsumptionResult,
) -> dict[str, object]:
    """Serialize one SelfConsumptionResult through an explicit allowlist.

    The serializer does not recalculate, reclassify, or estimate any value.
    It transforms the validated domain object into a stable public structure
    ready for future WebSocket/API exposure.
    """
    if not isinstance(result, SelfConsumptionResult):
        raise SelfConsumptionSerializationError(
            "result must be a SelfConsumptionResult"
        )
    return {
        "unit_id": _required_string(result.unit_id, "result.unit_id"),
        "billing_reference": _required_string(
            result.billing_reference, "result.billing_reference"
        ),
        "period": {
            "from": _optional_datetime_iso(
                result.period_from, "result.period_from"
            ),
            "until": _optional_datetime_iso(
                result.period_until, "result.period_until"
            ),
        },
        "status": _status(result.status, "result.status"),
        "energy": {
            "generation_kwh": _optional_energy(
                result.generation_kwh, "result.generation_kwh"
            ),
            "export_kwh": _optional_energy(
                result.export_kwh, "result.export_kwh"
            ),
            "import_kwh": _optional_energy(
                result.import_kwh, "result.import_kwh"
            ),
            "self_consumption_kwh": _optional_energy(
                result.self_consumption_kwh, "result.self_consumption_kwh"
            ),
        },
        "quality": {
            "coverage_complete": _required_bool(
                result.coverage_complete, "result.coverage_complete"
            ),
            "generation": {
                "coverage_ratio": _optional_ratio(
                    result.generation_coverage_ratio,
                    "result.generation_coverage_ratio",
                ),
                "acceptance_ratio": _optional_ratio(
                    result.generation_acceptance_ratio,
                    "result.generation_acceptance_ratio",
                ),
            },
            "export": {
                "coverage_ratio": _optional_ratio(
                    result.export_coverage_ratio,
                    "result.export_coverage_ratio",
                ),
                "acceptance_ratio": _optional_ratio(
                    result.export_acceptance_ratio,
                    "result.export_acceptance_ratio",
                ),
            },
            "import": {
                "coverage_ratio": _optional_ratio(
                    result.import_coverage_ratio,
                    "result.import_coverage_ratio",
                ),
                "acceptance_ratio": _optional_ratio(
                    result.import_acceptance_ratio,
                    "result.import_acceptance_ratio",
                ),
            },
        },
        "blockers": _string_list(result.blockers, "result.blockers"),
        "warnings": _string_list(result.warnings, "result.warnings"),
    }

