"""Explicit public serialization for unit audit results."""

from __future__ import annotations

from datetime import date, datetime
import math
from typing import Any

from .billing_cycle import BillingOnlyCyclePeriod, BillingReadingDiagnostic
from .energy_period import EnergyIssueCount
from .periods import Period
from .logical_series import ISSUE_REASONS
from .unit_audit_result import (
    AuditBillingQuality,
    AuditIssueEvent,
    UnitAuditEntry,
    UnitAuditResult,
)


class AuditSerializationError(ValueError):
    """Raised when an audit result cannot be serialized safely."""


_STATUSES = {"ok", "attention", "incomplete", "unavailable", "not_applicable"}
_COMPARISON_STATUSES = {"ok", "attention", "unavailable", "not_applicable"}


def _string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise AuditSerializationError(f"{field} must be a non-empty string")
    return value


def _number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise AuditSerializationError(f"{field} must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized):
        raise AuditSerializationError(f"{field} must be finite")
    return normalized


def _status(value: Any, field: str) -> str:
    if value not in _STATUSES:
        raise AuditSerializationError(f"{field} is invalid")
    return value


def _comparison_status(value: Any, field: str) -> str:
    if value not in _COMPARISON_STATUSES:
        raise AuditSerializationError(f"{field} is invalid")
    return value


def _explanations(value: Any, field: str) -> list[str]:
    if not isinstance(value, tuple):
        raise AuditSerializationError(f"{field} must be a tuple")
    return [_string(item, f"{field}[{index}]") for index, item in enumerate(value)]


def _period(value: Any, field: str) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, Period):
        raise AuditSerializationError(f"{field} must be a Period or None")
    timezone_name = getattr(value.start.tzinfo, "key", None) or str(value.start.tzinfo)
    return {
        "mode": value.mode,
        "reference": value.reference,
        "start": _datetime(value.start, f"{field}.start"),
        "end": _datetime(value.end, f"{field}.end"),
        "timezone": timezone_name,
    }


def _datetime(value: Any, field: str) -> str:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise AuditSerializationError(f"{field} must be timezone-aware")
    return value.isoformat()


def _issue_count(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, EnergyIssueCount):
        raise AuditSerializationError(f"{field} must be an EnergyIssueCount")
    return {"reason": value.reason, "count": value.count}


def _issue_event(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, AuditIssueEvent):
        raise AuditSerializationError(f"{field} must be an AuditIssueEvent")
    reason = _string(value.reason, f"{field}.reason")
    if reason not in ISSUE_REASONS:
        raise AuditSerializationError(f"{field}.reason is invalid")
    if value.start >= value.end:
        raise AuditSerializationError(f"{field} interval is invalid")
    source_label = value.source_label
    if source_label is not None:
        source_label = _string(source_label, f"{field}.source_label")
    return {
        "reason": reason,
        "start": _datetime(value.start, f"{field}.start"),
        "end": _datetime(value.end, f"{field}.end"),
        "source_entity_id": _string(
            value.source_entity_id, f"{field}.source_entity_id"
        ),
        "source_label": source_label,
        "value": _number(value.value, f"{field}.value"),
    }


def _entry(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, UnitAuditEntry):
        raise AuditSerializationError(f"{field} must be a UnitAuditEntry")
    if not isinstance(value.within_tolerance, (bool, type(None))):
        raise AuditSerializationError(f"{field}.within_tolerance is invalid")
    if isinstance(value.issue_count, bool) or not isinstance(value.issue_count, int) or value.issue_count < 0:
        raise AuditSerializationError(f"{field}.issue_count is invalid")
    if not isinstance(value.issue_counts, tuple):
        raise AuditSerializationError(f"{field}.issue_counts must be a tuple")
    if not isinstance(value.issue_events, tuple):
        raise AuditSerializationError(f"{field}.issue_events must be a tuple")
    return {
        "metric": _string(value.metric, f"{field}.metric"),
        "label": _string(value.label, f"{field}.label"),
        "unit": _string(value.unit, f"{field}.unit"),
        "official_value": _number(value.official_value, f"{field}.official_value"),
        "measured_value": _number(value.measured_value, f"{field}.measured_value"),
        "deviation": _number(value.deviation, f"{field}.deviation"),
        "deviation_percent": _number(value.deviation_percent, f"{field}.deviation_percent"),
        "tolerance_percent": _number(value.tolerance_percent, f"{field}.tolerance_percent"),
        "within_tolerance": value.within_tolerance,
        "issue_count": value.issue_count,
        "issue_counts": [
            _issue_count(item, f"{field}.issue_counts[{index}]")
            for index, item in enumerate(value.issue_counts)
        ],
        "issue_events": [
            _issue_event(item, f"{field}.issue_events[{index}]")
            for index, item in enumerate(value.issue_events)
        ],
        "status": _status(value.status, f"{field}.status"),
        "comparison_status": _comparison_status(
            value.comparison_status, f"{field}.comparison_status"
        ),
        "explanations": _explanations(value.explanations, f"{field}.explanations"),
    }


