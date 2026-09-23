"""Aggregate durations from temporal energy-acceptance classifications."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from .temporal_energy_acceptance import TemporalEnergyAcceptance
from .temporal_evidence import TemporalEvidenceSlice
from .temporal_observation import TemporalRecorderObservation
from .temporal_observation_duration import TemporalObservationDurations


class TemporalEnergyAcceptanceDurationError(ValueError):
    """Raised when energy-acceptance durations are inconsistent."""


@dataclass(frozen=True)
class TemporalEnergyAcceptanceDurations:
    """Exact accepted, rejected, and missing eligible durations."""

    observation_durations: TemporalObservationDurations
    energy_accepted_duration: timedelta
    energy_rejected_duration: timedelta
    energy_missing_duration: timedelta


def _as_utc(value: datetime, field: str) -> datetime:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise TemporalEnergyAcceptanceDurationError(
            f"{field} must be a timezone-aware datetime"
        )
    return value.astimezone(timezone.utc)


def _validate_observation_durations(
    durations: TemporalObservationDurations,
) -> None:
    values = (
        durations.eligible_duration,
        durations.recorder_present_duration,
        durations.recorder_missing_duration,
    )
    if any(not isinstance(value, timedelta) for value in values):
        raise TemporalEnergyAcceptanceDurationError(
            "observation duration fields must be timedelta objects"
        )
    if any(value < timedelta(0) for value in values):
        raise TemporalEnergyAcceptanceDurationError(
            "observation durations must not be negative"
        )
    if (
        durations.recorder_present_duration
        + durations.recorder_missing_duration
        != durations.eligible_duration
    ):
        raise TemporalEnergyAcceptanceDurationError(
            "present and missing durations must equal eligible duration"
        )


def calculate_temporal_energy_acceptance_durations(
    acceptances: tuple[TemporalEnergyAcceptance, ...],
    observation_durations: TemporalObservationDurations,
) -> TemporalEnergyAcceptanceDurations:
    """Partition eligible duration into accepted, rejected, and missing."""
    if not isinstance(acceptances, tuple):
        raise TemporalEnergyAcceptanceDurationError("acceptances must be a tuple")
    if not isinstance(observation_durations, TemporalObservationDurations):
        raise TemporalEnergyAcceptanceDurationError(
            "observation_durations must be a TemporalObservationDurations object"
        )
    _validate_observation_durations(observation_durations)

    accepted_duration = timedelta(0)
    rejected_duration = timedelta(0)
    missing_duration = timedelta(0)
    previous_start: datetime | None = None
    previous_end: datetime | None = None

    for index, acceptance in enumerate(acceptances):
        if not isinstance(acceptance, TemporalEnergyAcceptance):
            raise TemporalEnergyAcceptanceDurationError(
                "acceptances must contain TemporalEnergyAcceptance objects"
            )
        observation = acceptance.observation
        if not isinstance(observation, TemporalRecorderObservation):
            raise TemporalEnergyAcceptanceDurationError(
                f"acceptances[{index}].observation must be a TemporalRecorderObservation"
            )
        if not isinstance(observation.evidence, TemporalEvidenceSlice):
            raise TemporalEnergyAcceptanceDurationError(
                f"acceptances[{index}].observation.evidence must be a TemporalEvidenceSlice"
            )
        if type(observation.observation_eligible) is not bool:
            raise TemporalEnergyAcceptanceDurationError(
                f"acceptances[{index}].observation_eligible must be a bool"
            )

        accepted = acceptance.energy_bucket_accepted
        if accepted is not None and type(accepted) is not bool:
            raise TemporalEnergyAcceptanceDurationError(
                f"acceptances[{index}].energy_bucket_accepted is invalid"
            )
        present = observation.recorder_bucket_present
        if accepted is None:
            if observation.observation_eligible or present is not None:
                raise TemporalEnergyAcceptanceDurationError(
                    "non-evaluated energy buckets must be ineligible with null presence"
                )
        else:
            if not observation.observation_eligible or type(present) is not bool:
                raise TemporalEnergyAcceptanceDurationError(
                    "evaluated energy buckets require eligibility and boolean presence"
                )
            if accepted and not present:
                raise TemporalEnergyAcceptanceDurationError(
                    "accepted energy buckets must be present in the Recorder"
                )

        start = _as_utc(
            observation.evidence.start,
            f"acceptances[{index}].observation.evidence.start",
        )
        end = _as_utc(
            observation.evidence.end,
            f"acceptances[{index}].observation.evidence.end",
        )
        if start >= end:
            raise TemporalEnergyAcceptanceDurationError(
                f"acceptances[{index}] interval must be increasing"
            )
        if previous_start is not None and start < previous_start:
            raise TemporalEnergyAcceptanceDurationError(
                "acceptances must be chronologically ordered"
            )
        if previous_end is not None and start < previous_end:
            raise TemporalEnergyAcceptanceDurationError(
                "acceptance intervals must not overlap"
            )

        duration = end - start
        if accepted is True:
            accepted_duration += duration
        elif accepted is False and present:
            rejected_duration += duration
        elif accepted is False:
            missing_duration += duration

        previous_start = start
        previous_end = end

    if (
        accepted_duration + rejected_duration + missing_duration
        != observation_durations.eligible_duration
    ):
        raise TemporalEnergyAcceptanceDurationError(
            "energy durations must equal eligible duration"
        )
    if (
        accepted_duration + rejected_duration
        != observation_durations.recorder_present_duration
    ):
        raise TemporalEnergyAcceptanceDurationError(
            "accepted and rejected durations must equal Recorder-present duration"
        )
    if missing_duration != observation_durations.recorder_missing_duration:
        raise TemporalEnergyAcceptanceDurationError(
            "energy-missing duration must equal Recorder-missing duration"
        )

    return TemporalEnergyAcceptanceDurations(
        observation_durations=observation_durations,
        energy_accepted_duration=accepted_duration,
        energy_rejected_duration=rejected_duration,
        energy_missing_duration=missing_duration,
    )
