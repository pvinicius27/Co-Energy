"""As regras da configuração pela página da integração.

Os passos que o Home Assistant mostra — o assistente de instalação e o menu
"Configurar" — moram em ``config_flow``, que só existe dentro dele e não é
importável num teste. Aqui fica tudo o que eles DECIDEM: que campos cada
unidade oferece, o que conta como o mínimo para subir, como uma escolha na
tela vira uma edição do modelo, e que opções o menu tem nesta instalação.

Nada aqui edita modelo por conta própria. Toda mudança passa pelas mesmas
funções de ``model_builder`` que o painel usava — já testadas, e com a
validação no lugar certo. A página da integração é só outro jeito de chamá-las.
"""

from __future__ import annotations

from collections.abc import Mapping
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any

from .capabilities import installation_capabilities
from .model_builder import (
    INSTANT_MEASUREMENTS,
    MEASURABLE_METRICS,
    ROLE_CONSUMER,
    ROLE_GENERATOR,
    add_unit,
    metrics_for_role,
    remove_unit_measurement,
    remove_unit_series,
    rename_unit,
    set_current_source,
    set_unit_measured,
    set_unit_measurement,
    set_unit_role,
    set_unit_series,
    swap_unit_meter,
)

#: Os itens do menu "Configurar", na ordem em que aparecem. Cada um é um
#: passo do fluxo e uma chave de tradução: mudar o nome aqui exige mudar lá.
MENU_ORDER = (
    "unidade_nova",
    "sensores",
    "unidade_editar",
    "rateio",
    "tarifa",
    "investimento",
    "horario",
    "unidade_excluir",
)

#: Motivos de recusa, testados por nome: viram texto pelas traduções.
ERROR_NAME_REQUIRED = "name_required"
ERROR_SENSOR_REQUIRED = "sensor_required"
ERROR_SHARES_TOTAL = "shares_total"
ERROR_SHARE_INVALID = "share_invalid"
ERROR_SECOND_GENERATOR = "second_generator"
ERROR_TIME_INVALID = "time_invalid"
ERROR_COLOR_INVALID = "color_invalid"
ERROR_SWAP_WHEN = "swap_when_invalid"
ERROR_PERIOD_INVALID = "period_invalid"
ERROR_AMOUNT_INVALID = "amount_invalid"
ERROR_TARIFF_INVALID = "tariff_invalid"
ERROR_HISTORY_KEEP = "history_keep"
ERROR_PREVIOUS_INCOMPLETE = "previous_incomplete"
ERROR_PREVIOUS_NEEDS_CURRENT = "previous_needs_current"
ERROR_PREVIOUS_SAME = "previous_same"


def unit_ids(model: Mapping[str, Any]) -> tuple[str, ...]:
    unidades = model.get("units") if isinstance(model, Mapping) else None
    return tuple(unidades) if isinstance(unidades, Mapping) else ()


def unit_choices(model: Mapping[str, Any]) -> list[dict[str, str]]:
    """As unidades como opções de lista: o valor é o id, o rótulo é o nome.

    Rótulo pronto, e não chave de tradução, porque o nome é da pessoa — não
    há tradução para "Apartamento da praia".
    """
    unidades = model.get("units") if isinstance(model, Mapping) else None
    if not isinstance(unidades, Mapping):
        return []
    return [
        {"value": unit_id, "label": str((unidade or {}).get("name") or unit_id)}
        for unit_id, unidade in unidades.items()
    ]


def _unidade(model: Mapping[str, Any], unit_id: str) -> Mapping[str, Any]:
    unidades = model.get("units") if isinstance(model, Mapping) else None
    unidade = unidades.get(unit_id) if isinstance(unidades, Mapping) else None
    return unidade if isinstance(unidade, Mapping) else {}


def _fonte_atual(serie: Any) -> str | None:
    """A entidade que alimenta a série hoje: a última fonte, a vigente."""
    if not isinstance(serie, Mapping):
        return None
    fontes = serie.get("sources")
    if not isinstance(fontes, list) or not fontes:
        return None
    ultima = fontes[-1]
    return ultima.get("entity_id") if isinstance(ultima, Mapping) else None


