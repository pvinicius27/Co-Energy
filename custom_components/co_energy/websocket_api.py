"""WebSocket API for CoEnergy."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import date, datetime, timedelta
from decimal import Decimal
import dataclasses
import logging
from pathlib import Path
from typing import Any

from .audit_serializer import AuditSerializationError, serialize_audit
from .const import DOMAIN
from .instant_statistics import (
    InstantStatisticsError,
    InstantStatisticsUnavailableError,
    InstantStatisticsUnknownUnitError,
    async_build_instant_statistics,
    instant_measurement_ids,
)
from .instant_statistics_serializer import (
    InstantStatisticsSerializationError,
    serialize_instant_statistics,
)
from .logical_state import (
    LogicalStateError,
    get_logical_current_state,
    get_logical_current_states,
)
from .measurements_serializer import (
    MeasurementsSerializationError,
    serialize_measurements,
)
from .data_health import DataHealthError, async_build_data_health
from .data_health_serializer import (
    DataHealthSerializationError,
    serialize_data_health,
)
from .comparison import (
    ComparisonError,
    ComparisonFutureReferenceError,
    ComparisonHourlyRangeTooLongError,
    ComparisonIntervalRequiresDistinctDatesError,
    ComparisonDayRequiresSingleDateError,
    ComparisonInvalidLogicalIdError,
    ComparisonInvalidModeError,
    ComparisonInvalidReferenceError,
    ComparisonInvalidResolutionError,
    ComparisonMixedRangeTypesError,
    ComparisonUnavailableError,
    ComparisonUnknownUnitError,
    async_get_comparison,
)
from .comparison_serializer import (
    ComparisonSerializationError,
    serialize_comparison,
)
from .billing import (
    BillingError,
    assign_bills_by_uc,
    bill_stats_by_uc,
    declared_uc_hashes,
    get_bill_by_reference,
    parse_billing_reference,
)
from .billing_cycle import BillingCycleError, get_billing_cycles
from .energy_period import EnergyPeriodError, async_get_energy_period
from .energy import (
    EnergyCalculationError,
    calculate_physical_consumption,
    calculate_self_consumption,
)
from .periods import Period, PeriodError
from .energy_flow import (
    EnergyFlowError,
    EnergyFlowInvalidReferenceError,
    EnergyFlowUnavailableError,
    async_get_energy_flow,
)
from .energy_flow_serializer import (
    EnergyFlowSerializationError,
    serialize_energy_flow,
)
from .unit_catalog_serializer import (
    UnitCatalogSerializationError,
    serialize_unit_catalog,
)
from .cycle_catalog_serializer import (
    CycleCatalogSerializationError,
    serialize_cycle_catalog,
)
from .equatorial_adapter import (
    EquatorialAdapterError,
    get_bill_uc_hash,
    get_unit_connection_type,
    load_equatorial_document,
    parse_equatorial_document,
)
from .history import (
    HistoryError,
    HistoryFutureReferenceError,
    HistoryInvalidReferenceError,
    HistoryUnavailableError,
    HistoryUnknownUnitError,
    async_get_history,
)
from .history_serializer import HistorySerializationError, serialize_history
from .temporal_energy_acceptance import (
    TemporalEnergyAcceptanceError,
    classify_temporal_energy_acceptance,
)
from .temporal_energy_acceptance_duration import (
    TemporalEnergyAcceptanceDurationError,
    calculate_temporal_energy_acceptance_durations,
)
from .temporal_energy_acceptance_ratio import (
    TemporalEnergyAcceptanceRatioError,
    calculate_temporal_energy_acceptance_ratios,
)
from .temporal_observation import (
    TemporalObservationError,
    classify_temporal_observations,
)
from .temporal_observation_coverage import (
    TemporalObservationCoverageError,
    calculate_temporal_observation_coverage,
)
from .temporal_observation_duration import (
    TemporalObservationDurationError,
    calculate_temporal_observation_durations,
)
from .finance import FinanceError, get_official_financial_snapshot
from .finance_serializer import (
    FinanceSerializationError,
    serialize_official_financial_snapshot,
)
from .operational_settings import (
    OperationalSettingsError,
    apply_to_financial_model,
    apply_to_model,
)
from .model_builder import (
    INSTANT_MEASUREMENTS,
    ROLE_CONSUMER,
    ModelBuilderError,
    add_unit,
    add_unit_uc,
    remove_unit,
    remove_unit_measurement,
    remove_unit_uc,
    remove_unit_series,
    rename_unit,
    set_unit_color,
    set_unit_image,
    set_unit_measured,
    set_unit_measurement,
    set_unit_role,
    set_unit_series,
    set_uc_owner,
    swap_unit_meter,
)
from .model_config_serializer import build_model_config
from .invoice_storage import (
    InvoiceStorageError,
    async_write_copy,
    build_invoice_document,
    compare_documents,
    summarize_ucs,
)
from .model_storage import ModelStorageError
from .unit_images import list_available_images
from .sensor_overrides import (
    SensorOverrides,
    SensorOverridesError,
    apply_overrides_to_model,
    declared_entity_ids,
)
from .sensor_overrides_serializer import (
    PRESENCE_MISSING,
    PRESENCE_PRESENT,
    PRESENCE_UNAVAILABLE,
    PRESENCE_UNKNOWN,
    build_sensor_catalog,
)
from .states_adapter import get_current_state
from .daily_energy_balance import (
    DailyEnergyBalanceError,
    build_daily_energy_balance,
    calculate_daily_distributable,
)
from .daily_energy_balance_serializer import (
    DailyEnergyBalanceSerializationError,
    serialize_daily_energy_balance,
)
from .cycle_cost_estimate import (
    CycleCostEstimateError,
    build_cycle_cost_estimate,
)
from .cycle_cost_estimate_serializer import (
    CycleCostEstimateSerializationError,
    serialize_cycle_cost_estimate,
)
from .financial_model import (
    FinancialModelError,
    base_financial_configuration,
    load_financial_model,
)
from .payback_projection import (
    PaybackCycleInput,
    resolve_published_energy_tariff,
    PaybackProjectionError,
    PaybackUnitCycle,
    UnitCreditBalance,
    project_simple_payback,
)
from .payback_projection_serializer import (
    PaybackProjectionSerializationError,
    serialize_payback_projection,
)
from .runtime import MODEL_SOURCE_FILE, CoEnergyRuntime
from .scee import (
    SceeError,
    SceeInvalidReferenceError,
    SceeNotFoundError,
    SceeUnavailableError,
    SceeUnknownUnitError,
    get_official_scee_record,
)
from .scee_serializer import (
    SceeSerializationError,
    serialize_official_scee_record,
)
from .scee_savings import get_confirmed_scee_savings
from .unit_overview import UnitOverviewError, async_get_unit_overview
from .unit_overview_serializer import (
    UnitOverviewSerializationError,
    serialize_unit_overview,
)
from .unit_audit_result import (
    UnitAuditInvalidReferenceError,
    UnitAuditResultError,
    UnitAuditUnavailableError,
    UnitAuditUnknownUnitError,
    async_get_unit_audit_result,
)
from .distribution import (
    resolve_distribution,
    DistributionError,
    DistributionFutureRuleError,
    DistributionRevisionConflictError,
    DistributionUnavailableError,
    DistributionValidationError,
    parse_datetime,
)
from .distribution_serializer import (
    DistributionSerializationError,
    serialize_configured_distribution,
)
from .energy_coverage_quality import EnergyCoverageQualityError
from .distribution_storage import share_blocking_removal
from .energy_model import (
    EnergyModelError,
    get_coverage_quality_policy,
    get_measurement_logical_ids,
    get_series_definition,
    get_timezone_name,
    get_generator_unit_id,
    get_unit_ids,
)
from .periods import get_timezone
from .self_consumption import (
    SelfConsumptionError,
    async_get_solar_self_consumption,
)
from .self_consumption_serializer import (
    SelfConsumptionSerializationError,
    serialize_self_consumption_result,
)

WS_TYPE_GET_UNITS = "co_energy/get_units"
WS_TYPE_GET_OVERVIEW = "co_energy/get_overview"
WS_TYPE_GET_HISTORY = "co_energy/get_history"
WS_TYPE_GET_CYCLES = "co_energy/get_cycles"
WS_TYPE_GET_COMPARISON = "co_energy/get_comparison"
WS_TYPE_GET_AUDIT = "co_energy/get_audit"
WS_TYPE_GET_SCEE = "co_energy/get_scee"
WS_TYPE_GET_FINANCE = "co_energy/get_finance"
WS_TYPE_GET_CYCLE_COST_ESTIMATE = "co_energy/get_cycle_cost_estimate"
WS_TYPE_GET_DAILY_BALANCE = "co_energy/get_daily_balance"
WS_TYPE_GET_INSTANT_STATISTICS = "co_energy/get_instant_statistics"
WS_TYPE_GET_MEASUREMENTS = "co_energy/get_measurements"
WS_TYPE_GET_DATA_HEALTH = "co_energy/get_data_health"
WS_TYPE_GET_SETTINGS = "co_energy/get_settings"
WS_TYPE_SET_SETTINGS = "co_energy/set_settings"
WS_TYPE_GET_SENSORS = "co_energy/get_sensors"
WS_TYPE_SET_SENSORS = "co_energy/set_sensors"
WS_TYPE_GET_MODEL_CONFIG = "co_energy/get_model_config"
WS_TYPE_IMPORT_MODEL = "co_energy/import_model"
WS_TYPE_SET_UNIT = "co_energy/set_unit"
WS_TYPE_SET_UNIT_SENSOR = "co_energy/set_unit_sensor"
WS_TYPE_SWAP_UNIT_METER = "co_energy/swap_unit_meter"
WS_TYPE_GET_INVOICES = "co_energy/get_invoices"
WS_TYPE_SET_UC_OWNER = "co_energy/set_uc_owner"
WS_TYPE_COMPARE_INVOICES = "co_energy/compare_invoices"
WS_TYPE_USE_INVOICE_STORAGE = "co_energy/use_invoice_storage"
WS_TYPE_DELETE_INVOICE = "co_energy/delete_invoice"
WS_TYPE_EXPORT_INVOICES = "co_energy/export_invoices"
WS_TYPE_GET_ENERGY_COVERAGE_AUDIT = "co_energy/get_energy_coverage_audit"
WS_TYPE_GET_SELF_CONSUMPTION = "co_energy/get_self_consumption"
WS_TYPE_GET_ENERGY_FLOW = "co_energy/get_energy_flow"
WS_TYPE_GET_PAYBACK_PROJECTION = "co_energy/get_payback_projection"
WS_TYPE_GET_DISTRIBUTION = "co_energy/get_distribution"
WS_TYPE_SET_DISTRIBUTION_IMMEDIATE = "co_energy/set_distribution_immediate"
WS_TYPE_SCHEDULE_DISTRIBUTION = "co_energy/schedule_distribution"
WS_TYPE_CANCEL_SCHEDULED_DISTRIBUTION = "co_energy/cancel_scheduled_distribution"
API_VERSION = 1
DEFAULT_STATISTICS_PERIOD = "hour"
DEFAULT_HISTORY_MODE = "day"

_LOGGER = logging.getLogger(__name__)

#: Metricas que a auditoria de cobertura le da geradora, na ordem em que
#: entram no calculo de autoconsumo. Sao nomes de metrica: quem monta o ID
#: completo e quem sabe de qual unidade esta falando.
_COVERAGE_METRICS = ("generation_energy", "export_energy", "import_energy")


def _duration_seconds(value: timedelta) -> float:
    return value.total_seconds()


def _serialize_coverage_metric(result: Any) -> dict[str, Any]:
    observations = classify_temporal_observations(result.temporal_evidence)
    observation_durations = calculate_temporal_observation_durations(observations)
    observation_coverage = calculate_temporal_observation_coverage(
        observation_durations
    )
    acceptances = classify_temporal_energy_acceptance(observations)
    acceptance_durations = calculate_temporal_energy_acceptance_durations(
        acceptances, observation_durations
    )
    acceptance_ratios = calculate_temporal_energy_acceptance_ratios(
        acceptance_durations
    )
    present_observations = tuple(
        acceptance.observation.evidence
        for acceptance in acceptances
        if acceptance.observation.recorder_bucket_present is True
    )
    issues = tuple(
        issue
        for evidence_slice in result.temporal_evidence
        for issue in evidence_slice.issues
    )
    missing = tuple(
        acceptance.observation.evidence
        for acceptance in acceptances
        if acceptance.energy_bucket_accepted is False
        and acceptance.observation.recorder_bucket_present is False
    )
    rejected = tuple(
        acceptance.observation.evidence
        for acceptance in acceptances
        if acceptance.energy_bucket_accepted is False
        and acceptance.observation.recorder_bucket_present is True
    )
    sources = tuple(dict.fromkeys(
        segment.entity_id
        for evidence_slice in result.temporal_evidence
        if (segment := evidence_slice.segment) is not None
    ))
    return {
        "logical_key": result.logical_id,
        "quantity": result.quantity,
        "unit": result.unit,
        "classification": result.classification,
        "statistics_period": result.statistics_period,
        "sources": list(sources),
        "period_from": result.period.start.isoformat(),
        "period_until": result.period.end.isoformat(),
        "eligible_duration_seconds": _duration_seconds(
            observation_durations.eligible_duration
        ),
        "present_duration_seconds": _duration_seconds(
            observation_durations.recorder_present_duration
        ),
        "missing_duration_seconds": _duration_seconds(
            observation_durations.recorder_missing_duration
        ),
        "accepted_duration_seconds": _duration_seconds(
            acceptance_durations.energy_accepted_duration
        ),
        "rejected_duration_seconds": _duration_seconds(
            acceptance_durations.energy_rejected_duration
        ),
        "observation_coverage_ratio": (
            observation_coverage.recorder_observation_coverage_ratio
        ),
        "acceptance_ratio": acceptance_ratios.energy_acceptance_eligible_ratio,
        "acceptance_present_ratio": (
            acceptance_ratios.energy_acceptance_present_ratio
        ),
        "first_observation": (
            present_observations[0].start.isoformat()
            if present_observations else None
        ),
        "last_observation": (
            present_observations[-1].end.isoformat()
            if present_observations else None
        ),
        "accepted_energy_kwh": result.value,
        "rejected_energy_kwh": (
            sum(issue.value for issue in issues if issue.value is not None)
            if any(issue.value is not None for issue in issues)
            else None
        ),
        "missing_energy_kwh": None,
        "missing_observations": [
            {"from": item.start.isoformat(), "until": item.end.isoformat()}
            for item in missing
        ],
        "rejected_observations": [
            {
                "from": item.start.isoformat(),
                "until": item.end.isoformat(),
                "reasons": [issue.reason for issue in item.issues],
            }
            for item in rejected
        ],
        "issue_counts": [
            {"reason": item.reason, "count": item.count}
            for item in result.issue_counts
        ],
        "evidence_counts": {
            kind: sum(1 for item in result.temporal_evidence if item.kind == kind)
            for kind in dict.fromkeys(item.kind for item in result.temporal_evidence)
        },
    }


def _validate_public_shares(shares: Any) -> None:
    """Validate only the public WebSocket shape of distribution shares."""
    if not isinstance(shares, dict):
        raise DistributionValidationError("shares must be a dictionary")
    if any(
        not isinstance(unit_id, str)
        or not isinstance(value, str)
        or not value.strip()
        for unit_id, value in shares.items()
    ):
        raise DistributionValidationError(
            "share keys and values must be non-empty strings"
        )


def _get_distribution_manager(runtime: CoEnergyRuntime) -> Any:
    manager = runtime.distribution_manager
    if manager is None or not manager.available:
        raise DistributionUnavailableError("configured distribution is unavailable")
    return manager


def _send_distribution_result(
    connection: Any,
    message_id: Any,
    manager: Any,
    now: datetime,
) -> None:
    serialized = serialize_configured_distribution(
        manager.data, now, manager.unit_ids
    )
    connection.send_result(
        message_id, {"api_version": API_VERSION, "data": serialized}
    )


def _send_distribution_error(
    connection: Any,
    message_id: Any,
    error: Exception,
    *,
    cancel: bool = False,
) -> None:
    if isinstance(error, DistributionRevisionConflictError):
        code = "distribution_revision_conflict"
        message = "Distribution revision conflict"
    elif isinstance(error, DistributionUnavailableError):
        code = "distribution_unavailable"
        message = "Distribution is unavailable"
    elif cancel and isinstance(error, DistributionFutureRuleError):
        code = "distribution_not_found"
        message = "Scheduled distribution was not found"
    elif isinstance(error, (DistributionValidationError, DistributionFutureRuleError)):
        code = "distribution_invalid"
        message = "Distribution request is invalid"
    else:
        _LOGGER.error("Could not persist or serialize distribution", exc_info=True)
        code = "distribution_storage_error"
        message = "Distribution storage is unavailable"
    connection.send_error(message_id, code, message)


async def _async_handle_get_distribution(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Return configured distribution through its public serializer."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        manager = _get_distribution_manager(runtime)
        _send_distribution_result(connection, msg["id"], manager, now)
    except Exception as error:
        _send_distribution_error(connection, msg["id"], error)


async def _async_handle_set_distribution_immediate(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Apply an immediate configured distribution mutation."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        manager = _get_distribution_manager(runtime)
        _validate_public_shares(msg.get("shares"))
        await manager.async_set_distribution_immediate(
            msg["shares"],
            expected_revision=msg.get("expected_revision"),
            label=msg.get("label"),
        )
        _send_distribution_result(connection, msg["id"], manager, now)
    except Exception as error:
        _send_distribution_error(connection, msg["id"], error)


async def _async_handle_schedule_distribution(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Schedule one future configured distribution mutation."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        manager = _get_distribution_manager(runtime)
        _validate_public_shares(msg.get("shares"))
        effective_from = parse_datetime(msg.get("effective_from"), "effective_from")
        await manager.async_schedule_distribution(
            msg["shares"],
            effective_from,
            expected_revision=msg.get("expected_revision"),
            label=msg.get("label"),
        )
        _send_distribution_result(connection, msg["id"], manager, now)
    except Exception as error:
        _send_distribution_error(connection, msg["id"], error)


async def _async_handle_cancel_scheduled_distribution(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Cancel the single scheduled configured distribution mutation."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        manager = _get_distribution_manager(runtime)
        await manager.async_cancel_scheduled_distribution(
            expected_revision=msg.get("expected_revision")
        )
        _send_distribution_result(connection, msg["id"], manager, now)
    except Exception as error:
        _send_distribution_error(connection, msg["id"], error, cancel=True)


async def _async_handle_get_overview(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Handle one validated get-overview request."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"],
            "runtime_unavailable",
            "CoEnergy runtime is unavailable",
        )
        return

    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(
            msg["id"],
            "runtime_unavailable",
            "CoEnergy runtime is unavailable",
        )
        return

    try:
        billing_document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.error("Could not reload the Equatorial billing source", exc_info=True)
        connection.send_error(
            msg["id"],
            "billing_source_unavailable",
            "Billing source is unavailable",
        )
        return

    unit_id = msg["unit_id"]
    statistics_period = msg.get(
        "statistics_period",
        DEFAULT_STATISTICS_PERIOD,
    )
    try:
        overview = await async_get_unit_overview(
            hass,
            runtime.model,
            billing_document,
            unit_id,
            now,
            statistics_period,
        )
    except UnitOverviewError:
        _LOGGER.error("Could not build the unit overview", exc_info=True)
        connection.send_error(
            msg["id"],
            "overview_failed",
            "Could not build unit overview",
        )
        return

    try:
        serialized = serialize_unit_overview(overview)
    except UnitOverviewSerializationError:
        _LOGGER.error("Could not serialize the unit overview", exc_info=True)
        connection.send_error(
            msg["id"],
            "serialization_failed",
            "Could not serialize unit overview",
        )
        return

    connection.send_result(
        msg["id"],
        {
            "api_version": API_VERSION,
            "data": serialized,
        },
    )


async def _async_handle_get_units(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
) -> None:
    """Return the configured unit catalog declared by the energy model."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        # Fatura e investimento não moram no modelo: vêm do storage de
        # faturas e dos ajustes. A tela precisa dos três juntos para saber o
        # que mostrar, e pedi-los em chamadas separadas faria a primeira
        # resposta decidir com metade da informação.
        manager = runtime.invoice_manager
        tem_fatura = _has_owned_invoice(runtime)
        ajustes = (
            runtime.settings_manager.settings
            if runtime.settings_manager is not None
            else None
        )
        tem_investimento = bool(
            ajustes is not None and ajustes.solar_investment is not None
        )
        serialized = serialize_unit_catalog(
            runtime.model,
            has_billing=tem_fatura,
            has_investment=tem_investimento,
        )
    except UnitCatalogSerializationError:
        _LOGGER.error("Could not serialize the configured unit catalog", exc_info=True)
        connection.send_error(
            msg["id"], "unit_catalog_unavailable", "Unit catalog is unavailable"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


async def _async_handle_get_energy_flow(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Handle one operational energy-flow request, open cycle included."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime) or runtime.distribution_manager is None:
        connection.send_error(msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable")
        return
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable")
        return
    try:
        billing_document = await _async_billing_document(runtime, executor)
        result = await async_get_energy_flow(
            hass,
            runtime.model,
            billing_document,
            runtime.distribution_manager.data,
            msg.get("billing_reference"),
            now,
            statistics_period=DEFAULT_STATISTICS_PERIOD,
            period_kind=msg.get("period_kind", "cycle"),
            # O fuso vem do modelo, nao do pedido: um dia civil so existe num
            # fuso, e deixar o cliente escolher abriria a porta para dois
            # clientes verem dias diferentes com a mesma data.
            timezone=get_timezone(get_timezone_name(runtime.model)),
        )
        serialized = serialize_energy_flow(result)
    except EquatorialAdapterError:
        connection.send_error(msg["id"], "billing_source_unavailable", "Billing source is unavailable")
        return
    except EnergyFlowInvalidReferenceError:
        connection.send_error(msg["id"], "energy_flow_invalid_reference", "Closed billing reference is unavailable")
        return
    except EnergyFlowUnavailableError:
        connection.send_error(msg["id"], "energy_flow_unavailable", "Energy flow is unavailable")
        return
    except (EnergyFlowError, EnergyFlowSerializationError):
        _LOGGER.error("Could not build or serialize energy flow", exc_info=True)
        connection.send_error(msg["id"], "energy_flow_failed", "Could not build energy flow")
        return
    connection.send_result(msg["id"], {"api_version": API_VERSION, "data": serialized})


async def _async_handle_get_history(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Handle one validated calendar-history request."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"],
            "runtime_unavailable",
            "CoEnergy runtime is unavailable",
        )
        return

    mode = msg.get("mode", DEFAULT_HISTORY_MODE)
    billing_document = None
    if mode == "cycle":
        executor = getattr(hass, "async_add_executor_job", None)
        if not callable(executor):
            connection.send_error(
                msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
            )
            return
        try:
            billing_document = await _async_billing_document(runtime, executor)
        except EquatorialAdapterError:
            _LOGGER.error("Could not reload the Equatorial billing source", exc_info=True)
            connection.send_error(
                msg["id"], "billing_source_unavailable", "Billing source is unavailable"
            )
            return

    try:
        arguments = {
            "resolution": msg.get("resolution"),
            "now": now,
            "mode": mode,
        }
        if mode == "cycle":
            arguments["billing_document"] = billing_document
        history = await async_get_history(
            hass, runtime.model, msg["unit_id"], msg["reference"], **arguments
        )
    except HistoryUnknownUnitError:
        connection.send_error(
            msg["id"], "history_unknown_unit", "History unit is unavailable"
        )
        return
    except HistoryInvalidReferenceError:
        connection.send_error(
            msg["id"], "history_invalid_reference", "History reference is invalid"
        )
        return
    except HistoryFutureReferenceError:
        connection.send_error(
            msg["id"],
            "history_future_reference",
            "History reference must not be in the future",
        )
        return
    except HistoryUnavailableError:
        connection.send_error(
            msg["id"], "history_unavailable", "History is unavailable"
        )
        return
    except HistoryError:
        _LOGGER.error("Could not build unit history", exc_info=True)
        connection.send_error(
            msg["id"], "history_failed", "Could not build unit history"
        )
        return
    except Exception:
        _LOGGER.error("Unexpected failure while building unit history", exc_info=True)
        connection.send_error(
            msg["id"], "history_failed", "Could not build unit history"
        )
        return

    try:
        serialized = serialize_history(history)
    except HistorySerializationError:
        _LOGGER.error("Could not serialize unit history", exc_info=True)
        connection.send_error(
            msg["id"], "serialization_failed", "Could not serialize unit history"
        )
        return

    connection.send_result(
        msg["id"],
        {"api_version": API_VERSION, "data": serialized},
    )


async def _async_handle_get_cycles(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Handle one validated billing-cycle catalog request."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        billing_document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.error("Could not reload the Equatorial billing source", exc_info=True)
        connection.send_error(
            msg["id"], "billing_source_unavailable", "Billing source is unavailable"
        )
        return
    try:
        cycles = get_billing_cycles(
            runtime.model, billing_document, msg["unit_id"], now
        )
        serialized = serialize_cycle_catalog(msg["unit_id"], cycles)
    except BillingCycleError:
        _LOGGER.error("Could not build closed-cycle catalog", exc_info=True)
        connection.send_error(msg["id"], "cycles_failed", "Could not build cycles")
        return
    except CycleCatalogSerializationError:
        _LOGGER.error("Could not serialize closed-cycle catalog", exc_info=True)
        connection.send_error(
            msg["id"], "serialization_failed", "Could not serialize cycles"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


async def _async_handle_get_comparison(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Handle one validated monthly-comparison request."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        comparison_arguments = {}
        if "strategy" in msg or "window_days" in msg or "resolution" in msg:
            comparison_arguments = {
                "strategy": msg.get("strategy", "automatic"),
                "base_start": msg.get("base_start"),
                "base_end": msg.get("base_end"),
                "comparison_start": msg.get("comparison_start"),
                "comparison_end": msg.get("comparison_end"),
            }
            if "window_days" in msg:
                comparison_arguments["window_days"] = msg["window_days"]
            if "resolution" in msg:
                comparison_arguments["resolution"] = msg["resolution"]
            if "period_type" in msg:
                comparison_arguments["period_type"] = msg["period_type"]
            if "cut_instant" in msg:
                comparison_arguments["cut_instant"] = msg["cut_instant"]
            # A comparacao por ciclo precisa saber onde cada ciclo comeca, e
            # isso vem da fatura. Carregar o documento so neste caso mantem os
            # outros modos com o mesmo custo de antes.
            if msg.get("period_type") == "cycle":
                executor = getattr(hass, "async_add_executor_job", None)
                if not callable(executor):
                    connection.send_error(
                        msg["id"],
                        "comparison_unavailable",
                        "Comparison is unavailable",
                    )
                    return
                document = await _async_billing_document(runtime, executor)
                comparison_arguments["billing_cycles"] = get_billing_cycles(
                    runtime.model, document, msg["unit_id"], now
                )
        comparison = await async_get_comparison(
            hass,
            runtime.model,
            msg["unit_id"],
            msg["mode"],
            msg.get("reference"),
            msg.get("logical_id"),
            now,
            **comparison_arguments,
        )
    # Unico ponto que carregava o documento sem tratar a ausencia dele. Com a
    # integracao subindo mesmo sem arquivo de faturas, o erro chegaria aqui cru
    # e viraria falha generica do WebSocket em vez de "indisponivel" na tela.
    except EquatorialAdapterError:
        connection.send_error(
            msg["id"], "comparison_unavailable", "Comparison is unavailable"
        )
        return
    except ComparisonUnknownUnitError:
        connection.send_error(
            msg["id"], "comparison_unknown_unit", "Comparison unit is unavailable"
        )
        return
    except ComparisonInvalidModeError:
        connection.send_error(
            msg["id"], "comparison_invalid_mode", "Comparison mode is invalid"
        )
        return
    except ComparisonInvalidReferenceError:
        connection.send_error(
            msg["id"],
            "comparison_invalid_reference",
            "Comparison reference is invalid",
        )
        return
    except ComparisonFutureReferenceError:
        connection.send_error(
            msg["id"],
            "comparison_future_reference",
            "Comparison reference must not be in the future",
        )
        return
    except ComparisonInvalidResolutionError:
        connection.send_error(
            msg["id"], "comparison_invalid_resolution", "Comparison resolution is invalid"
        )
        return
    except ComparisonHourlyRangeTooLongError:
        connection.send_error(
            msg["id"],
            "comparison_hourly_range_too_long",
            "Hourly comparison range is too long",
        )
        return
    except ComparisonMixedRangeTypesError:
        connection.send_error(
            msg["id"],
            "comparison_mixed_range_types_not_allowed",
            "Mixed comparison range types are not allowed",
        )
        return
    except ComparisonIntervalRequiresDistinctDatesError:
        connection.send_error(
            msg["id"],
            "comparison_interval_requires_distinct_dates",
            "Comparison ranges require distinct start and end dates",
        )
        return
    except ComparisonDayRequiresSingleDateError:
        connection.send_error(
            msg["id"],
            "comparison_day_requires_single_date",
            "Day comparison requires one date on each side",
        )
        return
    except ComparisonInvalidLogicalIdError:
        connection.send_error(
            msg["id"],
            "comparison_invalid_logical_id",
            "Comparison logical_id is invalid",
        )
        return
    except ComparisonUnavailableError:
        connection.send_error(
            msg["id"], "comparison_unavailable", "Comparison is unavailable"
        )
        return
    except ComparisonError:
        _LOGGER.error("Could not build unit comparison", exc_info=True)
        connection.send_error(
            msg["id"], "comparison_failed", "Could not build unit comparison"
        )
        return
    except Exception:
        _LOGGER.error("Unexpected failure while building unit comparison", exc_info=True)
        connection.send_error(
            msg["id"], "comparison_failed", "Could not build unit comparison"
        )
        return
    try:
        serialized = serialize_comparison(comparison)
    except ComparisonSerializationError:
        _LOGGER.error("Could not serialize unit comparison", exc_info=True)
        connection.send_error(
            msg["id"], "serialization_failed", "Could not serialize unit comparison"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


async def _async_handle_get_audit(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
) -> None:
    """Handle one validated official-cycle audit request."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        billing_document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.error("Could not reload the Equatorial billing source", exc_info=True)
        connection.send_error(
            msg["id"], "audit_unavailable", "Audit is unavailable"
        )
        return

    try:
        result = await async_get_unit_audit_result(
            hass,
            runtime.model,
            billing_document,
            msg["unit_id"],
            msg["billing_reference"],
        )
    except UnitAuditUnknownUnitError:
        connection.send_error(
            msg["id"], "audit_unknown_unit", "Audit unit is unavailable"
        )
        return
    except UnitAuditInvalidReferenceError:
        connection.send_error(
            msg["id"], "audit_invalid_reference", "Audit reference is invalid"
        )
        return
    except UnitAuditUnavailableError:
        connection.send_error(
            msg["id"], "audit_unavailable", "Audit is unavailable"
        )
        return
    except UnitAuditResultError:
        _LOGGER.error("Could not build unit audit", exc_info=True)
        connection.send_error(msg["id"], "audit_failed", "Could not build audit")
        return
    except Exception:
        _LOGGER.error("Unexpected failure while building unit audit", exc_info=True)
        connection.send_error(msg["id"], "audit_failed", "Could not build audit")
        return

    try:
        serialized = serialize_audit(result)
    except AuditSerializationError:
        _LOGGER.error("Could not serialize unit audit", exc_info=True)
        connection.send_error(
            msg["id"], "serialization_failed", "Could not serialize audit"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


async def _async_handle_get_scee(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
) -> None:
    """Handle one exact official-bill SCEE request."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    try:
        billing_document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.error("Could not reload the Equatorial billing source", exc_info=True)
        connection.send_error(
            msg["id"],
            "billing_source_unavailable",
            "Billing source is unavailable",
        )
        return

    try:
        result = get_official_scee_record(
            runtime.model,
            billing_document,
            msg["unit_id"],
            msg["billing_reference"],
        )
    except SceeUnknownUnitError:
        connection.send_error(
            msg["id"], "scee_unknown_unit", "SCEE unit is unavailable"
        )
        return
    except SceeUnavailableError:
        connection.send_error(
            msg["id"], "scee_unavailable", "SCEE is unavailable"
        )
        return
    except SceeInvalidReferenceError:
        connection.send_error(
            msg["id"], "scee_invalid_reference", "SCEE reference is invalid"
        )
        return
    except SceeNotFoundError:
        connection.send_error(
            msg["id"], "scee_not_found", "SCEE bill was not found"
        )
        return
    except SceeError:
        _LOGGER.error("Could not build official SCEE data", exc_info=True)
        connection.send_error(msg["id"], "scee_failed", "Could not build SCEE data")
        return
    except Exception:
        _LOGGER.error("Unexpected failure while building SCEE data", exc_info=True)
        connection.send_error(msg["id"], "scee_failed", "Could not build SCEE data")
        return

    try:
        serialized = serialize_official_scee_record(result)
    except SceeSerializationError:
        _LOGGER.error("Could not serialize official SCEE data", exc_info=True)
        connection.send_error(
            msg["id"], "serialization_failed", "Could not serialize SCEE data"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


async def _async_handle_get_finance(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
) -> None:
    """Handle one exact read-only official financial request."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "finance_unavailable", "Finance is unavailable"
        )
        return
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(
            msg["id"], "finance_unavailable", "Finance is unavailable"
        )
        return
    try:
        billing_document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.error("Could not reload the official financial source", exc_info=True)
        connection.send_error(
            msg["id"], "finance_unavailable", "Finance is unavailable"
        )
        return

    # Quem decide se a unidade existe e o modelo, nao o arquivo de faturas.
    # A distincao importa: um pedido com unidade inventada e invalido, e uma
    # unidade recem configurada, que ainda nao teve fatura extraida, apenas
    # nao tem financeiro — e responder "invalido" a ela derrubava a tela.
    if msg["unit_id"] not in get_unit_ids(runtime.model):
        connection.send_error(
            msg["id"], "finance_invalid", "Finance request is invalid"
        )
        return

    try:
        result = get_official_financial_snapshot(
            billing_document,
            msg["unit_id"],
            msg["billing_reference"],
        )
    except FinanceError:
        connection.send_error(
            msg["id"], "finance_invalid", "Finance request is invalid"
        )
        return
    except Exception:
        _LOGGER.error("Could not build official financial data", exc_info=True)
        connection.send_error(
            msg["id"], "finance_unavailable", "Finance is unavailable"
        )
        return
    if result is None:
        connection.send_error(
            msg["id"], "finance_not_found", "Official finance was not found"
        )
        return

    try:
        serialized = serialize_official_financial_snapshot(result)
    except FinanceSerializationError:
        _LOGGER.error("Could not serialize official financial data", exc_info=True)
        connection.send_error(
            msg["id"],
            "finance_serialization_error",
            "Could not serialize official finance",
        )
        return
    connection.send_result(msg["id"], serialized)


async def _total_today(
    hass: Any,
    model: Mapping[str, Any],
    logical_id: str,
    period: Any,
    statistics_period: str,
) -> float | None:
    """Total one logical series over the day, treating failure as absence."""
    try:
        result = await async_get_energy_period(
            hass, model, logical_id, period, statistics_period
        )
    except EnergyPeriodError:
        return None
    return result.value


async def _async_handle_get_daily_balance(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Return one unit's energy position for the day in progress.

    O recebido do dia aplica, na janela de um dia, a mesma regra que o fluxo
    aplica na janela do ciclo: excedente do gerador vezes o percentual de
    rateio. A apuracao oficial continua sendo por ciclo — o contrato diz isso
    em `warnings`, e a classificacao e `estimated`.
    """
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "daily_balance_unavailable", "Daily balance is unavailable"
        )
        return

    unit_id = msg["unit_id"]
    statistics_period = msg.get("statistics_period", DEFAULT_STATISTICS_PERIOD)
    try:
        # O dia comeca a meia-noite local e termina agora: e o dia corrente,
        # ainda em formacao, que e o que a pergunta "hoje" quer dizer.
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        # `mode` e obrigatorio no Period e nomeia a janela: "day" e o que os
        # adaptadores esperam para uma leitura de dia corrente.
        period = Period(start=start, end=now, mode="day")

        # Sem geradora nao ha o que ratear, mas o consumo de hoje continua
        # existindo — e e ele que o cartao mostra em "Hoje". Exigir a geradora
        # aqui derrubava o balanco inteiro, e o consumo junto.
        gerador = _generator_unit_id_or_none(runtime)
        consumo_id = _daily_consumption_logical_id(runtime.model, unit_id)
        consumed = None
        if consumo_id is not None:
            consumed = await _total_today(
                hass, runtime.model, consumo_id, period, statistics_period
            )
        elif unit_id == gerador:
            # O gerador nao tem serie de consumo: o consumo fisico dele e
            # derivado, e a formula ja existe no dominio de energia.
            generation = await _total_today(
                hass, runtime.model, f"{unit_id}.generation_energy",
                period, statistics_period,
            )
            exported = await _total_today(
                hass, runtime.model, f"{unit_id}.export_energy",
                period, statistics_period,
            )
            imported = await _total_today(
                hass, runtime.model, f"{unit_id}.import_energy",
                period, statistics_period,
            )
            consumed = calculate_physical_consumption(
                imported, calculate_self_consumption(generation, exported)
            )

        generated_today = exported_today = imported_today = None
        if gerador is not None:
            generated_today = await _total_today(
                hass, runtime.model, f"{gerador}.generation_energy",
                period, statistics_period,
            )
            exported_today = await _total_today(
                hass, runtime.model, f"{gerador}.export_energy",
                period, statistics_period,
            )
            imported_today = await _total_today(
                hass, runtime.model, f"{gerador}.import_energy",
                period, statistics_period,
            )
        distributable = calculate_daily_distributable(exported_today, imported_today)

        share = None
        manager = runtime.distribution_manager
        # Rateio pendente deixa a parte desconhecida, e nao derruba o balanco.
        if (
            gerador is not None and manager is not None and manager.available
            and manager.data.rules
        ):
            snapshot = resolve_distribution(manager.data, now, manager.unit_ids)
            share = snapshot.shares.get(unit_id)

        result = build_daily_energy_balance(
            unit_id=unit_id,
            day_start=start,
            day_end=now,
            consumed_kwh=consumed,
            distributable_kwh=distributable,
            share_percent=share,
            generator_generation_kwh=generated_today,
            generator_export_kwh=exported_today,
        )
        serialized = serialize_daily_energy_balance(result)
    except (
        DailyEnergyBalanceError,
        DailyEnergyBalanceSerializationError,
        DistributionError,
        EnergyCalculationError,
        PeriodError,
    ):
        _LOGGER.error("Could not build the daily energy balance", exc_info=True)
        connection.send_error(
            msg["id"], "daily_balance_unavailable", "Daily balance is unavailable"
        )
        return
    except Exception:
        _LOGGER.error("Unexpected daily balance failure", exc_info=True)
        connection.send_error(
            msg["id"], "daily_balance_failed", "Could not build the daily balance"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


async def _async_handle_get_instant_statistics(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Return the last 24 hours of each instantaneous measurement of one unit.

    O Recorder ja guarda media, minimo e maximo por intervalo de 5 minutos
    para sensores de medicao. Aqui isso e lido e devolvido na unidade que o
    modelo declara — nada e recalculado a partir de estado bruto.

    A unidade da entidade vem do estado atual, nao do Recorder: e a mesma
    conversao que o valor instantaneo sofre, e ela precisa ser uma so. Sem
    isto uma entidade em mA — como a corrente de um medidor antes de uma troca de
    12/09/2026 — apareceria em A ao vivo e em mA no maximo.
    """
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"],
            "instant_statistics_unavailable",
            "Instantaneous statistics are unavailable",
        )
        return

    unit_id = msg["unit_id"]
    try:
        state_units: dict[str, str | None] = {}
        for logical_id in instant_measurement_ids(runtime.model, unit_id):
            try:
                state_units[logical_id] = get_logical_current_state(
                    hass, runtime.model, logical_id
                ).state_unit
            except LogicalStateError:
                # Entidade ausente agora nao apaga o historico dela: sem a
                # unidade corrente nao se converte, e o valor viaja como o
                # Recorder gravou. E o mesmo comportamento do valor ao vivo.
                state_units[logical_id] = None
        result = await async_build_instant_statistics(
            hass, runtime.model, unit_id, now, state_units
        )
        serialized = serialize_instant_statistics(result)
    except InstantStatisticsUnknownUnitError:
        connection.send_error(
            msg["id"], "instant_statistics_unknown_unit", "Unknown unit"
        )
        return
    except InstantStatisticsUnavailableError:
        connection.send_error(
            msg["id"],
            "instant_statistics_unavailable",
            "Instantaneous statistics are unavailable",
        )
        return
    except (InstantStatisticsError, InstantStatisticsSerializationError):
        _LOGGER.error("Could not build instantaneous statistics", exc_info=True)
        connection.send_error(
            msg["id"],
            "instant_statistics_failed",
            "Could not build instantaneous statistics",
        )
        return
    except Exception:
        _LOGGER.error("Unexpected instantaneous statistics failure", exc_info=True)
        connection.send_error(
            msg["id"],
            "instant_statistics_failed",
            "Could not build instantaneous statistics",
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


def _handle_get_measurements(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
) -> None:
    """Return only the live measurements of one unit.

    E o recorte mais barato do overview. A interface chama este comando quando
    o Home Assistant avisa que algum estado mudou, em vez de recarregar ciclo,
    previsao e fatura para atualizar tensao, corrente e potencia.

    Sincrono de proposito: ler o estado atual nao toca no Recorder nem na rede.
    """
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "measurements_unavailable", "Measurements are unavailable"
        )
        return

    unit_id = msg["unit_id"]
    try:
        logical_ids = get_measurement_logical_ids(runtime.model, unit_id)
        medicoes = get_logical_current_states(hass, runtime.model, logical_ids)
        serialized = serialize_measurements(unit_id, medicoes)
    except EnergyModelError:
        connection.send_error(
            msg["id"], "measurements_unknown_unit", "Unknown unit"
        )
        return
    except (LogicalStateError, MeasurementsSerializationError):
        _LOGGER.error("Could not read live measurements", exc_info=True)
        connection.send_error(
            msg["id"], "measurements_failed", "Could not read the measurements"
        )
        return
    except Exception:
        _LOGGER.error("Unexpected live measurements failure", exc_info=True)
        connection.send_error(
            msg["id"], "measurements_failed", "Could not read the measurements"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


async def _async_handle_get_data_health(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Return sensors, sources, coverage and invoice health of every unit.

    O arquivo de faturas que nao abre nao derruba a pagina: sensores e
    cobertura continuam valendo, e o relatorio diz que a parte da fatura faltou.
    """
    runtime = hass.data.get(DOMAIN)
    executor = getattr(hass, "async_add_executor_job", None)
    if not isinstance(runtime, CoEnergyRuntime) or not callable(executor):
        connection.send_error(
            msg["id"], "data_health_unavailable", "Data health is unavailable"
        )
        return
    try:
        document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.warning("Data health without the invoice file", exc_info=True)
        document = None
    # A configuração financeira entra só para confrontar a tarifa declarada com
    # a que a fatura publica; sem ela a página perde o aviso, não a página.
    investment = None
    if runtime.financial_model_path:
        try:
            investment = await _async_effective_financial_model(hass, runtime)
        except FinancialModelError:
            _LOGGER.warning("Data health without the financial model", exc_info=True)
    try:
        result = await async_build_data_health(
            hass, runtime.model, document, now, investment
        )
        serialized = serialize_data_health(result)
    except (DataHealthError, DataHealthSerializationError):
        _LOGGER.error("Could not build data health", exc_info=True)
        connection.send_error(
            msg["id"], "data_health_unavailable", "Data health is unavailable"
        )
        return
    except Exception:
        _LOGGER.error("Unexpected data health failure", exc_info=True)
        connection.send_error(
            msg["id"], "data_health_failed", "Could not build data health"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


def _daily_consumption_logical_id(
    model: Mapping[str, Any], unit_id: str
) -> str | None:
    """The measured consumption series of one unit, when it has one."""
    logical_id = f"{unit_id}.consumption_energy"
    try:
        get_series_definition(model, logical_id)
    except Exception:
        return None
    return logical_id


def _investimento_declarado(configuration: Any) -> dict[str, str] | None:
    """O investimento como um valor só: é o total que o payback consome."""
    if configuration is None or not configuration.investments:
        return None
    primeiro = configuration.investments[0]
    return {
        "amount": format(configuration.investment_total, "f"),
        "period": primeiro.payment_period,
    }


def _tem_geradora(model: Mapping[str, Any]) -> bool:
    """Se alguma unidade gera energia — quem decide se existe payback."""
    try:
        return bool(get_generator_unit_id(model))
    except EnergyModelError:
        return False


def _settings_payload(runtime: CoEnergyRuntime, configuration: Any) -> dict[str, Any]:
    """The declared baseline, the override and the effective value, side by side.

    Os tres juntos de proposito: sem a base, a interface nao consegue mostrar
    o que um "limpar" restauraria, e o operador editaria no escuro.
    """
    manager = runtime.settings_manager
    settings = manager.settings if manager is not None else None
    base = runtime.base_model or runtime.model
    base_boundary = base.get("billing", {}).get("boundary_time")
    efetivo = runtime.model.get("billing", {}).get("boundary_time")
    ajuste_tarifas = (
        {} if settings is None or settings.tariffs_without_taxes is None
        else {vigencia.isoformat(): format(value, "f")
              for vigencia, value in settings.tariffs_without_taxes.items()}
    )
    declaradas = {
        item.effective_from.isoformat(): format(item.tariff_without_taxes, "f")
        for item in (configuration.distributor_tariffs if configuration else ())
    }
    fontes = {
        item.effective_from.isoformat(): item.source
        for item in (configuration.distributor_tariffs if configuration else ())
    }
    ajuste_investimento = (
        None
        if settings is None or settings.solar_investment is None
        else {
            "amount": format(settings.solar_investment.amount, "f"),
            "period": settings.solar_investment.period,
        }
    )
    efetiva_config = (
        configuration if settings is None
        else apply_to_financial_model(configuration, settings)
    )
    efetivas = {
        item.effective_from.isoformat(): format(item.tariff_without_taxes, "f")
        for item in (efetiva_config.distributor_tariffs if efetiva_config else ())
    }
    return {
        "boundary_time": {
            "declared": base_boundary,
            "override": None if settings is None else settings.boundary_time,
            "effective": efetivo,
        },
        "distributor_tariffs": {
            "declared": declaradas,
            "override": ajuste_tarifas,
            "effective": efetivas,
            "sources": fontes,
        },
        "solar_investment": {
            "declared": _investimento_declarado(configuration),
            "override": ajuste_investimento,
            # O informado vence o declarado, e vence também quando não há
            # arquivo nenhum para declarar: uma instalação que nunca teve YAML
            # mostrava "não informado" em cima do valor que acabara de digitar.
            "effective": (
                ajuste_investimento or _investimento_declarado(efetiva_config)
            ),
            # Sem unidade que gera, não há payback, e perguntar quanto custou o
            # sistema solar de quem não tem um só confunde.
            "applies": _tem_geradora(runtime.model),
        },
        "updated_at": (
            None if settings is None or settings.updated_at is None
            else settings.updated_at.isoformat()
        ),
        "timezone": base.get("general", {}).get("timezone"),
    }


async def _async_effective_financial_model(hass: Any, runtime: CoEnergyRuntime) -> Any:
    """A configuração financeira como ela vale: o arquivo com a tela por cima.

    Ponto único de propósito. Quem lia o arquivo direto enxergava a tarifa e o
    investimento declarados, não os informados na Configuração — dois números
    para a mesma pergunta, e o operador sem como saber qual tela usou qual.

    Levanta ``FinancialModelError``: quem chama já trata a ausência.
    """
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        return None
    if runtime.settings_manager is None:
        if not runtime.financial_model_path:
            return None
        return await executor(load_financial_model, runtime.financial_model_path)
    # Sem arquivo, a base neutra: e sobre ela que o valor informado na tela
    # pousa. Antes, uma instalacao sem arquivo nenhum digitava o investimento
    # e o payback continuava dizendo que nao havia configuracao financeira.
    configuration = (
        await executor(load_financial_model, runtime.financial_model_path)
        if runtime.financial_model_path
        else base_financial_configuration()
    )
    return apply_to_financial_model(configuration, runtime.settings_manager.settings)


async def _async_settings_configuration(hass: Any, runtime: CoEnergyRuntime) -> Any:
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor) or not runtime.financial_model_path:
        return None
    try:
        return await executor(load_financial_model, runtime.financial_model_path)
    except FinancialModelError:
        _LOGGER.error("Could not load the financial model for settings", exc_info=True)
        return None


async def _async_handle_get_settings(
    hass: Any, connection: Any, msg: Mapping[str, Any]
) -> None:
    """Return the declared baseline, the stored override and what is in force."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "settings_unavailable", "Settings are unavailable"
        )
        return
    try:
        configuration = await _async_settings_configuration(hass, runtime)
        payload = _settings_payload(runtime, configuration)
    except Exception:
        _LOGGER.error("Could not build the settings payload", exc_info=True)
        connection.send_error(
            msg["id"], "settings_unavailable", "Settings are unavailable"
        )
        return
    connection.send_result(msg["id"], {"api_version": API_VERSION, "data": payload})


async def _async_handle_set_settings(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Persist an override and rebuild the effective model without a restart.

    Trocar o horario de fronteira recalcula todo o historico — a hora da
    leitura nao esta gravada em ciclo nenhum. Por isso a resposta devolve o
    estado inteiro, e nao um "ok": a interface tem de mostrar o que passou a
    valer.
    """
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime) or runtime.settings_manager is None:
        connection.send_error(
            msg["id"], "settings_unavailable", "Settings are unavailable"
        )
        return
    try:
        argumentos: dict[str, Any] = {"now": now}
        if "boundary_time" in msg:
            argumentos["boundary_time"] = msg["boundary_time"]
        if "distributor_tariffs" in msg:
            bruto = msg["distributor_tariffs"]
            argumentos["tariffs_without_taxes"] = (
                None if bruto is None
                else {
                    date.fromisoformat(str(vigencia)): value
                    for vigencia, value in bruto.items()
                }
            )
        if "solar_investment" in msg:
            argumentos["solar_investment"] = msg["solar_investment"]
        settings = await runtime.settings_manager.async_update(**argumentos)

        # O runtime e congelado: o modelo efetivo novo entra por substituicao.
        atualizado = dataclasses.replace(
            runtime,
            model=apply_to_model(runtime.base_model or runtime.model, settings),
        )
        hass.data[DOMAIN] = atualizado
        configuration = await _async_settings_configuration(hass, atualizado)
        payload = _settings_payload(atualizado, configuration)
    except (OperationalSettingsError, ValueError, TypeError):
        connection.send_error(
            msg["id"], "settings_invalid", "Settings payload is invalid"
        )
        return
    except Exception:
        _LOGGER.error("Could not persist the operational settings", exc_info=True)
        connection.send_error(
            msg["id"], "settings_failed", "Could not persist the settings"
        )
        return
    connection.send_result(msg["id"], {"api_version": API_VERSION, "data": payload})


def _presence_map(hass: Any, entity_ids: Sequence[str]) -> dict[str, str]:
    """Apura, para cada entidade, se ela existe e esta reportando.

    Tres respostas distintas de proposito. "Nao existe" e o unico caso em que
    o modelo aponta para o vazio e nenhum numero vai sair dali — e o que a tela
    precisa destacar. "Existe mas sem valor" e um sensor offline, que se
    resolve no equipamento, nao na configuracao. E uma leitura que falha nao
    pode virar nenhum dos dois: vira "nao apurado".
    """
    presenca: dict[str, str] = {}
    for entity_id in entity_ids:
        try:
            estado = get_current_state(hass, entity_id)
        except Exception:
            # Apurar presenca e informativo: uma leitura que falha nao pode
            # derrubar a tela de configuracao, que e justamente onde se
            # conserta um sensor errado.
            presenca[entity_id] = PRESENCE_UNKNOWN
            continue
        if estado.raw_state is None:
            presenca[entity_id] = PRESENCE_MISSING
        elif not estado.available:
            presenca[entity_id] = PRESENCE_UNAVAILABLE
        else:
            presenca[entity_id] = PRESENCE_PRESENT
    return presenca


def _sensors_payload(
    runtime: CoEnergyRuntime, hass: Any, now: datetime | None = None
) -> dict[str, Any]:
    """The catalog the configuration screen reads.

    `now` diz qual fonte de cada grandeza esta em uso: uma troca de medidor
    deixa duas, e so a vigencia separa a que vale hoje da que ficou para tras.
    """
    manager = runtime.overrides_manager
    overrides = manager.overrides if manager is not None else SensorOverrides()
    # O catalogo fala da entidade DECLARADA, entao sai do YAML — nao do modelo
    # efetivo, onde a troca ja aconteceu e o nome declarado se perdeu.
    declarado = runtime.declared_model or runtime.model
    mapa = overrides.entity_ids or {}
    efetivas = [
        mapa.get(declarada, declarada)
        for declarada in declared_entity_ids(declarado)
    ]
    catalogo = build_sensor_catalog(
        declarado, overrides, _presence_map(hass, efetivas), now
    )
    catalogo["updated_at"] = (
        overrides.updated_at.isoformat() if overrides.updated_at else None
    )
    return catalogo


async def _async_handle_get_sensors(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime | None = None
) -> None:
    """Return every declared sensor, what is in force and whether it exists."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "sensors_unavailable", "Sensors are unavailable"
        )
        return
    try:
        payload = _sensors_payload(runtime, hass, now)
    except Exception:
        _LOGGER.error("Could not build the sensors payload", exc_info=True)
        connection.send_error(
            msg["id"], "sensors_unavailable", "Sensors are unavailable"
        )
        return
    connection.send_result(msg["id"], {"api_version": API_VERSION, "data": payload})


async def _async_handle_set_sensors(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Persist the mapping and rebuild the effective model without a restart.

    A resposta devolve o catalogo inteiro, e nao um "ok": trocar uma entidade
    muda de onde cada serie le, e a tela tem de mostrar o que passou a valer —
    inclusive se a entidade nova tambem nao existe.
    """
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime) or runtime.overrides_manager is None:
        connection.send_error(
            msg["id"], "sensors_unavailable", "Sensors are unavailable"
        )
        return
    try:
        overrides = await runtime.overrides_manager.async_update(
            # Campo ausente e "nao mexa"; `None` explicito e "limpe tudo". Com
            # `msg.get`, os dois virariam a mesma coisa, e uma mensagem sem o
            # campo apagaria a correspondencia inteira em silencio.
            entity_ids=msg["entity_ids"] if "entity_ids" in msg else ...,
            now=now,
        )

        # O runtime e congelado: o modelo efetivo novo entra por substituicao.
        # A ordem e a mesma da construcao — entidades primeiro, ajustes
        # operacionais depois —, senao um ajuste de fronteira se perderia.
        declarado = runtime.declared_model or runtime.model
        base = apply_overrides_to_model(declarado, overrides)
        settings = (
            runtime.settings_manager.settings
            if runtime.settings_manager is not None
            else None
        )
        efetivo = base if settings is None else apply_to_model(base, settings)
        atualizado = dataclasses.replace(
            runtime, base_model=base, model=efetivo
        )
        hass.data[DOMAIN] = atualizado
        payload = _sensors_payload(atualizado, hass, now)
    except (SensorOverridesError, ValueError, TypeError):
        connection.send_error(
            msg["id"], "sensors_invalid", "Sensors payload is invalid"
        )
        return
    except Exception:
        _LOGGER.error("Could not persist the sensor mapping", exc_info=True)
        connection.send_error(
            msg["id"], "sensors_failed", "Could not persist the sensor mapping"
        )
        return
    connection.send_result(msg["id"], {"api_version": API_VERSION, "data": payload})


def _filed_by_uc(runtime: CoEnergyRuntime, document: Any) -> Any:
    """Return the document with each bill under the unit that owns its UC.

    E aqui, e so aqui, que a UC declarada na tela decide de quem e a fatura.
    Cada handler le o documento e passa por este ponto antes de qualquer
    calculo — ciclo, financeiro, SCEE, auditoria, saude dos dados —, e por
    isso nenhum deles precisa saber que a UC existe.
    """
    return assign_bills_by_uc(document, runtime.model)


def _storage_is_the_source(runtime: CoEnergyRuntime) -> bool:
    """As faturas guardadas valem como oficiais.

    Duas situações levam ao mesmo lugar, e só uma é escolha:

    * **o operador confirmou** — tinha arquivo, comparou e virou a chave;
    * **não há arquivo** — e aí não há o que escolher.

    A segunda é toda instalação nova. Sem ela, quem instala lê na tela que
    está "em uso o arquivo do extrator antigo" — um extrator que nunca teve,
    de um arquivo que não existe — e as telas de faturamento ficam vazias até
    ele descobrir sozinho que precisa clicar num botão.

    O padrão ``em_uso=False`` continua certo para quem tem arquivo: ali as
    faturas lidas esperam conferência, e virar a chave sem comparar seria
    trocar a fonte oficial no escuro.
    """
    manager = runtime.invoice_manager
    if manager is None:
        return False
    # "Não há arquivo" é não haver arquivo NO DISCO, e não só não haver
    # caminho declarado. Um modelo trazido de outra instalação chega com o
    # caminho da de lá; aqui o arquivo não existe, e exigir confirmação para
    # trocar para as faturas lidas deixava o painel inteiro travado em
    # "Arquivo de faturas pendente", com as faturas guardadas ao lado.
    return bool(manager.stored.em_uso) or not _billing_file_exists(runtime)


async def _async_billing_document(runtime: CoEnergyRuntime, executor: Any) -> Any:
    """The invoices every screen reads — the one place that picks the source.

    Com as faturas do storage confirmadas pelo operador, sao elas; antes
    disso, o arquivo de sempre. Nenhum handler escolhe por conta propria: se
    cada um decidisse, bastaria um esquecido para duas telas mostrarem faturas
    diferentes da mesma unidade.
    """
    manager = runtime.invoice_manager
    if manager is not None and _storage_is_the_source(runtime):
        if not manager.stored.faturas:
            # Instalacao que ainda nao leu fatura nenhuma. Isso nao e falha:
            # e o comeco de toda instalacao. Responder com erro travava o
            # painel inteiro em "Arquivo de faturas pendente" — sem Visao
            # geral, sem unidades — ate a primeira fatura. Um documento sem
            # faturas deixa cada tela dizer o que falta onde falta, e a
            # medicao dos sensores aparece desde o primeiro dia.
            return parse_equatorial_document(
                build_invoice_document((), runtime.model)
            )
        return manager.document(runtime.model)
    if not runtime.billing_json_path:
        raise EquatorialAdapterError("no invoices yet: none stored, no file")
    return _filed_by_uc(runtime, await executor(
        load_equatorial_document, runtime.billing_json_path
    ))


async def _async_bill_stats(
    hass: Any, runtime: CoEnergyRuntime
) -> dict[str, dict[str, Any]] | None:
    """What each UC found in the invoices, or None when they are unreadable.

    None, e nao um dicionario vazio: sem o documento nao se sabe quantas
    faturas cada UC tem, e a tela nao deve dizer zero.
    """
    try:
        document = await _async_billing_document(
            runtime, hass.async_add_executor_job
        )
    except Exception:  # noqa: BLE001 - a contagem e um extra da tela
        _LOGGER.debug("Bill stats unavailable", exc_info=True)
        return None
    return bill_stats_by_uc(document)


def _model_config_payload(
    hass: Any,
    runtime: CoEnergyRuntime,
    now: datetime | None = None,
    bill_stats: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """O estado da configuracao do modelo, com as fotos disponiveis junto.

    `now` diz qual fonte de cada grandeza esta em uso: uma troca de medidor
    deixa duas, e so a vigencia separa a que vale hoje da que ficou para tras.
    """
    manager = runtime.model_manager
    return build_model_config(
        runtime.declared_model or runtime.model,
        source=runtime.model_source,
        model_path=runtime.model_path,
        images=list_available_images(hass),
        now=now,
        bill_stats=bill_stats,
        updated_at=(
            manager.stored.updated_at.isoformat()
            if manager is not None and manager.stored.updated_at
            else None
        ),
    )


async def _async_reload_entry(hass: Any) -> None:
    """Rebuild everything after the model changed.

    Recarregar em vez de remendar o runtime no lugar: mexer nas unidades
    invalida tambem o rateio configurado, que foi construido a partir do
    modelo antigo. Substituir so o modelo deixaria os dois em desacordo sem
    que nada apontasse para isso.
    """
    entries = hass.config_entries.async_entries(DOMAIN)
    if entries:
        await hass.config_entries.async_reload(entries[0].entry_id)


async def _async_handle_get_model_config(
    hass: Any, connection: Any, msg: Mapping[str, Any],
    now: datetime | None = None,
) -> None:
    """Return the units, where the model came from and what can be chosen."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "model_unavailable", "The model is unavailable"
        )
        return
    try:
        payload = _model_config_payload(
            hass, runtime, now, await _async_bill_stats(hass, runtime)
        )
    except Exception:
        _LOGGER.error("Could not build the model configuration", exc_info=True)
        connection.send_error(
            msg["id"], "model_unavailable", "The model is unavailable"
        )
        return
    connection.send_result(msg["id"], {"api_version": API_VERSION, "data": payload})


async def _async_apply_model_change(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
    change: Any,
) -> None:
    """Apply one pure edit, store it, rebuild, and answer with the config."""
    atualizado = await _async_save_model_change(hass, connection, msg, now, change)
    if atualizado is None:
        return
    connection.send_result(
        msg["id"],
        {
            "api_version": API_VERSION,
            "data": _model_config_payload(
                hass, atualizado, now,
                await _async_bill_stats(hass, atualizado),
            ),
        },
    )


async def _async_save_model_change(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
    change: Any,
) -> CoEnergyRuntime | None:
    """Store one pure edit and rebuild; return the new runtime, or None.

    `change` recebe o modelo declarado e devolve o proximo. Toda a validacao
    mora nele e no storage: aqui so se traduz a recusa e se garante que um
    modelo recusado nao chega ao disco nem ao runtime. Com None, o erro ja foi
    respondido.
    """
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime) or runtime.model_manager is None:
        connection.send_error(
            msg["id"], "model_unavailable", "The model is unavailable"
        )
        return None
    try:
        atual = runtime.declared_model or runtime.model
        proximo = change(atual)
        await runtime.model_manager.async_save(proximo, now=now)
    except (ModelBuilderError, ModelStorageError) as error:
        connection.send_error(msg["id"], "model_invalid", str(error))
        return None
    except Exception:
        _LOGGER.error("Could not persist the energy model", exc_info=True)
        connection.send_error(
            msg["id"], "model_failed", "Could not persist the model"
        )
        return None

    await _async_reload_entry(hass)

    # Lido depois do reload, de proposito: e o runtime novo que diz o que
    # passou a valer, inclusive a origem, que na primeira gravacao deixa de
    # ser o arquivo.
    atualizado = hass.data.get(DOMAIN)
    if not isinstance(atualizado, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "model_unavailable", "The model is unavailable"
        )
        return None
    return atualizado


def _has_owned_invoice(runtime: CoEnergyRuntime) -> bool:
    """Se alguma unidade tem fatura — e não só se há fatura guardada.

    Fatura de UC sem dono não aparece em unidade nenhuma. Contá-la liberava
    as abas de uma instalação cuja única unidade não tinha fatura nem
    sensor: sobras de uma unidade excluída, ou PDFs lidos antes de dizer de
    quem é cada UC, abriam telas vazias. Ela continua na Extração de
    faturas, esperando dono.
    """
    if runtime.billing_json_path and _billing_file_exists(runtime):
        return True
    manager = runtime.invoice_manager
    if manager is None or not manager.stored.faturas:
        return False
    model = runtime.declared_model or runtime.model
    donos: set[str] = set()
    for hashes in declared_uc_hashes(model).values():
        donos.update(hashes)
    return any(get_bill_uc_hash(f) in donos for f in manager.stored.faturas)


def _billing_file_exists(runtime: CoEnergyRuntime) -> bool:
    """Se o arquivo do extrator antigo ainda existe no disco.

    Ter o caminho declarado não basta: com o arquivo apagado, "Voltar para o
    arquivo antigo" trocava a fonte para o nada, e o faturamento de todas as
    unidades ficava vazio até alguém desfazer. Uma checagem de existência é
    barata o bastante para rodar aqui.
    """
    caminho = runtime.billing_json_path
    if not caminho:
        return False
    try:
        return Path(caminho).is_file()
    except OSError:
        return False


def _invoices_payload(runtime: CoEnergyRuntime) -> dict[str, Any]:
    """What the extraction screen shows: the stored bills and who owns each UC."""
    manager = runtime.invoice_manager
    if manager is None:
        return {"available": False}
    stored = manager.stored
    model = runtime.declared_model or runtime.model
    nomes = {
        unit_id: (unit.get("name") or unit_id)
        for unit_id, unit in (model.get("units") or {}).items()
        if isinstance(unit, Mapping)
    }
    ucs = summarize_ucs(stored.faturas, stored.ucs_vistas, model)
    for item in ucs:
        item["unit_name"] = nomes.get(item["unit_id"]) if item["unit_id"] else None
    sem_uc = sum(
        1 for f in stored.faturas
        if not ((f.get("identificacao") or {}).get("uc_hash"))
    )
    return {
        "available": True,
        # O que vale de verdade, não só o que foi confirmado: sem arquivo, as
        # guardadas são a fonte, e a tela precisa dizer isso.
        "in_use": _storage_is_the_source(runtime),
        # Existe alternativa para onde voltar? Sem arquivo declarado não há, e
        # oferecer "voltar para o arquivo antigo" mandaria quem instalou agora
        # para uma fonte que não existe — deixando o faturamento vazio até ele
        # desfazer.
        "has_file": _billing_file_exists(runtime),
        "bills": len(stored.faturas),
        "bills_without_uc": sem_uc,
        "updated_at": stored.updated_at.isoformat() if stored.updated_at else None,
        "ucs": ucs,
        "ucs_without_unit": sum(1 for item in ucs if item["unit_id"] is None),
        "known_files": manager.known_digests(),
        "units": [{"unit_id": u, "name": n} for u, n in nomes.items()],
    }


def _invoice_runtime(hass: Any, connection: Any, msg: Mapping[str, Any]) -> Any:
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime) or runtime.invoice_manager is None:
        connection.send_error(
            msg["id"], "invoices_unavailable", "Invoice storage is unavailable"
        )
        return None
    return runtime


async def _async_handle_get_invoices(
    hass: Any, connection: Any, msg: Mapping[str, Any]
) -> None:
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "runtime_unavailable", "CoEnergy runtime is unavailable"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": _invoices_payload(runtime)}
    )


async def _async_handle_set_uc_owner(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Say which unit a UC belongs to — first answer or correction, same step.

    A fatura nao muda: muda de quem e a UC, e todas as faturas dela passam a
    aparecer na unidade nova, as antigas e as que vierem.
    """
    runtime = _invoice_runtime(hass, connection, msg)
    if runtime is None:
        return
    final = runtime.invoice_manager.stored.ucs_vistas.get(msg["uc_hash"])
    atualizado = await _async_save_model_change(
        hass, connection, msg, now,
        lambda model: set_uc_owner(
            model, msg["uc_hash"], msg.get("unit_id"), suffix=final
        ),
    )
    if atualizado is None:
        return
    if atualizado.invoice_manager is not None:
        await async_write_copy(
            hass, atualizado.invoice_manager, atualizado.model, now
        )
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": _invoices_payload(atualizado)}
    )


async def _async_handle_compare_invoices(
    hass: Any, connection: Any, msg: Mapping[str, Any]
) -> None:
    """Compare the stored bills with the current file, bill by bill.

    E o que se olha antes de virar a chave: se as faturas lidas aqui sairem
    iguais as do arquivo, trocar a fonte nao muda nenhuma tela.
    """
    runtime = _invoice_runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        novo = runtime.invoice_manager.document(runtime.model)
    except EquatorialAdapterError:
        connection.send_error(
            msg["id"], "invoices_empty", "No invoice has been read yet"
        )
        return
    try:
        atual = _filed_by_uc(runtime, await hass.async_add_executor_job(
            load_equatorial_document, runtime.billing_json_path
        ))
    except EquatorialAdapterError:
        atual = parse_equatorial_document({"schema_version": 6, "unidades": {}})
    connection.send_result(
        msg["id"],
        {"api_version": API_VERSION, "data": compare_documents(atual, novo)},
    )


async def _async_handle_use_invoice_storage(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Turn the stored bills into the official source, or go back to the file.

    Volta de proposito: virar a chave nao apaga o arquivo, e desvirar devolve
    tudo como era.
    """
    runtime = _invoice_runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        await runtime.invoice_manager.async_set_in_use(msg["use"], now=now)
    except InvoiceStorageError as error:
        connection.send_error(msg["id"], "invoices_invalid", str(error))
        return
    if msg["use"]:
        await async_write_copy(hass, runtime.invoice_manager, runtime.model, now)
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": _invoices_payload(runtime)}
    )


async def _async_handle_delete_invoice(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Apaga uma fatura guardada e responde com a lista atualizada.

    A cópia JSON do dia é regravada: senão ela seguiria guardando a fatura
    que a pessoa acabou de apagar por estar errada.
    """
    runtime = _invoice_runtime(hass, connection, msg)
    if runtime is None:
        return
    try:
        removida = await runtime.invoice_manager.async_remove(msg["digest"], now=now)
    except InvoiceStorageError as error:
        connection.send_error(msg["id"], "invoices_invalid", str(error))
        return
    if not removida:
        connection.send_error(
            msg["id"], "invoice_not_found", "Esta fatura já não está guardada."
        )
        return
    if runtime.invoice_manager.stored.faturas:
        await async_write_copy(hass, runtime.invoice_manager, runtime.model, now)
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": _invoices_payload(runtime)}
    )


async def _async_handle_export_invoices(
    hass: Any, connection: Any, msg: Mapping[str, Any]
) -> None:
    """The stored bills as a schema 6 JSON document, to be saved by the browser."""
    runtime = _invoice_runtime(hass, connection, msg)
    if runtime is None:
        return
    faturas = runtime.invoice_manager.stored.faturas
    if not faturas:
        connection.send_error(
            msg["id"], "invoices_empty", "No invoice has been read yet"
        )
        return
    try:
        documento = await hass.async_add_executor_job(
            build_invoice_document, faturas, runtime.model
        )
    except Exception:  # noqa: BLE001
        _LOGGER.error("Could not assemble the invoice export", exc_info=True)
        connection.send_error(
            msg["id"], "invoices_failed", "Could not assemble the invoices"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": documento}
    )


async def _async_handle_import_model(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Copy the declared file into storage, so it becomes editable.

    A migracao e um ato do operador, com um antes e um depois claros. Deixa-la
    acontecer sozinha na primeira edicao faria o arquivo deixar de valer sem
    que ninguem tivesse decidido isso.
    """
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime) or runtime.model_manager is None:
        connection.send_error(
            msg["id"], "model_unavailable", "The model is unavailable"
        )
        return
    if runtime.model_source != MODEL_SOURCE_FILE:
        # Reimportar apagaria o que ja foi editado pela tela.
        connection.send_error(
            msg["id"], "model_already_stored", "The model is already editable"
        )
        return
    await _async_apply_model_change(
        hass, connection, msg, now, lambda model: dict(model)
    )


def _model_change_from(msg: Mapping[str, Any]) -> Any:
    """Return the pure edit described by the message."""
    unit_id = msg.get("unit_id")
    if "name" in msg and msg.get("action") == "add":
        return lambda model: add_unit(
            model, msg["name"], role=msg.get("role", ROLE_CONSUMER)
        )[1]
    if msg.get("action") == "remove":
        return lambda model: remove_unit(model, unit_id)

    def aplicar(model: Any) -> Any:
        atual = model
        if "name" in msg:
            atual = rename_unit(atual, unit_id, msg["name"])
        if "role" in msg:
            atual = set_unit_role(atual, unit_id, msg["role"])
        if "image" in msg:
            atual = set_unit_image(atual, unit_id, msg["image"])
        if "measured" in msg:
            atual = set_unit_measured(atual, unit_id, msg["measured"])
        if "color" in msg:
            atual = set_unit_color(atual, unit_id, msg["color"])
        if "add_uc" in msg:
            atual = add_unit_uc(atual, unit_id, msg["add_uc"])
        if "remove_uc" in msg:
            atual = remove_unit_uc(atual, unit_id, msg["remove_uc"])
        return atual

    return aplicar


async def _async_handle_set_unit(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Add, edit or remove one unit, and rebuild the integration."""
    if msg.get("action") == "remove":
        bloqueio = _removal_blocked_by_share(hass, msg.get("unit_id"))
        if bloqueio is not None:
            # Em portugues de proposito: a tela mostra a mensagem como veio,
            # e esta e a unica recusa que a pessoa precisa entender para
            # saber o que fazer em seguida.
            connection.send_error(
                msg["id"], "unit_has_distribution_share",
                f"Esta unidade tem {format(bloqueio.normalize(), 'f')}% do "
                "rateio. Leve o percentual dela a zero no rateio antes de "
                "excluí-la — senão as outras deixam de somar 100%.",
            )
            return
    await _async_apply_model_change(
        hass, connection, msg, now, _model_change_from(msg)
    )


def _removal_blocked_by_share(hass: Any, unit_id: Any) -> Decimal | None:
    """O percentual que impede a saida da unidade, ou None."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        return None
    manager = runtime.distribution_manager
    if manager is None or not manager.available or not isinstance(unit_id, str):
        return None
    try:
        unidades = get_unit_ids(runtime.declared_model or runtime.model)
    except EnergyModelError:
        return None
    return share_blocking_removal(manager.data, unit_id, unidades)


async def _async_handle_swap_unit_meter(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Close the current meter of a quantity and open the new one.

    A data vem da mensagem, nunca daqui: errar um corte reescreve meses de
    leitura. O que o sistema resolve sozinho sao a hora cheia e o descarte da
    primeira variacao — regras que ele ja conhece e que ninguem deveria ter de
    lembrar na hora de trocar um medidor.
    """
    unit_id = msg.get("unit_id")
    metric = msg.get("metric")
    entity_id = msg.get("entity_id")
    rotulo = msg.get("label")
    try:
        at = datetime.fromisoformat(str(msg.get("at")))
    except ValueError:
        connection.send_error(
            msg["id"], "model_invalid", "the swap instant is not a valid datetime"
        )
        return
    if at.tzinfo is None:
        at = at.replace(tzinfo=now.tzinfo)

    await _async_apply_model_change(
        hass, connection, msg, now,
        lambda model: swap_unit_meter(
            model, unit_id, metric, entity_id, at, label=rotulo
        ),
    )


async def _async_handle_set_unit_sensor(
    hass: Any, connection: Any, msg: Mapping[str, Any], now: datetime
) -> None:
    """Point one measured quantity of a unit at an entity, or drop it.

    Sem `entity_id` a grandeza sai. Nao ha comando separado para remover
    porque nao ha diferenca de intencao: apontar para lugar nenhum e deixar de
    medir aquilo.

    O que a unidade calcula, audita e preve vem junto, recalculado a partir do
    que ela passou a medir — declarar geracao e exportacao e o que faz existir
    autoconsumo, e nao um segundo passo a lembrar.
    """
    unit_id = msg.get("unit_id")
    metric = msg.get("metric")
    entity_id = msg.get("entity_id")
    # Serie e medicao instantanea sao coisas diferentes no modelo — uma
    # acumula e entra no ciclo, a outra e a leitura do momento —, mas para
    # quem configura o gesto e o mesmo: apontar um sensor. O comando decide
    # pelo nome da grandeza em vez de exigir que a tela saiba a diferenca.
    instantanea = metric in INSTANT_MEASUREMENTS
    if entity_id is None:
        remover = remove_unit_measurement if instantanea else remove_unit_series
        change = lambda model: remover(model, unit_id, metric)  # noqa: E731
    else:
        gravar = set_unit_measurement if instantanea else set_unit_series
        change = lambda model: gravar(model, unit_id, metric, entity_id)  # noqa: E731
    await _async_apply_model_change(hass, connection, msg, now, change)


def _latest_closed_cycle(cycles: tuple[Any, ...]) -> Any | None:
    """A referencia fechada mais recente, que e de onde vem tarifa e CIP."""
    fechados = [cycle for cycle in cycles if cycle.status == "closed"]
    return fechados[-1] if fechados else None


async def _async_handle_get_cycle_cost_estimate(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Project the monetary cost of the cycle in progress for one unit.

    Sempre o ciclo em curso: um ciclo fechado tem valor faturado, e estimar por
    cima de um numero oficial que ja existe seria substituir o certo pelo
    aproximado. O contrato de `finance` continua sendo o dono do valor real.
    """
    runtime = hass.data.get(DOMAIN)
    executor = getattr(hass, "async_add_executor_job", None)
    if not isinstance(runtime, CoEnergyRuntime) or not callable(executor):
        connection.send_error(
            msg["id"],
            "cycle_cost_estimate_unavailable",
            "Cycle cost estimate is unavailable",
        )
        return

    unit_id = msg["unit_id"]
    try:
        document = await _async_billing_document(runtime, executor)
        configuration = await _async_effective_financial_model(hass, runtime)
        overview = await async_get_unit_overview(
            hass,
            runtime.model,
            document,
            unit_id,
            now,
            msg.get("statistics_period", DEFAULT_STATISTICS_PERIOD),
        )
        cycles = get_billing_cycles(runtime.model, document, unit_id, now)
        closed = _latest_closed_cycle(cycles)

        # Tarifa e iluminacao publica vem da ultima fatura fechada da propria
        # unidade: sao os valores mais recentes que existem oficialmente. Sem
        # fatura fechada nao ha de onde tirar, e a estimativa sai sem dinheiro.
        tariff = None
        cip = None
        tariff_source = None
        if closed is not None:
            financial = get_official_financial_snapshot(
                document, unit_id, closed.billing_reference
            )
            if financial is not None:
                tariff = resolve_published_energy_tariff(financial)
                cip = financial.cip_cosip
                tariff_source = closed.billing_reference

        prediction = overview.prediction
        result = build_cycle_cost_estimate(
            unit_id=unit_id,
            billing_reference=_predicted_reference(cycles),
            configuration=configuration,
            connection_type=get_unit_connection_type(document, unit_id),
            forecast_consumption_kwh=(
                None if prediction is None
                else _decimal_or_none(prediction.predicted_value)
            ),
            tariff_with_taxes=tariff,
            tariff_source=tariff_source,
            cip_cosip_amount=cip,
            cycle_is_closed=False,
        )
        serialized = serialize_cycle_cost_estimate(result)
    except (
        EquatorialAdapterError,
        FinancialModelError,
        BillingCycleError,
        FinanceError,
        UnitOverviewError,
        CycleCostEstimateError,
        CycleCostEstimateSerializationError,
    ):
        _LOGGER.error("Could not build the cycle cost estimate", exc_info=True)
        connection.send_error(
            msg["id"],
            "cycle_cost_estimate_unavailable",
            "Cycle cost estimate is unavailable",
        )
        return
    except Exception:
        _LOGGER.error("Unexpected cycle cost estimate failure", exc_info=True)
        connection.send_error(
            msg["id"],
            "cycle_cost_estimate_failed",
            "Could not build the cycle cost estimate",
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


def _predicted_reference(cycles: tuple[Any, ...]) -> str | None:
    """A referencia prevista do ciclo aberto, que e o ciclo sendo estimado."""
    for cycle in reversed(cycles):
        if cycle.status == "closed":
            continue
        previsto = getattr(cycle, "predicted_reference", None)
        if isinstance(previsto, str) and previsto.strip():
            return previsto
    return None


def _decimal_or_none(value: Any) -> Any:
    """Preserva Decimal; um float vira texto para nao entrar por binario."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return str(value)
    return value


async def _async_handle_get_energy_coverage_audit(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Return read-only Recorder coverage evidence for one bill cycle of the generating unit."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"], "coverage_audit_unavailable", "Coverage audit is unavailable"
        )
        return
    # A auditoria de cobertura so existe para quem gera: ela confere geracao,
    # exportacao e importacao, que as beneficiarias nao medem.
    gerador = _generator_unit_id_or_none(runtime)
    if gerador is None or msg.get("unit_id") != gerador:
        connection.send_error(
            msg["id"], "coverage_audit_unknown_unit", "Coverage audit unit is unavailable"
        )
        return
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(
            msg["id"], "coverage_audit_unavailable", "Coverage audit is unavailable"
        )
        return

    try:
        billing_document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.error("Could not reload the coverage audit billing source", exc_info=True)
        connection.send_error(
            msg["id"], "billing_source_unavailable", "Billing source is unavailable"
        )
        return

    try:
        cycles = get_billing_cycles(runtime.model, billing_document, gerador, now)
        cycle = next(
            (
                item
                for item in cycles
                if item.billing_reference == msg["billing_reference"]
                and item.status == "closed"
                and item.capability == "operational_history"
                and item.history_available
                and item.period is not None
            ),
            None,
        )
    except BillingCycleError:
        _LOGGER.error("Could not resolve the official coverage audit cycle", exc_info=True)
        connection.send_error(
            msg["id"], "coverage_audit_failed", "Could not build coverage audit"
        )
        return
    if cycle is None:
        connection.send_error(
            msg["id"],
            "coverage_audit_invalid_reference",
            "Coverage audit reference is unavailable",
        )
        return

    try:
        collected_results = []
        for logical_id in (f"{gerador}.{metric}" for metric in _COVERAGE_METRICS):
            collected_results.append(await async_get_energy_period(
                hass, runtime.model, logical_id, cycle.period, "hour"
            ))
        results = tuple(collected_results)
        metrics = {
            result.logical_id.removeprefix(f"{gerador}.").removesuffix("_energy"):
                _serialize_coverage_metric(result)
            for result in results
        }
        self_consumption = calculate_self_consumption(
            results[0].value, results[1].value
        )
    except (
        EnergyPeriodError,
        EnergyCalculationError,
        TemporalObservationError,
        TemporalObservationDurationError,
        TemporalObservationCoverageError,
        TemporalEnergyAcceptanceError,
        TemporalEnergyAcceptanceDurationError,
        TemporalEnergyAcceptanceRatioError,
    ):
        _LOGGER.error("Could not build Recorder coverage evidence", exc_info=True)
        connection.send_error(
            msg["id"], "coverage_audit_failed", "Could not build coverage audit"
        )
        return
    except Exception:
        _LOGGER.error("Unexpected coverage audit failure", exc_info=True)
        connection.send_error(
            msg["id"], "coverage_audit_failed", "Could not build coverage audit"
        )
        return

    connection.send_result(
        msg["id"],
        {
            "api_version": API_VERSION,
            "data": {
                "unit_id": gerador,
                "billing_reference": cycle.billing_reference,
                "resolution": "hour",
                "period": {
                    "from": cycle.period.start.isoformat(),
                    "until": cycle.period.end.isoformat(),
                },
                "metrics": metrics,
                "self_consumption_kwh": self_consumption,
            },
        },
    )


async def _async_handle_get_self_consumption(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Return read-only physical self-consumption data for one billing cycle."""
    runtime = hass.data.get(DOMAIN)
    if not isinstance(runtime, CoEnergyRuntime):
        connection.send_error(
            msg["id"],
            "self_consumption_unavailable",
            "Self consumption is unavailable",
        )
        return
    # Autoconsumo e o que foi gerado e nao saiu para a rede: so quem gera tem.
    gerador = _generator_unit_id_or_none(runtime)
    if gerador is None or msg.get("unit_id") != gerador:
        connection.send_error(
            msg["id"],
            "self_consumption_unknown_unit",
            "Self consumption unit is unavailable",
        )
        return
    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        connection.send_error(
            msg["id"],
            "self_consumption_unavailable",
            "Self consumption is unavailable",
        )
        return

    try:
        billing_document = await _async_billing_document(runtime, executor)
    except EquatorialAdapterError:
        _LOGGER.error(
            "Could not reload the self consumption billing source", exc_info=True
        )
        connection.send_error(
            msg["id"],
            "billing_source_unavailable",
            "Billing source is unavailable",
        )
        return

    try:
        cycles = get_billing_cycles(runtime.model, billing_document, gerador, now)
        cycle = next(
            (
                item
                for item in cycles
                if item.billing_reference == msg["billing_reference"]
                and item.status == "closed"
                and item.capability == "operational_history"
            ),
            None,
        )
    except BillingCycleError:
        _LOGGER.error(
            "Could not resolve the official self consumption cycle", exc_info=True
        )
        connection.send_error(
            msg["id"],
            "self_consumption_failed",
            "Could not build self consumption",
        )
        return

    if cycle is None:
        connection.send_error(
            msg["id"],
            "self_consumption_invalid_reference",
            "Self consumption reference is unavailable",
        )
        return

    try:
        policy = get_coverage_quality_policy(runtime.model)
        result = await async_get_solar_self_consumption(
            hass, runtime.model, cycle, policy
        )
    except (
        EnergyPeriodError,
        EnergyCalculationError,
        TemporalObservationError,
        TemporalObservationDurationError,
        TemporalObservationCoverageError,
        TemporalEnergyAcceptanceError,
        TemporalEnergyAcceptanceDurationError,
        TemporalEnergyAcceptanceRatioError,
        EnergyCoverageQualityError,
        SelfConsumptionError,
    ):
        _LOGGER.error(
            "Could not build official self consumption evidence", exc_info=True
        )
        connection.send_error(
            msg["id"],
            "self_consumption_failed",
            "Could not build self consumption",
        )
        return
    except Exception:
        _LOGGER.error(
            "Unexpected failure while building self consumption", exc_info=True
        )
        connection.send_error(
            msg["id"],
            "self_consumption_failed",
            "Could not build self consumption",
        )
        return

    try:
        serialized = serialize_self_consumption_result(result)
    except SelfConsumptionSerializationError:
        _LOGGER.error(
            "Could not serialize official self consumption data", exc_info=True
        )
        connection.send_error(
            msg["id"],
            "self_consumption_failed",
            "Could not build self consumption",
        )
        return

    connection.send_result(
        msg["id"],
        {
            "api_version": API_VERSION,
            "data": serialized,
        },
    )


def _generator_unit_id_or_none(runtime: CoEnergyRuntime) -> str | None:
    """Quem gera, ou None quando o modelo nao declara exatamente uma geradora.

    Sem geradora declarada, nenhuma unidade pedida pode ser ela — e por isso
    quem chama responde "unidade desconhecida", e nao "indisponivel": o pedido
    e que nao faz sentido para esta instalacao.
    """
    try:
        return get_generator_unit_id(runtime.model)
    except EnergyModelError:
        return None


def _generator_unit_id(runtime: CoEnergyRuntime) -> str:
    """Quem gera, segundo o modelo.

    Era uma constante com o nome de uma unidade desta casa. O papel ja estava
    declarado no YAML desde sempre — faltava perguntar por ele.
    """
    return get_generator_unit_id(runtime.model)


def _payback_beneficiary_units(
    runtime: CoEnergyRuntime, at: datetime
) -> tuple[str, ...]:
    """Return the generator plus every unit with a positive configured share."""
    manager = runtime.distribution_manager
    generator = _generator_unit_id(runtime)
    if manager is None or not manager.available:
        return (generator,)
    try:
        shares = manager.resolve_distribution(at).shares
        ordered = get_unit_ids(runtime.model)
    except (DistributionError, EnergyModelError):
        return (generator,)
    selected = {
        unit_id for unit_id, share in shares.items() if share > 0
    }
    selected.add(generator)
    return tuple(unit_id for unit_id in ordered if unit_id in selected)


def _payback_unit_cycle(
    document: Any, unit_id: str, reference: str
) -> PaybackUnitCycle:
    """Collect one unit's official invoice evidence for one billing reference."""
    financial = get_official_financial_snapshot(document, unit_id, reference)
    if financial is None:
        return PaybackUnitCycle(unit_id=unit_id, financial=None, scee_savings=None)
    bill = get_bill_by_reference(document, unit_id, reference)
    if bill is None:
        return PaybackUnitCycle(unit_id=unit_id, financial=None, scee_savings=None)
    raw_scee = bill.raw_bill.get("scee") or {}
    scee = get_confirmed_scee_savings(
        financial,
        extraction_status=bill.extraction_status,
        scee_applicable=raw_scee.get("aplicavel") is True,
        financial_validation=bill.financial_validation,
    )
    return PaybackUnitCycle(unit_id=unit_id, financial=financial, scee_savings=scee)


def _payback_reference_instants(
    runtime: CoEnergyRuntime, document: Any, now: datetime
) -> dict[str, tuple[datetime, ...]]:
    """Collect every known cycle start per billing reference, across all units."""
    instants: dict[str, list[datetime]] = {}
    try:
        unit_ids = get_unit_ids(runtime.model)
    except EnergyModelError:
        return {}
    for unit_id in unit_ids:
        try:
            unit_cycles = get_billing_cycles(runtime.model, document, unit_id, now)
        except BillingCycleError:
            continue
        for cycle in unit_cycles:
            if cycle.status != "closed" or cycle.period is None:
                continue
            instants.setdefault(cycle.billing_reference, []).append(cycle.period.start)
    return {
        reference: tuple(sorted(values))
        for reference, values in instants.items()
    }


def _payback_reference_beneficiaries(
    runtime: CoEnergyRuntime,
    cycle: Any,
    fallback_instants: tuple[datetime, ...],
) -> tuple[str, ...] | None:
    """Resolve the beneficiary set for one reference.

    The generator's own cycle start is authoritative. When its dates are not
    trustworthy the other units' cycle starts for the same reference stand in,
    but only while every one of them resolves the same set: an ambiguous
    distribution regime is refused rather than guessed.
    """
    if cycle.period is not None:
        return _payback_beneficiary_units(runtime, cycle.period.start)
    if not fallback_instants:
        return None
    resolved = {
        _payback_beneficiary_units(runtime, instant)
        for instant in fallback_instants
    }
    if len(resolved) != 1:
        return None
    return next(iter(resolved))


def _payback_credit_balances(
    runtime: CoEnergyRuntime,
    document: Any,
    inputs: tuple[PaybackCycleInput, ...],
) -> tuple[UnitCreditBalance, ...]:
    """Collect the latest known SCEE credit balance of each beneficiary unit."""
    latest: dict[str, tuple[tuple[int, int], UnitCreditBalance]] = {}
    for cycle in inputs:
        try:
            key = parse_billing_reference(cycle.billing_reference)
        except BillingError:
            continue
        order = (key[1], key[0])
        for unit in cycle.units:
            try:
                record = get_official_scee_record(
                    runtime.model, document, unit.unit_id, cycle.billing_reference
                )
            except SceeError:
                continue
            balance = record.balance_kwh
            if balance is None:
                continue
            current = latest.get(unit.unit_id)
            if current is not None and current[0] >= order:
                continue
            latest[unit.unit_id] = (order, UnitCreditBalance(
                unit_id=unit.unit_id,
                billing_reference=cycle.billing_reference,
                balance_kwh=Decimal(str(balance)),
            ))
    return tuple(item[1] for item in latest.values())


async def _async_handle_get_payback_projection(
    hass: Any,
    connection: Any,
    msg: Mapping[str, Any],
    now: datetime,
) -> None:
    """Build the global read-only scenario payback from existing domains."""
    runtime = hass.data.get(DOMAIN)
    executor = getattr(hass, "async_add_executor_job", None)
    # Nao se exige mais o arquivo financeiro: o investimento pode ter sido
    # informado na tela, que e como toda instalacao nova faz. Quem responde
    # pela falta do valor e a checagem logo abaixo, que sabe dizer o que
    # falta em vez de um "indisponivel" sem explicacao.
    if not isinstance(runtime, CoEnergyRuntime) or not callable(executor):
        connection.send_error(
            msg["id"], "payback_projection_unavailable", "Payback projection is unavailable"
        )
        return
    try:
        # Antes do documento de propósito: instalação que ainda não informou
        # quanto custou o sistema não é uma falha, é o estado inicial de toda
        # instalação nova, e é o que a pessoa resolve na Configuração. Ler as
        # faturas primeiro responderia "indisponível" por causa das faturas e
        # esconderia a única coisa que ela pode fazer agora.
        investment = await _async_effective_financial_model(hass, runtime)
        if investment is None or investment.investment_total <= 0:
            connection.send_error(
                msg["id"],
                "payback_investment_missing",
                "The solar investment has not been informed yet",
            )
            return
        # Sem fatura nenhuma tambem nao e falha: o payback soma a economia
        # que as faturas mostram, e a pessoa precisa saber que e isso que
        # falta — nao ler "indisponivel, verifique a configuracao".
        faturas = runtime.invoice_manager
        if not (
            (faturas is not None and faturas.stored.faturas)
            or runtime.billing_json_path
        ):
            connection.send_error(
                msg["id"],
                "payback_billing_missing",
                "No bill has been read yet",
            )
            return
        document = await _async_billing_document(runtime, executor)
        cycles = get_billing_cycles(
            runtime.model, document, _generator_unit_id(runtime), now
        )
        policy = get_coverage_quality_policy(runtime.model)
        instants = _payback_reference_instants(runtime, document, now)
        inputs = []
        seen: set[str] = set()
        for cycle in cycles:
            # O ciclo da geradora que ainda espera fatura (ou nem fechou) entra
            # pela referência prevista: a fatura de outra unidade para o mesmo
            # mês já é economia comprovada e não precisa esperar a geradora.
            closed = cycle.status == "closed"
            reference = cycle.billing_reference if closed else cycle.predicted_reference
            if not reference or reference in seen:
                continue
            beneficiaries = _payback_reference_beneficiaries(
                runtime, cycle, instants.get(reference, ())
            )
            if beneficiaries is None:
                continue
            units = tuple(
                _payback_unit_cycle(document, unit_id, reference)
                for unit_id in beneficiaries
            )
            if not closed and all(unit.financial is None for unit in units):
                continue
            seen.add(reference)
            physical = None
            # O autoconsumo só existe sobre um ciclo fechado da geradora.
            if closed and cycle.capability == "operational_history":
                physical = await async_get_solar_self_consumption(
                    hass, runtime.model, cycle, policy
                )
            inputs.append(PaybackCycleInput(
                billing_reference=reference,
                units=units,
                self_consumption=physical,
            ))
        balances = _payback_credit_balances(runtime, document, tuple(inputs))
        result = project_simple_payback(investment, tuple(inputs), balances)
        serialized = serialize_payback_projection(result)
    except (
        EquatorialAdapterError,
        FinancialModelError,
        BillingCycleError,
        FinanceError,
        PaybackProjectionError,
        PaybackProjectionSerializationError,
    ):
        _LOGGER.error("Could not build payback projection", exc_info=True)
        connection.send_error(
            msg["id"], "payback_projection_unavailable", "Payback projection is unavailable"
        )
        return
    except Exception:
        _LOGGER.error("Unexpected payback projection failure", exc_info=True)
        connection.send_error(
            msg["id"], "payback_projection_failed", "Could not build payback projection"
        )
        return
    connection.send_result(
        msg["id"], {"api_version": API_VERSION, "data": serialized}
    )


def async_register_websocket_api(hass: Any) -> None:
    """Register the CoEnergy WebSocket commands with Home Assistant."""
    import voluptuous as vol
    from homeassistant.components import websocket_api
    from homeassistant.util import dt as dt_util

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_OVERVIEW,
            vol.Required("unit_id"): str,
            vol.Optional(
                "statistics_period",
                default=DEFAULT_STATISTICS_PERIOD,
            ): vol.In(("hour", "5minute")),
        }
    )
    @websocket_api.async_response
    async def websocket_get_overview(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        now = dt_util.now()
        await _async_handle_get_overview(
            hass,
            connection,
            msg,
            now,
        )

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_GET_UNITS})
    @websocket_api.async_response
    async def websocket_get_units(hass, connection, msg) -> None:
        await _async_handle_get_units(hass, connection, msg)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_ENERGY_FLOW,
            vol.Optional("billing_reference"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Optional("period_kind"): vol.In(("cycle", "day", "month", "year")),
        }
    )
    @websocket_api.async_response
    async def websocket_get_energy_flow(hass, connection, msg) -> None:
        await _async_handle_get_energy_flow(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_HISTORY,
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Optional("mode", default=DEFAULT_HISTORY_MODE): vol.In(
                ("day", "month", "year", "cycle")
            ),
            vol.Required("reference"): str,
            vol.Optional("resolution"): vol.In(("hour", "day", "month")),
        }
    )
    @websocket_api.async_response
    async def websocket_get_history(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        now = dt_util.now()
        await _async_handle_get_history(hass, connection, msg, now)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_CYCLES,
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
        }
    )
    @websocket_api.async_response
    async def websocket_get_cycles(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        now = dt_util.now()
        await _async_handle_get_cycles(hass, connection, msg, now)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_COMPARISON,
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Required("mode"): vol.In(("day", "rolling_days", "month", "custom")),
            vol.Optional("strategy"): vol.In(("automatic", "custom")),
            vol.Optional("reference"): str,
            vol.Optional("logical_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Optional("base_start"): str,
            vol.Optional("base_end"): str,
            vol.Optional("comparison_start"): str,
            vol.Optional("comparison_end"): str,
            vol.Optional("window_days"): int,
            vol.Optional("resolution"): vol.In(("day", "hour")),
            vol.Optional("period_type"): vol.In(("day", "range", "cycle")),
            vol.Optional("cut_instant"): vol.All(str, vol.Match(r".*\S.*")),
        }
    )
    @websocket_api.async_response
    async def websocket_get_comparison(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        now = dt_util.now()
        await _async_handle_get_comparison(hass, connection, msg, now)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_AUDIT,
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Required("billing_reference"): vol.All(
                str, vol.Match(r".*\S.*")
            ),
        }
    )
    @websocket_api.async_response
    async def websocket_get_audit(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        await _async_handle_get_audit(hass, connection, msg)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_SCEE,
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Required("billing_reference"): vol.All(
                str, vol.Match(r".*\S.*")
            ),
        }
    )
    @websocket_api.async_response
    async def websocket_get_scee(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        await _async_handle_get_scee(hass, connection, msg)

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_GET_SETTINGS})
    @websocket_api.async_response
    async def websocket_get_settings(hass, connection, msg) -> None:
        await _async_handle_get_settings(hass, connection, msg)

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_SET_SETTINGS,
        vol.Optional("boundary_time"): vol.Any(None, str),
        vol.Optional("distributor_tariffs"): vol.Any(None, {str: str}),
        # None limpa o investimento informado e devolve o que o arquivo disser.
        vol.Optional("solar_investment"): vol.Any(None, {
            vol.Required("amount"): str,
            vol.Required("period"): str,
        }),
    })
    @websocket_api.async_response
    async def websocket_set_settings(hass, connection, msg) -> None:
        await _async_handle_set_settings(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_GET_SENSORS})
    @websocket_api.async_response
    async def websocket_get_sensors(hass, connection, msg) -> None:
        await _async_handle_get_sensors(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_SET_SENSORS,
        # None limpa a correspondencia inteira e devolve o modelo declarado.
        vol.Optional("entity_ids"): vol.Any(None, {str: str}),
    })
    @websocket_api.async_response
    async def websocket_set_sensors(hass, connection, msg) -> None:
        await _async_handle_set_sensors(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_GET_MODEL_CONFIG,
    })
    @websocket_api.async_response
    async def websocket_get_model_config(hass, connection, msg) -> None:
        await _async_handle_get_model_config(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_IMPORT_MODEL})
    @websocket_api.async_response
    async def websocket_import_model(hass, connection, msg) -> None:
        await _async_handle_import_model(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_SET_UNIT,
        # "add" cria e devolve o id derivado do nome; "remove" apaga. Sem
        # acao, os campos presentes sao aplicados a unidade indicada — e o
        # campo ausente nao e tocado, que e como "nao mexi" se distingue de
        # "apague isto".
        vol.Optional("action"): vol.In(("add", "remove")),
        vol.Optional("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Optional("name"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Optional("role"): str,
        vol.Optional("image"): vol.Any(None, str),
        # Se a unidade tem medidor. Falsa nao e pendencia: ha quem so
        # se acompanhe pela fatura.
        vol.Optional("measured"): bool,
        # A cor da unidade. `None` devolve a derivada do identificador.
        vol.Optional("color"): vol.Any(None, str),
        # A UC que diz de quem e a fatura. Chega inteira uma vez e e guardada
        # so como hash; para tirar, basta o hash que a tela recebeu.
        vol.Optional("add_uc"): vol.All(str, vol.Match(r".*\d.*")),
        vol.Optional("remove_uc"): vol.All(str, vol.Match(r"^sha256:[0-9a-f]{64}$")),
    })
    @websocket_api.async_response
    async def websocket_set_unit(hass, connection, msg) -> None:
        await _async_handle_set_unit(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_SET_UNIT_SENSOR,
        vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Required("metric"): vol.All(str, vol.Match(r".*\S.*")),
        # Ausente ou nulo: a unidade deixa de medir esta grandeza.
        vol.Optional("entity_id"): vol.Any(None, str),
    })
    @websocket_api.async_response
    async def websocket_set_unit_sensor(hass, connection, msg) -> None:
        await _async_handle_set_unit_sensor(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_SWAP_UNIT_METER,
        vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Required("metric"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Required("entity_id"): vol.All(str, vol.Match(r".*\S.*")),
        # O instante da troca. Sem fuso, vale o do proprio Home Assistant.
        vol.Required("at"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Optional("label"): vol.Any(None, str),
    })
    @websocket_api.async_response
    async def websocket_swap_unit_meter(hass, connection, msg) -> None:
        await _async_handle_swap_unit_meter(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_GET_INVOICES})
    @websocket_api.async_response
    async def websocket_get_invoices(hass, connection, msg) -> None:
        await _async_handle_get_invoices(hass, connection, msg)

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_SET_UC_OWNER,
        vol.Required("uc_hash"): vol.All(str, vol.Match(r"^sha256:[0-9a-f]{64}$")),
        # Sem unidade, a UC fica sem dono e as faturas dela voltam a esperar.
        vol.Optional("unit_id"): vol.Any(None, vol.All(str, vol.Match(r".*\S.*"))),
    })
    @websocket_api.async_response
    async def websocket_set_uc_owner(hass, connection, msg) -> None:
        await _async_handle_set_uc_owner(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_COMPARE_INVOICES})
    @websocket_api.async_response
    async def websocket_compare_invoices(hass, connection, msg) -> None:
        await _async_handle_compare_invoices(hass, connection, msg)

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_USE_INVOICE_STORAGE,
        vol.Required("use"): bool,
    })
    @websocket_api.async_response
    async def websocket_use_invoice_storage(hass, connection, msg) -> None:
        await _async_handle_use_invoice_storage(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_EXPORT_INVOICES})
    @websocket_api.async_response
    async def websocket_export_invoices(hass, connection, msg) -> None:
        await _async_handle_export_invoices(hass, connection, msg)

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_DELETE_INVOICE,
        vol.Required("digest"): str,
    })
    @websocket_api.async_response
    async def websocket_delete_invoice(hass, connection, msg) -> None:
        await _async_handle_delete_invoice(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_GET_DAILY_BALANCE,
        vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Optional(
            "statistics_period", default=DEFAULT_STATISTICS_PERIOD,
        ): vol.In(("hour", "5minute")),
    })
    @websocket_api.async_response
    async def websocket_get_daily_balance(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        await _async_handle_get_daily_balance(
            hass, connection, msg, dt_util.now()
        )

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_GET_MEASUREMENTS,
        vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
    })
    def websocket_get_measurements(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        _handle_get_measurements(hass, connection, msg)

    @websocket_api.websocket_command({vol.Required("type"): WS_TYPE_GET_DATA_HEALTH})
    @websocket_api.async_response
    async def websocket_get_data_health(hass, connection, msg) -> None:
        await _async_handle_get_data_health(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_GET_INSTANT_STATISTICS,
        vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
    })
    @websocket_api.async_response
    async def websocket_get_instant_statistics(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        await _async_handle_get_instant_statistics(
            hass, connection, msg, dt_util.now()
        )

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_GET_CYCLE_COST_ESTIMATE,
        vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
        vol.Optional(
            "statistics_period", default=DEFAULT_STATISTICS_PERIOD,
        ): vol.In(("hour", "5minute")),
    })
    @websocket_api.async_response
    async def websocket_get_cycle_cost_estimate(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        await _async_handle_get_cycle_cost_estimate(
            hass, connection, msg, dt_util.now()
        )

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_FINANCE,
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Required("billing_reference"): vol.All(
                str, vol.Match(r".*\S.*")
            ),
        }
    )
    @websocket_api.async_response
    async def websocket_get_finance(
        hass: Any,
        connection: Any,
        msg: Mapping[str, Any],
    ) -> None:
        await _async_handle_get_finance(hass, connection, msg)

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_ENERGY_COVERAGE_AUDIT,
            # O esquema e montado no registro, antes de o runtime existir, e
            # por isso nao pode listar unidades. Quem confere se a unidade e a
            # geradora e o handler, com o modelo em maos.
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Required("billing_reference"): vol.All(
                str, vol.Match(r".*\S.*")
            ),
        }
    )
    @websocket_api.async_response
    async def websocket_get_energy_coverage_audit(hass, connection, msg) -> None:
        await _async_handle_get_energy_coverage_audit(
            hass, connection, msg, dt_util.now()
        )

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_GET_SELF_CONSUMPTION,
            vol.Required("unit_id"): vol.All(str, vol.Match(r".*\S.*")),
            vol.Required("billing_reference"): vol.All(
                str, vol.Match(r".*\S.*")
            ),
        }
    )
    @websocket_api.async_response
    async def websocket_get_self_consumption(hass, connection, msg) -> None:
        await _async_handle_get_self_consumption(
            hass, connection, msg, dt_util.now()
        )

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_GET_PAYBACK_PROJECTION}
    )
    @websocket_api.async_response
    async def websocket_get_payback_projection(hass, connection, msg) -> None:
        await _async_handle_get_payback_projection(
            hass, connection, msg, dt_util.now()
        )

    distribution_shares_schema = {str: str}

    @websocket_api.websocket_command(
        {vol.Required("type"): WS_TYPE_GET_DISTRIBUTION}
    )
    @websocket_api.async_response
    async def websocket_get_distribution(hass, connection, msg) -> None:
        await _async_handle_get_distribution(hass, connection, msg, dt_util.now())

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_SET_DISTRIBUTION_IMMEDIATE,
            vol.Required("expected_revision"): int,
            vol.Optional("label"): str,
            vol.Required("shares"): distribution_shares_schema,
        }
    )
    @websocket_api.async_response
    async def websocket_set_distribution_immediate(hass, connection, msg) -> None:
        await _async_handle_set_distribution_immediate(
            hass, connection, msg, dt_util.now()
        )

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_SCHEDULE_DISTRIBUTION,
            vol.Required("expected_revision"): int,
            vol.Optional("label"): str,
            vol.Required("effective_from"): str,
            vol.Required("shares"): distribution_shares_schema,
        }
    )
    @websocket_api.async_response
    async def websocket_schedule_distribution(hass, connection, msg) -> None:
        await _async_handle_schedule_distribution(
            hass, connection, msg, dt_util.now()
        )

    @websocket_api.websocket_command(
        {
            vol.Required("type"): WS_TYPE_CANCEL_SCHEDULED_DISTRIBUTION,
            vol.Required("expected_revision"): int,
        }
    )
    @websocket_api.async_response
    async def websocket_cancel_scheduled_distribution(hass, connection, msg) -> None:
        await _async_handle_cancel_scheduled_distribution(
            hass, connection, msg, dt_util.now()
        )

    websocket_api.async_register_command(hass, websocket_get_overview)
    websocket_api.async_register_command(hass, websocket_get_history)
    websocket_api.async_register_command(hass, websocket_get_cycles)
    websocket_api.async_register_command(hass, websocket_get_comparison)
    websocket_api.async_register_command(hass, websocket_get_audit)
    websocket_api.async_register_command(hass, websocket_get_scee)
    websocket_api.async_register_command(hass, websocket_get_finance)
    websocket_api.async_register_command(hass, websocket_get_energy_coverage_audit)
    websocket_api.async_register_command(hass, websocket_get_self_consumption)
    websocket_api.async_register_command(hass, websocket_get_payback_projection)
    websocket_api.async_register_command(hass, websocket_get_distribution)
    websocket_api.async_register_command(hass, websocket_set_distribution_immediate)
    websocket_api.async_register_command(hass, websocket_schedule_distribution)
    websocket_api.async_register_command(hass, websocket_cancel_scheduled_distribution)
    websocket_api.async_register_command(hass, websocket_get_energy_flow)
    websocket_api.async_register_command(hass, websocket_get_units)
    # No fim da lista de proposito: a ordem de registro e o indice pelo qual o
    # teste de contrato identifica cada comando, e inserir no meio renomearia
    # todos os que vem depois.
    websocket_api.async_register_command(hass, websocket_get_cycle_cost_estimate)
    websocket_api.async_register_command(hass, websocket_get_daily_balance)
    websocket_api.async_register_command(hass, websocket_get_instant_statistics)
    websocket_api.async_register_command(hass, websocket_get_measurements)
    websocket_api.async_register_command(hass, websocket_get_settings)
    websocket_api.async_register_command(hass, websocket_set_settings)
    websocket_api.async_register_command(hass, websocket_get_sensors)
    websocket_api.async_register_command(hass, websocket_set_sensors)
    websocket_api.async_register_command(hass, websocket_get_model_config)
    websocket_api.async_register_command(hass, websocket_import_model)
    websocket_api.async_register_command(hass, websocket_set_unit)
    websocket_api.async_register_command(hass, websocket_set_unit_sensor)
    websocket_api.async_register_command(hass, websocket_swap_unit_meter)
    websocket_api.async_register_command(hass, websocket_get_invoices)
    websocket_api.async_register_command(hass, websocket_set_uc_owner)
    websocket_api.async_register_command(hass, websocket_compare_invoices)
    websocket_api.async_register_command(hass, websocket_use_invoice_storage)
    websocket_api.async_register_command(hass, websocket_export_invoices)
    websocket_api.async_register_command(hass, websocket_delete_invoice)
    websocket_api.async_register_command(hass, websocket_get_data_health)
