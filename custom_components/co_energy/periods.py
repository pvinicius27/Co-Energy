"""Pure temporal primitives for CoEnergy.

All periods use half-open interval semantics: ``[start, end)``. The start is
inclusive and the end is exclusive.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


class PeriodError(ValueError):
    """Raised when a temporal value or period is invalid."""


def _is_aware(value: datetime) -> bool:
    return value.tzinfo is not None and value.utcoffset() is not None


def _validate_reference(reference: str | None) -> None:
    if reference is not None and (
        not isinstance(reference, str) or not reference.strip()
    ):
        raise PeriodError("reference must be None or a non-empty string")


@dataclass(frozen=True)
class Period:
    """An immutable half-open temporal interval: ``[start, end)``."""

    start: datetime
    end: datetime
    mode: str
    reference: str | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.start, datetime) or not _is_aware(self.start):
            raise PeriodError("start must be a timezone-aware datetime")
        if not isinstance(self.end, datetime) or not _is_aware(self.end):
            raise PeriodError("end must be a timezone-aware datetime")
        if self.start >= self.end:
            raise PeriodError("start must be earlier than end")
        if not isinstance(self.mode, str) or not self.mode.strip():
            raise PeriodError("mode must be a non-empty string")
        _validate_reference(self.reference)


def get_timezone(timezone_name: str) -> ZoneInfo:
    """Return a standard-library timezone by IANA name."""
    if not isinstance(timezone_name, str) or not timezone_name.strip():
        raise PeriodError("timezone_name must be a non-empty string")
    try:
        return ZoneInfo(timezone_name)
    except (ZoneInfoNotFoundError, ValueError) as error:
        raise PeriodError(f"invalid timezone: {timezone_name}") from error


def parse_boundary_time(value: str) -> time:
    """Parse a boundary time in strict ``HH:MM`` format."""
    if not isinstance(value, str) or re.fullmatch(r"\d{2}:\d{2}", value) is None:
        raise PeriodError("boundary time must use strict HH:MM format")
    hour, minute = (int(part) for part in value.split(":"))
    try:
        return time(hour=hour, minute=minute)
    except ValueError as error:
        raise PeriodError("boundary time contains an invalid hour or minute") from error


def at_boundary(
    date_value: date, boundary_time: time, timezone: ZoneInfo
) -> datetime:
    """Place a date at the configured local boundary time."""
    if not isinstance(date_value, date) or isinstance(date_value, datetime):
        raise PeriodError("date_value must be a date")
    if not isinstance(boundary_time, time):
        raise PeriodError("boundary_time must be a time")
    if not isinstance(timezone, ZoneInfo):
        raise PeriodError("timezone must be a ZoneInfo")
    return datetime.combine(date_value, boundary_time, tzinfo=timezone)


def build_cycle_period(
    start_date: date,
    end_date: date,
    boundary_time: time,
    timezone: ZoneInfo,
    reference: str | None = None,
) -> Period:
    """Build an explicit billing-cycle period using ``[start, end)``."""
    if start_date >= end_date:
        raise PeriodError("start_date must be earlier than end_date")
    return Period(
        start=at_boundary(start_date, boundary_time, timezone),
        end=at_boundary(end_date, boundary_time, timezone),
        mode="cycle",
        reference=reference,
    )


def _local_midnight(date_value: date, timezone: ZoneInfo) -> datetime:
    return at_boundary(date_value, time.min, timezone)


def build_calendar_day(date_value: date, timezone: ZoneInfo) -> Period:
    """Build one local calendar day using ``[start, end)``."""
    try:
        next_date = date_value + timedelta(days=1)
    except (OverflowError, TypeError) as error:
        raise PeriodError("date_value cannot form a complete calendar day") from error
    return Period(
        start=_local_midnight(date_value, timezone),
        end=_local_midnight(next_date, timezone),
        mode="calendar",
        reference=date_value.isoformat(),
    )


def build_calendar_month(year: int, month: int, timezone: ZoneInfo) -> Period:
    """Build one local calendar month using ``[start, end)``."""
    if isinstance(year, bool) or not isinstance(year, int):
        raise PeriodError("year must be an integer")
    if isinstance(month, bool) or not isinstance(month, int):
        raise PeriodError("month must be an integer")
    try:
        start_date = date(year, month, 1)
        end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    except ValueError as error:
        raise PeriodError("invalid calendar year or month") from error
    return Period(
        start=_local_midnight(start_date, timezone),
        end=_local_midnight(end_date, timezone),
        mode="calendar",
        reference=f"{year:04d}-{month:02d}",
    )


def build_calendar_year(year: int, timezone: ZoneInfo) -> Period:
    """Build one local calendar year using ``[start, end)``."""
    if isinstance(year, bool) or not isinstance(year, int):
        raise PeriodError("year must be an integer")
    try:
        start_date = date(year, 1, 1)
        end_date = date(year + 1, 1, 1)
    except ValueError as error:
        raise PeriodError("invalid calendar year") from error
    return Period(
        start=_local_midnight(start_date, timezone),
        end=_local_midnight(end_date, timezone),
        mode="calendar",
        reference=f"{year:04d}",
    )


# The functional convention for the first day of a week remains undefined.


def build_calendar_range(
    start_date: date,
    end_date: date,
    timezone: ZoneInfo,
    reference: str | None = None,
) -> Period:
    """Build an explicit local calendar range using ``[start, end)``."""
    if start_date >= end_date:
        raise PeriodError("start_date must be earlier than end_date")
    return Period(
        start=_local_midnight(start_date, timezone),
        end=_local_midnight(end_date, timezone),
        mode="calendar",
        reference=reference,
    )


def equivalent_elapsed_period(
    current_period: Period, previous_period: Period, now: datetime
) -> tuple[Period, Period]:
    """Return equal elapsed windows from current and previous periods."""
    if not isinstance(now, datetime) or not _is_aware(now):
        raise PeriodError("now must be a timezone-aware datetime")
    if now <= current_period.start:
        raise PeriodError("now must be later than the current period start")

    current_end = min(now, current_period.end)
    requested_duration = current_end - current_period.start
    previous_duration = previous_period.end - previous_period.start
    equivalent_duration = min(requested_duration, previous_duration)

    current_equivalent = Period(
        start=current_period.start,
        end=current_period.start + equivalent_duration,
        mode=current_period.mode,
        reference=current_period.reference,
    )
    previous_equivalent = Period(
        start=previous_period.start,
        end=previous_period.start + equivalent_duration,
        mode=previous_period.mode,
        reference=previous_period.reference,
    )
    return current_equivalent, previous_equivalent


def period_to_dict(period: Period) -> dict[str, str | None]:
    """Serialize raw period values for the API contract."""
    timezone = period.start.tzinfo
    timezone_name = getattr(timezone, "key", None) or str(timezone)
    return {
        "mode": period.mode,
        "reference": period.reference,
        "start": period.start.isoformat(),
        "end": period.end.isoformat(),
        "timezone": timezone_name,
    }
