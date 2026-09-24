"""Monta e edita o modelo de energia a partir de respostas simples.

O que a interface pergunta é curto: tem geração, quais unidades, quais
sensores. O que o modelo exige é um pouco mais, e o resto deste módulo existe
para preencher esse resto sem perguntar — porque perguntar ao operador o valor
de ``acceptance_ratio_min`` não o ajudaria a responder melhor.

**Nenhum valor aqui é inventado.** Os padrões são exatamente os que o modelo de
referência já declara e que já passaram por validação; herdá-los é reusar uma
decisão tomada, não tomar uma nova. Onde não existe decisão prévia — limites
elétricos, tarifas, tolerância de auditoria — o bloco simplesmente não é
escrito, e o modelo continua válido sem ele.

Sobre identidade: cada unidade tem um **id** e um **nome**. O nome é rótulo de
tela e muda quando o operador quiser. O id é o que amarra tudo — o
``billing_key`` que casa com a fatura, os ids lógicos das séries, os
percentuais de rateio já gravados, o histórico. Por isso ele nasce do nome uma
única vez, na criação, e nunca mais muda: renomear uma unidade não
pode reescrever o rateio de ciclos fechados.
"""

from __future__ import annotations

from datetime import datetime
import re
from typing import Any, Mapping
import unicodedata

from .energy_model import EnergyModelError, validate_energy_model
from .equatorial_adapter import is_uc_hash, uc_digits, uc_hash

#: Papéis que a pergunta de abertura produz. "Tem geração?" é a única coisa
#: que o operador precisa saber responder para que o modelo saiba o resto.
ROLE_GENERATOR = "producer_consumer"
ROLE_CONSUMER = "consumer_beneficiary"

#: Política de cobertura do modelo de referência, já validada. Repetida aqui
#: como ponto de partida de uma instalação nova — não como valor novo.
DEFAULT_COVERAGE_ALGORITHM: dict[str, Any] = {
    "status": "validated",
    "confirmed": {
        "observation_coverage_ratio_min": 1.0,
        "acceptance_ratio_min": 0.995,
        "require_no_missing_observations": True,
        "max_contiguous_rejected_duration_seconds": 3600,
    },
    "partial": {
        "preserve_observed_value": True,
        "extrapolate_missing_energy": False,
    },
    "unavailable": {"missing_value_is_zero": False},
}

#: O horário de alinhamento entre as datas da distribuidora e as estatísticas
#: do Home Assistant (AGENTS.md §14). Configurável depois, nos ajustes.
DEFAULT_BOUNDARY_TIME = "10:00"

_SLUG_INVALIDO = re.compile(r"[^a-z0-9]+")


class ModelBuilderError(ValueError):
    """Raised when the requested model change cannot be made."""


def slugify(name: Any) -> str:
    """Return a stable identifier derived from a human name.

    Sem acento e sem espaco porque o id vira parte de um id logico
    (`casa_do_joao.export_energy`) e de uma chave de storage, lidos e escritos
    por gente e por arquivo.
    """
    if not isinstance(name, str) or not name.strip():
        raise ModelBuilderError("name must be a non-empty string")
    sem_acento = unicodedata.normalize("NFKD", name)
    sem_acento = sem_acento.encode("ascii", "ignore").decode("ascii")
    slug = _SLUG_INVALIDO.sub("_", sem_acento.lower()).strip("_")
    if not slug:
        raise ModelBuilderError(f"name {name!r} has no usable characters")
    return slug


def make_unit_id(name: Any, existing: Any = ()) -> str:
    """Return an identifier that no other unit already uses.

    Duas unidades chamadas "Casa" sao plausiveis, e a segunda nao pode
    sobrescrever a primeira em silencio.
    """
    base = slugify(name)
    usados = set(existing or ())
    if base not in usados:
        return base
    for sufixo in range(2, 1000):
        candidato = f"{base}_{sufixo}"
        if candidato not in usados:
            return candidato
    raise ModelBuilderError(f"could not derive a free id from {name!r}")


