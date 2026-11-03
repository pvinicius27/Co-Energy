"""Literal official financial domain for closed Equatorial bills."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any

from .billing import BillingError, BillingRecord, get_bill_by_reference
from .equatorial_adapter import EquatorialDocument


class FinanceError(ValueError):
    """Raised when literal official financial data is structurally invalid."""


@dataclass(frozen=True)
class OfficialFinancialItem:
    """One signed, literal item from an official closed bill."""

    code: str
    description: str
    category: str
    nature: str
    value: Decimal
    quantity: Decimal | None
    unit: str | None
    tariff_with_taxes: Decimal | None
    tariff_without_taxes: Decimal | None


@dataclass(frozen=True)
class OfficialFinancialReconciliation:
    """Integrity comparison that never replaces the official bill total."""

    reconciled: bool | None
    items_total: Decimal
    difference: Decimal | None


@dataclass(frozen=True)
class OfficialTaxRates:
    """Tax rates as printed on the bill, in percent.

    Existem para conferência: nenhum cálculo do domínio parte delas. As tarifas
    já chegam com tributos embutidos na fatura, e é essa tarifa que o domínio
    usa. Estas alíquotas apenas permitem reconstruir aquele número e comprovar
    que ele é o que a distribuidora aplicou.
    """

    pis_percent: Decimal | None
    cofins_percent: Decimal | None
    icms_percent: Decimal | None


_NO_TAX_RATES = OfficialTaxRates(None, None, None)


@dataclass(frozen=True)
class OfficialFinancialSnapshot:
    """Literal monetary composition of one official closed bill."""

    unit_id: str
    billing_reference: str
    period_start: date | None
    period_end: date | None
    currency: str
    official_bill_total: Decimal | None
    taxes_total: Decimal | None
    cip_cosip: Decimal | None
    interest: Decimal | None
    fine: Decimal | None
    financial_credits: Decimal | None
    items: tuple[OfficialFinancialItem, ...]
    reconciliation: OfficialFinancialReconciliation
    tax_rates: OfficialTaxRates = _NO_TAX_RATES


_CENT = Decimal("0.01")
_VALID_NATURES = frozenset(("cobranca", "credito"))


def _require_mapping(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise FinanceError(f"{field} must be a mapping")
    return value


def _require_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise FinanceError(f"{field} must be a non-empty string")
    return value


def _optional_string(value: Any, field: str) -> str | None:
    if value is None:
        return None
    return _require_string(value, field)


def _optional_decimal(value: Any, field: str) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
        raise FinanceError(f"{field} must be numeric or None")
    try:
        result = Decimal(str(value))
    except InvalidOperation as error:
        raise FinanceError(f"{field} must be a finite decimal or None") from error
    if not result.is_finite():
        raise FinanceError(f"{field} must be a finite decimal or None")
    return result


def _required_decimal(value: Any, field: str) -> Decimal:
    result = _optional_decimal(value, field)
    if result is None:
        raise FinanceError(f"{field} must be numeric")
    return result


def _parse_item(value: Any, index: int) -> OfficialFinancialItem:
    field = f"itens_faturados[{index}]"
    item = _require_mapping(value, field)
    nature = _require_string(item.get("natureza"), f"{field}.natureza")
    if nature not in _VALID_NATURES:
        raise FinanceError(f"{field}.natureza must be cobranca or credito")
    signed_value = _required_decimal(item.get("valor"), f"{field}.valor")
    if nature == "cobranca" and signed_value < 0:
        raise FinanceError(f"{field}.cobranca must not have a negative value")
    if nature == "credito" and signed_value > 0:
        raise FinanceError(f"{field}.credito must not have a positive value")
    return OfficialFinancialItem(
        code=_require_string(item.get("codigo"), f"{field}.codigo"),
        description=_require_string(
            item.get("descricao_original"), f"{field}.descricao_original"
        ),
        category=_require_string(item.get("categoria"), f"{field}.categoria"),
        nature=nature,
        value=signed_value,
        quantity=_optional_decimal(item.get("quantidade"), f"{field}.quantidade"),
        unit=_optional_string(item.get("unidade"), f"{field}.unidade"),
        tariff_with_taxes=_optional_decimal(
            item.get("tarifa_com_tributos"), f"{field}.tarifa_com_tributos"
        ),
        tariff_without_taxes=_optional_decimal(
            item.get("tarifa_sem_tributos"), f"{field}.tarifa_sem_tributos"
        ),
    )


def _parse_items(raw_bill: Mapping[str, Any]) -> tuple[OfficialFinancialItem, ...]:
    values = raw_bill.get("itens_faturados")
    if not isinstance(values, list):
        raise FinanceError("itens_faturados must be a list")
    return tuple(_parse_item(value, index) for index, value in enumerate(values))


def _literal_total(
    raw_bill: Mapping[str, Any], block: str, field: str
) -> Decimal | None:
    values = _require_mapping(raw_bill.get(block), block)
    return _optional_decimal(values.get(field), f"{block}.{field}")


def _tax_rates(raw_bill: Mapping[str, Any]) -> OfficialTaxRates:
    taxes = _require_mapping(raw_bill.get("tributos"), "tributos")

    def rate(name: str) -> Decimal | None:
        block = taxes.get(name)
        if not isinstance(block, Mapping):
            return None
        return _optional_decimal(
            block.get("aliquota_percentual"), f"tributos.{name}.aliquota_percentual"
        )

    return OfficialTaxRates(rate("pis"), rate("cofins"), rate("icms"))


def build_official_financial_snapshot(
    bill: BillingRecord,
) -> OfficialFinancialSnapshot:
    """Build a financial snapshot exclusively from one normalized official bill."""
    if not isinstance(bill, BillingRecord):
        raise FinanceError("bill must be a BillingRecord")
    raw_bill = _require_mapping(bill.raw_bill, "raw_bill")
    items = _parse_items(raw_bill)
    official_total = _optional_decimal(
        bill.total_amount, "faturamento.valor_total"
    )
    items_total = sum((item.value for item in items), Decimal("0"))
    difference = None if official_total is None else items_total - official_total
    reconciliation = OfficialFinancialReconciliation(
        reconciled=None if difference is None else abs(difference) <= _CENT,
        items_total=items_total,
        difference=difference,
    )
    return OfficialFinancialSnapshot(
        unit_id=bill.unit_id,
        billing_reference=bill.reference,
        period_start=bill.reading_previous,
        period_end=bill.reading_current,
        currency=bill.currency,
        official_bill_total=official_total,
        taxes_total=_literal_total(raw_bill, "tributos", "total"),
        cip_cosip=_literal_total(raw_bill, "totais", "cip_cosip"),
        interest=_literal_total(raw_bill, "totais", "juros"),
        fine=_literal_total(raw_bill, "totais", "multa"),
        financial_credits=_literal_total(
            raw_bill, "totais", "creditos_financeiros"
        ),
        items=items,
        reconciliation=reconciliation,
        tax_rates=_tax_rates(raw_bill),
    )


def get_official_financial_snapshot(
    document: EquatorialDocument, unit_id: str, billing_reference: Any
) -> OfficialFinancialSnapshot | None:
    """Return the official snapshot for one exact bill, or None when absent."""
    try:
        bill = get_bill_by_reference(document, unit_id, billing_reference)
    except BillingError as error:
        raise FinanceError(str(error)) from error
    return None if bill is None else build_official_financial_snapshot(bill)
