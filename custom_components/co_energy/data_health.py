"""Saude dos dados de cada unidade.

Responde, unidade a unidade, se o dado que alimenta o painel esta chegando:
os sensores respondem, o ciclo que ainda vai ser conferido com a fatura tem
horas sem registro no Recorder, qual fonte fisica vale em cada epoca e se a
fatura chegou. A pagina so desenha; a gravidade de cada achado sai daqui.

Nada aqui estima ou preenche: uma hora sem linha no Recorder e registrada como
lacuna, e o valor da hora seguinte e publicado como fato, sem interpretacao.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any

from .billing import BillingError, get_latest_bill
from .billing_cycle import (
    BillingCycle,
    BillingCycleError,
    get_billing_cycles,
    invoice_status_after_reading,
    predicted_reference,
)
from .energy_model import (
    EnergyModelError,
    get_billing_boundary_time,
    get_invoice_late_after_days,
    get_measurement_definition,
    get_measurement_logical_ids,
    get_meter_silent_after_minutes,
    get_series_definition,
    get_series_logical_ids,
    get_timezone_name,
    get_unit_definition,
    get_unit_ids,
    is_bill_only_unit,
    get_unit_name,
)
from .equatorial_adapter import EquatorialDocument
from .finance import FinanceError, get_official_financial_snapshot
from .logical_series import LogicalSeriesError, async_get_logical_series
from .payback_projection import (
    resolve_published_energy_tariff,
    tariff_disagreement,
)
from .periods import PeriodError, at_boundary, get_timezone, parse_boundary_time
from .states_adapter import StatesAdapterError, get_current_state


_HOUR = timedelta(hours=1)
# Latencia tecnica do Recorder: a estatistica de uma hora so e compilada alguns
# minutos depois que ela termina. Sem esta margem a hora recem-fechada sempre
# pareceria lacuna. Nao e regra de negocio, e o relogio do proprio Recorder.
RECORDER_COMPILE_MARGIN = timedelta(minutes=15)
_SEVERITY_ORDER = {"critical": 0, "attention": 1, "info": 2}
_DISCARD_REASONS = frozenset({"negative_change", "max_change_exceeded"})


class DataHealthError(ValueError):
    """Raised when the data health report cannot be assembled."""


@dataclass(frozen=True)
class DataHealthFinding:
    """One classified observation about a unit's data."""

    severity: str
    code: str
    logical_id: str | None = None
    label: str | None = None
    reference: str | None = None
    count: int | None = None
    hours: int | None = None
    days: int | None = None
    start: datetime | None = None
    end: datetime | None = None
    reason: str | None = None
    # Tarifas viajam como texto: um float perderia a sexta casa, que é
    # justamente onde a comparação com a fatura acontece.
    published: str | None = None
    declared: str | None = None


@dataclass(frozen=True)
class SensorHealth:
    """Current state of one physical entity feeding the unit."""

    logical_id: str
    label: str
    kind: str
    entity_id: str
    source_label: str | None
    status: str
    raw_state: str | None
    unit: str | None
    last_changed: datetime | None
    last_updated: datetime | None
    last_reported: datetime | None


@dataclass(frozen=True)
class SourceHealth:
    """One declared physical source of a series and its validity window."""

    entity_id: str
    label: str | None
    start: datetime | None
    end: datetime | None
    active: bool
    skip_first_change: bool


@dataclass(frozen=True)
class SeriesSources:
    """Every source a series has had, in declared order."""

    logical_id: str
    label: str
    sources: tuple[SourceHealth, ...]


@dataclass(frozen=True)
class CoverageGap:
    """Contiguous hours without any Recorder statistic."""

    start: datetime
    end: datetime
    hours: int
    source_label: str | None
    next_hour_value: float | None


@dataclass(frozen=True)
class SeriesCoverage:
    """Hourly Recorder coverage of one series inside one cycle window."""

    logical_id: str
    label: str
    unit: str
    status: str
    expected_hours: int
    observed_hours: int | None
    gaps: tuple[CoverageGap, ...]
    issue_counts: tuple[tuple[str, int], ...]


@dataclass(frozen=True)
class CycleCoverage:
    """Coverage of the series of a cycle that has no invoice yet."""

    status: str
    reference: str | None
    start: datetime
    end: datetime
    evaluated_until: datetime | None
    series: tuple[SeriesCoverage, ...]


