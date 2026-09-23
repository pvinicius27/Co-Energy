"""Build structural quality and provenance evidence without interpretation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .billing import BillingRecord
from .energy_period import EnergyIssueCount
from .logical_state import LogicalStateResult
from .unit_cycle_energy import UnitCycleEnergyContext
from .unit_energy_summary import UnitEnergyMetricResult, UnitEnergySummary
from .unit_snapshot import UnitSnapshot


class QualityEvidenceError(ValueError):
    """Raised when structural quality evidence cannot be assembled."""


@dataclass(frozen=True)
class EnergyMetricEvidence:
    """Structural evidence associated with one energy metric."""

    logical_id: str
    label: str
    quantity: str
    unit: str
    classification: str
    value_available: bool
    point_count: int | None
    issue_count: int | None
    has_issues: bool
    issue_counts: tuple[EnergyIssueCount, ...] | None


@dataclass(frozen=True)
class MeasurementEvidence:
    """Structural evidence associated with one current measurement."""

    logical_id: str
    label: str
    quantity: str
    expected_unit: str | None
    state_unit: str | None
    available: bool
    validation_required: bool
    validation_note: str | None
    unit_mismatch: bool
    last_changed: datetime | None
    last_updated: datetime | None


@dataclass(frozen=True)
class BillingEvidence:
    """Structural evidence associated with the latest official bill."""

    available: bool
    reference: str | None
    extraction_status: str | None
    extraction_alerts: tuple[str, ...]
    has_extraction_alerts: bool


@dataclass(frozen=True)
class UnitQualityEvidence:
    """Structural evidence collected for one logical unit."""

    unit_id: str
    measurements: tuple[MeasurementEvidence, ...]
    current_summary_present: bool
    current_energy: tuple[EnergyMetricEvidence, ...]
    waiting_bill_summary_present: bool
    waiting_bill_energy: tuple[EnergyMetricEvidence, ...]
    billing: BillingEvidence


def build_energy_metric_evidence(
    metric: UnitEnergyMetricResult,
) -> EnergyMetricEvidence:
    """Project one energy metric into structural evidence."""
    return EnergyMetricEvidence(
        logical_id=metric.logical_id,
        label=metric.label,
        quantity=metric.quantity,
        unit=metric.unit,
        classification=metric.classification,
        value_available=metric.value is not None,
        point_count=metric.point_count,
        issue_count=metric.issue_count,
        has_issues=metric.issue_count is not None and metric.issue_count > 0,
        issue_counts=metric.issue_counts,
    )


def build_measurement_evidence(
    measurement: LogicalStateResult,
) -> MeasurementEvidence:
    """Project one logical state into structural evidence."""
    return MeasurementEvidence(
        logical_id=measurement.logical_id,
        label=measurement.label,
        quantity=measurement.quantity,
        expected_unit=measurement.unit,
        state_unit=measurement.state_unit,
        available=measurement.available,
        validation_required=measurement.validation_required,
        validation_note=measurement.validation_note,
        unit_mismatch=measurement.unit_mismatch,
        last_changed=measurement.last_changed,
        last_updated=measurement.last_updated,
    )


def build_billing_evidence(bill: BillingRecord | None) -> BillingEvidence:
    """Project an optional official bill into structural evidence."""
    if bill is None:
        return BillingEvidence(
            available=False,
            reference=None,
            extraction_status=None,
            extraction_alerts=(),
            has_extraction_alerts=False,
        )
    return BillingEvidence(
        available=True,
        reference=bill.reference,
        extraction_status=bill.extraction_status,
        extraction_alerts=bill.extraction_alerts,
        has_extraction_alerts=bool(bill.extraction_alerts),
    )


def _build_summary_evidence(
    summary: UnitEnergySummary | None,
) -> tuple[bool, tuple[EnergyMetricEvidence, ...]]:
    if summary is None:
        return False, ()
    return True, tuple(build_energy_metric_evidence(metric) for metric in summary.metrics)


def build_unit_quality_evidence(
    snapshot: UnitSnapshot,
    cycle_energy: UnitCycleEnergyContext,
) -> UnitQualityEvidence:
    """Collect structural evidence from one unit snapshot and cycle context."""
    if snapshot.unit_id != cycle_energy.unit_id:
        raise QualityEvidenceError(
            "snapshot and cycle energy must belong to the same unit"
        )

    current_present, current_energy = _build_summary_evidence(
        cycle_energy.current_energy
    )
    waiting_present, waiting_energy = _build_summary_evidence(
        cycle_energy.waiting_bill_energy
    )
    return UnitQualityEvidence(
        unit_id=snapshot.unit_id,
        measurements=tuple(
            build_measurement_evidence(measurement)
            for measurement in snapshot.measurements
        ),
        current_summary_present=current_present,
        current_energy=current_energy,
        waiting_bill_summary_present=waiting_present,
        waiting_bill_energy=waiting_energy,
        billing=build_billing_evidence(snapshot.latest_bill),
    )
