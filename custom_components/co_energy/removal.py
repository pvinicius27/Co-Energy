"""O que sai do disco quando alguém remove a integração.

Sem isto, excluir a integração deixava para trás tudo que ela guardou: o
modelo, o rateio, os ajustes — e as faturas, que carregam unidade
consumidora, valores e competências. Quem remove acredita que removeu, e o
dado pessoal fica no disco de alguém que não sabe que ficou.

O caminho de volta é o backup do Home Assistant, que inclui ``.storage``. A
tela também oferece exportar as faturas em JSON antes. Remover pela metade,
para poder desfazer, seria escolher a conveniência de quem troubleshoota
contra a privacidade de quem desinstala — e a segunda pesa mais.

Fotos: só as das unidades declaradas, nomeadas ``<unidade>.<extensão>``. Um
arquivo que alguém tenha posto na mesma pasta não é nosso e fica.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .distribution_storage import STORAGE_KEY as DISTRIBUTION_KEY
from .invoice_storage import COPY_FOLDER, STORAGE_KEY as INVOICES_KEY
from .model_storage import STORAGE_KEY as MODEL_KEY
from .operational_settings import STORAGE_KEY as SETTINGS_KEY
from .sensor_overrides import STORAGE_KEY as SENSORS_KEY
from .unit_images import IMAGE_SUFFIXES, IMAGES_RELATIVE_PATH

_LOGGER = logging.getLogger(__name__)

#: Chaves que versões anteriores criaram e ninguém mais lê. Ficam aqui para
#: que remover limpe também o que o projeto deixou pelo caminho — quem
#: desinstala não tem como saber que aquilo é lixo de uma versão antiga.
LEGACY_STORAGE_KEYS = ("co_energy.dashboard_layout",)

#: Tudo que a integração guarda. Um teste confere esta lista contra as chaves
#: declaradas no pacote: uma chave nova que não chegue aqui vira dado que
#: sobrevive à remoção, e nada acusaria.
STORAGE_KEYS = (
    MODEL_KEY,
    INVOICES_KEY,
    SETTINGS_KEY,
    DISTRIBUTION_KEY,
    SENSORS_KEY,
    *LEGACY_STORAGE_KEYS,
)


def unit_picture_paths(
    images_dir: Path, unit_ids: tuple[str, ...]
) -> tuple[Path, ...]:
    """As fotos que a integração gravou, e só elas.

    O nome é ``<unidade>.<extensão>`` porque quem envia nunca escolhe o nome.
    Varrer a pasta inteira levaria junto arquivo de terceiro; casar pelo id
    declarado leva o que é nosso.
    """
    if not images_dir.is_dir():
        return ()
    encontradas: list[Path] = []
    for unit_id in unit_ids:
        if not isinstance(unit_id, str) or not unit_id.strip():
            continue
        for caminho in images_dir.glob(f"{unit_id}.*"):
            if caminho.suffix.lower() in IMAGE_SUFFIXES and caminho.is_file():
                encontradas.append(caminho)
    return tuple(encontradas)


def remove_files(caminhos: tuple[Path, ...]) -> int:
    """Apaga o que der, e segue. Bloqueia: chame no executor.

    Falhar num arquivo não pode interromper a limpeza: o que sobrar por erro
    de permissão é menos grave do que parar no primeiro e deixar o resto.
    """
    removidos = 0
    for caminho in caminhos:
        try:
            caminho.unlink()
            removidos += 1
        except OSError as error:
            _LOGGER.warning("Could not remove %s: %s", caminho, error)
    return removidos


def remove_empty_dir(caminho: Path) -> None:
    """Remove a pasta se ela ficou vazia. Bloqueia: chame no executor."""
    try:
        if caminho.is_dir() and not any(caminho.iterdir()):
            caminho.rmdir()
    except OSError:
        # Pasta que não sai não é problema: o que importava era o conteúdo.
        pass


async def async_remove_all_data(hass: Any, unit_ids: tuple[str, ...]) -> None:
    """Apaga o storage, as cópias de fatura e as fotos das unidades.

    Nunca levanta: remover a entrada não pode falhar por causa da limpeza. O
    Home Assistant já tirou a integração da lista quando chega aqui, e um erro
    aqui deixaria a pessoa com uma integração meio removida.
    """
    try:
        from homeassistant.helpers.storage import Store

        for chave in STORAGE_KEYS:
            try:
                await Store(hass, 1, chave).async_remove()
            except Exception:  # noqa: BLE001 - uma chave não derruba as outras
                _LOGGER.warning("Could not remove the storage %s", chave)

        executor = getattr(hass, "async_add_executor_job", None)
        if not callable(executor):
            return

        config_dir = Path(hass.config.path())
        faturas = config_dir / COPY_FOLDER
        imagens = config_dir.joinpath(*IMAGES_RELATIVE_PATH)

        if faturas.is_dir():
            copias = tuple(p for p in faturas.glob("*.json") if p.is_file())
            await executor(remove_files, copias)
            await executor(remove_empty_dir, faturas)
            await executor(remove_empty_dir, faturas.parent)

        fotos = await executor(unit_picture_paths, imagens, unit_ids)
        if fotos:
            await executor(remove_files, fotos)
            await executor(remove_empty_dir, imagens)
    except Exception:  # noqa: BLE001 - a remoção da entrada prossegue
        _LOGGER.exception("Could not remove the CoEnergy data")
