"""O estado da configuração do modelo, como a tela precisa vê-lo.

Responde três coisas de uma vez, porque separadas elas enganam: **quais são as
unidades**, **de onde o modelo em vigor veio** e **o que há para escolher**.

A origem importa mais do que parece. Um modelo que veio de arquivo ainda não é
editável — a primeira edição grava uma cópia no storage, e dali em diante o
arquivo deixa de ser lido. Isso precisa ser dito antes, não descoberto depois,
porque é o momento em que o arquivo deixa de ser a fonte da verdade.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping

SOURCE_STORAGE = "storage"
SOURCE_FILE = "file"


def _unit_image(unit: Mapping[str, Any]) -> str | None:
    presentation = unit.get("presentation")
    if not isinstance(presentation, Mapping):
        return None
    image = presentation.get("image")
    return image if isinstance(image, str) and image else None


def _unit_ucs(
    unit: Mapping[str, Any], bill_stats: Mapping[str, Mapping[str, Any]] | None
) -> list[dict[str, Any]]:
    """The declared UCs, masked: the screen never gets the whole number."""
    ucs = []
    for item in unit.get("ucs") or ():
        if not isinstance(item, Mapping) or not isinstance(item.get("hash"), str):
            continue
        estatistica = (bill_stats or {}).get(item["hash"]) or {}
        ucs.append({
            "hash": item["hash"],
            "suffix": item.get("suffix"),
            "bills": (
                estatistica.get("bills", 0) if bill_stats is not None else None
            ),
            "first_reference": estatistica.get("first"),
            "last_reference": estatistica.get("last"),
        })
    return ucs


def _unit_color(unit: Mapping[str, Any]) -> str | None:
    presentation = unit.get("presentation")
    if not isinstance(presentation, Mapping):
        return None
    color = presentation.get("color")
    return color if isinstance(color, str) and color else None


def _unit_metrics(
    unit: Mapping[str, Any], now: datetime | None = None
) -> list[dict[str, Any]]:
    """Return what the unit measures, with every source and its window.

    Uma troca de medidor deixa duas fontes na mesma grandeza, cada uma
    cobrindo um trecho do tempo. As duas vem juntas e em ordem, porque so
    lado a lado elas se leem como o historico de uma coisa so — e porque
    trocar a encerrada nao muda a leitura de hoje, muda a de entao.
    """
    from .model_builder import MEASURABLE_METRICS
    from .sensor_overrides_serializer import source_is_active

    series = unit.get("series")
    if not isinstance(series, Mapping):
        return []
    medidas: list[dict[str, Any]] = []
    for metric_id, definicao in series.items():
        if not isinstance(definicao, Mapping):
            continue
        bruto = definicao.get("sources")
        bruto = list(bruto) if isinstance(bruto, (list, tuple)) else []
        fontes = []
        for fonte in bruto:
            if not isinstance(fonte, Mapping):
                continue
            entity_id = fonte.get("entity_id")
            if not isinstance(entity_id, str):
                continue
            inicio = fonte.get("from")
            fim = fonte.get("until")
            fontes.append({
                "entity_id": entity_id,
                "label": fonte.get("label"),
                "from": inicio if isinstance(inicio, str) else None,
                "until": fim if isinstance(fim, str) else None,
                "active": source_is_active(inicio, fim, now),
            })
        medidas.append({
            "metric": metric_id,
            "label": definicao.get("label") or metric_id,
            "sources": fontes,
            "source_count": len(fontes),
            # A grandeza aceita troca de medidor quando o projeto a conhece.
            "swappable": metric_id in MEASURABLE_METRICS,
            # Um unico sensor se troca no lugar; com historico em dois
            # trechos, trocar no lugar apagaria um deles.
            "editable": len(fontes) <= 1 and metric_id in MEASURABLE_METRICS,
            "entity_id": fontes[0]["entity_id"] if len(fontes) == 1 else None,
        })
    return medidas


def _unit_derived(unit: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Return what the unit calculates because of what it measures."""
    derived = unit.get("derived_metrics")
    if not isinstance(derived, Mapping):
        return []
    return [
        {"metric": metric_id, "label": definicao.get("label") or metric_id}
        for metric_id, definicao in derived.items()
        if isinstance(definicao, Mapping)
    ]