@dataclass(frozen=True)
class InvoiceHealth:
    """Where the unit stands with respect to its official invoices."""

    available: bool
    latest_reference: str | None
    latest_reading: date | None
    published_tariff: str | None
    next_reading: date | None
    extraction_status: str | None
    extraction_alerts: tuple[str, ...]
    awaiting_reference: str | None
    awaiting_since: datetime | None
    invoice_status: str | None
    waiting_days: int | None


@dataclass(frozen=True)
class UnitDataHealth:
    """Everything the health page shows for one unit."""

    unit_id: str
    name: str
    measured: bool
    status: str
    meter_last_report: datetime | None
    findings: tuple[DataHealthFinding, ...]
    sensors: tuple[SensorHealth, ...]
    sources: tuple[SeriesSources, ...]
    coverage: tuple[CycleCoverage, ...]
    invoice: InvoiceHealth


@dataclass(frozen=True)
class DataHealthResult:
    """Data health of every configured unit."""

    generated_at: datetime
    meter_silent_after_minutes: int | None
    invoice_late_after_days: int | None
    billing_available: bool
    units: tuple[UnitDataHealth, ...]


def _floor_hour(moment: datetime) -> datetime:
    return moment.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)


def _ceil_hour(moment: datetime) -> datetime:
    floored = _floor_hour(moment)
    return floored if floored == moment.astimezone(timezone.utc) else floored + _HOUR


def _parse_instant(value: Any) -> datetime | None:
    # O modelo ja foi validado na carga; aqui so se converte.
    return datetime.fromisoformat(value) if isinstance(value, str) else None


def _last_report(sensor: SensorHealth) -> datetime | None:
    candidates = [
        value for value in (sensor.last_reported, sensor.last_updated)
        if value is not None
    ]
    return max(candidates) if candidates else None


def _read_sensor(
    hass: Any,
    logical_id: str,
    label: str,
    kind: str,
    entity_id: str,
    source_label: str | None,
) -> SensorHealth:
    state = hass.states.get(entity_id)
    if state is None:
        return SensorHealth(
            logical_id, label, kind, entity_id, source_label,
            "missing", None, None, None, None, None,
        )
    last_reported = getattr(state, "last_reported", None)
    if not isinstance(last_reported, datetime):
        last_reported = None
    try:
        current = get_current_state(hass, entity_id)
    except StatesAdapterError:
        raw = state.state if isinstance(state.state, str) else None
        changed = state.last_changed if isinstance(state.last_changed, datetime) else None
        updated = state.last_updated if isinstance(state.last_updated, datetime) else None
        return SensorHealth(
            logical_id, label, kind, entity_id, source_label,
            "invalid", raw, None, changed, updated, last_reported,
        )
    return SensorHealth(
        logical_id=logical_id,
        label=label,
        kind=kind,
        entity_id=entity_id,
        source_label=source_label,
        status="ok" if current.available else "unavailable",
        raw_state=current.raw_state,
        unit=current.unit,
        last_changed=current.last_changed,
        last_updated=current.last_updated,
        last_reported=last_reported,
    )


def _active_source(
    definition: Mapping[str, Any], now: datetime
) -> Mapping[str, Any] | None:
    for source in definition["sources"]:
        start = _parse_instant(source.get("from"))
        end = _parse_instant(source.get("until"))
        if (start is None or start <= now) and (end is None or now < end):
            return source
    return None


def _series_sources(
    model: Mapping[str, Any], logical_id: str, now: datetime
) -> SeriesSources:
    definition = get_series_definition(model, logical_id)
    sources = []
    for source in definition["sources"]:
        start = _parse_instant(source.get("from"))
        end = _parse_instant(source.get("until"))
        sources.append(SourceHealth(
            entity_id=source["entity_id"],
            label=source.get("label"),
            start=start,
            end=end,
            active=(start is None or start <= now) and (end is None or now < end),
            skip_first_change=source.get("skip_first_change") is True,
        ))
    return SeriesSources(logical_id, definition["label"], tuple(sources))


