"""Projected monetary cost of one billing cycle, derived from official inputs.

Esta é uma projeção, e o contrato deixa isso explícito em todo lugar: a
classificação é sempre ``projected`` e nenhum campo aqui pode ser confundido
com valor faturado. O valor oficial de um ciclo fechado continua vindo de
``finance``, que lê a fatura.

A conta reproduz a estrutura da fatura do grupo B, nesta ordem:

1. **Energia faturável.** É o consumo previsto menos o que for compensado por
   crédito, com piso no custo de disponibilidade — o mínimo que a distribuidora
   cobra mesmo de quem compensou tudo. O piso não é escolha do sistema: é
   parâmetro regulatório, declarado em ``financial-model.yaml`` e casado com o
   ``tipo_ligacao`` que a própria fatura publica.

2. **Energia.** Faturável × tarifa com impostos.

3. **CIP/COSIP.** A iluminação pública da última fatura fechada, repetida como
   estimativa. Ela não varia com o consumo, então repetir é mais fiel do que
   projetar.

O que esta projeção deliberadamente NÃO faz:

- **Não projeta crédito em ciclo aberto.** Quanto uma beneficiária vai receber
  depende da geração que ainda não terminou. Assumir um número produziria uma
  conta menor que a real justamente no mês em que o sol falhou. Sem crédito
  projetado, a estimativa é um teto: erra para cima, nunca para baixo.
- **Não estima bandeira tarifária.** A cor do mês não é conhecida no meio do
  ciclo, e a proporção de dias sob cada cor é específica de cada unidade.
- **Não estima juros, multa nem créditos financeiros.** São eventos, não
  regularidades.

Cada ausência dessas vira um aviso no resultado, para que a diferença contra a
fatura real tenha explicação e não vire desconfiança do número.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Mapping

from .financial_model import PaybackConfiguration


class CycleCostEstimateError(ValueError):
    """Raised when a cycle cost estimate cannot be derived safely."""


_ZERO = Decimal("0")
_CENT = Decimal("0.01")
_KWH = Decimal("0.001")


@dataclass(frozen=True)
class CycleCostEstimate:
    """One projected cycle cost, with every input it was built from."""

    unit_id: str
    billing_reference: str | None
    currency: str
    classification: str
    connection_type: str | None
    forecast_consumption_kwh: Decimal | None
    compensated_kwh: Decimal
    minimum_billable_kwh: Decimal | None
    billable_kwh: Decimal | None
    availability_floor_applied: bool
    tariff_with_taxes: Decimal | None
    tariff_source: str | None
    energy_amount: Decimal | None
    cip_cosip_amount: Decimal | None
    total_amount: Decimal | None
    warnings: tuple[str, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.unit_id, str) or not self.unit_id.strip():
            raise CycleCostEstimateError("unit_id must be a non-empty string")
        if self.classification != "projected":
            raise CycleCostEstimateError("classification must be 'projected'")
        if not isinstance(self.currency, str) or not self.currency.strip():
            raise CycleCostEstimateError("currency must be a non-empty string")
        if not isinstance(self.availability_floor_applied, bool):
            raise CycleCostEstimateError("availability_floor_applied must be boolean")
        for name in (
            "forecast_consumption_kwh",
            "minimum_billable_kwh",
            "billable_kwh",
            "tariff_with_taxes",
            "energy_amount",
            "cip_cosip_amount",
            "total_amount",
        ):
            value = getattr(self, name)
            if value is None:
                continue
            if not isinstance(value, Decimal) or not value.is_finite() or value < 0:
                raise CycleCostEstimateError(
                    f"{name} must be a non-negative finite Decimal or None"
                )
        if (
            not isinstance(self.compensated_kwh, Decimal)
            or not self.compensated_kwh.is_finite()
            or self.compensated_kwh < 0
        ):
            raise CycleCostEstimateError(
                "compensated_kwh must be a non-negative finite Decimal"
            )
        if not isinstance(self.warnings, tuple) or any(
            not isinstance(item, str) for item in self.warnings
        ):
            raise CycleCostEstimateError("warnings must be a tuple of strings")


def _decimal(value: Any) -> Decimal | None:
    """Accept only values that already carry an exact decimal meaning."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, Decimal):
        return value if value.is_finite() else None
    if isinstance(value, int):
        return Decimal(value)
    if isinstance(value, str) and value.strip():
        try:
            parsed = Decimal(value.strip())
        except ArithmeticError:
            return None
        return parsed if parsed.is_finite() else None
    # float fica de fora de proposito: dinheiro e tarifa nao passam por binario.
    return None


