"""Build same-unit monthly energy comparisons."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime, timedelta
import re
from typing import Any

from .energy_model import (
    EnergyModelError,
    get_derived_metric_definition,
    get_derived_metric_logical_ids,
    get_series_definition,
    get_timezone_name,
    get_unit_definition,
)
from .history import (
    DAY_MODE,
    DAY_RESOLUTION,
    HOUR_RESOLUTION,
    MONTH_MODE,
    _ordered_generator_series,
    physical_series_logical_ids,
    HistoryError,
    HistorySeries,
    async_build_history_for_period,
    unit_has_operational_history,
    _parse_month_reference,
)
from .periods import (
    Period,
    PeriodError,
    build_calendar_day,
    build_calendar_month,
    build_calendar_range,
    equivalent_elapsed_period,
    get_timezone,
)


FULL_PERIODS = "full_periods"
EQUIVALENT_ELAPSED = "equivalent_elapsed"
CUSTOM_EQUAL_DURATION = "custom_equal_duration"
CUSTOM_DIFFERENT_DURATION = "custom_different_duration"
AUTOMATIC_STRATEGY = "automatic"
CUSTOM_STRATEGY = "custom"
ROLLING_DAYS_MODE = "rolling_days"
DAY_PERIOD_TYPE = "day"
RANGE_PERIOD_TYPE = "range"
# Ciclo em curso contra o ciclo anterior, na MESMA janela de progresso: do
# inicio de cada um ate o mesmo tempo decorrido. E a unica comparacao que
# responde "estou gastando mais que no mes passado?" sem que o resultado
# dependa de que dia do ciclo se esta olhando.
CYCLE_PERIOD_TYPE = "cycle"


class ComparisonError(ValueError):
    """Raised when a monthly comparison cannot be built."""


class ComparisonUnknownUnitError(ComparisonError):
    """Raised when the requested unit does not exist."""


class ComparisonInvalidModeError(ComparisonError):
    """Raised when the requested comparison mode is unsupported."""


class ComparisonInvalidReferenceError(ComparisonError):
    """Raised when the requested month reference is invalid."""


class ComparisonInvalidResolutionError(ComparisonError):
    """Raised when the requested comparison resolution is invalid."""


class ComparisonHourlyRangeTooLongError(ComparisonError):
    """Raised when an hourly custom range exceeds the supported limit."""


class ComparisonCycleUnavailableError(ComparisonError):
    """Raised when the cycle-to-cycle window cannot be resolved."""


class ComparisonMixedRangeTypesError(ComparisonError):
    """Raised when custom sides use different semantic range types."""


class ComparisonIntervalRequiresDistinctDatesError(ComparisonError):
    """Raised when an explicit range does not span distinct civil dates."""


class ComparisonDayRequiresSingleDateError(ComparisonError):
    """Raised when an explicit day spans more than one civil date."""


class ComparisonFutureReferenceError(ComparisonError):
    """Raised when the requested month reference is in the future."""


class ComparisonInvalidLogicalIdError(ComparisonError):
    """Raised when the logical series does not belong to the unit."""


class ComparisonUnavailableError(ComparisonError):
    """Raised when operational comparison is unavailable for the unit."""


@dataclass(frozen=True)
class ComparisonRequestedRange:
    """Inclusive civil dates requested for one custom side."""

    start_date: str
    end_date: str


@dataclass(frozen=True)
class ComparisonSide:
    """One side of a period comparison."""

    reference: str
    period: Period
    series: HistorySeries
    requested_range: ComparisonRequestedRange | None = None
    duration_days: float | None = None


@dataclass(frozen=True)
class ComparisonMetric:
    """One grandeza the unit can be compared by, as the seletor should list it."""

    logical_id: str
    label: str


@dataclass(frozen=True)
class ComparisonResult:
    """Monthly comparison for one unit and one logical series."""

    unit_id: str
    mode: str
    logical_id: str
    resolution: str
    alignment: str
    base: ComparisonSide
    comparison: ComparisonSide
    available_metrics: tuple[ComparisonMetric, ...] = ()
    strategy: str = AUTOMATIC_STRATEGY
    window_days: int | None = None
    period_type: str | None = None


def _previous_month(year: int, month: int) -> tuple[int, int]:
    return (year - 1, 12) if month == 1 else (year, month - 1)


def _public_logical_ids(
    model: Mapping[str, Any], unit_id: str
) -> tuple[str, ...]:
    """Grandezas comparaveis da unidade, na ordem em que se lê o grafico.

    Sao as series medidas mais as derivadas que o modelo declara. Antes isto
    era uma tabela por unidade, escrita com o nome de uma delas — uma unidade
    nova nao aparecia no seletor ate alguem lembrar de acrescenta-la.
    """
    medidas = physical_series_logical_ids(model, unit_id)
    derivadas = get_derived_metric_logical_ids(model, unit_id)
    if not derivadas:
        return medidas
    return _ordered_generator_series(
        unit_id, {logical_id: logical_id for logical_id in medidas + derivadas}
    )


def _available_metrics(
    model: Mapping[str, Any], unit_id: str
) -> tuple[ComparisonMetric, ...]:
    """List the comparable grandezas, in the order the seletor should show them.

    Which grandezas exist and in what order is a property of the comparison
    itself, not of whoever draws it: the same tuple already decides which
    logical_id the request may ask for.
    """
    metrics = []
    for logical_id in _public_logical_ids(model, unit_id):
        # Autoconsumo e consumo fisico nao sao medidos: vivem em
        # derived_metrics, nao em series. Os dois lugares precisam ser
        # consultados, ou a lista perde justamente as grandezas calculadas.
        definition = None
        for accessor in (get_series_definition, get_derived_metric_definition):
            try:
                definition = accessor(model, logical_id)
                break
            except EnergyModelError:
                continue
        if definition is None:
            raise ComparisonError(
                f"could not resolve metric definition for {logical_id!r}"
            )
        label = definition.get("label")
        if not isinstance(label, str) or not label.strip():
            raise ComparisonError(f"series {logical_id!r} has no usable label")
        metrics.append(ComparisonMetric(logical_id=logical_id, label=label))
    return tuple(metrics)


def _select_series(
    series: tuple[HistorySeries, ...], logical_id: str
) -> HistorySeries:
    selected = next((item for item in series if item.logical_id == logical_id), None)
    if selected is None:
        raise ComparisonInvalidLogicalIdError(
            "logical_id is unavailable for the requested unit"
        )
    return selected


def _parse_custom_date(value: str, field: str) -> date:
    if not isinstance(value, str) or re.fullmatch(r"\d{4}-\d{2}-\d{2}", value) is None:
        raise ComparisonInvalidReferenceError(f"{field} must use strict YYYY-MM-DD")
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise ComparisonInvalidReferenceError(f"{field} must be a valid date") from error


def _parse_cut_instant(value: Any, zone: Any, field: str) -> datetime | None:
    """Aceita um instante ISO local; None significa "agora"."""
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise ComparisonInvalidReferenceError(f"{field} must be an ISO datetime")
    try:
        parsed = datetime.fromisoformat(value.strip())
    except ValueError as error:
        raise ComparisonInvalidReferenceError(
            f"{field} must be a valid ISO datetime"
        ) from error
    # Sem fuso na string, entende-se o fuso do modelo: e a hora local que o
    # usuario ve no relogio, nao UTC.
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=zone)


def _build_cycle_periods(
    cycles: Any,
    zone: Any,
    local_now: datetime,
    cut_instant: datetime | None,
) -> tuple[Period, Period, datetime]:
    """Return (ciclo atual ate o corte, mesmo trecho do ciclo anterior, corte).

    O ciclo anterior e recortado com a MESMA duracao decorrida do atual, e
    nunca alem do proprio fim: se ele foi mais curto que a janela pedida, vale
    o fim dele — comparar contra um trecho que nao existiu inventaria consumo.
    """
    if not isinstance(cycles, (list, tuple)) or not cycles:
        raise ComparisonCycleUnavailableError("no billing cycle is available")
    com_periodo = [item for item in cycles if getattr(item, "period", None) is not None]
    if not com_periodo:
        raise ComparisonCycleUnavailableError("no billing cycle has a period")

    atual = next(
        (item for item in com_periodo if getattr(item, "status", None) != "closed"),
        None,
    )
    fechados = [item for item in com_periodo if getattr(item, "status", None) == "closed"]
    if atual is None:
        # Sem ciclo aberto, o mais recente fechado faz o papel de "atual" e o
        # anterior a ele vira a base de comparacao.
        if len(fechados) < 2:
            raise ComparisonCycleUnavailableError("two cycles are required")
        atual, anterior = fechados[0], fechados[1]
    else:
        if not fechados:
            raise ComparisonCycleUnavailableError("no closed cycle to compare against")
        anterior = fechados[0]

    inicio = atual.period.start.astimezone(zone)
    corte = (cut_instant or local_now).astimezone(zone)
    if corte > local_now:
        raise ComparisonFutureReferenceError("cut instant must not be in the future")
    if corte <= inicio:
        raise ComparisonInvalidReferenceError(
            "cut instant must be after the current cycle start"
        )
    fim_atual = atual.period.end.astimezone(zone)
    if corte > fim_atual:
        corte = fim_atual

    decorrido = corte - inicio
    inicio_anterior = anterior.period.start.astimezone(zone)
    fim_anterior = min(inicio_anterior + decorrido, anterior.period.end.astimezone(zone))
    try:
        base = Period(inicio, corte, "custom", None)
        comparacao = Period(inicio_anterior, fim_anterior, "custom", None)
    except PeriodError as error:
        raise ComparisonCycleUnavailableError(
            "cycle comparison could not form a valid period"
        ) from error
    return base, comparacao, corte


def _build_custom_period(
    start_value: str,
    end_value: str,
    field: str,
    zone: Any,
    local_now: datetime,
) -> tuple[Period, ComparisonRequestedRange, float]:
    start_date = _parse_custom_date(start_value, f"{field}_start")
    end_date = _parse_custom_date(end_value, f"{field}_end")
    if start_date > end_date:
        raise ComparisonInvalidReferenceError(
            f"{field}_start must not be later than {field}_end"
        )
    if start_date > local_now.date() or end_date > local_now.date():
        raise ComparisonFutureReferenceError("custom dates must not be in the future")
    start = datetime.combine(start_date, datetime.min.time(), tzinfo=zone)
    if end_date == local_now.date():
        end = local_now
    else:
        try:
            exclusive_end = end_date + timedelta(days=1)
        except OverflowError as error:
            raise ComparisonInvalidReferenceError(
                f"{field}_end cannot form an inclusive civil range"
            ) from error
        end = datetime.combine(exclusive_end, datetime.min.time(), tzinfo=zone)
    try:
        period = Period(start, end, "custom", None)
    except PeriodError as error:
        raise ComparisonInvalidReferenceError(
            f"{field} must form a non-empty effective period"
        ) from error
    duration_days = (period.end - period.start).total_seconds() / 86400
    return (
        period,
        ComparisonRequestedRange(start_value, end_value),
        duration_days,
    )


async def async_get_comparison(
    hass: Any,
    model: Mapping[str, Any],
    unit_id: str,
    mode: str,
    reference: str | None,
    logical_id: str | None,
    now: datetime,
    *,
    strategy: str = AUTOMATIC_STRATEGY,
    base_start: str | None = None,
    base_end: str | None = None,
    comparison_start: str | None = None,
    comparison_end: str | None = None,
    window_days: int | None = None,
    resolution: str | None = None,
    period_type: str | None = None,
    billing_cycles: Any = None,
    cut_instant: str | None = None,
) -> ComparisonResult:
    """Return an automatic month or explicit custom period comparison."""
    if strategy not in (AUTOMATIC_STRATEGY, CUSTOM_STRATEGY):
        raise ComparisonInvalidModeError("comparison strategy is invalid")
    if strategy == AUTOMATIC_STRATEGY and mode not in (
        DAY_MODE, MONTH_MODE, ROLLING_DAYS_MODE
    ):
        raise ComparisonInvalidModeError("automatic comparison mode is invalid")
    if strategy == CUSTOM_STRATEGY and mode != CUSTOM_STRATEGY:
        raise ComparisonInvalidModeError("custom comparison mode must be custom")
    if strategy == AUTOMATIC_STRATEGY and resolution is not None:
        raise ComparisonInvalidResolutionError(
            "automatic comparison resolution is defined by its mode"
        )
    if strategy == AUTOMATIC_STRATEGY and period_type is not None:
        raise ComparisonInvalidModeError(
            "period_type is only valid for custom comparisons"
        )
    if strategy == CUSTOM_STRATEGY and period_type not in (
        None, DAY_PERIOD_TYPE, RANGE_PERIOD_TYPE, CYCLE_PERIOD_TYPE
    ):
        raise ComparisonInvalidModeError("custom comparison period_type is invalid")
    if strategy == CUSTOM_STRATEGY and resolution not in (None, DAY_RESOLUTION, HOUR_RESOLUTION):
        raise ComparisonInvalidResolutionError("custom comparison resolution is invalid")
    try:
        get_unit_definition(model, unit_id)
    except EnergyModelError as error:
        raise ComparisonUnknownUnitError("requested unit does not exist") from error
    if not unit_has_operational_history(model, unit_id):
        raise ComparisonUnavailableError(
            "operational comparison is unavailable for the requested unit"
        )
    # Sem grandeza escolhida, a comparacao abre na primeira da ordem publica.
    # Esse padrao pertence aqui: quem desenha o seletor nao deveria precisar
    # saber quais grandezas existem para conseguir fazer o primeiro pedido.
    if logical_id is None:
        logical_id = _public_logical_ids(model, unit_id)[0]
    elif not isinstance(logical_id, str) or logical_id not in _public_logical_ids(
        model, unit_id
    ):
        raise ComparisonInvalidLogicalIdError(
            "logical_id is unavailable for the requested unit"
        )
    try:
        zone = get_timezone(get_timezone_name(model))
    except (EnergyModelError, PeriodError) as error:
        raise ComparisonError("could not resolve comparison timezone") from error
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise ComparisonError("now must be a timezone-aware datetime")
    local_now = now.astimezone(zone)

    base_requested_range = None
    comparison_requested_range = None
    base_duration_days = None
    comparison_duration_days = None
    history_mode = MONTH_MODE
    history_resolution = DAY_RESOLUTION
    if strategy == AUTOMATIC_STRATEGY:
        if mode == MONTH_MODE:
            try:
                year, month = _parse_month_reference(reference)  # type: ignore[arg-type]
            except HistoryError as error:
                raise ComparisonInvalidReferenceError(
                    "reference must use a valid strict YYYY-MM"
                ) from error
            if (year, month) > (local_now.year, local_now.month):
                raise ComparisonFutureReferenceError("reference must not be in the future")
            previous_year, previous_month = _previous_month(year, month)
            try:
                base_full = build_calendar_month(year, month, zone)
                comparison_full = build_calendar_month(previous_year, previous_month, zone)
            except PeriodError as error:
                raise ComparisonInvalidReferenceError(
                    "reference must form a comparable calendar month"
                ) from error
            is_current = (year, month) == (local_now.year, local_now.month)
            base_reference = reference
            comparison_reference = f"{previous_year:04d}-{previous_month:02d}"
        else:
            reference_date = _parse_custom_date(reference, "reference")  # type: ignore[arg-type]
            if reference_date > local_now.date():
                raise ComparisonFutureReferenceError("reference must not be in the future")
            if mode == DAY_MODE:
                try:
                    comparison_date = reference_date - timedelta(days=1)
                    base_full = build_calendar_day(reference_date, zone)
                    comparison_full = build_calendar_day(comparison_date, zone)
                except (OverflowError, PeriodError) as error:
                    raise ComparisonInvalidReferenceError(
                        "reference must form comparable calendar days"
                    ) from error
                history_mode = DAY_MODE
                history_resolution = HOUR_RESOLUTION
                base_reference = reference
                comparison_reference = comparison_date.isoformat()
            else:
                if (
                    isinstance(window_days, bool)
                    or not isinstance(window_days, int)
                    or window_days <= 0
                ):
                    raise ComparisonInvalidReferenceError(
                        "window_days must be a positive integer"
                    )
                try:
                    base_start = reference_date - timedelta(days=window_days - 1)
                    base_end = reference_date + timedelta(days=1)
                    comparison_start_date = base_start - timedelta(days=window_days)
                    base_full = build_calendar_range(base_start, base_end, zone)
                    comparison_full = build_calendar_range(
                        comparison_start_date, base_start, zone
                    )
                except (OverflowError, PeriodError) as error:
                    raise ComparisonInvalidReferenceError(
                        "reference cannot form rolling-day windows"
                    ) from error
                base_reference = f"{base_start.isoformat()}/{reference_date.isoformat()}"
                comparison_end_date = base_start - timedelta(days=1)
                comparison_reference = (
                    f"{comparison_start_date.isoformat()}/"
                    f"{comparison_end_date.isoformat()}"
                )
            is_current = reference_date == local_now.date()
        if is_current:
            try:
                base_period, comparison_period = equivalent_elapsed_period(
                    base_full, comparison_full, local_now
                )
            except PeriodError as error:
                raise ComparisonError(
                    "could not build equivalent elapsed periods"
                ) from error
            alignment = EQUIVALENT_ELAPSED
        else:
            base_period, comparison_period = base_full, comparison_full
            alignment = FULL_PERIODS
    else:
        # O tipo ciclo nao recebe datas: as duas janelas sao derivadas dos
        # proprios ciclos de faturamento. Exigi-las aqui recusava todo pedido
        # de ciclo antes mesmo de ele ser lido.
        if period_type != CYCLE_PERIOD_TYPE:
            custom_values = (base_start, base_end, comparison_start, comparison_end)
            if any(value is None for value in custom_values):
                raise ComparisonInvalidReferenceError(
                    "custom comparison requires both inclusive date ranges"
                )
        if period_type == CYCLE_PERIOD_TYPE:
            corte = _parse_cut_instant(cut_instant, zone, "cut_instant")
            base_period, comparison_period, corte = _build_cycle_periods(
                billing_cycles, zone, local_now, corte
            )
            base_requested_range = ComparisonRequestedRange(
                base_period.start.date().isoformat(), corte.date().isoformat()
            )
            comparison_requested_range = ComparisonRequestedRange(
                comparison_period.start.date().isoformat(),
                comparison_period.end.date().isoformat(),
            )
            base_duration_days = (
                base_period.end - base_period.start
            ).total_seconds() / 86400
            comparison_duration_days = (
                comparison_period.end - comparison_period.start
            ).total_seconds() / 86400
            alignment = (
                CUSTOM_EQUAL_DURATION
                if base_period.end - base_period.start
                == comparison_period.end - comparison_period.start
                else CUSTOM_DIFFERENT_DURATION
            )
            base_reference = base_period.start.date().isoformat() + "/" + corte.date().isoformat()
            comparison_reference = (
                comparison_period.start.date().isoformat()
                + "/"
                + comparison_period.end.date().isoformat()
            )
            effective_period_type = CYCLE_PERIOD_TYPE
            history_mode = MONTH_MODE
            history_resolution = DAY_RESOLUTION
            if resolution == HOUR_RESOLUTION:
                # Hora so faz sentido numa janela curta; num ciclo inteiro sao
                # centenas de barras ilegiveis, e o backend ja recusa isso.
                if base_duration_days > 7:
                    raise ComparisonHourlyRangeTooLongError(
                        "hourly cycle comparison is limited to 7 days"
                    )
                history_mode = DAY_MODE
                history_resolution = HOUR_RESOLUTION
        else:
            base_period, base_requested_range, base_duration_days = _build_custom_period(
                base_start, base_end, "base", zone, local_now  # type: ignore[arg-type]
            )
            (
                comparison_period,
                comparison_requested_range,
                comparison_duration_days,
            ) = _build_custom_period(
                comparison_start,  # type: ignore[arg-type]
                comparison_end,  # type: ignore[arg-type]
                "comparison",
                zone,
                local_now,
            )
            alignment = (
                CUSTOM_EQUAL_DURATION
                if base_period.end - base_period.start
                == comparison_period.end - comparison_period.start
                else CUSTOM_DIFFERENT_DURATION
            )
            base_reference = f"{base_start}/{base_end}"
            comparison_reference = f"{comparison_start}/{comparison_end}"
            base_single_day = (
                base_requested_range.start_date == base_requested_range.end_date
            )
            comparison_single_day = (
                comparison_requested_range.start_date
                == comparison_requested_range.end_date
            )
            if period_type is None and base_single_day != comparison_single_day:
                raise ComparisonMixedRangeTypesError(
                    "custom comparison sides must use the same semantic range type"
                )
            if period_type == DAY_PERIOD_TYPE and not (
                base_single_day and comparison_single_day
            ):
                raise ComparisonDayRequiresSingleDateError(
                    "day comparison requires one civil date on each side"
                )
            if period_type == RANGE_PERIOD_TYPE and (
                base_single_day or comparison_single_day
            ):
                raise ComparisonIntervalRequiresDistinctDatesError(
                    "range comparison requires distinct start and end dates"
                )
            effective_period_type = period_type or (
                DAY_PERIOD_TYPE if base_single_day else RANGE_PERIOD_TYPE
            )
            if effective_period_type == DAY_PERIOD_TYPE:
                history_mode = DAY_MODE
                history_resolution = HOUR_RESOLUTION
            if resolution is not None:
                history_resolution = resolution
            if history_resolution == HOUR_RESOLUTION:
                ranges = (base_requested_range, comparison_requested_range)
                if any(
                    (date.fromisoformat(item.end_date) - date.fromisoformat(item.start_date)).days
                    + 1
                    > 7
                    for item in ranges
                ):
                    raise ComparisonHourlyRangeTooLongError(
                        "hourly custom ranges may contain at most 7 civil dates"
                    )
                history_mode = DAY_MODE

    try:
        base_history = await async_build_history_for_period(
            hass,
            model,
            unit_id,
            history_mode,
            base_period,
            history_resolution,
            local_now,
        )
        comparison_history = await async_build_history_for_period(
            hass,
            model,
            unit_id,
            history_mode,
            comparison_period,
            history_resolution,
            local_now,
        )
    except HistoryError as error:
        raise ComparisonError("could not build comparison history") from error

    return ComparisonResult(
        unit_id=unit_id,
        mode=mode,
        logical_id=logical_id,
        available_metrics=_available_metrics(model, unit_id),
        resolution=history_resolution,
        strategy=strategy,
        alignment=alignment,
        base=ComparisonSide(
            reference=base_reference,
            period=base_period,
            series=_select_series(base_history.series, logical_id),
            requested_range=base_requested_range,
            duration_days=base_duration_days,
        ),
        comparison=ComparisonSide(
            reference=comparison_reference,
            period=comparison_period,
            series=_select_series(comparison_history.series, logical_id),
            requested_range=comparison_requested_range,
            duration_days=comparison_duration_days,
        ),
        window_days=window_days if mode == ROLLING_DAYS_MODE else None,
        period_type=effective_period_type if strategy == CUSTOM_STRATEGY else None,
    )