async def _series_coverage(
    hass: Any,
    model: Mapping[str, Any],
    logical_id: str,
    window_start: datetime,
    window_end: datetime,
) -> SeriesCoverage:
    definition = get_series_definition(model, logical_id)
    label = definition["label"]
    unit = definition["unit"]
    if window_start >= window_end:
        return SeriesCoverage(logical_id, label, unit, "empty", 0, 0, (), ())
    expected = int((window_end - window_start) / _HOUR)
    try:
        series = await async_get_logical_series(
            hass, model, logical_id, window_start, window_end, "hour"
        )
    except LogicalSeriesError:
        return SeriesCoverage(logical_id, label, unit, "unavailable", expected, None, (), ())

    values = {point.start.astimezone(timezone.utc): point.value for point in series.points}
    observed = set(values)
    observed.update(
        issue.start.astimezone(timezone.utc)
        for issue in series.issues
        if issue.start is not None
    )

    def source_label_at(moment: datetime) -> str | None:
        for segment in series.segments:
            if segment.start <= moment < segment.end:
                return segment.label
        return None

    gaps: list[CoverageGap] = []
    observed_hours = 0
    gap_start: datetime | None = None
    cursor = window_start
    while cursor < window_end:
        if cursor in observed:
            observed_hours += 1
            if gap_start is not None:
                gaps.append(CoverageGap(
                    gap_start, cursor, int((cursor - gap_start) / _HOUR),
                    source_label_at(gap_start), values.get(cursor),
                ))
                gap_start = None
        elif gap_start is None:
            gap_start = cursor
        cursor += _HOUR
    if gap_start is not None:
        gaps.append(CoverageGap(
            gap_start, window_end, int((window_end - gap_start) / _HOUR),
            source_label_at(gap_start), None,
        ))
    counts = Counter(issue.reason for issue in series.issues)
    return SeriesCoverage(
        logical_id=logical_id,
        label=label,
        unit=unit,
        status="gaps" if gaps else "complete",
        expected_hours=expected,
        observed_hours=observed_hours,
        gaps=tuple(gaps),
        issue_counts=tuple(sorted(counts.items())),
    )


async def _cycle_coverage(
    hass: Any,
    model: Mapping[str, Any],
    unit_id: str,
    cycle: BillingCycle,
    now: datetime,
) -> CycleCoverage:
    period = cycle.period
    evaluated_until = min(
        _floor_hour(period.end), _floor_hour(now - RECORDER_COMPILE_MARGIN)
    )
    window_start = _ceil_hour(period.start)
    series = []
    for logical_id in get_series_logical_ids(model, unit_id):
        series.append(await _series_coverage(
            hass, model, logical_id, window_start, max(window_start, evaluated_until)
        ))
    return CycleCoverage(
        status=cycle.status,
        reference=cycle.predicted_reference,
        start=period.start,
        end=period.end,
        evaluated_until=evaluated_until if evaluated_until > window_start else None,
        series=tuple(series),
    )


def _invoice_health(
    model: Mapping[str, Any],
    document: EquatorialDocument | None,
    unit_id: str,
    cycles: tuple[BillingCycle, ...],
    now: datetime,
    late_after_days: int | None,
    investment: Any = None,
) -> tuple[InvoiceHealth, list[DataHealthFinding]]:
    empty = InvoiceHealth(
        False, None, None, None, None, None, (), None, None, None, None
    )
    if document is None:
        return empty, []
    billing_key = get_unit_definition(model, unit_id).get("billing_key")
    try:
        latest = get_latest_bill(document, billing_key)
    except BillingError:
        return empty, []

    awaiting_reference = awaiting_since = invoice_status = None
    provisional = next((item for item in cycles if item.status == "provisional"), None)
    if provisional is not None and provisional.period is not None:
        awaiting_reference = provisional.predicted_reference
        awaiting_since = provisional.period.end
        invoice_status = provisional.invoice_status
    elif (
        is_bill_only_unit(model, unit_id)
        and latest is not None
        and latest.next_reading is not None
    ):
        # A unidade sem medidor nao tem ciclo provisorio, mas a data da proxima
        # leitura impressa na fatura basta para saber que a seguinte ja devia
        # estar a caminho. O prazo e o mesmo do modelo, aplicado pela mesma
        # funcao que classifica o ciclo provisorio.
        tz = get_timezone(get_timezone_name(model))
        boundary = parse_boundary_time(get_billing_boundary_time(model))
        expected = at_boundary(latest.next_reading, boundary, tz)
        if now >= expected:
            awaiting_reference = predicted_reference(expected)
            awaiting_since = expected
            invoice_status = invoice_status_after_reading(expected, now, late_after_days)

    # A tarifa que a fatura publica e o confronto com a base declarada. O
    # cálculo já faz essa comparação para escolher a tarifa, e cala quando elas
    # discordam — é aqui que a divergência ganha voz.
    published_tariff = None
    findings: list[DataHealthFinding] = []
    if latest is not None:
        try:
            snapshot = get_official_financial_snapshot(
                document, unit_id, latest.reference
            )
        except FinanceError:
            snapshot = None
        if snapshot is not None:
            published = resolve_published_energy_tariff(snapshot)
            published_tariff = None if published is None else str(published)
            divergencia = tariff_disagreement(snapshot, investment)
            if divergencia is not None:
                findings.append(DataHealthFinding(
                    "attention", "tariff_out_of_date",
                    reference=latest.reference,
                    published=str(divergencia[0]),
                    declared=str(divergencia[1]),
                ))

    return InvoiceHealth(
        available=latest is not None,
        latest_reference=latest.reference if latest else None,
        latest_reading=latest.reading_current if latest else None,
        published_tariff=published_tariff,
        next_reading=latest.next_reading if latest else None,
        extraction_status=latest.extraction_status if latest else None,
        extraction_alerts=latest.extraction_alerts if latest else (),
        awaiting_reference=awaiting_reference,
        awaiting_since=awaiting_since,
        invoice_status=invoice_status,
        waiting_days=(
            max(int((now - awaiting_since) / timedelta(days=1)), 0)
            if awaiting_since is not None else None
        ),
    ), findings


