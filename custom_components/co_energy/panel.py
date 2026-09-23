"""A tela que a integração entrega, servida por ela mesma.

Existe para que instalar a integração baste. Antes disto o operador tinha de
copiar dois arquivos para ``www``, registrar um recurso do Lovelace e montar
um painel à mão — quatro passos que exigem saber como o Home Assistant
funciona por dentro, e que ninguém que compra um produto deveria precisar
saber.

Servir daqui também tira os arquivos de ``www``, que é publicado como
``/local/`` sem autenticação.

O cartão continua existindo: o mesmo módulo registra os dois, e quem prefere
a tela dentro de um painel próprio, ao lado de outros cartões, segue podendo.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

#: Onde os arquivos passam a ser servidos. Sob o domínio para não disputar
#: caminho com nenhuma outra integração.
URL_BASE = f"/{DOMAIN}_frontend"

#: A pasta dentro da própria integração. Vem junto no download do HACS.
FRONTEND_DIR = Path(__file__).parent / "frontend"

#: O módulo que registra o cartão e o painel.
MODULE_FILE = "co-energy-v6.js"

#: Endereço do painel e nome do componente. O nome é acordado com o módulo:
#: mudar aqui exige mudar lá.
PANEL_URL_PATH = "co-energy"
PANEL_COMPONENT = "co-energy-panel-v6"

#: Marca que a tela já foi registrada neste Home Assistant. Registro de painel
#: é global e vale para o processo; recarregar a entrada não pode tentar
#: registrar de novo, porque o Home Assistant recusa um caminho já ocupado.
_PANEL_REGISTERED = f"{DOMAIN}_panel_registered"


def module_url(version: str) -> str:
    """O endereço do módulo, carimbado com a versão da integração.

    O navegador guarda o módulo em cache por endereço. Sem o carimbo, quem
    atualiza a integração continua vendo a tela antiga até limpar o cache à
    mão — e não tem como saber que é isso.
    """
    return f"{URL_BASE}/{MODULE_FILE}?v={version}"


async def _async_version(hass: Any) -> str:
    """A versão declarada no manifest, pelo próprio Home Assistant.

    Ele já leu o manifest ao carregar a integração; abrir o arquivo daqui
    seria I/O bloqueante no laço de eventos para descobrir o que ele já sabe.
    Sem versão, vale ``0`` — o pior que acontece é o navegador servir a tela
    do cache por mais tempo.
    """
    try:
        from homeassistant.loader import async_get_integration

        integration = await async_get_integration(hass, DOMAIN)
        versao = getattr(integration, "version", None)
        return str(versao) if versao else "0"
    except Exception:  # noqa: BLE001 - sem versão a tela ainda sobe
        return "0"


async def async_register_panel(hass: Any) -> None:
    """Serve a pasta da tela e põe a integração na barra lateral.

    Falhar aqui não derruba a integração: sem a tela, os comandos continuam
    respondendo e quem já tem o cartão num painel próprio não perde nada. O
    contrário — recusar a entrada porque o painel não subiu — deixaria a
    pessoa sem dashboard E sem dados.
    """
    if hass.data.get(_PANEL_REGISTERED):
        return

    try:
        from homeassistant.components import panel_custom
        from homeassistant.components.http import StaticPathConfig
    except ImportError:
        # Fora do Home Assistant não há painel a registrar. É o que os testes
        # exercitam, e não é falha: silêncio aqui, em vez de um erro no log
        # que não descreve problema nenhum.
        return

    try:
        await hass.http.async_register_static_paths([
            # `cache_headers=False`: quem serve o cache é o carimbo de versão
            # no endereço, e um cabeçalho longo aqui seguraria a tela antiga
            # mesmo depois de a versão mudar.
            StaticPathConfig(URL_BASE, str(FRONTEND_DIR), False)
        ])
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name=PANEL_COMPONENT,
            module_url=module_url(await _async_version(hass)),
            sidebar_title="Gestão de Energia",
            sidebar_icon="mdi:transmission-tower",
            require_admin=False,
            embed_iframe=False,
        )
    except Exception:  # noqa: BLE001 - a tela é acessório; os dados não são
        _LOGGER.exception("Could not register the CoEnergy panel")
        return

    hass.data[_PANEL_REGISTERED] = True
