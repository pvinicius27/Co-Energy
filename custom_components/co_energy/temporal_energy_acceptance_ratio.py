"""Calculate energy-acceptance ratios from aggregated temporal durations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from .temporal_energy_acceptance_duration import (
    TemporalEnergyAcceptanceDurations,
)
from .temporal_observation_duration import TemporalObservationDurations


class TemporalEnergyAcceptanceRatioError(ValueError):
    """Raised when energy-acceptance ratios cannot be calculated."""


@dataclass(frozen=True)
class TemporalEnergyAcceptanceRatios:
    """Acceptance ratios over eligible and Recorder-present durations."""

    durations: TemporalEnergyAcceptanceDurations
    energy_acceptance_eligible_ratio: float | None
    energy_acceptance_present_ratio: float | None


def calculate_temporal_energy_acceptance_ratios(
    durations: TemporalEnergyAcceptanceDurations,
) -> TemporalEnergyAcceptanceRatios:
    """Return energy acceptance over eligible and present durations."""
    if not isinstance(durations, TemporalEnergyAcceptanceDurations):
        raise TemporalEnergyAcceptanceRatioError(
            "durations must be a TemporalEnergyAcceptanceDurations object"
        )
    observation_durations = durations.observation_durations
    if not isinstance(observation_durations, TemporalObservationDurations):
        raise TemporalEnergyAcceptanceRatioError(
            "observation_durations must be a TemporalObservationDurations object"
        )

    eligible = observation_durations.eligible_duration
    recorder_present = observation_durations.recorder_present_duration
    recorder_missing = observation_durations.recorder_missing_duration
    energy_accepted = durations.energy_accepted_duration
    energy_rejected = durations.energy_rejected_duration
    energy_missing = durations.energy_missing_duration
    values = (
        eligible,
        recorder_present,
        recorder_missing,
        energy_accepted,
        energy_rejected,
        energy_missing,
    )
    if any(not isinstance(value, timedelta) for value in values):
        raise TemporalEnergyAcceptanceRatioError(
            "all duration fields must be timedelta objects"
        )
    if any(value < timedelta(0) for value in values):
        raise TemporalEnergyAcceptanceRatioError(
            "duration fields must not be negative"
        )
    if recorder_present + recorder_missing != eligible:
        raise TemporalEnergyAcceptanceRatioError(
            "Recorder-present and missing durations must equal eligible duration"
        )
    if energy_accepted + energy_rejected + energy_missing != eligible:
        raise TemporalEnergyAcceptanceRatioError(
            "energy durations must equal eligible duration"
        )
    if energy_accepted + energy_rejected != recorder_present:
        raise TemporalEnergyAcceptanceRatioError(
            "accepted and rejected durations must equal Recorder-present duration"
        )
    if energy_missing != recorder_missing:
        raise TemporalEnergyAcceptanceRatioError(
            "energy-missing duration must equal Recorder-missing duration"
        )

    eligible_ratio = None if eligible == timedelta(0) else energy_accepted / eligible
    present_ratio = (
        None
        if recorder_present == timedelta(0)
        else energy_accepted / recorder_present
    )
    for ratio in (eligible_ratio, present_ratio):
        if ratio is not None and not 0.0 <= ratio <= 1.0:
            raise TemporalEnergyAcceptanceRatioError(
                "energy-acceptance ratios must be between zero and one"
            )

    return TemporalEnergyAcceptanceRatios(
        durations=durations,
        energy_acceptance_eligible_ratio=eligible_ratio,
        energy_acceptance_present_ratio=present_ratio,
    )