def _civil_period(value: Any, field: str) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, BillingOnlyCyclePeriod):
        raise AuditSerializationError(f"{field} is invalid")
    if (
        not isinstance(value.start, date)
        or isinstance(value.start, datetime)
        or not isinstance(value.end, date)
        or isinstance(value.end, datetime)
        or value.start >= value.end
    ):
        raise AuditSerializationError(f"{field} dates are invalid")
    return {
        "start": value.start.isoformat(),
        "end": value.end.isoformat(),
        "start_source": _string(value.start_source, f"{field}.start_source"),
    }


def _diagnostic(value: Any, field: str) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, BillingReadingDiagnostic):
        raise AuditSerializationError(f"{field} is invalid")
    if value.classification not in ("compatible", "possible_estimate", "unknown"):
        raise AuditSerializationError(f"{field}.classification is invalid")
    if value.reported_previous is not None and (
        not isinstance(value.reported_previous, date)
        or isinstance(value.reported_previous, datetime)
    ):
        raise AuditSerializationError(f"{field}.reported_previous is invalid")
    for name in ("reading_days", "cycle_days"):
        count = getattr(value, name)
        if count is not None and (
            isinstance(count, bool) or not isinstance(count, int) or count <= 0
        ):
            raise AuditSerializationError(f"{field}.{name} is invalid")
    if not isinstance(value.reading_days_match, (bool, type(None))):
        raise AuditSerializationError(f"{field}.reading_days_match is invalid")
    return {
        "classification": value.classification,
        "reported_previous": (
            value.reported_previous.isoformat()
            if value.reported_previous is not None
            else None
        ),
        "reading_days": value.reading_days,
        "cycle_days": value.cycle_days,
        "reading_days_match": value.reading_days_match,
    }


def _billing_quality(value: Any, field: str) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, AuditBillingQuality):
        raise AuditSerializationError(f"{field} must be AuditBillingQuality or None")
    if value.billing_method is not None:
        _string(value.billing_method, f"{field}.billing_method")
    return {
        "billing_method": value.billing_method,
        "billing_cycle_period": _civil_period(
            value.billing_cycle_period, f"{field}.billing_cycle_period"
        ),
        "billing_reading_diagnostic": _diagnostic(
            value.billing_reading_diagnostic,
            f"{field}.billing_reading_diagnostic",
        ),
    }


def serialize_audit(result: UnitAuditResult) -> dict[str, Any]:
    """Serialize one audit result into its explicit public contract."""
    if not isinstance(result, UnitAuditResult):
        raise AuditSerializationError("result must be a UnitAuditResult")
    if not isinstance(result.entries, tuple):
        raise AuditSerializationError("result.entries must be a tuple")
    return {
        "unit_id": _string(result.unit_id, "result.unit_id"),
        "billing_reference": _string(
            result.billing_reference, "result.billing_reference"
        ),
        "period": _period(result.period, "result.period"),
        "status": _status(result.status, "result.status"),
        "comparison_status": _comparison_status(
            result.comparison_status, "result.comparison_status"
        ),
        "entries": [
            _entry(item, f"result.entries[{index}]")
            for index, item in enumerate(result.entries)
        ],
        "explanations": _explanations(result.explanations, "result.explanations"),
        "billing_quality": _billing_quality(
            result.billing_quality, "result.billing_quality"
        ),
    }
