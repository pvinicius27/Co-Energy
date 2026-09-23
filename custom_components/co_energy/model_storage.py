"""O modelo de energia guardado pelo Home Assistant, sem arquivo nenhum.

Até aqui o modelo só entrava por uma porta: ``arquivo YAML → dicionário →
validação → objeto``. Isso bastava para quem escreveu o projeto, e era o
obstáculo para todo o resto — instalar significava redigir à mão um arquivo de
duzentas linhas com a sintaxe certa antes de ver a primeira tela.

Este módulo abre a segunda porta, e ela desemboca no mesmo lugar:
``formulário → mesmo dicionário → mesma validação → mesmo objeto``. A validação
é a de sempre, pública e única, então um modelo gravado daqui não pode ser
menos válido que um escrito à mão.

Quem existe ganha de quem falta: havendo modelo guardado, é ele que vale, e o
YAML passa a ser origem de importação. Assim uma instalação que nunca viu um
arquivo funciona, e a que já tinha um continua funcionando até decidir migrar.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import logging
from typing import Any, Mapping

from .energy_model import EnergyModelError, validate_energy_model

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = "co_energy.model"
STORAGE_VERSION = 1


class ModelStorageError(ValueError):
    """Raised when a stored model payload cannot be used."""


@dataclass(frozen=True)
class StoredModel:
    """O modelo guardado, ou a ausência dele. None significa "use o YAML"."""

    model: Mapping[str, Any] | None = None
    updated_at: datetime | None = None


def ensure_json_safe(value: Any, field: str = "model") -> Any:
    """Return the value when every leaf survives a round trip through JSON.

    O Store grava JSON. Um modelo importado de YAML pode trazer uma data sem
    aspas, que o carregador transforma em `date` — e ai a gravacao falharia
    depois de a interface ja ter dito que salvou. Melhor recusar aqui, com o
    caminho do campo, do que gravar pela metade.
    """
    if isinstance(value, Mapping):
        limpo: dict[str, Any] = {}
        for chave, item in value.items():
            if not isinstance(chave, str):
                raise ModelStorageError(f"{field}: key {chave!r} is not a string")
            limpo[chave] = ensure_json_safe(item, f"{field}.{chave}")
        return limpo
    if isinstance(value, (list, tuple)):
        return [
            ensure_json_safe(item, f"{field}[{i}]")
            for i, item in enumerate(value)
        ]
    if value is None or isinstance(value, (str, bool, int, float)):
        return value
    raise ModelStorageError(
        f"{field}: {type(value).__name__} cannot be stored; use text"
    )


def serialize_stored_model(stored: StoredModel) -> dict[str, Any]:
    """Return the JSON-ready payload kept by the Store."""
    dados: dict[str, Any] = {"version": STORAGE_VERSION}
    if stored.model is not None:
        dados["model"] = ensure_json_safe(stored.model)
    if stored.updated_at is not None:
        dados["updated_at"] = stored.updated_at.isoformat()
    return dados


def deserialize_stored_model(raw: Any) -> StoredModel:
    """Rebuild the stored model, refusing anything the domain would refuse.

    A validacao aqui e a mesma que o YAML atravessa. Um modelo guardado por uma
    versao anterior do software que hoje nao passaria mais e recusado como
    qualquer outro invalido — e melhor cair para o YAML dizendo o motivo do que
    subir com um modelo que o resto do backend nao sabe ler.
    """
    if raw is None:
        return StoredModel()
    if not isinstance(raw, Mapping):
        raise ModelStorageError("stored payload must be a mapping")
    if raw.get("version") != STORAGE_VERSION:
        raise ModelStorageError("unsupported stored model version")

    model = raw.get("model")
    if model is not None:
        if not isinstance(model, Mapping):
            raise ModelStorageError("stored model must be a mapping")
        try:
            validate_energy_model(model)
        except EnergyModelError as error:
            raise ModelStorageError(f"stored model is invalid: {error}") from error

    updated: datetime | None = None
    bruto = raw.get("updated_at")
    if bruto is not None:
        if not isinstance(bruto, str):
            raise ModelStorageError("updated_at must be a string")
        try:
            updated = datetime.fromisoformat(bruto)
        except ValueError as error:
            raise ModelStorageError("updated_at is not a valid datetime") from error
        if updated.tzinfo is None:
            raise ModelStorageError("updated_at must be aware")

    return StoredModel(model=model, updated_at=updated)


class ModelStorageManager:
    """Owns the Store and the model currently kept in it."""

    def __init__(self, store: Any, stored: StoredModel) -> None:
        self._store = store
        self._stored = stored

    @property
    def stored(self) -> StoredModel:
        return self._stored

    @property
    def model(self) -> Mapping[str, Any] | None:
        """O modelo guardado, ou None quando nao ha — e vale o YAML."""
        return self._stored.model

    async def async_save(
        self, model: Mapping[str, Any], *, now: datetime
    ) -> StoredModel:
        """Validate and store one complete model.

        Valida antes de gravar, e nao depois de ler: um modelo invalido nunca
        chega ao disco, entao a proxima partida nao depende de o operador
        lembrar o que ele salvou errado.
        """
        if not isinstance(now, datetime) or now.tzinfo is None:
            raise ModelStorageError("now must be an aware datetime")
        if not isinstance(model, Mapping):
            raise ModelStorageError("model must be a mapping")
        try:
            validate_energy_model(model)
        except EnergyModelError as error:
            raise ModelStorageError(str(error)) from error

        proximo = StoredModel(model=ensure_json_safe(model), updated_at=now)
        await self._store.async_save(serialize_stored_model(proximo))
        self._stored = proximo
        return proximo

    async def async_clear(self, *, now: datetime) -> StoredModel:
        """Forget the stored model, falling back to the declared file.

        Nao apaga arquivo nenhum: o YAML, quando existe, volta a valer. Sem
        arquivo, a instalacao fica sem modelo — e e o que o operador pediu.
        """
        if not isinstance(now, datetime) or now.tzinfo is None:
            raise ModelStorageError("now must be an aware datetime")
        proximo = StoredModel(model=None, updated_at=now)
        await self._store.async_save(serialize_stored_model(proximo))
        self._stored = proximo
        return proximo


async def async_build_model_manager(hass: Any) -> ModelStorageManager:
    """Load the Store, degrading to "no stored model" when it is unusable."""
    from homeassistant.helpers.storage import Store

    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    try:
        raw = await store.async_load()
        stored = deserialize_stored_model(raw)
    except ModelStorageError as error:
        # Alto de proposito: aqui nao se perde um ajuste, se perde a
        # configuracao inteira da instalacao. Quem ler o log precisa saber
        # que voltou a valer o arquivo — ou que nao ha mais modelo nenhum.
        _LOGGER.error(
            "Stored energy model could not be used (%s); "
            "falling back to the declared file",
            error,
        )
        stored = StoredModel()
    except Exception:
        _LOGGER.error("Could not load the energy model Store", exc_info=True)
        stored = StoredModel()
    return ModelStorageManager(store, stored)
