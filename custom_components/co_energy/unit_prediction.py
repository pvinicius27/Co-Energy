"""Select the configured prediction engine for one unit cycle."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .energy_model import EnergyModelError, get_forecast_method
from .unit_bill_only_estimate import (
    UnitBillOnlyEstimate,
    build_unit_bill_only_estimate,
)
from .unit_cycle_energy import UnitCycleEnergyContext
from .unit_cycle_forecast import (
    UnitCycleForecast,
    build_default_unit_cycle_forecast,
)


class UnitPredictionError(ValueError):
    """Raised when a unit prediction engine cannot be selected."""


UnitPrediction = UnitCycleForecast | UnitBillOnlyEstimate


def build_unit_prediction(
    model: Mapping[str, Any],
    cycle_energy: UnitCycleEnergyContext,
) -> UnitPrediction | None:
    """Run the prediction engine explicitly configured for one unit."""
    if not isinstance(cycle_energy, UnitCycleEnergyContext):
        raise UnitPredictionError("cycle_energy must be a UnitCycleEnergyContext")

    try:
        method = get_forecast_method(model, cycle_energy.unit_id)
    except EnergyModelError as error:
        raise UnitPredictionError(
            f"could not resolve prediction method for unit {cycle_energy.unit_id!r}"
        ) from error

    if method is None:
        return None
    if method == "physical_linear":
        return build_default_unit_cycle_forecast(model, cycle_energy)
    if method == "bill_only_previous_cycle":
        return build_unit_bill_only_estimate(cycle_energy.cycle)
    raise UnitPredictionError(
        f"unsupported prediction method {method!r} for unit {cycle_energy.unit_id!r}"
    )
