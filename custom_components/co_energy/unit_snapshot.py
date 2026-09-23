"""Aggregate one CoEnergy unit's metadata, current states, and billing."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .billing import BillingRecord, get_latest_bill
from .energy_model import (
    EnergyModelError,
    get_measurement_logical_ids,
    get_unit_definition,
)
from .equatorial_adapter import EquatorialDocument
from .logical_state import (
    LogicalStateError,
    LogicalStateResult,
    get_logical_current_states,
)


class UnitSnapshotError(ValueError):
    """Raised when a unit snapshot cannot be assembled."""


@dataclass(frozen=True)
class UnitSnapshot:
    """Current aggregate for one logical CoEnergy unit."""

    unit_id: str
    name: str
    role: str
    measured: bool
    image: str | None
    measurements: tuple[LogicalStateResult, ...]
    latest_bill: BillingRecord | None


def _required_string(definition: Mapping[str, Any], field: str) -> str:
    value = definition.get(field)
    if not isinstance(value, str) or not value.strip():
        raise UnitSnapshotError(f"{field} must be a non-empty string")
    return value


def _get_image(definition: Mapping[str, Any]) -> str | None:
    presentation = definition.get("presentation")
    if presentation is None:
        return None
    if not isinstance(presentation, Mapping):
        raise UnitSnapshotError("presentation must be a mapping or None")
    image = presentation.get("image")
    if image is None:
        return None
    if not isinstance(image, str) or not image.strip():
        raise UnitSnapshotError("presentation.image must be a non-empty string or None")
    return image


def get_unit_snapshot(
    hass: Any,
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
) -> UnitSnapshot:
    """Assemble one unit snapshot through the formal domain boundaries."""
    try:
        definition = get_unit_definition(model, unit_id)
        measurement_ids = get_measurement_logical_ids(model, unit_id)
    except EnergyModelError as error:
        raise UnitSnapshotError(f"could not resolve unit {unit_id!r}") from error

    name = _required_string(definition, "name")
    role = _required_string(definition, "role")
    measured = definition.get("measured")
    if not isinstance(measured, bool):
        raise UnitSnapshotError("measured must be boolean")
    billing_key = _required_string(definition, "billing_key")
    image = _get_image(definition)

    try:
        measurements = get_logical_current_states(hass, model, measurement_ids)
    except LogicalStateError as error:
        raise UnitSnapshotError(
            f"could not resolve measurements for unit {unit_id!r}"
        ) from error

    # A unidade veio do modelo, entao ela existe; o documento e que pode
    # ainda nao ter fatura dela. Isso nao e falha — e o estado de quem acabou
    # de ser configurado, e de quem so se acompanha pelo medidor.
    latest_bill = get_latest_bill(billing_document, billing_key)

    return UnitSnapshot(
        unit_id=unit_id,
        name=name,
        role=role,
        measured=measured,
        image=image,
        measurements=measurements,
        latest_bill=latest_bill,
    )
