"""Classify Recorder observation eligibility for temporal evidence slices."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from .temporal_evidence import TemporalEvidenceSlice
from .temporal_grid import TemporalGridBucket


class TemporalObservationError(ValueError):
    """Raised when temporal observation evidence is structurally invalid."""


@dataclass(frozen=True)
class TemporalRecorderObservation:
    """Recorder bucket eligibility and presence for one evidence slice."""

    evidence: TemporalEvidenceSlice
    observation_eligible: bool
    recorder_bucket_present: bool | None


def _as_utc(value: datetime, field: str) -> datetime:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise TemporalObservationError(
            f"{field} must be a timezone-aware datetime"
        )
    return value.astimezone(timezone.utc)


def classify_temporal_observations(
    evidence: tuple[TemporalEvidenceSlice, ...],
) -> tuple[TemporalRecorderObservation, ...]:
    """Classify native-bucket eligibility and Recorder presence per slice."""
    if not isinstance(evidence, tuple):
        raise TemporalObservationError("evidence must be a tuple")

    result: list[TemporalRecorderObservation] = []
    for index, evidence_slice in enumerate(evidence):
        if not isinstance(evidence_slice, TemporalEvidenceSlice):
            raise TemporalObservationError(
                "evidence items must be TemporalEvidenceSlice objects"
            )
        if not isinstance(evidence_slice.bucket, TemporalGridBucket):
            raise TemporalObservationError(
                f"evidence[{index}].bucket must be a TemporalGridBucket"
            )

        native_start = _as_utc(
            evidence_slice.bucket.native_start,
            f"evidence[{index}].bucket.native_start",
        )
        native_end = _as_utc(
            evidence_slice.bucket.native_end,
            f"evidence[{index}].bucket.native_end",
        )
        start = _as_utc(evidence_slice.start, f"evidence[{index}].start")
        end = _as_utc(evidence_slice.end, f"evidence[{index}].end")

        if native_start >= native_end:
            raise TemporalObservationError(
                f"evidence[{index}] native bucket must be increasing"
            )
        if start >= end:
            raise TemporalObservationError(
                f"evidence[{index}] slice must be increasing"
            )
        if start < native_start or end > native_end:
            raise TemporalObservationError(
                f"evidence[{index}] slice must be contained in its native bucket"
            )

        eligible = (
            evidence_slice.segment is not None
            and start == native_start
            and end == native_end
        )
        if evidence_slice.segment is None:
            if evidence_slice.points or evidence_slice.issues:
                raise TemporalObservationError(
                    f"evidence[{index}] outside source cannot contain observations"
                )
        elif eligible:
            if any(issue.reason == "partial_bucket" for issue in evidence_slice.issues):
                raise TemporalObservationError(
                    f"evidence[{index}] full bucket cannot contain partial_bucket"
                )
        else:
            if evidence_slice.points:
                raise TemporalObservationError(
                    f"evidence[{index}] partial slice cannot contain points"
                )
            if any(issue.reason != "partial_bucket" for issue in evidence_slice.issues):
                raise TemporalObservationError(
                    f"evidence[{index}] partial slice contains a non-partial issue"
                )

        present = bool(evidence_slice.points or evidence_slice.issues) if eligible else None
        result.append(
            TemporalRecorderObservation(
                evidence=evidence_slice,
                observation_eligible=eligible,
                recorder_bucket_present=present,
            )
        )

    return tuple(result)
