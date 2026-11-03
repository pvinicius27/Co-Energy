"""Resolve current measurement states through CoEnergy logical IDs."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from .energy_model import EnergyModelError, get_measurement_definition
from .states_adapter import StatesAdapterError, get_current_state


class LogicalStateError(ValueError):
    """Raised when a logical current state cannot be resolved."""


@dataclass(frozen=True)
class LogicalStateResult:
    """Current value and metadata exposed by logical measurement identity."""

    logical_id: str
    label: str
    quantity: str
    unit: str | None
    state_unit: str | None
    value: float | None
    available: bool
    raw_state: str | None
    last_changed: datetime | None
    last_updated: datetime | None
    validation_required: bool
    validation_note: str | None
    unit_mismatch: bool


def _required_string(definition: Mapping[str, Any], field: str) -> str:
    value = definition.get(field)
    if not isinstance(value, str) or not value.strip():
        raise LogicalStateError(f"{field} must be a non-empty string")
    return value


def _optional_string(definition: Mapping[str, Any], field: str) -> str | None:
    value = definition.get(field)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise LogicalStateError(f"{field} must be a non-empty string or None")
    return value


_UNIT_CONVERSIONS: Mapping[tuple[str, str, str], float] = {
    ("current", "mA", "A"): 0.001,
}


def _conversion_factor(
    quantity: str, logical_unit: str | None, state_unit: str | None
) -> float | None:
    """Return the factor that converts the state unit into the logical unit."""
    if logical_unit is None or state_unit is None:
        return None
    return _UNIT_CONVERSIONS.get((quantity, state_unit, logical_unit))


def normalize_measurement_value(
    quantity: str,
    logical_unit: str | None,
    state_unit: str | None,
    value: float | None,
) -> float | None:
    """Convert a raw entity value into the unit the model declares.

    Publica de proposito: a estatistica historica da mesma entidade precisa
    passar pela mesma conversao. Duas copias da regra dariam, na mesma tela,
    um valor instantaneo em A e um maximo em mA.
    """
    if value is None or state_unit == logical_unit:
        return value
    factor = _conversion_factor(quantity, logical_unit, state_unit)
    if factor is not None:
        return value * factor
    return value


def _normalize_logical_value(
    quantity: str,
    logical_unit: str | None,
    state_unit: str | None,
    value: float | None,
) -> float | None:
    return normalize_measurement_value(quantity, logical_unit, state_unit, value)


def _detect_unit_mismatch(
    quantity: str, logical_unit: str | None, state_unit: str | None
) -> bool:
    """Report a declared unit that the entity contradicts with no known conversion.

    Only an explicit contradiction counts. When either side omits the unit the
    mismatch is unknowable, and claiming one would be an invention.
    """
    if logical_unit is None or state_unit is None:
        return False
    if state_unit == logical_unit:
        return False
    return _conversion_factor(quantity, logical_unit, state_unit) is None


def get_logical_current_state(
    hass: Any, model: Mapping[str, Any], logical_id: str
) -> LogicalStateResult:
    """Resolve one current measurement by logical identifier."""
    try:
        definition = get_measurement_definition(model, logical_id)
    except EnergyModelError as error:
        raise LogicalStateError(f"could not resolve logical state {logical_id!r}") from error

    entity_id = _required_string(definition, "entity_id")
    label = _required_string(definition, "label")
    quantity = _required_string(definition, "quantity")
    unit = _optional_string(definition, "unit")

    validation_required = definition.get("validation_required", False)
    if not isinstance(validation_required, bool):
        raise LogicalStateError("validation_required must be boolean")
    validation_note = _optional_string(definition, "validation_note")

    try:
        current = get_current_state(hass, entity_id)
    except StatesAdapterError as error:
        raise LogicalStateError(f"could not read logical state {logical_id!r}") from error

    value = _normalize_logical_value(quantity, unit, current.unit, current.value)

    return LogicalStateResult(
        logical_id=logical_id,
        label=label,
        quantity=quantity,
        unit=unit,
        state_unit=current.unit,
        value=value,
        available=current.available,
        raw_state=current.raw_state,
        last_changed=current.last_changed,
        last_updated=current.last_updated,
        validation_required=validation_required,
        validation_note=validation_note,
        unit_mismatch=_detect_unit_mismatch(quantity, unit, current.unit),
    )


def get_logical_current_states(
    hass: Any,
    model: Mapping[str, Any],
    logical_ids: Sequence[str],
) -> tuple[LogicalStateResult, ...]:
    """Resolve logical current states in order without deduplication."""
    if isinstance(logical_ids, str) or not isinstance(logical_ids, Sequence):
        raise LogicalStateError("logical_ids must be a sequence of logical IDs")
    return tuple(
        get_logical_current_state(hass, model, logical_id)
        for logical_id in logical_ids
    )