def make_unit(
    name: str,
    *,
    role: str = ROLE_CONSUMER,
    measured: bool = True,
    unit_id: str | None = None,
) -> tuple[str, dict[str, Any]]:
    """Return ``(unit_id, unit)`` for one unit with the minimum the model asks.

    Series e medicoes entram depois, quando o operador apontar os sensores: uma
    unidade sem serie e valida, e e o estado correto de quem acabou de ser
    criada e ainda nao teve o medidor escolhido.
    """
    if role not in (ROLE_GENERATOR, ROLE_CONSUMER):
        raise ModelBuilderError(f"unknown role: {role!r}")
    if not isinstance(measured, bool):
        raise ModelBuilderError("measured must be boolean")
    identificador = unit_id if unit_id is not None else slugify(name)
    if not isinstance(name, str) or not name.strip():
        raise ModelBuilderError("name must be a non-empty string")
    return identificador, {
        "name": name.strip(),
        "role": role,
        "measured": measured,
        # O mesmo id serve de chave na fatura. Quem importa de um extrator
        # com outra nomenclatura ajusta depois; comecar igual e o que faz a
        # fatura casar sozinha no caso comum.
        "billing_key": identificador,
    }


def build_model(
    *,
    timezone: str,
    billing_json_path: str | None = None,
    units: Mapping[str, Any] | None = None,
    boundary_time: str = DEFAULT_BOUNDARY_TIME,
) -> dict[str, Any]:
    """Return a complete, valid model from the few answers the screen collects.

    Sem unidade e sem caminho de faturas e um modelo legitimo: e com ele que
    uma instalacao nova sobe, antes de alguem criar a primeira unidade pela
    tela. As faturas vem do storage, e o arquivo so existe para quem ja tinha
    um.

    Valida antes de devolver: o construtor nao pode ser uma segunda porta por
    onde entra um modelo que o YAML nunca conseguiria.
    """
    if not isinstance(timezone, str) or not timezone.strip():
        raise ModelBuilderError("timezone must be a non-empty string")
    if billing_json_path is not None and (
        not isinstance(billing_json_path, str) or not billing_json_path.strip()
    ):
        raise ModelBuilderError("billing_json_path must be a non-empty string")
    if units is None:
        units = {}
    if not isinstance(units, Mapping):
        raise ModelBuilderError("units must be a mapping")

    billing: dict[str, Any] = {"boundary_time": boundary_time}
    if billing_json_path is not None:
        billing["json_path"] = billing_json_path
    model: dict[str, Any] = {
        "model_version": 1,
        "general": {"timezone": timezone},
        "billing": billing,
        "coverage_algorithm": _copiar(DEFAULT_COVERAGE_ALGORITHM),
        "units": {unit_id: _copiar(unit) for unit_id, unit in units.items()},
    }
    _validar(model)
    return model


def rename_unit(
    model: Mapping[str, Any], unit_id: str, name: str
) -> dict[str, Any]:
    """Return the model with one unit renamed, and nothing else touched.

    O id nao acompanha o nome de proposito. Ele e a chave do rateio ja
    gravado, dos ids logicos das series e do historico; troca-lo por causa de
    um rotulo reescreveria ciclos fechados sem que nada aparecesse na tela.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if not isinstance(name, str) or not name.strip():
        raise ModelBuilderError("name must be a non-empty string")

    novo = _copiar(model)
    novo["units"][unit_id]["name"] = name.strip()
    _validar(novo)
    return novo


def add_unit(
    model: Mapping[str, Any],
    name: str,
    *,
    role: str = ROLE_CONSUMER,
    measured: bool = True,
) -> tuple[str, dict[str, Any]]:
    """Return ``(unit_id, model)`` with one unit added."""
    unidades = _unidades(model)
    unit_id = make_unit_id(name, unidades.keys())
    _, unidade = make_unit(name, role=role, measured=measured, unit_id=unit_id)

    novo = _copiar(model)
    novo["units"][unit_id] = unidade
    _validar(novo)
    return unit_id, novo


def remove_unit(model: Mapping[str, Any], unit_id: str) -> dict[str, Any]:
    """Return the model without one unit.

    Remover a ULTIMA e permitido. Ate a instalacao poder nascer vazia, um
    modelo sem unidade nao era valido, e esta funcao recusava — com um erro em
    ingles que a tela engolia: quem tentava excluir a unica unidade clicava,
    confirmava, e nada acontecia. Hoje vazio e o estado de quem acabou de
    instalar, e voltar a ele e so recomecar.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")

    novo = _copiar(model)
    del novo["units"][unit_id]
    _validar(novo)
    return novo


