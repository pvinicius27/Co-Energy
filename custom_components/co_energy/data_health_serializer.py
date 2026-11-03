"""Explicit public serializer for the data health contract."""

from __future__ import annotations

from datetime import date, datetime
import math
from typing import Any

from .data_health import (
    CoverageGap,
    CycleCoverage,
    DataHealthFinding,
    DataHealthResult,
    InvoiceHealth,
    SensorHealth,
    SeriesCoverage,
    SeriesSources,
    SourceHealth,
    UnitDataHealth,
)


class DataHealthSerializationError(ValueError):
    """Raised when a data health report cannot be serialized safely."""


_SEVERITIES = frozenset({"critical", "attention", "info"})
_UNIT_STATUSES = frozenset({"ok", "attention", "critical"})
_SENSOR_STATUSES = frozenset({"ok", "unavailable", "missing", "invalid"})
_SENSOR_KINDS = frozenset({"series", "measurement"})
_COVERAGE_STATUSES = frozenset({"complete", "gaps", "unavailable", "empty"})
_CYCLE_STATUSES = frozenset({"provisional", "open"})
_INVOICE_STATUSES = frozenset({"awaiting", "late"})


def _instant(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise DataHealthSerializationError("instants must be aware datetimes")
    return value.isoformat()


def _date(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime) or not isinstance(value, date):
        raise DataHealthSerializationError("dates must be dates")
    return value.isoformat()


def _choice(value: Any, allowed: frozenset[str], field: str) -> str:
    if value not in allowed:
        raise DataHealthSerializationError(f"invalid {field}")
    return value


def _optional_int(value: Any, field: str) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise DataHealthSerializationError(f"{field} must be an integer")
    return value


def _optional_number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise DataHealthSerializationError(f"{field} must be numeric")
    if not math.isfinite(float(value)):
        raise DataHealthSerializationError(f"{field} must be finite")
    return float(value)


def _finding(value: DataHealthFinding) -> dict[str, Any]:
    if not isinstance(value, DataHealthFinding):
        raise DataHealthSerializationError("invalid finding")
    return {
        "severity": _choice(value.severity, _SEVERITIES, "finding severity"),
        "code": value.code,
        "logical_id": value.logical_id,
        "label": value.label,
        "reference": value.reference,
        "count": _optional_int(value.count, "finding count"),
        "hours": _optional_int(value.hours, "finding hours"),
        "days": _optional_int(value.days, "finding days"),
        "start": _instant(value.start),
        "end": _instant(value.end),
        "reason": value.reason,
        "published": value.published,
        "declared": value.declared,
    }


def _sensor(value: SensorHealth) -> dict[str, Any]:
    if not isinstance(value, SensorHealth):
        raise DataHealthSerializationError("invalid sensor")
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "kind": _choice(value.kind, _SENSOR_KINDS, "sensor kind"),
        # Aqui o entity_id e informacao de manutencao: e por ele que se acha o
        # sensor no Home Assistant quando o medidor precisa ser reconfigurado.
        "entity_id": value.entity_id,
        "source_label": value.source_label,
        "status": _choice(value.status, _SENSOR_STATUSES, "sensor status"),
        "raw_state": value.raw_state,
        "unit": value.unit,
        "last_changed": _instant(value.last_changed),
        "last_updated": _instant(value.last_updated),
        "last_reported": _instant(value.last_reported),
    }


def _source(value: SourceHealth) -> dict[str, Any]:
    if not isinstance(value, SourceHealth):
        raise DataHealthSerializationError("invalid source")
    return {
        "entity_id": value.entity_id,
        "label": value.label,
        "start": _instant(value.start),
        "end": _instant(value.end),
        "active": bool(value.active),
        "skip_first_change": bool(value.skip_first_change),
    }


def _series_sources(value: SeriesSources) -> dict[str, Any]:
    if not isinstance(value, SeriesSources):
        raise DataHealthSerializationError("invalid series sources")
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "sources": [_source(item) for item in value.sources],
    }


def _gap(value: CoverageGap) -> dict[str, Any]:
    if not isinstance(value, CoverageGap):
        raise DataHealthSerializationError("invalid gap")
    return {
        "start": _instant(value.start),
        "end": _instant(value.end),
        "hours": _optional_int(value.hours, "gap hours"),
        "source_label": value.source_label,
        "next_hour_value": _optional_number(value.next_hour_value, "next hour value"),
    }


def _series_coverage(value: SeriesCoverage) -> dict[str, Any]:
    if not isinstance(value, SeriesCoverage):
        raise DataHealthSerializationError("invalid series coverage")
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "unit": value.unit,
        "status": _choice(value.status, _COVERAGE_STATUSES, "coverage status"),
        "expected_hours": _optional_int(value.expected_hours, "expected hours"),
        "observed_hours": _optional_int(value.observed_hours, "observed hours"),
        "gaps": [_gap(item) for item in value.gaps],
        "issue_counts": {
            reason: _optional_int(count, "issue count")
            for reason, count in value.issue_counts
        },
    }


def _cycle(value: CycleCoverage) -> dict[str, Any]:
    if not isinstance(value, CycleCoverage):
        raise DataHealthSerializationError("invalid cycle coverage")
    return {
        "status": _choice(value.status, _CYCLE_STATUSES, "cycle status"),
        "reference": value.reference,
        "start": _instant(value.start),
        "end": _instant(value.end),
        "evaluated_until": _instant(value.evaluated_until),
        "series": [_series_coverage(item) for item in value.series],
    }


def _invoice(value: InvoiceHealth) -> dict[str, Any]:
    if not isinstance(value, InvoiceHealth):
        raise DataHealthSerializationError("invalid invoice health")
    if value.invoice_status is not None:
        _choice(value.invoice_status, _INVOICE_STATUSES, "invoice status")
    return {
        "available": bool(value.available),
        "latest_reference": value.latest_reference,
        "latest_reading": _date(value.latest_reading),
        "published_tariff": value.published_tariff,
        "next_reading": _date(value.next_reading),
        "extraction_status": value.extraction_status,
        "extraction_alerts": [str(item) for item in value.extraction_alerts],
        "awaiting_reference": value.awaiting_reference,
        "awaiting_since": _instant(value.awaiting_since),
        "invoice_status": value.invoice_status,
        "waiting_days": _optional_int(value.waiting_days, "waiting days"),
    }


def _unit(value: UnitDataHealth) -> dict[str, Any]:
    if not isinstance(value, UnitDataHealth):
        raise DataHealthSerializationError("invalid unit health")
    return {
        "unit_id": value.unit_id,
        "name": value.name,
        "measured": bool(value.measured),
        "status": _choice(value.status, _UNIT_STATUSES, "unit status"),
        "meter_last_report": _instant(value.meter_last_report),
        "findings": [_finding(item) for item in value.findings],
        "sensors": [_sensor(item) for item in value.sensors],
        "sources": [_series_sources(item) for item in value.sources],
        "coverage": [_cycle(item) for item in value.coverage],
        "invoice": _invoice(value.invoice),
    }


def serialize_data_health(result: DataHealthResult) -> dict[str, Any]:
    """Serialize the data health report through an explicit allowlist."""
    if not isinstance(result, DataHealthResult):
        raise DataHealthSerializationError("invalid data health result")
    return {
        "generated_at": _instant(result.generated_at),
        "meter_silent_after_minutes": _optional_int(
            result.meter_silent_after_minutes, "meter silent after"
        ),
        "invoice_late_after_days": _optional_int(
            result.invoice_late_after_days, "invoice late after"
        ),
        "billing_available": bool(result.billing_available),
        "units": [_unit(item) for item in result.units],
    }
