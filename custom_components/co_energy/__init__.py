"""CoEnergy integration."""

from __future__ import annotations

from collections.abc import Mapping
import logging
from typing import Any

from .const import DOMAIN
from .energy_model import EnergyModelError, get_unit_ids
from .http_api import async_register_http_api
from .panel import async_register_panel
from .removal import async_remove_all_data
from .runtime import CoEnergyRuntime, CoEnergyRuntimeError, async_build_runtime
from .websocket_api import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)

#: Marca que os comandos WebSocket já foram registrados neste Home Assistant.
#: O registro é global e vale para o processo todo, enquanto uma entrada pode
#: ser recarregada quantas vezes o operador quiser — registrar de novo na
#: segunda vez derrubaria o registro inteiro.
_WEBSOCKET_REGISTERED = f"{DOMAIN}_websocket_registered"


def _register_websocket_once(hass: Any) -> None:
    if hass.data.get(_WEBSOCKET_REGISTERED):
        return
    async_register_websocket_api(hass)
    # O endereco de envio da foto acompanha os comandos: mesmo registro
    # global, mesma razao para acontecer uma vez so.
    async_register_http_api(hass)
    hass.data[_WEBSOCKET_REGISTERED] = True


async def async_setup(hass: Any, config: Mapping[str, Any]) -> bool:
    """Adopt an existing configuration.yaml setup, if there is one.

    A configuração por YAML continua valendo: quem já tinha `co_energy:` no
    configuration.yaml não precisa fazer nada, e a integração passa a existir
    também como entrada — reconfigurável pela interface. Sem YAML, não há o
    que fazer aqui: quem cria a entrada é o fluxo de configuração.
    """
    if not isinstance(config, Mapping):
        return True
    domain_config = config.get(DOMAIN)
    if not isinstance(domain_config, Mapping):
        return True

    # "import" e o valor de config_entries.SOURCE_IMPORT. Escrito assim para
    # este modulo continuar importavel fora do Home Assistant, que e como os
    # testes o exercitam — mesma razao pela qual o registro dos comandos
    # WebSocket importa o HA dentro da propria funcao.
    hass.async_create_task(
        hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": "import"},
            data=dict(domain_config),
        )
    )
    return True


async def async_setup_entry(hass: Any, entry: Any) -> bool:
    """Set up CoEnergy from a config entry."""
    try:
        runtime = await async_build_runtime(hass, dict(entry.data))
    except CoEnergyRuntimeError as error:
        _LOGGER.error("Could not initialize CoEnergy: %s", error)
        return False

    _register_websocket_once(hass)
    # A tela vem junto: instalar a integração basta. Depois dos comandos de
    # propósito — um painel que abrisse antes deles responderia "runtime
    # indisponível" na primeira leitura.
    await async_register_panel(hass)
    hass.data[DOMAIN] = runtime
    # Reconfigurar pela interface recarrega a entrada, e é aqui que o runtime
    # novo substitui o antigo sem exigir reinício do Home Assistant.
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True


async def async_unload_entry(hass: Any, entry: Any) -> bool:
    """Unload the config entry.

    Os comandos WebSocket ficam registrados: o Home Assistant não oferece como
    desfazer esse registro, e eles respondem "runtime indisponível" enquanto
    não houver runtime — que é a resposta correta.
    """
    hass.data.pop(DOMAIN, None)
    return True


async def async_reload_entry(hass: Any, entry: Any) -> None:
    """Reload the entry after the operator changes its options."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_remove_entry(hass: Any, entry: Any) -> None:
    """Remover a integração remove o que ela guardou.

    Sem isto, excluir deixava para trás o modelo, o rateio, os ajustes e as
    faturas — que carregam unidade consumidora, valores e competências. Quem
    remove acredita que removeu, e o dado pessoal fica no disco de alguém que
    não sabe que ficou.

    As unidades são lidas ANTES de o storage sair, porque é o modelo que diz
    de quem é cada foto: depois de apagá-lo não há mais como saber quais
    arquivos da pasta pertenciam a esta instalação.
    """
    runtime = hass.data.get(DOMAIN)
    unidades: tuple[str, ...] = ()
    if isinstance(runtime, CoEnergyRuntime):
        try:
            unidades = get_unit_ids(runtime.model)
        except EnergyModelError:
            unidades = ()
    await async_remove_all_data(hass, unidades)