def energy_metrics_for(role: Any) -> tuple[str, ...]:
    """O que uma unidade com este papel mede em energia acumulada."""
    return tuple(m for m in metrics_for_role(role) if m in MEASURABLE_METRICS)


def sensor_fields(model: Mapping[str, Any], unit_id: str) -> list[dict[str, Any]]:
    """Cada campo que a tela de sensores mostra para esta unidade.

    Energia primeiro — é o que entra em ciclo, fatura e gráfico —, e as
    leituras instantâneas depois. Todo campo mostra o sensor ATUAL. Os
    medidores anteriores de uma grandeza, quando houve troca, vêm em
    ``history``: são o registro de quais sensores ela já teve e até quando.
    A regra não depende de nome de sensor nem de unidade: grandeza com mais
    de uma fonte no tempo tem histórico.
    """
    unidade = _unidade(model, unit_id)
    series = unidade.get("series") if isinstance(unidade.get("series"), Mapping) else {}
    medidas = (
        unidade.get("measurements")
        if isinstance(unidade.get("measurements"), Mapping) else {}
    )
    campos: list[dict[str, Any]] = []
    for metric in energy_metrics_for(unidade.get("role")):
        serie = series.get(metric)
        fontes = serie.get("sources") if isinstance(serie, Mapping) else None
        anteriores = (
            [f for f in fontes[:-1] if isinstance(f, Mapping)]
            if isinstance(fontes, list) else []
        )
        campos.append({
            "metric": metric,
            "kind": "energy",
            "label": MEASURABLE_METRICS[metric]["label"],
            "current": _fonte_atual(serie),
            "history": anteriores,
        })
    for metric, definicao in INSTANT_MEASUREMENTS.items():
        atual = medidas.get(metric)
        campos.append({
            "metric": metric,
            "kind": "instant",
            "label": definicao["label"],
            "current": atual.get("entity_id") if isinstance(atual, Mapping) else None,
            "history": [],
        })
    return campos


def _quando(valor: Any) -> str:
    """``2026-01-15T08:00:00-03:00`` como ``15/01/2026 08:00``."""
    try:
        instante = datetime.fromisoformat(str(valor))
    except ValueError:
        return str(valor)
    return instante.strftime("%d/%m/%Y %H:%M")


def history_lines(model: Mapping[str, Any], unit_id: str) -> list[str]:
    """Uma linha por medidor antigo: grandeza, sensor e até quando."""
    return [
        f"{campo['label']}: {fonte.get('entity_id')} até {_quando(fonte.get('until'))}"
        for campo in sensor_fields(model, unit_id)
        for fonte in campo["history"]
    ]


def markdown_list(lines: list[str], empty: str) -> str:
    """Linhas como lista: o texto de ajuda do Home Assistant é Markdown, e
    em lista cada item ganha a própria linha em vez de virar um parágrafo."""
    if not lines:
        return empty
    return "\n" + "\n".join(f"- {linha}" for linha in lines)


def _entidade(valor: Any) -> str | None:
    if not isinstance(valor, str):
        return None
    limpo = valor.strip()
    return limpo or None


