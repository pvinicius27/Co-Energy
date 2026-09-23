"""Explicit public serialization for period comparison."""

from __future__ import annotations

from datetime import date
import re
from typing import Any

from .comparison import (
    AUTOMATIC_STRATEGY,
    CUSTOM_DIFFERENT_DURATION,
    CUSTOM_EQUAL_DURATION,
    CUSTOM_STRATEGY,
    CYCLE_PERIOD_TYPE,
    DAY_PERIOD_TYPE,
    RANGE_PERIOD_TYPE,
    ROLLING_DAYS_MODE,
    ComparisonMetric,
    ComparisonRequestedRange,
    ComparisonResult,
    ComparisonSide,
)
from .history_serializer import HistorySerializationError, _period, _series


class ComparisonSerializationError(ValueError):
    """Raised when comparison cannot be serialized safely."""


def _range_date(value: Any, field: str) -> date:
    if not isinstance(value, str) or re.fullmatch(r"\d{4}-\d{2}-\d{2}", value) is None:
        raise ComparisonSerializationError(f"{field} must use strict YYYY-MM-DD")
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise ComparisonSerializationError(f"{field} must be a valid date") from error


def _available_metrics(value: Any, field: str) -> list[dict[str, str]]:
    if not isinstance(value, tuple) or not value:
        raise ComparisonSerializationError(f"{field} must be a non-empty tuple")
    serialized = []
    seen = set()
    for index, metric in enumerate(value):
        item = f"{field}[{index}]"
        if not isinstance(metric, ComparisonMetric):
            raise ComparisonSerializationError(f"{item} must be a ComparisonMetric")
        for attribute in ("logical_id", "label"):
            text = getattr(metric, attribute)
            if not isinstance(text, str) or not text.strip():
                raise ComparisonSerializationError(f"{item}.{attribute} must be non-empty")
        if metric.logical_id in seen:
            raise ComparisonSerializationError(f"{item}.logical_id is duplicated")
        seen.add(metric.logical_id)
        serialized.append({"logical_id": metric.logical_id, "label": metric.label})
    return serialized


def _side(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, ComparisonSide):
        raise ComparisonSerializationError(f"{field} must be a ComparisonSide")
    if not isinstance(value.reference, str) or not value.reference.strip():
        raise ComparisonSerializationError(f"{field}.reference must be non-empty")
    try:
        period = _period(value.period, f"{field}.period")
        series = _series(value.series, f"{field}.series")
    except HistorySerializationError as error:
        raise ComparisonSerializationError(str(error)) from error
    result = {"reference": value.reference, "period": period, "series": series}
    if value.requested_range is not None or value.duration_days is not None:
        if not isinstance(value.requested_range, ComparisonRequestedRange):
            raise ComparisonSerializationError(
                f"{field}.requested_range must be a ComparisonRequestedRange"
            )
        if (
            isinstance(value.duration_days, bool)
            or not isinstance(value.duration_days, (int, float))
            or value.duration_days <= 0
        ):
            raise ComparisonSerializationError(f"{field}.duration_days must be positive")
        start_date = _range_date(
            value.requested_range.start_date,
            f"{field}.requested_range.start_date",
        )
        end_date = _range_date(
            value.requested_range.end_date,
            f"{field}.requested_range.end_date",
        )
        if start_date > end_date:
            raise ComparisonSerializationError(
                f"{field}.requested_range start must not be later than end"
            )
        result["requested_range"] = {
            "start_date": value.requested_range.start_date,
            "end_date": value.requested_range.end_date,
        }
        result["duration_days"] = value.duration_days
    return result


