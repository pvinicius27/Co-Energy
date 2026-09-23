"""Isolated access to Home Assistant Recorder statistics.

The adapter receives explicit half-open intervals ``[start, end)`` and only
normalizes Recorder data. It does not apply energy-domain rules.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from numbers import Real
from typing import Any


# Native Recorder day/week/month/year periods may realign temporal boundaries.
# This initial adapter therefore uses only fine-grained periods; higher-level
# layers will aggregate them while preserving intervals defined by periods.py.
ALLOWED_PERIODS = frozenset({"5minute", "hour"})
# mean/min/max descrevem uma grandeza instantanea dentro do intervalo;
# change/sum/state descrevem um acumulador. Sao familias distintas, e o
# adaptador so normaliza: quem pede escolhe qual faz sentido para a
# grandeza que esta lendo.
ALLOWED_TYPES = frozenset({"change", "sum", "state", "mean", "min", "max"})
NATIVE_DURATIONS = {
    "5minute": timedelta(minutes=5),
    "hour": timedelta(hours=1),
}


class RecorderAdapterError(ValueError):
    """Raised when Recorder parameters or results are invalid."""


@dataclass(frozen=True)
class RecorderStatisticsPoint:
    """A normalized Recorder statistics point."""

    start: datetime
    end: datetime
    change: float | None = None
    sum: float | None = None
    state: float | None = None
    mean: float | None = None
    min: float | None = None
    max: float | None = None


@dataclass(frozen=True)
class RecorderStatisticsResult:
    """Normalized statistics returned for one statistic ID."""

    statistic_id: str
    period: str
    points: tuple[RecorderStatisticsPoint, ...]


def _is_aware(value: datetime) -> bool:
    return value.tzinfo is not None and value.utcoffset() is not None


def _validate_parameters(
    statistic_id: str,
    start: datetime,
    end: datetime,
    period: str,
    types: set[str] | frozenset[str],
    units: Mapping[str, str] | None,
) -> None:
    if not isinstance(statistic_id, str) or not statistic_id.strip():
        raise RecorderAdapterError("statistic_id must be a non-empty string")
    if not isinstance(start, datetime) or not _is_aware(start):
        raise RecorderAdapterError("start must be a timezone-aware datetime")
    if not isinstance(end, datetime) or not _is_aware(end):
        raise RecorderAdapterError("end must be a timezone-aware datetime")
    if start >= end:
        raise RecorderAdapterError("end must be later than start")
    if period not in ALLOWED_PERIODS:
        raise RecorderAdapterError(f"unsupported statistics period: {period}")
    if not isinstance(types, (set, frozenset)):
        raise RecorderAdapterError("types must be a set or frozenset")
    unsupported_types = types - ALLOWED_TYPES
    if unsupported_types:
        raise RecorderAdapterError(
            f"unsupported statistics types: {sorted(unsupported_types)}"
        )
    if units is not None:
        if not isinstance(units, Mapping):
            raise RecorderAdapterError("units must be a mapping or None")
        for key, value in units.items():
            if not isinstance(key, str) or not key.strip():
                raise RecorderAdapterError("unit keys must be non-empty strings")
            if not isinstance(value, str) or not value.strip():
                raise RecorderAdapterError("unit values must be non-empty strings")


def _timestamp_to_utc(value: Any, field: str) -> datetime:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise RecorderAdapterError(f"{field} must be a Unix timestamp")
    try:
        return datetime.fromtimestamp(value, tz=timezone.utc)
    except (OverflowError, OSError, ValueError) as error:
        raise RecorderAdapterError(f"{field} is not a valid Unix timestamp") from error


def _optional_number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, Real):
        raise RecorderAdapterError(f"{field} must be numeric or None")
    return float(value)


def _normalize_statistics_result(
    statistic_id: str,
    period: str,
    raw_result: Mapping[str, Any],
    query_start: datetime,
    query_end: datetime,
) -> RecorderStatisticsResult:
    """Normalize a raw Home Assistant statistics response."""
    raw_points = raw_result.get(statistic_id, ())
    points: list[RecorderStatisticsPoint] = []
    previous_start: datetime | None = None
    native_duration = NATIVE_DURATIONS[period]
    for index, raw_point in enumerate(raw_points):
        if not isinstance(raw_point, Mapping):
            raise RecorderAdapterError(f"statistics point {index} must be a mapping")
        if "start" not in raw_point:
            raise RecorderAdapterError(f"statistics point {index} has no start")
        if "end" not in raw_point:
            raise RecorderAdapterError(f"statistics point {index} has no end")
        point_start = _timestamp_to_utc(
            raw_point["start"], f"points[{index}].start"
        )
        point_end = _timestamp_to_utc(raw_point["end"], f"points[{index}].end")
        if period == "hour":
            aligned = (
                point_start.minute == 0
                and point_start.second == 0
                and point_start.microsecond == 0
            )
        else:
            aligned = (
                point_start.minute % 5 == 0
                and point_start.second == 0
                and point_start.microsecond == 0
            )
        if not aligned:
            raise RecorderAdapterError(
                f"statistics point {index} start is not aligned to {period}"
            )
        if point_end != point_start + native_duration:
            raise RecorderAdapterError(
                f"statistics point {index} does not have the native {period} duration"
            )
        if point_start < query_start or point_start >= query_end:
            raise RecorderAdapterError(
                f"statistics point {index} start is outside the query interval"
            )
        if previous_start is not None:
            if point_start == previous_start:
                raise RecorderAdapterError(
                    f"statistics point {index} duplicates the previous start"
                )
            if point_start < previous_start:
                raise RecorderAdapterError(
                    f"statistics point {index} is out of chronological order"
                )
        points.append(
            RecorderStatisticsPoint(
                start=point_start,
                end=point_end,
                change=_optional_number(
                    raw_point.get("change"), f"points[{index}].change"
                ),
                sum=_optional_number(raw_point.get("sum"), f"points[{index}].sum"),
                state=_optional_number(
                    raw_point.get("state"), f"points[{index}].state"
                ),
                mean=_optional_number(
                    raw_point.get("mean"), f"points[{index}].mean"
                ),
                min=_optional_number(raw_point.get("min"), f"points[{index}].min"),
                max=_optional_number(raw_point.get("max"), f"points[{index}].max"),
            )
        )
        previous_start = point_start
    return RecorderStatisticsResult(statistic_id, period, tuple(points))


async def _async_query_statistics(
    hass: Any,
    statistic_id: str,
    start_utc: datetime,
    end_utc: datetime,
    period: str,
    types: set[str] | frozenset[str],
    units: Mapping[str, str] | None,
) -> Mapping[str, Any]:
    """Query statistics through the Recorder-owned executor."""
    from homeassistant.components.recorder.statistics import statistics_during_period
    from homeassistant.components.recorder.util import get_instance

    return await get_instance(hass).async_add_executor_job(
        statistics_during_period,
        hass,
        start_utc,
        end_utc,
        {statistic_id},
        period,
        units,
        types,
    )


async def async_get_statistics(
    hass: Any,
    statistic_id: str,
    start: datetime,
    end: datetime,
    period: str,
    types: set[str] | frozenset[str],
    units: Mapping[str, str] | None = None,
) -> RecorderStatisticsResult:
    """Query and normalize Recorder statistics for one explicit interval."""
    _validate_parameters(statistic_id, start, end, period, types, units)
    start_utc = start.astimezone(timezone.utc)
    end_utc = end.astimezone(timezone.utc)

    try:
        raw_result = await _async_query_statistics(
            hass,
            statistic_id,
            start_utc,
            end_utc,
            period,
            types,
            units,
        )
    except RecorderAdapterError:
        raise
    except Exception as error:
        raise RecorderAdapterError(f"Recorder statistics query failed: {error}") from error

    return _normalize_statistics_result(
        statistic_id, period, raw_result, start_utc, end_utc
    )
