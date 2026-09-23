"""Explicit public serialization for literal official financial data."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from .finance import (
    OfficialFinancialItem,
    OfficialFinancialReconciliation,
    OfficialFinancialSnapshot,
)

API_VERSION = 1


class FinanceSerializationError(ValueError):
    """Raised when official financial data cannot be serialized safely."""


def _required_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise FinanceSerializationError(f"{field} must be a non-empty string")
    return value


def _optional_string(value: Any, field: str) -> str | None:
    if value is None:
        return None
    return _required_string(value, field)


def _optional_date(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, date) or isinstance(value, datetime):
        raise FinanceSerializationError(f"{field} must be a date or None")
    return value.isoformat()


def _decimal(value: Any, field: str) -> str:
    if isinstance(value, bool) or not isinstance(value, Decimal):
        raise FinanceSerializationError(f"{field} must be a Decimal")
    if not value.is_finite():
        raise FinanceSerializationError(f"{field} must be finite")
    text = format(value, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _optional_decimal(value: Any, field: str) -> str | None:
    if value is None:
        return None
    return _decimal(value, field)


def _optional_bool(value: Any, field: str) -> bool | None:
    if value is None:
        return None
    if not isinstance(value, bool):
        raise FinanceSerializationError(f"{field} must be a boolean or None")
    return value


def _serialize_item(item: Any, field: str) -> dict[str, Any]:
    if not isinstance(item, OfficialFinancialItem):
        raise FinanceSerializationError(f"{field} must be an OfficialFinancialItem")
    nature = _required_string(item.nature, f"{field}.nature")
    if nature not in ("cobranca", "credito"):
        raise FinanceSerializationError(
            f"{field}.nature must be cobranca or credito"
        )
    return {
        "code": _required_string(item.code, f"{field}.code"),
        "description": _required_string(item.description, f"{field}.description"),
        "category": _required_string(item.category, f"{field}.category"),
        "nature": nature,
        "value": _decimal(item.value, f"{field}.value"),
        "quantity": _optional_decimal(item.quantity, f"{field}.quantity"),
        "unit": _optional_string(item.unit, f"{field}.unit"),
        "tariff_with_taxes": _optional_decimal(
            item.tariff_with_taxes, f"{field}.tariff_with_taxes"
        ),
        "tariff_without_taxes": _optional_decimal(
            item.tariff_without_taxes, f"{field}.tariff_without_taxes"
        ),
    }


def _serialize_reconciliation(
    value: Any, field: str
) -> dict[str, Any]:
    if not isinstance(value, OfficialFinancialReconciliation):
        raise FinanceSerializationError(
            f"{field} must be an OfficialFinancialReconciliation"
        )
    return {
        "reconciled": _optional_bool(value.reconciled, f"{field}.reconciled"),
        "items_total": _decimal(value.items_total, f"{field}.items_total"),
        "difference": _optional_decimal(value.difference, f"{field}.difference"),
    }


def serialize_official_financial_snapshot(
    snapshot: OfficialFinancialSnapshot,
) -> dict[str, Any]:
    """Serialize one official financial snapshot through an explicit allowlist."""
    if not isinstance(snapshot, OfficialFinancialSnapshot):
        raise FinanceSerializationError(
            "snapshot must be an OfficialFinancialSnapshot"
        )
    if not isinstance(snapshot.items, tuple):
        raise FinanceSerializationError("snapshot.items must be a tuple")
    return {
        "api_version": API_VERSION,
        "data": {
            "unit_id": _required_string(snapshot.unit_id, "snapshot.unit_id"),
            "billing_reference": _required_string(
                snapshot.billing_reference, "snapshot.billing_reference"
            ),
            "period": {
                "start": _optional_date(snapshot.period_start, "snapshot.period_start"),
                "end": _optional_date(snapshot.period_end, "snapshot.period_end"),
            },
            "currency": _required_string(snapshot.currency, "snapshot.currency"),
            "official": {
                "bill_total": _optional_decimal(
                    snapshot.official_bill_total, "snapshot.official_bill_total"
                ),
                "taxes_total": _optional_decimal(
                    snapshot.taxes_total, "snapshot.taxes_total"
                ),
                "cip_cosip": _optional_decimal(
                    snapshot.cip_cosip, "snapshot.cip_cosip"
                ),
                "interest": _optional_decimal(
                    snapshot.interest, "snapshot.interest"
                ),
                "fine": _optional_decimal(snapshot.fine, "snapshot.fine"),
                "financial_credits": _optional_decimal(
                    snapshot.financial_credits, "snapshot.financial_credits"
                ),
            },
            "reconciliation": _serialize_reconciliation(
                snapshot.reconciliation, "snapshot.reconciliation"
            ),
            "items": [
                _serialize_item(item, f"snapshot.items[{index}]")
                for index, item in enumerate(snapshot.items)
            ],
        },
    }
