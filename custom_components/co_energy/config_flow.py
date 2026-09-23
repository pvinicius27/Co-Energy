"""Fluxo de configuração da integração pela interface do Home Assistant.

Existe para que instalar deixe de exigir edição do ``configuration.yaml``.
A regra do que é aceito mora em ``config_validation``, que é função pura e
testável; aqui só se monta o formulário, chama a validação num executor — ler
arquivo bloqueia — e se traduz a recusa em erro de campo.

Quem já configurou pelo YAML não precisa fazer nada: ``async_setup`` importa a
configuração existente e cria a entrada sozinho.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from .config_validation import (
    ConfigValidationError,
    form_defaults,
    validate_user_input,
)
from .const import CONF_FINANCIAL_MODEL_PATH, CONF_MODEL_PATH, DOMAIN
from .energy_model import load_energy_model
from .financial_model import load_financial_model

def _schema(
    defaults: dict[str, Any] | None = None, *, sugerir: bool = True
) -> vol.Schema:
    """Formulário com o que já foi digitado preservado.

    Errar um caminho não pode apagar o outro: quem digitou dois caminhos
    longos e errou uma letra em um deles não deveria redigitar os dois.

    Qual valor cada campo mostra é decidido por ``form_defaults``, em
    ``config_validation`` — lá a decisão é testável, aqui não seria.
    """
    mostrar = form_defaults(defaults, suggest=sugerir)
    # `suggested_value`, e NUNCA `default`. Ao apagar um campo de texto, o
    # frontend do Home Assistant omite a chave em vez de mandar string vazia,
    # e `default` faria o voluptuous repor o valor anterior: apagar o caminho
    # não apagaria nada, e a tela ainda diria que atualizou. `suggested_value`
    # preenche o campo sem virar valor, então chave ausente chega ausente.
    return vol.Schema({
        # Opcional, e em branco por padrão: instalar sem nada é o caminho
        # normal, e sugerir um caminho faria parecer que falta um arquivo.
        # Quem já tem um modelo em arquivo digita o caminho dele aqui.
        vol.Optional(
            CONF_MODEL_PATH,
            description={"suggested_value": mostrar[CONF_MODEL_PATH]},
        ): str,
        vol.Optional(
            CONF_FINANCIAL_MODEL_PATH,
            description={"suggested_value": mostrar[CONF_FINANCIAL_MODEL_PATH]},
        ): str,
    })


class CoEnergyConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle the CoEnergy configuration flow."""

    VERSION = 1

    async def _async_validate(self, user_input: dict[str, Any]) -> dict[str, Any]:
        """Validate the informed paths without blocking the event loop."""
        return await self.hass.async_add_executor_job(
            lambda: validate_user_input(
                user_input,
                load_model=load_energy_model,
                load_financial_model=load_financial_model,
            )
        )

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Ask for the model paths and validate them before accepting."""
        # Uma instalação, uma entrada: dois runtimes disputariam o mesmo
        # hass.data e os mesmos comandos WebSocket.
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                data = await self._async_validate(user_input)
            except ConfigValidationError as error:
                errors[error.field] = error.reason
            else:
                return self.async_create_entry(title="Gestão de Energia", data=data)

        return self.async_show_form(
            step_id="user", data_schema=_schema(user_input), errors=errors
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Mudar os caminhos sem excluir a entrada e recriá-la.

        Sem este passo, o menu da integração não oferece "Reconfigurar", e
        corrigir uma letra num caminho — ou apagar o caminho para passar a
        depender só do storage — exigia excluir a entrada e configurar de
        novo. O ``add_update_listener`` registrado em ``async_setup_entry`` já
        esperava por isto: gravar aqui recarrega o runtime sem reiniciar o
        Home Assistant.

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
            data_schema=_schema(user_input or dict(entrada.data), sugerir=False),
            errors=errors,
        )

    async def async_step_import(self, import_data: dict[str, Any]) -> FlowResult:
        """Adopt an existing configuration.yaml setup.

        Chamado por ``async_setup`` quando encontra a configuração antiga. O
        YAML segue valendo até o operador remover; a diferença é que a partir
        daqui a integração existe como entrada, e pode ser reconfigurada pela
        interface.
        """
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        try:
            data = await self._async_validate(dict(import_data))
        except ConfigValidationError:
            # Um YAML que não carrega já falhava antes; abortar aqui evita
            # criar uma entrada que nunca subiria.
            return self.async_abort(reason="invalid_configuration")
        return self.async_create_entry(title="Gestão de Energia", data=data)