def set_unit_role(
    model: Mapping[str, Any], unit_id: str, role: str
) -> dict[str, Any]:
    """Return the model with one unit's role changed.

    Recusa a segunda geradora: autoconsumo, fluxo e payback sao escritos para
    uma so, e aceitar duas produziria numero plausivel e errado.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if role not in (ROLE_GENERATOR, ROLE_CONSUMER):
        raise ModelBuilderError(f"unknown role: {role!r}")
    if role == ROLE_GENERATOR:
        outras = [
            outro
            for outro, unidade in unidades.items()
            if outro != unit_id and unidade.get("role") == ROLE_GENERATOR
        ]
        if outras:
            raise ModelBuilderError(
                f"{outras[0]!r} already generates; only one unit may generate"
            )

    novo = _copiar(model)
    novo["units"][unit_id]["role"] = role
    # O que a unidade mede, calcula, audita e prevê acompanha o papel.
    _accommodate_series_to_role(novo["units"][unit_id])
    reconcile_unit_capabilities(novo["units"][unit_id])
    _validar(novo)
    return novo


#: As grandezas que uma unidade pode medir, com tudo o que o modelo exige de
#: cada uma. É o que a tela oferece quando se pede "adicionar medição": quatro
#: escolhas com nome de gente, não campos técnicos a preencher.
MEASURABLE_METRICS: dict[str, dict[str, Any]] = {
    "consumption_energy": {
        "label": "Consumo", "quantity": "energy", "unit": "kWh",
        "classification": "measured",
    },
    "generation_energy": {
        "label": "Geração", "quantity": "energy", "unit": "kWh",
        "classification": "measured",
    },
    "export_energy": {
        "label": "Exportação", "quantity": "energy", "unit": "kWh",
        "classification": "measured",
    },
    "import_energy": {
        "label": "Importação", "quantity": "energy", "unit": "kWh",
        "classification": "measured",
    },
}

#: O que cada papel mede. Uma consumidora tem um medidor e mede consumo. Uma
#: geradora mede o que atravessa a fronteira — geração, o que sobe para a rede
#: e o que desce dela — e o consumo dela **não** se mede: sai da conta, como
#: "consumo físico". Oferecer consumo a quem gera seria oferecer um caminho
#: para medir duas vezes a mesma energia.
METRICS_BY_ROLE: dict[str, tuple[str, ...]] = {
    ROLE_CONSUMER: ("consumption_energy",),
    ROLE_GENERATOR: ("generation_energy", "export_energy", "import_energy"),
}


def metrics_for_role(role: Any) -> tuple[str, ...]:
    """Return the quantities a unit with this role is supposed to measure.

    Papel desconhecido cai em consumidora: e o caso comum, e oferecer consumo
    a mais e menos grave do que nao oferecer nada e deixar a unidade sem como
    medir.
    """
    return METRICS_BY_ROLE.get(role, METRICS_BY_ROLE[ROLE_CONSUMER])


#: O que se calcula a partir do que foi medido, e de que depende cada um. As
#: dependências vêm de ``energy``, e não repetidas aqui: a fórmula e a sua
#: condição de existência têm de envelhecer juntas.
DERIVED_METRICS: dict[str, dict[str, Any]] = {
    "self_consumption": {
        "label": "Autoconsumo", "quantity": "energy", "unit": "kWh",
        "classification": "calculated", "formula_id": "solar_self_consumption",
    },
    "physical_consumption": {
        "label": "Consumo físico", "quantity": "energy", "unit": "kWh",
        "classification": "calculated",
        "formula_id": "solar_physical_consumption",
    },
}

#: Contra qual campo da fatura cada grandeza medida é conferida. Sem par não há
#: auditoria — e é assim para a geração, que a distribuidora não fatura.
AUDIT_SOURCES: dict[str, str] = {
    "consumption_energy": "meter_active_kwh",
    "import_energy": "meter_active_kwh",
    "export_energy": "meter_generation_kwh",
}

#: A previsão mira o consumo mais completo que a unidade souber produzir.
FORECAST_PREFERENCE = ("physical_consumption", "consumption_energy")
FORECAST_METHOD = "physical_linear"


def _available_metrics(unit: Mapping[str, Any]) -> set[str]:
    disponiveis = set()
    for secao in ("series", "derived_metrics"):
        bloco = unit.get(secao)
        if isinstance(bloco, Mapping):
            disponiveis.update(bloco)
    return disponiveis


#: Onde ficam as séries que o papel atual da unidade não mede. Nenhum
#: cálculo, gráfico ou auditoria lê esta chave — só ``set_unit_role`` a usa,
#: para devolver as séries quando o papel volta.
DORMANT_SERIES_KEY = "dormant_series"


def _accommodate_series_to_role(unit: dict[str, Any]) -> None:
    """Deixa em ``series`` só o que o papel mede; o resto fica guardado.

    Trocar o papel não pode deixar as grandezas do papel anterior valendo:
    uma unidade que deixou de gerar continuava com geração, exportação e
    importação no modelo, e a previsão seguia o "consumo físico" calculado
    delas — o card mostrava o consumo novo e a projeção antiga.

    Apagar também seria errado: a série carrega o histórico das trocas de
    medidor, e quem trocou o papel por engano perderia isso num clique.
    Guardadas, voltam intactas quando o papel volta.
    """
    validas = set(metrics_for_role(unit.get("role")))
    series = dict(unit.get("series") or {})
    guardadas = dict(unit.get(DORMANT_SERIES_KEY) or {})
    for metric_id in list(series):
        if metric_id in MEASURABLE_METRICS and metric_id not in validas:
            guardadas[metric_id] = series.pop(metric_id)
    for metric_id in list(guardadas):
        if metric_id in validas and metric_id not in series:
            series[metric_id] = guardadas.pop(metric_id)
    if series:
        unit["series"] = series
    else:
        unit.pop("series", None)
    if guardadas:
        unit[DORMANT_SERIES_KEY] = guardadas
    else:
        unit.pop(DORMANT_SERIES_KEY, None)


def reconcile_unit_capabilities(unit: dict[str, Any]) -> dict[str, Any]:
    """Return the unit with everything its sensors make possible, and no more.

    O operador aponta sensores; auditoria, calculo derivado e previsao sao
    consequencia, nao configuracao a parte. Declarar geracao e exportacao e o
    que faz existir autoconsumo, e e so por isso que ele existe.

    Roda em ponto fixo porque as derivadas se encadeiam: consumo fisico
    depende de autoconsumo, que depende de geracao e exportacao.
    """
    from .energy import FORMULA_DEPENDENCIES

    series = unit.get("series")
    medidas = set(series) if isinstance(series, Mapping) else set()

    derivadas: dict[str, Any] = {}
    while True:
        disponiveis = medidas | set(derivadas)
        novas = {
            metric_id: dict(definicao)
            for metric_id, definicao in DERIVED_METRICS.items()
            if metric_id not in derivadas
            and set(FORMULA_DEPENDENCIES.get(definicao["formula_id"], ()))
            <= disponiveis
        }
        if not novas:
            break
        derivadas.update(novas)

    if derivadas:
        unit["derived_metrics"] = derivadas
    else:
        unit.pop("derived_metrics", None)

    pares = [
        {"metric": metric_id, "official_source": AUDIT_SOURCES[metric_id]}
        for metric_id in MEASURABLE_METRICS
        if metric_id in medidas and metric_id in AUDIT_SOURCES
    ]
    if pares:
        unit["audit"] = {"pairs": pares}
    else:
        unit.pop("audit", None)

    alvo = next(
        (
            metric_id
            for metric_id in FORECAST_PREFERENCE
            if metric_id in medidas or metric_id in derivadas
        ),
        None,
    )
    if alvo:
        unit["forecast"] = {"method": FORECAST_METHOD, "target_metric": alvo}
    else:
        unit.pop("forecast", None)
    return unit


#: As leituras do momento — o que a tela da unidade mostra no topo. São outra
#: coisa das séries: não acumulam, não entram em ciclo e não viram energia.
#: Nenhuma delas é obrigatória, e uma unidade sem nenhuma continua completa.
INSTANT_MEASUREMENTS: dict[str, dict[str, Any]] = {
    "voltage": {"label": "Tensão", "quantity": "voltage", "unit": "V"},
    "current": {"label": "Corrente", "quantity": "current", "unit": "A"},
    "power": {"label": "Potência", "quantity": "power", "unit": "W"},
    "power_factor": {
        "label": "Fator de potência", "quantity": "power_factor",
        "unit": "cos φ",
    },
    "frequency": {"label": "Frequência", "quantity": "frequency", "unit": "Hz"},
}


def set_unit_measurement(
    model: Mapping[str, Any], unit_id: str, measurement_id: str, entity_id: str
) -> dict[str, Any]:
    """Point one instant reading of a unit at one entity."""
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if measurement_id not in INSTANT_MEASUREMENTS:
        raise ModelBuilderError(f"unknown measurement: {measurement_id!r}")
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise ModelBuilderError("entity_id must be a non-empty string")

    novo = _copiar(model)
    unidade = novo["units"][unit_id]
    medicoes = unidade.setdefault("measurements", {})
    medicoes[measurement_id] = {
        **INSTANT_MEASUREMENTS[measurement_id],
        "entity_id": entity_id.strip(),
    }
    _validar(novo)
    return novo


def remove_unit_measurement(
    model: Mapping[str, Any], unit_id: str, measurement_id: str
) -> dict[str, Any]:
    """Return the model without one instant reading of a unit."""
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")

    novo = _copiar(model)
    unidade = novo["units"][unit_id]
    medicoes = unidade.get("measurements")
    if not isinstance(medicoes, dict) or measurement_id not in medicoes:
        raise ModelBuilderError(f"{unit_id} does not read {measurement_id!r}")
    del medicoes[measurement_id]
    if not medicoes:
        unidade.pop("measurements", None)
    _validar(novo)
    return novo


def set_unit_series(
    model: Mapping[str, Any], unit_id: str, metric_id: str, entity_id: str
) -> dict[str, Any]:
    """Point one measured quantity of a unit at one entity.

    Substitui a fonte quando a grandeza ja existe. Nao mexe em serie com mais
    de uma fonte — essas tem corte de data, e trocar uma delas por aqui
    reescreveria o historico de um trecho sem que nada aparecesse na tela.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if metric_id not in MEASURABLE_METRICS:
        raise ModelBuilderError(f"unknown metric: {metric_id!r}")
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise ModelBuilderError("entity_id must be a non-empty string")

    novo = _copiar(model)
    unidade = novo["units"][unit_id]
    series = unidade.setdefault("series", {})

    existente = series.get(metric_id)
    if isinstance(existente, Mapping):
        fontes = existente.get("sources")
        if isinstance(fontes, list) and len(fontes) > 1:
            raise ModelBuilderError(
                f"{metric_id} has more than one source; editing it here would "
                "rewrite history"
            )

    series[metric_id] = {
        **MEASURABLE_METRICS[metric_id],
        "sources": [{"entity_id": entity_id.strip()}],
    }
    reconcile_unit_capabilities(unidade)
    _validar(novo)
    return novo


