"""Today's energy balance of one unit: what it received minus what it consumed.

Responde a uma pergunta operacional do dia corrente, e só dela: **a unidade
está ganhando ou perdendo saldo hoje?** Um número positivo significa que o
crédito rateado do dia cobriu o consumo do dia; um negativo, que não cobriu.

Classificação: ``estimated``, sempre. Não é medição nem valor faturado, e a
razão é regulatória, não técnica — a compensação do SCEE é apurada **por ciclo
de faturamento**, não por dia. Nenhuma fatura vai imprimir estes números. O que
este módulo faz é aplicar, na janela de um dia, exatamente a mesma regra que
``energy_flow`` aplica na janela de um ciclo:

    excedente = max(exportação − importação, 0)
    recebido  = excedente × percentual de rateio da unidade

A regra é uma só, e por isso mora num lugar só: se o rateio mudar, os dois
resultados mudam juntos. Reimplementá-la na tela produziria uma segunda versão
capaz de discordar desta sem que ninguém percebesse.

Limite deliberado: o excedente do dia não considera saldo acumulado de ciclos
anteriores. Esta é a foto do dia, não a posição de crédito da unidade — o saldo
acumulado é publicado pela fatura e vive em ``scee``.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Mapping


class DailyEnergyBalanceError(ValueError):
    """Raised when a daily energy balance cannot be derived safely."""


_HUNDRED = Decimal("100")


@dataclass(frozen=True)
class DailyEnergyBalance:
    """One unit's energy position for the day in progress."""

    unit_id: str
    day_start: datetime
    day_end: datetime
    classification: str
    consumed_kwh: float | None
    received_kwh: float | None
    balance_kwh: float | None
    share_percent: Decimal | None
    # Os tres a seguir sao do GERADOR, nao da unidade deste resultado. Vao
    # juntos porque explicam de onde saiu o credito: o excedente do dia e o que
    # o produziu. Aparecem em toda unidade, como `distributable_kwh` ja fazia.
    distributable_kwh: float | None
    generator_generation_kwh: float | None
    generator_export_kwh: float | None
    warnings: tuple[str, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.unit_id, str) or not self.unit_id.strip():
            raise DailyEnergyBalanceError("unit_id must be a non-empty string")
        if self.classification != "estimated":
            raise DailyEnergyBalanceError("classification must be 'estimated'")
        for name in ("day_start", "day_end"):
            value = getattr(self, name)
            if not isinstance(value, datetime) or value.tzinfo is None:
                raise DailyEnergyBalanceError(f"{name} must be an aware datetime")
        if self.day_end <= self.day_start:
            raise DailyEnergyBalanceError("day_end must be after day_start")
        for name in (
            "consumed_kwh",
            "received_kwh",
            "distributable_kwh",
            "generator_generation_kwh",
            "generator_export_kwh",
        ):
            value = getattr(self, name)
            if value is None:
                continue
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise DailyEnergyBalanceError(f"{name} must be numeric or None")
            if value < 0:
                raise DailyEnergyBalanceError(f"{name} must not be negative")
        # O saldo e o unico campo que pode ser negativo: e exatamente o que ele
        # significa quando o consumo do dia superou o credito do dia.
        if self.balance_kwh is not None and (
            isinstance(self.balance_kwh, bool)
            or not isinstance(self.balance_kwh, (int, float))
        ):
            raise DailyEnergyBalanceError("balance_kwh must be numeric or None")
        if self.share_percent is not None and (
            not isinstance(self.share_percent, Decimal)
            or not self.share_percent.is_finite()
            or self.share_percent < 0
        ):
            raise DailyEnergyBalanceError(
                "share_percent must be a non-negative finite Decimal or None"
            )
        if not isinstance(self.warnings, tuple) or any(
            not isinstance(item, str) for item in self.warnings
        ):
            raise DailyEnergyBalanceError("warnings must be a tuple of strings")


def _energy(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if not isinstance(value, (int, float)):
        return None
    numeric = float(value)
    if numeric != numeric or numeric in (float("inf"), float("-inf")):
        return None
    return numeric if numeric >= 0 else None


def calculate_daily_distributable(
    exported_kwh: Any, imported_kwh: Any
) -> float | None:
    """Return the generator surplus of the day, or None.

    Mesma definicao de ``energy_flow``: o que sobrou da exportacao depois de
    cobrir a importacao do proprio gerador. Nunca negativa — nao se rateia
    divida.
    """
    exported = _energy(exported_kwh)
    imported = _energy(imported_kwh)
    if exported is None or imported is None:
        return None
    return float(max(exported - imported, 0.0))


def build_daily_energy_balance(
    *,
    unit_id: str,
    day_start: datetime,
    day_end: datetime,
    consumed_kwh: Any,
    distributable_kwh: Any,
    share_percent: Any,
    generator_generation_kwh: Any = None,
    generator_export_kwh: Any = None,
) -> DailyEnergyBalance:
    """Derive one unit's balance for the day from already-totalled inputs.

    Entrada faltante nao derruba o resultado: o campo sai ``None``, um aviso
    nomeia a ausencia, e o que restar calculavel continua sendo calculado.
    """
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise DailyEnergyBalanceError("unit_id must be a non-empty string")

    warnings: list[str] = []

    consumed = _energy(consumed_kwh)
    if consumed is None:
        warnings.append("consumption_unavailable")

    distributable = _energy(distributable_kwh)
    if distributable is None:
        warnings.append("distributable_unavailable")

    share: Decimal | None = None
    if isinstance(share_percent, Decimal) and share_percent.is_finite():
        if share_percent < 0:
            raise DailyEnergyBalanceError("share_percent must not be negative")
        share = share_percent
    else:
        warnings.append("share_unavailable")

    received = None
    if distributable is not None and share is not None:
        received = float(
            (Decimal(str(distributable)) * share / _HUNDRED)
        )

    balance = None
    if received is not None and consumed is not None:
        balance = float(received - consumed)

    # A apuracao real e por ciclo: este numero e a leitura do dia, e dizer isso
    # no proprio contrato evita que ele seja lido como posicao de credito.
    warnings.append("settlement_is_per_cycle")

    return DailyEnergyBalance(
        unit_id=unit_id,
        day_start=day_start,
        day_end=day_end,
        classification="estimated",
        consumed_kwh=consumed,
        received_kwh=received,
        balance_kwh=balance,
        share_percent=share,
        distributable_kwh=distributable,
        generator_generation_kwh=_energy(generator_generation_kwh),
        generator_export_kwh=_energy(generator_export_kwh),
        warnings=tuple(dict.fromkeys(warnings)),
    )
