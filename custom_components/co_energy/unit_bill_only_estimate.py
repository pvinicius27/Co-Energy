"""Apply bill-only estimation to one resolved billing-cycle context."""

from __future__ import annotations

from dataclasses import dataclass

from .bill_only_estimate import (
    BillOnlyCycleEstimate,
    BillOnlyEstimateError,
    calculate_bill_only_cycle_estimate,
)
from .billing_cycle import BillingCycleContext
from .periods import Period, PeriodError


class UnitBillOnlyEstimateError(ValueError):
    """Raised when a unit bill-only estimate cannot be assembled."""


@dataclass(frozen=True)
class UnitBillOnlyEstimate:
    """Bill-only cycle estimate with unit and billing identity."""

    unit_id: str
    classification: str
    quantity: str
    unit: str
    billing_reference: str
    estimate: BillOnlyCycleEstimate


def build_unit_bill_only_estimate(
    cycle: BillingCycleContext,
) -> UnitBillOnlyEstimate | None:
    """Estimate one unit cycle from its latest resolved official cycle."""
    if not isinstance(cycle, BillingCycleContext):
        raise UnitBillOnlyEstimateError("cycle must be a BillingCycleContext")

    base = (cycle.latest_bill, cycle.latest_closed_period, cycle.current_start)
    if all(item is None for item in base):
        return None
    if any(item is None for item in base):
        raise UnitBillOnlyEstimateError(
            f"inconsistent bill-only estimate base for unit {cycle.unit_id!r}"
        )

    bill = cycle.latest_bill
    reference_period = cycle.latest_closed_period
    current_start = cycle.current_start
    if bill.unit_id != cycle.unit_id:
        raise UnitBillOnlyEstimateError(
            f"latest bill does not belong to unit {cycle.unit_id!r}"
        )
    if (
        bill.reading_previous is not None
        and bill.reading_current is not None
        and bill.reading_days is not None
        and bill.reading_days
        != (bill.reading_current - bill.reading_previous).days
    ):
        return None

    target_end = cycle.expected_next_reading
    if target_end is None:
        target_end = current_start + (reference_period.end - reference_period.start)
    try:
        target_period = Period(
            start=current_start,
            end=target_end,
            mode="cycle",
        )
    except PeriodError as error:
        raise UnitBillOnlyEstimateError(
            f"could not build bill-only target period for unit {cycle.unit_id!r}"
        ) from error

    try:
        estimate = calculate_bill_only_cycle_estimate(
            bill.consumption_kwh,
            reference_period,
            target_period,
        )
    except BillOnlyEstimateError as error:
        raise UnitBillOnlyEstimateError(
            f"could not estimate unit {cycle.unit_id!r} from bill {bill.reference!r}"
        ) from error

    return UnitBillOnlyEstimate(
        unit_id=cycle.unit_id,
        classification="estimated",
        quantity="energy",
        unit="kWh",
        billing_reference=bill.reference,
        estimate=estimate,
    )