def swap_unit_meter(
    model: Mapping[str, Any],
    unit_id: str,
    metric_id: str,
    entity_id: str,
    at: datetime,
    *,
    label: str | None = None,
) -> dict[str, Any]:
    """Close the current source at ``at`` and open a new one from there.

    A troca de medidor nao cria uma grandeza nova: a serie continua a mesma, e
    passa a ter duas fontes, cada uma cobrindo um trecho do tempo. E assim que
    o historico de antes e o de depois se leem como um so.

    A data vem do operador, nunca daqui — errar um corte reescreve meses de
    leitura, e o contrato do projeto e explicito em nao inventar data nem
    limite. O que o sistema faz por conta propria sao as duas regras que ele
    ja conhece e que ninguem deveria ter de lembrar:

    * **o corte cai na hora cheia**, porque a hora que atravessa a troca fica
      partida entre dois medidores e nenhum dos dois a cobre inteira;
    * **a fonte nova descarta a primeira variacao**, senao a diferenca entre o
      zero dela e a primeira leitura entraria como consumo.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if metric_id not in MEASURABLE_METRICS:
        raise ModelBuilderError(f"unknown metric: {metric_id!r}")
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise ModelBuilderError("entity_id must be a non-empty string")
    if not isinstance(at, datetime) or at.tzinfo is None:
        raise ModelBuilderError("the swap instant must be an aware datetime")

    serie_atual = (
        unidades[unit_id].get("series", {}) if isinstance(unidades[unit_id], Mapping)
        else {}
    )
    if not isinstance(serie_atual, Mapping) or metric_id not in serie_atual:
        raise ModelBuilderError(
            f"{unit_id} does not measure {metric_id!r} yet; point a sensor first"
        )
    fontes = list(serie_atual[metric_id].get("sources") or ())
    if not fontes:
        raise ModelBuilderError(f"{metric_id} has no source to replace")

    corte = at.replace(minute=0, second=0, microsecond=0).isoformat()
    ultima = fontes[-1]
    if not isinstance(ultima, Mapping):
        raise ModelBuilderError(f"{metric_id} has an unreadable source")
    if ultima.get("until"):
        raise ModelBuilderError(
            f"{metric_id} already ends at {ultima['until']}; its history is closed"
        )
    if ultima.get("from") and str(ultima["from"]) >= corte:
        raise ModelBuilderError(
            "the swap must come after the current source started"
        )
    if ultima.get("entity_id") == entity_id.strip():
        raise ModelBuilderError("the new meter is the one already in use")

    novo = _copiar(model)
    lista = novo["units"][unit_id]["series"][metric_id]["sources"]
    lista[-1] = {**lista[-1], "until": corte}
    nova_fonte: dict[str, Any] = {
        "entity_id": entity_id.strip(),
        "from": corte,
        "skip_first_change": True,
    }
    if isinstance(label, str) and label.strip():
        nova_fonte["label"] = label.strip()
    lista.append(nova_fonte)
    reconcile_unit_capabilities(novo["units"][unit_id])
    _validar(novo)
    return novo


def set_current_source(
    model: Mapping[str, Any], unit_id: str, metric_id: str, entity_id: str
) -> dict[str, Any]:
    """Corrigir o sensor ATUAL de uma série, sem tocar no histórico.

    Para quem apontou o sensor errado: só a fonte vigente muda de entidade.
    As fontes anteriores, com as datas de corte, ficam como estavam — são o
    registro de quais medidores a unidade já teve. Registrar uma troca nova,
    com data, é ``swap_unit_meter``.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise ModelBuilderError("entity_id must be a non-empty string")
    series = unidades[unit_id].get("series")
    if not isinstance(series, Mapping) or metric_id not in series:
        raise ModelBuilderError(f"{unit_id} does not measure {metric_id!r}")
    fontes = series[metric_id].get("sources")
    if not isinstance(fontes, list) or not fontes:
        raise ModelBuilderError(f"{metric_id} has no source to correct")

    novo = _copiar(model)
    lista = novo["units"][unit_id]["series"][metric_id]["sources"]
    lista[-1] = {**lista[-1], "entity_id": entity_id.strip()}
    _validar(novo)
    return novo


