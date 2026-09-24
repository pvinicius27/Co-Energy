"""Explicit public serializer for the configured unit catalog."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .capabilities import installation_capabilities
from .energy_model import (
    EnergyModelError,
    get_generator_unit_id,
    get_unit_definition,
    get_unit_ids,
    get_unit_name,
    get_unit_role,
)


class UnitCatalogSerializationError(ValueError):
    """Raised when the configured unit catalog cannot be serialized safely."""


def _boolean(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        raise UnitCatalogSerializationError(f"{field} must be boolean")
    return value


def serialize_unit_catalog(
    model: Mapping[str, Any],
    *,
    has_billing: bool = False,
    has_investment: bool = False,
) -> dict[str, Any]:
    """Serialize the declared units through an explicit allowlist.

    O papel viaja junto porque e ele que diz quem gera. Sem isso a interface
    nao tinha como saber, e trazia o nome de uma unidade escrito no proprio
    codigo — o que amarrava o card a esta instalacao.

    As CAPACIDADES viajam pelo mesmo motivo, um nivel acima: a tela nao tem
    como saber sozinha que uma casa sem geracao nao tem payback, nem que uma
    casa sozinha nao tem rateio. Ela sabia lidar com o que existe, e nao com
    o que nao existe — e mostrava oito abas vazias para quem acabou de
    instalar.
    """
    try:
        unit_ids = get_unit_ids(model)
        units = [
            {
                "unit_id": unit_id,
                "name": get_unit_name(model, unit_id),
                "role": get_unit_role(model, unit_id),
                "measured": _boolean(
                    get_unit_definition(model, unit_id).get("measured"),
                    f"units.{unit_id}.measured",
                ),
                # A cor escolhida, quando ha uma. Viaja aqui e nao so na tela
                # de configuracao porque quem a usa — payback, rosca do
                # rateio — carrega o catalogo, nao a configuracao.
                "color": _declared_color(model, unit_id),
            }
            for unit_id in unit_ids
        ]
    except EnergyModelError as error:
        raise UnitCatalogSerializationError(
            "configured units are unavailable in the energy model"
        ) from error
    return {
        "units": units,
        "generator_unit_id": _generator_or_none(model),
        "capabilities": installation_capabilities(
            model, has_billing=has_billing, has_investment=has_investment
        ),
    }


def _declared_color(model: Mapping[str, Any], unit_id: str) -> str | None:
    """Return the colour declared for one unit, or None."""
    presentation = get_unit_definition(model, unit_id).get("presentation")
    if not isinstance(presentation, Mapping):
        return None
    color = presentation.get("color")
    return color if isinstance(color, str) and color else None


def _generator_or_none(model: Mapping[str, Any]) -> str | None:
    """Quem gera, ou None quando o modelo nao declara exatamente uma.

    A interface usa isto para saber a quem pedir geracao, exportacao e
    autoconsumo. None significa "esta instalacao nao tem geradora declarada",
    e o card esconde o que depende dela em vez de pedir a unidade errada.
    """
    try:
        return get_generator_unit_id(model)
    except EnergyModelError:
        return None
