"""Classify accepted energy values for temporal Recorder observations."""

from __future__ import annotations

from dataclasses import dataclass
import math

from .logical_series import LogicalSeriesIssue, LogicalSeriesPoint
from .temporal_evidence import TemporalEvidenceSlice
from .temporal_observation import TemporalRecorderObservation


class TemporalEnergyAcceptanceError(ValueError):
    """Raised when temporal energy acceptance is structurally inconsistent."""


@dataclass(frozen=True)
class TemporalEnergyAcceptance:
    """Accepted-energy classification for one Recorder observation."""

    observation: TemporalRecorderObservation
    energy_bucket_accepted: bool | None


def _validate_point_value(point: LogicalSeriesPoint, index: int) -> None:
    value = point.value
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or value < 0
    ):
        raise TemporalEnergyAcceptanceError(
            f"observations[{index}] point value must be finite and non-negative"
        )


def classify_temporal_energy_acceptance(
    observations: tuple[TemporalRecorderObservation, ...],
) -> tuple[TemporalEnergyAcceptance, ...]:
    """Classify whether each eligible bucket has one accepted energy point."""
    if not isinstance(observations, tuple):
        raise TemporalEnergyAcceptanceError("observations must be a tuple")

    result: list[TemporalEnergyAcceptance] = []
    for index, observation in enumerate(observations):
        if not isinstance(observation, TemporalRecorderObservation):
            raise TemporalEnergyAcceptanceError(
                "observations must contain TemporalRecorderObservation objects"
            )
        if not isinstance(observation.evidence, TemporalEvidenceSlice):
            raise TemporalEnergyAcceptanceError(
                f"observations[{index}].evidence must be a TemporalEvidenceSlice"
            )
        if type(observation.observation_eligible) is not bool:
            raise TemporalEnergyAcceptanceError(
                f"observations[{index}].observation_eligible must be a bool"
            )

        evidence = observation.evidence
        if any(not isinstance(point, LogicalSeriesPoint) for point in evidence.points):
            raise TemporalEnergyAcceptanceError(
                f"observations[{index}] contains an invalid point"
            )
        if any(not isinstance(issue, LogicalSeriesIssue) for issue in evidence.issues):
            raise TemporalEnergyAcceptanceError(
                f"observations[{index}] contains an invalid issue"
            )

        present = observation.recorder_bucket_present
        if not observation.observation_eligible:
            if present is not None:
                raise TemporalEnergyAcceptanceError(
                    "ineligible observations require null Recorder presence"
                )
            if evidence.points:
                raise TemporalEnergyAcceptanceError(
                    "ineligible observations cannot contain accepted points"
                )
            accepted = None
        else:
            if type(present) is not bool:
                raise TemporalEnergyAcceptanceError(
                    "eligible observations require boolean Recorder presence"
                )
            if not present:
                if evidence.points or evidence.issues:
                    raise TemporalEnergyAcceptanceError(
                        "absent Recorder buckets cannot contain evidence"
                    )
                accepted = False
            else:
                point_count = len(evidence.points)
                issue_count = len(evidence.issues)
                if point_count + issue_count != 1:
                    raise TemporalEnergyAcceptanceError(
                        "present Recorder buckets require exactly one evidence item"
                    )
                if point_count == 1:
                    _validate_point_value(evidence.points[0], index)
                    accepted = True
                else:
                    if evidence.issues[0].reason == "partial_bucket":
                        raise TemporalEnergyAcceptanceError(
                            "partial_bucket cannot belong to an eligible observation"
                        )
                    accepted = False

        result.append(
            TemporalEnergyAcceptance(
                observation=observation,
                energy_bucket_accepted=accepted,
            )
        )

    return tuple(result)
