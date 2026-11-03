"""Remapeamento das entidades declaradas no modelo para as desta instalação.

O ``energy-model.yaml`` declara cada série e cada medição apontando para uma
entidade real do Home Assistant. Esses nomes são da instalação que escreveu o
modelo: um medidor aparece como ``sensor.<modelo>_<serial>_<canal>``, e esse
sufixo é único por aparelho. Em qualquer outra casa, o mesmo modelo de medidor
recebe outro sufixo, e o modelo inteiro — séries, medições, auditoria — aponta
para o vazio.

Este módulo guarda a correspondência ``entidade declarada → entidade daqui``.
Como ``operational_settings``, ele **não escreve no YAML**: a declaração do
projeto continua sendo o arquivo, e a correspondência é um ato do operador,
com hora. Um par ausente significa "o modelo já está certo" — não "vazio".

O que fica deliberadamente de fora: criar ou remover unidades, mudar papel,
classificação, auditoria e, principalmente, os cortes de data das séries. Uma
troca de nome de entidade não muda o que os números significam; mexer num
corte recalcularia o histórico em silêncio, e o contrato (AGENTS.md §8) é
explícito quanto a não inventar data ou limite.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import logging
import re
from typing import Any, Mapping

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = "co_energy.sensors"
STORAGE_VERSION = 1

#: Mesma forma que o Home Assistant aceita: domínio e objeto, ambos minúsculos.
_ENTITY_ID = re.compile(r"^[a-z][a-z0-9_]*\.[a-z0-9_]+$")

#: A chave que, em qualquer ponto do modelo, significa "entidade real".
_ENTITY_KEY = "entity_id"


class SensorOverridesError(ValueError):
    """Raised when a sensor override payload is invalid."""


@dataclass(frozen=True)
class SensorOverrides:
    """Correspondência declarada → real. None significa "modelo como está"."""

    entity_ids: Mapping[str, str] | None = None
    updated_at: datetime | None = None

    def __post_init__(self) -> None:
        if self.entity_ids is not None:
            if not isinstance(self.entity_ids, Mapping):
                raise SensorOverridesError("entity_ids must be a mapping")
            for declarada, real in self.entity_ids.items():
                validate_entity_id(declarada)
                validate_entity_id(real)
        if self.updated_at is not None:
            if (
                not isinstance(self.updated_at, datetime)
                or self.updated_at.tzinfo is None
            ):
                raise SensorOverridesError("updated_at must be aware")


def validate_entity_id(value: Any) -> str:
    """Return one well-formed entity id, or raise.

    A forma e verificada aqui; a existencia nao. Uma entidade pode ser
    declarada antes de o equipamento entrar no ar, e recusar o que ainda nao
    existe impediria justamente a configuracao inicial.
    """
    if not isinstance(value, str):
        raise SensorOverridesError("entity_id must be a string")
    if not _ENTITY_ID.match(value):
        raise SensorOverridesError(f"malformed entity_id: {value!r}")
    return value


def normalize_entity_ids(raw: Any) -> dict[str, str]:
    """Validate the mapping and drop the pairs that change nothing."""
    if not isinstance(raw, Mapping):
        raise SensorOverridesError("entity_ids must be a mapping")
    normalizado: dict[str, str] = {}
    for declarada, real in raw.items():
        chave = validate_entity_id(declarada)
        valor = validate_entity_id(real)
        # Trocar uma entidade por ela mesma nao e uma troca: guardar isso so
        # encheria a tela de pares que nao fazem nada.
        if chave != valor:
            normalizado[chave] = valor
    return normalizado


def serialize_overrides(overrides: SensorOverrides) -> dict[str, Any]:
    """Return the JSON-ready payload kept by the Store."""
    dados: dict[str, Any] = {"version": STORAGE_VERSION}
    if overrides.entity_ids is not None:
        dados["entity_ids"] = dict(overrides.entity_ids)
    if overrides.updated_at is not None:
        dados["updated_at"] = overrides.updated_at.isoformat()
    return dados


def deserialize_overrides(raw: Any) -> SensorOverrides:
    """Rebuild the overrides from the Store, refusing anything malformed."""
    if raw is None:
        return SensorOverrides()
    if not isinstance(raw, Mapping):
        raise SensorOverridesError("stored payload must be a mapping")
    if raw.get("version") != STORAGE_VERSION:
        raise SensorOverridesError("unsupported stored overrides version")

    bruto = raw.get("entity_ids")
    entity_ids = None if bruto is None else normalize_entity_ids(bruto)

    updated: datetime | None = None
    bruto_data = raw.get("updated_at")
    if bruto_data is not None:
        if not isinstance(bruto_data, str):
            raise SensorOverridesError("updated_at must be a string")
        try:
            updated = datetime.fromisoformat(bruto_data)
        except ValueError as error:
            raise SensorOverridesError("updated_at is not a valid datetime") from error
        if updated.tzinfo is None:
            raise SensorOverridesError("updated_at must be aware")

    return SensorOverrides(entity_ids=entity_ids, updated_at=updated)


def declared_entity_ids(model: Any) -> tuple[str, ...]:
    """Return every entity the model declares, in order and without repeats.

    E o que a tela de configuracao precisa mostrar: a lista do que o modelo
    espera encontrar. Percorre a estrutura inteira em vez de conhecer os dois
    lugares onde hoje ha `entity_id` — series e medicoes —, porque uma secao
    nova do modelo passaria despercebida por uma lista escrita a mao.
    """
    encontradas: list[str] = []
    vistas: set[str] = set()

    def visitar(no: Any) -> None:
        if isinstance(no, Mapping):
            valor = no.get(_ENTITY_KEY)
            if isinstance(valor, str) and valor not in vistas:
                vistas.add(valor)
                encontradas.append(valor)
            for item in no.values():
                visitar(item)
        elif isinstance(no, (list, tuple)):
            for item in no:
                visitar(item)

    visitar(model)
    return tuple(encontradas)


def apply_overrides_to_model(model: Any, overrides: SensorOverrides) -> Any:
    """Return the effective model, each declared entity swapped for the real one.

    Sem correspondencia, devolve o proprio modelo — nao ha copia inutil nem
    chance de as duas versoes divergirem. Com ela, copia a estrutura trocando
    apenas o valor de `entity_id`.

    A troca e aplicada uma vez sobre o valor declarado, nao ate um ponto fixo:
    com A -> B e B -> C, quem esta declarado como A vira B. Encadear seria
    imprevisivel, e um par com ciclo viraria laco infinito.
    """
    if not isinstance(model, Mapping):
        raise SensorOverridesError("model must be a mapping")
    if not overrides.entity_ids:
        return model
    mapa = dict(overrides.entity_ids)

    def trocar(no: Any) -> Any:
        if isinstance(no, Mapping):
            novo = {chave: trocar(valor) for chave, valor in no.items()}
            declarada = no.get(_ENTITY_KEY)
            if isinstance(declarada, str) and declarada in mapa:
                novo[_ENTITY_KEY] = mapa[declarada]
            return novo
        if isinstance(no, list):
            return [trocar(item) for item in no]
        if isinstance(no, tuple):
            return tuple(trocar(item) for item in no)
        return no

    return trocar(model)


def unused_entity_ids(
    model: Any, overrides: SensorOverrides
) -> tuple[str, ...]:
    """Return the overridden entities the model never declares.

    Um par que nao corresponde a nada nao e erro — o modelo pode ter mudado
    depois da configuracao —, mas e a diferenca entre "o sensor esta trocado" e
    "a troca nao esta valendo", e a tela precisa poder dizer qual dos dois.
    """
    if not overrides.entity_ids:
        return ()
    declaradas = set(declared_entity_ids(model))
    return tuple(
        entidade for entidade in overrides.entity_ids if entidade not in declaradas
    )


class SensorOverridesManager:
    """Owns the Store and the current mapping."""

    def __init__(self, store: Any, overrides: SensorOverrides) -> None:
        self._store = store
        self._overrides = overrides

    @property
    def overrides(self) -> SensorOverrides:
        return self._overrides

    async def async_update(
        self,
        *,
        entity_ids: Any = ...,
        now: datetime,
    ) -> SensorOverrides:
        """Apply a partial change. `...` means "do not touch this field"."""
        if not isinstance(now, datetime) or now.tzinfo is None:
            raise SensorOverridesError("now must be an aware datetime")
        atual = self._overrides
        if entity_ids is ...:
            novas = atual.entity_ids
        elif entity_ids is None:
            novas = None
        else:
            novas = normalize_entity_ids(entity_ids)
        proximo = SensorOverrides(entity_ids=novas, updated_at=now)
        await self._store.async_save(serialize_overrides(proximo))
        self._overrides = proximo
        return proximo


async def async_build_overrides_manager(hass: Any) -> SensorOverridesManager:
    """Load the Store, degrading to the declared model when it is unusable."""
    from homeassistant.helpers.storage import Store

    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    try:
        raw = await store.async_load()
        overrides = deserialize_overrides(raw)
    except SensorOverridesError:
        # Store ilegivel nao pode derrubar a integracao: o modelo declarado
        # sozinho e um estado valido e completo. A correspondencia e uma
        # camada opcional — quem escreveu o modelo ja tem os nomes certos.
        _LOGGER.error("Stored sensor overrides are invalid; using the declared model")
        overrides = SensorOverrides()
    except Exception:
        _LOGGER.error("Could not load sensor overrides Store", exc_info=True)
        overrides = SensorOverrides()
    return SensorOverridesManager(store, overrides)
