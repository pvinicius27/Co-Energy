"""Persistent manager for configured credit distribution."""

from __future__ import annotations

import asyncio
from collections.abc import Callable, Mapping, Sequence
from dataclasses import replace
from datetime import datetime
from decimal import Decimal
import logging
from pathlib import Path
from typing import Any
from uuid import uuid4
from zoneinfo import ZoneInfo

from .energy_model import get_unit_ids
from .distribution import (
    ConfiguredDistributionRule,
    ConfiguredDistributionSnapshot,
    DistributionFutureRuleError,
    DistributionRevisionConflictError,
    DistributionStorageData,
    DistributionUnavailableError,
    DistributionValidationError,
    FALLBACK_TIMEZONE,
    distribution_from_seed,
    parse_datetime,
    resolve_distribution,
    validate_shares,
    validate_storage_data,
    validate_unit_ids,
)

STORAGE_KEY = "co_energy.distribution"
STORAGE_VERSION = 1

_LOGGER = logging.getLogger(__name__)


def _canonical_decimal(value: Any) -> str:
    text = format(value, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def serialize_storage_data(
    data: DistributionStorageData, unit_ids: Sequence[str]
) -> dict[str, Any]:
    """Serialize validated domain state without float conversion."""
    data = validate_storage_data(data, unit_ids)
    return {
        "revision": data.revision,
        "timezone": data.timezone,
        "rules": [
            {
                "id": rule.id,
                "label": rule.label,
                "effective_from": (
                    rule.effective_from.isoformat()
                    if rule.effective_from is not None
                    else None
                ),
                "effective_until": (
                    rule.effective_until.isoformat()
                    if rule.effective_until is not None
                    else None
                ),
                "shares": {
                    unit_id: _canonical_decimal(share)
                    for unit_id, share in rule.shares.items()
                },
                "created_at": rule.created_at.isoformat(),
            }
            for rule in data.rules
        ],
    }


def deserialize_storage_data(
    value: Any, unit_ids: Sequence[str]
) -> DistributionStorageData:
    """Deserialize and deeply validate one Store payload."""
    if not isinstance(value, Mapping) or set(value) != {
        "revision",
        "timezone",
        "rules",
    }:
        raise DistributionValidationError("invalid distribution Store payload")
    raw_rules = value["rules"]
    if not isinstance(raw_rules, list):
        raise DistributionValidationError("rules must be a list")
    rules: list[ConfiguredDistributionRule] = []
    for raw_rule in raw_rules:
        if not isinstance(raw_rule, Mapping) or set(raw_rule) != {
            "id",
            "label",
            "effective_from",
            "effective_until",
            "shares",
            "created_at",
        }:
            raise DistributionValidationError("invalid persisted rule")
        rules.append(
            ConfiguredDistributionRule(
                id=raw_rule["id"],
                label=raw_rule["label"],
                effective_from=(
                    parse_datetime(raw_rule["effective_from"], "effective_from")
                    if raw_rule["effective_from"] is not None
                    else None
                ),
                effective_until=(
                    parse_datetime(raw_rule["effective_until"], "effective_until")
                    if raw_rule["effective_until"] is not None
                    else None
                ),
                shares=validate_shares(raw_rule["shares"], unit_ids),
                created_at=parse_datetime(raw_rule["created_at"], "created_at"),
            )
        )
    return validate_storage_data(
        DistributionStorageData(
            revision=value["revision"],
            timezone=value["timezone"],
            rules=tuple(rules),
        ),
        unit_ids,
    )


class DistributionManager:
    """Serialize durable distribution mutations and expose valid snapshots only."""

    def __init__(
        self,
        store: Any,
        data: DistributionStorageData | None,
        unit_ids: Sequence[str],
        *,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._store = store
        self._data = data
        self._unit_ids = validate_unit_ids(unit_ids)
        # O fuso da linha do tempo gravada, nao um fixo: e nele que
        # `effective_from` foi escrito, e e nele que "agora" precisa ser lido
        # para os dois se compararem.
        self._clock = clock or (lambda: datetime.now(ZoneInfo(self._zona())))
        self._lock = asyncio.Lock()

    @property
    def unit_ids(self) -> tuple[str, ...]:
        """Return the configured unit IDs this manager validates against."""
        return self._unit_ids

    @property
    def available(self) -> bool:
        """Return whether validated persistent state is available."""
        return self._data is not None

    @property
    def revision(self) -> int | None:
        """Return current revision, or null while unavailable."""
        return None if self._data is None else self._data.revision

    @property
    def data(self) -> DistributionStorageData:
        """Return validated immutable state."""
        if self._data is None:
            raise DistributionUnavailableError("configured distribution is unavailable")
        return self._data

    def resolve_distribution(self, at: datetime) -> ConfiguredDistributionSnapshot:
        """Resolve configured distribution from the current immutable state."""
        return resolve_distribution(self.data, at, self._unit_ids)

    def _now(self) -> datetime:
        now = self._clock()
        if now.tzinfo is None or now.utcoffset() is None:
            raise DistributionValidationError("manager clock must be timezone-aware")
        return now.astimezone(ZoneInfo(self._zona()))

    def _zona(self) -> str:
        """O fuso da linha do tempo gravada, ou o padrao enquanto nao ha uma."""
        dados = self._data
        fuso = getattr(dados, "timezone", None) if dados is not None else None
        return fuso if isinstance(fuso, str) and fuso else FALLBACK_TIMEZONE

    def _check_revision(self, expected_revision: int) -> None:
        if isinstance(expected_revision, bool) or not isinstance(expected_revision, int):
            raise DistributionRevisionConflictError("expected_revision is invalid")
        if expected_revision != self.data.revision:
            raise DistributionRevisionConflictError("distribution revision conflict")

    async def _persist(self, candidate: DistributionStorageData) -> None:
        candidate = validate_storage_data(candidate, self._unit_ids)
        await self._store.async_save(
            serialize_storage_data(candidate, self._unit_ids)
        )
        self._data = candidate

    async def async_set_distribution_immediate(
        self,
        shares: Mapping[str, Any],
        *,
        expected_revision: int,
        label: str | None = None,
    ) -> ConfiguredDistributionSnapshot:
        """Create an immediate rule at backend time, unless one is scheduled."""
        normalized_shares = validate_shares(shares, self._unit_ids)
        async with self._lock:
            self._check_revision(expected_revision)
            now = self._now()
            data = self.data
            if any(
                rule.effective_from is not None and rule.effective_from > now
                for rule in data.rules
            ):
                raise DistributionFutureRuleError(
                    "cancel the future rule before an immediate change"
                )
            if not data.rules:
                # O primeiro rateio de quem tem duas ou mais unidades. Não há
                # regra vigente para encerrar, e o que se informa agora é tudo
                # o que se sabe: vale desde sempre, como a regra automática de
                # quem tem uma unidade só. Sem este caminho, o rateio pendente
                # nunca deixava de ser pendente — gravar era recusado por
                # "nenhuma regra cobre o instante".
                candidate = DistributionStorageData(
                    data.revision + 1, data.timezone,
                    (ConfiguredDistributionRule(
                        id=str(uuid4()), label=label, effective_from=None,
                        effective_until=None, shares=normalized_shares,
                        created_at=now,
                    ),),
                )
                await self._persist(candidate)
                return resolve_distribution(candidate, now, self._unit_ids)
            current = resolve_distribution(data, now, self._unit_ids)
            rules = list(data.rules)
            current_index = next(
                index for index, rule in enumerate(rules) if rule.id == current.rule_id
            )
            rules[current_index] = replace(rules[current_index], effective_until=now)
            rules.append(
                ConfiguredDistributionRule(
                    id=str(uuid4()),
                    label=label,
                    effective_from=now,
                    effective_until=None,
                    shares=normalized_shares,
                    created_at=now,
                )
            )
            candidate = DistributionStorageData(
                data.revision + 1, data.timezone, tuple(rules)
            )
            await self._persist(candidate)
            return resolve_distribution(candidate, now, self._unit_ids)

    async def async_schedule_distribution(
        self,
        shares: Mapping[str, Any],
        effective_from: datetime,
        *,
        expected_revision: int,
        label: str | None = None,
    ) -> ConfiguredDistributionSnapshot:
        """Schedule the single allowed future rule."""
        normalized_shares = validate_shares(shares, self._unit_ids)
        if (
            not isinstance(effective_from, datetime)
            or effective_from.tzinfo is None
            or effective_from.utcoffset() is None
        ):
            raise DistributionValidationError("effective_from must be timezone-aware")
        effective_from = effective_from.astimezone(ZoneInfo(self._zona()))
        async with self._lock:
            self._check_revision(expected_revision)
            now = self._now()
            if effective_from <= now:
                raise DistributionFutureRuleError(
                    "scheduled effective_from must be in the future"
                )
            data = self.data
            if any(
                rule.effective_from is not None and rule.effective_from > now
                for rule in data.rules
            ):
                raise DistributionFutureRuleError("a future rule already exists")
            if not data.rules:
                # Agendar exige uma regra vigente até a data: sem ela, o
                # intervalo de hoje até lá ficaria sem rateio nenhum.
                raise DistributionFutureRuleError(
                    "inform the current distribution before scheduling one"
                )
            current = resolve_distribution(data, now, self._unit_ids)
            rules = list(data.rules)
            current_index = next(
                index for index, rule in enumerate(rules) if rule.id == current.rule_id
            )
            rules[current_index] = replace(
                rules[current_index], effective_until=effective_from
            )
            rules.append(
                ConfiguredDistributionRule(
                    id=str(uuid4()),
                    label=label,
                    effective_from=effective_from,
                    effective_until=None,
                    shares=normalized_shares,
                    created_at=now,
                )
            )
            candidate = DistributionStorageData(
                data.revision + 1, data.timezone, tuple(rules)
            )
            await self._persist(candidate)
            return resolve_distribution(candidate, effective_from, self._unit_ids)

    async def async_cancel_scheduled_distribution(
        self, *, expected_revision: int
    ) -> ConfiguredDistributionSnapshot:
        """Cancel the single not-yet-effective rule and reopen the current rule."""
        async with self._lock:
            self._check_revision(expected_revision)
            now = self._now()
            data = self.data
            future_indexes = [
                index
                for index, rule in enumerate(data.rules)
                if rule.effective_from is not None and rule.effective_from > now
            ]
            if len(future_indexes) != 1:
                raise DistributionFutureRuleError("no future rule is scheduled")
            future_index = future_indexes[0]
            if future_index != len(data.rules) - 1:
                raise DistributionValidationError("future rule must be last")
            rules = list(data.rules[:-1])
            rules[-1] = replace(rules[-1], effective_until=None)
            candidate = DistributionStorageData(
                data.revision + 1, data.timezone, tuple(rules)
            )
            await self._persist(candidate)
            return resolve_distribution(candidate, now, self._unit_ids)


def _timezone_do_hass(hass: Any) -> str:
    """O fuso configurado no Home Assistant, que a casa já declarou uma vez.

    Gêmeo do que existe em ``runtime``, e repetido de propósito: importá-lo de
    lá fecharia um ciclo, porque ``runtime`` importa este módulo. São três
    linhas; o ciclo custaria mais.
    """
    fuso = getattr(getattr(hass, "config", None), "time_zone", None)
    return fuso if isinstance(fuso, str) and fuso.strip() else FALLBACK_TIMEZONE


async def async_build_distribution_manager(
    hass: Any,
    model: Mapping[str, Any],
    *,
    clock: Callable[[], datetime] | None = None,
    store: Any | None = None,
    store_existed: bool | None = None,
) -> DistributionManager:
    """Load Store authority or seed it exactly once on proven first install."""
    unit_ids = get_unit_ids(model)
    if store is None:
        from homeassistant.helpers.storage import Store

        store = Store(
            hass,
            STORAGE_VERSION,
            STORAGE_KEY,
            atomic_writes=True,
        )
    if store_existed is None:
        config_path = getattr(getattr(hass, "config", None), "path", None)
        executor = getattr(hass, "async_add_executor_job", None)
        if not callable(config_path) or not callable(executor):
            raise DistributionUnavailableError(
                "cannot determine whether distribution Store existed"
            )
        path = Path(config_path(".storage", STORAGE_KEY))
        store_existed = await executor(path.is_file)

    try:
        raw_data = await store.async_load()
    except Exception:
        _LOGGER.error("Could not load configured distribution Store", exc_info=True)
        return DistributionManager(store, None, unit_ids, clock=clock)

    if raw_data is not None:
        try:
            data = deserialize_storage_data(raw_data, unit_ids)
        except DistributionValidationError:
            # Quase sempre isto e uma unidade criada ou removida depois do
            # ultimo rateio, e nao um Store corrompido. Desistir aqui derruba
            # junto o payback, que sem rateio considera so a geradora — muito
            # dano para uma divergencia que se resolve dando zero a quem
            # chegou.
            data = await _async_reconcile_stored(store, raw_data, unit_ids)
            if data is None:
                _LOGGER.error(
                    "Configured distribution Store is semantically invalid"
                )
                return DistributionManager(store, None, unit_ids, clock=clock)
        data = await _async_seed_single_unit(store, data, unit_ids, clock)
        return DistributionManager(store, data, unit_ids, clock=clock)

    if store_existed:
        _LOGGER.error("Existing configured distribution Store could not be loaded")
        return DistributionManager(store, None, unit_ids, clock=clock)

    fuso = _timezone_do_hass(hass)
    bootstrap_clock = clock or (lambda: datetime.now(ZoneInfo(fuso)))
    try:
        agora = bootstrap_clock()
        data = distribution_from_seed(model, agora, timezone=fuso)
        # A integração pode subir pela primeira vez já com uma unidade — é o
        # que o assistente de instalação faz. Sem isto ela nasceria com o
        # rateio pendente, e só ganharia os 100% no boot seguinte.
        data = single_unit_rule(data, unit_ids, agora)
        await store.async_save(serialize_storage_data(data, unit_ids))
    except Exception:
        _LOGGER.error("Could not bootstrap configured distribution Store", exc_info=True)
        return DistributionManager(store, None, unit_ids, clock=clock)
    return DistributionManager(store, data, unit_ids, clock=clock)


def reconcile_shares_with_units(
    data: DistributionStorageData, unit_ids: Sequence[str]
) -> DistributionStorageData:
    """Return the same timeline, with the shares listing exactly these units.

    O rateio exige que cada regra liste exatamente as unidades do modelo, e com
    razao: uma unidade fora da lista nao teria percentual nenhum, e ninguem
    saberia se isso e zero ou esquecimento. So que isso transforma criar uma
    unidade num ato que **invalida o rateio inteiro** — e, com ele, o payback,
    que sem rateio considera so a geradora, e a composicao do ciclo.

    A unidade nova entra com **zero** em todas as regras, inclusive nas
    historicas, porque e o que de fato aconteceu: ela nao existia e nao
    recebeu credito nenhum. A removida sai. Nenhum percentual ja definido
    muda, entao a soma continua sendo a que o operador escolheu.
    """
    desejadas = tuple(unit_ids)
    regras = []
    mudou = False
    for regra in data.rules:
        atuais = dict(regra.shares)
        novas = {
            unit_id: atuais.get(unit_id, Decimal("0")) for unit_id in desejadas
        }
        if novas != atuais:
            mudou = True
        regras.append(replace(regra, shares=novas))

    if not mudou:
        return data
    return replace(data, rules=tuple(regras))


def _stored_unit_ids(raw_data: Any) -> tuple[str, ...] | None:
    """Return the units the stored payload itself declares, in order."""
    if not isinstance(raw_data, Mapping):
        return None
    rules = raw_data.get("rules")
    if not isinstance(rules, (list, tuple)):
        return None
    # Sem regra, nao ha unidade declarada no payload — e isso e um rateio
    # ainda nao informado, nao um Store ilegivel.
    if not rules:
        return ()
    primeira = rules[0]
    if not isinstance(primeira, Mapping):
        return None
    shares = primeira.get("shares")
    if not isinstance(shares, Mapping) or not shares:
        return None
    return tuple(str(unit_id) for unit_id in shares)


def share_blocking_removal(
    data: DistributionStorageData | None, unit_id: str, unit_ids: Sequence[str]
) -> Decimal | None:
    """O maior percentual que a unidade tem em alguma regra, se impedir a saida.

    Excluir uma unidade com credito atribuido deixaria as outras somando menos
    de 100 — e o rateio inteiro invalido, levando junto fluxo energetico e
    payback. Pior: a regra historica que ela carrega e a que explica as
    faturas fechadas daquele periodo, e apaga-la reescreveria o passado.

    Por isso a saida espera o percentual ir a zero. Duas excecoes, porque nelas
    nao ha o que preservar: a ultima unidade (sem ninguem, nao ha rateio), e
    a regra automatica de unidade unica, que ninguem escolheu.
    """
    if data is None or not data.rules:
        return None
    if len(tuple(unit_ids)) <= 1:
        return None
    maior = Decimal("0")
    for regra in data.rules:
        if regra.id == "unica":
            continue
        valor = Decimal(regra.shares.get(unit_id, Decimal("0")))
        if valor > maior:
            maior = valor
    return maior if maior > 0 else None


def single_unit_rule(
    data: DistributionStorageData, unit_ids: Sequence[str], now: datetime
) -> DistributionStorageData:
    """Com uma unidade so, o unico rateio possivel: 100% para ela.

    Nao e decisao de ninguem — os percentuais precisam listar exatamente as
    unidades e somar 100, e com uma unidade so ha uma resposta. Perguntar
    seria fazer alguem digitar "100" para descobrir que nao havia escolha.

    So age sobre linha do tempo VAZIA. Com duas ou mais unidades o rateio e
    escolha, e continua pendente ate alguem informar.
    """
    unidades = tuple(unit_ids)
    if data.rules or len(unidades) != 1:
        return data
    regra = ConfiguredDistributionRule(
        id="unica",
        label="Unidade única",
        effective_from=None,
        effective_until=None,
        shares=validate_shares({unidades[0]: "100"}, unidades),
        created_at=now,
    )
    return validate_storage_data(replace(data, rules=(regra,)), unidades)


async def _async_seed_single_unit(
    store: Any,
    data: DistributionStorageData,
    unit_ids: Sequence[str],
    clock: Callable[[], datetime] | None,
) -> DistributionStorageData:
    agora = (clock or (lambda: datetime.now(ZoneInfo(data.timezone))))()
    semeado = single_unit_rule(data, unit_ids, agora)
    if semeado is data:
        return data
    try:
        await store.async_save(serialize_storage_data(semeado, unit_ids))
    except Exception:
        _LOGGER.error("Could not store the single unit distribution", exc_info=True)
    return semeado


async def _async_reconcile_stored(
    store: Any, raw_data: Any, unit_ids: Sequence[str]
) -> DistributionStorageData | None:
    """Re-read the payload on its own terms and adapt it to the model.

    Devolve None quando nem assim da para ler: ai o Store esta mesmo
    inconsistente, e nao apenas desatualizado em relacao as unidades.
    """
    anteriores = _stored_unit_ids(raw_data)
    if anteriores is None:
        return None
    try:
        antiga = deserialize_storage_data(raw_data, anteriores)
        # Sem unidade nenhuma nao ha o que ratear: a linha do tempo volta a
        # vazia. Sem isto, excluir a ultima unidade deixava uma regra sem dono
        # que nunca mais validava — e o rateio de tudo que fosse criado
        # depois nascia quebrado.
        if not tuple(unit_ids):
            data = replace(antiga, rules=())
        else:
            data = reconcile_shares_with_units(antiga, unit_ids)
            # A regra automatica de unidade unica ninguem escolheu. Se a
            # unidade que ela favorecia saiu, ela deixa de somar 100 e nao
            # descreve mais nada: sai junto, e a unidade que sobrou recebe a
            # sua propria regra automatica, ou o rateio fica pendente.
            data = replace(data, rules=tuple(
                regra for regra in data.rules
                if regra.id != "unica"
                or sum(regra.shares.values(), Decimal("0")) == Decimal("100")
            ))
        payload = serialize_storage_data(data, unit_ids)
    except DistributionValidationError:
        return None
    try:
        await store.async_save(payload)
    except Exception:
        # Gravar e o que torna a correcao permanente, mas nao e o que a torna
        # valida: com o rateio ja reconciliado em memoria, a tela volta a
        # funcionar agora e a gravacao se resolve na proxima mudanca.
        _LOGGER.error("Could not store the reconciled distribution", exc_info=True)
    _LOGGER.warning(
        "Configured distribution adjusted to the current units: %s",
        ", ".join(unit_ids),
    )
    return data
