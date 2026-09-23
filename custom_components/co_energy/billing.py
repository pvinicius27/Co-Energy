"""Semantic interpretation of official Equatorial billing data."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date
import math
import re
from typing import Any

from .equatorial_adapter import (
    EquatorialAdapterError,
    EquatorialDocument,
    get_bill_uc_hash,
    get_unit_bills,
    is_uc_hash,
)


class BillingError(ValueError):
    """Raised when official billing data is semantically invalid."""


@dataclass(frozen=True)
class BillingRecord:
    """Normalized fields from one official bill."""

    unit_id: str
    reference: str
    reference_month: int
    reference_year: int
    due_date: date | None
    reading_previous: date | None
    reading_current: date | None
    reading_days: int | None
    next_reading: date | None
    total_amount: float | None
    currency: str
    consumption_kwh: float | None
    consumption_scee_kwh: float | None
    consumer_unit: str | None
    extraction_status: str | None
    extraction_alerts: tuple[str, ...]
    raw_bill: Mapping[str, Any]
    meter_active_kwh: float | None = None
    meter_generation_kwh: float | None = None
    billing_method: str | None = None
    financial_validation: bool | None = None


_REFERENCE_PATTERN = re.compile(
    r"(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/(\d{4})"
)
_MONTH_NUMBERS = {
    month: number
    for number, month in enumerate(
        ("JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"),
        start=1,
    )
}
_DATE_PATTERN = re.compile(r"(\d{4})-(\d{2})-(\d{2})")
_ACTIVE_ENERGY_QUANTITY = "energia_ativa_kwh"
_GENERATION_ENERGY_QUANTITY = "energia_geracao_kwh"


def parse_billing_reference(reference: Any) -> tuple[int, int]:
    """Parse a strict Portuguese ``MMM/YYYY`` billing reference."""
    if not isinstance(reference, str):
        raise BillingError("reference must be a string in MMM/YYYY format")
    match = _REFERENCE_PATTERN.fullmatch(reference)
    if match is None:
        raise BillingError("reference must use a valid Portuguese MMM/YYYY format")
    month_name, year_text = match.groups()
    return _MONTH_NUMBERS[month_name], int(year_text)


def _parse_optional_date(value: Any, field: str) -> date | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise BillingError(f"{field} must be a string in YYYY-MM-DD format or None")
    match = _DATE_PATTERN.fullmatch(value)
    if match is None:
        raise BillingError(f"{field} must use strict YYYY-MM-DD format")
    year, month, day = (int(part) for part in match.groups())
    try:
        return date(year, month, day)
    except ValueError as error:
        raise BillingError(f"{field} contains an invalid date") from error


def _parse_reading_days(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise BillingError("periodo.dias must be a positive integer or None")
    return value


def _parse_optional_number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise BillingError(f"{field} must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized) or normalized < 0:
        raise BillingError(f"{field} must be finite and non-negative")
    return normalized


def _parse_optional_string(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise BillingError(f"{field} must be a non-empty string or None")
    return value


def _parse_billing_method(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise BillingError("tipo_faturamento must be a string or None")
    normalized = value.strip()
    return normalized or None


def _parse_financial_validation(extraction: Mapping[str, Any]) -> bool | None:
    """Return the extractor's own verdict on the monetary dimension only."""
    validations = extraction.get("validacoes")
    if validations is None:
        return None
    if not isinstance(validations, Mapping):
        raise BillingError("extracao.validacoes must be a mapping or None")
    financial = validations.get("financeira")
    if financial is None:
        return None
    if not isinstance(financial, Mapping):
        raise BillingError("extracao.validacoes.financeira must be a mapping or None")
    matches = financial.get("confere")
    if matches is None:
        return None
    if not isinstance(matches, bool):
        raise BillingError(
            "extracao.validacoes.financeira.confere must be boolean or None"
        )
    return matches


def _parse_extraction(
    raw_bill: Mapping[str, Any],
) -> tuple[str | None, tuple[str, ...], bool | None]:
    extraction = raw_bill.get("extracao")
    if extraction is None:
        return None, (), None
    if not isinstance(extraction, Mapping):
        raise BillingError("extracao must be a mapping")

    status = _parse_optional_string(extraction.get("status"), "extracao.status")
    financial_validation = _parse_financial_validation(extraction)
    alerts = extraction.get("alertas")
    if alerts is None:
        return status, (), financial_validation
    if not isinstance(alerts, list):
        raise BillingError("extracao.alertas must be a list or None")
    if any(not isinstance(alert, str) for alert in alerts):
        raise BillingError("every extracao.alertas item must be a string")
    return status, tuple(alerts), financial_validation