def apply_sensor_choices(
    model: Mapping[str, Any],
    unit_id: str,
    choices: Mapping[str, Any],
) -> dict[str, Any]:
    """O modelo com os sensores escolhidos: aponta, corrige ou tira.

    Campo AUSENTE é o mesmo que vazio, e tira o sensor — é o que o frontend
    do Home Assistant manda quando alguém limpa um seletor.

    Mudar o sensor de uma grandeza que já tinha um é CORREÇÃO: só o sensor
    atual muda, e as trocas registradas continuam como estavam. Registrar o
    medidor que vinha antes, com a data da troca, é ``add_previous_meter``.

    Grandeza com histórico não pode ficar sem sensor: apagá-la descartaria o
    registro dos medidores antigos.
    """
    atual = dict(model)
    for campo in sensor_fields(model, unit_id):
        desejado = _entidade(choices.get(campo["metric"]))
        if desejado == campo["current"]:
            continue
        metrica = campo["metric"]
        if campo["kind"] == "instant":
            atual = (
                remove_unit_measurement(atual, unit_id, metrica) if desejado is None
                else set_unit_measurement(atual, unit_id, metrica, desejado)
            )
            continue
        if desejado is None:
            if campo["history"]:
                raise ValueError(ERROR_HISTORY_KEEP)
            atual = remove_unit_series(atual, unit_id, metrica)
        elif campo["current"] is None:
            atual = set_unit_series(atual, unit_id, metrica, desejado)
        elif campo["history"]:
            atual = set_current_source(atual, unit_id, metrica, desejado)
        else:
            atual = set_unit_series(atual, unit_id, metrica, desejado)
    return atual


def add_previous_meter(
    model: Mapping[str, Any],
    unit_id: str,
    metric: str,
    previous_entity: Any,
    until: datetime,
) -> dict[str, Any]:
    """Registra o medidor que a grandeza usava ANTES do sensor atual.

    O trecho de tempo do sensor atual é partido na data informada: antes
    dela, vale o medidor anterior; a partir dela, o atual. Serve aos dois
    casos, com a mesma pergunta — "qual era o medidor e até quando":

    * quem instala já com o medidor novo e quer o histórico do antigo;
    * quem acabou de trocar: aponta o sensor novo no campo e informa aqui o
      antigo e a data.

    Trocas registradas antes continuam como estavam: só o trecho do sensor
    atual é partido. O corte cai na hora cheia e a primeira leitura do
    sensor atual depois dele é descartada — regras de ``swap_unit_meter``.
    """
    anterior = _entidade(previous_entity)
    if anterior is None or not isinstance(until, datetime):
        raise ValueError(ERROR_PREVIOUS_INCOMPLETE)
    series = _unidade(model, unit_id).get("series")
    atual = _fonte_atual(series.get(metric)) if isinstance(series, Mapping) else None
    if atual is None:
        raise ValueError(ERROR_PREVIOUS_NEEDS_CURRENT)
    if anterior == atual:
        raise ValueError(ERROR_PREVIOUS_SAME)
    parcial = set_current_source(model, unit_id, metric, anterior)
    return swap_unit_meter(parcial, unit_id, metric, atual, until)


def current_tariff(tariffs: Mapping[date, Any] | None) -> tuple[date, Any] | None:
    """A tarifa mais recente informada, para a tela abrir com ela."""
    if not tariffs:
        return None
    vigencia = max(tariffs)
    return vigencia, tariffs[vigencia]


def has_energy_choice(model: Mapping[str, Any], unit_id: str, choices: Mapping[str, Any]) -> bool:
    """Ao menos uma grandeza de energia apontada."""
    return any(
        campo["kind"] == "energy" and _entidade(choices.get(campo["metric"]))
        for campo in sensor_fields(model, unit_id)
    )


def has_any_choice(model: Mapping[str, Any], unit_id: str, choices: Mapping[str, Any]) -> bool:
    """Ao menos um sensor apontado — o mínimo para uma unidade com medidor."""
    return any(
        _entidade(choices.get(campo["metric"]))
        for campo in sensor_fields(model, unit_id)
    )


def create_unit(
    model: Mapping[str, Any], name: Any, *, generates: bool, measured: bool
) -> tuple[str, dict[str, Any]]:
    """Cria a unidade com o papel e a medição escolhidos.

    ``measured`` falso é a unidade acompanhada só pela fatura — uma chácara
    sem medidor no Home Assistant. Ela existe, entra no rateio e na auditoria
    oficial, e não pede sensor nenhum.
    """
    nome = name.strip() if isinstance(name, str) else ""
    if not nome:
        raise ValueError(ERROR_NAME_REQUIRED)
    if generates and other_generator(model):
        raise ValueError(ERROR_SECOND_GENERATOR)
    unit_id, novo = add_unit(
        model, nome, role=ROLE_GENERATOR if generates else ROLE_CONSUMER
    )
    if not measured:
        novo = set_unit_measured(novo, unit_id, False)
    return unit_id, novo


