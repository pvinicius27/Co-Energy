"""Orchestrate billing-cycle context with physical unit energy summaries."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from .billing_cycle import (
    BillingCycleContext,
    BillingCycleError,
    get_billing_cycle_context,
)
from .equatorial_adapter import EquatorialDocument
from .unit_energy_summary import (
    UnitEnergySummary,
    UnitEnergySummaryError,
    async_get_unit_energy_summary,
)


class UnitCycleEnergyError(ValueError):
    """Raised when cycle energy orchestration cannot be completed."""


@dataclass(frozen=True)
class UnitCycleEnergyContext:
    """Temporal cycle context with energy for its operational periods."""

    unit_id: str
    statistics_period: str
    cycle: BillingCycleContext
    current_energy: UnitEnergySummary | None
    waiting_bill_energy: UnitEnergySummary | None


async def async_get_unit_cycle_energy(
    hass: Any,
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
    now: datetime,
    statistics_period: str,
) -> UnitCycleEnergyContext:
    """Combine individual cycle periods with their physical energy summaries."""
    if not isinstance(statistics_period, str) or not statistics_period.strip():
        raise UnitCycleEnergyError("statistics_period must be a non-empty string")

    try:
        cycle = get_billing_cycle_context(
            model,
            billing_document,
            unit_id,
            now,
        )
    except BillingCycleError as error:
        raise UnitCycleEnergyError(
            f"could not resolve billing cycle for unit {unit_id!r}"
        ) from error

    waiting_bill_energy = None
    if cycle.waiting_bill_period is not None:
        try:
            waiting_bill_energy = await async_get_unit_energy_summary(
                hass,
                model,
                unit_id,
                cycle.waiting_bill_period,
                statistics_period,
            )
        except UnitEnergySummaryError as error:
            raise UnitCycleEnergyError(
                f"could not resolve waiting bill energy for unit {unit_id!r}"
            ) from error

    current_energy = None
    if cycle.current_elapsed_period is not None:
        try:
            current_energy = await async_get_unit_energy_summary(
                hass,
                model,
                unit_id,
                cycle.current_elapsed_period,
                statistics_period,
            )
        except UnitEnergySummaryError as error:
            raise UnitCycleEnergyError(
                f"could not resolve current cycle energy for unit {unit_id!r}"
            ) from error

    return UnitCycleEnergyContext(
        unit_id=unit_id,
        statistics_period=statistics_period,
        cycle=cycle,
        current_energy=current_energy,
        waiting_bill_energy=waiting_bill_energy,
    )
