"""Explicit public serialization for configured credit distribution."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import datetime
from decimal import Decimal
from typing import Any

from .distribution import (
    ConfiguredDistributionRule,
    ConfiguredDistributionSnapshot,
    DistributionStorageData,
    resolve_distribution,
    validate_storage_data,
    validate_unit_ids,
)


class DistributionSerializationError(ValueError):
    """Raised when configured distribution data cannot be serialized safely."""


def _canonical_decimal(value: Any, field: str) -> str:
    if isinstance(value, bool) or not isinstance(value, Decimal):
        raise DistributionSerializationError(f"{field} must be a Decimal")
    if not value.is_finite():
        raise DistributionSerializationError(f"{field} must be finite")
    if value < 0 or value > 100:
        raise DistributionSerializationError(f"{field} must be between 0 and 100")
    if max(-value.as_tuple().exponent, 0) > 4:
        raise DistributionSerializationError(f"{field} must have at most 4 decimals")
    text = format(value, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _datetime_iso(value: Any, field: str) -> str:
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise DistributionSerializationError(f"{field} must be a timezone-aware datetime")
    try:
        offset = value.utcoffset()
    except (OverflowError, ValueError) as error:
        raise DistributionSerializationError(
            f"{field} must be a timezone-aware datetime"
        ) from error
    if offset is None:
        raise DistributionSerializationError(f"{field} must be a timezone-aware datetime")
    return value.isoformat()


def _optional_datetime_iso(value: Any, field: str) -> str | None:
    if value is None:
        return None
    return _datetime_iso(value, field)


def _required_int(value: Any, field: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise DistributionSerializationError(f"{field} must be a positive integer")
    return value


def _required_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise DistributionSerializationError(f"{field} must be a non-empty string")
    return value


def _optional_string(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise DistributionSerializationError(
            f"{field} must be a non-empty string or None"
        )
    return value


def _serialize_shares(
    shares: Any, field: str, unit_ids: Sequence[str]
) -> dict[str, str]:
    try:
        expected = validate_unit_ids(unit_ids)
    except ValueError as error:
        raise DistributionSerializationError(f"{field} unit_ids are invalid") from error
    if not isinstance(shares, Mapping):
        raise DistributionSerializationError(f"{field} must be a mapping")
    if set(shares) != set(expected):
        raise DistributionSerializationError(
            f"{field} must contain exactly {sorted(expected)}"
        )
    serialized = {
        unit_id: _canonical_decimal(shares[unit_id], f"{field}.{unit_id}")
        for unit_id in expected
    }
    total = sum((shares[unit_id] for unit_id in expected), Decimal("0"))
    if total != Decimal("100"):
        raise DistributionSerializationError(f"{field} must total exactly 100")
    return serialized


def serialize_configured_distribution_rule(
    rule: ConfiguredDistributionRule,
    unit_ids: Sequence[str],
) -> dict[str, Any]:
    """Serialize one configured distribution rule with an explicit allowlist."""
    if not isinstance(rule, ConfiguredDistributionRule):
        raise DistributionSerializationError(
            "rule must be a ConfiguredDistributionRule"
        )
    return {
        "rule_id": _required_string(rule.id, "rule.id"),
        "label": _optional_string(rule.label, "rule.label"),
        "effective_from": _optional_datetime_iso(
            rule.effective_from, "rule.effective_from"
        ),
        "effective_until": _optional_datetime_iso(
            rule.effective_until, "rule.effective_until"
        ),
        "shares": _serialize_shares(rule.shares, "rule.shares", unit_ids),
        "total_percent": _canonical_decimal(
            sum(rule.shares.values(), Decimal("0")), "rule.total_percent"
        ),
        "created_at": _datetime_iso(rule.created_at, "rule.created_at"),
    }


def serialize_configured_distribution_snapshot(
    snapshot: ConfiguredDistributionSnapshot,
    unit_ids: Sequence[str],
) -> dict[str, Any]:
    """Serialize one resolved snapshot with an explicit allowlist."""
    if not isinstance(snapshot, ConfiguredDistributionSnapshot):
        raise DistributionSerializationError(
            "snapshot must be a ConfiguredDistributionSnapshot"
        )
    return {
        "resolved_at": _datetime_iso(snapshot.resolved_at, "snapshot.resolved_at"),
        "rule_id": _required_string(snapshot.rule_id, "snapshot.rule_id"),
        "label": _optional_string(snapshot.rule_label, "snapshot.rule_label"),
        "effective_from": _optional_datetime_iso(
            snapshot.effective_from, "snapshot.effective_from"
        ),
        "effective_until": _optional_datetime_iso(
            snapshot.effective_until, "snapshot.effective_until"
        ),
        "shares": _serialize_shares(snapshot.shares, "snapshot.shares", unit_ids),
        "total_percent": _canonical_decimal(
            snapshot.total_percent, "snapshot.total_percent"
        ),
        "revision": _required_int(snapshot.revision, "snapshot.revision"),
    }


def serialize_configured_distribution(
    data: DistributionStorageData,
    at: datetime,
    unit_ids: Sequence[str],
) -> dict[str, Any]:
    """Serialize the full configured distribution payload at an explicit instant."""
    if not isinstance(data, DistributionStorageData):
        raise DistributionSerializationError(
            "data must be a DistributionStorageData"
        )
    _datetime_iso(at, "at")
    validated = validate_storage_data(data, unit_ids)
    if not validated.rules:
        # Rateio pendente: duas ou mais unidades e ninguém informou ainda. É
        # um estado, não uma falha — resolver aqui levantaria "nenhuma regra
        # cobre o instante", e a tela diria "indisponível" em vez de pedir o
        # rateio.
        return {
            "revision": _required_int(validated.revision, "data.revision"),
            "timezone": _required_string(validated.timezone, "data.timezone"),
            "current": None,
            "scheduled": None,
            "history": [],
        }
    current_snapshot = resolve_distribution(validated, at, unit_ids)

    scheduled_rules = [
        rule
        for rule in validated.rules
        if rule.effective_from is not None and rule.effective_from > at
    ]
    if len(scheduled_rules) > 1:
        raise DistributionSerializationError("multiple scheduled rules detected")
    scheduled_rule = scheduled_rules[0] if scheduled_rules else None

    return {
        "revision": _required_int(validated.revision, "data.revision"),
        "timezone": _required_string(validated.timezone, "data.timezone"),
        "current": {
            "rule_id": _required_string(current_snapshot.rule_id, "current.rule_id"),
            "label": _optional_string(current_snapshot.rule_label, "current.label"),
            "effective_from": _optional_datetime_iso(
                current_snapshot.effective_from, "current.effective_from"
            ),
            "effective_until": _optional_datetime_iso(
                current_snapshot.effective_until, "current.effective_until"
            ),
            "shares": _serialize_shares(current_snapshot.shares, "current.shares", unit_ids),
            "total_percent": _canonical_decimal(
                current_snapshot.total_percent, "current.total_percent"
            ),
        },
        "scheduled": (
            serialize_configured_distribution_rule(scheduled_rule, unit_ids)
            if scheduled_rule is not None
            else None
        ),
        "history": [
            serialize_configured_distribution_rule(rule, unit_ids)
            for rule in validated.rules
        ],
    }