def _parse_measurements(
    raw_bill: Mapping[str, Any],
) -> tuple[float | None, float | None]:
    measurements = raw_bill.get("medicoes")
    if measurements is None:
        return None, None
    if not isinstance(measurements, list):
        raise BillingError("medicoes must be a list or None")

    values: dict[str, float | None] = {}
    for index, measurement in enumerate(measurements):
        field = f"medicoes[{index}]"
        if not isinstance(measurement, Mapping):
            raise BillingError(f"{field} must be a mapping")
        quantity = measurement.get("grandeza")
        if quantity not in (_ACTIVE_ENERGY_QUANTITY, _GENERATION_ENERGY_QUANTITY):
            continue
        if quantity in values:
            raise BillingError(f"duplicate measurement quantity: {quantity}")
        values[quantity] = _parse_optional_number(
            measurement.get("consumo_informado_kwh"),
            f"{field}.consumo_informado_kwh",
        )

    return (
        values.get(_ACTIVE_ENERGY_QUANTITY),
        values.get(_GENERATION_ENERGY_QUANTITY),
    )


def parse_billing_record(unit_id: str, raw_bill: Any) -> BillingRecord:
    """Interpret the documented schema-version-6 fields of one bill."""
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise BillingError("unit_id must be a non-empty string")
    if not isinstance(raw_bill, Mapping):
        raise BillingError("raw_bill must be a mapping")
    identification = raw_bill.get("identificacao")
    period = raw_bill.get("periodo")
    billing = raw_bill.get("faturamento")
    consumption = raw_bill.get("consumo")
    for field, value in (
        ("identificacao", identification),
        ("periodo", period),
        ("faturamento", billing),
        ("consumo", consumption),
    ):
        if not isinstance(value, Mapping):
            raise BillingError(f"{field} must be a mapping")
    if "referencia" not in identification:
        raise BillingError("missing required field: identificacao.referencia")
    if "moeda" not in billing:
        raise BillingError("missing required field: faturamento.moeda")

    reference = identification["referencia"]
    reference_month, reference_year = parse_billing_reference(reference)
    extraction_status, extraction_alerts, financial_validation = _parse_extraction(
        raw_bill
    )
    meter_active_kwh, meter_generation_kwh = _parse_measurements(raw_bill)
    currency = _parse_optional_string(billing["moeda"], "faturamento.moeda")
    if currency is None:
        raise BillingError("faturamento.moeda must be a non-empty string")

    return BillingRecord(
        unit_id=unit_id,
        reference=reference,
        reference_month=reference_month,
        reference_year=reference_year,
        due_date=_parse_optional_date(period.get("vencimento"), "periodo.vencimento"),
        reading_previous=_parse_optional_date(
            period.get("inicio"), "periodo.inicio"
        ),
        reading_current=_parse_optional_date(
            period.get("fim"), "periodo.fim"
        ),
        reading_days=_parse_reading_days(period.get("dias")),
        next_reading=_parse_optional_date(
            period.get("proxima_leitura"), "periodo.proxima_leitura"
        ),
        total_amount=_parse_optional_number(
            billing.get("valor_total"), "faturamento.valor_total"
        ),
        currency=currency,
        consumption_kwh=_parse_optional_number(
            consumption.get("total_kwh"), "consumo.total_kwh"
        ),
        consumption_scee_kwh=_parse_optional_number(
            consumption.get("scee_kwh"), "consumo.scee_kwh"
        ),
        consumer_unit=None,
        extraction_status=extraction_status,
        extraction_alerts=extraction_alerts,
        financial_validation=financial_validation,
        raw_bill=raw_bill,
        meter_active_kwh=meter_active_kwh,
        meter_generation_kwh=meter_generation_kwh,
        billing_method=_parse_billing_method(billing.get("tipo")),
    )


def _require_schema_version_6(document: EquatorialDocument) -> None:
    version = document.schema_version
    if isinstance(version, bool) or version != 6:
        raise BillingError("billing supports only Equatorial schema_version 6")


def get_billing_records(
    document: EquatorialDocument, unit_id: str
) -> tuple[BillingRecord, ...]:
    """Return normalized bills for one unit, or none when it has no invoice.

    Uma unidade que o documento nao conhece nao tem faturas, e isso nao e
    erro. Era, e o preco foi alto: uma unidade recem configurada derrubava
    toda tela que a consultasse — ciclos, financeiro, SCEE, o proprio cartao.
    E a lista de lugares a corrigir nao acabava, porque o problema nao estava
    em nenhum deles.

    Quem pergunta se a unidade existe e a borda, que tem o modelo em maos e
    sabe distinguir um pedido invalido de uma unidade ainda sem fatura. Aqui
    dentro, onde so ha o documento, "nao tem fatura" e a unica leitura
    possivel — e e a correta.
    """
    _require_schema_version_6(document)
    try:
        bills = get_unit_bills(document, unit_id)
    except EquatorialAdapterError:
        return ()
    return tuple(parse_billing_record(unit_id, bill) for bill in bills)


