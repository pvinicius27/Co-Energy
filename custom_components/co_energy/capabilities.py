"""O que esta instalação é capaz de mostrar, pelo que ela declara.

O sistema foi construído tendo dados: sempre houve geração, rateio, faturas e
cinco unidades. Cada tela aprendeu a lidar com a presença, e nenhuma aprendeu
a lidar com a ausência — por isso uma instalação nova mostrava oito abas
vazias, um selo verde e três erros de carregamento.

Aqui mora a resposta de **o que existe**. Qual tela aparece por causa disso é
decisão da interface; este módulo não conhece tela nenhuma.

A distinção que organiza tudo:

* **não existe** — a instalação não tem a capacidade, e a tela some. Rateio
  numa casa só não está indisponível: ele não faz sentido.
* **falta informar** — a capacidade existe e o dado não chegou. A tela fica,
  dizendo o que falta. Auditoria sem fatura é isso.

Sumir o que não existe e manter pendente o que falta é o que separa "este
sistema não serve para mim" de "ainda tenho o que fazer".
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .energy_model import (
    EnergyModelError,
    get_generator_unit_ids,
    get_unit_definition,
    get_unit_ids,
)


def _units(model: Mapping[str, Any]) -> tuple[str, ...]:
    try:
        return get_unit_ids(model)
    except EnergyModelError:
        return ()


def _generators(model: Mapping[str, Any]) -> tuple[str, ...]:
    try:
        return get_generator_unit_ids(model)
    except EnergyModelError:
        return ()


def _declares(model: Mapping[str, Any], unit_id: str, campo: str) -> bool:
    """A unidade declara esta seção, e não vazia."""
    try:
        definicao = get_unit_definition(model, unit_id)
    except EnergyModelError:
        return False
    secao = definicao.get(campo)
    return isinstance(secao, Mapping) and bool(secao)


def installation_capabilities(
    model: Mapping[str, Any],
    *,
    has_billing: bool = False,
    has_investment: bool = False,
) -> dict[str, bool]:
    """O retrato do que esta instalação declara.

    ``has_billing`` e ``has_investment`` vêm de fora porque não moram no
    modelo: a fatura vem do storage de faturas, e o investimento dos ajustes
    operacionais. Quem chama já tem os dois em mãos.
    """
    unidades = _units(model)
    geradoras = _generators(model)

    return {
        # Nada configurado ainda. É o estado de quem acabou de instalar, e o
        # único em que a tela deve falar em vez de mostrar.
        "units": bool(unidades),

        # Alguma unidade gera energia. Sem isso não existem exportação,
        # importação, autoconsumo, fluxo energético nem payback — não estão
        # indisponíveis, não existem.
        "generation": bool(geradoras),

        # Rateio precisa de mais de uma unidade para ter o que decidir. Com
        # uma só, distribuir crédito é devolvê-lo a quem o gerou — não há
        # pergunta a fazer, e perguntar confunde.
        "distribution": len(unidades) > 1 and bool(geradoras),

        # Alguma unidade mede energia acumulada. Sem isso não há gráfico de
        # ciclo, comparação nem auditoria contra medidor.
        "measurement": any(_declares(model, u, "series") for u in unidades),

        # Tensão, corrente, potência. Não acumulam e não entram em ciclo:
        # uma instalação pode ter só isto, e continua servindo.
        "instant_readings": any(
            _declares(model, u, "measurements") for u in unidades
        ),

        # Existe fatura lida. Auditoria e valores oficiais dependem disto —
        # e a ausência aqui é PENDÊNCIA, não impossibilidade: a fatura vai
        # chegar.
        "billing": bool(has_billing),

        # O custo do sistema solar foi informado. Sem ele o payback existe e
        # não tem o que calcular — outra pendência, não ausência.
        "investment": bool(has_investment),
    }
