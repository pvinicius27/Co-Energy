"""Historical statistics for the instantaneous measurements of one unit.

O Recorder do Home Assistant ja calcula media, minimo e maximo por intervalo
para sensores de medicao. Este modulo apenas le esse calculo e o devolve na
unidade que o modelo declara — nao reamostra, nao interpola e nao inventa
ponto onde o Recorder nao gravou nenhum.

A janela e explicita e sempre fechada em [start, end): um maximo sem o
intervalo a que pertence nao significa nada.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from .energy_model import (
    EnergyModelError,
    get_measurement_definition,
    get_measurement_logical_ids,
)
from .logical_state import normalize_measurement_value
from .recorder_adapter import RecorderAdapterError, async_get_statistics

# Energia fica de fora: e um contador acumulado, e media/minimo/maximo de um
# contador descrevem a posicao do ponteiro, nao a grandeza. O historico de
# energia ja tem caminho proprio, em history.py.
INSTANT_QUANTITIES = frozenset(
    {"voltage", "current", "power", "power_factor", "frequency"}
)
RESOLUTION = "5minute"
WINDOW = timedelta(hours=24)
STATISTICS_TYPES = frozenset({"mean", "min", "max"})


class InstantStatisticsError(ValueError):
    """Raised when instantaneous statistics cannot be built."""


class InstantStatisticsUnknownUnitError(InstantStatisticsError):
    """Raised when the requested unit does not exist."""


class InstantStatisticsUnavailableError(InstantStatisticsError):
    """Raised when the unit declares no instantaneous measurement."""


@dataclass(frozen=True)
class InstantStatisticsPoint:
    """Media de um intervalo nativo do Recorder."""

    start: datetime
    mean: float | None


@dataclass(frozen=True)
class InstantMeasurementStatistics:
    """Serie e extremos de uma grandeza instantanea na janela pedida."""

    logical_id: str
    label: str
    quantity: str
    unit: str | None
    minimum: float | None
    maximum: float | None
    points: tuple[InstantStatisticsPoint, ...]

    def __post_init__(self) -> None:
        if not isinstance(self.logical_id, str) or not self.logical_id.strip():
            raise InstantStatisticsError("logical_id must be a non-empty string")
        if self.quantity not in INSTANT_QUANTITIES:
            raise InstantStatisticsError(f"unsupported quantity: {self.quantity}")
        if (
            self.minimum is not None
            and self.maximum is not None
            and self.minimum > self.maximum
        ):
            raise InstantStatisticsError("minimum must not exceed maximum")


@dataclass(frozen=True)
class InstantStatistics:
    """Resultado por unidade, com a janela que produziu os numeros."""

    unit_id: str
    period_start: datetime
    period_end: datetime
    resolution: str
    measurements: tuple[InstantMeasurementStatistics, ...]

    def __post_init__(self) -> None:
        for field in ("period_start", "period_end"):
            value = getattr(self, field)
            if not isinstance(value, datetime) or value.tzinfo is None:
                raise InstantStatisticsError(f"{field} must be timezone-aware")
        if self.period_start >= self.period_end:
            raise InstantStatisticsError("period_end must be later than period_start")
        if self.resolution != RESOLUTION:
            raise InstantStatisticsError(f"unsupported resolution: {self.resolution}")


def build_window(now: datetime) -> tuple[datetime, datetime]:
    """Janela fechada de 24 horas terminando em now."""
    if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
        raise InstantStatisticsError("now must be a timezone-aware datetime")
    end = now.astimezone(timezone.utc)
    return end - WINDOW, end


def _optional_string(definition: Mapping[str, Any], field: str) -> str | None:
    value = definition.get(field)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise InstantStatisticsError(f"{field} must be a non-empty string or None")
    return value


def _required_string(definition: Mapping[str, Any], field: str) -> str:
    value = definition.get(field)
    if not isinstance(value, str) or not value.strip():
        raise InstantStatisticsError(f"{field} must be a non-empty string")
    return value


def build_measurement_statistics(
    logical_id: str,
    label: str,
    quantity: str,
    unit: str | None,
    state_unit: str | None,
    points: Sequence[Any],
) -> InstantMeasurementStatistics:
    """Converte os pontos do Recorder para a unidade declarada e extrai extremos.

    O minimo da janela e o menor dos minimos de cada intervalo, e o maximo o
    maior dos maximos — nao o extremo das medias. A media de um intervalo ja
    e um alisamento; tirar o extremo dela esconderia justamente o pico que se
    quer ver.
    """
    convertido: list[InstantStatisticsPoint] = []
    minimos: list[float] = []
    maximos: list[float] = []
    for ponto in points:
        media = normalize_measurement_value(
            quantity, unit, state_unit, getattr(ponto, "mean", None)
        )
        convertido.append(
            InstantStatisticsPoint(start=getattr(ponto, "start"), mean=media)
        )
        minimo = normalize_measurement_value(
            quantity, unit, state_unit, getattr(ponto, "min", None)
        )
        maximo = normalize_measurement_value(
            quantity, unit, state_unit, getattr(ponto, "max", None)
        )
        if minimo is not None:
            minimos.append(minimo)
        if maximo is not None:
            maximos.append(maximo)
    return InstantMeasurementStatistics(
        logical_id=logical_id,
        label=label,
        quantity=quantity,
        unit=unit,
        minimum=min(minimos) if minimos else None,
        maximum=max(maximos) if maximos else None,
        points=tuple(convertido),
    )


def instant_measurement_ids(model: Mapping[str, Any], unit_id: str) -> tuple[str, ...]:
    """Os logical_ids de grandeza instantanea da unidade, na ordem do modelo."""
    try:
        candidatos = get_measurement_logical_ids(model, unit_id)
    except EnergyModelError as error:
        raise InstantStatisticsUnknownUnitError(
            "requested unit does not exist"
        ) from error
    selecionados: list[str] = []
    for logical_id in candidatos:
        definition = get_measurement_definition(model, logical_id)
        if _required_string(definition, "quantity") in INSTANT_QUANTITIES:
            selecionados.append(logical_id)
    return tuple(selecionados)


async def async_build_instant_statistics(
    hass: Any,
    model: Mapping[str, Any],
    unit_id: str,
    now: datetime,
    state_units: Mapping[str, str | None] | None = None,
) -> InstantStatistics:
    """Le o Recorder e monta as estatisticas das grandezas instantaneas.

    state_units traz a unidade que a entidade reporta hoje, por logical_id.
    Ela nao vem do Recorder: a estatistica guarda o numero, e a conversao para
    a unidade do modelo e a mesma que o valor instantaneo sofre.
    """
    logical_ids = instant_measurement_ids(model, unit_id)
    if not logical_ids:
        raise InstantStatisticsUnavailableError(
            "unit declares no instantaneous measurement"
        )
    start, end = build_window(now)
    unidades = state_units or {}

    medicoes: list[InstantMeasurementStatistics] = []
    for logical_id in logical_ids:
        definition = get_measurement_definition(model, logical_id)
        entity_id = _required_string(definition, "entity_id")
        try:
            resultado = await async_get_statistics(
                hass, entity_id, start, end, RESOLUTION, STATISTICS_TYPES
            )
        except RecorderAdapterError as error:
            raise InstantStatisticsError(
                f"could not read statistics for {logical_id}"
            ) from error
        medicoes.append(
            build_measurement_statistics(
                logical_id=logical_id,
                label=_required_string(definition, "label"),
                quantity=_required_string(definition, "quantity"),
                unit=_optional_string(definition, "unit"),
                state_unit=unidades.get(logical_id),
                points=resultado.points,
            )
        )

    return InstantStatistics(
        unit_id=unit_id,
        period_start=start,
        period_end=end,
        resolution=RESOLUTION,
        measurements=tuple(medicoes),
    )
