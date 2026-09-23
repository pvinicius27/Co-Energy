"""Aggregate physical and derived energy metrics for one explicit period."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .energy import EnergyCalculationError, calculate_derived_metric
from .energy_model import (
    EnergyModelError,
    get_derived_metric_definition,
    get_derived_metric_logical_ids,
    get_series_definition,
    get_series_logical_ids,
    get_unit_definition,
)
from .energy_period import (
    EnergyIssueCount,
    EnergyPeriodError,
    async_get_energy_periods,
)
from .periods import Period
from .temporal_evidence import TemporalEvidenceSlice


class UnitEnergySummaryError(ValueError):
    """Raised when a unit energy summary cannot be assembled."""


@dataclass(frozen=True)
class UnitEnergyMetricResult:
    """One measured or derived energy metric in a unit summary."""

    logical_id: str
    label: str
    quantity: str
    unit: str
    classification: str
    value: float | None
    point_count: int | None
    issue_count: int | None
    issue_counts: tuple[EnergyIssueCount, ...] | None = None
    temporal_evidence: tuple[TemporalEvidenceSlice, ...] | None = None


@dataclass(frozen=True)
class UnitEnergySummary:
    """Physical energy metrics for one unit and explicit period."""

    unit_id: str
    period: Period
    statistics_period: str
    metrics: tuple[UnitEnergyMetricResult, ...]


def _required_string(definition: Mapping[str, Any], field: str) -> str:
    value = definition.get(field)
    if not isinstance(value, str) or not value.strip():
        raise UnitEnergySummaryError(f"{field} must be a non-empty string")
    return value


async def async_get_unit_energy_summary(
    hass: Any,
    model: Mapping[str, Any],
    unit_id: str,
    period: Period,
    statistics_period: str,
) -> UnitEnergySummary:
    """Build ordered measured and derived energy metrics for one unit."""
    if not isinstance(period, Period):
        raise UnitEnergySummaryError("period must be a Period")
    try:
        get_unit_definition(model, unit_id)
        series_ids = get_series_logical_ids(model, unit_id)
        derived_ids = get_derived_metric_logical_ids(model, unit_id)
    except EnergyModelError as error:
        raise UnitEnergySummaryError(f"could not resolve unit {unit_id!r}") from error

    duplicates = set(series_ids).intersection(derived_ids)
    if duplicates:
        raise UnitEnergySummaryError(
            f"logical ID exists in series and derived_metrics: {next(iter(duplicates))}"
        )

    try:
        energy_periods = await async_get_energy_periods(
            hass, model, series_ids, period, statistics_period
        )
    except EnergyPeriodError as error:
        raise UnitEnergySummaryError(
            f"could not total energy series for unit {unit_id!r}"
        ) from error

    metrics: list[UnitEnergyMetricResult] = []
    metric_values: dict[str, float | None] = {}
    try:
        for result in energy_periods:
            definition = get_series_definition(model, result.logical_id)
            label = _required_string(definition, "label")
            metrics.append(
                UnitEnergyMetricResult(
                    logical_id=result.logical_id,
                    label=label,
                    quantity=result.quantity,
                    unit=result.unit,
                    classification=result.classification,
                    value=result.value,
                    point_count=result.point_count,
                    issue_count=result.issue_count,
                    issue_counts=result.issue_counts,
                    temporal_evidence=result.temporal_evidence,
                )
            )
            metric_values[result.logical_id.split(".", 1)[1]] = result.value

        for logical_id in derived_ids:
            definition = get_derived_metric_definition(model, logical_id)
            label = _required_string(definition, "label")
            quantity = _required_string(definition, "quantity")
            unit = _required_string(definition, "unit")
            classification = _required_string(definition, "classification")
            formula_id = _required_string(definition, "formula_id")
            value = calculate_derived_metric(formula_id, metric_values)
            metrics.append(
                UnitEnergyMetricResult(
                    logical_id=logical_id,
                    label=label,
                    quantity=quantity,
                    unit=unit,
                    classification=classification,
                    value=value,
                    point_count=None,
                    issue_count=None,
                    issue_counts=None,
                    temporal_evidence=None,
                )
            )
            metric_values[logical_id.split(".", 1)[1]] = value
    except EnergyModelError as error:
        raise UnitEnergySummaryError(
            f"invalid energy model for unit {unit_id!r}"
        ) from error
    except EnergyCalculationError as error:
        raise UnitEnergySummaryError(
            f"could not calculate derived energy for unit {unit_id!r}"
        ) from error

    return UnitEnergySummary(
        unit_id=unit_id,
        period=period,
        statistics_period=statistics_period,
        metrics=tuple(metrics),
    )
