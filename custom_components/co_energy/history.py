"""Build calendar energy history for one logical unit."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
import math
import re
from typing import Any

from .billing_cycle import BillingCycleError, get_billing_cycles
from .energy import (
    EnergyCalculationError,
    calculate_derived_metric,
    get_formula_dependencies,
)
from .energy_model import (
    EnergyModelError,
    get_derived_metric_definition,
    get_derived_metric_logical_ids,
    get_series_definition,
    get_series_logical_ids,
    get_timezone_name,
    get_unit_definition,
)
from .logical_series import (
    ISSUE_REASONS,
    LogicalSeriesError,
    LogicalSeriesResult,
    async_get_logical_series,
)
from .equatorial_adapter import EquatorialDocument
from .periods import (
    Period,
    PeriodError,
    build_calendar_day,
    build_calendar_month,
    build_calendar_year,
    get_timezone,
)


DAY_MODE = "day"
MONTH_MODE = "month"
YEAR_MODE = "year"
CYCLE_MODE = "cycle"
HOUR_RESOLUTION = "hour"
DAY_RESOLUTION = "day"
MONTH_RESOLUTION = "month"
# Ordem de leitura do grafico: primeiro o que o sistema produz, depois para
# onde essa energia foi (rede, casa) e por fim o consumo total. Consumo fisico
# fecha a lista por ser a soma dos anteriores, nao mais uma parcela.
#
# Sao nomes de metrica, sem unidade. Antes esta ordem era uma tupla de IDs
# completos escritos a mao com o nome de uma unidade, e so existia para ela.
GENERATOR_METRIC_ORDER = (
    "generation_energy",
    "export_energy",
    "import_energy",
    "self_consumption",
    "physical_consumption",
)


def _ordered_generator_series(
    unit_id: str, available: Mapping[str, Any]
) -> tuple[Any, ...]:
    """Order the generator series for reading, ignoring what does not exist.

    A ordem e a de GENERATOR_METRIC_ORDER; o que a unidade nao declara sai da
    lista em vez de quebrar. Uma instalacao que nao mede importacao, por
    exemplo, plota o que tem.
    """
    ordenadas = [
        available[f"{unit_id}.{metric}"]
        for metric in GENERATOR_METRIC_ORDER
        if f"{unit_id}.{metric}" in available
    ]
    # O que o modelo declarou e a ordem nao previu entra depois, na ordem do
    # modelo: melhor plotar fora da ordem ideal do que omitir em silencio.
    conhecidas = {f"{unit_id}.{metric}" for metric in GENERATOR_METRIC_ORDER}
    ordenadas.extend(
        serie for logical_id, serie in available.items()
        if logical_id not in conhecidas
    )
    return tuple(ordenadas)


def physical_series_logical_ids(
    model: Mapping[str, Any], unit_id: str
) -> tuple[str, ...]:
    """Return the measured energy series this unit can plot, in model order.

    Era uma tabela que listava as series de cada unidade pelo nome. O modelo ja
    declara quais series a unidade tem — a tabela apenas repetia isso, e ficava
    para tras a cada unidade nova.
    """
    return get_series_logical_ids(model, unit_id)


def unit_has_operational_history(model: Mapping[str, Any], unit_id: str) -> bool:
    """Return whether the model declares series this unit can plot as history."""
    return bool(physical_series_logical_ids(model, unit_id))


class HistoryError(ValueError):
    """Raised when calendar history cannot be built."""


class HistoryUnknownUnitError(HistoryError):
    """Raised when the requested unit does not exist."""


class HistoryInvalidReferenceError(HistoryError):
    """Raised when the requested local calendar reference is invalid."""


class HistoryFutureReferenceError(HistoryError):
    """Raised when the requested local calendar reference is in the future."""


class HistoryUnavailableError(HistoryError):
    """Raised when a known cycle has no usable operational history."""


@dataclass(frozen=True)
class HistoryIssueCount:
    """Count of one public issue reason."""

    reason: str
    count: int


@dataclass(frozen=True)
class HistoryPoint:
    """One public bucket in a logical history series."""

    start: datetime
    end: datetime
    value: float | None
    complete: bool
    issues: tuple[str, ...]


@dataclass(frozen=True)
class HistorySeries:
    """One measured or calculated logical history series."""

    logical_id: str
    label: str
    quantity: str
    unit: str
    classification: str
    total: float | None
    point_count: int
    issue_count: int
    issue_counts: tuple[HistoryIssueCount, ...]
    points: tuple[HistoryPoint, ...]


@dataclass(frozen=True)
class HistoryResult:
    """Calendar history for one unit."""

    unit_id: str
    available: bool
    mode: str
    period: Period
    resolution: str
    series: tuple[HistorySeries, ...]


def _required_string(definition: Mapping[str, Any], field: str) -> str:
    value = definition.get(field)
    if not isinstance(value, str) or not value.strip():
        raise HistoryError(f"{field} must be a non-empty string")
    return value


def _parse_day_reference(reference: str) -> date:
    if not isinstance(reference, str) or re.fullmatch(
        r"\d{4}-\d{2}-\d{2}", reference
    ) is None:
        raise HistoryInvalidReferenceError("reference must use strict YYYY-MM-DD")
    try:
        return date.fromisoformat(reference)
    except ValueError as error:
        raise HistoryInvalidReferenceError("reference must be a valid date") from error


def _parse_month_reference(reference: str) -> tuple[int, int]:
    if not isinstance(reference, str) or re.fullmatch(
        r"\d{4}-\d{2}", reference
    ) is None:
        raise HistoryInvalidReferenceError("reference must use strict YYYY-MM")
    year, month = (int(item) for item in reference.split("-"))
    if not 1 <= month <= 12:
        raise HistoryInvalidReferenceError("reference must be a valid month")
    return year, month


def _parse_year_reference(reference: str) -> int:
    if not isinstance(reference, str) or re.fullmatch(r"\d{4}", reference) is None:
        raise HistoryInvalidReferenceError("reference must use strict YYYY")
    year = int(reference)
    try:
        date(year, 1, 1)
    except ValueError as error:
        raise HistoryInvalidReferenceError("reference must be a valid year") from error
    return year


def _hourly_grid(period: Period) -> tuple[tuple[datetime, datetime], ...]:
    zone = period.start.tzinfo
    cursor = period.start.astimezone(timezone.utc)
    end = period.end.astimezone(timezone.utc)
    buckets: list[tuple[datetime, datetime]] = []
    while cursor < end:
        bucket_end = min(cursor + timedelta(hours=1), end)
        buckets.append((cursor.astimezone(zone), bucket_end.astimezone(zone)))
        cursor = bucket_end
    return tuple(buckets)


def _daily_grid(period: Period) -> tuple[tuple[datetime, datetime], ...]:
    zone = period.start.tzinfo
    cursor = period.start
    buckets: list[tuple[datetime, datetime]] = []
    while cursor < period.end:
        bucket_end = build_calendar_day(cursor.date() + timedelta(days=1), zone).start
        buckets.append((cursor, min(bucket_end, period.end)))
        cursor = bucket_end
    return tuple(buckets)


def _monthly_grid(period: Period) -> tuple[tuple[datetime, datetime], ...]:
    zone = period.start.tzinfo
    cursor = period.start
    buckets: list[tuple[datetime, datetime]] = []
    while cursor < period.end:
        bucket = build_calendar_month(cursor.year, cursor.month, zone)
        buckets.append((cursor, min(bucket.end, period.end)))
        cursor = bucket.end
    return tuple(buckets)


def _cycle_daily_grid(period: Period) -> tuple[tuple[datetime, datetime], ...]:
    return _daily_grid(period)


def _deduplicate_reasons(reasons: Sequence[str]) -> tuple[str, ...]:
    result: list[str] = []
    for reason in reasons:
        if reason in ISSUE_REASONS and reason not in result:
            result.append(reason)
    return tuple(result)


def _summarize_points(
    points: tuple[HistoryPoint, ...],
) -> tuple[float | None, int, int, tuple[HistoryIssueCount, ...]]:
    values = [point.value for point in points if point.value is not None]
    total = math.fsum(values) if values else None
    counts: dict[str, int] = {}
    for point in points:
        for reason in point.issues:
            counts[reason] = counts.get(reason, 0) + 1
    issue_counts = tuple(
        HistoryIssueCount(reason, count) for reason, count in counts.items()
    )
    return total, len(values), sum(counts.values()), issue_counts


def _physical_history_series(
    definition: Mapping[str, Any],
    logical: LogicalSeriesResult,
    grid: tuple[tuple[datetime, datetime], ...],
    now: datetime,
) -> HistorySeries:
    accepted_by_interval: dict[tuple[datetime, datetime | None], float] = {}
    for point in logical.points:
        key = (point.start, point.end)
        if key in accepted_by_interval:
            raise HistoryError(f"multiple accepted points for {logical.logical_id}")
        accepted_by_interval[key] = point.value

    bounded_issues = tuple(
        issue
        for issue in logical.issues
        if issue.start is not None and issue.end is not None
    )
    issue_cursor = 0
    points: list[HistoryPoint] = []
    for start, end in grid:
        complete = end <= now
        if not complete:
            points.append(HistoryPoint(start, end, None, False, ()))
            continue
        while (
            issue_cursor < len(bounded_issues)
            and bounded_issues[issue_cursor].end <= start
        ):
            issue_cursor += 1
        issue_index = issue_cursor
        overlapping_reasons: list[str] = []
        while (
            issue_index < len(bounded_issues)
            and bounded_issues[issue_index].start < end
        ):
            issue = bounded_issues[issue_index]
            if issue.end > start:
                overlapping_reasons.append(issue.reason)
            issue_index += 1
        reasons = _deduplicate_reasons(
            tuple(overlapping_reasons)
        )
        value = accepted_by_interval.get((start, end))
        points.append(HistoryPoint(start, end, value, True, reasons))

    result_points = tuple(points)
    total, point_count, issue_count, issue_counts = _summarize_points(result_points)
    return HistorySeries(
        logical_id=logical.logical_id,
        label=_required_string(definition, "label"),
        quantity=logical.quantity,
        unit=logical.unit,
        classification=logical.classification,
        total=total,
        point_count=point_count,
        issue_count=issue_count,
        issue_counts=issue_counts,
        points=result_points,
    )


def _derived_history_series(
    model: Mapping[str, Any],
    logical_id: str,
    dependencies: tuple[HistorySeries, ...],
) -> HistorySeries:
    definition = get_derived_metric_definition(model, logical_id)
    formula_id = _required_string(definition, "formula_id")
    metric_names = tuple(
        dependency.logical_id.split(".", 1)[1] for dependency in dependencies
    )
    points: list[HistoryPoint] = []
    for dependency_points in zip(*(item.points for item in dependencies)):
        first = dependency_points[0]
        if any(
            point.start != first.start or point.end != first.end
            for point in dependency_points[1:]
        ):
            raise HistoryError("derived history inputs are not aligned")
        reasons = _deduplicate_reasons(
            tuple(
                reason
                for point in dependency_points
                for reason in point.issues
            )
        )
        values = {
            metric_name: point.value
            for metric_name, point in zip(metric_names, dependency_points)
        }
        value = calculate_derived_metric(formula_id, values)
        points.append(
            HistoryPoint(first.start, first.end, value, first.complete, reasons)
        )

    result_points = tuple(points)
    total, point_count, issue_count, issue_counts = _summarize_points(result_points)
    return HistorySeries(
        logical_id=logical_id,
        label=_required_string(definition, "label"),
        quantity=_required_string(definition, "quantity"),
        unit=_required_string(definition, "unit"),
        classification=_required_string(definition, "classification"),
        total=total,
        point_count=point_count,
        issue_count=issue_count,
        issue_counts=issue_counts,
        points=result_points,
    )


def _aggregate_history_series(
    hourly: HistorySeries,
    grid: tuple[tuple[datetime, datetime], ...],
    now: datetime,
    final_bucket_in_progress: bool = False,
) -> HistorySeries:
    points: list[HistoryPoint] = []
    for start, end in grid:
        hourly_points = tuple(
            point
            for point in hourly.points
            if point.start >= start and point.end <= end
        )
        values = [point.value for point in hourly_points if point.value is not None]
        points.append(
            HistoryPoint(
                start=start,
                end=end,
                value=math.fsum(values) if values else None,
                complete=(
                    end <= now
                    and not (final_bucket_in_progress and end == grid[-1][1])
                ),
                issues=_deduplicate_reasons(
                    tuple(
                        reason
                        for point in hourly_points
                        for reason in point.issues
                    )
                ),
            )
        )

    result_points = tuple(points)
    hourly_values = [point.value for point in hourly.points if point.value is not None]
    return HistorySeries(
        logical_id=hourly.logical_id,
        label=hourly.label,
        quantity=hourly.quantity,
        unit=hourly.unit,
        classification=hourly.classification,
        total=math.fsum(hourly_values) if hourly_values else None,
        point_count=sum(point.value is not None for point in result_points),
        issue_count=hourly.issue_count,
        issue_counts=hourly.issue_counts,
        points=result_points,
    )


async def async_get_history(
    hass: Any,
    model: Mapping[str, Any],
    unit_id: str,
    reference: str,
    resolution: str | None = None,
    now: datetime | None = None,
    mode: str = DAY_MODE,
    billing_document: EquatorialDocument | None = None,
) -> HistoryResult:
    """Return calendar or closed-cycle logical energy history."""
    if mode not in (DAY_MODE, MONTH_MODE, YEAR_MODE, CYCLE_MODE):
        raise HistoryError(f"unsupported history mode: {mode}")
    expected_resolution = {
        DAY_MODE: HOUR_RESOLUTION,
        MONTH_MODE: DAY_RESOLUTION,
        YEAR_MODE: MONTH_RESOLUTION,
        CYCLE_MODE: DAY_RESOLUTION,
    }[mode]
    if resolution is None:
        resolution = expected_resolution
    if resolution != expected_resolution:
        raise HistoryError(f"unsupported history resolution: {resolution}")
    try:
        unit = get_unit_definition(model, unit_id)
    except EnergyModelError as error:
        raise HistoryUnknownUnitError("requested unit does not exist") from error

    try:
        zone = get_timezone(get_timezone_name(model))
    except (EnergyModelError, PeriodError) as error:
        raise HistoryError("could not build history period") from error

    if now is None:
        now = datetime.now(zone)
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise HistoryError("now must be a timezone-aware datetime")
    local_now = now.astimezone(zone)
    try:
        if mode == DAY_MODE:
            reference_date = _parse_day_reference(reference)
            period = build_calendar_day(reference_date, zone)
            future = reference_date > local_now.date()
        elif mode == MONTH_MODE:
            reference_year, reference_month = _parse_month_reference(reference)
            period = build_calendar_month(reference_year, reference_month, zone)
            future = (reference_year, reference_month) > (
                local_now.year,
                local_now.month,
            )
        elif mode == YEAR_MODE:
            reference_year = _parse_year_reference(reference)
            period = build_calendar_year(reference_year, zone)
            future = reference_year > local_now.year
        else:
            if billing_document is None:
                raise HistoryError("billing document is required for cycle history")
            try:
                cycles = get_billing_cycles(
                    model, billing_document, unit_id, local_now
                )
            except BillingCycleError as error:
                raise HistoryError("could not build closed-cycle catalog") from error
            cycle = next((item for item in cycles if item.cycle_id == reference), None)
            if cycle is None:
                raise HistoryInvalidReferenceError("cycle reference is invalid")
            if (
                cycle.capability != "operational_history"
                or not cycle.history_available
                or cycle.period is None
            ):
                raise HistoryUnavailableError("cycle history is unavailable")
            period = cycle.period
            future = False
    except PeriodError as error:
        raise HistoryError("could not build history period") from error
    if future:
        raise HistoryFutureReferenceError("reference must not be in the future")

    completion_now = period.end if mode == CYCLE_MODE else local_now
    return await async_build_history_for_period(
        hass,
        model,
        unit_id,
        mode,
        period,
        resolution,
        completion_now,
        final_bucket_in_progress=(
            mode == CYCLE_MODE and cycle.status == "open"
        ),
    )


async def async_build_history_for_period(
    hass: Any,
    model: Mapping[str, Any],
    unit_id: str,
    mode: str,
    period: Period,
    resolution: str,
    now: datetime,
    *,
    final_bucket_in_progress: bool = False,
) -> HistoryResult:
    """Build logical energy history for an already resolved period."""
    if mode not in (DAY_MODE, MONTH_MODE, YEAR_MODE, CYCLE_MODE):
        raise HistoryError(f"unsupported history mode: {mode}")
    expected_resolution = {
        DAY_MODE: HOUR_RESOLUTION,
        MONTH_MODE: DAY_RESOLUTION,
        YEAR_MODE: MONTH_RESOLUTION,
        CYCLE_MODE: DAY_RESOLUTION,
    }[mode]
    if resolution != expected_resolution:
        raise HistoryError(f"unsupported history resolution: {resolution}")
    if not isinstance(period, Period):
        raise HistoryError("period must be a Period")
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise HistoryError("now must be a timezone-aware datetime")
    try:
        get_unit_definition(model, unit_id)
    except EnergyModelError as error:
        raise HistoryUnknownUnitError("requested unit does not exist") from error
    if not unit_has_operational_history(model, unit_id):
        return HistoryResult(unit_id, False, mode, period, resolution, ())

    grid = _hourly_grid(period)
    physical: dict[str, HistorySeries] = {}
    try:
        for logical_id in physical_series_logical_ids(model, unit_id):
            definition = get_series_definition(model, logical_id)
            logical = await async_get_logical_series(
                hass=hass,
                model=model,
                logical_id=logical_id,
                start=period.start,
                end=period.end,
                period=HOUR_RESOLUTION,
            )
            physical[logical_id] = _physical_history_series(
                definition, logical, grid, now
            )

        derivadas = get_derived_metric_logical_ids(model, unit_id)
        if derivadas:
            # Cada derivada entra depois das que ela consome: o consumo fisico
            # depende do autoconsumo, que por sua vez depende de geracao e
            # exportacao. A ordem vem do modelo, e as dependencias da propria
            # formula — nenhuma das duas e escrita aqui.
            available = dict(physical)
            for logical_id in derivadas:
                definition = get_derived_metric_definition(model, logical_id)
                formula_id = _required_string(definition, "formula_id")
                dependencias = tuple(
                    available[f"{unit_id}.{metric}"]
                    for metric in get_formula_dependencies(formula_id)
                )
                derivada = _derived_history_series(model, logical_id, dependencias)
                available[derivada.logical_id] = derivada
            series = _ordered_generator_series(unit_id, available)
        else:
            series = tuple(physical.values())
    except (EnergyModelError, LogicalSeriesError, EnergyCalculationError) as error:
        raise HistoryError(f"could not build history for unit {unit_id!r}") from error

    if mode in (MONTH_MODE, YEAR_MODE, CYCLE_MODE):
        public_grid = (
            _daily_grid(period)
            if mode == MONTH_MODE
            else _monthly_grid(period)
            if mode == YEAR_MODE
            else _cycle_daily_grid(period)
        )
        series = tuple(
            _aggregate_history_series(
                item,
                public_grid,
                now,
                final_bucket_in_progress=final_bucket_in_progress,
            )
            for item in series
        )

    return HistoryResult(unit_id, True, mode, period, resolution, series)