def remove_unit_series(
    model: Mapping[str, Any], unit_id: str, metric_id: str
) -> dict[str, Any]:
    """Return the model without one measured quantity of a unit."""
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")

    novo = _copiar(model)
    unidade = novo["units"][unit_id]
    series = unidade.get("series")
    if not isinstance(series, dict) or metric_id not in series:
        raise ModelBuilderError(f"{unit_id} does not measure {metric_id!r}")
    fontes = series[metric_id].get("sources")
    if isinstance(fontes, list) and len(fontes) > 1:
        raise ModelBuilderError(
            f"{metric_id} has more than one source; removing it here would "
            "discard a declared history"
        )

    del series[metric_id]
    if not series:
        unidade.pop("series", None)
    reconcile_unit_capabilities(unidade)
    _validar(novo)
    return novo


def set_unit_measured(
    model: Mapping[str, Any], unit_id: str, measured: bool
) -> dict[str, Any]:
    """Say whether this unit has a meter in Home Assistant at all.

    Nem toda unidade tem medidor, e isso nao e configuracao pendente: ha quem
    so se acompanhe pela fatura da distribuidora. O modelo sempre soube
    distinguir os dois — faltava a tela perguntar, e por isso ela cobrava
    sensor de quem nunca vai ter um.

    Desmarcar nao apaga o que ja foi declarado: as series continuam no modelo,
    e voltar a marcar as devolve. Apagar por causa de uma caixa desmarcada
    seria perder configuracao por um clique.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if not isinstance(measured, bool):
        raise ModelBuilderError("measured must be boolean")

    novo = _copiar(model)
    novo["units"][unit_id]["measured"] = measured
    _validar(novo)
    return novo


#: Uma cor em notacao hexadecimal, do jeito que o seletor do navegador
#: devolve. Nao ha paleta fechada: a cor e escolha de quem olha a tela.
_COR_HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


def set_unit_color(
    model: Mapping[str, Any], unit_id: str, color: str | None
) -> dict[str, Any]:
    """Return the model with one unit's colour set, or cleared with ``None``.

    A cor identifica a unidade onde varias aparecem juntas — no payback, na
    rosca do rateio. Uma cor derivada do identificador serve de ponto de
    partida, mas quem olha a tela e quem sabe qual cor pertence a qual
    unidade; limpar devolve a derivada.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if color is not None and (
        not isinstance(color, str) or not _COR_HEX.match(color.strip())
    ):
        raise ModelBuilderError("color must be #rrggbb or None")

    novo = _copiar(model)
    unidade = novo["units"][unit_id]
    apresentacao = unidade.get("presentation")
    if not isinstance(apresentacao, dict):
        apresentacao = {}
    if color is None:
        apresentacao.pop("color", None)
    else:
        apresentacao["color"] = color.strip().lower()
    if apresentacao:
        unidade["presentation"] = apresentacao
    else:
        unidade.pop("presentation", None)
    _validar(novo)
    return novo


