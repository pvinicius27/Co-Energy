"""Editable operational settings, layered over the declared YAML baseline.

Os arquivos em ``config/`` continuam sendo a linha de base declarada, e este
módulo **não escreve neles**. Dois motivos, ambos práticos:

1. Os YAML são mantidos à mão e carregam comentários que explicam cada escolha
   — inclusive por que a tarifa da fatura vence a base configurada. Reescrever
   o arquivo a partir de um formulário apagaria essa documentação.
2. Uma edição pela interface é um ato do operador, com hora e autor; o YAML é
   a declaração do projeto. São coisas de naturezas diferentes e merecem
   lugares diferentes.

O ajuste vive no Store do Home Assistant, como o rateio, e é aplicado **por
cima** do modelo carregado. Um campo ausente aqui significa "vale o que o YAML
diz" — não "vazio".

Aviso que o próprio contrato carrega: mudar ``boundary_time`` **recalcula todo
o histórico**. A hora da leitura não é gravada em ciclo nenhum; ela é uma
hipótese única aplicada a todas as datas de leitura, sempre. Trocá-la é afirmar
que todas as leituras, de todos os ciclos, sempre foram naquele horário.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
import logging
import re
from typing import Any, Mapping

from .periods import PeriodError, parse_boundary_time

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = "co_energy.settings"
STORAGE_VERSION = 1

_MIN_YEAR = 2000
_MAX_YEAR = 2100
_MONTH_PATTERN = re.compile(r"(\d{4})-(\d{2})")


class OperationalSettingsError(ValueError):
    """Raised when an operational settings payload is invalid."""


@dataclass(frozen=True)
class SolarInvestment:
    """Quanto custou o sistema solar e em que mês foi pago.

    Só existe informado pela interface: é o número mais particular de uma
    instalação, e nenhuma instalação nova pode recebê-lo pronto de um arquivo
    do projeto. O mês acompanha o valor porque um investimento sem data não se
    situa na linha do tempo que o payback percorre.
    """

    amount: Decimal
    period: str

    def __post_init__(self) -> None:
        validate_investment_amount(self.amount)
        validate_investment_period(self.period)


@dataclass(frozen=True)
class OperationalSettings:
    """Overrides applied over the declared model. None means "keep the YAML"."""

    boundary_time: str | None = None
    tariffs_without_taxes: Mapping[date, Decimal] | None = None
    solar_investment: SolarInvestment | None = None
    updated_at: datetime | None = None

    def __post_init__(self) -> None:
        if self.boundary_time is not None:
            validate_boundary_time(self.boundary_time)
        if self.tariffs_without_taxes is not None:
            if not isinstance(self.tariffs_without_taxes, Mapping):
                raise OperationalSettingsError("tariffs must be a mapping")
            for vigencia, value in self.tariffs_without_taxes.items():
                validate_tariff_vigencia(vigencia)
                validate_tariff(value)
        if self.solar_investment is not None and not isinstance(
            self.solar_investment, SolarInvestment
        ):
            raise OperationalSettingsError("solar_investment must be a SolarInvestment")
        if self.updated_at is not None:
            if (
                not isinstance(self.updated_at, datetime)
                or self.updated_at.tzinfo is None
            ):
                raise OperationalSettingsError("updated_at must be aware")


def validate_boundary_time(value: Any) -> str:
    """Return one strict ``HH:MM`` boundary, or raise.

    A validacao e a mesma do dominio temporal — nao uma segunda regra escrita
    aqui — para que a interface nao consiga gravar um valor que o calculo
    depois recusaria.
    """
    if not isinstance(value, str):
        raise OperationalSettingsError("boundary_time must be a string")
    try:
        parse_boundary_time(value)
    except PeriodError as error:
        raise OperationalSettingsError(
            "boundary_time must use strict HH:MM format"
        ) from error
    return value


def validate_tariff_vigencia(value: Any) -> date:
    """Data de início de vigência da tarifa, como a resolução publica.

    Aceita a data pronta ou o texto ISO que a interface envia — é o mesmo
    identificador usado no modelo declarado, para que o ajuste substitua a
    vigência certa em vez de criar uma paralela.
    """
    if isinstance(value, date) and not isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str) and value.strip():
        try:
            parsed = date.fromisoformat(value.strip())
        except ValueError as error:
            raise OperationalSettingsError(
                "tariff vigencia must use YYYY-MM-DD"
            ) from error
    else:
        raise OperationalSettingsError("tariff vigencia must be a date")
    if not _MIN_YEAR <= parsed.year <= _MAX_YEAR:
        raise OperationalSettingsError("tariff vigencia is out of range")
    return parsed


def validate_tariff(value: Any) -> Decimal:
    """Return a positive tariff as Decimal, refusing float entirely.

    Tarifa bate na sexta casa decimal. Um float perderia exatamente a precisao
    que a auditoria confere contra a fatura impressa.
    """
    if isinstance(value, Decimal):
        parsed = value
    elif isinstance(value, str) and value.strip():
        try:
            parsed = Decimal(value.strip())
        except ArithmeticError as error:
            raise OperationalSettingsError("tariff must be a decimal number") from error
    elif isinstance(value, int) and not isinstance(value, bool):
        parsed = Decimal(value)
    else:
        raise OperationalSettingsError("tariff must be a decimal string")
    if not parsed.is_finite() or parsed <= 0:
        raise OperationalSettingsError("tariff must be finite and positive")
    return parsed


def validate_investment_amount(value: Any) -> Decimal:
    """Return a positive investment as Decimal, refusing float entirely.

    Dinheiro em float acumula erro de arredondamento, e este valor é o
    denominador do payback inteiro: um centavo errado aqui não aparece em
    lugar nenhum e contamina todos os cenários.
    """
    if isinstance(value, Decimal):
        parsed = value
    elif isinstance(value, str) and value.strip():
        try:
            parsed = Decimal(value.strip())
        except ArithmeticError as error:
            raise OperationalSettingsError(
                "solar investment must be a decimal number"
            ) from error
    elif isinstance(value, int) and not isinstance(value, bool):
        parsed = Decimal(value)
    else:
        raise OperationalSettingsError("solar investment must be a decimal string")
    if not parsed.is_finite() or parsed <= 0:
        raise OperationalSettingsError("solar investment must be finite and positive")
    return parsed


def validate_investment_period(value: Any) -> str:
    """Mês do pagamento, ``YYYY-MM`` — a mesma precisão que o modelo declara.

    Mês, e não dia: o sistema raciocina por ciclo de faturamento, e fingir
    precisão de dia num valor que o dono informa de memória seria inventar
    exatidão que o dado não tem.
    """
    if not isinstance(value, str) or not value.strip() or value != value.strip():
        raise OperationalSettingsError("investment period must be a trimmed string")
    match = _MONTH_PATTERN.fullmatch(value)
    if match is None or not 1 <= int(match.group(2)) <= 12:
        raise OperationalSettingsError("investment period must use YYYY-MM")
    if not _MIN_YEAR <= int(match.group(1)) <= _MAX_YEAR:
        raise OperationalSettingsError("investment period is out of range")
    return value


def serialize_settings(settings: OperationalSettings) -> dict[str, Any]:
    """Shape stored in the HA Store. Decimal travels as text, never as float."""
    if not isinstance(settings, OperationalSettings):
        raise OperationalSettingsError("settings must be an OperationalSettings")
    return {
        "version": STORAGE_VERSION,
        "boundary_time": settings.boundary_time,
        "tariffs_without_taxes": (
            None
            if settings.tariffs_without_taxes is None
            else {
                vigencia.isoformat(): format(value, "f")
                for vigencia, value in sorted(settings.tariffs_without_taxes.items())
            }
        ),
        "solar_investment": (
            None
            if settings.solar_investment is None
            else {
                "amount": format(settings.solar_investment.amount, "f"),
                "period": settings.solar_investment.period,
            }
        ),
        "updated_at": (
            None if settings.updated_at is None else settings.updated_at.isoformat()
        ),
    }


def deserialize_settings(raw: Any) -> OperationalSettings:
    """Rebuild from the Store, refusing anything it does not fully understand."""
    if raw is None:
        return OperationalSettings()
    if not isinstance(raw, Mapping):
        raise OperationalSettingsError("stored settings must be a mapping")
    if raw.get("version") != STORAGE_VERSION:
        raise OperationalSettingsError("unsupported stored settings version")

    boundary = raw.get("boundary_time")
    if boundary is not None:
        validate_boundary_time(boundary)

    tariffs_raw = raw.get("tariffs_without_taxes")
    tariffs: dict[date, Decimal] | None = None
    if tariffs_raw is not None:
        if not isinstance(tariffs_raw, Mapping):
            raise OperationalSettingsError("stored tariffs must be a mapping")
        tariffs = {
            validate_tariff_vigencia(vigencia): validate_tariff(value)
            for vigencia, value in tariffs_raw.items()
        }

    investimento_raw = raw.get("solar_investment")
    investimento: SolarInvestment | None = None
    if investimento_raw is not None:
        if not isinstance(investimento_raw, Mapping):
            raise OperationalSettingsError("stored solar_investment must be a mapping")
        investimento = SolarInvestment(
            amount=validate_investment_amount(investimento_raw.get("amount")),
            period=validate_investment_period(investimento_raw.get("period")),
        )

    updated_raw = raw.get("updated_at")
    updated = None
    if updated_raw is not None:
        if not isinstance(updated_raw, str):
            raise OperationalSettingsError("stored updated_at must be a string")
        try:
            updated = datetime.fromisoformat(updated_raw)
        except ValueError as error:
            raise OperationalSettingsError("stored updated_at is invalid") from error
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=timezone.utc)

    return OperationalSettings(
        boundary_time=boundary,
        tariffs_without_taxes=tariffs,
        solar_investment=investimento,
        updated_at=updated,
    )


def apply_to_model(
    model: Mapping[str, Any], settings: OperationalSettings
) -> Mapping[str, Any]:
    """Return the effective model, with the boundary override applied.

    Copia rasa com a secao `billing` trocada: o resto do modelo continua sendo
    o mesmo objeto, e nada a jusante precisa saber que existe um ajuste. Sem
    override, devolve o proprio modelo — nao ha copia inutil nem chance de as
    duas versoes divergirem.
    """
    if not isinstance(model, Mapping):
        raise OperationalSettingsError("model must be a mapping")
    if settings.boundary_time is None:
        return model
    billing = model.get("billing")
    if not isinstance(billing, Mapping):
        raise OperationalSettingsError("model has no billing section to override")
    return {
        **model,
        "billing": {**billing, "boundary_time": settings.boundary_time},
    }


#: Identificador do desembolso que nasce da tela. Fixo de proposito: salvar de
#: novo corrige o valor informado, em vez de virar um segundo investimento.
INTERFACE_INVESTMENT_ID = "interface-solar-investment"


def _com_investimento(configuration: Any, investimento: SolarInvestment | None) -> Any:
    """A mesma configuracao, com o investimento informado pela tela no lugar."""
    from dataclasses import replace

    from .financial_model import FinancialEvidence, FinancialInvestment

    if investimento is None or configuration is None:
        return configuration
    return replace(
        configuration,
        investments=(FinancialInvestment(
            id=INTERFACE_INVESTMENT_ID,
            category="initial",
            amount=investimento.amount,
            currency=configuration.currency,
            payment_period=investimento.period,
            date_precision="month",
            payment_method="cash",
            description="Investimento no sistema solar",
            evidence=FinancialEvidence(
                type="owner_reported",
                description="Valor informado na tela de Configuração",
            ),
        ),),
    )


def apply_to_financial_model(configuration: Any, settings: OperationalSettings) -> Any:
    """Return the financial configuration with the interface overrides applied.

    Tarifas: substitui apenas as vigencias informadas; as demais seguem como o
    YAML declara. Uma vigencia ajustada que nao existia no YAML e acrescentada,
    porque a alternativa seria aceitar a edicao e descarta-la em silencio.

    Investimento: **substitui** o que o arquivo declarar, em vez de somar. O
    campo da tela pergunta quanto custou o sistema — nao "quanto mais" —, e
    somar faria o total dobrar no primeiro salvamento de quem tinha o valor no
    arquivo.
    """
    from dataclasses import replace

    from .financial_model import DistributorTariff, base_financial_configuration

    # Sem arquivo declarado, a base neutra: e sobre ela que o que a tela
    # informou pousa. Devolver `configuration` como veio deixava a tarifa
    # digitada sem onde pousar, e ler `.distributor_tariffs` de None
    # derrubava a gravacao inteira — a tela dizia "nao foi possivel salvar"
    # numa instalacao que simplesmente nao tem arquivo, que e justamente a
    # instalacao que o produto pressupoe.
    if configuration is None:
        configuration = base_financial_configuration()

    configuration = _com_investimento(configuration, settings.solar_investment)
    if settings.tariffs_without_taxes is None:
        return configuration
    existentes = {
        item.effective_from: item for item in configuration.distributor_tariffs
    }
    for vigencia, value in settings.tariffs_without_taxes.items():
        base = existentes.get(vigencia)
        existentes[vigencia] = DistributorTariff(
            effective_from=vigencia,
            tariff_without_taxes=value,
            source=(
                "Ajuste operacional pela interface"
                if base is None
                else f"{base.source} (ajustado pela interface)"
            ),
        )
    return replace(
        configuration,
        distributor_tariffs=tuple(
            existentes[vigencia] for vigencia in sorted(existentes)
        ),
    )


class OperationalSettingsManager:
    """Owns the Store and the current overrides."""

    def __init__(self, store: Any, settings: OperationalSettings) -> None:
        self._store = store
        self._settings = settings

    @property
    def settings(self) -> OperationalSettings:
        return self._settings

    async def async_update(
        self,
        *,
        boundary_time: Any = ...,
        tariffs_without_taxes: Any = ...,
        solar_investment: Any = ...,
        now: datetime,
    ) -> OperationalSettings:
        """Apply a partial change. `...` means "do not touch this field"."""
        if not isinstance(now, datetime) or now.tzinfo is None:
            raise OperationalSettingsError("now must be an aware datetime")
        atual = self._settings
        novo_boundary = (
            atual.boundary_time
            if boundary_time is ...
            else (None if boundary_time is None else validate_boundary_time(boundary_time))
        )
        if tariffs_without_taxes is ...:
            novas_tarifas = atual.tariffs_without_taxes
        elif tariffs_without_taxes is None:
            novas_tarifas = None
        else:
            if not isinstance(tariffs_without_taxes, Mapping):
                raise OperationalSettingsError("tariffs must be a mapping")
            novas_tarifas = {
                validate_tariff_vigencia(vigencia): validate_tariff(value)
                for vigencia, value in tariffs_without_taxes.items()
            }
        if solar_investment is ...:
            novo_investimento = atual.solar_investment
        elif solar_investment is None:
            novo_investimento = None
        elif isinstance(solar_investment, SolarInvestment):
            novo_investimento = solar_investment
        elif isinstance(solar_investment, Mapping):
            novo_investimento = SolarInvestment(
                amount=validate_investment_amount(solar_investment.get("amount")),
                period=validate_investment_period(solar_investment.get("period")),
            )
        else:
            raise OperationalSettingsError("solar_investment must be a mapping")
        proximo = OperationalSettings(
            boundary_time=novo_boundary,
            tariffs_without_taxes=novas_tarifas,
            solar_investment=novo_investimento,
            updated_at=now,
        )
        await self._store.async_save(serialize_settings(proximo))
        self._settings = proximo
        return proximo


async def async_build_settings_manager(hass: Any) -> OperationalSettingsManager:
    """Load the Store, degrading to the declared baseline when it is unusable."""
    from homeassistant.helpers.storage import Store

    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    try:
        raw = await store.async_load()
        settings = deserialize_settings(raw)
    except OperationalSettingsError:
        # Store ilegivel nao pode derrubar a integracao: o YAML sozinho e um
        # estado valido e completo. O ajuste e uma camada opcional.
        _LOGGER.error("Stored operational settings are invalid; using the YAML baseline")
        settings = OperationalSettings()
    except Exception:
        _LOGGER.error("Could not load operational settings Store", exc_info=True)
        settings = OperationalSettings()
    return OperationalSettingsManager(store, settings)
