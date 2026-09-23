"""Configured credit-distribution domain."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
import math
from types import MappingProxyType
from typing import Any

from .energy_model import EnergyModelError, get_unit_ids

#: Último recurso, para quando nem o Home Assistant sabe o próprio fuso. O
#: mesmo que ``runtime`` usa, de propósito: com dois padrões diferentes, o
#: modelo diria um fuso e o rateio outro.
#:
#: Aqui havia ``America/Sao_Paulo`` — e não como padrão, mas como constante
#: contra a qual o rateio VALIDAVA. Quem instalasse em Manaus, Cuiabá, Belém,
#: Fortaleza ou Rio Branco recebia ``timezone must be America/Sao_Paulo`` e
#: não configurava rateio nenhum. O resto do sistema já lia
#: ``hass.config.time_zone``; o rateio tinha ficado para trás.
FALLBACK_TIMEZONE = "UTC"


class DistributionError(ValueError):
    """Base error for configured distribution."""


class DistributionValidationError(DistributionError):
    """Raised when configured distribution data is invalid."""


class DistributionUnavailableError(DistributionError):
    """Raised when persistent configured distribution is unavailable."""


class DistributionRevisionConflictError(DistributionError):
    """Raised when a mutation uses a stale revision."""


class DistributionFutureRuleError(DistributionError):
    """Raised when a mutation conflicts with a scheduled rule."""


@dataclass(frozen=True)
class ConfiguredDistributionRule:
    """One immutable rule in the configured distribution timeline."""

    id: str
    label: str | None
    effective_from: datetime | None
    effective_until: datetime | None
    shares: Mapping[str, Decimal]
    created_at: datetime


@dataclass(frozen=True)
class DistributionStorageData:
    """Version-independent domain state persisted by the storage adapter."""

    revision: int
    timezone: str
    rules: tuple[ConfiguredDistributionRule, ...]


@dataclass(frozen=True)
class ConfiguredDistributionSnapshot:
    """Configured distribution resolved at one explicit instant."""

    resolved_at: datetime
    rule_id: str
    rule_label: str | None
    effective_from: datetime | None
    effective_until: datetime | None
    shares: Mapping[str, Decimal]
    total_percent: Decimal
    revision: int


def _require_aware(value: Any, field: str) -> datetime:
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise DistributionValidationError(f"{field} must be timezone-aware")
    try:
        offset = value.utcoffset()
    except (OverflowError, ValueError) as error:
        raise DistributionValidationError(
            f"{field} must be timezone-aware"
        ) from error
    if offset is None:
        raise DistributionValidationError(f"{field} must be timezone-aware")
    return value


def parse_datetime(value: Any, field: str) -> datetime:
    """Parse one persisted ISO datetime with an explicit offset."""
    if not isinstance(value, str):
        raise DistributionValidationError(f"{field} must be an ISO 8601 string")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as error:
        raise DistributionValidationError(
            f"{field} must be a valid ISO 8601 string"
        ) from error
    return _require_aware(parsed, field)


def _parse_share(value: Any, field: str) -> Decimal:
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        raise DistributionValidationError(f"{field} must be decimal-compatible")
    if isinstance(value, float) and not math.isfinite(value):
        raise DistributionValidationError(f"{field} must be finite")
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, ValueError) as error:
        raise DistributionValidationError(f"{field} must be decimal-compatible") from error
    if not parsed.is_finite():
        raise DistributionValidationError(f"{field} must be finite")
    if parsed < 0 or parsed > 100:
        raise DistributionValidationError(f"{field} must be between 0 and 100")
    if max(-parsed.as_tuple().exponent, 0) > 4:
        raise DistributionValidationError(f"{field} must have at most 4 decimals")
    return parsed


def validate_timezone(value: Any) -> str:
    """Um fuso IANA de verdade, qualquer que seja.

    O que o rateio precisa garantir é que a linha do tempo carrega um fuso
    utilizável — sem ele, ``effective_from`` não significa instante nenhum.
    QUAL fuso é decisão de quem instala, não deste código.

    Antes isto comparava com uma constante, e quem instalasse fora dela não
    conseguia configurar rateio nenhum.
    """
    if not isinstance(value, str) or not value.strip():
        raise DistributionValidationError("timezone must be a non-empty string")
    from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError) as error:
        raise DistributionValidationError(
            f"timezone must be a valid IANA name: {value!r}"
        ) from error
    return value


def _timezone_of(momento: datetime) -> str | None:
    """O nome IANA que o próprio instante carrega, quando carrega um.

    Um ``datetime`` com ``ZoneInfo`` sabe dizer o nome; um com deslocamento
    fixo, não — e aí não há nome a aproveitar.
    """
    zona = getattr(momento, "tzinfo", None)
    nome = getattr(zona, "key", None)
    return nome if isinstance(nome, str) and nome else None


def validate_unit_ids(unit_ids: Any) -> tuple[str, ...]:
    """Return the configured unit IDs in their declared order."""
    if isinstance(unit_ids, (str, bytes)) or not isinstance(unit_ids, Sequence):
        raise DistributionValidationError("unit_ids must be a sequence of unit IDs")
    expected = tuple(unit_ids)
    if not expected:
        raise DistributionValidationError("unit_ids must be non-empty")
    for unit_id in expected:
        if not isinstance(unit_id, str) or not unit_id.strip():
            raise DistributionValidationError("unit_ids must be non-empty strings")
    if len(set(expected)) != len(expected):
        raise DistributionValidationError("unit_ids must be unique")
    return expected


def validate_shares(value: Any, unit_ids: Sequence[str]) -> Mapping[str, Decimal]:
    """Return immutable, exact shares for the configured logical units."""
    expected = validate_unit_ids(unit_ids)
    if not isinstance(value, Mapping):
        raise DistributionValidationError("shares must be a mapping")
    if set(value) != set(expected):
        raise DistributionValidationError(
            f"shares must contain exactly {', '.join(expected)}"
        )
    shares = {
        unit_id: _parse_share(value[unit_id], f"shares.{unit_id}")
        for unit_id in expected
    }
    if sum(shares.values(), Decimal("0")) != Decimal("100"):
        raise DistributionValidationError("shares must total exactly 100")
    return MappingProxyType(shares)


def validate_storage_data(
    data: DistributionStorageData, unit_ids: Sequence[str]
) -> DistributionStorageData:
    """Validate a complete immutable distribution timeline."""
    expected = validate_unit_ids(unit_ids)
    if isinstance(data.revision, bool) or not isinstance(data.revision, int) or data.revision < 1:
        raise DistributionValidationError("revision must be a positive integer")
    validate_timezone(data.timezone)
    if not isinstance(data.rules, tuple) or not data.rules:
        raise DistributionValidationError("rules must be a non-empty tuple")

    normalized: list[ConfiguredDistributionRule] = []
    seen_ids: set[str] = set()
    for index, rule in enumerate(data.rules):
        if not isinstance(rule, ConfiguredDistributionRule):
            raise DistributionValidationError("rules contain an invalid item")
        if not isinstance(rule.id, str) or not rule.id.strip() or rule.id in seen_ids:
            raise DistributionValidationError("rule ids must be unique non-empty strings")
        if rule.label is not None and (
            not isinstance(rule.label, str) or not rule.label.strip()
        ):
            raise DistributionValidationError("rule label must be null or non-empty")
        if rule.effective_from is not None:
            _require_aware(rule.effective_from, "effective_from")
        if rule.effective_until is not None:
            _require_aware(rule.effective_until, "effective_until")
        _require_aware(rule.created_at, "created_at")
        if index == 0:
            if rule.effective_from is not None:
                raise DistributionValidationError(
                    "the first rule must be unbounded to the past"
                )
        elif rule.effective_from is None:
            raise DistributionValidationError(
                "only the first rule may be unbounded to the past"
            )
        if index < len(data.rules) - 1 and rule.effective_until is None:
            raise DistributionValidationError("only the last rule may be open")
        if index == len(data.rules) - 1 and rule.effective_until is not None:
            raise DistributionValidationError("the last rule must be open")
        if (
            rule.effective_from is not None
            and rule.effective_until is not None
            and rule.effective_from >= rule.effective_until
        ):
            raise DistributionValidationError(
                "effective_from must be earlier than effective_until"
            )
        shares = validate_shares(rule.shares, expected)
        if index:
            previous = normalized[-1]
            if previous.effective_until != rule.effective_from:
                raise DistributionValidationError(
                    "distribution timeline must be contiguous"
                )
        normalized.append(
            ConfiguredDistributionRule(
                id=rule.id,
                label=rule.label,
                effective_from=rule.effective_from,
                effective_until=rule.effective_until,
                shares=shares,
                created_at=rule.created_at,
            )
        )
        seen_ids.add(rule.id)
    return DistributionStorageData(data.revision, data.timezone, tuple(normalized))


def distribution_from_seed(
    model: Mapping[str, Any],
    created_at: datetime,
    *,
    timezone: str | None = None,
) -> DistributionStorageData:
    """Build the deterministic first Store value from the declarative YAML seed.

    ``timezone`` vem da instalação — quem chama lê de ``hass.config.time_zone``.
    Sem ele, o fuso do próprio ``created_at``, que já é consciente; e só em
    último caso o padrão.
    """
    _require_aware(created_at, "created_at")
    try:
        unit_ids = get_unit_ids(model)
    except EnergyModelError as error:
        raise DistributionValidationError(
            "configured units are unavailable in the energy model"
        ) from error
    configuration = model.get("credit_distribution")
    if not isinstance(configuration, Mapping):
        raise DistributionValidationError("credit_distribution must be a mapping")
    history = configuration.get("history")
    if not isinstance(history, Sequence) or isinstance(history, (str, bytes)) or not history:
        raise DistributionValidationError(
            "credit_distribution.history must be a non-empty sequence"
        )
    rules: list[ConfiguredDistributionRule] = []
    for index, raw_rule in enumerate(history):
        if not isinstance(raw_rule, Mapping):
            raise DistributionValidationError("seed rules must be mappings")
        label = raw_rule.get("label")
        start = (
            parse_datetime(raw_rule["from"], "seed.from")
            if "from" in raw_rule
            else None
        )
        end = (
            parse_datetime(raw_rule["until"], "seed.until")
            if "until" in raw_rule
            else None
        )
        rules.append(
            ConfiguredDistributionRule(
                id=f"seed-{index + 1}",
                label=label,
                effective_from=start,
                effective_until=end,
                shares=validate_shares(raw_rule.get("shares"), unit_ids),
                created_at=created_at,
            )
        )
    fuso = timezone or _timezone_of(created_at) or FALLBACK_TIMEZONE
    return validate_storage_data(
        DistributionStorageData(1, fuso, tuple(rules)), unit_ids
    )


def resolve_distribution(
    data: DistributionStorageData, at: datetime, unit_ids: Sequence[str]
) -> ConfiguredDistributionSnapshot:
    """Resolve the [from, until) rule active at an aware instant."""
    _require_aware(at, "at")
    data = validate_storage_data(data, unit_ids)
    for rule in data.rules:
        if (
            (rule.effective_from is None or rule.effective_from <= at)
            and (rule.effective_until is None or at < rule.effective_until)
        ):
            return ConfiguredDistributionSnapshot(
                resolved_at=at,
                rule_id=rule.id,
                rule_label=rule.label,
                effective_from=rule.effective_from,
                effective_until=rule.effective_until,
                shares=rule.shares,
                total_percent=sum(rule.shares.values(), Decimal("0")),
                revision=data.revision,
            )
    raise DistributionValidationError("no distribution rule covers the instant")
