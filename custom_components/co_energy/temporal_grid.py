"""Build nominal UTC temporal-grid intersections for explicit intervals."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


class TemporalGridError(ValueError):
    """Raised when a temporal grid cannot be built."""


@dataclass(frozen=True)
class TemporalGridBucket:
    """One native UTC bucket and its effective requested intersection."""

    native_start: datetime
    native_end: datetime
    start: datetime
    end: datetime


_PERIOD_SECONDS = {
    "hour": 3600,
    "5minute": 300,
}


def _is_aware(value: datetime) -> bool:
    return value.tzinfo is not None and value.utcoffset() is not None


def _native_bucket_start(value: datetime, period_seconds: int) -> datetime:
    midnight = value.replace(hour=0, minute=0, second=0, microsecond=0)
    seconds_since_midnight = value.hour * 3600 + value.minute * 60 + value.second
    offset_seconds = seconds_since_midnight // period_seconds * period_seconds
    return midnight + timedelta(seconds=offset_seconds)


def build_temporal_grid(
    start: datetime,
    end: datetime,
    statistics_period: str,
) -> tuple[TemporalGridBucket, ...]:
    """Return native UTC buckets intersecting the half-open input interval."""
    if not isinstance(start, datetime) or not _is_aware(start):
        raise TemporalGridError("start must be a timezone-aware datetime")
    if not isinstance(end, datetime) or not _is_aware(end):
        raise TemporalGridError("end must be a timezone-aware datetime")
    if (
        not isinstance(statistics_period, str)
        or statistics_period not in _PERIOD_SECONDS
    ):
        raise TemporalGridError(
            f"unsupported statistics period: {statistics_period}"
        )

    start_utc = start.astimezone(timezone.utc)
    end_utc = end.astimezone(timezone.utc)
    if start_utc >= end_utc:
        raise TemporalGridError("start must be earlier than end")
    bucket_duration = timedelta(seconds=_PERIOD_SECONDS[statistics_period])
    native_start = _native_bucket_start(start_utc, _PERIOD_SECONDS[statistics_period])
    buckets: list[TemporalGridBucket] = []

    while native_start < end_utc:
        native_end = native_start + bucket_duration
        effective_start = max(native_start, start_utc)
        effective_end = min(native_end, end_utc)
        if effective_start < effective_end:
            buckets.append(
                TemporalGridBucket(
                    native_start=native_start,
                    native_end=native_end,
                    start=effective_start,
                    end=effective_end,
                )
            )
        native_start = native_end

    return tuple(buckets)
