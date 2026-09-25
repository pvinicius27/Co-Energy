"""Configuração da integração pela página dela no Home Assistant.

Dois caminhos, e nenhum exige YAML nem arquivo:

* **Adicionar integração** abre um assistente que só termina com o mínimo
  para a tela ter o que mostrar: uma unidade com nome, e — se ela tem
  medidor — ao menos um sensor. Dá para cadastrar outras em seguida.
* **Configurar**, na página da integração, abre um menu com tudo o que muda
  depois: unidades, sensores (com troca de medidor), rateio, tarifa,
  investimento, horário de corte e exclusão. O menu só oferece o que existe
  nesta instalação: rateio numa casa sozinha não aparece.

O que cada passo DECIDE mora em ``config_steps``, que é função pura e tem
teste. Aqui só se monta o formulário, se chama a decisão e se grava pelo
mesmo caminho que o painel usava.

Quem já configurou pelo YAML não precisa fazer nada: ``async_setup`` importa a
configuração existente e cria a entrada sozinho. E quem tem modelos em arquivo
aponta para eles em "Reconfigurar".
"""

from __future__ import annotations

from collections.abc import Mapping
from datetime import date
from decimal import Decimal
import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult, section
from homeassistant.helpers import selector
from homeassistant.util import dt as dt_util

from . import config_steps as passos
from .config_validation import (
    ConfigValidationError,
    form_defaults,
    validate_user_input,
)
from .const import CONF_FINANCIAL_MODEL_PATH, CONF_MODEL_PATH, DOMAIN
from .distribution import DistributionError
from .distribution_storage import share_blocking_removal
from .energy_model import load_energy_model
from .financial_model import load_financial_model
from .model_builder import (
    ROLE_GENERATOR,
    ModelBuilderError,
    build_model,
    remove_unit,
    set_unit_color,
    set_unit_image,
)
from .model_storage import ModelStorageError, async_build_model_manager
from .operational_settings import OperationalSettingsError

_LOGGER = logging.getLogger(__name__)

TITLE = "Gestão de Energia"

F_NOME = "nome"
F_GERA = "gera"
F_MEDIDA = "tem_medidor"
F_UNIDADE = "unidade"
F_COR = "cor"
F_FOTO = "foto"
F_SEM_FOTO = "remover_foto"
F_A_PARTIR = "a_partir_de"
F_VIGENCIA = "vigencia"
F_VALOR = "valor"
F_MES = "mes"
F_LIMPAR = "limpar"
F_HORA = "horario"
F_CONFIRMA = "confirmar"
F_ANTERIOR = "medidor_anterior"
F_ANT_GRANDEZA = "grandeza"
F_ANT_SENSOR = "sensor_anterior"
F_ANT_ATE = "usado_ate"

_SENSOR = selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor"))


def _paths_schema(defaults: dict[str, Any] | None = None) -> vol.Schema:
    """Os caminhos de arquivo, para quem parte de modelos já escritos.

    `suggested_value`, e NUNCA `default`. Ao apagar um campo de texto, o
    frontend do Home Assistant omite a chave em vez de mandar string vazia,
    e `default` faria o voluptuous repor o valor anterior: apagar o caminho
    não apagaria nada, e a tela ainda diria que atualizou.
    """
    mostrar = form_defaults(defaults)
    return vol.Schema({
        vol.Optional(
            CONF_MODEL_PATH,
            description={"suggested_value": mostrar[CONF_MODEL_PATH]},
        ): str,
        vol.Optional(
            CONF_FINANCIAL_MODEL_PATH,
            description={"suggested_value": mostrar[CONF_FINANCIAL_MODEL_PATH]},
        ): str,
    })


def _unit_schema(
    name: str | None = None, generates: bool = False, measured: bool = True
) -> vol.Schema:
    return vol.Schema({
        vol.Required(F_NOME, description={"suggested_value": name}): selector.TextSelector(),
        vol.Required(F_GERA, default=generates): selector.BooleanSelector(),
        vol.Required(F_MEDIDA, default=measured): selector.BooleanSelector(),
    })


