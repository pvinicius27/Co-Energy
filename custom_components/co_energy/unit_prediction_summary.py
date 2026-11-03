"""Build a minimal common summary for existing unit predictions."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .unit_bill_only_estimate import UnitBillOnlyEstimate
from .unit_cycle_forecast import UnitCycleForecast
from .unit_prediction import UnitPrediction


class UnitPredictionSummaryError(ValueError):
    """Raised when a unit prediction cannot be summarized."""


@dataclass(frozen=True)
class UnitPredictionSummary:
    """Minimal fields shared by physical and bill-only predictions."""

    unit_id: str
    classification: str
    quantity: str
    unit: str
    target_start: datetime
    target_end: datetime
    predicted_value: float | None
    # Só na estimativa pela fatura: de qual fatura veio o ritmo, quanto por
    # dia e por quantos dias foi multiplicado. É o que deixa a tela mostrar a
    # conta em vez de um número sem origem — ela não vem de medição.
    basis: dict | None = None


def build_unit_prediction_summary(
    prediction: UnitPrediction | None,
) -> UnitPredictionSummary | None:
    """Project an existing unit prediction onto its minimal common fields."""
    if prediction is None:
        return None
    if isinstance(prediction, UnitCycleForecast):
        return UnitPredictionSummary(
            unit_id=prediction.unit_id,
            classification=prediction.classification,
            quantity=prediction.quantity,
            unit=prediction.unit,
            target_start=prediction.forecast.observed_period.start,
            target_end=prediction.forecast.expected_end,
            predicted_value=prediction.forecast.projected_value,
        )
    if isinstance(prediction, UnitBillOnlyEstimate):
        return UnitPredictionSummary(
            unit_id=prediction.unit_id,
            classification=prediction.classification,
            quantity=prediction.quantity,
            unit=prediction.unit,
            target_start=prediction.estimate.target_period.start,
            target_end=prediction.estimate.target_period.end,
            predicted_value=prediction.estimate.estimated_value,
            basis={
                "billing_reference": prediction.billing_reference,
                "average_daily_value": prediction.estimate.average_daily_value,
                "target_days": prediction.estimate.target_days_equivalent,
            },
        )
    raise UnitPredictionSummaryError("prediction must be a supported unit prediction")