def edit_unit(
    model: Mapping[str, Any], unit_id: str, *, name: Any, generates: bool, measured: bool
) -> dict[str, Any]:
    """Nome, papel e medição, cada um só se mudou.

    O papel é reaplicado sempre: ele só GUARDA as grandezas que não mede —
    nunca apaga —, e voltar o papel as devolve com o histórico.
    """
    unidade = _unidade(model, unit_id)
    atual = dict(model)
    nome = name.strip() if isinstance(name, str) else ""
    if not nome:
        raise ValueError(ERROR_NAME_REQUIRED)
    if nome != unidade.get("name"):
        atual = rename_unit(atual, unit_id, nome)
    papel = ROLE_GENERATOR if generates else ROLE_CONSUMER
    if generates and other_generator(model, unit_id):
        raise ValueError(ERROR_SECOND_GENERATOR)
    # Sempre, mesmo sem mudança: reaplicar o papel acomoda as grandezas a
    # ele, e é assim que uma unidade que ficou com as séries do papel antigo
    # se corrige ao ser salva.
    atual = set_unit_role(atual, unit_id, papel)
    if bool(measured) != (unidade.get("measured") is not False):
        atual = set_unit_measured(atual, unit_id, bool(measured))
    return atual


def menu_options(
    model: Mapping[str, Any], *, has_billing: bool = False, has_investment: bool = False
) -> list[str]:
    """O que o menu "Configurar" oferece NESTA instalação.

    A mesma distinção das abas: o que não existe não aparece. Rateio numa
    casa sozinha e investimento solar numa casa sem placa não estão
    indisponíveis — não fazem sentido, e oferecê-los confunde.
    """
    podem = installation_capabilities(
        model, has_billing=has_billing, has_investment=has_investment
    )
    tem_unidade = podem["units"]
    disponivel = {
        "unidade_nova": True,
        "unidade_editar": tem_unidade,
        "sensores": tem_unidade,
        "rateio": podem["distribution"],
        "tarifa": True,
        "investimento": podem["generation"],
        "horario": True,
        "unidade_excluir": tem_unidade,
    }
    return [item for item in MENU_ORDER if disponivel[item]]


def share_field_names(model: Mapping[str, Any]) -> dict[str, str]:
    """O nome de cada campo de percentual, e de qual unidade ele é.

    A chave do campo é o NOME da unidade porque é ela que o Home Assistant
    mostra como rótulo quando não há tradução — e não há tradução possível
    para o nome que a pessoa deu. Nome repetido ganha o id entre parênteses,
    para dois campos nunca disputarem a mesma chave.
    """
    nomes: dict[str, int] = {}
    for opcao in unit_choices(model):
        nomes[opcao["label"]] = nomes.get(opcao["label"], 0) + 1
    campos: dict[str, str] = {}
    for opcao in unit_choices(model):
        chave = opcao["label"]
        if nomes[chave] > 1:
            chave = f"{chave} ({opcao['value']})"
        campos[chave] = opcao["value"]
    return campos


def other_generator(model: Mapping[str, Any], unit_id: str | None = None) -> str | None:
    """O nome de quem já gera, fora ``unit_id``; None se ninguém.

    Só uma unidade gera: autoconsumo, fluxo e payback são escritos para uma.
    Conferido ANTES de gravar para a recusa dizer quem é a outra, em vez do
    erro técnico que o modelo levantaria.
    """
    unidades = model.get("units") if isinstance(model, Mapping) else None
    if not isinstance(unidades, Mapping):
        return None
    for outro, unidade in unidades.items():
        if outro != unit_id and isinstance(unidade, Mapping) and (
            unidade.get("role") == ROLE_GENERATOR
        ):
            return str(unidade.get("name") or outro)
    return None