def declared_uc_hashes(model: Any) -> dict[str, frozenset[str]]:
    """Return, per billing key, the UC hashes the model declares for it.

    So entram unidades que declararam alguma UC. Uma unidade sem UC na tela
    continua achando as faturas pelo nome, como sempre achou.
    """
    declaradas: dict[str, frozenset[str]] = {}
    units = model.get("units") if isinstance(model, Mapping) else None
    if not isinstance(units, Mapping):
        return declaradas
    for unit_id, unit in units.items():
        if not isinstance(unit, Mapping):
            continue
        hashes = frozenset(
            item["hash"]
            for item in unit.get("ucs") or ()
            if isinstance(item, Mapping) and isinstance(item.get("hash"), str)
        )
        if not hashes:
            continue
        chave = unit.get("billing_key")
        declaradas[chave if isinstance(chave, str) and chave else unit_id] = hashes
    return declaradas


def _competencia(bill: Any) -> str:
    identificacao = bill.get("identificacao") if isinstance(bill, Mapping) else None
    if isinstance(identificacao, Mapping):
        valor = identificacao.get("competencia")
        if isinstance(valor, str):
            return valor
    return ""


def assign_bills_by_uc(document: Any, model: Any) -> Any:
    """Return the document with each bill filed under the unit that owns its UC.

    Ate aqui, quem dizia de quem e a fatura era o extrator, com uma lista de
    UCs escrita no proprio codigo. Uma unidade criada pela tela nunca recebia
    fatura, e quem instalasse o projeto em outra casa teria de editar Python.

    Agora a UC e declarada na unidade, e a fatura vai para quem a declarou,
    esteja ela guardada sob o nome que estiver. Isso so move — nunca apaga: a
    fatura cuja UC ninguem declarou fica onde o extrator a pos. E o que deixa
    a troca acontecer aos poucos, sem uma data em que tudo precisa estar
    certo de uma vez.
    """
    if not isinstance(document, EquatorialDocument):
        return document
    declaradas = declared_uc_hashes(model)
    if not declaradas:
        return document
    dono = {h: chave for chave, hashes in declaradas.items() for h in hashes}

    ficam: dict[str, list[Any]] = {}
    chegam: dict[str, list[Any]] = {chave: [] for chave in declaradas}
    origem: dict[str, Mapping[str, Any]] = {}
    for chave, unit in document.units.items():
        bills = unit.get("faturas") if isinstance(unit, Mapping) else None
        if not isinstance(bills, list):
            continue
        ficam[chave] = []
        for bill in bills:
            destino = dono.get(get_bill_uc_hash(bill))
            if destino is None or destino == chave:
                ficam[chave].append(bill)
            else:
                chegam[destino].append(bill)
                origem.setdefault(destino, unit)

    if not any(chegam.values()):
        return document

    unidades: dict[str, Any] = {}
    for chave, unit in document.units.items():
        if chave not in ficam:
            unidades[chave] = unit
            continue
        proprias = ficam[chave] + chegam.get(chave, [])
        if chegam.get(chave):
            # Vindas de mais de um lugar, a ordem declarada deixa de existir;
            # a competencia e a unica ordem que as duas origens compartilham.
            proprias.sort(key=_competencia)
        unidades[chave] = {**unit, "faturas": proprias}

    # A unidade que o documento ainda nao conhece herda o perfil de onde
    # suas faturas vieram: o tipo de ligacao e da UC, nao do nome.
    for chave, recebidas in chegam.items():
        if chave in unidades or not recebidas:
            continue
        perfil = {
            campo: valor for campo, valor in origem[chave].items()
            if campo != "faturas"
        }
        unidades[chave] = {
            **perfil, "faturas": sorted(recebidas, key=_competencia),
        }

    return EquatorialDocument(
        schema_version=document.schema_version,
        generated_at=document.generated_at,
        processing=document.processing,
        unidentified_documents=document.unidentified_documents,
        units=unidades,
    )


