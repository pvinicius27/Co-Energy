"""Pure physical energy calculations for CoEnergy."""

from __future__ import annotations

from collections.abc import Mapping
import math
from typing import Any

from .logical_series import LogicalSeriesResult


class EnergyCalculationError(ValueError):
    """Raised when an energy calculation receives an invalid value."""


def _validate_energy_value(value: Any, field: str) -> float | None:
    """Validate and normalize one optional non-negative energy value."""
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise EnergyCalculationError(f"{field} must be numeric or None")
    normalized = float(value)
    if not math.isfinite(normalized):
        raise EnergyCalculationError(f"{field} must be finite")
    if normalized < 0:
        raise EnergyCalculationError(f"{field} must be non-negative")
    return normalized


def sum_logical_series(series: LogicalSeriesResult) -> float | None:
    """Sum accepted logical-series points without interpreting issues."""
    if not series.points:
        return None
    values = (
        _validate_energy_value(point.value, f"points[{index}].value")
        for index, point in enumerate(series.points)
    )
    return math.fsum(value for value in values if value is not None)


def calculate_self_consumption(
    generation: float | int | None,
    exported: float | int | None,
) -> float | None:
    """Calculate ``max(generation - exported, 0)``."""
    generation_value = _validate_energy_value(generation, "generation")
    exported_value = _validate_energy_value(exported, "exported")
    if generation_value is None or exported_value is None:
        return None
    return float(max(generation_value - exported_value, 0.0))


def calculate_physical_consumption(
    imported: float | int | None,
    self_consumption: float | int | None,
) -> float | None:
    """Calculate physical consumption as import plus self-consumption."""
    imported_value = _validate_energy_value(imported, "imported")
    self_consumption_value = _validate_energy_value(
        self_consumption, "self_consumption"
    )
    if imported_value is None or self_consumption_value is None:
        return None
    return float(imported_value + self_consumption_value)


def _required_value(values: Mapping[str, Any], key: str) -> Any:
    if key not in values:
        raise EnergyCalculationError(f"missing required value: {key}")
    return values[key]


#: De que metricas cada formula depende, na ordem em que entram na conta.
#:
#: Estava implicito: quem montava a serie historica carregava a propria tabela
#: de dependencias, escrita com o nome de uma unidade. A formula e quem sabe do
#: que precisa, entao a lista mora aqui, ao lado de quem a executa.
#:
#: Os nomes sao de metrica, sem unidade: quem monta o ID logico completo e o
#: chamador, que sabe de qual unidade esta falando.
FORMULA_DEPENDENCIES: dict[str, tuple[str, ...]] = {
    "solar_self_consumption": ("generation_energy", "export_energy"),
    "solar_physical_consumption": ("import_energy", "self_consumption"),
}


def get_formula_dependencies(formula_id: str) -> tuple[str, ...]:
    """Return the metrics one formula consumes, in order."""
    if formula_id not in FORMULA_DEPENDENCIES:
        raise EnergyCalculationError(f"unknown formula_id: {formula_id}")
    return FORMULA_DEPENDENCIES[formula_id]


def calculate_derived_metric(
    formula_id: str,
    values: Mapping[str, float | int | None],
) -> float | None:
    """Execute one explicitly approved derived-energy formula.

    As formulas sao de geracao solar, nao desta casa: autoconsumo e o que foi
    gerado e nao saiu para a rede, e consumo fisico e o que entrou mais esse
    autoconsumo. Valem para qualquer instalacao que meca geracao, exportacao e
    importacao — por isso os identificadores dizem "solar", e nao o nome de uma
    unidade em particular.
    """
    if not isinstance(values, Mapping):
        raise EnergyCalculationError("values must be a mapping")
    if formula_id == "solar_self_consumption":
        return calculate_self_consumption(
            _required_value(values, "generation_energy"),
            _required_value(values, "export_energy"),
        )
    if formula_id == "solar_physical_consumption":
        return calculate_physical_consumption(
            _required_value(values, "import_energy"),
            _required_value(values, "self_consumption"),
        )
    raise EnergyCalculationError(f"unknown formula_id: {formula_id}")
