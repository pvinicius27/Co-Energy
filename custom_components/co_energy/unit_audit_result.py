"""Build the public audit result for one official closed billing cycle."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
import math
from numbers import Real
from typing import Any

from .billing import BillingError, BillingRecord, get_bill_by_reference
from .billing_cycle import (
    BillingCycle,
    BillingCycleError,
    BillingOnlyCyclePeriod,
    BillingReadingDiagnostic,
    get_closed_billing_cycles,
)
from .energy_model import EnergyModelError, get_unit_definition
from .energy_period import EnergyIssueCount
from .logical_series import ISSUE_REASONS, LogicalSeriesIssue
from .equatorial_adapter import EquatorialDocument
from .periods import Period
from .unit_audit import UnitAuditError, build_unit_audits
from .unit_audit_tolerance import (
    UnitAuditToleranceError,
    evaluate_unit_audit_tolerances,
)
from .unit_energy_summary import UnitEnergySummaryError, async_get_unit_energy_summary


class UnitAuditResultError(ValueError):
    """Raised when a public unit audit cannot be built."""


class UnitAuditUnknownUnitError(UnitAuditResultError):
    """Raised when the requested unit does not exist."""


class UnitAuditInvalidReferenceError(UnitAuditResultError):
    """Raised when the requested official closed cycle does not exist."""


class UnitAuditUnavailableError(UnitAuditResultError):
    """Raised when an operational audit cannot be produced."""


@dataclass(frozen=True)
class AuditBillingQuality:
    """Existing billing-only evidence attached without reinterpretation."""

    billing_method: str | None
    billing_cycle_period: BillingOnlyCyclePeriod | None
    billing_reading_diagnostic: BillingReadingDiagnostic | None


@dataclass(frozen=True)
class AuditIssueEvent:
    """One detailed logical-series issue that affected an audited metric."""

    reason: str
    start: datetime
    end: datetime
    source_entity_id: str
    source_label: str | None
    value: float | None

    def __post_init__(self) -> None:
        if self.reason not in ISSUE_REASONS:
            raise UnitAuditResultError("audit issue event reason is invalid")
        for name in ("start", "end"):
            moment = getattr(self, name)
            if (
                not isinstance(moment, datetime)
                or moment.tzinfo is None
                or moment.utcoffset() is None
            ):
                raise UnitAuditResultError(
                    f"audit issue event {name} must be timezone-aware"
                )
        if self.start >= self.end:
            raise UnitAuditResultError(
                "audit issue event start must be earlier than end"
            )
        if (
            not isinstance(self.source_entity_id, str)
            or not self.source_entity_id.strip()
        ):
            raise UnitAuditResultError(
                "audit issue event source_entity_id must be non-empty"
            )
        if self.source_label is not None and not isinstance(self.source_label, str):
            raise UnitAuditResultError(
                "audit issue event source_label must be a string or None"
            )
        if self.value is not None and (
            isinstance(self.value, bool)
            or not isinstance(self.value, Real)
            or not math.isfinite(float(self.value))
        ):
            raise UnitAuditResultError(
                "audit issue event value must be finite numeric or None"
            )


@dataclass(frozen=True)
class UnitAuditEntry:
    """One official-versus-measured energy comparison."""

    metric: str
    label: str
    unit: str
    official_value: float | None
    measured_value: float | None
    deviation: float | None
    deviation_percent: float | None
    tolerance_percent: float | None
    within_tolerance: bool | None
    issue_count: int
    issue_counts: tuple[EnergyIssueCount, ...]
    status: str
    comparison_status: str
    explanations: tuple[str, ...]
    issue_events: tuple[AuditIssueEvent, ...] = ()


@dataclass(frozen=True)
class UnitAuditResult:
    """Public audit result for one unit and official billing reference."""

    unit_id: str
    billing_reference: str
    period: Period | None
    status: str
    comparison_status: str
    entries: tuple[UnitAuditEntry, ...]
    explanations: tuple[str, ...]
    billing_quality: AuditBillingQuality | None


_DISCARD_ISSUES = {
    "partial_bucket": "Intervalo parcial descartado na fronteira temporal.",
    "missing_change": "Variação de energia ausente no Recorder.",
    "skip_first_change": "Proteção aplicada na troca de fonte.",
    "negative_change": "Variação negativa descartada.",
    "max_change_exceeded": "Variação acima do limite configurado descartada.",
}


def _extract_issue_events(
    temporal_evidence: tuple[Any, ...] | None,
) -> tuple[AuditIssueEvent, ...]:
    """Return unique detailed issues already retained by temporal evidence."""
    if temporal_evidence is None:
        return ()
    unique: dict[
        tuple[str, datetime, datetime, str, str | None, float | None],
        AuditIssueEvent,
    ] = {}
    for evidence_slice in temporal_evidence:
        for issue in evidence_slice.issues:
            if not isinstance(issue, LogicalSeriesIssue):
                raise UnitAuditResultError(
                    "temporal evidence issue must be a LogicalSeriesIssue"
                )
            event = AuditIssueEvent(
                reason=issue.reason,
                start=issue.start,
                end=issue.end,
                source_entity_id=issue.source_entity_id,
                source_label=issue.source_label,
                value=issue.value,
            )
            key = (
                event.reason,
                event.start,
                event.end,
                event.source_entity_id,
                event.source_label,
                event.value,
            )
            unique.setdefault(key, event)
    return tuple(sorted(
        unique.values(),
        key=lambda event: (
            event.start,
            event.end,
            event.reason,
            event.source_entity_id,
        ),
    ))


def _find_cycle(
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
    billing_reference: str,
) -> BillingCycle:
    try:
        cycles = get_closed_billing_cycles(model, billing_document, unit_id)
    except BillingCycleError as error:
        raise UnitAuditUnavailableError("could not resolve closed cycles") from error
    matches = tuple(
        cycle for cycle in cycles if cycle.billing_reference == billing_reference
    )
    if len(matches) != 1:
        raise UnitAuditInvalidReferenceError(
            "billing_reference must identify one official closed cycle"
        )
    return matches[0]


def _get_bill(
    billing_document: EquatorialDocument,
    billing_key: str,
    billing_reference: str,
) -> BillingRecord:
    try:
        bill = get_bill_by_reference(
            billing_document, billing_key, billing_reference
        )
    except BillingError as error:
        raise UnitAuditInvalidReferenceError(
            "billing_reference must identify one official closed bill"
        ) from error
    if bill is None:
        raise UnitAuditInvalidReferenceError(
            "billing_reference must identify one official closed bill"
        )
    return bill


def _entry_status(
    official_value: float | None,
    measured_value: float | None,
    deviation_percent: float | None,
    within_tolerance: bool | None,
    issue_counts: tuple[EnergyIssueCount, ...],
) -> tuple[str, tuple[str, ...]]:
    explanations: list[str] = []
    if official_value is None:
        explanations.append("Valor oficial indisponível.")
    if measured_value is None:
        explanations.append("Valor medido pelo Home Assistant indisponível.")
    if explanations:
        return "unavailable", tuple(explanations)

    if deviation_percent is None:
        return (
            "incomplete",
            ("Valor medido pelo Home Assistant igual a zero impede o percentual.",),
        )

    for issue in issue_counts:
        explanation = _DISCARD_ISSUES.get(issue.reason)
        if explanation is not None:
            explanations.append(f"{explanation} Ocorrências: {issue.count}.")
    if explanations:
        return "incomplete", tuple(explanations)

    if within_tolerance is None:
        return "incomplete", ("Tolerância de auditoria indisponível.",)
    if within_tolerance is False:
        return "attention", ("Resultado fora da tolerância configurada.",)
    return (
        "ok",
        (
            "Resultado dentro da tolerância configurada e sem ocorrência "
            "conhecida que tenha comprometido o total auditado.",
        ),
    )


def _unit_status(entries: tuple[UnitAuditEntry, ...]) -> str:
    if not entries:
        return "unavailable"
    statuses = tuple(entry.status for entry in entries)
    if all(status == "unavailable" for status in statuses):
        return "unavailable"
    if any(status in ("unavailable", "incomplete") for status in statuses):
        return "incomplete"
    if any(status == "attention" for status in statuses):
        return "attention"
    if all(status == "ok" for status in statuses):
        return "ok"
    raise UnitAuditResultError("could not consolidate unit audit status")


def _comparison_status(
    official_value: float | None,
    measured_value: float | None,
    deviation_percent: float | None,
    within_tolerance: bool | None,
) -> str:
    """Return the energy-comparison status without interpreting quality issues."""
    if (
        official_value is None
        or measured_value is None
        or deviation_percent is None
        or within_tolerance is None
    ):
        return "unavailable"
    if within_tolerance is False:
        return "attention"
    if within_tolerance is True:
        return "ok"
    raise UnitAuditResultError("within_tolerance is invalid")


def _unit_comparison_status(entries: tuple[UnitAuditEntry, ...]) -> str:
    """Consolidate energy-comparison statuses for one operational unit."""
    if not entries or any(
        entry.comparison_status == "unavailable" for entry in entries
    ):
        return "unavailable"
    if any(entry.comparison_status == "attention" for entry in entries):
        return "attention"
    if all(entry.comparison_status == "ok" for entry in entries):
        return "ok"
    raise UnitAuditResultError("could not consolidate unit comparison status")


async def async_get_unit_audit_result(
    hass: Any,
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
    billing_reference: str,
    statistics_period: str = "hour",
) -> UnitAuditResult:
    """Return one public audit for an exact official closed cycle."""
    try:
        unit = get_unit_definition(model, unit_id)
    except EnergyModelError as error:
        raise UnitAuditUnknownUnitError(f"unknown unit: {unit_id!r}") from error
    billing_key = unit.get("billing_key")
    if not isinstance(billing_key, str) or not billing_key.strip():
        raise UnitAuditUnavailableError("unit billing_key is unavailable")

    cycle = _find_cycle(model, billing_document, unit_id, billing_reference)
    bill = _get_bill(billing_document, billing_key, billing_reference)

    if cycle.capability == "billing_only":
        return UnitAuditResult(
            unit_id=unit_id,
            billing_reference=billing_reference,
            period=None,
            status="not_applicable",
            comparison_status="not_applicable",
            entries=(),
            explanations=("Auditoria operacional não aplicável a esta unidade.",),
            billing_quality=AuditBillingQuality(
                billing_method=cycle.billing_method,
                billing_cycle_period=cycle.billing_cycle_period,
                billing_reading_diagnostic=cycle.billing_reading_diagnostic,
            ),
        )

    if cycle.capability != "operational_history" or cycle.period is None:
        raise UnitAuditUnavailableError(
            "official closed cycle has no trusted operational period"
        )

    try:
        summary = await async_get_unit_energy_summary(
            hass, model, unit_id, cycle.period, statistics_period
        )
        audits = build_unit_audits(model, bill, cycle.period, summary)
        evaluated = evaluate_unit_audit_tolerances(model, audits)
    except (
        UnitEnergySummaryError,
        UnitAuditError,
        UnitAuditToleranceError,
    ) as error:
        raise UnitAuditUnavailableError("could not build operational audit") from error

    entries: list[UnitAuditEntry] = []
    for item in evaluated:
        audit = item.audit
        metric = audit.metric
        calculation = audit.calculation
        issue_count = metric.issue_count if metric.issue_count is not None else 0
        issue_counts = metric.issue_counts if metric.issue_counts is not None else ()
        status, explanations = _entry_status(
            calculation.official_value,
            calculation.measured_value,
            calculation.deviation_percent,
            item.evaluation.within_tolerance if item.evaluation is not None else None,
            issue_counts,
        )
        comparison_status = _comparison_status(
            calculation.official_value,
            calculation.measured_value,
            calculation.deviation_percent,
            item.evaluation.within_tolerance if item.evaluation is not None else None,
        )
        entries.append(
            UnitAuditEntry(
                metric=metric.logical_id,
                label=metric.label,
                unit=metric.unit,
                official_value=calculation.official_value,
                measured_value=calculation.measured_value,
                deviation=calculation.deviation,
                deviation_percent=calculation.deviation_percent,
                tolerance_percent=(
                    item.evaluation.tolerance_percent
                    if item.evaluation is not None
                    else None
                ),
                within_tolerance=(
                    item.evaluation.within_tolerance
                    if item.evaluation is not None
                    else None
                ),
                issue_count=issue_count,
                issue_counts=issue_counts,
                status=status,
                comparison_status=comparison_status,
                explanations=explanations,
                issue_events=_extract_issue_events(metric.temporal_evidence),
            )
        )

    result_entries = tuple(entries)
    return UnitAuditResult(
        unit_id=unit_id,
        billing_reference=billing_reference,
        period=cycle.period,
        status=_unit_status(result_entries),
        comparison_status=_unit_comparison_status(result_entries),
        entries=result_entries,
        explanations=(
            "OK indica apenas tolerância atendida sem ocorrência conhecida "
            "que tenha comprometido o total; não comprova cobertura física completa.",
        ),
        billing_quality=None,
    )