def _available_for(unit: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Return the quantities this unit may still start measuring."""
    from .model_builder import MEASURABLE_METRICS, metrics_for_role

    series = unit.get("series")
    ja_mede = set(series) if isinstance(series, Mapping) else set()
    return [
        {"metric": metric_id, "label": MEASURABLE_METRICS[metric_id]["label"]}
        for metric_id in metrics_for_role(unit.get("role"))
        if metric_id not in ja_mede and metric_id in MEASURABLE_METRICS
    ]


def _unit_readings(unit: Mapping[str, Any]) -> list[dict[str, Any]]:
    """Return the instant readings the unit declares, and with which entity."""
    measurements = unit.get("measurements")
    if not isinstance(measurements, Mapping):
        return []
    return [
        {
            "metric": measurement_id,
            "label": definicao.get("label") or measurement_id,
            "entity_id": definicao.get("entity_id"),
            "unit": definicao.get("unit"),
        }
        for measurement_id, definicao in measurements.items()
        if isinstance(definicao, Mapping)
        and isinstance(definicao.get("entity_id"), str)
    ]


def _sensor_count(unit: Mapping[str, Any]) -> int:
    """Quantas fontes a unidade declara, somando series e medicoes.

    E o que diz se a unidade ja foi configurada de verdade: uma unidade recem
    criada e valida e nao mede nada, e a tela precisa distinguir isso de uma
    que esta pronta.
    """
    total = 0
    series = unit.get("series")
    if isinstance(series, Mapping):
        for definicao in series.values():
            if not isinstance(definicao, Mapping):
                continue
            fontes = definicao.get("sources")
            if isinstance(fontes, (list, tuple)):
                total += sum(
                    1
                    for fonte in fontes
                    if isinstance(fonte, Mapping)
                    and isinstance(fonte.get("entity_id"), str)
                )
    measurements = unit.get("measurements")
    if isinstance(measurements, Mapping):
        total += sum(
            1
            for definicao in measurements.values()
            if isinstance(definicao, Mapping)
            and isinstance(definicao.get("entity_id"), str)
        )
    return total


def build_model_config(
    model: Any,
    *,
    source: str,
    model_path: str | None = None,
    images: Any = (),
    updated_at: Any = None,
    now: datetime | None = None,
    bill_stats: Mapping[str, Mapping[str, Any]] | None = None,
) -> dict[str, Any]:
    """Return the configuration state the screen reads.

    `bill_stats` diz quantas faturas cada UC achou e de que periodo. Sem o
    documento de faturas ele vem vazio, e a tela deixa de mostrar a
    contagem em vez de mostrar zero — zero seria afirmar que a UC nao
    casou com nada.
    """
    unidades: list[dict[str, Any]] = []
    if isinstance(model, Mapping):
        units = model.get("units")
        if isinstance(units, Mapping):
            for unit_id, unit in units.items():
                if not isinstance(unit, Mapping):
                    continue
                unidades.append({
                    "unit_id": unit_id,
                    "name": unit.get("name") or unit_id,
                    "role": unit.get("role"),
                    "measured": unit.get("measured"),
                    "image": _unit_image(unit),
                    "color": _unit_color(unit),
                    "ucs": _unit_ucs(unit, bill_stats),
                    "sensor_count": _sensor_count(unit),
                    # O que ela mede, e o que ela calcula por medir isso. Os
                    # dois juntos porque o segundo e consequencia do primeiro,
                    # e a tela precisa mostrar que apontar um sensor fez uma
                    # funcao nova aparecer.
                    "metrics": _unit_metrics(unit, now),
                    # O que esta unidade ainda pode medir, conforme o papel.
                    # Por unidade e nao global: oferecer consumo a quem gera
                    # abriria caminho para medir duas vezes a mesma energia.
                    "available_metrics": _available_for(unit),
                    "derived": _unit_derived(unit),
                    "readings": _unit_readings(unit),
                })

    from .model_builder import INSTANT_MEASUREMENTS, MEASURABLE_METRICS

    return {
        "source": source,
        "model_path": model_path,
        # As grandezas que uma unidade pode passar a medir. Quatro escolhas
        # com nome de gente, no lugar de campos tecnicos a preencher.
        "available_metrics": [
            {"metric": metric_id, "label": definicao["label"]}
            for metric_id, definicao in MEASURABLE_METRICS.items()
        ],
        # As leituras do momento, que aparecem no topo da tela da unidade.
        # Nenhuma e obrigatoria: uma unidade sem nenhuma segue completa.
        "available_readings": [
            {"metric": metric_id, "label": definicao["label"],
             "unit": definicao["unit"]}
            for metric_id, definicao in INSTANT_MEASUREMENTS.items()
        ],
        # Importar so faz sentido uma vez: com o modelo ja no storage, o
        # arquivo nao e mais lido, e reimportar apagaria o que foi editado.
        "can_import": source == SOURCE_FILE and bool(model_path),
        "units": unidades,
        "images": [dict(imagem) for imagem in (images or ())],
        "updated_at": updated_at,
    }