def add_unit_uc(
    model: Mapping[str, Any], unit_id: str, uc: Any
) -> dict[str, Any]:
    """Return the model with one more UC declared for the unit.

    E a UC que diz de quem e a fatura. Uma unidade pode ter mais de uma — a
    distribuidora renumera, e ha unidade com mais de um contrato.

    Guarda-se o hash, o mesmo que o extrator grava na fatura, e os quatro
    ultimos digitos para a tela mostrar qual e qual. O numero inteiro nao
    fica em lugar nenhum: nao precisa ser relido para casar.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    digitos = uc_digits(uc)
    if not digitos:
        raise ModelBuilderError("the UC must contain digits")
    valor = uc_hash(digitos)
    for outro_id, outra in unidades.items():
        declaradas = outra.get("ucs") if isinstance(outra, Mapping) else None
        if any(
            isinstance(item, Mapping) and item.get("hash") == valor
            for item in declaradas or ()
        ):
            if outro_id == unit_id:
                raise ModelBuilderError("this UC is already declared for this unit")
            raise ModelBuilderError(f"this UC already belongs to {outro_id!r}")

    novo = _copiar(model)
    lista = novo["units"][unit_id].setdefault("ucs", [])
    lista.append({"hash": valor, "suffix": digitos[-4:]})
    _validar(novo)
    return novo


def set_uc_owner(
    model: Mapping[str, Any],
    uc_hash_value: Any,
    unit_id: str | None,
    *,
    suffix: str | None = None,
) -> dict[str, Any]:
    """Return the model with one UC belonging to ``unit_id``, or to nobody.

    E a resposta a pergunta "de qual unidade e esta fatura?", e tambem a
    correcao de uma resposta errada. Por isso e um passo so: a UC sai de onde
    estiver e entra na unidade nova na mesma gravacao. Em dois passos haveria
    um instante sem dono — e um "depois eu termino" esquecido no meio.

    Chega pelo hash, nao pelo numero: quem pergunta e a fatura, e a fatura so
    tem o hash. ``suffix`` sao os quatro ultimos digitos, quando se sabe.
    """
    if not is_uc_hash(uc_hash_value):
        raise ModelBuilderError("uc must be a sha256 hash")
    unidades = _unidades(model)
    if unit_id is not None and unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if suffix is not None and not (
        isinstance(suffix, str) and suffix and suffix.isdigit() and len(suffix) <= 4
    ):
        raise ModelBuilderError("suffix must be up to four digits")

    novo = _copiar(model)
    tinha_dono = False
    for unidade in novo["units"].values():
        lista = unidade.get("ucs") if isinstance(unidade, dict) else None
        if not lista:
            continue
        restantes = [
            item for item in lista
            if not (isinstance(item, Mapping) and item.get("hash") == uc_hash_value)
        ]
        if len(restantes) != len(lista):
            tinha_dono = True
            if restantes:
                unidade["ucs"] = restantes
            else:
                unidade.pop("ucs", None)
    if unit_id is None and not tinha_dono:
        raise ModelBuilderError("this UC has no owner to remove")
    if unit_id is not None:
        item: dict[str, Any] = {"hash": uc_hash_value}
        if suffix:
            item["suffix"] = suffix
        novo["units"][unit_id].setdefault("ucs", []).append(item)
    _validar(novo)
    return novo


def remove_unit_uc(
    model: Mapping[str, Any], unit_id: str, uc_hash_value: Any
) -> dict[str, Any]:
    """Return the model without one declared UC of the unit.

    As faturas daquela UC nao somem: voltam a ser achadas como antes, pelo
    nome sob o qual o extrator as guardou.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    novo = _copiar(model)
    unidade = novo["units"][unit_id]
    lista = unidade.get("ucs") or []
    restantes = [
        item for item in lista
        if not (isinstance(item, Mapping) and item.get("hash") == uc_hash_value)
    ]
    if len(restantes) == len(lista):
        raise ModelBuilderError("this UC is not declared for this unit")
    if restantes:
        unidade["ucs"] = restantes
    else:
        unidade.pop("ucs", None)
    _validar(novo)
    return novo


