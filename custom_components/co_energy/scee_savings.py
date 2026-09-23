"""Confirmed monetary SCEE savings derived from one official closed invoice."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from .billing import BillingError, parse_billing_reference
from .billing_codes import (
    COMPENSATED_ENERGY_CHARGE,
    GROSS_TARIFF_BENEFIT,
    NET_TARIFF_BENEFIT,
    SCEE_CONSUMPTION,
    SCEE_INJECTION,
)
from .finance import OfficialFinancialItem, OfficialFinancialSnapshot


@dataclass(frozen=True)
class SceeSavingsResult:
    """Internal result for one unit and one exact billing reference."""

    unit_id: str | None
    billing_reference: str | None
    period_start: date | None
    period_end: date | None
    currency: str | None
    status: str
    amount: Decimal | None
    gross_credit: Decimal | None
    transition_charge: Decimal | None
    source: str | None
    blockers: tuple[str, ...]
    warnings: tuple[str, ...]


_SOURCE = "official_invoice_scee_items"
_CENT = Decimal("0.01")
# Mesmo vocabulário que o payback usa, declarado uma vez em billing_codes.
_CONSUMPTION_CODE = SCEE_CONSUMPTION
_INJECTION_CODE = SCEE_INJECTION
_TRANSITION_CODE = COMPENSATED_ENERGY_CHARGE
_GROSS_BENEFIT_CODE = GROSS_TARIFF_BENEFIT
_NET_BENEFIT_CODE = NET_TARIFF_BENEFIT


def _unavailable(
    snapshot: OfficialFinancialSnapshot | None,
    blocker: str,
    *,
    warnings: tuple[str, ...] = (),
) -> SceeSavingsResult:
    return SceeSavingsResult(
        unit_id=snapshot.unit_id if snapshot is not None else None,
        billing_reference=(snapshot.billing_reference if snapshot is not None else None),
        period_start=snapshot.period_start if snapshot is not None else None,
        period_end=snapshot.period_end if snapshot is not None else None,
        currency=snapshot.currency if snapshot is not None else None,
        status="unavailable",
        amount=None,
        gross_credit=None,
        transition_charge=None,
        source=None,
        blockers=(blocker,),
        warnings=warnings,
    )


def _is_finite_decimal(value: object) -> bool:
    return isinstance(value, Decimal) and not isinstance(value, bool) and value.is_finite()


def _unique_item(
    items: tuple[OfficialFinancialItem, ...], code: str
) -> tuple[OfficialFinancialItem | None, bool]:
    matches = tuple(item for item in items if item.code == code)
    return (matches[0] if len(matches) == 1 else None, len(matches) > 1)


def _optional_decimal_valid(value: object) -> bool:
    return value is None or _is_finite_decimal(value)


def _pair_metadata_matches(
    consumption: OfficialFinancialItem,
    injection: OfficialFinancialItem,
) -> bool:
    if not _optional_decimal_valid(consumption.quantity) or not _optional_decimal_valid(injection.quantity):
        return False
    if consumption.quantity is not None and injection.quantity is not None:
        if consumption.quantity != injection.quantity:
            return False
    if consumption.unit is not None and injection.unit is not None:
        if consumption.unit != injection.unit:
            return False
    if not _optional_decimal_valid(consumption.tariff_with_taxes) or not _optional_decimal_valid(injection.tariff_with_taxes):
        return False
    if consumption.tariff_with_taxes is not None and injection.tariff_with_taxes is not None:
        if consumption.tariff_with_taxes != injection.tariff_with_taxes:
            return False
    return True


def _transition_matches(
    transition: OfficialFinancialItem,
    consumption: OfficialFinancialItem,
) -> bool:
    if not _optional_decimal_valid(transition.quantity):
        return False
    if transition.quantity is not None and consumption.quantity is not None:
        if transition.quantity != consumption.quantity:
            return False
    if transition.unit is not None and consumption.unit is not None:
        if transition.unit != consumption.unit:
            return False
    return True


def _benefit_warnings(items: tuple[OfficialFinancialItem, ...]) -> tuple[str, ...]:
    gross, gross_ambiguous = _unique_item(items, _GROSS_BENEFIT_CODE)
    net, net_ambiguous = _unique_item(items, _NET_BENEFIT_CODE)
    if gross_ambiguous or net_ambiguous:
        return ("benefit_pair_ambiguous",)
    if gross is None and net is None:
        return ("benefit_pair_missing",)
    if gross is None or net is None:
        return ("benefit_pair_incomplete",)
    if not _is_finite_decimal(gross.value) or not _is_finite_decimal(net.value):
        return ("benefit_pair_invalid",)
    if gross.value + net.value != Decimal("0"):
        return ("benefit_pair_inconsistent",)
    return ()


def get_confirmed_scee_savings(
    snapshot: OfficialFinancialSnapshot | None,
    *,
    extraction_status: str | None,
    scee_applicable: bool,
    financial_validation: bool | None = None,
) -> SceeSavingsResult:
    """Derive confirmed SCEE savings using only official monetary invoice items.

    The extraction gate is scoped to the dimension this calculation actually
    uses. An invoice flagged for review over dates or meter readings still
    qualifies when its monetary dimension checks out, because savings are
    derived from billed quantities and tariffs alone. A failed monetary
    validation disqualifies it regardless of the overall status.
    """
    if snapshot is None:
        return _unavailable(None, "invoice_not_found")
    if not isinstance(snapshot, OfficialFinancialSnapshot):
        return _unavailable(None, "invalid_financial_value")
    if not isinstance(snapshot.unit_id, str) or not snapshot.unit_id.strip():
        return _unavailable(snapshot, "invalid_financial_value")
    try:
        parse_billing_reference(snapshot.billing_reference)
    except BillingError:
        return _unavailable(snapshot, "invalid_financial_value")
    if (
        not isinstance(snapshot.period_start, date)
        or not isinstance(snapshot.period_end, date)
        or snapshot.period_start is None
        or snapshot.period_end is None
        or snapshot.period_start >= snapshot.period_end
    ):
        return _unavailable(snapshot, "invoice_not_closed")
    if snapshot.reconciliation.reconciled is not True:
        return _unavailable(snapshot, "invoice_not_reconciled")
    if financial_validation is False:
        return _unavailable(snapshot, "financial_validation_failed")
    if financial_validation is not True and extraction_status != "ok":
        return _unavailable(snapshot, "extraction_not_ok")
    if scee_applicable is not True:
        return _unavailable(snapshot, "scee_not_applicable")
    if not isinstance(snapshot.currency, str) or not snapshot.currency.strip():
        return _unavailable(snapshot, "currency_mismatch")

    consumption, consumption_ambiguous = _unique_item(snapshot.items, _CONSUMPTION_CODE)
    injection, injection_ambiguous = _unique_item(snapshot.items, _INJECTION_CODE)
    transition, transition_ambiguous = _unique_item(snapshot.items, _TRANSITION_CODE)
    warnings = _benefit_warnings(snapshot.items)
    if extraction_status != "ok":
        warnings = ("extraction_under_review_financially_valid", *warnings)
    if consumption_ambiguous or injection_ambiguous or transition_ambiguous:
        return _unavailable(snapshot, "ambiguous_scee_items", warnings=warnings)
    if consumption is None or injection is None:
        return _unavailable(snapshot, "scee_items_missing", warnings=warnings)
    if transition is None:
        return _unavailable(snapshot, "transition_charge_missing", warnings=warnings)

    required_values = (consumption.value, injection.value, transition.value)
    if not all(_is_finite_decimal(value) for value in required_values):
        return _unavailable(snapshot, "invalid_financial_value", warnings=warnings)
    if (
        consumption.nature != "cobranca"
        or consumption.value <= 0
        or injection.nature != "credito"
        or injection.value >= 0
        or transition.nature != "cobranca"
        or transition.value < 0
    ):
        return _unavailable(snapshot, "invalid_financial_value", warnings=warnings)
    if consumption.value + injection.value != Decimal("0"):
        return _unavailable(snapshot, "scee_pair_mismatch", warnings=warnings)
    if not _pair_metadata_matches(consumption, injection):
        return _unavailable(snapshot, "scee_pair_mismatch", warnings=warnings)
    if not _transition_matches(transition, consumption):
        return _unavailable(snapshot, "scee_pair_mismatch", warnings=warnings)

    gross_credit = abs(injection.value).quantize(_CENT)
    transition_charge = transition.value.quantize(_CENT)
    amount = (gross_credit - transition_charge).quantize(_CENT)
    if amount < 0:
        return _unavailable(snapshot, "negative_savings", warnings=warnings)
    return SceeSavingsResult(
        unit_id=snapshot.unit_id,
        billing_reference=snapshot.billing_reference,
        period_start=snapshot.period_start,
        period_end=snapshot.period_end,
        currency=snapshot.currency,
        status="confirmed",
        amount=amount,
        gross_credit=gross_credit,
        transition_charge=transition_charge,
        source=_SOURCE,
        blockers=(),
        warnings=warnings,
    )
