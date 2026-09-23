"""Explicit public serialization for the minimal unit overview."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from .billing import BillingRecord
from .billing_cycle import BillingCycleContext
from .energy_period import EnergyIssueCount
from .logical_state import LogicalStateResult
from .periods import Period
from .quality_evidence import (
    BillingEvidence,
    EnergyMetricEvidence,
    MeasurementEvidence,
    UnitQualityEvidence,
)
from .unit_cycle_energy import UnitCycleEnergyContext
from .unit_energy_summary import UnitEnergyMetricResult, UnitEnergySummary
from .unit_overview import UnitOverview
from .unit_prediction_summary import UnitPredictionSummary
from .unit_snapshot import UnitSnapshot


class UnitOverviewSerializationError(ValueError):
    """Raised when a unit overview cannot be serialized safely."""


def _require_type(value: Any, expected: type, field: str) -> None:
    if not isinstance(value, expected):
        raise UnitOverviewSerializationError(
            f"{field} must be a {expected.__name__}"
        )


def _serialize_datetime(value: Any, field: str) -> str:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise UnitOverviewSerializationError(
            f"{field} must be a timezone-aware datetime"
        )
    return value.isoformat()


def _serialize_optional_datetime(value: Any, field: str) -> str | None:
    return None if value is None else _serialize_datetime(value, field)


def _serialize_date(value: Any, field: str) -> str:
    if not isinstance(value, date) or isinstance(value, datetime):
        raise UnitOverviewSerializationError(f"{field} must be a date")
    return value.isoformat()


def _serialize_optional_date(value: Any, field: str) -> str | None:
    return None if value is None else _serialize_date(value, field)


def _serialize_period(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, Period, field)
    return {
        "start": _serialize_datetime(value.start, f"{field}.start"),
        "end": _serialize_datetime(value.end, f"{field}.end"),
        "mode": value.mode,
        "reference": value.reference,
    }


def _serialize_optional_period(value: Any, field: str) -> dict[str, Any] | None:
    return None if value is None else _serialize_period(value, field)


def _serialize_logical_state(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, LogicalStateResult, field)
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "quantity": value.quantity,
        "unit": value.unit,
        "state_unit": value.state_unit,
        "value": value.value,
        "available": value.available,
        "last_changed": _serialize_optional_datetime(
            value.last_changed, f"{field}.last_changed"
        ),
        "last_updated": _serialize_optional_datetime(
            value.last_updated, f"{field}.last_updated"
        ),
        "validation_required": value.validation_required,
        "validation_note": value.validation_note,
        "unit_mismatch": value.unit_mismatch,
    }


def _serialize_billing_record(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, BillingRecord, field)
    if not isinstance(value.extraction_alerts, tuple):
        raise UnitOverviewSerializationError(
            f"{field}.extraction_alerts must be a tuple"
        )
    return {
        "unit_id": value.unit_id,
        "reference": value.reference,
        "reference_month": value.reference_month,
        "reference_year": value.reference_year,
        "due_date": _serialize_optional_date(value.due_date, f"{field}.due_date"),
        "reading_previous": _serialize_optional_date(
            value.reading_previous, f"{field}.reading_previous"
        ),
        "reading_current": _serialize_optional_date(
            value.reading_current, f"{field}.reading_current"
        ),
        "reading_days": value.reading_days,
        "next_reading": _serialize_optional_date(
            value.next_reading, f"{field}.next_reading"
        ),
        "total_amount": value.total_amount,
        "currency": value.currency,
        "consumption_kwh": value.consumption_kwh,
        "consumer_unit": value.consumer_unit,
        "extraction_status": value.extraction_status,
        "extraction_alerts": list(value.extraction_alerts),
        "meter_active_kwh": value.meter_active_kwh,
        "meter_generation_kwh": value.meter_generation_kwh,
    }


def _serialize_optional_billing_record(
    value: Any, field: str
) -> dict[str, Any] | None:
    return None if value is None else _serialize_billing_record(value, field)


def _serialize_snapshot(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, UnitSnapshot, field)
    if not isinstance(value.measurements, tuple):
        raise UnitOverviewSerializationError(f"{field}.measurements must be a tuple")
    return {
        "unit_id": value.unit_id,
        "name": value.name,
        "role": value.role,
        "measured": value.measured,
        "image": value.image,
        "measurements": [
            _serialize_logical_state(item, f"{field}.measurements[{index}]")
            for index, item in enumerate(value.measurements)
        ],
        "latest_bill": _serialize_optional_billing_record(
            value.latest_bill, f"{field}.latest_bill"
        ),
    }


def _serialize_billing_cycle(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, BillingCycleContext, field)
    return {
        "unit_id": value.unit_id,
        "status": value.status,
        "latest_bill": _serialize_optional_billing_record(
            value.latest_bill, f"{field}.latest_bill"
        ),
        "latest_closed_period": _serialize_optional_period(
            value.latest_closed_period, f"{field}.latest_closed_period"
        ),
        "current_start": _serialize_optional_datetime(
            value.current_start, f"{field}.current_start"
        ),
        "expected_next_reading": _serialize_optional_datetime(
            value.expected_next_reading, f"{field}.expected_next_reading"
        ),
        "current_elapsed_period": _serialize_optional_period(
            value.current_elapsed_period, f"{field}.current_elapsed_period"
        ),
        "waiting_bill_period": _serialize_optional_period(
            value.waiting_bill_period, f"{field}.waiting_bill_period"
        ),
    }


def _serialize_energy_issue_count(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, EnergyIssueCount, field)
    return {"reason": value.reason, "count": value.count}


def _serialize_issue_counts(value: Any, field: str) -> list[dict[str, Any]] | None:
    if value is None:
        return None
    if not isinstance(value, tuple):
        raise UnitOverviewSerializationError(f"{field} must be a tuple or None")
    return [
        _serialize_energy_issue_count(item, f"{field}[{index}]")
        for index, item in enumerate(value)
    ]


def _serialize_energy_metric(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, UnitEnergyMetricResult, field)
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "quantity": value.quantity,
        "unit": value.unit,
        "classification": value.classification,
        "value": value.value,
        "point_count": value.point_count,
        "issue_count": value.issue_count,
        "issue_counts": _serialize_issue_counts(
            value.issue_counts, f"{field}.issue_counts"
        ),
    }


def _serialize_energy_summary(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, UnitEnergySummary, field)
    if not isinstance(value.metrics, tuple):
        raise UnitOverviewSerializationError(f"{field}.metrics must be a tuple")
    return {
        "unit_id": value.unit_id,
        "period": _serialize_period(value.period, f"{field}.period"),
        "statistics_period": value.statistics_period,
        "metrics": [
            _serialize_energy_metric(item, f"{field}.metrics[{index}]")
            for index, item in enumerate(value.metrics)
        ],
    }


def _serialize_optional_energy_summary(
    value: Any, field: str
) -> dict[str, Any] | None:
    return None if value is None else _serialize_energy_summary(value, field)


def _serialize_cycle_energy(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, UnitCycleEnergyContext, field)
    return {
        "unit_id": value.unit_id,
        "statistics_period": value.statistics_period,
        "cycle": _serialize_billing_cycle(value.cycle, f"{field}.cycle"),
        "current_energy": _serialize_optional_energy_summary(
            value.current_energy, f"{field}.current_energy"
        ),
        "waiting_bill_energy": _serialize_optional_energy_summary(
            value.waiting_bill_energy, f"{field}.waiting_bill_energy"
        ),
    }


def _serialize_prediction(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, UnitPredictionSummary, field)
    return {
        "unit_id": value.unit_id,
        "classification": value.classification,
        "quantity": value.quantity,
        "unit": value.unit,
        "target_start": _serialize_datetime(
            value.target_start, f"{field}.target_start"
        ),
        "target_end": _serialize_datetime(value.target_end, f"{field}.target_end"),
        "predicted_value": value.predicted_value,
    }


def serialize_measurement_evidence(value: Any, field: str) -> dict[str, Any]:
    """Serialize one measurement evidence.

    Publica porque o contrato das medicoes ao vivo publica a mesma evidencia:
    a interface troca as duas juntas quando um sensor muda, e duas versoes
    desta serializacao poderiam discordar sobre o mesmo sensor.
    """
    _require_type(value, MeasurementEvidence, field)
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "quantity": value.quantity,
        "expected_unit": value.expected_unit,
        "state_unit": value.state_unit,
        "available": value.available,
        "validation_required": value.validation_required,
        "validation_note": value.validation_note,
        "unit_mismatch": value.unit_mismatch,
        "last_changed": _serialize_optional_datetime(
            value.last_changed, f"{field}.last_changed"
        ),
        "last_updated": _serialize_optional_datetime(
            value.last_updated, f"{field}.last_updated"
        ),
    }


def _serialize_energy_metric_evidence(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, EnergyMetricEvidence, field)
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "quantity": value.quantity,
        "unit": value.unit,
        "classification": value.classification,
        "value_available": value.value_available,
        "point_count": value.point_count,
        "issue_count": value.issue_count,
        "has_issues": value.has_issues,
        "issue_counts": _serialize_issue_counts(
            value.issue_counts, f"{field}.issue_counts"
        ),
    }


def _serialize_billing_evidence(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, BillingEvidence, field)
    if not isinstance(value.extraction_alerts, tuple):
        raise UnitOverviewSerializationError(
            f"{field}.extraction_alerts must be a tuple"
        )
    return {
        "available": value.available,
        "reference": value.reference,
        "extraction_status": value.extraction_status,
        "extraction_alerts": list(value.extraction_alerts),
        "has_extraction_alerts": value.has_extraction_alerts,
    }


def _serialize_quality_evidence(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, UnitQualityEvidence, field)
    for name in ("measurements", "current_energy", "waiting_bill_energy"):
        if not isinstance(getattr(value, name), tuple):
            raise UnitOverviewSerializationError(f"{field}.{name} must be a tuple")
    return {
        "unit_id": value.unit_id,
        "measurements": [
            serialize_measurement_evidence(item, f"{field}.measurements[{index}]")
            for index, item in enumerate(value.measurements)
        ],
        "current_summary_present": value.current_summary_present,
        "current_energy": [
            _serialize_energy_metric_evidence(
                item, f"{field}.current_energy[{index}]"
            )
            for index, item in enumerate(value.current_energy)
        ],
        "waiting_bill_summary_present": value.waiting_bill_summary_present,
        "waiting_bill_energy": [
            _serialize_energy_metric_evidence(
                item, f"{field}.waiting_bill_energy[{index}]"
            )
            for index, item in enumerate(value.waiting_bill_energy)
        ],
        "billing": _serialize_billing_evidence(value.billing, f"{field}.billing"),
    }


def serialize_unit_overview(overview: UnitOverview) -> dict[str, Any]:
    """Serialize one minimal unit overview into its explicit public contract."""
    _require_type(overview, UnitOverview, "overview")
    return {
        "snapshot": _serialize_snapshot(overview.snapshot, "overview.snapshot"),
        "cycle_energy": _serialize_cycle_energy(
            overview.cycle_energy, "overview.cycle_energy"
        ),
        "prediction": (
            None
            if overview.prediction is None
            else _serialize_prediction(overview.prediction, "overview.prediction")
        ),
        "quality_evidence": _serialize_quality_evidence(
            overview.quality_evidence, "overview.quality_evidence"
        ),
    }