def serialize_comparison(comparison: ComparisonResult) -> dict[str, Any]:
    """Serialize a comparison into its public contract."""
    if not isinstance(comparison, ComparisonResult):
        raise ComparisonSerializationError("comparison must be a ComparisonResult")
    for field in (
        "unit_id", "mode", "logical_id", "resolution", "strategy", "alignment"
    ):
        value = getattr(comparison, field)
        if not isinstance(value, str) or not value.strip():
            raise ComparisonSerializationError(f"comparison.{field} must be non-empty")
    if comparison.strategy not in (AUTOMATIC_STRATEGY, CUSTOM_STRATEGY):
        raise ComparisonSerializationError("comparison.strategy is invalid")
    if comparison.strategy == AUTOMATIC_STRATEGY and comparison.mode not in (
        "day", "month", ROLLING_DAYS_MODE
    ):
        raise ComparisonSerializationError("automatic comparison.mode is invalid")
    if comparison.strategy == CUSTOM_STRATEGY and comparison.mode != "custom":
        raise ComparisonSerializationError("custom comparison.mode must be custom")
    allowed_resolutions = (
        ("day", "hour") if comparison.strategy == CUSTOM_STRATEGY
        else (("hour",) if comparison.mode == "day" else ("day",))
    )
    if comparison.resolution not in allowed_resolutions:
        raise ComparisonSerializationError("comparison.resolution is invalid")
    if comparison.mode == ROLLING_DAYS_MODE:
        if (
            isinstance(comparison.window_days, bool)
            or not isinstance(comparison.window_days, int)
            or comparison.window_days <= 0
        ):
            raise ComparisonSerializationError(
                "rolling comparison.window_days must be a positive integer"
            )
    elif comparison.window_days is not None:
        raise ComparisonSerializationError(
            "comparison.window_days is only valid for rolling_days"
        )
    allowed_alignments = (
        ("full_periods", "equivalent_elapsed")
        if comparison.strategy == AUTOMATIC_STRATEGY
        else (CUSTOM_EQUAL_DURATION, CUSTOM_DIFFERENT_DURATION)
    )
    if comparison.alignment not in allowed_alignments:
        raise ComparisonSerializationError("comparison.alignment is invalid")
    if comparison.strategy == AUTOMATIC_STRATEGY and any(
        value is not None
        for side in (comparison.base, comparison.comparison)
        for value in (side.requested_range, side.duration_days)
    ):
        raise ComparisonSerializationError(
            "automatic comparison sides must not contain custom range fields"
        )
    if comparison.strategy == CUSTOM_STRATEGY and any(
        side.requested_range is None or side.duration_days is None
        for side in (comparison.base, comparison.comparison)
    ):
        raise ComparisonSerializationError(
            "custom comparison sides require range and duration"
        )
    if comparison.strategy == CUSTOM_STRATEGY:
        single_day_sides = tuple(
            side.requested_range.start_date == side.requested_range.end_date
            for side in (comparison.base, comparison.comparison)
        )
        if (
            comparison.period_type != CYCLE_PERIOD_TYPE
            and single_day_sides[0] != single_day_sides[1]
        ):
            raise ComparisonSerializationError(
                "custom comparison sides must use the same semantic range type"
            )
        inferred_period_type = (
            DAY_PERIOD_TYPE if single_day_sides[0] else RANGE_PERIOD_TYPE
        )
        if comparison.period_type not in (
            None, DAY_PERIOD_TYPE, RANGE_PERIOD_TYPE, CYCLE_PERIOD_TYPE
        ):
            raise ComparisonSerializationError("custom comparison.period_type is invalid")
        # O tipo ciclo nao se infere das datas pedidas: elas nao foram pedidas,
        # foram derivadas dos proprios ciclos de faturamento. Exigir que
        # coincidissem com a inferencia recusaria toda comparacao de ciclo que
        # calhasse de comecar e terminar no mesmo dia civil.
        if (
            comparison.period_type is not None
            and comparison.period_type != CYCLE_PERIOD_TYPE
            and comparison.period_type != inferred_period_type
        ):
            raise ComparisonSerializationError(
                "custom comparison.period_type does not match requested ranges"
            )
    elif comparison.period_type is not None:
        raise ComparisonSerializationError(
            "automatic comparison.period_type must be omitted"
        )
    if comparison.strategy == CUSTOM_STRATEGY and comparison.resolution == "hour":
        for side in (comparison.base, comparison.comparison):
            start = _range_date(side.requested_range.start_date, "requested start")
            end = _range_date(side.requested_range.end_date, "requested end")
            if (end - start).days + 1 > 7:
                raise ComparisonSerializationError(
                    "hourly custom ranges may contain at most 7 civil dates"
                )
    if comparison.base.series.logical_id != comparison.logical_id:
        raise ComparisonSerializationError("base logical_id does not match comparison")
    if comparison.comparison.series.logical_id != comparison.logical_id:
        raise ComparisonSerializationError(
            "comparison logical_id does not match comparison"
        )
    result = {
        "unit_id": comparison.unit_id,
        "mode": comparison.mode,
        "logical_id": comparison.logical_id,
        "resolution": comparison.resolution,
        "strategy": comparison.strategy,
        "alignment": comparison.alignment,
        "base": _side(comparison.base, "comparison.base"),
        "comparison": _side(comparison.comparison, "comparison.comparison"),
        "available_metrics": _available_metrics(
            comparison.available_metrics, "comparison.available_metrics"
        ),
    }
    if comparison.window_days is not None:
        result["window_days"] = comparison.window_days
    if comparison.strategy == CUSTOM_STRATEGY:
        result["period_type"] = comparison.period_type or inferred_period_type
    return result