def set_unit_image(
    model: Mapping[str, Any], unit_id: str, image: str | None
) -> dict[str, Any]:
    """Return the model with one unit's picture set, or cleared with ``None``.

    A foto e um enfeite util e nada mais: nenhum calculo depende dela, e uma
    unidade sem foto e um estado valido — nao uma configuracao incompleta. Por
    isso limpar e tao aceitavel quanto escolher, e o bloco `presentation` sai
    inteiro quando fica vazio, em vez de ficar guardando uma chave nula.
    """
    unidades = _unidades(model)
    if unit_id not in unidades:
        raise ModelBuilderError(f"unknown unit: {unit_id!r}")
    if image is not None and (not isinstance(image, str) or not image.strip()):
        raise ModelBuilderError("image must be a non-empty string or None")

    novo = _copiar(model)
    unidade = novo["units"][unit_id]
    apresentacao = unidade.get("presentation")
    if not isinstance(apresentacao, dict):
        apresentacao = {}

    if image is None:
        apresentacao.pop("image", None)
    else:
        apresentacao["image"] = image.strip()

    if apresentacao:
        unidade["presentation"] = apresentacao
    else:
        unidade.pop("presentation", None)
    _validar(novo)
    return novo


def _unidades(model: Any) -> Mapping[str, Any]:
    if not isinstance(model, Mapping):
        raise ModelBuilderError("model must be a mapping")
    unidades = model.get("units")
    if not isinstance(unidades, Mapping):
        raise ModelBuilderError("model has no units")
    return unidades


def _copiar(value: Any) -> Any:
    """Deep copy that turns every mapping into a plain, mutable dict."""
    if isinstance(value, Mapping):
        return {chave: _copiar(item) for chave, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_copiar(item) for item in value]
    return value


def _validar(model: Mapping[str, Any]) -> None:
    try:
        validate_energy_model(model)
    except EnergyModelError as error:
        raise ModelBuilderError(str(error)) from error
