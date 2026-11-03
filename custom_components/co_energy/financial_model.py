"""Strict loader for versioned solar investment inputs.

This module formalizes inputs only. It deliberately does not calculate savings,
payback, projections, or allocations between units.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_DOWN, Decimal, InvalidOperation
from pathlib import Path
import re
from types import MappingProxyType
from typing import Any

from .billing import BillingError, parse_billing_reference


class FinancialModelError(ValueError):
    """Raised when the financial input model is invalid or unavailable."""


@dataclass(frozen=True)
class FinancialEvidence:
    """Traceable origin of an investment value."""

    type: str
    description: str


@dataclass(frozen=True)
class FinancialInvestment:
    """One immutable investment cash flow with its real time precision."""

    id: str
    category: str
    amount: Decimal
    currency: str
    payment_period: str
    date_precision: str
    payment_method: str
    description: str
    evidence: FinancialEvidence


@dataclass(frozen=True)
class DistributorTariff:
    """Tarifa de energia homologada, sem tributos, e a data em que passou a valer.

    A distribuidora publica esta tarifa e a reajusta por resolução da ANEEL,
    com data de início de vigência — não por ano civil. Ela é a base do preço
    da energia: a tarifa que aparece na fatura é esta, elevada pelas alíquotas
    de PIS, COFINS e ICMS **daquela fatura**, que variam mês a mês.

    Existe porque uma unidade que compensou todo o consumo não imprime nenhuma
    tarifa na conta — mas imprime as próprias alíquotas. Com esta base, a tarifa
    de cada unidade passa a sair da fatura dela mesma, sem tomar emprestado o
    número de outra unidade.

    Uma vigência declarada nunca deve ser reescrita: o reajuste seguinte é uma
    entrada nova. Como nada é gravado, é o histórico aqui que mantém o passado
    calculado com a tarifa que valia nele.
    """

    effective_from: date
    tariff_without_taxes: Decimal
    source: str


@dataclass(frozen=True)
class AvailabilityCost:
    """Consumo minimo faturavel por tipo de ligacao, em kWh."""

    minimum_billable_kwh: Mapping[str, Decimal]


@dataclass(frozen=True)
class PaybackConfiguration:
    """Validated inputs reserved for a future payback calculation."""

    schema_version: int
    scope: str
    currency: str
    start_billing_reference: str
    maintenance_policy: str
    investments: tuple[FinancialInvestment, ...]
    distributor_tariffs: tuple[DistributorTariff, ...] = ()
    availability_cost: AvailabilityCost | None = None

    def minimum_billable_kwh(self, connection_type: str) -> Decimal | None:
        """Return the minimum billable consumption of one connection type.

        Devolve None quando a secao nao foi declarada ou quando o tipo de
        ligacao publicado pela fatura nao esta previsto — nesse caso a
        estimativa segue sem piso, em vez de assumir um valor.
        """
        if self.availability_cost is None or not isinstance(connection_type, str):
            return None
        return self.availability_cost.minimum_billable_kwh.get(
            connection_type.strip().lower()
        )

    def tariff_at(self, day: date) -> DistributorTariff | None:
        """Return the base tariff in force on one day, or None before the first."""
        if not isinstance(day, date):
            return None
        vigente = None
        for item in self.distributor_tariffs:
            if item.effective_from <= day:
                vigente = item
        return vigente

    def tariff_for_period(
        self, start: date | None, end: date | None
    ) -> DistributorTariff | None:
        """Base tariff of one billing cycle, weighted by days when it straddles a
        tariff change.

        A distribuidora fatura cada dia pela tarifa vigente nele e imprime a
        média. Conferido contra duas faturas reais de NOV/2025, que fecham na
        sexta casa: o dia da leitura anterior não é faturado, o da leitura atual
        é, e a vigência entra no próprio dia em que começa.

        Devolve None quando qualquer dia do ciclo é anterior à vigência mais
        antiga declarada: sem tarifa conhecida para aquele trecho, não há média
        honesta a fazer.
        """
        if not self.distributor_tariffs:
            return None
        if not isinstance(start, date) or not isinstance(end, date) or start >= end:
            return None
        days = (end - start).days
        total = Decimal("0")
        applicable: list[DistributorTariff] = []
        counts: dict[date, int] = {}
        for offset in range(1, days + 1):
            item = self.tariff_at(start + timedelta(days=offset))
            if item is None:
                return None
            total += item.tariff_without_taxes
            counts[item.effective_from] = counts.get(item.effective_from, 0) + 1
            if item not in applicable:
                applicable.append(item)
        if len(applicable) == 1:
            return applicable[0]
        # Trunca, não arredonda: é o que a fatura faz, e arredondar para cima
        # produziria uma economia maior do que a real.
        value = (total / days).quantize(_TARIFF_PRECISION, rounding=ROUND_DOWN)
        source = " + ".join(
            f"{item.source} ({counts[item.effective_from]} dias)"
            for item in applicable
        )
        return DistributorTariff(
            effective_from=applicable[0].effective_from,
            tariff_without_taxes=value,
            source=source,
        )

    @property
    def investment_total(self) -> Decimal:
        """Derive the total from cash flows, preserving Decimal arithmetic."""
        return sum((item.amount for item in self.investments), Decimal("0"))


_TOP_LEVEL_FIELDS = {"schema_version", "scope", "currency", "payback"}
# Seções opcionais: o modelo continua válido sem elas. Sem `distributor_tariffs`
# a tarifa segue sendo lida da fatura que a publica; sem `investments` o valor
# vem da tela de Configuração, que é onde ele passou a morar — uma instalação
# nova não recebe o investimento de ninguém pronto num arquivo do projeto.
_OPTIONAL_TOP_LEVEL_FIELDS = {
    "distributor_tariffs", "availability_cost", "investments",
}
_AVAILABILITY_FIELDS = {"minimum_billable_kwh"}
_CONNECTION_TYPES = {"monofasico", "bifasico", "trifasico"}
_TARIFF_FIELDS = {"from", "tariff_without_taxes", "source"}
_PAYBACK_FIELDS = {"start_billing_reference", "maintenance_policy"}
_INVESTMENT_FIELDS = {
    "id", "category", "amount", "currency", "payment_period",
    "date_precision", "payment_method", "description", "evidence",
}
_EVIDENCE_FIELDS = {"type", "description"}
_DECIMAL_PATTERN = re.compile(r"(?:0|[1-9]\d*)(?:\.\d+)?")
_DATE_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}")
_TARIFF_PRECISION = Decimal("0.000001")
_MONTH_PATTERN = re.compile(r"(\d{4})-(\d{2})")
_CURRENCY_PATTERN = re.compile(r"[A-Z]{3}")


def _mapping(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise FinancialModelError(f"{field} must be a mapping")
    return value


def _exact_fields(value: Mapping[str, Any], expected: set[str], field: str) -> None:
    if set(value) != expected:
        raise FinancialModelError(f"{field} must contain exactly {sorted(expected)}")


def _text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip() or value != value.strip():
        raise FinancialModelError(f"{field} must be a non-empty trimmed string")
    return value


def _choice(value: Any, allowed: set[str], field: str) -> str:
    value = _text(value, field)
    if value not in allowed:
        raise FinancialModelError(f"{field} is unsupported")
    return value


def _currency(value: Any, field: str) -> str:
    value = _text(value, field)
    if _CURRENCY_PATTERN.fullmatch(value) is None:
        raise FinancialModelError(f"{field} must be a three-letter uppercase currency")
    return value


def _amount(value: Any, field: str) -> Decimal:
    if not isinstance(value, str) or _DECIMAL_PATTERN.fullmatch(value) is None:
        raise FinancialModelError(f"{field} must be a positive decimal string")
    try:
        result = Decimal(value)
    except InvalidOperation as error:
        raise FinancialModelError(f"{field} must be a valid decimal string") from error
    if not result.is_finite() or result <= 0:
        raise FinancialModelError(f"{field} must be finite and positive")
    return result


def _month(value: Any, field: str) -> str:
    value = _text(value, field)
    match = _MONTH_PATTERN.fullmatch(value)
    if match is None or not 1 <= int(match.group(2)) <= 12:
        raise FinancialModelError(f"{field} must use a valid YYYY-MM format")
    return value


def _effective_from(value: Any, field: str) -> date:
    """Data de início de vigência, no formato que a resolução publica."""
    text = _text(value, field)
    if _DATE_PATTERN.fullmatch(text) is None:
        raise FinancialModelError(f"{field} must use a valid YYYY-MM-DD format")
    try:
        parsed = date.fromisoformat(text)
    except ValueError as error:
        raise FinancialModelError(f"{field} must be a real calendar date") from error
    if not 2000 <= parsed.year <= 2100:
        raise FinancialModelError(f"{field} must be a plausible calendar date")
    return parsed


def _distributor_tariffs(raw: Any) -> tuple[DistributorTariff, ...]:
    if raw is None:
        return ()
    if not isinstance(raw, list) or not raw:
        raise FinancialModelError("distributor_tariffs must be a non-empty list")
    tariffs: list[DistributorTariff] = []
    seen: set[date] = set()
    for index, item in enumerate(raw):
        field = f"distributor_tariffs[{index}]"
        entry = _mapping(item, field)
        _exact_fields(entry, _TARIFF_FIELDS, field)
        effective_from = _effective_from(entry["from"], f"{field}.from")
        if effective_from in seen:
            raise FinancialModelError("distributor_tariffs dates must be unique")
        seen.add(effective_from)
        tariffs.append(DistributorTariff(
            effective_from=effective_from,
            tariff_without_taxes=_amount(
                entry["tariff_without_taxes"], f"{field}.tariff_without_taxes"
            ),
            source=_text(entry["source"], f"{field}.source"),
        ))
    # Ordenadas por vigência: a leitura percorre a lista assumindo essa ordem,
    # e um YAML fora de ordem não deve mudar o resultado.
    return tuple(sorted(tariffs, key=lambda item: item.effective_from))


def _availability_cost(raw: Any) -> AvailabilityCost | None:
    if raw is None:
        return None
    section = _mapping(raw, "availability_cost")
    _exact_fields(section, _AVAILABILITY_FIELDS, "availability_cost")
    minimums = _mapping(
        section["minimum_billable_kwh"], "availability_cost.minimum_billable_kwh"
    )
    unknown = set(minimums) - _CONNECTION_TYPES
    if unknown or not minimums:
        raise FinancialModelError(
            "availability_cost.minimum_billable_kwh accepts only "
            f"{sorted(_CONNECTION_TYPES)}"
        )
    return AvailabilityCost(minimum_billable_kwh={
        key: _amount(
            minimums[key], f"availability_cost.minimum_billable_kwh.{key}"
        )
        for key in sorted(minimums)
    })


#: Moeda de quem não declarou nenhuma. A integração nasce assim, e o valor
#: informado na tela herda esta moeda.
DEFAULT_CURRENCY = "BRL"

#: Consumo mínimo faturável por tipo de ligação, em kWh.
#:
#: Não é dado de instalação nenhuma: é o mínimo que a ANEEL fixa para todo o
#: país, e a distribuidora cobra mesmo de quem consumiu menos. Por isso vem
#: pronto em vez de ser perguntado — e o tipo de ligação de cada unidade nem
#: precisa ser informado, porque ``get_unit_connection_type`` o lê da própria
#: fatura, que é quem o define.
#:
#: Enquanto morava só no arquivo, quem instalava sem arquivo ficava sem a
#: tabela e sem campo onde informá-la: o custo de disponibilidade
#: simplesmente não era considerado, e nada dizia por quê. Declarado em
#: arquivo, o arquivo continua vencendo.
DEFAULT_MINIMUM_BILLABLE_KWH: Mapping[str, Decimal] = MappingProxyType({
    "monofasico": Decimal("30"),
    "bifasico": Decimal("50"),
    "trifasico": Decimal("100"),
})


def base_financial_configuration() -> PaybackConfiguration:
    """A configuração financeira de uma instalação que não declarou nada.

    Existe para o valor informado na tela ter onde pousar quando não há
    arquivo nenhum — que é o caso de toda instalação nova. Sem ela, digitar o
    investimento não produzia payback, porque não havia configuração sobre a
    qual aplicá-lo.

    ``start_billing_reference`` fica vazio de propósito: nenhum cálculo o lê
    hoje, e a regra de a partir de qual ciclo o payback conta continua entre
    as pendências bloqueadas. Inventá-la aqui seria decidir por conta própria.

    O mínimo faturável, ao contrário, vem preenchido: não é decisão de
    ninguém, é o que a ANEEL fixa para o país inteiro.
    """
    return PaybackConfiguration(
        schema_version=1,
        scope="solar_system",
        currency=DEFAULT_CURRENCY,
        start_billing_reference="",
        maintenance_policy="excluded_from_simple_payback",
        availability_cost=AvailabilityCost(
            minimum_billable_kwh=dict(DEFAULT_MINIMUM_BILLABLE_KWH)
        ),
        investments=(),
    )


def parse_financial_model(value: Any) -> PaybackConfiguration:
    """Validate and normalize an already-loaded financial model."""
    model = _mapping(value, "financial model")
    unknown = set(model) - _TOP_LEVEL_FIELDS - _OPTIONAL_TOP_LEVEL_FIELDS
    if unknown or not _TOP_LEVEL_FIELDS <= set(model):
        raise FinancialModelError(
            f"financial model must contain exactly {sorted(_TOP_LEVEL_FIELDS)}"
            f" and optionally {sorted(_OPTIONAL_TOP_LEVEL_FIELDS)}"
        )
    if isinstance(model["schema_version"], bool) or model["schema_version"] != 1:
        raise FinancialModelError("schema_version must be 1")

    scope = _choice(model["scope"], {"solar_system"}, "scope")
    currency = _currency(model["currency"], "currency")
    payback = _mapping(model["payback"], "payback")
    _exact_fields(payback, _PAYBACK_FIELDS, "payback")
    reference = _text(payback["start_billing_reference"], "payback.start_billing_reference")
    try:
        parse_billing_reference(reference)
    except BillingError as error:
        raise FinancialModelError("payback.start_billing_reference is invalid") from error
    maintenance = _choice(
        payback["maintenance_policy"],
        {"excluded_from_simple_payback"},
        "payback.maintenance_policy",
    )

    raw_investments = model.get("investments", [])
    if not isinstance(raw_investments, list):
        raise FinancialModelError("investments must be a list")
    investments: list[FinancialInvestment] = []
    seen_ids: set[str] = set()
    for index, raw in enumerate(raw_investments):
        field = f"investments[{index}]"
        item = _mapping(raw, field)
        _exact_fields(item, _INVESTMENT_FIELDS, field)
        investment_id = _text(item["id"], f"{field}.id")
        if investment_id in seen_ids:
            raise FinancialModelError("investment ids must be unique")
        item_currency = _currency(item["currency"], f"{field}.currency")
        if item_currency != currency:
            raise FinancialModelError("investment currency must match model currency")
        evidence = _mapping(item["evidence"], f"{field}.evidence")
        _exact_fields(evidence, _EVIDENCE_FIELDS, f"{field}.evidence")
        investments.append(FinancialInvestment(
            id=investment_id,
            category=_choice(item["category"], {"initial", "additional"}, f"{field}.category"),
            amount=_amount(item["amount"], f"{field}.amount"),
            currency=item_currency,
            payment_period=_month(item["payment_period"], f"{field}.payment_period"),
            date_precision=_choice(item["date_precision"], {"month"}, f"{field}.date_precision"),
            payment_method=_choice(item["payment_method"], {"cash"}, f"{field}.payment_method"),
            description=_text(item["description"], f"{field}.description"),
            evidence=FinancialEvidence(
                type=_choice(evidence["type"], {"owner_reported"}, f"{field}.evidence.type"),
                description=_text(evidence["description"], f"{field}.evidence.description"),
            ),
        ))
        seen_ids.add(investment_id)

    return PaybackConfiguration(
        schema_version=1,
        distributor_tariffs=_distributor_tariffs(model.get("distributor_tariffs")),
        scope=scope,
        currency=currency,
        start_billing_reference=reference,
        maintenance_policy=maintenance,
        investments=tuple(investments),
        availability_cost=_availability_cost(model.get("availability_cost")),
    )


def _load_yaml(path: str | Path) -> Mapping[str, Any]:
    from homeassistant.util.yaml import load_yaml_dict

    return load_yaml_dict(path)


def load_financial_model(path: str | Path) -> PaybackConfiguration:
    """Load the explicit versioned file without supplying inferred defaults."""
    try:
        raw = _load_yaml(path)
    except Exception as error:
        raise FinancialModelError(f"could not load financial model: {error}") from error
    return parse_financial_model(raw)
