"""Explicit public serialization for closed billing cycles."""

from __future__ import annotations

from datetime import date, datetime
import math
from typing import Any

from .billing_cycle import (
    BillingCycle,
    BillingOnlyCyclePeriod,
    BillingReadingDiagnostic,
)
from .periods import Period


class CycleCatalogSerializationError(ValueError):
    """Raised when a closed-cycle catalog cannot be serialized safely."""


def _datetime(value: Any, field: str) -> str:
    if not isinstance(value, datetime) or value.tzinfo is None or value.utcoffset() is None:
        raise CycleCatalogSerializationError(f"{field} must be timezone-aware")
    return value.isoformat()


def _period(period: Any, field: str) -> dict[str, Any] | None:
    if period is None:
        return None
    if not isinstance(period, Period):
        raise CycleCatalogSerializationError(f"{field} must be a Period")
    timezone_name = getattr(period.start.tzinfo, "key", None) or str(period.start.tzinfo)
    return {
        "mode": period.mode,
        "reference": period.reference,
        "start": _datetime(period.start, f"{field}.start"),
        "end": _datetime(period.end, f"{field}.end"),
        "timezone": timezone_name,
    }


def _date(value: Any, field: str) -> str:
    if not isinstance(value, date) or isinstance(value, datetime):
        raise CycleCatalogSerializationError(f"{field} must be a date")
    return value.isoformat()


def _billing_cycle_period(value: Any, field: str) -> dict[str, str] | None:
    if value is None:
        return None
    if not isinstance(value, BillingOnlyCyclePeriod):
        raise CycleCatalogSerializationError(
            f"{field} must be a BillingOnlyCyclePeriod"
        )
    if value.start_source not in ("previous_current", "reading_days"):
        raise CycleCatalogSerializationError(f"{field}.start_source is invalid")
    start = _date(value.start, f"{field}.start")
    end = _date(value.end, f"{field}.end")
    if value.start >= value.end:
        raise CycleCatalogSerializationError(f"{field} must have start before end")
    return {
        "start": start,
        "end": end,
        "start_source": value.start_source,
    }


def _billing_reading_diagnostic(value: Any, field: str) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, BillingReadingDiagnostic):
        raise CycleCatalogSerializationError(
            f"{field} must be a BillingReadingDiagnostic"
        )
    if value.classification not in ("compatible", "possible_estimate", "unknown"):
        raise CycleCatalogSerializationError(f"{field}.classification is invalid")
    for name in ("reading_days", "cycle_days"):
        item = getattr(value, name)
        if item is not None and (isinstance(item, bool) or not isinstance(item, int) or item <= 0):
            raise CycleCatalogSerializationError(f"{field}.{name} is invalid")
    if value.reading_days_match is not None and not isinstance(
        value.reading_days_match, bool
    ):
        raise CycleCatalogSerializationError(f"{field}.reading_days_match is invalid")
    return {
        "classification": value.classification,
        "reported_previous": (
            _date(value.reported_previous, f"{field}.reported_previous")
            if value.reported_previous is not None
            else None
        ),
        "reading_days": value.reading_days,
        "cycle_days": value.cycle_days,
        "reading_days_match": value.reading_days_match,
    }