def boundary_from_selector(value: Any) -> str:
    """``HH:MM`` a partir do que o seletor de hora devolve (``HH:MM:SS``)."""
    if not isinstance(value, str):
        raise ValueError(ERROR_TIME_INVALID)
    partes = value.strip().split(":")
    if len(partes) < 2 or not all(p.isdigit() for p in partes[:2]):
        raise ValueError(ERROR_TIME_INVALID)
    hora, minuto = int(partes[0]), int(partes[1])
    if not (0 <= hora <= 23 and 0 <= minuto <= 59):
        raise ValueError(ERROR_TIME_INVALID)
    return f"{hora:02d}:{minuto:02d}"


def color_hex(value: Any) -> str | None:
    """``#rrggbb`` a partir do seletor de cor, que devolve ``[r, g, b]``."""
    if value in (None, "", []):
        return None
    if (
        not isinstance(value, (list, tuple)) or len(value) != 3
        or not all(isinstance(c, int) and not isinstance(c, bool) and 0 <= c <= 255
                   for c in value)
    ):
        raise ValueError(ERROR_COLOR_INVALID)
    return "#{:02x}{:02x}{:02x}".format(*value)


#: A paleta da tela, na mesma ordem: a cor padrão de uma unidade é a da
#: posição dela no modelo. Precisa ser igual à ``UNIT_PALETTE`` do frontend —
#: um teste confere —, senão o formulário mostraria uma cor e os gráficos
#: outra.
UNIT_PALETTE = (
    "#ec407a", "#5f68c7", "#9ccc65", "#a1887f",
    "#f48fb1", "#3842ab", "#689f38", "#90a4ae",
)


def default_color(model: Mapping[str, Any], unit_id: str) -> str:
    """A cor que a tela usa quando ninguém escolheu uma."""
    ids = unit_ids(model)
    indice = ids.index(unit_id) if unit_id in ids else 0
    return UNIT_PALETTE[indice % len(UNIT_PALETTE)]


def unit_color(model: Mapping[str, Any], unit_id: str) -> str:
    """A cor que a unidade tem na tela: a escolhida, ou a padrão."""
    apresentacao = _unidade(model, unit_id).get("presentation")
    escolhida = apresentacao.get("color") if isinstance(apresentacao, Mapping) else None
    return escolhida if isinstance(escolhida, str) and escolhida else default_color(model, unit_id)


def color_to_store(model: Mapping[str, Any], unit_id: str, color: str | None) -> str | None:
    """O que gravar: nada quando a cor é a padrão.

    O formulário abre mostrando a cor padrão. Enviar sem mexer não pode
    transformá-la numa escolha gravada — senão a unidade deixaria de seguir a
    paleta da tela, e um preto vazio do seletor viraria cor de gráfico.
    """
    if color is None or color.lower() == default_color(model, unit_id):
        return None
    return color.lower()


def color_rgb(value: Any) -> list[int] | None:
    """O inverso de ``color_hex``, para o seletor abrir com a cor atual."""
    if not isinstance(value, str) or len(value) != 7 or not value.startswith("#"):
        return None
    try:
        return [int(value[i:i + 2], 16) for i in (1, 3, 5)]
    except ValueError:
        return None


def swap_instant(value: Any, tz: Any) -> datetime:
    """O instante da troca, com fuso: o seletor devolve data e hora sem fuso.

    O fuso é o do Home Assistant — é o relógio de quem estava na frente do
    quadro quando o medidor foi trocado.
    """
    if not isinstance(value, str) or not value.strip():
        raise ValueError(ERROR_SWAP_WHEN)
    try:
        instante = datetime.fromisoformat(value.strip())
    except ValueError as error:
        raise ValueError(ERROR_SWAP_WHEN) from error
    if instante.tzinfo is None:
        instante = instante.replace(tzinfo=tz)
    return instante


