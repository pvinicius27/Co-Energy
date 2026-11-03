"""Explicit public serializer for the instantaneous statistics contract."""

from __future__ import annotations

from datetime import datetime
import math
from typing import Any

from .instant_statistics import (
    INSTANT_QUANTITIES,
    RESOLUTION,
    InstantMeasurementStatistics,
    InstantStatistics,
)


class InstantStatisticsSerializationError(ValueError):
    """Raised when instantaneous statistics cannot be serialized safely."""


def _number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise InstantStatisticsSerializationError(f"{field} must be numeric or None")
    numeric = float(value)
    if not math.isfinite(numeric):
        raise InstantStatisticsSerializationError(f"{field} must be finite")
    return numeric


def _instant(value: Any, field: str) -> str:
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise InstantStatisticsSerializationError(f"{field} must be an aware datetime")
    return value.isoformat()


def _serialize_measurement(
    value: InstantMeasurementStatistics, field: str
) -> dict[str, Any]:
    if not isinstance(value, InstantMeasurementStatistics):
        raise InstantStatisticsSerializationError(
            f"{field} must be an InstantMeasurementStatistics"
        )
    if value.quantity not in INSTANT_QUANTITIES:
        raise InstantStatisticsSerializationError(f"{field}.quantity is unsupported")
    minimo = _number(value.minimum, f"{field}.minimum")
    maximo = _number(value.maximum, f"{field}.maximum")
    if minimo is not None and maximo is not None and minimo > maximo:
        raise InstantStatisticsSerializationError(
            f"{field}.minimum must not exceed {field}.maximum"
        )
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "quantity": value.quantity,
        "unit": value.unit,
        "minimum": minimo,
        "maximum": maximo,
        # A serie viaja como pares [instante, media]. Um ponto sem media e
        # intervalo que o Recorder nao gravou: viaja como null, e nao some,
        # senao a linha se fecharia por cima de uma lacuna real.
        "points": [
            [
                _instant(point.start, f"{field}.points[{index}].start"),
                _number(point.mean, f"{field}.points[{index}].mean"),
            ]
            for index, point in enumerate(value.points)
        ],
    }


def serialize_instant_statistics(result: InstantStatistics) -> dict[str, Any]:
    """Serialize through an explicit allowlist; the domain owns every value."""
    if not isinstance(result, InstantStatistics):
        raise InstantStatisticsSerializationError("result must be an InstantStatistics")
    if result.resolution != RESOLUTION:
        raise InstantStatisticsSerializationError(
            f"resolution must be {RESOLUTION!r}"
        )
    return {
        "unit_id": result.unit_id,
        "resolution": result.resolution,
        "period": {
            "start": _instant(result.period_start, "period_start"),
            "end": _instant(result.period_end, "period_end"),
        },
        "measurements": [
            _serialize_measurement(measurement, f"measurements[{index}]")
            for index, measurement in enumerate(result.measurements)
        ],
    }
