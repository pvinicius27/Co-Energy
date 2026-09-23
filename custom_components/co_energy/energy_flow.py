"""Operational energy flow of the generating unit for one closed billing cycle."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
import re
from typing import Any

from .billing_cycle import BillingCycleError, ClosedBillingCycle, get_billing_cycles
from .distribution import (
    ConfiguredDistributionSnapshot,
    DistributionStorageData,
    DistributionValidationError,
    resolve_distribution,
)
from .energy_model import (
    EnergyModelError,
    get_coverage_quality_policy,
    get_generator_unit_id,
    get_unit_ids,
    get_unit_name,
)
from .equatorial_adapter import EquatorialDocument
from .periods import (
    Period,
    PeriodError,
    build_calendar_day,
    build_calendar_month,
    build_calendar_year,
)
from .self_consumption import (
    SelfConsumptionError,
    SelfConsumptionResult,
    async_get_solar_self_consumption,
)


class EnergyFlowError(ValueError):
    """Base error for the operational energy-flow contract."""


class EnergyFlowInvalidReferenceError(EnergyFlowError):
    """Raised when the requested reference matches no cycle of the generating unit."""


class EnergyFlowUnavailableError(EnergyFlowError):
    """Raised when a required domain source cannot provide the flow."""


@dataclass(frozen=True)
class EnergyFlowAllocation:
    unit_id: str
    name: str
    share_percent: Decimal
    allocated_energy_kwh: Decimal | None
    classification: str = "calculated"


@dataclass(frozen=True)
class EnergyFlowQuality:
    status: str
    warnings: tuple[str, ...]


# Ciclos que o fluxo aceita. O fechado e o unico com fatura; os outros dois
# sao periodos reais em andamento, e e justamente neles que o painel responde
# "como esta o sistema agora" — a pergunta que o ciclo fechado nao responde.
OPERATIONAL_CYCLE_STATUSES = ("closed", "provisional", "open")


@dataclass(frozen=True)
class EnergyFlowResult:
    billing_reference: str
    cycle_status: str
    # Qual recorte produziu este fluxo. So "cycle" tem apuracao oficial; os
    # demais sao observacao, e o aviso de liquidacao por ciclo acompanha.
    period_kind: str
    period_start: datetime
    period_end: datetime
    generation_kwh: Decimal | None
    self_consumption_kwh: Decimal | None
    export_kwh: Decimal | None
    import_kwh: Decimal | None
    generator_compensation_kwh: Decimal | None
    distributable_balance_kwh: Decimal | None
    allocations: tuple[EnergyFlowAllocation, ...]
    quality: EnergyFlowQuality


# Recortes que o fluxo aceita alem do ciclo de faturamento. O ciclo continua
# sendo o unico com apuracao oficial; os demais existem para observar o sistema
# numa janela mais curta, e o contrato marca isso em `period_kind` e nos avisos.
PERIOD_KINDS = ("cycle", "day", "month", "year")

# O que a compensacao e o saldo para rateio significam fora de um ciclo: nada
# oficial. O SCEE apura por ciclo de faturamento, entao num dia ou num mes esses
# dois numeros sao a mesma regra aplicada a uma janela que a distribuidora nunca
# vai fechar. Sai como aviso permanente, nao como nota de rodape opcional.
SETTLEMENT_WARNING = "settlement_is_per_cycle"


@dataclass(frozen=True)
class FlowWindow:
    """A period the flow can be built over, cycle or calendar.

    Expoe os mesmos tres atributos que o construtor le de um ciclo — `period`,
    `billing_reference` e `status` — para que o calculo nao precise saber de
    qual dos dois veio a janela.
    """

    period: Period
    billing_reference: str
    status: str
    kind: str


def build_calendar_window(
    kind: str, reference: str, zone: Any, now: datetime | None = None
) -> FlowWindow:
    """Build a calendar window from a strict textual reference.

    Formatos aceitos, sem tolerancia: ``YYYY-MM-DD`` para dia, ``YYYY-MM`` para
    mes e ``YYYY`` para ano. Aceitar variacoes aqui significaria adivinhar o que
    o operador quis dizer, e uma janela errada nao se anuncia — ela so devolve
    numeros plausiveis do periodo errado.
    """
    if kind not in ("day", "month", "year"):
        raise EnergyFlowInvalidReferenceError("period kind is not a calendar kind")
    if not isinstance(reference, str) or not reference.strip():
        raise EnergyFlowInvalidReferenceError("calendar reference must be text")
    texto = reference.strip()
    try:
        if kind == "day":
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", texto) is None:
                raise EnergyFlowInvalidReferenceError("day must use YYYY-MM-DD")
            period = build_calendar_day(date.fromisoformat(texto), zone)
        elif kind == "month":
            if re.fullmatch(r"\d{4}-\d{2}", texto) is None:
                raise EnergyFlowInvalidReferenceError("month must use YYYY-MM")
            ano, mes = (int(parte) for parte in texto.split("-"))
            period = build_calendar_month(ano, mes, zone)
        else:
            if re.fullmatch(r"\d{4}", texto) is None:
                raise EnergyFlowInvalidReferenceError("year must use YYYY")
            period = build_calendar_year(int(texto), zone)
    except (PeriodError, ValueError) as error:
        raise EnergyFlowInvalidReferenceError(
            f"calendar reference is invalid: {reference!r}"
        ) from error
    # A janela para em `now`, como o ciclo aberto ja faz. Sem isto, pedir o ano
    # corrente mandaria buscar ate 1o de janeiro seguinte — meses de dados que
    # ainda nao existem — e a consulta ao Recorder crescia sem necessidade,
    # alem de a cobertura sair baixa por um vazio que e so o futuro.
    if now is not None:
        local_now = now.astimezone(zone)
        if local_now <= period.start:
            raise EnergyFlowInvalidReferenceError("period has not started")
        if local_now < period.end:
            try:
                period = Period(period.start, local_now, period.mode, period.reference)
            except PeriodError as error:
                raise EnergyFlowInvalidReferenceError(
                    "period could not be clamped to the present"
                ) from error
    # `status` "open" e o mais fiel: e um periodo real, medido, que nenhuma
    # fatura fechou.
    return FlowWindow(
        period=period, billing_reference=texto, status="open", kind=kind
    )


def _energy_decimal(value: float | None) -> Decimal | None:
    return None if value is None else Decimal(str(value))


def cycle_reference(cycle: ClosedBillingCycle) -> str | None:
    """Name a cycle: the invoiced reference, or the predicted one while open."""
    for candidate in (cycle.billing_reference, getattr(cycle, "predicted_reference", None)):
        if isinstance(candidate, str) and candidate.strip():
            return candidate
    return None


def _distribution_covers_period(
    distribution: ConfiguredDistributionSnapshot,
    cycle: ClosedBillingCycle,
) -> bool:
    if cycle.period is None:
        return False
    return (
        (distribution.effective_from is None or distribution.effective_from <= cycle.period.start)
        and (distribution.effective_until is None or distribution.effective_until >= cycle.period.end)
    )


def build_energy_flow_result(
    model: Mapping[str, Any],
    physical: SelfConsumptionResult,
    cycle: ClosedBillingCycle,
    distribution: ConfiguredDistributionSnapshot,
    period_kind: str = "cycle",
) -> EnergyFlowResult:
    """Build the immutable flow without re-querying or reinterpreting SCEE."""
    if period_kind not in PERIOD_KINDS:
        raise EnergyFlowInvalidReferenceError("period kind is invalid")
    if cycle.period is None or cycle.status not in OPERATIONAL_CYCLE_STATUSES:
        raise EnergyFlowInvalidReferenceError("cycle cannot carry an energy flow")
    reference = cycle_reference(cycle)
    if reference is None:
        raise EnergyFlowInvalidReferenceError("cycle has no usable reference")
    if physical.billing_reference != reference:
        raise EnergyFlowError("physical result and cycle reference differ")
    if physical.period_from != cycle.period.start or physical.period_until != cycle.period.end:
        raise EnergyFlowError("physical result and cycle period differ")
    if not _distribution_covers_period(distribution, cycle):
        raise EnergyFlowUnavailableError("distribution changes within the billing cycle")

    generation = _energy_decimal(physical.generation_kwh)
    self_consumption = _energy_decimal(physical.self_consumption_kwh)
    exported = _energy_decimal(physical.export_kwh)
    imported = _energy_decimal(physical.import_kwh)
    compensation = min(exported, imported) if exported is not None and imported is not None else None
    distributable = max(exported - imported, Decimal("0")) if exported is not None and imported is not None else None

    unit_ids = get_unit_ids(model)
    missing = tuple(unit_id for unit_id in unit_ids if unit_id not in distribution.shares)
    if missing:
        raise EnergyFlowUnavailableError(
            "configured distribution does not cover every configured unit"
        )

    allocations = tuple(
        EnergyFlowAllocation(
            unit_id=unit_id,
            name=get_unit_name(model, unit_id),
            share_percent=distribution.shares[unit_id],
            allocated_energy_kwh=(
                distributable * distribution.shares[unit_id] / Decimal("100")
                if distributable is not None
                else None
            ),
        )
        for unit_id in unit_ids
    )
    extra_warnings = ("import_unavailable",) if imported is None else ()
    # Fora do ciclo, compensacao e saldo para rateio deixam de ter contrapartida
    # oficial: sao a mesma regra numa janela que a distribuidora nunca fecha.
    if period_kind != "cycle":
        extra_warnings = (*extra_warnings, SETTLEMENT_WARNING)
    warnings = tuple(
        dict.fromkeys((*physical.blockers, *physical.warnings, *extra_warnings))
    )
    quality_status = "unavailable" if exported is None or imported is None else physical.status
    return EnergyFlowResult(
        billing_reference=reference,
        cycle_status=cycle.status,
        period_kind=period_kind,
        period_start=cycle.period.start,
        period_end=cycle.period.end,
        generation_kwh=generation,
        self_consumption_kwh=self_consumption,
        export_kwh=exported,
        import_kwh=imported,
        generator_compensation_kwh=compensation,
        distributable_balance_kwh=distributable,
        allocations=allocations,
        quality=EnergyFlowQuality(status=quality_status, warnings=warnings),
    )


async def async_get_energy_flow(
    hass: Any,
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    distribution_data: DistributionStorageData,
    billing_reference: str | None,
    now: datetime,
    *,
    statistics_period: str = "hour",
    period_kind: str = "cycle",
    timezone: Any = None,
) -> EnergyFlowResult:
    """Resolve and calculate one operational flow over a cycle or calendar window.

    ``period_kind`` escolhe o recorte. Em ``cycle``, ``billing_reference`` nomeia
    um ciclo fechado ou a referencia prevista do que esta em curso, e ``None``
    pede o mais recente — que e o que "como esta o sistema agora" quer dizer.
    Nos demais, ``billing_reference`` e a data (``YYYY-MM-DD``), o mes
    (``YYYY-MM``) ou o ano (``YYYY``), e ``timezone`` e obrigatoria.

    Fora do ciclo o lado fisico continua medido, mas compensacao e saldo para
    rateio deixam de ter apuracao oficial: o SCEE fecha por ciclo. O resultado
    carrega `period_kind` e o aviso `settlement_is_per_cycle` para que a
    interface nao possa apresenta-los como faturados.
    """
    if period_kind not in PERIOD_KINDS:
        raise EnergyFlowInvalidReferenceError("period kind is invalid")
    if billing_reference is not None and (
        not isinstance(billing_reference, str) or not billing_reference.strip()
    ):
        raise EnergyFlowInvalidReferenceError("billing_reference must be non-empty")
    if period_kind != "cycle" and billing_reference is None:
        raise EnergyFlowInvalidReferenceError("calendar flow requires a reference")
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise EnergyFlowError("now must be a timezone-aware datetime")
    try:
        if period_kind == "cycle":
            # get_billing_cycles ja devolve aberto, provisorio e fechados na
            # ordem do mais recente para o mais antigo — o primeiro e o atual.
            cycles = tuple(
                item for item in get_billing_cycles(
                    model, billing_document, get_generator_unit_id(model), now
                )
                if item.period is not None
                and item.status in OPERATIONAL_CYCLE_STATUSES
            )
            cycle = (
                next((item for item in cycles if cycle_reference(item) == billing_reference), None)
                if billing_reference is not None
                else next(iter(cycles), None)
            )
            if cycle is None:
                raise EnergyFlowInvalidReferenceError("billing reference was not found")
        else:
            if timezone is None:
                raise EnergyFlowError("calendar flow requires a timezone")
            # `now` recorta a janela no presente e ja recusa periodo futuro.
            cycle = build_calendar_window(
                period_kind, billing_reference, timezone, now
            )
        policy = get_coverage_quality_policy(model)
        distribution = resolve_distribution(
            distribution_data, cycle.period.start, get_unit_ids(model)
        )
        physical = await async_get_solar_self_consumption(
            hass,
            model,
            cycle,
            policy,
            statistics_period=statistics_period,
            # O periodo do ciclo aberto e real: comeca na ultima leitura e vai
            # ate agora. So nao tem fatura ainda.
            accept_open_cycle=True,
        )
        return build_energy_flow_result(
            model, physical, cycle, distribution, period_kind
        )
    except EnergyFlowError:
        raise
    except (BillingCycleError, DistributionValidationError, EnergyModelError, SelfConsumptionError) as error:
        raise EnergyFlowUnavailableError("energy flow source is unavailable") from error