def investment_period(value: Any) -> str:
    """``YYYY-MM`` a partir de uma data: o investimento é situado por mês."""
    if not isinstance(value, str):
        raise ValueError(ERROR_PERIOD_INVALID)
    try:
        dia = date.fromisoformat(value.strip()[:10])
    except ValueError as error:
        raise ValueError(ERROR_PERIOD_INVALID) from error
    return f"{dia.year:04d}-{dia.month:02d}"


def decimal_text(value: Any, error: str) -> str:
    """Um número digitado como texto de Decimal, positivo, ou ``error``.

    Aceita vírgula: é como se escreve dinheiro no Brasil, e recusar
    "0,65" por causa do separador seria recusar o jeito certo de escrever.
    """
    if isinstance(value, bool):
        raise ValueError(error)
    texto = str(value).strip().replace(",", ".") if value is not None else ""
    try:
        numero = Decimal(texto)
    except (InvalidOperation, ValueError) as err:
        raise ValueError(error) from err
    if not numero.is_finite() or numero <= 0:
        raise ValueError(error)
    return format(numero.normalize(), "f")


def distribution_history(model: Mapping[str, Any], rules: Any) -> list[str]:
    """O rateio no tempo, do mais recente ao mais antigo, em uma linha cada.

    É o que torna a tela intuitiva: quem muda o rateio vê que o anterior
    continua valendo para o período dele, e que o novo vale a partir da data.
    """
    nomes = {o["value"]: o["label"] for o in unit_choices(model)}
    linhas = []
    # A regra sem início ("desde sempre") é a mais antiga.
    for regra in sorted(
        rules,
        key=lambda r: r.effective_from.timestamp() if r.effective_from else float("-inf"),
        reverse=True,
    ):
        if regra.effective_from and regra.effective_until:
            quando = (
                f"De {regra.effective_from.strftime('%d/%m/%Y %H:%M')} "
                f"até {regra.effective_until.strftime('%d/%m/%Y %H:%M')}"
            )
        elif regra.effective_from:
            quando = f"Desde {regra.effective_from.strftime('%d/%m/%Y %H:%M')}"
        elif regra.effective_until:
            quando = f"Até {regra.effective_until.strftime('%d/%m/%Y %H:%M')}"
        else:
            quando = "Sempre"
        partes = " · ".join(
            f"{nomes.get(unit_id, unit_id)} {format(Decimal(valor).normalize(), 'f')}%"
            for unit_id, valor in regra.shares.items()
        )
        linhas.append(f"**{quando}:** {partes}")
    return linhas


def tariff_history(tariffs: Mapping[date, Any]) -> str:
    """As tarifas informadas, cada uma com a data em que passou a valer."""
    return " | ".join(
        f"desde {vigencia.strftime('%d/%m/%Y')}: R$ {format(Decimal(valor).normalize(), 'f')}/kWh"
        for vigencia, valor in sorted(tariffs.items(), reverse=True)
    )


def shares_from_form(
    model: Mapping[str, Any], values: Mapping[str, Any]
) -> dict[str, str]:
    """Os percentuais digitados, por unidade, somando exatamente 100.

    Levanta ``ValueError`` com a chave de erro. A soma é conferida em Decimal:
    em float, 33,33 + 33,33 + 33,34 não dá 100 e a pessoa não entenderia por
    que o formulário recusa uma conta que fecha.
    """
    campos = share_field_names(model)
    partes: dict[str, str] = {}
    total = Decimal("0")
    for chave, unit_id in campos.items():
        bruto = values.get(chave, 0)
        try:
            valor = Decimal(str(bruto if bruto not in (None, "") else 0))
        except (InvalidOperation, ValueError) as error:
            raise ValueError(ERROR_SHARE_INVALID) from error
        if not valor.is_finite() or valor < 0 or valor > 100:
            raise ValueError(ERROR_SHARE_INVALID)
        valor = valor.quantize(Decimal("0.01"))
        total += valor
        partes[unit_id] = format(valor.normalize(), "f")
    if total != Decimal("100"):
        raise ValueError(ERROR_SHARES_TOTAL)
    return partes