def bill_stats_by_uc(document: Any) -> dict[str, dict[str, Any]]:
    """Return, per UC hash, how many bills it has and which period they cover.

    O periodo e o que deixa distinguir duas UCs da mesma unidade sem mostrar
    numero nenhum: a renumerada comeca onde a antiga termina.
    """
    faturas: dict[str, list[Any]] = {}
    if not isinstance(document, EquatorialDocument):
        return {}
    for unit in document.units.values():
        bills = unit.get("faturas") if isinstance(unit, Mapping) else None
        for bill in bills if isinstance(bills, list) else ():
            h = get_bill_uc_hash(bill)
            if h:
                faturas.setdefault(h, []).append(bill)

    estatistica: dict[str, dict[str, Any]] = {}
    for h, lista in faturas.items():
        ordenadas = sorted(lista, key=_competencia)
        estatistica[h] = {
            "bills": len(lista),
            "first": _referencia(ordenadas[0]),
            "last": _referencia(ordenadas[-1]),
        }
    return estatistica


def _referencia(bill: Any) -> str | None:
    identificacao = bill.get("identificacao") if isinstance(bill, Mapping) else None
    if isinstance(identificacao, Mapping):
        valor = identificacao.get("referencia")
        if isinstance(valor, str) and valor:
            return valor
    return None


#: Quando as UCs foram trazidas das faturas. Existe para a adocao acontecer
#: uma vez so: se o operador tira uma UC depois, ela nao volta sozinha na
#: proxima partida.
UC_ADOPTION_MARKER = "ucs_adopted_at"


def adopt_ucs_from_bills(
    model: Any, document: Any, adopted_at: str
) -> tuple[dict[str, Any] | None, dict[str, int]]:
    """Return the model with each unit owning the UCs its bills already carry.

    O extrator sempre gravou o hash da UC em cada fatura; so ninguem o lia.
    Uma instalacao que ja funciona pelo nome nao deveria precisar digitar
    UC nenhuma para passar a funcionar pela UC: as faturas que ja estao sob
    cada unidade dizem quais sao as dela.

    Devolve ``(None, {})`` quando nao ha o que adotar, e nesse caso nada e
    gravado. Unidade que ja declarou UC nao e tocada — quem digitou sabe
    mais do que quem deduziu. E uma UC que ja tem dono nao muda de dono.
    """
    if not isinstance(document, EquatorialDocument) or not isinstance(model, Mapping):
        return None, {}
    billing = model.get("billing")
    if isinstance(billing, Mapping) and billing.get(UC_ADOPTION_MARKER):
        return None, {}
    units = model.get("units")
    if not isinstance(units, Mapping):
        return None, {}

    donos = {
        item.get("hash")
        for unit in units.values() if isinstance(unit, Mapping)
        for item in unit.get("ucs") or () if isinstance(item, Mapping)
    }
    adotadas: dict[str, list[str]] = {}
    for unit_id, unit in units.items():
        if not isinstance(unit, Mapping) or unit.get("ucs"):
            continue
        chave = unit.get("billing_key") or unit_id
        origem = document.units.get(chave)
        bills = origem.get("faturas") if isinstance(origem, Mapping) else None
        encontradas: list[str] = []
        for bill in bills if isinstance(bills, list) else ():
            h = get_bill_uc_hash(bill)
            if is_uc_hash(h) and h not in donos and h not in encontradas:
                encontradas.append(h)
        if encontradas:
            adotadas[unit_id] = encontradas
            donos.update(encontradas)

    if not adotadas:
        return None, {}
    novo = {
        **model,
        "billing": {**(billing or {}), UC_ADOPTION_MARKER: adopted_at},
        "units": {
            unit_id: (
                {**unit, "ucs": [{"hash": h} for h in adotadas[unit_id]]}
                if unit_id in adotadas else unit
            )
            for unit_id, unit in units.items()
        },
    }
    return novo, {unit_id: len(lista) for unit_id, lista in adotadas.items()}


def get_bill_by_reference(
    document: EquatorialDocument, unit_id: str, reference: Any
) -> BillingRecord | None:
    """Return the unique bill matching a validated reference."""
    month, year = parse_billing_reference(reference)
    matches = tuple(
        record
        for record in get_billing_records(document, unit_id)
        if (record.reference_month, record.reference_year) == (month, year)
    )
    if len(matches) > 1:
        raise BillingError(f"duplicate billing reference for {unit_id}: {reference}")
    return matches[0] if matches else None


def get_latest_bill(
    document: EquatorialDocument, unit_id: str
) -> BillingRecord | None:
    """Return the chronologically latest bill, independent of JSON order."""
    records = get_billing_records(document, unit_id)
    if not records:
        return None
    return max(records, key=lambda record: (record.reference_year, record.reference_month))
