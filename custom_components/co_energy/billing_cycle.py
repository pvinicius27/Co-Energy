"""Build individual billing-cycle temporal context from official bills."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
import hashlib
from typing import Any
from zoneinfo import ZoneInfo

from .billing import BillingError, BillingRecord, get_billing_records, get_latest_bill
from .energy_model import (
    EnergyModelError,
    get_billing_boundary_time,
    get_forecast_method,
    get_invoice_late_after_days,
    get_timezone_name,
    get_unit_definition,
)
from .equatorial_adapter import EquatorialDocument
from .periods import (
    Period,
    PeriodError,
    at_boundary,
    build_cycle_period,
    get_timezone,
    parse_boundary_time,
)


class BillingCycleError(ValueError):
    """Raised when billing-cycle temporal context cannot be constructed."""


@dataclass(frozen=True)
class BillingCycleContext:
    """Official and operational temporal context for one unit."""

    unit_id: str
    status: str
    latest_bill: BillingRecord | None
    latest_closed_period: Period | None
    current_start: datetime | None
    expected_next_reading: datetime | None
    current_elapsed_period: Period | None
    waiting_bill_period: Period | None


@dataclass(frozen=True)
class BillingOnlyCyclePeriod:
    """Reconstructed civil period for one billing-only cycle."""

    start: date
    end: date
    start_source: str


@dataclass(frozen=True)
class BillingReadingDiagnostic:
    """Conservative comparison of consecutive official reading metadata."""

    classification: str
    reported_previous: date | None
    reading_days: int | None
    cycle_days: int | None
    reading_days_match: bool | None


@dataclass(frozen=True)
class BillingCycle:
    """One deterministic closed or open billing cycle."""

    cycle_id: str
    unit_id: str
    billing_reference: str | None
    status: str
    capability: str
    history_available: bool
    period: Period | None
    official_consumption: float | None
    expected_end: datetime | None = None
    predicted_reference: str | None = None
    billing_cycle_period: BillingOnlyCyclePeriod | None = None
    billing_reading_diagnostic: BillingReadingDiagnostic | None = None
    billing_method: str | None = None
    # So o ciclo provisorio tem: "awaiting" ate o prazo declarado no modelo,
    # "late" depois dele. Nos demais estados a pergunta nao existe.
    invoice_status: str | None = None


ClosedBillingCycle = BillingCycle


def _closed_cycle_id(
    unit_id: str,
    billing_reference: str,
) -> str:
    identity = "|".join((unit_id, billing_reference))
    return f"cycle_{hashlib.sha256(identity.encode('utf-8')).hexdigest()[:20]}"


def _open_cycle_id(unit_id: str, start: datetime) -> str:
    identity = "|".join((unit_id, "open", start.isoformat()))
    return f"cycle_{hashlib.sha256(identity.encode('utf-8')).hexdigest()[:20]}"


def _provisional_cycle_id(
    unit_id: str,
    start: datetime,
    end: datetime,
) -> str:
    identity = "|".join(
        (unit_id, "provisional", start.isoformat(), end.isoformat())
    )
    return f"cycle_{hashlib.sha256(identity.encode('utf-8')).hexdigest()[:20]}"


def invoice_status_after_reading(
    expected_reading: datetime, now: datetime, late_after_days: int | None
) -> str:
    """Classify a missing invoice once its reading date has passed.

    O prazo conta a partir da leitura prevista. Exatamente no limite ainda e
    espera; so depois e atraso. Sem prazo declarado no modelo, so aguarda.
    """
    return (
        "late"
        if late_after_days is not None
        and now > expected_reading + timedelta(days=late_after_days)
        else "awaiting"
    )


def predicted_reference(moment: datetime) -> str:
    """Billing reference named after the month of an expected reading."""
    return _predicted_reference(moment)


def _predicted_reference(moment: datetime, *, following_month: bool = False) -> str:
    months = (
        "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
        "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
    )
    year = moment.year
    month = moment.month + int(following_month)
    if month == 13:
        month = 1
        year += 1
    return f"{months[month - 1]}/{year:04d}"


def _trusted_closed_period(
    record: BillingRecord,
    boundary: time,
    timezone: ZoneInfo,
) -> Period | None:
    if record.reading_previous is None or record.reading_current is None:
        return None
    if record.reading_previous >= record.reading_current:
        return None
    elapsed_days = (record.reading_current - record.reading_previous).days
    if record.reading_days is not None and record.reading_days != elapsed_days:
        return None
    try:
        return build_closed_bill_period(record, boundary, timezone)
    except BillingCycleError:
        return None


def _billing_only_metadata(
    record: BillingRecord,
    previous_record: BillingRecord | None,
) -> tuple[BillingOnlyCyclePeriod | None, BillingReadingDiagnostic]:
    classification = "unknown"
    if (
        previous_record is not None
        and previous_record.reading_current is not None
        and record.reading_previous is not None
    ):
        difference = abs(
            (record.reading_previous - previous_record.reading_current).days
        )
        classification = "compatible" if difference <= 1 else "possible_estimate"

    cycle_period: BillingOnlyCyclePeriod | None = None
    if record.reading_current is not None:
        if previous_record is not None and previous_record.reading_current is not None:
            start = previous_record.reading_current
            start_source = "previous_current"
        elif record.reading_days is not None:
            start = record.reading_current - timedelta(days=record.reading_days)
            start_source = "reading_days"
        else:
            start = None
            start_source = None
        if start is not None and start < record.reading_current:
            cycle_period = BillingOnlyCyclePeriod(
                start=start,
                end=record.reading_current,
                start_source=start_source,
            )

    cycle_days = (
        (cycle_period.end - cycle_period.start).days
        if cycle_period is not None
        else None
    )
    reading_days_match = (
        cycle_days == record.reading_days
        if cycle_days is not None and record.reading_days is not None
        else None
    )
    return cycle_period, BillingReadingDiagnostic(
        classification=classification,
        reported_previous=record.reading_previous,
        reading_days=record.reading_days,
        cycle_days=cycle_days,
        reading_days_match=reading_days_match,
    )


def get_closed_billing_cycles(
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
) -> tuple[ClosedBillingCycle, ...]:
    """Return the official bill catalog ordered by reference newest first."""
    try:
        timezone = get_timezone(get_timezone_name(model))
        boundary = parse_boundary_time(get_billing_boundary_time(model))
        unit = get_unit_definition(model, unit_id)
        forecast_method = get_forecast_method(model, unit_id)
    except (EnergyModelError, PeriodError) as error:
        raise BillingCycleError(
            f"could not configure billing cycles for {unit_id!r}"
        ) from error

    billing_key = unit.get("billing_key")
    if not isinstance(billing_key, str) or not billing_key.strip():
        raise BillingCycleError("billing_key must be a non-empty string")
    try:
        records = get_billing_records(billing_document, billing_key)
    except BillingError as error:
        raise BillingCycleError(
            f"could not load billing cycles for {unit_id!r}"
        ) from error

    capability = (
        "billing_only"
        if forecast_method == "bill_only_previous_cycle"
        else "operational_history"
    )
    seen_references: set[str] = set()
    ordered_records = sorted(
        records,
        key=lambda record: (record.reference_year, record.reference_month),
    )
    cycles: list[tuple[int, int, ClosedBillingCycle]] = []
    for index, record in enumerate(ordered_records):
        if record.reference in seen_references:
            raise BillingCycleError(
                f"duplicate billing reference for {unit_id!r}"
            )
        seen_references.add(record.reference)
        cycle_id = _closed_cycle_id(unit_id, record.reference)
        source_period = _trusted_closed_period(record, boundary, timezone)
        period = (
            Period(
                start=source_period.start,
                end=source_period.end,
                mode="cycle",
                reference=cycle_id,
            )
            if source_period is not None
            else None
        )
        history_available = (
            capability == "operational_history" and period is not None
        )
        billing_cycle_period, billing_reading_diagnostic = (
            _billing_only_metadata(
                record,
                ordered_records[index - 1] if index > 0 else None,
            )
            if capability == "billing_only"
            else (None, None)
        )
        cycles.append(
            (
                record.reference_year,
                record.reference_month,
                ClosedBillingCycle(
                    cycle_id=cycle_id,
                    unit_id=unit_id,
                    billing_reference=record.reference,
                    status="closed",
                    capability=capability,
                    history_available=history_available,
                    period=period,
                    official_consumption=record.consumption_kwh,
                    billing_cycle_period=billing_cycle_period,
                    billing_reading_diagnostic=billing_reading_diagnostic,
                    billing_method=(
                        record.billing_method if capability == "billing_only" else None
                    ),
                ),
            )
        )
    return tuple(
        item[2]
        for item in sorted(cycles, key=lambda item: (item[0], item[1]), reverse=True)
    )


def get_billing_cycles(
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
    now: datetime,
) -> tuple[BillingCycle, ...]:
    """Return the current open cycle followed by official closed cycles."""
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise BillingCycleError("now must be a timezone-aware datetime")
    closed_cycles = get_closed_billing_cycles(model, billing_document, unit_id)
    try:
        timezone = get_timezone(get_timezone_name(model))
        boundary = parse_boundary_time(get_billing_boundary_time(model))
        unit = get_unit_definition(model, unit_id)
        forecast_method = get_forecast_method(model, unit_id)
        late_after_days = get_invoice_late_after_days(model)
    except (EnergyModelError, PeriodError) as error:
        raise BillingCycleError(
            f"could not configure billing cycles for {unit_id!r}"
        ) from error

    if forecast_method == "bill_only_previous_cycle":
        return closed_cycles
    billing_key = unit.get("billing_key")
    if not isinstance(billing_key, str) or not billing_key.strip():
        raise BillingCycleError("billing_key must be a non-empty string")
    try:
        latest_bill = get_latest_bill(billing_document, billing_key)
    except BillingError as error:
        raise BillingCycleError(
            f"could not load billing cycles for {unit_id!r}"
        ) from error
    if latest_bill is None or latest_bill.reading_current is None:
        return closed_cycles

    try:
        start = at_boundary(latest_bill.reading_current, boundary, timezone)
        expected_end = (
            at_boundary(latest_bill.next_reading, boundary, timezone)
            if latest_bill.next_reading is not None
            else None
        )
    except PeriodError as error:
        raise BillingCycleError(
            f"could not align billing cycles for {unit_id!r}"
        ) from error
    if expected_end is not None and expected_end <= start:
        expected_end = None

    local_now = now.astimezone(timezone)
    if local_now <= start:
        return closed_cycles
    provisional_cycle: BillingCycle | None = None
    open_start = start
    open_expected_end = expected_end
    open_predicted_reference = (
        _predicted_reference(expected_end) if expected_end is not None else None
    )
    if expected_end is not None and local_now >= expected_end:
        provisional_id = _provisional_cycle_id(unit_id, start, expected_end)
        # O prazo conta a partir da leitura prevista, que e o fim do periodo
        # provisorio.
        invoice_status = invoice_status_after_reading(
            expected_end, local_now, late_after_days
        )
        provisional_cycle = BillingCycle(
            cycle_id=provisional_id,
            unit_id=unit_id,
            billing_reference=None,
            status="provisional",
            capability="operational_history",
            history_available=True,
            period=Period(start, expected_end, "cycle", provisional_id),
            official_consumption=None,
            expected_end=None,
            predicted_reference=_predicted_reference(expected_end),
            invoice_status=invoice_status,
        )
        open_start = expected_end
        open_expected_end = None
        open_predicted_reference = _predicted_reference(
            expected_end, following_month=True
        )

    open_cycle: BillingCycle | None = None
    if local_now > open_start:
        cycle_id = _open_cycle_id(unit_id, open_start)
        try:
            period = Period(open_start, local_now, "cycle", cycle_id)
        except PeriodError as error:
            raise BillingCycleError(
                f"could not build open billing cycle for {unit_id!r}"
            ) from error
        open_cycle = BillingCycle(
            cycle_id=cycle_id,
            unit_id=unit_id,
            billing_reference=None,
            status="open",
            capability="operational_history",
            history_available=True,
            period=period,
            official_consumption=None,
            expected_end=open_expected_end,
            predicted_reference=open_predicted_reference,
        )
    return tuple(
        cycle
        for cycle in (open_cycle, provisional_cycle, *closed_cycles)
        if cycle is not None
    )


def build_closed_bill_period(
    bill: BillingRecord,
    boundary_time: time,
    timezone: ZoneInfo,
) -> Period | None:
    """Build the official temporal interval declared by one bill."""
    if bill.reading_previous is None or bill.reading_current is None:
        return None
    try:
        return build_cycle_period(
            bill.reading_previous,
            bill.reading_current,
            boundary_time,
            timezone,
            reference=bill.reference,
        )
    except PeriodError as error:
        raise BillingCycleError("could not build closed billing period") from error


def _operational_period(start: datetime, end: datetime) -> Period:
    try:
        return Period(start=start, end=end, mode="cycle", reference=None)
    except PeriodError as error:
        raise BillingCycleError("could not build operational billing period") from error


def _empty_context(unit_id: str, bill: BillingRecord | None = None) -> BillingCycleContext:
    return BillingCycleContext(
        unit_id=unit_id,
        status="no_base",
        latest_bill=bill,
        latest_closed_period=None,
        current_start=None,
        expected_next_reading=None,
        current_elapsed_period=None,
        waiting_bill_period=None,
    )


def get_billing_cycle_context(
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
    now: datetime,
) -> BillingCycleContext:
    """Build deterministic official and current operational cycle context."""
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise BillingCycleError("now must be a timezone-aware datetime")
    try:
        timezone = get_timezone(get_timezone_name(model))
        boundary = parse_boundary_time(get_billing_boundary_time(model))
        unit = get_unit_definition(model, unit_id)
    except (EnergyModelError, PeriodError) as error:
        raise BillingCycleError(f"could not configure billing cycle for {unit_id!r}") from error

    billing_key = unit.get("billing_key")
    if not isinstance(billing_key, str) or not billing_key.strip():
        raise BillingCycleError("billing_key must be a non-empty string")
    try:
        latest_bill = get_latest_bill(billing_document, billing_key)
    except BillingError as error:
        raise BillingCycleError(f"could not load billing cycle for {unit_id!r}") from error
    if latest_bill is None:
        return _empty_context(unit_id)

    latest_closed_period = build_closed_bill_period(latest_bill, boundary, timezone)
    if latest_bill.reading_current is None:
        return BillingCycleContext(
            unit_id=unit_id,
            status="no_base",
            latest_bill=latest_bill,
            latest_closed_period=latest_closed_period,
            current_start=None,
            expected_next_reading=None,
            current_elapsed_period=None,
            waiting_bill_period=None,
        )

    now_local = now.astimezone(timezone)
    try:
        reading_current = at_boundary(latest_bill.reading_current, boundary, timezone)
        next_reading = (
            at_boundary(latest_bill.next_reading, boundary, timezone)
            if latest_bill.next_reading is not None
            else None
        )
    except PeriodError as error:
        raise BillingCycleError(f"could not align billing cycle for {unit_id!r}") from error

    if next_reading is not None and next_reading <= reading_current:
        _operational_period(reading_current, next_reading)

    if now_local < reading_current:
        return BillingCycleContext(
            unit_id=unit_id,
            status="no_base",
            latest_bill=latest_bill,
            latest_closed_period=latest_closed_period,
            current_start=reading_current,
            expected_next_reading=next_reading,
            current_elapsed_period=None,
            waiting_bill_period=None,
        )

    if next_reading is not None and now_local >= next_reading:
        waiting = _operational_period(reading_current, next_reading)
        elapsed = (
            _operational_period(next_reading, now_local)
            if now_local > next_reading
            else None
        )
        return BillingCycleContext(
            unit_id=unit_id,
            status="open",
            latest_bill=latest_bill,
            latest_closed_period=latest_closed_period,
            current_start=next_reading,
            expected_next_reading=None,
            current_elapsed_period=elapsed,
            waiting_bill_period=waiting,
        )

    elapsed = (
        _operational_period(reading_current, now_local)
        if now_local > reading_current
        else None
    )
    return BillingCycleContext(
        unit_id=unit_id,
        status="open",
        latest_bill=latest_bill,
        latest_closed_period=latest_closed_period,
        current_start=reading_current,
        expected_next_reading=next_reading,
        current_elapsed_period=elapsed,
        waiting_bill_period=None,
    )