def serialize_cycle_catalog(
    unit_id: str,
    cycles: tuple[BillingCycle, ...],
) -> dict[str, Any]:
    """Serialize one unit's closed-cycle catalog."""
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise CycleCatalogSerializationError("unit_id must be a non-empty string")
    if not isinstance(cycles, tuple):
        raise CycleCatalogSerializationError("cycles must be a tuple")
    serialized = []
    for index, cycle in enumerate(cycles):
        if not isinstance(cycle, BillingCycle):
            raise CycleCatalogSerializationError(
                f"cycles[{index}] must be a BillingCycle"
            )
        if cycle.status not in ("closed", "provisional", "open"):
            raise CycleCatalogSerializationError(f"cycles[{index}].status is invalid")
        if cycle.status in ("open", "provisional") and cycle.period is None:
            raise CycleCatalogSerializationError(
                f"cycles[{index}].period is required for an operational cycle"
            )
        if cycle.status == "closed" and (
            not isinstance(cycle.billing_reference, str)
            or not cycle.billing_reference.strip()
        ):
            raise CycleCatalogSerializationError(
                f"cycles[{index}].billing_reference is invalid"
            )
        if cycle.status != "closed" and cycle.billing_reference is not None:
            raise CycleCatalogSerializationError(
                f"cycles[{index}].billing_reference is invalid"
            )
        predicted_reference = cycle.predicted_reference
        if predicted_reference is not None and (
            not isinstance(predicted_reference, str)
            or not predicted_reference.strip()
        ):
            raise CycleCatalogSerializationError(
                f"cycles[{index}].predicted_reference is invalid"
            )
        if cycle.status == "provisional" and predicted_reference is None:
            raise CycleCatalogSerializationError(
                f"cycles[{index}].predicted_reference is required"
            )
        if cycle.capability not in ("operational_history", "billing_only"):
            raise CycleCatalogSerializationError(
                f"cycles[{index}].capability is invalid"
            )
        if cycle.capability == "billing_only" and cycle.status != "closed":
            raise CycleCatalogSerializationError(
                f"cycles[{index}] billing_only cycle must be closed"
            )
        if cycle.capability == "operational_history" and (
            cycle.billing_cycle_period is not None
            or cycle.billing_reading_diagnostic is not None
            or cycle.billing_method is not None
        ):
            raise CycleCatalogSerializationError(
                f"cycles[{index}] operational cycle cannot have billing-only metadata"
            )
        if cycle.billing_method is not None and (
            not isinstance(cycle.billing_method, str)
            or not cycle.billing_method.strip()
        ):
            raise CycleCatalogSerializationError(
                f"cycles[{index}].billing_method must be a non-empty string or None"
            )
        invoice_status = cycle.invoice_status
        if invoice_status not in (None, "awaiting", "late"):
            raise CycleCatalogSerializationError(
                f"cycles[{index}].invoice_status is invalid"
            )
        if invoice_status is not None and cycle.status != "provisional":
            raise CycleCatalogSerializationError(
                f"cycles[{index}].invoice_status is only valid for a provisional cycle"
            )
        if not isinstance(cycle.history_available, bool):
            raise CycleCatalogSerializationError(
                f"cycles[{index}].history_available must be a boolean"
            )
        value = cycle.official_consumption
        if value is not None and (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            raise CycleCatalogSerializationError(
                f"cycles[{index}].official_consumption must be finite or None"
            )
        serialized.append(
            {
                "cycle_id": cycle.cycle_id,
                "billing_reference": cycle.billing_reference,
                "predicted_reference": predicted_reference,
                "status": cycle.status,
                "capability": cycle.capability,
                "history_available": cycle.history_available,
                "period": _period(cycle.period, f"cycles[{index}].period"),
                "billing_cycle_period": _billing_cycle_period(
                    cycle.billing_cycle_period,
                    f"cycles[{index}].billing_cycle_period",
                ),
                "billing_reading_diagnostic": _billing_reading_diagnostic(
                    cycle.billing_reading_diagnostic,
                    f"cycles[{index}].billing_reading_diagnostic",
                ),
                "billing_method": cycle.billing_method,
                "expected_end": (
                    _datetime(cycle.expected_end, f"cycles[{index}].expected_end")
                    if cycle.expected_end is not None
                    else None
                ),
                "invoice_status": invoice_status,
                "official_consumption": {
                    "value": value,
                    "unit": "kWh",
                    "classification": "official" if value is not None else "unavailable",
                },
            }
        )
    return {"unit_id": unit_id, "cycles": serialized}
