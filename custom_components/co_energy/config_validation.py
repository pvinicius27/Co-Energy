"""Validação dos caminhos informados na configuração da integração.

Separado do ``config_flow`` de propósito: a classe do fluxo herda de
``homeassistant.config_entries.ConfigFlow`` e só existe dentro do Home
Assistant, enquanto esta parte é função pura e pode ser testada sozinha — que
é onde mora a regra.

O que se valida aqui é o que o operador digita. A verificação de fundo é
sempre a mesma: **o arquivo carrega?** Não basta existir, porque um YAML
malformado ou um modelo sem as unidades declaradas falharia depois, com a
integração já de pé e a tela vazia.
"""

from __future__ import annotations

from typing import Any

from .const import CONF_FINANCIAL_MODEL_PATH, CONF_MODEL_PATH

#: Motivos de recusa. Viram texto na tela pelas traduções, e são testados por
#: nome: mudar um destes muda o que o operador lê.
ERROR_MODEL_REQUIRED = "model_path_required"
ERROR_MODEL_INVALID = "model_path_invalid"
ERROR_FINANCIAL_INVALID = "financial_model_path_invalid"


#: Sugestão de caminho, não imposição: quem guarda o arquivo em outro lugar
#: edita o campo. Fica na mesma pasta privada das cópias de fatura, e pelo
#: mesmo motivo — ``www`` é servido como ``/local/``, sem login, e uma
#: sugestão apontando para lá ensinaria quem instala a publicar a própria
#: configuração na rede.
SUGGESTED_FINANCIAL_PATH = "/config/co_energy/financial-model.yaml"


class ConfigValidationError(ValueError):
    """Raised when the informed configuration cannot be accepted."""

    def __init__(self, field: str, reason: str) -> None:
        super().__init__(f"{field}: {reason}")
        self.field = field
        self.reason = reason


def clean_path(value: Any) -> str | None:
    """Return the informed path without surrounding blanks, or None.

    Caminho em branco e caminho ausente são a mesma coisa para quem preenche o
    formulário: os dois significam "não informei".
    """
    if not isinstance(value, str):
        return None
    limpo = value.strip()
    return limpo or None


def form_defaults(stored: Any = None, *, suggest: bool = True) -> dict[str, str]:
    """O que cada campo mostra quando o formulário abre.

    Mora aqui, e não no fluxo, porque é regra — e porque assim pode ser
    testada sem o Home Assistant: ``voluptuous`` nem existe fora dele, então
    nada de ``config_flow`` é importável num teste.

    ``suggest`` vale só na instalação. Ao reconfigurar, o campo mostra
    exatamente o que está guardado, inclusive vazio: quem apagou o caminho
    para deixar de depender do arquivo veria a sugestão de volta no campo e
    concluiria que a mudança não pegou — ou salvaria de novo e voltaria a
    depender do arquivo sem perceber.
    """
    guardado = stored if isinstance(stored, dict) else {}
    padrao_financeiro = SUGGESTED_FINANCIAL_PATH if suggest else ""
    return {
        CONF_MODEL_PATH: clean_path(guardado.get(CONF_MODEL_PATH)) or "",
        CONF_FINANCIAL_MODEL_PATH: (
            clean_path(guardado.get(CONF_FINANCIAL_MODEL_PATH))
            or padrao_financeiro
        ),
    }


def validate_user_input(
    user_input: Any,
    *,
    load_model: Any,
    load_financial_model: Any = None,
) -> dict[str, Any]:
    """Validate what the operator typed and return the entry data.

    ``load_model`` e ``load_financial_model`` são os carregadores reais,
    recebidos de fora para que esta função não dependa de disco: o fluxo passa
    os de verdade, o teste passa dublês. Se eles levantam, o caminho é
    recusado — carregar é a única prova de que o arquivo serve.
    """
    if not isinstance(user_input, dict):
        raise ConfigValidationError(CONF_MODEL_PATH, ERROR_MODEL_REQUIRED)

    # Deixar em branco é começar do zero: a integração sobe sem unidade
    # nenhuma e a tela cria a primeira. Exigir o caminho obrigava quem está
    # instalando agora a escrever um modelo a mão antes de conseguir entrar —
    # justamente o que a tela de configuração existe para evitar.
    #
    # O campo continua aqui para quem já tem um arquivo e quer partir dele.
    # Informado, tem de carregar: um caminho errado aceito em silêncio daria
    # uma instalação vazia sem explicar por quê.
    model_path = clean_path(user_input.get(CONF_MODEL_PATH))
    dados: dict[str, Any] = {}
    if model_path is not None:
        try:
            load_model(model_path)
        except Exception as error:  # noqa: BLE001 - qualquer falha recusa o caminho
            raise ConfigValidationError(
                CONF_MODEL_PATH, ERROR_MODEL_INVALID
            ) from error
        dados[CONF_MODEL_PATH] = model_path

    # O modelo financeiro é opcional: sem ele o painel funciona, e só o que
    # depende de dinheiro declarado — payback e tarifa de referência — fica
    # indisponível. Informado, tem de carregar.
    financial_path = clean_path(user_input.get(CONF_FINANCIAL_MODEL_PATH))
    if financial_path is not None:
        if load_financial_model is not None:
            try:
                load_financial_model(financial_path)
            except Exception as error:  # noqa: BLE001
                raise ConfigValidationError(
                    CONF_FINANCIAL_MODEL_PATH, ERROR_FINANCIAL_INVALID
                ) from error
        dados[CONF_FINANCIAL_MODEL_PATH] = financial_path

    return dados
