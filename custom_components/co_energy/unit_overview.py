"""Coordinate the minimal existing objects for one unit overview."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from .equatorial_adapter import EquatorialDocument
from .quality_evidence import (
    QualityEvidenceError,
    UnitQualityEvidence,
    build_unit_quality_evidence,
)
from .unit_cycle_energy import (
    UnitCycleEnergyContext,
    UnitCycleEnergyError,
    async_get_unit_cycle_energy,
)
from .unit_prediction import (
    UnitPredictionError,
    build_unit_prediction,
)
from .unit_prediction_summary import (
    UnitPredictionSummary,
    UnitPredictionSummaryError,
    build_unit_prediction_summary,
)
from .unit_snapshot import UnitSnapshot, UnitSnapshotError, get_unit_snapshot


class UnitOverviewError(ValueError):
    """Raised when a unit overview cannot be assembled."""


@dataclass(frozen=True)
class UnitOverview:
    """Minimal aggregate of existing objects for one unit overview."""

    snapshot: UnitSnapshot
    cycle_energy: UnitCycleEnergyContext
    prediction: UnitPredictionSummary | None
    quality_evidence: UnitQualityEvidence


async def async_get_unit_overview(
    hass: Any,
    model: Mapping[str, Any],
    billing_document: EquatorialDocument,
    unit_id: str,
    now: datetime,
    statistics_period: str,
) -> UnitOverview:
    """Assemble the existing minimal overview objects for one unit."""
    try:
        snapshot = get_unit_snapshot(
            hass,
            model,
            billing_document,
            unit_id,
        )
    except UnitSnapshotError as error:
        raise UnitOverviewError(
            f"could not build snapshot for unit {unit_id!r}"
        ) from error

    try:
        cycle_energy = await async_get_unit_cycle_energy(
            hass,
            model,
            billing_document,
            unit_id,
            now,
            statistics_period,
        )
    except UnitCycleEnergyError as error:
        raise UnitOverviewError(
            f"could not build cycle energy for unit {unit_id!r}"
        ) from error

    try:
        prediction_source = build_unit_prediction(model, cycle_energy)
    except UnitPredictionError as error:
        raise UnitOverviewError(
            f"could not build prediction for unit {unit_id!r}"
        ) from error

    try:
        prediction = build_unit_prediction_summary(prediction_source)
    except UnitPredictionSummaryError as error:
        raise UnitOverviewError(
            f"could not summarize prediction for unit {unit_id!r}"
        ) from error

    try:
        quality_evidence = build_unit_quality_evidence(snapshot, cycle_energy)
    except QualityEvidenceError as error:
        raise UnitOverviewError(
            f"could not build quality evidence for unit {unit_id!r}"
        ) from error

    if snapshot.unit_id != unit_id:
        raise UnitOverviewError(f"snapshot unit ID does not match unit {unit_id!r}")
    if cycle_energy.unit_id != unit_id:
        raise UnitOverviewError(f"cycle energy unit ID does not match unit {unit_id!r}")
    if prediction is not None and prediction.unit_id != unit_id:
        raise UnitOverviewError(f"prediction unit ID does not match unit {unit_id!r}")
    if quality_evidence.unit_id != unit_id:
        raise UnitOverviewError(
            f"quality evidence unit ID does not match unit {unit_id!r}"
        )

    return UnitOverview(
        snapshot=snapshot,
        cycle_energy=cycle_energy,
        prediction=prediction,
        quality_evidence=quality_evidence,
    )