def _sensor_findings(
    sensors: tuple[SensorHealth, ...],
    measured: bool,
    now: datetime,
    silent_after_minutes: int | None,
) -> tuple[list[DataHealthFinding], datetime | None]:
    findings: list[DataHealthFinding] = []
    reports = [
        report for report in (
            _last_report(sensor) for sensor in sensors if sensor.status == "ok"
        )
        if report is not None
    ]
    meter_last_report = max(reports) if reports else None
    if not sensors:
        return findings, meter_last_report

    # Com o medidor inteiro fora, um achado por entidade repetiria a mesma
    # causa oito vezes. Um so, e a tabela de sensores mostra o detalhe.
    if all(sensor.status != "ok" for sensor in sensors):
        since = max(
            (sensor.last_changed for sensor in sensors if sensor.last_changed),
            default=None,
        )
        findings.append(DataHealthFinding("critical", "meter_unreachable", start=since))
        return findings, meter_last_report

    for sensor in sensors:
        if sensor.status == "ok":
            continue
        findings.append(DataHealthFinding(
            "critical",
            {
                "missing": "sensor_missing",
                "invalid": "sensor_invalid",
            }.get(sensor.status, "sensor_unavailable"),
            logical_id=sensor.logical_id,
            label=sensor.label,
            start=sensor.last_changed,
        ))

    # O silencio e medido nas grandezas instantaneas, que variam o tempo todo.
    # Contador de energia parado de madrugada e normal e nao conta aqui.
    measurements = [sensor for sensor in sensors if sensor.kind == "measurement"]
    live = [
        report for report in (
            _last_report(sensor) for sensor in measurements if sensor.status == "ok"
        )
        if report is not None
    ]
    if (
        measured
        and silent_after_minutes is not None
        and live
        and now - max(live) > timedelta(minutes=silent_after_minutes)
    ):
        findings.append(DataHealthFinding(
            "critical", "meter_silent", start=max(live),
            count=int((now - max(live)) / timedelta(minutes=1)),
        ))
    return findings, meter_last_report


def _coverage_findings(coverage: tuple[CycleCoverage, ...]) -> list[DataHealthFinding]:
    findings: list[DataHealthFinding] = []
    for cycle in coverage:
        for series in cycle.series:
            if series.status == "unavailable":
                findings.append(DataHealthFinding(
                    "attention", "coverage_unavailable",
                    logical_id=series.logical_id, label=series.label,
                    reference=cycle.reference,
                ))
                continue
            if series.gaps:
                largest = max(series.gaps, key=lambda gap: gap.hours)
                findings.append(DataHealthFinding(
                    "attention", "coverage_gap",
                    logical_id=series.logical_id, label=series.label,
                    reference=cycle.reference,
                    count=len(series.gaps),
                    hours=sum(gap.hours for gap in series.gaps),
                    start=largest.start, end=largest.end,
                ))
            for reason, count in series.issue_counts:
                if reason in _DISCARD_REASONS:
                    findings.append(DataHealthFinding(
                        "attention", "readings_discarded",
                        logical_id=series.logical_id, label=series.label,
                        reference=cycle.reference, count=count, reason=reason,
                    ))
                elif reason == "skip_first_change":
                    findings.append(DataHealthFinding(
                        "info", "source_cutover_protection",
                        logical_id=series.logical_id, label=series.label,
                        reference=cycle.reference, count=count, reason=reason,
                    ))
    return findings


