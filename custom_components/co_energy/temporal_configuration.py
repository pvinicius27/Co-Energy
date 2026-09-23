"""Calculate structural source-configuration durations from temporal evidence."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from .temporal_evidence import TemporalEvidenceSlice


class TemporalConfigurationError(ValueError):
    """Raised when structural temporal durations cannot be calculated."""


@dataclass(frozen=True)
class TemporalConfigurationDurations:
    """Exact structural durations for one continuous requested interval."""

    requested_duration: timedelta
    configured_duration: timedelta
    outside_configured_source_duration: timedelta


def _as_utc(value: datetime, field: str) -> datetime:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise TemporalConfigurationError(
            f"{field} must be a timezone-aware datetime"
        )
    return value.astimezone(timezone.utc)


def calculate_temporal_configuration(
    evidence: tuple[TemporalEvidenceSlice, ...],
) -> TemporalConfigurationDurations:
    """Return exact durations derived only from temporal slice topology."""
    if not isinstance(evidence, tuple):
        raise TemporalConfigurationError("evidence must be a tuple")
    if not evidence:
        raise TemporalConfigurationError("evidence must not be empty")

    configured_duration = timedelta(0)
    outside_duration = timedelta(0)
    first_start: datetime | None = None
    previous_start: datetime | None = None
    previous_end: datetime | None = None

    for index, evidence_slice in enumerate(evidence):
        if not isinstance(evidence_slice, TemporalEvidenceSlice):
            raise TemporalConfigurationError(
                "evidence items must be TemporalEvidenceSlice objects"
            )
        start = _as_utc(evidence_slice.start, f"evidence[{index}].start")
        end = _as_utc(evidence_slice.end, f"evidence[{index}].end")
        if start >= end:
            raise TemporalConfigurationError(
                f"evidence[{index}].start must be earlier than end"
            )
        if previous_start is not None and start < previous_start:
            raise TemporalConfigurationError("evidence must be chronologically ordered")
        if previous_end is not None and start != previous_end:
            raise TemporalConfigurationError("evidence must be continuous")

        if first_start is None:
            first_start = start
        duration = end - start
        if evidence_slice.segment is None:
            outside_duration += duration
        else:
            configured_duration += duration
        previous_start = start
        previous_end = end

    requested_duration = previous_end - first_start
    if requested_duration <= timedelta(0):
        raise TemporalConfigurationError("requested duration must be positive")
    if configured_duration + outside_duration != requested_duration:
        raise TemporalConfigurationError(
            "configured and outside durations must equal requested duration"
        )

    return TemporalConfigurationDurations(
        requested_duration=requested_duration,
        configured_duration=configured_duration,
        outside_configured_source_duration=outside_duration,
    )
