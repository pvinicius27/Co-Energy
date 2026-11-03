"""Catálogo dos sensores declarados, para a tela de configuração.

A tela precisa responder, por medição: **de qual entidade o modelo está
falando**, **qual entidade está valendo aqui**, **essa entidade existe nesta
instalação** e — quando a grandeza teve troca de medidor — **qual das fontes
vale hoje**.

Por isso o catálogo é agrupado por grandeza, não por entidade. Uma troca de
medidor deixa duas fontes na mesma série, cada uma cobrindo um trecho do
tempo, e elas só fazem sentido lado a lado: separadas viram duas linhas
"Geração" quase idênticas, e trocar a errada reescreve o passado sem que nada
apareça na tela.

A presença e o instante chegam prontos, de quem tem o ``hass`` em mãos. Aqui é
função pura.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

from .sensor_overrides import SensorOverrides, unused_entity_ids

#: A entidade existe e está reportando.
PRESENCE_PRESENT = "present"
#: A entidade existe no Home Assistant, mas está sem valor utilizável.
PRESENCE_UNAVAILABLE = "unavailable"
#: Não há entidade com esse nome. É o caso que a tela precisa gritar: o
#: modelo aponta para o vazio, e nenhum número vai sair daqui.
PRESENCE_MISSING = "missing"
#: Ninguém apurou. Não é o mesmo que ausente, e não pode virar alarme.
PRESENCE_UNKNOWN = "unknown"

KIND_SERIES = "series"
KIND_MEASUREMENT = "measurement"


def _parse_instant(value: Any) -> datetime | None:
    """Parse one declared boundary, or return None when it is unusable.

    Uma data ilegivel nao pode derrubar a tela: ela so faz a vigencia ficar
    desconhecida, que e melhor do que uma tela em branco.
    """
    if not isinstance(value, str) or not value:
        return None
    try:
        momento = datetime.fromisoformat(value)
    except ValueError:
        return None
    return momento if momento.tzinfo is not None else None


def source_is_active(
    inicio: Any, fim: Any, now: datetime | None
) -> bool | None:
    """Say whether this source covers the present moment.

    ``None`` quando nao da para afirmar — sem instante de referencia, ou com
    uma data que nao se deixa ler. Nao apurado nao e "inativa": marcar uma
    fonte viva como encerrada mandaria o operador trocar a errada.
    """
    if now is None:
        return None
    desde = _parse_instant(inicio)
    ate = _parse_instant(fim)
    if inicio and desde is None:
        return None
    if fim and ate is None:
        return None
    if desde is not None and now < desde:
        return False
    if ate is not None and now >= ate:
        return False
    return True


def _source_entry(
    entity_id: str,
    mapa: Mapping[str, str],
    presenca: Mapping[str, str],
    *,
    source_label: Any = None,
    inicio: Any = None,
    fim: Any = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    efetiva = mapa.get(entity_id, entity_id)
    entrada: dict[str, Any] = {
        "declared_entity_id": entity_id,
        "effective_entity_id": efetiva,
        "overridden": entity_id in mapa,
        "presence": presenca.get(efetiva, PRESENCE_UNKNOWN),
        "from": inicio if isinstance(inicio, str) else None,
        "until": fim if isinstance(fim, str) else None,
        "active": source_is_active(inicio, fim, now),
    }
    # O rotulo da fonte e o que distingue os dois lados de uma troca de
    # medidor; sem ele, restam duas linhas com a mesma legenda.
    if isinstance(source_label, str) and source_label:
        entrada["source_label"] = source_label
    return entrada


def _unit_metrics(
    unit: Mapping[str, Any],
    mapa: Mapping[str, str],
    presenca: Mapping[str, str],
    now: datetime | None,
) -> list[dict[str, Any]]:
    """Return every measured quantity of the unit, series before measurements.

    A ordem e a do modelo, que e a ordem em que o YAML foi escrito e a que o
    operador reconhece.
    """
    metricas: list[dict[str, Any]] = []

    series = unit.get("series")
    if isinstance(series, Mapping):
        for metric_id, definicao in series.items():
            if not isinstance(definicao, Mapping):
                continue
            fontes = definicao.get("sources")
            if not isinstance(fontes, (list, tuple)):
                continue
            entradas = [
                _source_entry(
                    fonte["entity_id"],
                    mapa,
                    presenca,
                    source_label=fonte.get("label"),
                    inicio=fonte.get("from"),
                    fim=fonte.get("until"),
                    now=now,
                )
                for fonte in fontes
                if isinstance(fonte, Mapping)
                and isinstance(fonte.get("entity_id"), str)
            ]
            if not entradas:
                continue
            metricas.append({
                "kind": KIND_SERIES,
                "id": metric_id,
                "label": definicao.get("label") or metric_id,
                "sources": entradas,
            })

    measurements = unit.get("measurements")
    if isinstance(measurements, Mapping):
        for measurement_id, definicao in measurements.items():
            if not isinstance(definicao, Mapping):
                continue
            entity_id = definicao.get("entity_id")
            if not isinstance(entity_id, str):
                continue
            metricas.append({
                "kind": KIND_MEASUREMENT,
                "id": measurement_id,
                "label": definicao.get("label") or measurement_id,
                # Uma medicao instantanea nao tem historico a preservar, entao
                # nao tem vigencia: e sempre uma fonte so, sempre a atual.
                "sources": [
                    _source_entry(entity_id, mapa, presenca, now=now)
                ],
            })

    return metricas


def build_sensor_catalog(
    declared_model: Any,
    overrides: SensorOverrides,
    presence: Mapping[str, str] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Return what the configuration screen needs to show and to edit.

    ``declared_model`` e o YAML, nao o modelo efetivo: a tela edita a
    correspondencia, e para isso precisa falar da entidade **declarada**. O
    modelo efetivo ja perdeu essa informacao — nele a troca ja aconteceu.
    """
    if not isinstance(declared_model, Mapping):
        return {"units": [], "unused_overrides": []}

    mapa = dict(overrides.entity_ids or {})
    presenca = dict(presence or {})

    unidades: list[dict[str, Any]] = []
    units = declared_model.get("units")
    if isinstance(units, Mapping):
        for unit_id, unit in units.items():
            if not isinstance(unit, Mapping):
                continue
            unidades.append({
                "unit_id": unit_id,
                "name": unit.get("name") or unit_id,
                "metrics": _unit_metrics(unit, mapa, presenca, now),
            })

    return {
        "units": unidades,
        # Um par que nao corresponde a nada nao e erro, mas e a diferenca
        # entre "o sensor esta trocado" e "a troca nao esta valendo".
        "unused_overrides": list(unused_entity_ids(declared_model, overrides)),
    }