def build_cycle_cost_estimate(
    *,
    unit_id: str,
    billing_reference: str | None,
    configuration: PaybackConfiguration,
    connection_type: str | None,
    forecast_consumption_kwh: Any,
    compensated_kwh: Any = None,
    tariff_with_taxes: Any = None,
    tariff_source: str | None = None,
    cip_cosip_amount: Any = None,
    cycle_is_closed: bool = False,
) -> CycleCostEstimate:
    """Derive one projected cycle cost from already-validated inputs.

    Toda entrada faltante degrada o resultado em vez de derruba-lo: o campo sai
    ``None``, um aviso nomeia a ausencia e o que ainda for calculavel continua
    sendo calculado. Um painel que some inteiro porque a iluminacao publica nao
    foi lida seria pior do que um total marcado como incompleto.
    """
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise CycleCostEstimateError("unit_id must be a non-empty string")
    if not isinstance(configuration, PaybackConfiguration):
        raise CycleCostEstimateError("configuration must be a PaybackConfiguration")
    if not isinstance(cycle_is_closed, bool):
        raise CycleCostEstimateError("cycle_is_closed must be boolean")

    warnings: list[str] = []

    forecast = _decimal(forecast_consumption_kwh)
    if forecast is None or forecast < 0:
        forecast = None
        warnings.append("forecast_unavailable")

    # Ciclo aberto nao projeta credito: a geracao que o produziria ainda nao
    # terminou. O ciclo fechado ja tem a compensacao publicada na fatura.
    compensated = _decimal(compensated_kwh) if cycle_is_closed else None
    if compensated is None or compensated < 0:
        compensated = _ZERO
        if not cycle_is_closed:
            warnings.append("compensation_not_projected")
        else:
            warnings.append("compensation_unavailable")

    minimum = (
        configuration.minimum_billable_kwh(connection_type)
        if isinstance(connection_type, str)
        else None
    )
    if minimum is None:
        warnings.append("availability_floor_unavailable")

    billable: Decimal | None = None
    floor_applied = False
    if forecast is not None:
        net = forecast - compensated
        if net < _ZERO:
            net = _ZERO
        billable = net
        if minimum is not None and billable < minimum:
            billable = minimum
            floor_applied = True
        billable = billable.quantize(_KWH, rounding=ROUND_HALF_UP)

    tariff = _decimal(tariff_with_taxes)
    if tariff is None or tariff <= 0:
        tariff = None
        warnings.append("tariff_unavailable")

    energy_amount = None
    if billable is not None and tariff is not None:
        energy_amount = (billable * tariff).quantize(_CENT, rounding=ROUND_HALF_UP)

    cip = _decimal(cip_cosip_amount)
    if cip is None or cip < 0:
        cip = None
        warnings.append("cip_cosip_unavailable")
    else:
        cip = cip.quantize(_CENT, rounding=ROUND_HALF_UP)

    # O total so existe quando a energia existe. Somar apenas a iluminacao
    # publica e chama-la de "custo estimado do ciclo" seria um numero certo
    # respondendo a pergunta errada.
    total = None
    if energy_amount is not None:
        total = energy_amount + (cip if cip is not None else _ZERO)
        total = total.quantize(_CENT, rounding=ROUND_HALF_UP)

    # Avisos do que a projecao nao cobre, sempre presentes: e o que explica a
    # diferenca contra a fatura real antes que ela vire desconfianca.
    warnings.append("excludes_tariff_flag")
    warnings.append("excludes_interest_and_fine")

    return CycleCostEstimate(
        unit_id=unit_id,
        billing_reference=billing_reference,
        currency=configuration.currency,
        classification="projected",
        connection_type=connection_type,
        forecast_consumption_kwh=forecast,
        compensated_kwh=compensated,
        minimum_billable_kwh=minimum,
        billable_kwh=billable,
        availability_floor_applied=floor_applied,
        tariff_with_taxes=tariff,
        tariff_source=tariff_source if tariff is not None else None,
        energy_amount=energy_amount,
        cip_cosip_amount=cip,
        total_amount=total,
        warnings=tuple(dict.fromkeys(warnings)),
    )
