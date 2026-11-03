"""Build the minimal CoEnergy runtime."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
import logging
from typing import Any

from .energy_model import (
    EnergyModelError,
    get_billing_json_path,
    load_energy_model,
)
from .distribution_storage import (
    DistributionManager,
    DistributionUnavailableError,
    async_build_distribution_manager,
)
from .billing import adopt_ucs_from_bills
from .equatorial_adapter import EquatorialAdapterError, load_equatorial_document
from .invoice_storage import InvoiceStorageManager, async_build_invoice_manager
from .model_builder import build_model
from .model_storage import ModelStorageManager, async_build_model_manager
from .operational_settings import (
    OperationalSettingsManager,
    apply_to_model,
    async_build_settings_manager,
)
from .runtime_config import (
    CoEnergyRuntimeConfigError,
    get_optional_runtime_model_path,
    get_runtime_financial_model_path,
)
from .sensor_overrides import (
    SensorOverridesManager,
    apply_overrides_to_model,
    async_build_overrides_manager,
)


_LOGGER = logging.getLogger(__name__)


#: De onde veio o modelo em vigor. A interface precisa saber: editar um
#: modelo que veio de arquivo grava uma copia no storage, e a partir dali o
#: arquivo deixa de ser consultado — e isso tem de ser dito, nao descoberto.
MODEL_SOURCE_STORAGE = "storage"
MODEL_SOURCE_FILE = "file"
#: Nada guardado e nenhum arquivo: a instalacao acabou de nascer. Nao e falha
#: nem arquivo faltando — e o ponto de partida de quem vai configurar pela
#: tela, e a interface precisa poder dizer isso com todas as letras.
MODEL_SOURCE_EMPTY = "empty"

#: Fuso de quem nao declarou nenhum. O Home Assistant ja sabe o da casa; nao
#: ha por que perguntar de novo na instalacao.
FALLBACK_TIMEZONE = "UTC"


def _timezone_do_hass(hass: Any) -> str:
    """O fuso configurado no Home Assistant, que a casa ja declarou uma vez."""
    fuso = getattr(getattr(hass, "config", None), "time_zone", None)
    return fuso if isinstance(fuso, str) and fuso.strip() else FALLBACK_TIMEZONE


class CoEnergyRuntimeError(ValueError):
    """Raised when the CoEnergy runtime cannot be built."""


@dataclass(frozen=True)
class CoEnergyRuntime:
    """Minimal state retained by the CoEnergy integration."""

    # `model` e o modelo EFETIVO: o modelo declarado com as entidades desta
    # instalacao e os ajustes operacionais ja aplicados. Todo o resto do
    # backend le so este, e por isso nao precisa saber que ha camadas — nem de
    # onde o modelo veio.
    #
    # As tres versoes existem porque cada uma responde a uma pergunta
    # diferente: `declared_model` e o modelo como foi declarado, venha do
    # storage ou do arquivo, e so a tela de configuracao precisa dele, para
    # mostrar de que entidade se esta falando; `base_model` ja tem as
    # entidades resolvidas, e e a base sobre a qual um ajuste operacional novo
    # e reaplicado; `model` e o que vale.
    model: Mapping[str, Any]
    # None quando as faturas vem so do storage, que e o caso de toda
    # instalacao que nunca teve o extrator de fora.
    billing_json_path: str | None = None
    distribution_manager: DistributionManager | None = None
    financial_model_path: str | None = None
    settings_manager: OperationalSettingsManager | None = None
    base_model: Mapping[str, Any] | None = None
    overrides_manager: SensorOverridesManager | None = None
    declared_model: Mapping[str, Any] | None = None
    model_manager: ModelStorageManager | None = None
    model_source: str = MODEL_SOURCE_FILE
    model_path: str | None = None
    # As faturas lidas pela propria integracao. Quando o operador confirma,
    # elas substituem o arquivo; ate la, ficam guardadas esperando.
    invoice_manager: InvoiceStorageManager | None = None


async def async_build_runtime(
    hass: Any,
    config: Mapping[str, Any],
) -> CoEnergyRuntime:
    """Load and validate the sources needed by the minimal runtime."""
    try:
        model_path = get_optional_runtime_model_path(config)
        financial_model_path = get_runtime_financial_model_path(config)
    except CoEnergyRuntimeConfigError as error:
        raise CoEnergyRuntimeError(
            "invalid CoEnergy runtime configuration"
        ) from error

    executor = getattr(hass, "async_add_executor_job", None)
    if not callable(executor):
        raise CoEnergyRuntimeError("hass executor is unavailable")

    # Quem existe ganha de quem falta. Havendo modelo guardado, e ele que
    # vale, e o arquivo passa a ser so a origem de onde um dia se importou:
    # uma instalacao configurada pela interface nunca teve arquivo, e a que
    # ja tinha continua funcionando ate decidir migrar.
    model_manager = await async_build_model_manager(hass)
    declared_model = model_manager.model
    model_source = MODEL_SOURCE_STORAGE
    if declared_model is None:
        if model_path:
            model_source = MODEL_SOURCE_FILE
            try:
                declared_model = await executor(load_energy_model, model_path)
            except EnergyModelError as error:
                raise CoEnergyRuntimeError(
                    "could not load the energy model"
                ) from error
        else:
            # Nada guardado e nenhum arquivo: e uma instalacao recem-criada.
            # Antes isso derrubava a integracao, e quem quisesse instalar tinha
            # de escrever um modelo a mao — justamente o que a tela existe para
            # evitar. Ela sobe vazia, e a tela cria a primeira unidade.
            model_source = MODEL_SOURCE_EMPTY
            declared_model = build_model(timezone=_timezone_do_hass(hass))
            _LOGGER.info(
                "CoEnergy started without any unit: create the first one in "
                "the configuration screen"
            )

    # A correspondencia de entidades vem primeiro: o YAML declara os sensores
    # de quem escreveu o modelo, e tudo que le o modelo — series, medicoes,
    # auditoria — precisa ja enxergar os desta instalacao.
    overrides_manager = await async_build_overrides_manager(hass)
    base_model = apply_overrides_to_model(
        declared_model, overrides_manager.overrides
    )

    settings_manager = await async_build_settings_manager(hass)
    model = apply_to_model(base_model, settings_manager.settings)

    try:
        billing_json_path = get_billing_json_path(model)
    except EnergyModelError as error:
        raise CoEnergyRuntimeError("invalid billing JSON path") from error

    # O arquivo de faturas e o insumo mais volatil do sistema: ele e apagado e
    # recriado por fora, por um extrator que roda em outra maquina. Derrubar a
    # integracao por causa dele tirava do ar tambem o que nao depende de fatura
    # — medicoes instantaneas, saude dos dados, a tela de configuracao e o
    # proprio botao que dispara a extracao que recriaria o arquivo. Quem ficava
    # sem saida era justamente quem precisava se recuperar.
    #
    # O documento e lido aqui para avisar da falta — cada handler ja trata a
    # ausencia por conta propria — e para uma coisa so alem disso: trazer das
    # faturas as UCs que as unidades ainda nao declararam.
    documento = None
    try:
        if billing_json_path:
            documento = await executor(load_equatorial_document, billing_json_path)
    except EquatorialAdapterError as error:
        _LOGGER.warning(
            "CoEnergy started without the billing document (%s): %s. "
            "Screens that depend on invoices will report it as unavailable.",
            billing_json_path,
            error,
        )

    # So com o modelo guardado: adotar a partir do arquivo YAML gravaria o
    # storage pela primeira vez e mudaria a origem do modelo sem ninguem
    # ter pedido.
    if documento is not None and model_source == MODEL_SOURCE_STORAGE:
        agora = datetime.now().astimezone()
        adotado, quantas = adopt_ucs_from_bills(
            declared_model, documento, agora.isoformat()
        )
        if adotado is not None:
            try:
                await model_manager.async_save(adotado, now=agora)
            except Exception:  # noqa: BLE001 - adotar e conveniencia
                _LOGGER.warning(
                    "Could not store the UCs found in the invoices", exc_info=True
                )
            else:
                declared_model = adotado
                base_model = apply_overrides_to_model(
                    declared_model, overrides_manager.overrides
                )
                model = apply_to_model(base_model, settings_manager.settings)
                _LOGGER.info("CoEnergy took the UCs from the invoices: %s", quantas)

    invoice_manager = await async_build_invoice_manager(hass)

    try:
        distribution_manager = await async_build_distribution_manager(hass, model)
    except DistributionUnavailableError as error:
        raise CoEnergyRuntimeError(
            "could not initialize configured distribution"
        ) from error

    return CoEnergyRuntime(
        model=model,
        billing_json_path=billing_json_path,
        distribution_manager=distribution_manager,
        financial_model_path=financial_model_path,
        settings_manager=settings_manager,
        base_model=base_model,
        overrides_manager=overrides_manager,
        declared_model=declared_model,
        model_manager=model_manager,
        model_source=model_source,
        model_path=model_path,
        invoice_manager=invoice_manager,
    )
