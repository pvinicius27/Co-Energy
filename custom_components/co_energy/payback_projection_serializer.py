"""Explicit public serializer for projected payback results."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from .payback_projection import (
    InvestmentSettlement,
    PaybackProjectionResult,
    PaybackScenario,
    FullTariffBasis,
    ProjectedCycleBenefit,
    SavingsDerivation,
    UnitCreditBalance,
    UnitCycleSavings,
)


class PaybackProjectionSerializationError(ValueError):
    """Raised when a projected payback result cannot be safely serialized."""


def _decimal(value: Decimal | None) -> str | None:
    if value is None:
        return None
    if not isinstance(value, Decimal) or not value.is_finite():
        raise PaybackProjectionSerializationError("invalid decimal value")
    return str(value)


def _derivation(value: SavingsDerivation | None) -> dict[str, Any] | None:
    """Serialize the operands that reproduce one unit's savings."""
    if value is None:
        return None
    if not isinstance(value, SavingsDerivation):
        raise PaybackProjectionSerializationError("invalid savings derivation")
    return {
        "compensated_kwh": _decimal(value.compensated_kwh),
        "full_tariff": _decimal(value.full_tariff),
        "full_tariff_sources": list(value.full_tariff_sources),
        "full_tariff_origin": value.full_tariff_origin,
        "flag_tariff": _decimal(value.flag_tariff),
        "unit_price": _decimal(value.unit_price),
        "gross_value": _decimal(value.gross_value),
        "transition_paid": _decimal(value.transition_paid),
        "bill_without_credit": _decimal(value.bill_without_credit),
        "non_compensated_kwh": _decimal(value.non_compensated_kwh),
        "non_compensated_value": _decimal(value.non_compensated_value),
        "flag_charged": _decimal(value.flag_charged),
        "other_items": _decimal(value.other_items),
        "other_items_detail": [
            {"code": code, "value": _decimal(amount)}
            for code, amount in value.other_items_detail
        ],
        "bill_without_credit_built": _decimal(value.bill_without_credit_built),
        "bill_without_credit_mismatch": _decimal(value.bill_without_credit_mismatch),
    }


def _tariff_basis(value: FullTariffBasis | None) -> dict[str, Any] | None:
    """Serialize how the month's tariff was obtained, for audit only."""
    if value is None:
        return None
    if not isinstance(value, FullTariffBasis):
        raise PaybackProjectionSerializationError("invalid full tariff basis")
    return {
        "value": _decimal(value.value),
        "without_taxes": _decimal(value.without_taxes),
        "pis_percent": _decimal(value.pis_percent),
        "cofins_percent": _decimal(value.cofins_percent),
        "icms_percent": _decimal(value.icms_percent),
        "item_code": value.item_code,
        "sources": list(value.sources),
        "pis_cofins_divisor": _decimal(value.pis_cofins_divisor),
        "icms_divisor": _decimal(value.icms_divisor),
        "after_pis_cofins": _decimal(value.after_pis_cofins),
    }


def _unit(value: UnitCycleSavings) -> dict[str, Any]:
    if not isinstance(value, UnitCycleSavings):
        raise PaybackProjectionSerializationError("invalid unit savings")
    if value.status not in ("confirmed", "no_credit", "unconfirmed"):
        raise PaybackProjectionSerializationError("invalid unit savings status")
    if value.status != "confirmed" and value.derivation is not None:
        raise PaybackProjectionSerializationError("derivation requires confirmed savings")
    return {
        "unit_id": value.unit_id,
        "scee_savings": _decimal(value.scee_savings),
        "paid_total": _decimal(value.paid_total),
        "status": value.status,
        "derivation": _derivation(value.derivation),
        "public_lighting": _decimal(value.public_lighting),
        "interest": _decimal(value.interest),
        "fine": _decimal(value.fine),
    }


def _balance(value: UnitCreditBalance) -> dict[str, Any]:
    if not isinstance(value, UnitCreditBalance):
        raise PaybackProjectionSerializationError("invalid credit balance")
    return {
        "unit_id": value.unit_id,
        "billing_reference": value.billing_reference,
        "balance_kwh": _decimal(value.balance_kwh),
    }


def _missing_units(value: tuple[str, ...]) -> list[str]:
    if not isinstance(value, tuple) or not all(
        isinstance(item, str) and item for item in value
    ):
        raise PaybackProjectionSerializationError("invalid missing units")
    return list(value)


