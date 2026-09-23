"""Aggregate objective durations from classified temporal observations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from .temporal_evidence import TemporalEvidenceSlice
from .temporal_observation import TemporalRecorderObservation


class TemporalObservationDurationError(ValueError):
    """Raised when observation durations cannot be calculated consistently."""


@dataclass(frozen=True)
class TemporalObservationDurations:
    """Exact durations represented by eligible Recorder observations."""

    eligible_duration: timedelta
    recorder_present_duration: timedelta
    recorder_missing_duration: timedelta


def _as_utc(value: datetime, field: str) -> datetime:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise TemporalObservationDurationError(
            f"{field} must be a timezone-aware datetime"
        )
    return value.astimezone(timezone.utc)


def calculate_temporal_observation_durations(
    observations: tuple[TemporalRecorderObservation, ...],
) -> TemporalObservationDurations:
    """Sum durations using only previously classified observations."""
    if not isinstance(observations, tuple):
        raise TemporalObservationDurationError("observations must be a tuple")

    eligible_duration = timedelta(0)
    present_duration = timedelta(0)
    missing_duration = timedelta(0)
    previous_start: datetime | None = None
    previous_end: datetime | None = None

    for index, observation in enumerate(observations):
        if not isinstance(observation, TemporalRecorderObservation):
            raise TemporalObservationDurationError(
                "observations must contain TemporalRecorderObservation objects"
            )
        if not isinstance(observation.evidence, TemporalEvidenceSlice):
            raise TemporalObservationDurationError(
                f"observations[{index}].evidence must be a TemporalEvidenceSlice"
            )
        if type(observation.observation_eligible) is not bool:
            raise TemporalObservationDurationError(
                f"observations[{index}].observation_eligible must be a bool"
            )

        start = _as_utc(
            observation.evidence.start,
            f"observations[{index}].evidence.start",
        )
        end = _as_utc(
            observation.evidence.end,
            f"observations[{index}].evidence.end",
        )
        if start >= end:
            raise TemporalObservationDurationError(
                f"observations[{index}] interval must be increasing"
            )
        if previous_start is not None and start < previous_start:
            raise TemporalObservationDurationError(
                "observations must be chronologically ordered"
            )
        if previous_end is not None and start < previous_end:
            raise TemporalObservationDurationError(
                "observation intervals must not overlap"
            )

        present = observation.recorder_bucket_present
        if observation.observation_eligible:
            if type(present) is not bool:
                raise TemporalObservationDurationError(
                    "eligible observations require boolean Recorder presence"
                )
            duration = end - start
            eligible_duration += duration
            if present:
                present_duration += duration
            else:
                missing_duration += duration
        elif present is not None:
            raise TemporalObservationDurationError(
                "ineligible observations require null Recorder presence"
            )

        previous_start = start
        previous_end = end

    if present_duration + missing_duration != eligible_duration:
        raise TemporalObservationDurationError(
            "present and missing durations must equal eligible duration"
        )

    return TemporalObservationDurations(
        eligible_duration=eligible_duration,
        recorder_present_duration=present_duration,
        recorder_missing_duration=missing_duration,
    )
