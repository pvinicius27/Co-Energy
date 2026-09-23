"""Apply linear forecasting to one explicitly selected current-cycle metric."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .energy_model import EnergyModelError, get_forecast_target_logical_id
from .forecast import (
    ForecastError,
    LinearCycleForecast,
    calculate_linear_cycle_forecast,
)
from .unit_cycle_energy import UnitCycleEnergyContext


class UnitCycleForecastError(ValueError):
    """Raised when a unit-cycle forecast cannot be assembled."""


@dataclass(frozen=True)
class UnitCycleForecast:
    """Linear forecast and logical metadata for one selected energy metric."""

    unit_id: str
    logical_id: str
    label: str
    quantity: str
    unit: str
    classification: str
    forecast: LinearCycleForecast


def build_default_unit_cycle_forecast(
    model: Mapping[str, Any],
    cycle_energy: UnitCycleEnergyContext,
) -> UnitCycleForecast | None:
    """Forecast the unit metric selected by the declarative energy model."""
    try:
        logical_id = get_forecast_target_logical_id(
            model,
            cycle_energy.unit_id,
        )
    except EnergyModelError as error:
        raise UnitCycleForecastError(
            f"could not resolve default forecast target for unit {cycle_energy.unit_id!r}"
        ) from error
    if logical_id is None:
        return None
    return build_unit_cycle_forecast(cycle_energy, logical_id)


def _validate_logical_id(unit_id: str, logical_id: str) -> None:
    if not isinstance(logical_id, str) or not logical_id.strip():
        raise UnitCycleForecastError("logical_id must be a non-empty string")
    parts = logical_id.split(".")
    if len(parts) != 2 or not all(part.strip() for part in parts):
        raise UnitCycleForecastError("logical_id must use <unit_id>.<metric_id> format")
    if parts[0] != unit_id:
        raise UnitCycleForecastError("logical_id must belong to cycle energy unit")


def build_unit_cycle_forecast(
    cycle_energy: UnitCycleEnergyContext,
    logical_id: str,
) -> UnitCycleForecast | None:
    """Forecast one explicitly selected metric from the current cycle."""
    _validate_logical_id(cycle_energy.unit_id, logical_id)

    summary = cycle_energy.current_energy
    observed_period = cycle_energy.cycle.current_elapsed_period
    expected_end = cycle_energy.cycle.expected_next_reading
    if summary is None or observed_period is None or expected_end is None:
        return None
    if summary.period is not observed_period:
        raise UnitCycleForecastError(
            "current energy period must be the current elapsed period"
        )

    matches = tuple(
        metric for metric in summary.metrics if metric.logical_id == logical_id
    )
    if len(matches) != 1:
        raise UnitCycleForecastError(
            f"expected exactly one metric {logical_id!r} for unit {cycle_energy.unit_id!r}"
        )
    metric = matches[0]
    if metric.quantity != "energy":
        raise UnitCycleForecastError(
            f"metric {logical_id!r} for unit {cycle_energy.unit_id!r} must be energy"
        )

    try:
        forecast = calculate_linear_cycle_forecast(
            metric.value,
            observed_period,
            expected_end,
        )
    except ForecastError as error:
        raise UnitCycleForecastError(
            f"could not forecast {logical_id!r} for unit {cycle_energy.unit_id!r}"
        ) from error

    return UnitCycleForecast(
        unit_id=cycle_energy.unit_id,
        logical_id=metric.logical_id,
        label=metric.label,
        quantity=metric.quantity,
        unit=metric.unit,
        classification="projected",
        forecast=forecast,
    )