def _settlement(value: InvestmentSettlement | None) -> dict[str, Any] | None:
    """O marco do investimento pago e o saldo que veio depois dele."""
    if value is None:
        return None
    if not isinstance(value, InvestmentSettlement):
        raise PaybackProjectionSerializationError("invalid settlement")
    if value.status not in ("settled", "pending"):
        raise PaybackProjectionSerializationError("invalid settlement status")
    return {
        "status": value.status,
        "settled_reference": value.settled_reference,
        "recovered_total": _decimal(value.recovered_total),
        "remaining": _decimal(value.remaining),
        "surplus_total": _decimal(value.surplus_total),
        "surplus_cycle_count": value.surplus_cycle_count,
        "cycles": [
            {
                "billing_reference": item.billing_reference,
                "benefit": _decimal(item.benefit),
                "accumulated": _decimal(item.accumulated),
                "surplus": _decimal(item.surplus),
            }
            for item in value.cycles
        ],
    }


def _official_cycle(value: ProjectedCycleBenefit) -> dict[str, Any]:
    """Serialize the scenario-independent official parcel of one reference."""
    if not isinstance(value, ProjectedCycleBenefit):
        raise PaybackProjectionSerializationError("invalid projected cycle")
    return {
        "billing_reference": value.billing_reference,
        "official_scee_savings": _decimal(value.official_scee_savings),
        "paid_total": _decimal(value.paid_total),
        "full_tariff_basis": _tariff_basis(value.full_tariff_basis),
        "units": [_unit(item) for item in value.units],
        "missing_units": _missing_units(value.missing_units),
    }


def _scenario_cycle(value: ProjectedCycleBenefit) -> dict[str, Any]:
    if value.self_consumption_coverage not in (None, "confirmed", "partial"):
        raise PaybackProjectionSerializationError("invalid self-consumption coverage")
    return {
        "billing_reference": value.billing_reference,
        "self_consumption_savings": _decimal(value.scenario_self_consumption_savings),
        "projected_cycle_benefit": _decimal(value.projected_cycle_benefit),
        "self_consumption_financial_status": value.self_consumption_financial_status,
        "self_consumption_coverage": value.self_consumption_coverage,
        "self_consumption_unit_id": value.self_consumption_unit_id,
        # Operandos da parcela hipotética: sem eles o valor do autoconsumo é um
        # número sem origem verificável na tela de auditoria.
        "self_consumption_kwh": _decimal(value.self_consumption_kwh),
        "non_compensated_tariff": _decimal(value.non_compensated_tariff),
        "flag_tariff": _decimal(value.flag_tariff),
        "compensated_tariff": _decimal(value.compensated_tariff),
        "self_consumption_unit_price": _decimal(value.self_consumption_unit_price),
    }


def _scenario(value: PaybackScenario) -> dict[str, Any]:
    if value.name not in ("conservative", "base", "optimistic"):
        raise PaybackProjectionSerializationError("unsupported scenario")
    if value.status not in ("scenario_only", "unavailable"):
        raise PaybackProjectionSerializationError("invalid scenario status")
    return {
        "status": value.status,
        "compensation_fraction": _decimal(value.compensation_fraction),
        "average_monthly_savings": _decimal(value.average_monthly_savings),
        "annualized_savings": _decimal(value.annualized_savings),
        "payback_months": _decimal(value.payback_months),
        "payback_years": _decimal(value.payback_years),
        "cycles": [_scenario_cycle(item) for item in value.cycles],
        "blockers": list(value.blockers),
    }


def serialize_payback_projection(result: PaybackProjectionResult) -> dict[str, Any]:
    """Serialize only the approved projected-payback public allowlist."""
    if not isinstance(result, PaybackProjectionResult):
        raise PaybackProjectionSerializationError("invalid payback projection")
    if len(result.investment.investments) != 1:
        raise PaybackProjectionSerializationError("unsupported investment composition")
    investment = result.investment.investments[0]
    scenarios = {scenario.name: _scenario(scenario) for scenario in result.scenarios}
    if set(scenarios) != {"conservative", "base", "optimistic"}:
        raise PaybackProjectionSerializationError("incomplete scenario set")
    return {
        "investment": {
            "amount": _decimal(result.investment.investment_total),
            "currency": result.investment.currency,
            "payment_period": investment.payment_period,
            "date_precision": investment.date_precision,
            "evidence": investment.evidence.type,
        },
        "method": {
            "type": result.method.type,
            "projection_method": result.method.projection_method,
            "eligible_cycle_count": result.method.eligible_cycle_count,
            "eligible_references": list(result.method.eligible_references),
            "sample_start": result.method.sample_start,
            "sample_end": result.method.sample_end,
        },
        "realized": {
            "status": result.realized.status,
            "blockers": list(result.realized.blockers),
        },
        "scenarios": scenarios,
        "settlement": _settlement(result.settlement),
        "cycles": [
            _official_cycle(item)
            for item in (result.scenarios[0].cycles if result.scenarios else ())
        ],
        "balances": [_balance(item) for item in result.balances],
        "warnings": list(result.warnings),
    }
