"""Literal read-only contract for official SCEE billing data."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, replace
from datetime import date
import math
from typing import Any

from .billing import (
    BillingError,
    BillingRecord,
    get_bill_by_reference,
    parse_billing_reference,
)
from .energy_model import EnergyModelError, get_unit_definition
from .equatorial_adapter import EquatorialDocument


class SceeError(ValueError):
    """Raised when official SCEE data is structurally invalid."""


class SceeUnknownUnitError(SceeError):
    """Raised when the requested logical unit is unknown."""


class SceeUnavailableError(SceeError):
    """Raised when the requested unit cannot provide official SCEE data."""


class SceeInvalidReferenceError(SceeError):
    """Raised when the billing reference is malformed."""


class SceeNotFoundError(SceeError):
    """Raised when no official bill has the requested reference."""


@dataclass(frozen=True)
class OfficialSceeRecord:
    """Literal official SCEE fields associated with one billing record."""

    unit_id: str
    billing_reference: str
    period_start: date | None
    period_end: date | None
    extraction_status: str | None
    extraction_alerts: tuple[str, ...]
    applicable: bool
    consumption_total_kwh: float | None
    consumption_scee_kwh: float | None
    energy_compensated_kwh: float | None
    non_compensated_consumption_kwh: float | None
    scee_cycle: str | None
    cycle_generation_kwh: float | None
    credit_received_kwh: float | None
    excess_received_kwh: float | None
    balance_kwh: float | None
    balance_expiring_30_days_kwh: float | None
    balance_expiring_60_days_kwh: float | None
    distribution_percent: float | None


def _parse_applicable(value: Any) -> bool:
    if not isinstance(value, bool):
        raise SceeError("scee.aplicavel must be a boolean")
    return value


def _parse_optional_non_negative_number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SceeError(f"{field} must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized) or normalized < 0:
        raise SceeError(f"{field} must be finite and non-negative")
    return normalized


def _parse_optional_percent(value: Any) -> float | None:
    normalized = _parse_optional_non_negative_number(
        value, "scee.relacoes_rateio_informadas[].percentual"
    )
    if normalized is not None and normalized > 100:
        raise SceeError(
            "scee.relacoes_rateio_informadas[].percentual must be between 0 and 100"
        )
    return normalized


def _parse_optional_cycle(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise SceeError("scee.ciclo must be a string or None")
    return value


def _get_scee_block(raw_bill: Mapping[str, Any]) -> Mapping[str, Any]:
    value = raw_bill.get("scee")
    if value is None:
        return {}
    if not isinstance(value, Mapping):
        raise SceeError("scee must be a mapping or None")
    return value


def _parse_distribution_percent(scee: Mapping[str, Any]) -> float | None:
    relations = scee.get("relacoes_rateio_informadas")
    if relations is None:
        return None
    if not isinstance(relations, list):
        raise SceeError("scee.relacoes_rateio_informadas must be a list or None")
    if not relations:
        return None
    if len(relations) > 1:
        raise SceeError("scee.relacoes_rateio_informadas is ambiguous")
    relation = relations[0]
    if not isinstance(relation, Mapping):
        raise SceeError("scee.relacoes_rateio_informadas[0] must be a mapping")
    return _parse_optional_percent(relation.get("percentual"))


def parse_official_scee_record(bill: BillingRecord) -> OfficialSceeRecord:
    """Extract literal official SCEE values from an already validated bill."""
    scee = _get_scee_block(bill.raw_bill)
    return OfficialSceeRecord(
        unit_id=bill.unit_id,
        billing_reference=bill.reference,
        period_start=bill.reading_previous,
        period_end=bill.reading_current,
        extraction_status=bill.extraction_status,
        extraction_alerts=bill.extraction_alerts,
        applicable=_parse_applicable(scee.get("aplicavel")),
        # O total e a soma de compensado com nao compensado; a parcela SCEE
        # sozinha nao fecha a conta e nao serve de denominador.
        consumption_total_kwh=_parse_optional_non_negative_number(
            bill.consumption_kwh, "consumo.total_kwh"
        ),
        consumption_scee_kwh=_parse_optional_non_negative_number(
            bill.consumption_scee_kwh, "consumo.scee_kwh"
        ),
        energy_compensated_kwh=_parse_optional_non_negative_number(
            scee.get("energia_compensada_kwh"), "scee.energia_compensada_kwh"
        ),
        non_compensated_consumption_kwh=_parse_optional_non_negative_number(
            scee.get("consumo_nao_compensado_kwh"),
            "scee.consumo_nao_compensado_kwh",
        ),
        scee_cycle=_parse_optional_cycle(scee.get("ciclo")),
        # A geracao do ciclo e o que sobra dela depois do consumo da geradora
        # sao a base do rateio. Na fatura da geradora este campo e a geracao
        # bruta; nas das beneficiarias ele ja vem liquido — mesmo nome, numero
        # diferente. Por isso so a leitura da geradora responde "quanto foi
        # gerado".
        cycle_generation_kwh=_parse_optional_non_negative_number(
            scee.get("geracao_ciclo_kwh"), "scee.geracao_ciclo_kwh"
        ),
        credit_received_kwh=_parse_optional_non_negative_number(
            scee.get("credito_recebido_kwh"), "scee.credito_recebido_kwh"
        ),
        excess_received_kwh=_parse_optional_non_negative_number(
            scee.get("excedente_recebido_kwh"), "scee.excedente_recebido_kwh"
        ),
        balance_kwh=_parse_optional_non_negative_number(
            scee.get("saldo_final_kwh"), "scee.saldo_final_kwh"
        ),
        balance_expiring_30_days_kwh=_parse_optional_non_negative_number(
            scee.get("saldo_expirar_30_dias_kwh"),
            "scee.saldo_expirar_30_dias_kwh",
        ),
        balance_expiring_60_days_kwh=_parse_optional_non_negative_number(
            scee.get("saldo_expirar_60_dias_kwh"),
            "scee.saldo_expirar_60_dias_kwh",
        ),
        distribution_percent=_parse_distribution_percent(scee),
    )


def get_official_scee_record(
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
    billing_reference: Any,
) -> OfficialSceeRecord:
    """Return literal SCEE data from one exactly selected official bill."""
    try:
        unit = get_unit_definition(model, unit_id)
    except EnergyModelError as error:
        raise SceeUnknownUnitError(f"unknown unit: {unit_id!r}") from error

    billing_key = unit.get("billing_key")
    if not isinstance(billing_key, str) or not billing_key.strip():
        raise SceeUnavailableError("unit billing_key is unavailable")

    try:
        parse_billing_reference(billing_reference)
    except BillingError as error:
        raise SceeInvalidReferenceError("billing_reference is invalid") from error

    try:
        bill = get_bill_by_reference(
            billing_document,
            billing_key,
            billing_reference,
        )
    except BillingError as error:
        raise SceeError("could not select the official bill") from error
    if bill is None:
        raise SceeNotFoundError("official bill was not found")
    record = parse_official_scee_record(bill)
    return replace(record, unit_id=unit_id)
