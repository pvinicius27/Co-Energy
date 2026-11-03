"""Official physical self-consumption domain for the generating unit's closed cycles."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
import math
from numbers import Real
from typing import Any

from .energy_coverage_quality import (
    EnergyCoverageEvidence,
    EnergyCoverageQualityError,
    RejectedEnergyObservation,
    SelfConsumptionEvidence,
    classify_self_consumption_evidence,
)
from .energy_model import CoverageQualityPolicy, get_generator_unit_id
from .energy_period import EnergyPeriodError, EnergyPeriodResult, async_get_energy_period
from .temporal_energy_acceptance import (
    TemporalEnergyAcceptanceError,
    classify_temporal_energy_acceptance,
)
from .temporal_energy_acceptance_duration import (
    TemporalEnergyAcceptanceDurationError,
    calculate_temporal_energy_acceptance_durations,
)
from .temporal_energy_acceptance_ratio import (
    TemporalEnergyAcceptanceRatioError,
    calculate_temporal_energy_acceptance_ratios,
)
from .temporal_observation import (
    TemporalObservationError,
    classify_temporal_observations,
)
from .temporal_observation_coverage import (
    TemporalObservationCoverageError,
    calculate_temporal_observation_coverage,
)
from .temporal_observation_duration import (
    TemporalObservationDurationError,
    calculate_temporal_observation_durations,
)


class SelfConsumptionError(ValueError):
    """Raised when self-consumption domain inputs are structurally invalid."""


@dataclass(frozen=True)
class SelfConsumptionResult:
    """Consolidated physical self-consumption evidence for one closed cycle."""

    unit_id: str
    billing_reference: str
    period_from: datetime | None
    period_until: datetime | None
    status: str
    generation_kwh: float | None
    export_kwh: float | None
    import_kwh: float | None
    self_consumption_kwh: float | None
    coverage_complete: bool
    generation_coverage_ratio: float | None
    export_coverage_ratio: float | None
    import_coverage_ratio: float | None
    generation_acceptance_ratio: float | None
    export_acceptance_ratio: float | None
    import_acceptance_ratio: float | None
    blockers: tuple[str, ...]
    warnings: tuple[str, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.unit_id, str) or not self.unit_id.strip():
            raise SelfConsumptionError("unit_id must be a non-empty string")
        if not isinstance(self.billing_reference, str) or not self.billing_reference.strip():
            raise SelfConsumptionError("billing_reference must be a non-empty string")
        if self.status not in ("confirmed", "partial", "unavailable"):
            raise SelfConsumptionError(f"invalid status: {self.status!r}")
        if self.period_from is not None and (
            not isinstance(self.period_from, datetime) or self.period_from.tzinfo is None
        ):
            raise SelfConsumptionError("period_from must be an aware datetime or None")
        if self.period_until is not None and (
            not isinstance(self.period_until, datetime) or self.period_until.tzinfo is None
        ):
            raise SelfConsumptionError("period_until must be an aware datetime or None")
        if (
            self.period_from is not None
            and self.period_until is not None
            and self.period_from >= self.period_until
        ):
            raise SelfConsumptionError("period_from must precede period_until")
        for name in ("generation_kwh", "export_kwh", "import_kwh", "self_consumption_kwh"):
            value = getattr(self, name)
            if value is not None and (
                isinstance(value, bool)
                or not isinstance(value, Real)
                or not math.isfinite(value)
                or value < 0
            ):
                raise SelfConsumptionError(f"{name} must be null or non-negative")
        for name in (
            "generation_coverage_ratio",
            "export_coverage_ratio",
            "import_coverage_ratio",
            "generation_acceptance_ratio",
            "export_acceptance_ratio",
            "import_acceptance_ratio",
        ):
            value = getattr(self, name)
            if value is not None and (
                isinstance(value, bool)
                or not isinstance(value, Real)
                or not math.isfinite(value)
                or not 0 <= value <= 1
            ):
                raise SelfConsumptionError(f"{name} must be null or a ratio between 0 and 1")
        if not isinstance(self.coverage_complete, bool):
            raise SelfConsumptionError("coverage_complete must be boolean")
        if not isinstance(self.blockers, tuple) or any(
            not isinstance(item, str) or not item.strip() for item in self.blockers
        ):
            raise SelfConsumptionError("blockers must be a tuple of non-empty strings")
        if not isinstance(self.warnings, tuple) or any(
            not isinstance(item, str) or not item.strip() for item in self.warnings
        ):
            raise SelfConsumptionError("warnings must be a tuple of non-empty strings")


def _duration_seconds(value: timedelta) -> float:
    return float(value.total_seconds())


def build_energy_coverage_evidence_from_period_result(
    result: EnergyPeriodResult,
) -> EnergyCoverageEvidence:
    """Build standardized EnergyCoverageEvidence from one EnergyPeriodResult."""
    if not isinstance(result, EnergyPeriodResult):
        raise SelfConsumptionError("result must be an EnergyPeriodResult")

    observations = classify_temporal_observations(result.temporal_evidence)
    observation_durations = calculate_temporal_observation_durations(observations)
    observation_coverage = calculate_temporal_observation_coverage(observation_durations)
    acceptances = classify_temporal_energy_acceptance(observations)
    acceptance_durations = calculate_temporal_energy_acceptance_durations(
        acceptances, observation_durations
    )
    acceptance_ratios = calculate_temporal_energy_acceptance_ratios(acceptance_durations)

    missing_count = sum(
        1
        for item in acceptances
        if item.energy_bucket_accepted is False
        and item.observation.recorder_bucket_present is False
    )

    rejected_observations = tuple(
        RejectedEnergyObservation(
            start=item.observation.evidence.start,
            end=item.observation.evidence.end,
            reasons=tuple(issue.reason for issue in item.observation.evidence.issues),
        )
        for item in acceptances
        if item.energy_bucket_accepted is False
        and item.observation.recorder_bucket_present is True
    )

    return EnergyCoverageEvidence(
        accepted_energy_kwh=result.value,
        observation_coverage_ratio=(
            observation_coverage.recorder_observation_coverage_ratio
        ),
        acceptance_ratio=acceptance_ratios.energy_acceptance_eligible_ratio,
        missing_observation_count=missing_count,
        missing_duration_seconds=_duration_seconds(
            observation_durations.recorder_missing_duration
        ),
        rejected_duration_seconds=_duration_seconds(
            acceptance_durations.energy_rejected_duration
        ),
        rejected_observations=rejected_observations,
    )


def build_self_consumption_result(
    unit_id: str,
    billing_reference: str,
    period_from: datetime | None,
    period_until: datetime | None,
    policy: CoverageQualityPolicy,
    generation: EnergyCoverageEvidence | None,
    exported: EnergyCoverageEvidence | None,
    imported: EnergyCoverageEvidence | None = None,
    *,
    billing_period_valid: bool = True,
) -> SelfConsumptionResult:
    """Construct a pure physical SelfConsumptionResult from evidence components."""
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise SelfConsumptionError("unit_id must be a non-empty string")
    if not isinstance(billing_reference, str) or not billing_reference.strip():
        raise SelfConsumptionError("billing_reference must be a non-empty string")
    if not isinstance(policy, CoverageQualityPolicy):
        raise SelfConsumptionError("policy must be a CoverageQualityPolicy")
    if type(billing_period_valid) is not bool:
        raise SelfConsumptionError("billing_period_valid must be boolean")

    import_kwh = imported.accepted_energy_kwh if imported is not None else None
    import_coverage = (
        imported.observation_coverage_ratio if imported is not None else None
    )
    import_acceptance = (
        imported.acceptance_ratio if imported is not None else None
    )

    if generation is None or exported is None:
        blockers = []
        if not billing_period_valid:
            blockers.append("invalid_billing_period")
        if generation is None:
            blockers.append("generation_unavailable")
        if exported is None:
            blockers.append("export_unavailable")
        blockers.append("self_consumption_unavailable")
        return SelfConsumptionResult(
            unit_id=unit_id,
            billing_reference=billing_reference,
            period_from=period_from,
            period_until=period_until,
            status="unavailable",
            generation_kwh=None,
            export_kwh=None,
            import_kwh=import_kwh,
            self_consumption_kwh=None,
            coverage_complete=False,
            generation_coverage_ratio=None,
            export_coverage_ratio=None,
            import_coverage_ratio=import_coverage,
            generation_acceptance_ratio=None,
            export_acceptance_ratio=None,
            import_acceptance_ratio=import_acceptance,
            blockers=tuple(dict.fromkeys(blockers)),
            warnings=(),
        )

    try:
        evidence = classify_self_consumption_evidence(
            policy=policy,
            generation=generation,
            exported=exported,
            billing_period_valid=billing_period_valid,
        )
    except EnergyCoverageQualityError as error:
        raise SelfConsumptionError(str(error)) from error

    return SelfConsumptionResult(
        unit_id=unit_id,
        billing_reference=billing_reference,
        period_from=period_from,
        period_until=period_until,
        status=evidence.status,
        generation_kwh=generation.accepted_energy_kwh,
        export_kwh=exported.accepted_energy_kwh,
        import_kwh=import_kwh,
        self_consumption_kwh=evidence.self_consumption_kwh,
        coverage_complete=evidence.coverage_complete,
        generation_coverage_ratio=evidence.generation_coverage_ratio,
        export_coverage_ratio=evidence.export_coverage_ratio,
        import_coverage_ratio=import_coverage,
        generation_acceptance_ratio=evidence.generation_acceptance_ratio,
        export_acceptance_ratio=evidence.export_acceptance_ratio,
        import_acceptance_ratio=import_acceptance,
        blockers=evidence.blockers,
        warnings=evidence.warnings,
    )


async def async_get_solar_self_consumption(
    hass: Any,
    model: Any,
    cycle: Any,
    policy: CoverageQualityPolicy,
    *,
    statistics_period: str = "hour",
    accept_open_cycle: bool = False,
) -> SelfConsumptionResult:
    """Retrieve Recorder evidence and build physical self-consumption for one generator cycle.

    ``accept_open_cycle`` opts a caller into cycles that no invoice closed yet.
    It stays off by default: for the audit an open period is genuinely invalid,
    since there is no official reading to compare against. The operational flow
    is the exception — there the period is real, just not billed.

    A unidade vem do papel declarado no modelo. Estava escrita aqui, e era a
    mesma conta: autoconsumo e o que foi gerado e nao saiu para a rede, em
    qualquer instalacao que meca geracao e exportacao.
    """
    unit_id = get_generator_unit_id(model)
    if cycle is None or getattr(cycle, "period", None) is None:
        return build_self_consumption_result(
            unit_id=unit_id,
            billing_reference=getattr(cycle, "billing_reference", "") or "UNKNOWN",
            period_from=None,
            period_until=None,
            policy=policy,
            generation=None,
            exported=None,
            imported=None,
            billing_period_valid=False,
        )

    logical_ids = tuple(
        f"{unit_id}.{metric}"
        for metric in ("generation_energy", "export_energy", "import_energy")
    )

    evidences: dict[str, EnergyCoverageEvidence | None] = {}
    for logical_id in logical_ids:
        try:
            period_result = await async_get_energy_period(
                hass, model, logical_id, cycle.period, statistics_period
            )
            evidences[logical_id] = build_energy_coverage_evidence_from_period_result(
                period_result
            )
        except (
            EnergyPeriodError,
            TemporalObservationError,
            TemporalObservationDurationError,
            TemporalObservationCoverageError,
            TemporalEnergyAcceptanceError,
            TemporalEnergyAcceptanceDurationError,
            TemporalEnergyAcceptanceRatioError,
        ):
            evidences[logical_id] = None

    period_from = getattr(cycle.period, "start", None)
    period_until = getattr(cycle.period, "end", None)
    status = getattr(cycle, "status", "")
    # Ciclo aberto nao tem referencia faturada; a prevista identifica o periodo
    # sem inventar uma fatura que ainda nao existe.
    reference = cycle.billing_reference or getattr(
        cycle, "predicted_reference", None
    ) or cycle.cycle_id

    return build_self_consumption_result(
        unit_id=unit_id,
        billing_reference=reference,
        period_from=period_from,
        period_until=period_until,
        policy=policy,
        generation=evidences[f"{unit_id}.generation_energy"],
        exported=evidences[f"{unit_id}.export_energy"],
        imported=evidences[f"{unit_id}.import_energy"],
        billing_period_valid=(
            status == "closed"
            or (accept_open_cycle and status in ("open", "provisional"))
        ),
    )
