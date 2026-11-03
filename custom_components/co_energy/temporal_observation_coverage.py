"""Calculate Recorder observation coverage from aggregated durations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from .temporal_observation_duration import TemporalObservationDurations


class TemporalObservationCoverageError(ValueError):
    """Raised when Recorder observation coverage cannot be calculated."""


@dataclass(frozen=True)
class TemporalObservationCoverage:
    """Recorder observation coverage for validated temporal durations."""

    durations: TemporalObservationDurations
    recorder_observation_coverage_ratio: float | None


def calculate_temporal_observation_coverage(
    durations: TemporalObservationDurations,
) -> TemporalObservationCoverage:
    """Return the fraction of eligible duration present in the Recorder."""
    if not isinstance(durations, TemporalObservationDurations):
        raise TemporalObservationCoverageError(
            "durations must be a TemporalObservationDurations object"
        )

    values = (
        durations.eligible_duration,
        durations.recorder_present_duration,
        durations.recorder_missing_duration,
    )
    if any(not isinstance(value, timedelta) for value in values):
        raise TemporalObservationCoverageError(
            "observation duration fields must be timedelta objects"
        )
    if any(value < timedelta(0) for value in values):
        raise TemporalObservationCoverageError(
            "observation durations must not be negative"
        )
    if (
        durations.recorder_present_duration
        + durations.recorder_missing_duration
        != durations.eligible_duration
    ):
        raise TemporalObservationCoverageError(
            "present and missing durations must equal eligible duration"
        )

    if durations.eligible_duration == timedelta(0):
        ratio = None
    else:
        ratio = (
            durations.recorder_present_duration
            / durations.eligible_duration
        )
        if not 0.0 <= ratio <= 1.0:
            raise TemporalObservationCoverageError(
                "Recorder observation coverage ratio must be between zero and one"
            )

    return TemporalObservationCoverage(
        durations=durations,
        recorder_observation_coverage_ratio=ratio,
    )
