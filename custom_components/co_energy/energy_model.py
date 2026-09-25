"""Load and structurally validate the CoEnergy energy model."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
import math
from numbers import Real
from pathlib import Path
from typing import Any

from .equatorial_adapter import is_uc_hash


class EnergyModelError(ValueError):
    """Raised when the CoEnergy model is structurally invalid."""


@dataclass(frozen=True)
class AuditPairDefinition:
    """Declarative association between a logical metric and official source."""

    logical_id: str
    official_source: str


@dataclass(frozen=True)
class CoverageQualityPolicy:
    """Validated thresholds for closed-cycle energy evidence quality."""

    observation_coverage_ratio_min: float
    acceptance_ratio_min: float
    require_no_missing_observations: bool
    max_contiguous_rejected_duration_seconds: float
    preserve_observed_value: bool
    extrapolate_missing_energy: bool
    missing_value_is_zero: bool


def build_logical_id(unit_id: str, metric_id: str) -> str:
    """Build a CoEnergy logical identifier from its two components."""
    if not isinstance(unit_id, str) or not unit_id or "." in unit_id:
        raise EnergyModelError("unit_id must be a non-empty string without dots")
    if not isinstance(metric_id, str) or not metric_id or "." in metric_id:
        raise EnergyModelError("metric_id must be a non-empty string without dots")
    return f"{unit_id}.{metric_id}"


def _require_mapping(value: Any, field: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise EnergyModelError(f"{field} must be a mapping")
    return value


def _require_non_empty_string(value: Any, field: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise EnergyModelError(f"{field} must be a non-empty string")


def _require_string(value: Any, field: str) -> None:
    if not isinstance(value, str):
        raise EnergyModelError(f"{field} must be a string")


def _require_number(value: Any, field: str) -> None:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise EnergyModelError(f"{field} must be numeric")


def _parse_aware_datetime(value: Any, field: str) -> datetime:
    if not isinstance(value, str):
        raise EnergyModelError(f"{field} must be an ISO 8601 string")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as error:
        raise EnergyModelError(f"{field} must be a valid ISO 8601 string") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise EnergyModelError(f"{field} must include a timezone offset")
    return parsed


def _validate_source(source: Any, field: str) -> None:
    source = _require_mapping(source, field)
    _require_non_empty_string(source.get("entity_id"), f"{field}.entity_id")

    if "label" in source:
        _require_string(source["label"], f"{field}.label")
    if "skip_first_change" in source and not isinstance(
        source["skip_first_change"], bool
    ):
        raise EnergyModelError(f"{field}.skip_first_change must be boolean")
    if "max_change" in source:
        _require_number(source["max_change"], f"{field}.max_change")
        if source["max_change"] <= 0:
            raise EnergyModelError(f"{field}.max_change must be positive")

    start = (
        _parse_aware_datetime(source["from"], f"{field}.from")
        if "from" in source
        else None
    )
    end = (
        _parse_aware_datetime(source["until"], f"{field}.until")
        if "until" in source
        else None
    )
    if start is not None and end is not None and start >= end:
        raise EnergyModelError(f"{field}.from must be earlier than {field}.until")


def _validate_series(series: Any, field: str) -> None:
    series = _require_mapping(series, field)
    for name in ("label", "quantity", "unit", "classification"):
        _require_string(series.get(name), f"{field}.{name}")

    sources = series.get("sources")
    if not isinstance(sources, list) or not sources:
        raise EnergyModelError(f"{field}.sources must be a non-empty list")
    for index, source in enumerate(sources):
        _validate_source(source, f"{field}.sources[{index}]")


def _validate_derived_metric(metric: Any, field: str) -> None:
    metric = _require_mapping(metric, field)
    for name in ("label", "quantity", "unit", "classification", "formula_id"):
        _require_non_empty_string(metric.get(name), f"{field}.{name}")


def _validate_measurement(measurement: Any, field: str) -> None:
    measurement = _require_mapping(measurement, field)
    for name in ("label", "quantity", "unit", "entity_id"):
        _require_non_empty_string(measurement.get(name), f"{field}.{name}")
    if "validation_required" in measurement and not isinstance(
        measurement["validation_required"], bool
    ):
        raise EnergyModelError(f"{field}.validation_required must be boolean")
    if "validation_note" in measurement:
        _require_string(measurement["validation_note"], f"{field}.validation_note")


_FORECAST_METHODS = frozenset({"physical_linear", "bill_only_previous_cycle"})
_AUDIT_OFFICIAL_SOURCES = frozenset(
    {"meter_active_kwh", "meter_generation_kwh"}
)


def _get_audit_tolerance_percent(
    model: Mapping[str, Any],
) -> float | None:
    if "audit" not in model:
        return None
    audit = _require_mapping(model["audit"], "audit")
    if "tolerance_percent" not in audit:
        raise EnergyModelError("audit.tolerance_percent is required")
    tolerance_percent = audit["tolerance_percent"]
    if isinstance(tolerance_percent, bool) or not isinstance(
        tolerance_percent, (int, float)
    ):
        raise EnergyModelError("audit.tolerance_percent must be numeric")
    normalized = float(tolerance_percent)
    if not math.isfinite(normalized) or normalized < 0:
        raise EnergyModelError(
            "audit.tolerance_percent must be finite and non-negative"
        )
    return normalized


def _require_finite_ratio(value: Any, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise EnergyModelError(f"{field} must be numeric")
    normalized = float(value)
    if not math.isfinite(normalized) or not 0 <= normalized <= 1:
        raise EnergyModelError(f"{field} must be finite and between 0 and 1")
    return normalized


def _require_boolean(value: Any, field: str) -> bool:
    if type(value) is not bool:
        raise EnergyModelError(f"{field} must be boolean")
    return value


def _get_coverage_quality_policy(
    model: Mapping[str, Any],
) -> CoverageQualityPolicy:
    root = _require_mapping(model.get("coverage_algorithm"), "coverage_algorithm")
    if root.get("status") != "validated":
        raise EnergyModelError("coverage_algorithm.status must be validated")
    if set(root) != {"status", "confirmed", "partial", "unavailable"}:
        raise EnergyModelError("coverage_algorithm contains unsupported fields")
    confirmed = _require_mapping(root["confirmed"], "coverage_algorithm.confirmed")
    partial = _require_mapping(root["partial"], "coverage_algorithm.partial")
    unavailable = _require_mapping(
        root["unavailable"], "coverage_algorithm.unavailable"
    )
    confirmed_fields = {
        "observation_coverage_ratio_min",
        "acceptance_ratio_min",
        "require_no_missing_observations",
        "max_contiguous_rejected_duration_seconds",
    }
    if set(confirmed) != confirmed_fields:
        raise EnergyModelError("coverage_algorithm.confirmed fields are invalid")
    if set(partial) != {"preserve_observed_value", "extrapolate_missing_energy"}:
        raise EnergyModelError("coverage_algorithm.partial fields are invalid")
    if set(unavailable) != {"missing_value_is_zero"}:
        raise EnergyModelError("coverage_algorithm.unavailable fields are invalid")
    duration = confirmed["max_contiguous_rejected_duration_seconds"]
    if isinstance(duration, bool) or not isinstance(duration, Real):
        raise EnergyModelError(
            "coverage_algorithm.confirmed.max_contiguous_rejected_duration_seconds "
            "must be numeric"
        )
    duration = float(duration)
    if not math.isfinite(duration) or duration < 0:
        raise EnergyModelError(
            "coverage_algorithm.confirmed.max_contiguous_rejected_duration_seconds "
            "must be finite and non-negative"
        )
    policy = CoverageQualityPolicy(
        observation_coverage_ratio_min=_require_finite_ratio(
            confirmed["observation_coverage_ratio_min"],
            "coverage_algorithm.confirmed.observation_coverage_ratio_min",
        ),
        acceptance_ratio_min=_require_finite_ratio(
            confirmed["acceptance_ratio_min"],
            "coverage_algorithm.confirmed.acceptance_ratio_min",
        ),
        require_no_missing_observations=_require_boolean(
            confirmed["require_no_missing_observations"],
            "coverage_algorithm.confirmed.require_no_missing_observations",
        ),
        max_contiguous_rejected_duration_seconds=duration,
        preserve_observed_value=_require_boolean(
            partial["preserve_observed_value"],
            "coverage_algorithm.partial.preserve_observed_value",
        ),
        extrapolate_missing_energy=_require_boolean(
            partial["extrapolate_missing_energy"],
            "coverage_algorithm.partial.extrapolate_missing_energy",
        ),
        missing_value_is_zero=_require_boolean(
            unavailable["missing_value_is_zero"],
            "coverage_algorithm.unavailable.missing_value_is_zero",
        ),
    )
    if policy.extrapolate_missing_energy or policy.missing_value_is_zero:
        raise EnergyModelError("coverage_algorithm cannot estimate missing energy")
    if not policy.preserve_observed_value:
        raise EnergyModelError("coverage_algorithm must preserve observed values")
    return policy


def _get_audit_pairs(
    unit: Mapping[str, Any], unit_id: str, field: str
) -> tuple[AuditPairDefinition, ...]:
    if "audit" not in unit:
        return ()
    audit = _require_mapping(unit["audit"], f"{field}.audit")
    if "pairs" not in audit:
        raise EnergyModelError(f"{field}.audit.pairs is required")
    pairs = audit["pairs"]
    if not isinstance(pairs, list):
        raise EnergyModelError(f"{field}.audit.pairs must be a list")

    series = _require_mapping(unit.get("series", {}), f"{field}.series")
    derived = _require_mapping(
        unit.get("derived_metrics", {}), f"{field}.derived_metrics"
    )
    seen_metrics: set[str] = set()
    definitions: list[AuditPairDefinition] = []
    for index, value in enumerate(pairs):
        pair_field = f"{field}.audit.pairs[{index}]"
        pair = _require_mapping(value, pair_field)
        if set(pair) != {"metric", "official_source"}:
            raise EnergyModelError(
                f"{pair_field} must contain exactly metric and official_source"
            )

        metric = pair["metric"]
        _require_non_empty_string(metric, f"{pair_field}.metric")
        if metric != metric.strip():
            raise EnergyModelError(
                f"{pair_field}.metric has surrounding whitespace"
            )
        if metric in seen_metrics:
            raise EnergyModelError(f"{field}.audit.pairs contains duplicate metric")

        matches = tuple(
            collection[metric]
            for collection in (series, derived)
            if metric in collection
        )
        if len(matches) != 1:
            raise EnergyModelError(
                f"{pair_field}.metric must identify exactly one series or derived metric"
            )
        metric_definition = _require_mapping(
            matches[0], f"{pair_field}.metric definition"
        )
        if metric_definition.get("quantity") != "energy":
            raise EnergyModelError(f"{pair_field}.metric must have quantity energy")

        official_source = pair["official_source"]
        _require_non_empty_string(
            official_source, f"{pair_field}.official_source"
        )
        if (
            official_source != official_source.strip()
            or official_source not in _AUDIT_OFFICIAL_SOURCES
        ):
            raise EnergyModelError(
                f"{pair_field}.official_source is unsupported"
            )

        seen_metrics.add(metric)
        definitions.append(
            AuditPairDefinition(
                logical_id=build_logical_id(unit_id, metric),
                official_source=official_source,
            )
        )
    return tuple(definitions)


def _get_forecast_config(
    unit: Mapping[str, Any], field: str
) -> tuple[str | None, str | None]:
    forecast = unit.get("forecast")
    if forecast is None:
        return None, None
    forecast = _require_mapping(forecast, f"{field}.forecast")
    if "method" not in forecast:
        raise EnergyModelError(f"{field}.forecast.method is required")
    method = forecast["method"]
    _require_non_empty_string(method, f"{field}.forecast.method")
    if method != method.strip() or method not in _FORECAST_METHODS:
        raise EnergyModelError(f"{field}.forecast.method is unsupported")
    if method == "bill_only_previous_cycle":
        if "target_metric" in forecast:
            raise EnergyModelError(f"{field}.forecast.target_metric is not allowed")
        return method, None
    if "target_metric" not in forecast:
        raise EnergyModelError(f"{field}.forecast.target_metric is required")
    target = forecast["target_metric"]
    _require_non_empty_string(target, f"{field}.forecast.target_metric")
    if target != target.strip():
        raise EnergyModelError(f"{field}.forecast.target_metric has surrounding whitespace")
    series = _require_mapping(unit.get("series", {}), f"{field}.series")
    derived = _require_mapping(unit.get("derived_metrics", {}), f"{field}.derived_metrics")
    matches = tuple(definitions[target] for definitions in (series, derived) if target in definitions)
    if len(matches) != 1:
        raise EnergyModelError(f"{field}.forecast.target_metric must identify exactly one series or derived metric")
    definition = _require_mapping(matches[0], f"{field}.forecast target definition")
    if definition.get("quantity") != "energy":
        raise EnergyModelError(f"{field}.forecast.target_metric must have quantity energy")
    return method, target


def _validate_unit(unit: Any, unit_id: str, field: str) -> None:
    unit = _require_mapping(unit, field)
    for name in ("name", "role", "billing_key"):
        _require_non_empty_string(unit.get(name), f"{field}.{name}")
    if not isinstance(unit.get("measured"), bool):
        raise EnergyModelError(f"{field}.measured must be boolean")

    if "series" in unit:
        series = _require_mapping(unit["series"], f"{field}.series")
        for metric_id, definition in series.items():
            _validate_series(definition, f"{field}.series.{metric_id}")

    if "derived_metrics" in unit:
        metrics = _require_mapping(
            unit["derived_metrics"], f"{field}.derived_metrics"
        )
        for metric_id, definition in metrics.items():
            _validate_derived_metric(
                definition, f"{field}.derived_metrics.{metric_id}"
            )

    if "measurements" in unit:
        measurements = _require_mapping(unit["measurements"], f"{field}.measurements")
        for metric_id, definition in measurements.items():
            _validate_measurement(definition, f"{field}.measurements.{metric_id}")

    if "ucs" in unit:
        _validate_ucs(unit["ucs"], f"{field}.ucs")

    _get_forecast_config(unit, field)
    _get_audit_pairs(unit, unit_id, field)


_DIGITS = frozenset("0123456789")


def _validate_ucs(ucs: Any, field: str) -> None:
    """A UC fica guardada so como hash, e as vezes os quatro ultimos digitos.

    O numero inteiro nao precisa ser relido: ele so serve para casar com a
    fatura, e o hash casa igual. Os quatro digitos existem quando a UC foi
    digitada na tela; a adotada das faturas nao os tem, porque o arquivo de
    faturas nunca guardou o numero.
    """
    if not isinstance(ucs, list):
        raise EnergyModelError(f"{field} must be a list")
    vistos: set[str] = set()
    for index, item in enumerate(ucs):
        campo = f"{field}[{index}]"
        item = _require_mapping(item, campo)
        valor = item.get("hash")
        if not is_uc_hash(valor):
            raise EnergyModelError(f"{campo}.hash must be a sha256 hash")
        if "suffix" in item:
            sufixo = item["suffix"]
            if not isinstance(sufixo, str) or not sufixo or not set(sufixo) <= _DIGITS:
                raise EnergyModelError(f"{campo}.suffix must be digits")
        if valor in vistos:
            raise EnergyModelError(f"{campo} repeats a UC of this unit")
        vistos.add(valor)


def _validate_uc_ownership(units: Mapping[str, Any]) -> None:
    """Uma UC tem um dono so: duas unidades com a mesma UC dividiriam a fatura."""
    dono: dict[str, str] = {}
    for unit_id, unit in units.items():
        for item in unit.get("ucs") or ():
            valor = item["hash"]
            if valor in dono:
                raise EnergyModelError(
                    f"units.{unit_id}.ucs repeats a UC of units.{dono[valor]}"
                )
            dono[valor] = unit_id


def validate_energy_model(model: Any) -> None:
    """Validate the documented structure of an energy model."""
    model = _require_mapping(model, "model")
    if model.get("model_version") != 1 or isinstance(model.get("model_version"), bool):
        raise EnergyModelError("model_version must be exactly 1")

    general = _require_mapping(model.get("general"), "general")
    _require_non_empty_string(general.get("timezone"), "general.timezone")

    billing = _require_mapping(model.get("billing"), "billing")
    # Opcional: as faturas vem do storage. Declarado, continua tendo de ser um
    # caminho de verdade — aceitar texto vazio esconderia um erro de digitacao
    # atras do caso novo.
    if billing.get("json_path") is not None:
        _require_non_empty_string(billing.get("json_path"), "billing.json_path")
    _require_non_empty_string(
        billing.get("boundary_time"), "billing.boundary_time"
    )
    if "invoice_late_after_days" in billing:
        _parse_invoice_late_after_days(billing["invoice_late_after_days"])
    if "diagnostics" in model:
        diagnostics = _require_mapping(model["diagnostics"], "diagnostics")
        if "meter_silent_after_minutes" in diagnostics:
            _parse_meter_silent_after_minutes(diagnostics["meter_silent_after_minutes"])

    _get_audit_tolerance_percent(model)
    _get_coverage_quality_policy(model)

    # Modelo sem unidade nenhuma e como toda instalacao comeca, antes de
    # alguem criar a primeira pela tela. Vazio e quebrado sao coisas
    # diferentes: recusar o vazio obrigava a escrever um YAML a mao so para
    # conseguir instalar, que e exatamente o que a tela existe para evitar.
    units = _require_mapping(model.get("units"), "units")
    for unit_id, unit in units.items():
        _validate_unit(unit, unit_id, f"units.{unit_id}")
    _validate_uc_ownership(units)

    for field in ("credit_distribution", "blocked_configuration"):
        if field in model:
            _require_mapping(model[field], field)


def _parse_logical_id(logical_id: Any) -> tuple[str, str]:
    if not isinstance(logical_id, str) or logical_id.count(".") != 1:
        raise EnergyModelError("logical_id must have format <unit_id>.<metric_id>")
    unit_id, metric_id = logical_id.split(".")
    if not unit_id or not metric_id:
        raise EnergyModelError("logical_id must have format <unit_id>.<metric_id>")
    return unit_id, metric_id


def get_series_definition(
    model: Mapping[str, Any], logical_id: str
) -> Mapping[str, Any]:
    """Return the declarative series definition for a logical identifier."""
    unit_id, metric_id = _parse_logical_id(logical_id)

    units = model.get("units", {})
    if unit_id not in units:
        raise EnergyModelError(f"unknown unit: {unit_id}")
    series = units[unit_id].get("series", {})
    if metric_id not in series:
        raise EnergyModelError(f"unknown series: {logical_id}")
    return series[metric_id]


def get_measurement_definition(
    model: Mapping[str, Any], logical_id: str
) -> Mapping[str, Any]:
    """Return the declarative measurement definition for a logical identifier."""
    unit_id, measurement_id = _parse_logical_id(logical_id)
    units = _require_mapping(model.get("units", {}), "units")
    if unit_id not in units:
        raise EnergyModelError(f"unknown unit: {unit_id}")

    unit = _require_mapping(units[unit_id], f"units.{unit_id}")
    measurements = _require_mapping(
        unit.get("measurements"), f"units.{unit_id}.measurements"
    )
    if measurement_id not in measurements:
        raise EnergyModelError(f"unknown measurement: {logical_id}")
    return _require_mapping(
        measurements[measurement_id],
        f"units.{unit_id}.measurements.{measurement_id}",
    )


def get_unit_definition(
    model: Mapping[str, Any], unit_id: str
) -> Mapping[str, Any]:
    """Return the original declarative definition for one unit."""
    _require_non_empty_string(unit_id, "unit_id")
    model = _require_mapping(model, "model")
    units = _require_mapping(model.get("units"), "units")
    if unit_id not in units:
        raise EnergyModelError(f"unknown unit: {unit_id}")
    return _require_mapping(units[unit_id], f"units.{unit_id}")


def get_unit_ids(model: Mapping[str, Any]) -> tuple[str, ...]:
    """Return every configured unit ID in its declared order.

    Tupla vazia quando ainda nao ha nenhuma: e o estado de uma instalacao
    recem-criada, e quem chama precisa poder dizer "nada configurado ainda"
    em vez de receber um erro que parece defeito.
    """
    model = _require_mapping(model, "model")
    units = _require_mapping(model.get("units"), "units")
    for unit_id in units:
        _require_non_empty_string(unit_id, "units key")
    return tuple(units)


def get_unit_name(model: Mapping[str, Any], unit_id: str) -> str:
    """Return the declared presentation name for one unit."""
    unit = get_unit_definition(model, unit_id)
    name = unit.get("name")
    _require_non_empty_string(name, f"units.{unit_id}.name")
    return name


#: Papel de quem gera. A unidade com este papel e a dona do sistema solar: e
#: dela que saem geracao, exportacao e importacao medidas, e e o investimento
#: dela que o payback amortiza.
GENERATOR_ROLE = "producer_consumer"


def get_unit_role(model: Mapping[str, Any], unit_id: str) -> str:
    """Return the declared role for one unit."""
    unit = get_unit_definition(model, unit_id)
    role = unit.get("role")
    _require_non_empty_string(role, f"units.{unit_id}.role")
    return role


def get_generator_unit_ids(model: Mapping[str, Any]) -> tuple[str, ...]:
    """Return every unit declared as generator, in model order.

    O papel ja era declarado no modelo; o que faltava era alguem perguntar por
    ele. Ate aqui o codigo presumia um id fixo para a geradora, e uma
    instalacao com outro nome — ou com duas geradoras — nao tinha como ser
    descrita sem mexer no codigo.
    """
    return tuple(
        unit_id
        for unit_id in get_unit_ids(model)
        if get_unit_role(model, unit_id) == GENERATOR_ROLE
    )


def get_generator_unit_id(model: Mapping[str, Any]) -> str:
    """Return the single generator unit.

    Erra alto de proposito quando nao ha exatamente uma: os calculos que
    dependem disto — autoconsumo, fluxo de energia, payback — sao escritos
    para uma geradora so, e seguir com a primeira da lista produziria numero
    plausivel e errado.
    """
    generators = get_generator_unit_ids(model)
    if not generators:
        raise EnergyModelError(
            f"no unit declares role {GENERATOR_ROLE!r}"
        )
    if len(generators) > 1:
        raise EnergyModelError(
            f"exactly one unit may declare role {GENERATOR_ROLE!r}, "
            f"found {len(generators)}: {', '.join(generators)}"
        )
    return generators[0]


def get_forecast_target_logical_id(
    model: Mapping[str, Any], unit_id: str
) -> str | None:
    """Return the configured forecast target logical ID for one unit."""
    unit = get_unit_definition(model, unit_id)
    _, target = _get_forecast_config(unit, f"units.{unit_id}")
    return None if target is None else build_logical_id(unit_id, target)


def get_audit_pairs(
    model: Mapping[str, Any], unit_id: str
) -> tuple[AuditPairDefinition, ...]:
    """Return audit pairs for one unit in their declared order."""
    unit = get_unit_definition(model, unit_id)
    return _get_audit_pairs(unit, unit_id, f"units.{unit_id}")


def get_audit_tolerance_percent(
    model: Mapping[str, Any],
) -> float | None:
    """Return the configured global audit tolerance percentage."""
    model = _require_mapping(model, "model")
    return _get_audit_tolerance_percent(model)


def get_coverage_quality_policy(
    model: Mapping[str, Any],
) -> CoverageQualityPolicy:
    """Return the single configured authority for energy coverage quality."""
    model = _require_mapping(model, "model")
    return _get_coverage_quality_policy(model)


def get_forecast_method(
    model: Mapping[str, Any], unit_id: str
) -> str | None:
    """Return the explicitly configured forecast method for one unit."""
    unit = get_unit_definition(model, unit_id)
    method, _ = _get_forecast_config(unit, f"units.{unit_id}")
    return method


def is_bill_only_unit(model: Mapping[str, Any], unit_id: str) -> bool:
    """Unidade acompanhada só pela fatura.

    Duas formas de dizer a mesma coisa: o método de previsão declarado no
    modelo, ou a caixa "tem medidor" desmarcada na configuração. Só a primeira
    contava, e a unidade criada sem medidor perdia o período, os dias e a
    situação da leitura que a fatura traz.
    """
    unit = get_unit_definition(model, unit_id)
    return (
        get_forecast_method(model, unit_id) == "bill_only_previous_cycle"
        or unit.get("measured") is False
    )


def get_measurement_logical_ids(
    model: Mapping[str, Any], unit_id: str
) -> tuple[str, ...]:
    """Return measurement logical IDs in their declared order."""
    unit = get_unit_definition(model, unit_id)
    measurements = unit.get("measurements")
    if measurements is None:
        return ()
    measurements = _require_mapping(measurements, f"units.{unit_id}.measurements")
    return tuple(
        build_logical_id(unit_id, measurement_id)
        for measurement_id in measurements
    )


def get_series_logical_ids(
    model: Mapping[str, Any], unit_id: str
) -> tuple[str, ...]:
    """Return series logical IDs in their declared order."""
    unit = get_unit_definition(model, unit_id)
    series = unit.get("series")
    if series is None:
        return ()
    series = _require_mapping(series, f"units.{unit_id}.series")
    return tuple(build_logical_id(unit_id, metric_id) for metric_id in series)


def get_derived_metric_definition(
    model: Mapping[str, Any], logical_id: str
) -> Mapping[str, Any]:
    """Return the original derived-metric definition for a logical ID."""
    unit_id, metric_id = _parse_logical_id(logical_id)
    units = _require_mapping(model.get("units", {}), "units")
    if unit_id not in units:
        raise EnergyModelError(f"unknown unit: {unit_id}")
    unit = _require_mapping(units[unit_id], f"units.{unit_id}")
    metrics = _require_mapping(
        unit.get("derived_metrics"), f"units.{unit_id}.derived_metrics"
    )
    if metric_id not in metrics:
        raise EnergyModelError(f"unknown derived metric: {logical_id}")
    return _require_mapping(
        metrics[metric_id], f"units.{unit_id}.derived_metrics.{metric_id}"
    )


def get_derived_metric_logical_ids(
    model: Mapping[str, Any], unit_id: str
) -> tuple[str, ...]:
    """Return derived-metric logical IDs in their declared order."""
    unit = get_unit_definition(model, unit_id)
    metrics = unit.get("derived_metrics")
    if metrics is None:
        return ()
    metrics = _require_mapping(metrics, f"units.{unit_id}.derived_metrics")
    return tuple(build_logical_id(unit_id, metric_id) for metric_id in metrics)


def get_timezone_name(model: Mapping[str, Any]) -> str:
    """Return the configured timezone name without interpreting it."""
    model = _require_mapping(model, "model")
    general = _require_mapping(model.get("general"), "general")
    timezone_name = general.get("timezone")
    _require_non_empty_string(timezone_name, "general.timezone")
    return timezone_name


def get_billing_boundary_time(model: Mapping[str, Any]) -> str:
    """Return the configured billing boundary text without parsing it."""
    model = _require_mapping(model, "model")
    billing = _require_mapping(model.get("billing"), "billing")
    boundary_time = billing.get("boundary_time")
    _require_non_empty_string(boundary_time, "billing.boundary_time")
    return boundary_time


def _parse_invoice_late_after_days(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise EnergyModelError(
            "billing.invoice_late_after_days must be a positive integer"
        )
    return value


def get_invoice_late_after_days(model: Mapping[str, Any]) -> int | None:
    """Days after the reading before a missing invoice counts as late.

    Sem o campo nao existe atraso: o ciclo so aguarda. O prazo e decisao do
    operador e fica declarado no modelo, nunca arbitrado no codigo.
    """
    model = _require_mapping(model, "model")
    billing = _require_mapping(model.get("billing"), "billing")
    if "invoice_late_after_days" not in billing:
        return None
    return _parse_invoice_late_after_days(billing["invoice_late_after_days"])


def _parse_meter_silent_after_minutes(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise EnergyModelError(
            "diagnostics.meter_silent_after_minutes must be a positive integer"
        )
    return value


def get_meter_silent_after_minutes(model: Mapping[str, Any]) -> int | None:
    """Minutes without any instantaneous reading before a meter counts as silent.

    Sem o campo o silencio nao e classificado: a pagina mostra ha quanto tempo
    o medidor respondeu, mas nao arbitra quando isso vira problema.
    """
    model = _require_mapping(model, "model")
    if "diagnostics" not in model:
        return None
    diagnostics = _require_mapping(model["diagnostics"], "diagnostics")
    if "meter_silent_after_minutes" not in diagnostics:
        return None
    return _parse_meter_silent_after_minutes(diagnostics["meter_silent_after_minutes"])


def get_billing_json_path(model: Mapping[str, Any]) -> str | None:
    """Return the configured billing JSON path, or None when there is none.

    Era obrigatorio quando o arquivo publicado por fora era a unica fonte de
    faturas. Com as faturas no storage, exigi-lo obrigaria toda instalacao
    nova a apontar para um arquivo que nunca vai existir.
    """
    model = _require_mapping(model, "model")
    billing = _require_mapping(model.get("billing"), "billing")
    json_path = billing.get("json_path")
    if json_path is None:
        return None
    _require_non_empty_string(json_path, "billing.json_path")
    return json_path


def _load_yaml(path: str | Path) -> Mapping[str, Any]:
    """Load YAML through Home Assistant's existing YAML helper."""
    from homeassistant.util.yaml import load_yaml_dict

    return load_yaml_dict(path)


def load_energy_model(path: str | Path) -> Mapping[str, Any]:
    """Load and validate an energy model from an explicit path."""
    try:
        model = _load_yaml(path)
    except EnergyModelError:
        raise
    except Exception as error:
        raise EnergyModelError(f"could not load energy model: {error}") from error
    validate_energy_model(model)
    return model