def _invoice_findings(invoice: InvoiceHealth, document_available: bool) -> list[DataHealthFinding]:
    if not document_available:
        return []
    findings: list[DataHealthFinding] = []
    if invoice.invoice_status == "late":
        findings.append(DataHealthFinding(
            "critical", "invoice_late",
            reference=invoice.awaiting_reference, days=invoice.waiting_days,
            start=invoice.awaiting_since,
        ))
    elif invoice.invoice_status == "awaiting":
        findings.append(DataHealthFinding(
            "info", "invoice_awaiting",
            reference=invoice.awaiting_reference, days=invoice.waiting_days,
            start=invoice.awaiting_since,
        ))
    if invoice.extraction_alerts:
        findings.append(DataHealthFinding(
            "attention", "extraction_alerts",
            reference=invoice.latest_reference, count=len(invoice.extraction_alerts),
        ))
    return findings


async def _unit_health(
    hass: Any,
    model: Mapping[str, Any],
    document: EquatorialDocument | None,
    unit_id: str,
    now: datetime,
    silent_after_minutes: int | None,
    late_after_days: int | None,
    investment: Any = None,
) -> UnitDataHealth:
    definition = get_unit_definition(model, unit_id)
    measured = definition.get("measured") is True

    sensors: list[SensorHealth] = []
    sources: list[SeriesSources] = []
    findings: list[DataHealthFinding] = []
    for logical_id in get_series_logical_ids(model, unit_id):
        series_definition = get_series_definition(model, logical_id)
        sources.append(_series_sources(model, logical_id, now))
        active = _active_source(series_definition, now)
        if active is None:
            findings.append(DataHealthFinding(
                "critical", "series_without_source",
                logical_id=logical_id, label=series_definition["label"],
            ))
            continue
        sensors.append(_read_sensor(
            hass, logical_id, series_definition["label"], "series",
            active["entity_id"], active.get("label"),
        ))
    for logical_id in get_measurement_logical_ids(model, unit_id):
        measurement = get_measurement_definition(model, logical_id)
        sensors.append(_read_sensor(
            hass, logical_id, measurement["label"], "measurement",
            measurement["entity_id"], None,
        ))

    sensor_findings, meter_last_report = _sensor_findings(
        tuple(sensors), measured, now, silent_after_minutes
    )
    findings.extend(sensor_findings)

    cycles: tuple[BillingCycle, ...] = ()
    if document is not None:
        try:
            cycles = get_billing_cycles(model, document, unit_id, now)
        except BillingCycleError:
            findings.append(DataHealthFinding("attention", "cycles_unavailable"))

    coverage = []
    if get_series_logical_ids(model, unit_id):
        for cycle in cycles:
            if cycle.status in ("provisional", "open") and cycle.period is not None:
                coverage.append(await _cycle_coverage(hass, model, unit_id, cycle, now))
    # Mais antigo primeiro: o provisorio vem antes do aberto, na ordem do tempo.
    coverage.sort(key=lambda item: item.start)
    findings.extend(_coverage_findings(tuple(coverage)))

    invoice, tariff_findings = _invoice_health(
        model, document, unit_id, cycles, now, late_after_days, investment
    )
    findings.extend(_invoice_findings(invoice, document is not None))
    findings.extend(tariff_findings)

    findings.sort(key=lambda item: _SEVERITY_ORDER[item.severity])
    if any(item.severity == "critical" for item in findings):
        status = "critical"
    elif any(item.severity == "attention" for item in findings):
        status = "attention"
    else:
        status = "ok"
    return UnitDataHealth(
        unit_id=unit_id,
        name=get_unit_name(model, unit_id),
        measured=measured,
        status=status,
        meter_last_report=meter_last_report,
        findings=tuple(findings),
        sensors=tuple(sensors),
        sources=tuple(sources),
        coverage=tuple(coverage),
        invoice=invoice,
    )


async def async_build_data_health(
    hass: Any,
    model: Mapping[str, Any],
    document: EquatorialDocument | None,
    now: datetime,
    investment: Any = None,
) -> DataHealthResult:
    """Assemble the data health of every configured unit."""
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise DataHealthError("now must be a timezone-aware datetime")
    try:
        silent_after = get_meter_silent_after_minutes(model)
        late_after = get_invoice_late_after_days(model)
        units = []
        for unit_id in get_unit_ids(model):
            units.append(await _unit_health(
                hass, model, document, unit_id, now, silent_after, late_after,
                investment,
            ))
    except (EnergyModelError, PeriodError) as error:
        raise DataHealthError("could not build data health") from error
    return DataHealthResult(
        generated_at=now,
        meter_silent_after_minutes=silent_after,
        invoice_late_after_days=late_after,
        billing_available=document is not None,
        units=tuple(units),
    )
