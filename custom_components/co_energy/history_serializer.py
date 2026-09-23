"""Explicit public serialization for calendar energy history."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .history import HistoryIssueCount, HistoryPoint, HistoryResult, HistorySeries
from .periods import Period


class HistorySerializationError(ValueError):
    """Raised when history cannot be serialized safely."""


def _require_type(value: Any, expected: type, field: str) -> None:
    if not isinstance(value, expected):
        raise HistorySerializationError(f"{field} must be a {expected.__name__}")


def _datetime(value: Any, field: str) -> str:
    if (
        not isinstance(value, datetime)
        or value.tzinfo is None
        or value.utcoffset() is None
    ):
        raise HistorySerializationError(f"{field} must be timezone-aware")
    return value.isoformat()


def _period(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, Period, field)
    timezone_name = getattr(value.start.tzinfo, "key", None) or str(
        value.start.tzinfo
    )
    return {
        "mode": value.mode,
        "reference": value.reference,
        "start": _datetime(value.start, f"{field}.start"),
        "end": _datetime(value.end, f"{field}.end"),
        "timezone": timezone_name,
    }


def _point(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, HistoryPoint, field)
    if not isinstance(value.issues, tuple):
        raise HistorySerializationError(f"{field}.issues must be a tuple")
    return {
        "start": _datetime(value.start, f"{field}.start"),
        "end": _datetime(value.end, f"{field}.end"),
        "value": value.value,
        "complete": value.complete,
        "issues": list(value.issues),
    }


def _issue_count(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, HistoryIssueCount, field)
    return {"reason": value.reason, "count": value.count}


def _series(value: Any, field: str) -> dict[str, Any]:
    _require_type(value, HistorySeries, field)
    if not isinstance(value.points, tuple):
        raise HistorySerializationError(f"{field}.points must be a tuple")
    if not isinstance(value.issue_counts, tuple):
        raise HistorySerializationError(f"{field}.issue_counts must be a tuple")
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "quantity": value.quantity,
        "unit": value.unit,
        "classification": value.classification,
        "total": value.total,
        "point_count": value.point_count,
        "issue_count": value.issue_count,
        "issue_counts": [
            _issue_count(item, f"{field}.issue_counts[{index}]")
            for index, item in enumerate(value.issue_counts)
        ],
        "points": [
            _point(item, f"{field}.points[{index}]")
            for index, item in enumerate(value.points)
        ],
    }


def serialize_history(history: HistoryResult) -> dict[str, Any]:
    """Serialize calendar history into its frozen public contract."""
    _require_type(history, HistoryResult, "history")
    if not isinstance(history.series, tuple):
        raise HistorySerializationError("history.series must be a tuple")
    return {
        "unit_id": history.unit_id,
        "available": history.available,
        "mode": history.mode,
        "period": _period(history.period, "history.period"),
        "resolution": history.resolution,
        "series": [
            _series(item, f"history.series[{index}]")
            for index, item in enumerate(history.series)
        ],
    }