def _sensor_schema(model: Mapping[str, Any], unit_id: str) -> vol.Schema:
    """Um seletor por grandeza, com o sensor atual já escolhido.

    Toda grandeza aparece, inclusive a que já teve troca de medidor: o campo
    é sempre o sensor atual, e os antigos ficam no histórico.
    """
    campos: dict[Any, Any] = {}
    for campo in passos.sensor_fields(model, unit_id):
        campos[vol.Optional(
            campo["metric"], description={"suggested_value": campo["current"]}
        )] = _SENSOR
    return vol.Schema(campos)


def _unit_select(model: Mapping[str, Any]) -> vol.Schema:
    return vol.Schema({
        vol.Required(F_UNIDADE): selector.SelectSelector(
            selector.SelectSelectorConfig(options=passos.unit_choices(model))
        ),
    })


def _role_hint(generates: bool) -> str:
    """O que o passo de sensores pede, dito conforme o papel da unidade."""
    if generates:
        return (
            "Esta unidade gera energia. Aponte os sensores de Geração, "
            "Exportação para a rede e Importação da rede — o autoconsumo e o "
            "consumo físico saem da conta."
        )
    return "Aponte o sensor de Consumo (kWh) desta unidade."


class CoEnergyConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """O assistente de instalação."""

    VERSION = 1

    def __init__(self) -> None:
        self._model: dict[str, Any] | None = None
        self._unit_id: str | None = None

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        return CoEnergyOptionsFlow()

    async def _async_validate(self, user_input: dict[str, Any]) -> dict[str, Any]:
        """Validate the informed paths without blocking the event loop."""
        return await self.hass.async_add_executor_job(
            lambda: validate_user_input(
                user_input,
                load_model=load_energy_model,
                load_financial_model=load_financial_model,
            )
        )

    async def _async_start_model(self) -> dict[str, Any]:
        """O modelo de onde o assistente parte.

        O que já estiver guardado vence: uma instalação que sobreviveu a uma
        remoção interrompida não pode ser zerada por um assistente que não
        sabia dela.
        """
        if self._model is None:
            manager = await async_build_model_manager(self.hass)
            guardado = manager.model
            self._model = (
                dict(guardado) if guardado is not None
                else build_model(timezone=str(self.hass.config.time_zone))
            )
        return self._model

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """A primeira unidade: nome, se gera, se tem medidor."""
        # Uma instalação, uma entrada: dois runtimes disputariam o mesmo
        # hass.data e os mesmos comandos WebSocket.
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        modelo = await self._async_start_model()
        if user_input is None and passos.unit_ids(modelo):
            return await self.async_step_mais()
        return await self._async_unit_form("user", user_input)

    async def async_step_unidade_outra(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        return await self._async_unit_form("unidade_outra", user_input)

    async def _async_unit_form(
        self, step_id: str, user_input: dict[str, Any] | None
    ) -> FlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                self._unit_id, self._model = passos.create_unit(
                    self._model or {}, user_input.get(F_NOME),
                    generates=bool(user_input.get(F_GERA)),
                    measured=bool(user_input.get(F_MEDIDA, True)),
                )
            except ValueError as error:
                errors["base"] = _error_key(error)
            else:
                if user_input.get(F_MEDIDA, True):
                    return await self.async_step_sensores_iniciais()
                return await self.async_step_mais()
        entrada = user_input or {}
        return self.async_show_form(
            step_id=step_id,
            # Nunca é a última tela: depois vêm os sensores ou o menu com
            # "Concluir". O botão diz "Próximo" em vez de "Enviar".
            last_step=False,
            data_schema=_unit_schema(
                entrada.get(F_NOME), bool(entrada.get(F_GERA)),
                bool(entrada.get(F_MEDIDA, True)),
            ),
            errors=errors,
        )

    async def async_step_sensores_iniciais(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Os sensores da unidade recém-criada: sem ao menos um, não sobe."""
        assert self._model is not None and self._unit_id is not None
        errors: dict[str, str] = {}
        if user_input is not None:
            if not passos.has_any_choice(self._model, self._unit_id, user_input):
                errors["base"] = passos.ERROR_SENSOR_REQUIRED
            else:
                try:
                    self._model = passos.apply_sensor_choices(
                        self._model, self._unit_id, user_input
                    )
                except ModelBuilderError:
                    errors["base"] = "sensor_refused"
                else:
                    return await self.async_step_mais()
        unidade = self._model["units"][self._unit_id]
        return self.async_show_form(
            step_id="sensores_iniciais",
            last_step=False,
            data_schema=_sensor_schema(self._model, self._unit_id),
            errors=errors,
            description_placeholders={
                "unidade": str(unidade.get("name")),
                "dica": _role_hint(unidade.get("role") == ROLE_GENERATOR),
            },
        )

    async def async_step_mais(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        nomes = ", ".join(o["label"] for o in passos.unit_choices(self._model or {}))
        return self.async_show_menu(
            step_id="mais",
            menu_options=["concluir", "unidade_outra"],
            description_placeholders={"unidades": nomes},
        )

    async def async_step_concluir(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Grava o modelo e cria a entrada — só agora, com o mínimo pronto."""
        assert self._model is not None
        manager = await async_build_model_manager(self.hass)
        await manager.async_save(self._model, now=dt_util.now())
        return self.async_create_entry(title=TITLE, data={})

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Apontar, mudar ou apagar os caminhos de modelos em arquivo.

        O que se grava é só o que foi informado, e nada mais: campo apagado
        some da entrada, em vez de ficar com o valor anterior. É assim que
        deixar de usar um arquivo se torna possível pela tela.
        """
        entrada = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                data = await self._async_validate(user_input)
            except ConfigValidationError as error:
                errors[error.field] = error.reason
            else:
                return self.async_update_reload_and_abort(entrada, data=data)

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_paths_schema(user_input or dict(entrada.data)),
            errors=errors,
        )

    async def async_step_import(self, import_data: dict[str, Any]) -> FlowResult:
        """Adopt an existing configuration.yaml setup."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        try:
            data = await self._async_validate(dict(import_data))
        except ConfigValidationError:
            # Um YAML que não carrega já falhava antes; abortar aqui evita
            # criar uma entrada que nunca subiria.
            return self.async_abort(reason="invalid_configuration")
        return self.async_create_entry(title=TITLE, data=data)


def _error_key(error: Exception) -> str:
    """A chave de tradução de uma recusa de ``config_steps``."""
    chave = str(error.args[0]) if error.args else ""
    return chave if chave in _KNOWN_ERRORS else "unknown"


_KNOWN_ERRORS = {
    passos.ERROR_NAME_REQUIRED, passos.ERROR_SENSOR_REQUIRED,
    passos.ERROR_SHARES_TOTAL, passos.ERROR_SHARE_INVALID,
    passos.ERROR_SECOND_GENERATOR, passos.ERROR_TIME_INVALID,
    passos.ERROR_COLOR_INVALID, passos.ERROR_SWAP_WHEN,
    passos.ERROR_PERIOD_INVALID, passos.ERROR_AMOUNT_INVALID,
    passos.ERROR_TARIFF_INVALID, passos.ERROR_TARIFF_DATE_REQUIRED,
    passos.ERROR_HISTORY_KEEP,
    passos.ERROR_PREVIOUS_INCOMPLETE, passos.ERROR_PREVIOUS_NEEDS_CURRENT,
    passos.ERROR_PREVIOUS_SAME,
}



def _read_upload(hass: Any, file_id: str) -> tuple[str, bytes]:
    """Lê a foto enviada. Roda no executor: é leitura de disco."""
    from homeassistant.components.file_upload import process_uploaded_file

    with process_uploaded_file(hass, file_id) as caminho:
        return caminho.name, caminho.read_bytes()


class CoEnergyOptionsFlow(config_entries.OptionsFlow):
    """O menu "Configurar" da integração."""

    def __init__(self) -> None:
        self._unit_id: str | None = None
        self._pending: dict[str, Any] | None = None

    # -- acesso ao que está rodando ------------------------------------

    def _runtime(self) -> Any:
        return self.hass.data.get(DOMAIN)

    def _model(self) -> dict[str, Any]:
        if self._pending is not None:
            return self._pending
        runtime = self._runtime()
        return dict(runtime.declared_model or runtime.model)

    def _finish(self, *, reload: bool = True) -> FlowResult:
        """Fecha o passo; recarregar faz o painel ver o que mudou.

        As opções da entrada não mudam — o que muda mora no storage —, e por
        isso o recarregamento é pedido aqui, e não deixado para o ouvinte de
        atualização, que só dispara quando as opções mudam.
        """
        if reload:
            self.hass.config_entries.async_schedule_reload(self.config_entry.entry_id)
        return self.async_create_entry(data=dict(self.config_entry.options))

    async def _async_save_model(self, novo: Mapping[str, Any]) -> FlowResult:
        try:
            await self._runtime().model_manager.async_save(
                dict(novo), now=dt_util.now()
            )
        except ModelStorageError:
            _LOGGER.error("Could not persist the energy model", exc_info=True)
            return self.async_abort(reason="save_failed")
        self._pending = None
        return self._finish()

    # -- menu ----------------------------------------------------------

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        runtime = self._runtime()
        if runtime is None or getattr(runtime, "model_manager", None) is None:
            return self.async_abort(reason="runtime_unavailable")
        manager = runtime.invoice_manager
        ajustes = (
            runtime.settings_manager.settings
            if runtime.settings_manager is not None else None
        )
        opcoes = passos.menu_options(
            self._model(),
            has_billing=bool(
                (manager is not None and manager.stored.faturas)
                or runtime.billing_json_path
            ),
            has_investment=bool(ajustes is not None and ajustes.solar_investment),
        )
        return self.async_show_menu(step_id="init", menu_options=opcoes)

    # -- unidades ------------------------------------------------------

    async def async_step_unidade_nova(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                self._unit_id, novo = passos.create_unit(
                    self._model(), user_input.get(F_NOME),
                    generates=bool(user_input.get(F_GERA)),
                    measured=bool(user_input.get(F_MEDIDA, True)),
                )
            except ValueError as error:
                errors["base"] = _error_key(error)
            else:
                if user_input.get(F_MEDIDA, True):
                    self._pending = novo
                    return await self.async_step_sensores_unidade()
                return await self._async_save_model(novo)
        entrada = user_input or {}
        return self.async_show_form(
            step_id="unidade_nova",
            last_step=False,
            data_schema=_unit_schema(
                entrada.get(F_NOME), bool(entrada.get(F_GERA)),
                bool(entrada.get(F_MEDIDA, True)),
            ),
            errors=errors,
        )

    async def async_step_unidade_editar(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        if user_input is not None:
            self._unit_id = user_input[F_UNIDADE]
            return await self.async_step_unidade_dados()
        return self.async_show_form(
            step_id="unidade_editar", data_schema=_unit_select(self._model()),
            last_step=False,
        )

    async def async_step_unidade_dados(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        modelo = self._model()
        unit_id = self._unit_id or ""
        unidade = modelo["units"][unit_id]
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                novo = passos.edit_unit(
                    modelo, unit_id, name=user_input.get(F_NOME),
                    generates=bool(user_input.get(F_GERA)),
                    measured=bool(user_input.get(F_MEDIDA, True)),
                )
                cor = passos.color_to_store(
                    modelo, unit_id, passos.color_hex(user_input.get(F_COR))
                )
                apresentacao = unidade.get("presentation") or {}
                if cor != apresentacao.get("color"):
                    novo = set_unit_color(novo, unit_id, cor)
                if user_input.get(F_SEM_FOTO):
                    novo = set_unit_image(novo, unit_id, None)
                elif user_input.get(F_FOTO):
                    novo = await self._async_store_picture(
                        novo, unit_id, user_input[F_FOTO]
                    )
            except ValueError as error:
                errors["base"] = (
                    "image_invalid" if str(error) == "image_invalid"
                    else _error_key(error)
                )
            else:
                # Editar e apontar sensores eram dois itens do menu. Quem
                # desmarcava "tem medidor" e ia a "Adicionar sensor" era
                # mandado de volta a "Editar". Agora e uma sequencia so, na
                # mesma ordem de "Adicionar unidade": dados, depois sensores.
                if user_input.get(F_MEDIDA, True):
                    self._pending = novo
                    return await self.async_step_sensores_unidade()
                return await self._async_save_model(novo)
        apresentacao = unidade.get("presentation") or {}
        return self.async_show_form(
            step_id="unidade_dados",
            # Com medidor, a tela seguinte e a dos sensores.
            last_step=unidade.get("measured") is False,
            data_schema=vol.Schema({
                **_unit_schema(
                    unidade.get("name"), unidade.get("role") == ROLE_GENERATOR,
                    unidade.get("measured") is not False,
                ).schema,
                vol.Optional(
                    F_COR,
                    description={
                        "suggested_value": passos.color_rgb(
                            passos.unit_color(modelo, unit_id)
                        )
                    },
                ): selector.ColorRGBSelector(),
                vol.Optional(F_FOTO): selector.FileSelector(
                    selector.FileSelectorConfig(accept="image/*")
                ),
                vol.Optional(F_SEM_FOTO, default=False): selector.BooleanSelector(),
            }),
            errors=errors,
            description_placeholders={
                "unidade": str(unidade.get("name")),
                # Texto curto, e sem a imagem: o seletor de arquivo desenha o
                # texto de ajuda DENTRO da área de soltar arquivo, e uma foto
                # ali desmontava o formulário. A recomendação de tamanho só
                # aparece para quem ainda vai escolher a primeira foto.
                # A foto vai DENTRO da área de soltar arquivo, com altura
                # fixa: em tamanho natural ela estourava a área e desmontava
                # o formulário. O texto de ajuda aceita <img> com altura.
                "foto_info": (
                    # Altura maior que a da legenda: a foto passa a ditar a
                    # largura do bloco, que o Home Assistant centraliza.
                    f'<img src="{apresentacao["image"]}" height="160" '
                    'alt="Foto atual"><br>'
                    f"Atual: {apresentacao['image'].rsplit('/', 1)[-1]} · "
                    "enviar outra substitui"
                    if apresentacao.get("image") else
                    "Recomendado: foto horizontal 21:9 (ex.: 840 × 360 px), com "
                    "o principal no centro. JPG, PNG ou WebP até 12 MB."
                ),
            },
        )

    async def _async_store_picture(
        self, model: dict[str, Any], unit_id: str, file_id: str
    ) -> dict[str, Any]:
        from .unit_images import UnitImageError, save_image

        try:
            nome, dados = await self.hass.async_add_executor_job(
                _read_upload, self.hass, file_id
            )
            info = await self.hass.async_add_executor_job(
                save_image, self.hass, unit_id, nome, dados
            )
        except (UnitImageError, ValueError, OSError) as error:
            raise ValueError("image_invalid") from error
        return set_unit_image(model, unit_id, info["url"])

    async def async_step_unidade_excluir(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        modelo = self._model()
        errors: dict[str, str] = {}
        placeholders = {"percentual": ""}
        if user_input is not None:
            unit_id = user_input[F_UNIDADE]
            if not user_input.get(F_CONFIRMA):
                errors["base"] = "confirm_required"
            else:
                bloqueio = self._share_of(unit_id)
                if bloqueio is not None:
                    errors["base"] = "unit_has_share"
                    placeholders["percentual"] = format(bloqueio.normalize(), "f")
                else:
                    return await self._async_save_model(remove_unit(modelo, unit_id))
        return self.async_show_form(
            step_id="unidade_excluir",
            data_schema=vol.Schema({
                **_unit_select(modelo).schema,
                vol.Required(F_CONFIRMA, default=False): selector.BooleanSelector(),
            }),
            errors=errors,
            description_placeholders=placeholders,
        )

    def _share_of(self, unit_id: str) -> Any:
        manager = self._runtime().distribution_manager
        if manager is None or not manager.available:
            return None
        return share_blocking_removal(
            manager.data, unit_id, passos.unit_ids(self._model())
        )

    # -- sensores ------------------------------------------------------

    async def async_step_sensores_unidade(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        modelo = self._model()
        unit_id = self._unit_id or ""
        unidade = modelo["units"][unit_id]
        errors: dict[str, str] = {}
        if user_input is not None:
            medida = unidade.get("measured") is not False
            anterior = user_input.get(F_ANTERIOR) or {}
            campos_anterior = (F_ANT_GRANDEZA, F_ANT_SENSOR, F_ANT_ATE)
            try:
                if medida and not passos.has_any_choice(modelo, unit_id, user_input):
                    raise ValueError(passos.ERROR_SENSOR_REQUIRED)
                novo = passos.apply_sensor_choices(modelo, unit_id, user_input)
                if any(anterior.get(k) for k in campos_anterior):
                    if not all(anterior.get(k) for k in campos_anterior):
                        raise ValueError(passos.ERROR_PREVIOUS_INCOMPLETE)
                    try:
                        novo = passos.add_previous_meter(
                            novo, unit_id, anterior[F_ANT_GRANDEZA],
                            anterior[F_ANT_SENSOR],
                            passos.swap_instant(
                                anterior[F_ANT_ATE], dt_util.get_default_time_zone()
                            ),
                        )
                    except ModelBuilderError as error:
                        raise ValueError("swap_refused") from error
            except ModelBuilderError:
                errors["base"] = "sensor_refused"
            except ValueError as error:
                errors["base"] = (
                    "swap_refused" if str(error) == "swap_refused"
                    else _error_key(error)
                )
            else:
                return await self._async_save_model(novo)
        historico = passos.history_lines(modelo, unit_id)
        esquema = dict(_sensor_schema(modelo, unit_id).schema)
        grandezas = [
            {"value": c["metric"], "label": c["label"]}
            for c in passos.sensor_fields(modelo, unit_id) if c["kind"] == "energy"
        ]
        if grandezas:
            # Recolhida: quase nunca se usa, e aberta pareceria obrigatória.
            # Abre sozinha quando o erro é dela, para a pessoa ver o que falta.
            erro_dela = errors.get("base") in (
                "swap_refused", passos.ERROR_PREVIOUS_INCOMPLETE,
                passos.ERROR_PREVIOUS_NEEDS_CURRENT, passos.ERROR_PREVIOUS_SAME,
            )
            esquema[vol.Optional(F_ANTERIOR)] = section(
                vol.Schema({
                    vol.Optional(F_ANT_GRANDEZA): selector.SelectSelector(
                        selector.SelectSelectorConfig(options=grandezas)
                    ),
                    vol.Optional(F_ANT_SENSOR): _SENSOR,
                    vol.Optional(F_ANT_ATE): selector.DateTimeSelector(),
                }),
                {"collapsed": not erro_dela},
            )
        return self.async_show_form(
            step_id="sensores_unidade",
            data_schema=vol.Schema(esquema),
            errors=errors,
            description_placeholders={
                "unidade": str(unidade.get("name")),
                "dica": _role_hint(unidade.get("role") == ROLE_GENERATOR),
                "historico": passos.markdown_list(historico, "nenhum."),
            },
        )

    # -- rateio --------------------------------------------------------

    async def async_step_rateio(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        manager = self._runtime().distribution_manager
        if manager is None or not manager.available:
            return self.async_abort(reason="distribution_unavailable")
        modelo = self._model()
        campos = passos.share_field_names(modelo)
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                partes = passos.shares_from_form(modelo, user_input)
                quando = user_input.get(F_A_PARTIR)
                if quando:
                    await manager.async_schedule_distribution(
                        partes,
                        passos.swap_instant(quando, dt_util.get_default_time_zone()),
                        expected_revision=manager.revision,
                    )
                else:
                    await manager.async_set_distribution_immediate(
                        partes, expected_revision=manager.revision
                    )
            except DistributionError as error:
                _LOGGER.warning("Rateio recusado: %s", error)
                errors["base"] = "distribution_refused"
            except ValueError as error:
                errors["base"] = _error_key(error)
            else:
                # O gerenciador de rateio é o mesmo que o runtime usa: nada a
                # recarregar, e recarregar tiraria a pessoa da tela à toa.
                return self._finish(reload=False)
        atuais: Mapping[str, Any] = {}
        if manager.data.rules:
            atuais = manager.data.rules[-1].shares
        esquema: dict[Any, Any] = {}
        for chave, unit_id in campos.items():
            valor = atuais.get(unit_id)
            esquema[vol.Required(
                chave, default=float(valor) if valor is not None else 0.0
            )] = selector.NumberSelector(selector.NumberSelectorConfig(
                min=0, max=100, step=0.01,
                mode=selector.NumberSelectorMode.BOX, unit_of_measurement="%",
            ))
        esquema[vol.Optional(F_A_PARTIR)] = selector.DateTimeSelector()
        return self.async_show_form(
            step_id="rateio",
            data_schema=vol.Schema(esquema),
            errors=errors,
            description_placeholders={
                "situacao": (
                    "Ainda não há rateio: informe como os créditos se dividem."
                    if not manager.data.rules
                    else "Os valores atuais já estão preenchidos."
                ),
                "historico": passos.markdown_list(
                    passos.distribution_history(modelo, manager.data.rules),
                    "nenhum rateio informado ainda.",
                ),
            },
        )

    # -- ajustes -------------------------------------------------------

    async def _async_update_settings(self, **mudanca: Any) -> None:
        await self._runtime().settings_manager.async_update(
            now=dt_util.now(), **mudanca
        )

    async def async_step_tarifa(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        ajustes = self._runtime().settings_manager.settings
        atuais = dict(ajustes.tariffs_without_taxes or {})
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                bruto = user_input.get(F_VALOR)
                # Esta tela vem depois do investimento: quem so veio mexer
                # nele passa por aqui sem informar nada, e isso nao e erro.
                if not user_input.get(F_VIGENCIA):
                    if bruto not in (None, ""):
                        raise ValueError(passos.ERROR_TARIFF_DATE_REQUIRED)
                    return self._finish()
                vigencia = date.fromisoformat(str(user_input.get(F_VIGENCIA)))
                if bruto in (None, ""):
                    atuais.pop(vigencia, None)
                else:
                    atuais[vigencia] = passos.decimal_text(
                        bruto, passos.ERROR_TARIFF_INVALID
                    )
                await self._async_update_settings(
                    tariffs_without_taxes=atuais or None
                )
            except OperationalSettingsError:
                errors["base"] = passos.ERROR_TARIFF_INVALID
            except ValueError as error:
                errors["base"] = _error_key(error)
            else:
                return self._finish()
        vigente = passos.current_tariff(atuais)
        investimento = ajustes.solar_investment
        desde = (
            date.fromisoformat(f"{investimento.period}-01")
            if investimento is not None else None
        )
        falta = passos.tariff_gap(atuais, desde)
        return self.async_show_form(
            step_id="tarifa",
            data_schema=vol.Schema({
                # Abre com a tarifa vigente: quem veio conferir já a vê, e quem
                # veio informar uma nova só troca a data e o valor.
                vol.Optional(
                    F_VIGENCIA,
                    description={
                        "suggested_value": vigente[0].isoformat() if vigente else None
                    },
                ): selector.DateSelector(),
                vol.Optional(
                    F_VALOR,
                    description={
                        "suggested_value": (
                            format(Decimal(str(vigente[1])).normalize(), "f")
                            if vigente else None
                        )
                    },
                ): selector.TextSelector(),
            }),
            errors=errors,
            description_placeholders={
                "intervalos": passos.markdown_list(
                    passos.tariff_intervals(atuais), "nenhuma ainda."
                ),
                "falta": (
                    f"\n\n**Falta tarifa antes de "
                    f"{min(atuais).strftime('%d/%m/%Y') if atuais else 'hoje'}.** "
                    f"O payback conta desde o investimento ({desde.strftime('%m/%Y')}), "
                    "e os meses sem tarifa ficam fora da conta. Informe a tarifa "
                    "daquela época com a data em que ela começou."
                    if falta is not None else ""
                ),
            },
        )

    async def async_step_investimento(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        ajustes = self._runtime().settings_manager.settings
        atual = ajustes.solar_investment
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                if user_input.get(F_LIMPAR):
                    await self._async_update_settings(solar_investment=None)
                    return self._finish()
                # Sem valor, nada muda aqui: quem veio so pela tarifa segue.
                if user_input.get(F_VALOR) not in (None, ""):
                    await self._async_update_settings(solar_investment={
                        "amount": passos.decimal_text(
                            user_input.get(F_VALOR), passos.ERROR_AMOUNT_INVALID
                        ),
                        "period": passos.investment_period(user_input.get(F_MES)),
                    })
            except OperationalSettingsError:
                errors["base"] = passos.ERROR_AMOUNT_INVALID
            except ValueError as error:
                errors["base"] = _error_key(error)
            else:
                # Mesmo item, segunda tela: a tarifa que o payback usa. O
                # investimento ja esta salvo, e a tela da tarifa ve a data
                # dele para dizer se falta tarifa em algum mes.
                return await self.async_step_tarifa()
        return self.async_show_form(
            step_id="investimento",
            last_step=False,
            data_schema=vol.Schema({
                vol.Optional(
                    F_VALOR,
                    description={
                        "suggested_value": format(atual.amount, "f") if atual else None
                    },
                ): selector.TextSelector(),
                vol.Optional(
                    F_MES,
                    description={
                        "suggested_value": f"{atual.period}-01" if atual else None
                    },
                ): selector.DateSelector(),
                vol.Optional(F_LIMPAR, default=False): selector.BooleanSelector(),
            }),
            errors=errors,
        )

    async def async_step_faturas(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        # So um aviso: esta tela envia um arquivo por vez, e o painel le a
        # pasta inteira e mostra de quem e cada UC. Ler aqui seria o caminho
        # pior para a mesma coisa.
        return self.async_abort(reason="faturas_no_painel")

    async def async_step_horario(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        runtime = self._runtime()
        atual = (
            runtime.settings_manager.settings.boundary_time
            or (runtime.model.get("billing") or {}).get("boundary_time")
            or "10:00"
        )
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                await self._async_update_settings(
                    boundary_time=passos.boundary_from_selector(user_input.get(F_HORA))
                )
            except OperationalSettingsError:
                errors["base"] = passos.ERROR_TIME_INVALID
            except ValueError as error:
                errors["base"] = _error_key(error)
            else:
                return self._finish()
        return self.async_show_form(
            step_id="horario",
            data_schema=vol.Schema({
                vol.Required(F_HORA, default=f"{atual}:00"): selector.TimeSelector(),
            }),
            errors=errors,
        )
