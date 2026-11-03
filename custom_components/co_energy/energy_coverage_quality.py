"""Classify observed self-consumption evidence without estimation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import math
from numbers import Real

from .energy import EnergyCalculationError, calculate_self_consumption
from .energy_model import CoverageQualityPolicy


class EnergyCoverageQualityError(ValueError):
    """Raised when coverage evidence is structurally invalid."""


_RECOGNIZED_REJECTION_REASONS = frozenset(
    {
        "missing_change",
        "negative_change",
        "max_change_exceeded",
        "skip_first_change",
        "partial_bucket",
    }
)


@dataclass(frozen=True)
class RejectedEnergyObservation:
    """One rejected Recorder interval already produced by the temporal engine."""

    start: datetime
    end: datetime
    reasons: tuple[str, ...]

    def __post_init__(self) -> None:
        if (
            not isinstance(self.start, datetime)
            or not isinstance(self.end, datetime)
            or self.start.tzinfo is None
            or self.end.tzinfo is None
            or self.start >= self.end
        ):
            raise EnergyCoverageQualityError("rejected interval must be aware and valid")
        if not isinstance(self.reasons, tuple) or not self.reasons or any(
            not isinstance(reason, str) or not reason.strip()
            for reason in self.reasons
        ):
            raise EnergyCoverageQualityError("rejection reasons must be non-empty")


@dataclass(frozen=True)
class EnergyCoverageEvidence:
    """Aggregated temporal evidence for one measured energy series."""

    accepted_energy_kwh: float | None
    observation_coverage_ratio: float | None
    acceptance_ratio: float | None
    missing_observation_count: int
    missing_duration_seconds: float
    rejected_duration_seconds: float
    rejected_observations: tuple[RejectedEnergyObservation, ...] = ()

    def __post_init__(self) -> None:
        for name in ("observation_coverage_ratio", "acceptance_ratio"):
            value = getattr(self, name)
            if value is not None and (
                isinstance(value, bool)
                or not isinstance(value, Real)
                or not math.isfinite(value)
                or not 0 <= value <= 1
            ):
                raise EnergyCoverageQualityError(f"{name} must be null or a ratio")
        value = self.accepted_energy_kwh
        if value is not None and (
            isinstance(value, bool)
            or not isinstance(value, Real)
            or not math.isfinite(value)
            or value < 0
        ):
            raise EnergyCoverageQualityError("accepted_energy_kwh is invalid")
        if (
            isinstance(self.missing_observation_count, bool)
            or not isinstance(self.missing_observation_count, int)
            or self.missing_observation_count < 0
        ):
            raise EnergyCoverageQualityError("missing_observation_count is invalid")
        for name in ("missing_duration_seconds", "rejected_duration_seconds"):
            duration = getattr(self, name)
            if (
                isinstance(duration, bool)
                or not isinstance(duration, Real)
                or not math.isfinite(duration)
                or duration < 0
            ):
                raise EnergyCoverageQualityError(f"{name} is invalid")
        if not isinstance(self.rejected_observations, tuple) or any(
            not isinstance(item, RejectedEnergyObservation)
            for item in self.rejected_observations
        ):
            raise EnergyCoverageQualityError("rejected_observations must be a tuple")


@dataclass(frozen=True)
class SelfConsumptionEvidence:
    """Quality result for observed, never extrapolated self-consumption."""

    status: str
    self_consumption_kwh: float | None
    coverage_complete: bool
    generation_coverage_ratio: float | None
    export_coverage_ratio: float | None
    generation_acceptance_ratio: float | None
    export_acceptance_ratio: float | None
    missing_duration_seconds: float
    rejected_duration_seconds: float
    maximum_contiguous_rejected_duration_seconds: float
    blockers: tuple[str, ...]
    warnings: tuple[str, ...]


def _maximum_contiguous_rejected_duration(
    observations: tuple[RejectedEnergyObservation, ...],
) -> float:
    if not observations:
        return 0.0
    ordered = sorted(observations, key=lambda item: (item.start, item.end))
    maximum = 0.0
    start = ordered[0].start
    end = ordered[0].end
    for item in ordered[1:]:
        if item.start <= end:
            end = max(end, item.end)
        else:
            maximum = max(maximum, (end - start).total_seconds())
            start, end = item.start, item.end
    return max(maximum, (end - start).total_seconds())


def classify_self_consumption_evidence(
    policy: CoverageQualityPolicy,
    generation: EnergyCoverageEvidence,
    exported: EnergyCoverageEvidence,
    *,
    billing_period_valid: bool = True,
) -> SelfConsumptionEvidence:
    """Classify observed self-consumption while preserving incomplete values."""
    if not isinstance(policy, CoverageQualityPolicy):
        raise EnergyCoverageQualityError("policy must be CoverageQualityPolicy")
    if not isinstance(generation, EnergyCoverageEvidence) or not isinstance(
        exported, EnergyCoverageEvidence
    ):
        raise EnergyCoverageQualityError("generation and export evidence are required")
    if type(billing_period_valid) is not bool:
        raise EnergyCoverageQualityError("billing_period_valid must be boolean")

    all_rejections = generation.rejected_observations + exported.rejected_observations
    maximum_rejected = _maximum_contiguous_rejected_duration(all_rejections)
    missing_duration = float(
        generation.missing_duration_seconds + exported.missing_duration_seconds
    )
    rejected_duration = float(
        generation.rejected_duration_seconds + exported.rejected_duration_seconds
    )
    common = {
        "generation_coverage_ratio": generation.observation_coverage_ratio,
        "export_coverage_ratio": exported.observation_coverage_ratio,
        "generation_acceptance_ratio": generation.acceptance_ratio,
        "export_acceptance_ratio": exported.acceptance_ratio,
        "missing_duration_seconds": missing_duration,
        "rejected_duration_seconds": rejected_duration,
        "maximum_contiguous_rejected_duration_seconds": maximum_rejected,
    }

    unavailable = []
    if not billing_period_valid:
        unavailable.append("invalid_billing_period")
    if generation.accepted_energy_kwh is None:
        unavailable.append("generation_unavailable")
    if exported.accepted_energy_kwh is None:
        unavailable.append("export_unavailable")
    try:
        observed = calculate_self_consumption(
            generation.accepted_energy_kwh, exported.accepted_energy_kwh
        )
    except EnergyCalculationError as error:
        raise EnergyCoverageQualityError("energy values are invalid") from error
    if observed is None:
        unavailable.append("self_consumption_unavailable")
    if unavailable:
        return SelfConsumptionEvidence(
            status="unavailable",
            self_consumption_kwh=None,
            coverage_complete=False,
            blockers=tuple(dict.fromkeys(unavailable)),
            warnings=(),
            **common,
        )

    blockers = []
    metrics = (generation, exported)
    if any(
        metric.observation_coverage_ratio is None
        or metric.observation_coverage_ratio
        < policy.observation_coverage_ratio_min
        for metric in metrics
    ):
        blockers.append("coverage_incomplete")
    if any(
        metric.acceptance_ratio is None
        or metric.acceptance_ratio < policy.acceptance_ratio_min
        for metric in metrics
    ):
        blockers.append("acceptance_below_confirmed_threshold")
    if policy.require_no_missing_observations and any(
        metric.missing_observation_count for metric in metrics
    ):
        blockers.append("missing_observations")
    if maximum_rejected > policy.max_contiguous_rejected_duration_seconds:
        blockers.append("excessive_rejected_duration")
    if any(
        reason not in _RECOGNIZED_REJECTION_REASONS
        for item in all_rejections
        for reason in item.reasons
    ):
        blockers.append("unrecognized_rejection_reason")

    status = "partial" if blockers else "confirmed"
    return SelfConsumptionEvidence(
        status=status,
        self_consumption_kwh=float(observed),
        coverage_complete=status == "confirmed",
        blockers=tuple(blockers),
        warnings=("observed_value_is_not_full_cycle",) if blockers else (),
        **common,
    )
