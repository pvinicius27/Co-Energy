"""Adapter for current states of existing Home Assistant entities."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime
import math
from typing import Any


class StatesAdapterError(ValueError):
    """Raised when a current entity state cannot be validated."""


@dataclass(frozen=True)
class CurrentStateResult:
    """Normalized current state and basic Home Assistant metadata."""

    entity_id: str
    value: float | None
    unit: str | None
    available: bool
    raw_state: str | None
    last_changed: datetime | None
    last_updated: datetime | None
    # Muda a cada leitura recebida, mesmo com o valor igual. E o que distingue
    # um medidor que responde com o mesmo numero de um que parou de responder.
    last_reported: datetime | None = None


def _validate_entity_id(entity_id: Any) -> None:
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise StatesAdapterError("entity_id must be a non-empty string")


def _validate_timestamp(value: Any, field: str, entity_id: str) -> datetime | None:
    if value is not None and not isinstance(value, datetime):
        raise StatesAdapterError(f"{entity_id} {field} must be a datetime or None")
    return value


def get_current_state(hass: Any, entity_id: str) -> CurrentStateResult:
    """Read and normalize the current state of one real entity."""
    _validate_entity_id(entity_id)
    state = hass.states.get(entity_id)
    if state is None:
        return CurrentStateResult(
            entity_id=entity_id,
            value=None,
            unit=None,
            available=False,
            raw_state=None,
            last_changed=None,
            last_updated=None,
        )

    attributes = state.attributes
    if not isinstance(attributes, Mapping):
        raise StatesAdapterError(f"{entity_id} attributes must be a mapping")
    unit = attributes.get("unit_of_measurement")
    if unit is not None and not isinstance(unit, str):
        raise StatesAdapterError(
            f"{entity_id} unit_of_measurement must be a string or None"
        )

    last_changed = _validate_timestamp(
        state.last_changed, "last_changed", entity_id
    )
    last_updated = _validate_timestamp(
        state.last_updated, "last_updated", entity_id
    )
    last_reported = _validate_timestamp(
        getattr(state, "last_reported", None), "last_reported", entity_id
    )
    raw_value = state.state
    raw_state = raw_value if isinstance(raw_value, str) else None

    if raw_value in ("unknown", "unavailable"):
        return CurrentStateResult(
            entity_id=entity_id,
            value=None,
            unit=unit,
            available=False,
            raw_state=raw_state,
            last_changed=last_changed,
            last_updated=last_updated,
            last_reported=last_reported,
        )
    if isinstance(raw_value, bool):
        raise StatesAdapterError(
            f"{entity_id} has invalid numeric state: {raw_value!r}"
        )
    try:
        value = float(raw_value)
    except (TypeError, ValueError, OverflowError) as error:
        raise StatesAdapterError(
            f"{entity_id} has non-numeric state: {raw_value!r}"
        ) from error
    if not math.isfinite(value):
        raise StatesAdapterError(
            f"{entity_id} has non-finite state: {raw_value!r}"
        )

    return CurrentStateResult(
        entity_id=entity_id,
        value=value,
        unit=unit,
        available=True,
        raw_state=raw_state,
        last_changed=last_changed,
        last_updated=last_updated,
        last_reported=last_reported,
    )


def get_current_states(
    hass: Any, entity_ids: Sequence[str]
) -> tuple[CurrentStateResult, ...]:
    """Read current states in request order without deduplication."""
    if isinstance(entity_ids, str) or not isinstance(entity_ids, Sequence):
        raise StatesAdapterError("entity_ids must be a sequence of entity IDs")
    return tuple(get_current_state(hass, entity_id) for entity_id in entity_ids)
