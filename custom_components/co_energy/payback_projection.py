"""Scenario-only simple payback projection for the CoEnergy solar system."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from decimal import ROUND_DOWN, Decimal, InvalidOperation
from pathlib import Path

from .billing import BillingError, parse_billing_reference
from .billing_codes import (
    COMPENSATED_ENERGY_CHARGE,
    ENERGY_CODES,
    FLAG_CATEGORY,
    FULL_TARIFF_CODES,
    LABELLED_CHARGE_CODES,
    NON_COMPENSATED_CONSUMPTION,
    SCEE_INJECTION,
)
from .finance import OfficialFinancialItem, OfficialFinancialSnapshot
from .financial_model import (
    DistributorTariff,
    PaybackConfiguration,
    load_financial_model,
)
from .scee_savings import SceeSavingsResult
from .self_consumption import SelfConsumptionResult


class PaybackProjectionError(ValueError):
    """Raised when payback projection inputs are structurally invalid."""


@dataclass(frozen=True)
class PaybackUnitCycle:
    """One beneficiary unit's official contribution to one billing reference."""

    unit_id: str
    financial: OfficialFinancialSnapshot | None
    scee_savings: SceeSavingsResult | None


@dataclass(frozen=True)
class PaybackCycleInput:
    """Every beneficiary unit of one reference, plus generator physics."""

    billing_reference: str
    units: tuple[PaybackUnitCycle, ...]
    self_consumption: SelfConsumptionResult | None = None


@dataclass(frozen=True)
class FullTariffBasis:
    """De onde saiu a tarifa cheia do mês e como conferi-la.

    O motor **não calcula** esta tarifa: lê ``tarifa_com_tributos`` da fatura,
    que já chega com tributos embutidos. Os demais campos existem para o leitor
    reconstruir aquele número a partir da tarifa sem tributos e das alíquotas da
    própria fatura, e assim comprovar que é o que a distribuidora aplicou.
    """

    value: Decimal
    without_taxes: Decimal | None
    pis_percent: Decimal | None
    cofins_percent: Decimal | None
    icms_percent: Decimal | None
    item_code: str | None
    sources: tuple[str, ...]
    # Passos intermediários do gross-up, publicados para a auditoria poder ser
    # lida sem refazer nenhuma divisão de cabeça. Não acrescentam informação:
    # saem das alíquotas acima.
    pis_cofins_divisor: Decimal | None = None
    icms_divisor: Decimal | None = None
    after_pis_cofins: Decimal | None = None


@dataclass(frozen=True)
class SavingsDerivation:
    """Every operand of the avoided-cost formula, kept for audit.

    Exists only for units whose savings were confirmed: the other statuses have
    no compensated energy to value, so there is nothing to derive.

    ``full_tariff_sources`` existe porque a tarifa cheia é resolvida para o mês
    inteiro, não por unidade: uma unidade que compensou tudo não publica linha de
    consumo não compensado e portanto não publica tarifa. Sem dizer de qual
    fatura a tarifa veio, a auditoria manda o leitor procurar na fatura errada.
    """

    compensated_kwh: Decimal
    full_tariff: Decimal
    full_tariff_sources: tuple[str, ...]
    flag_tariff: Decimal
    # Passos intermediários da conta. Não acrescentam informação — saem dos
    # operandos acima — mas publicá-los é o que permite conferir a auditoria
    # linha a linha sem refazer a multiplicação de cabeça, e impede que o
    # frontend precise calcular para exibir o passo a passo.
    full_tariff_origin: str
    unit_price: Decimal
    gross_value: Decimal
    transition_paid: Decimal
    bill_without_credit: Decimal | None
    # Composição da fatura paga. Sem estes campos a linha não fecha quando
    # conferida à mão: a energia não compensada e itens como o bônus Itaipu
    # estão dentro do total pago sem ter coluna que os represente.
    non_compensated_kwh: Decimal = Decimal("0")
    non_compensated_value: Decimal = Decimal("0")
    # A bandeira em reais, e não só a alíquota: ela é cobrada sobre a parcela
    # não compensada e está dentro do total pago. Sem publicá-la, a soma das
    # colunas da auditoria não fecha com a fatura.
    flag_charged: Decimal = Decimal("0")
    other_items: Decimal = Decimal("0")
    other_items_detail: tuple[tuple[str, Decimal], ...] = ()
    # A mesma fatura sem crédito, porém **construída** dos componentes em vez de
    # derivada de `paga + economia`. As duas são algebricamente equivalentes, o
    # que torna a comparação uma verificação real do motor: a derivada não pode
    # discordar da economia nem quando o motor erra, a construída pode.
    bill_without_credit_built: Decimal | None = None
    bill_without_credit_mismatch: Decimal | None = None


@dataclass(frozen=True)
class UnitCycleSavings:
    """Traceable official savings of one unit inside one reference."""

    unit_id: str
    scee_savings: Decimal
    paid_total: Decimal | None
    status: str
    derivation: SavingsDerivation | None = None
    # Encargos que a fatura cobra com ou sem sistema solar. Estão dentro do total
    # pago e, por isso, também dentro da fatura sem crédito — publicá-los é o que
    # permite ver que a diferença entre as duas é só energia.
    public_lighting: Decimal | None = None
    interest: Decimal | None = None
    fine: Decimal | None = None


@dataclass(frozen=True)
class UnitCreditBalance:
    """Latest known SCEE credit balance of one beneficiary unit."""

    unit_id: str
    billing_reference: str
    balance_kwh: Decimal


@dataclass(frozen=True)
class ProjectedCycleBenefit:
    """Traceable composition of one scenario-only cycle benefit."""

    billing_reference: str
    units: tuple[UnitCycleSavings, ...]
    official_scee_savings: Decimal
    paid_total: Decimal | None
    self_consumption_kwh: Decimal | None
    non_compensated_tariff: Decimal | None
    flag_tariff: Decimal | None
    compensated_tariff: Decimal | None
    scenario_self_consumption_savings: Decimal
    projected_cycle_benefit: Decimal
    self_consumption_coverage: str | None = None
    self_consumption_unit_id: str | None = None
    self_consumption_unit_price: Decimal | None = None
    full_tariff_basis: FullTariffBasis | None = None
    scee_status: str = "confirmed"
    self_consumption_financial_status: str = "scenario_only"
    status: str = "scenario_only"
    # Unidades beneficiárias cuja fatura desta referência ainda não chegou. Com
    # alguma pendente o ciclo é parcial: soma no recuperado, mas fica fora da
    # média que projeta o prazo, porque ainda vai crescer.
    missing_units: tuple[str, ...] = ()


@dataclass(frozen=True)
class PaybackScenario:
    """One explicit compensation sensitivity scenario."""

    name: str
    status: str
    compensation_fraction: Decimal
    cycles: tuple[ProjectedCycleBenefit, ...]
    average_monthly_savings: Decimal | None
    annualized_savings: Decimal | None
    payback_months: Decimal | None
    payback_years: Decimal | None
    blockers: tuple[str, ...]


@dataclass(frozen=True)
class RealizedPayback:
    """Explicitly unavailable realized payback contract."""

    status: str = "unavailable"
    blockers: tuple[str, ...] = ("self_consumption_financial_not_confirmed",)


@dataclass(frozen=True)
class CycleSettlement:
    """Onde um ciclo deixou o investimento: quanto já voltou e quanto sobrou.

    ``benefit`` é o benefício do ciclo: o crédito que a fatura abateu mais o
    autoconsumo do mês valorado à tarifa cheia. ``accumulated`` é a soma até
    este ciclo, inclusive, e ``surplus`` é o que dela passou do investimento —
    zero enquanto ele não foi todo recuperado.
    """

    billing_reference: str
    benefit: Decimal
    accumulated: Decimal
    surplus: Decimal


@dataclass(frozen=True)
class InvestmentSettlement:
    """Se o investimento já voltou, em que ciclo, e o que veio depois.

    Deriva do benefício do cenário que ancora a leitura (``PRIMARY_SCENARIO``),
    que é a mesma série que a tela soma como "recuperado até agora": crédito
    abatido na fatura **mais** o autoconsumo valorado à tarifa cheia.

    O autoconsumo entra porque tem de entrar: aquela energia foi consumida e
    não foi comprada. Sem o sistema, ela viria pelo medidor e seria paga à
    tarifa cheia — é esse o contrafactual que o payback mede. Nenhuma fatura a
    confirma porque ela nunca passou pelo relógio, e isso a torna hipotética,
    não irrelevante.

    Nada disso é gravado. Corrigir uma fatura, reler um PDF ou acertar o valor
    investido move o marco, e tem de mover: uma data guardada viraria mentira
    silenciosa, com a autoridade de quem está escrito.
    """

    #: ``settled`` quando o acumulado alcançou o investimento; ``pending`` antes.
    status: str
    #: O ciclo em que o acumulado alcançou o investimento, ou None.
    settled_reference: str | None
    recovered_total: Decimal
    #: Quanto falta recuperar. Zero depois de pago.
    remaining: Decimal
    #: O que passou do investimento. Zero antes de pagar.
    surplus_total: Decimal
    #: Quantos ciclos já entraram inteiramente como saldo positivo.
    surplus_cycle_count: int
    cycles: tuple[CycleSettlement, ...]


def settle_investment(
    cycles: tuple[ProjectedCycleBenefit, ...], investment_total: Decimal
) -> InvestmentSettlement:
    """Acumular o benefício por ciclo e achar onde ele cobriu o investimento."""
    acumulado = _ZERO
    marco: str | None = None
    detalhado: list[CycleSettlement] = []
    for cycle in cycles:
        acumulado += cycle.projected_cycle_benefit
        if marco is None and acumulado >= investment_total > _ZERO:
            marco = cycle.billing_reference
        sobra = acumulado - investment_total
        detalhado.append(CycleSettlement(
            billing_reference=cycle.billing_reference,
            benefit=cycle.projected_cycle_benefit,
            accumulated=acumulado,
            surplus=sobra if marco is not None and sobra > _ZERO else _ZERO,
        ))
    falta = investment_total - acumulado
    # Os ciclos posteriores ao marco: são os que entram inteiros como lucro.
    posteriores = 0
    if marco is not None:
        vistos = [item.billing_reference for item in detalhado]
        posteriores = len(vistos) - vistos.index(marco) - 1
    return InvestmentSettlement(
        status="settled" if marco is not None else "pending",
        settled_reference=marco,
        recovered_total=acumulado,
        remaining=falta if falta > _ZERO else _ZERO,
        surplus_total=(acumulado - investment_total) if marco is not None else _ZERO,
        surplus_cycle_count=posteriores,
        cycles=tuple(detalhado),
    )


@dataclass(frozen=True)
class PaybackProjectionMethod:
    """Transparent sample and annualization metadata."""

    type: str
    projection_method: str
    eligible_cycle_count: int
    eligible_references: tuple[str, ...]
    sample_start: str | None
    sample_end: str | None


@dataclass(frozen=True)
class PaybackProjectionResult:
    """Immutable projected payback result with evidence limitations."""

    investment: PaybackConfiguration
    method: PaybackProjectionMethod
    realized: RealizedPayback
    scenarios: tuple[PaybackScenario, ...]
    balances: tuple[UnitCreditBalance, ...]
    warnings: tuple[str, ...]
    # Quanto do investimento já voltou pela economia confirmada em fatura, e
    # o ciclo em que ele terminou de voltar. Fica fora de `realized`, que é
    # outra coisa: aquele afirmaria o payback com o autoconsumo confirmado em
    # dinheiro, que continua sem confirmação.
    settlement: InvestmentSettlement | None = None


_CENT = Decimal("0.01")
_ZERO = Decimal("0")
_TWELVE = Decimal("12")
# O vocabulário vem de billing_codes: os mesmos códigos sustentam o cálculo do
# SCEE em scee_savings, e declará-los duas vezes deixava duas listas capazes de
# divergir em silêncio, cada uma por baixo de uma conta de dinheiro.
_NON_COMPENSATED_CODE = NON_COMPENSATED_CONSUMPTION
_COMPENSATED_CODE = COMPENSATED_ENERGY_CHARGE
_FLAG_CATEGORY = FLAG_CATEGORY
_NO_CREDIT_BLOCKERS = frozenset({"scee_not_applicable", "scee_items_missing"})
_INJECTION_CODE = SCEE_INJECTION
_FULL_TARIFF_CODES = FULL_TARIFF_CODES
_ENERGY_CODES = ENERGY_CODES
_LABELLED_CHARGE_CODES = LABELLED_CHARGE_CODES
_ACCEPTED_COVERAGE = frozenset({"confirmed", "partial"})
_SCENARIOS = (
    ("conservative", Decimal("1")),
    ("base", Decimal("0.5")),
    ("optimistic", Decimal("0")),
)
#: O cenario que ancora a leitura principal do payback, por contrato
#: (docs/contrato-funcional.md). Payback mede o tempo para recuperar o
#: investimento, portanto compara com NAO TER o sistema — e nesse
#: contrafactual a energia autoconsumida teria sido comprada da distribuidora
#: a tarifa cheia. E a mesma serie que a tela ja soma como "recuperado ate
#: agora"; o marco tem de sair dela, ou a mesma tela contaria duas historias.
PRIMARY_SCENARIO = "optimistic"


def _finite_decimal(value: object, field: str, *, non_negative: bool = True) -> Decimal:
    if isinstance(value, bool):
        raise PaybackProjectionError(f"{field} must be a finite Decimal")
    try:
        result = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, ValueError) as error:
        raise PaybackProjectionError(f"{field} must be a finite Decimal") from error
    if not result.is_finite() or (non_negative and result < 0):
        raise PaybackProjectionError(f"{field} must be a finite non-negative Decimal")
    return result


def _unique_item(
    items: tuple[OfficialFinancialItem, ...], *, code: str | None = None,
    category: str | None = None,
) -> OfficialFinancialItem | None:
    matches = tuple(
        item for item in items
        if (code is None or item.code == code)
        and (category is None or item.category == category)
    )
    return matches[0] if len(matches) == 1 else None


def _matching_items(
    items: tuple[OfficialFinancialItem, ...], *, category: str
) -> tuple[OfficialFinancialItem, ...]:
    return tuple(item for item in items if item.category == category)


def _tariff(item: OfficialFinancialItem | None) -> Decimal | None:
    if item is None or not isinstance(item.tariff_with_taxes, Decimal):
        return None
    value = item.tariff_with_taxes
    return value if value.is_finite() and value >= 0 else None


def _reference_key(reference: str) -> tuple[int, int]:
    try:
        month, year = parse_billing_reference(reference)
    except BillingError as error:
        raise PaybackProjectionError(f"invalid billing reference: {reference!r}") from error
    return year, month


def _paid_total(financial: OfficialFinancialSnapshot) -> Decimal | None:
    value = financial.official_bill_total
    if not isinstance(value, Decimal) or isinstance(value, bool) or not value.is_finite():
        return None
    return value


_HUNDRED = Decimal("100")
# Uma tarifa de energia bate na sexta casa; acima disso, a base configurada não
# corresponde à que a distribuidora aplicou e o número não pode ser usado calado.
_TARIFF_TOLERANCE = Decimal("0.000005")
# A distribuidora publica a tarifa com seis casas. Levar a divisão adiante com
# precisão infinita produziria um preço que nenhuma fatura exibe, e a auditoria
# deixaria de conferir contra a conta em papel.
#
# O corte é por truncamento, não arredondamento: é o que a distribuidora faz, e
# reproduz a tarifa impressa exatamente em sete dos oito ciclos conhecidos —
# arredondar erra um milionésimo para cima em seis deles. Truncar também nunca
# superestima o preço, e portanto nunca superestima a economia.
_TARIFF_PRECISION = Decimal("0.000001")


def _tariff_from_base(
    financial: OfficialFinancialSnapshot, base: DistributorTariff
) -> Decimal | None:
    """Gross up the configured base tariff with this invoice's own tax rates.

    É a conta que a distribuidora faz: PIS e COFINS incidem primeiro, e o ICMS
    incide sobre o resultado — por dentro, não somado às outras duas. Somar as
    três de uma vez erra o número.
    """
    rates = financial.tax_rates
    pis, cofins, icms = rates.pis_percent, rates.cofins_percent, rates.icms_percent
    if pis is None or cofins is None or icms is None:
        return None
    without_taxes = (_HUNDRED - pis - cofins) / _HUNDRED
    without_icms = (_HUNDRED - icms) / _HUNDRED
    if without_taxes <= 0 or without_icms <= 0:
        return None
    return (
        base.tariff_without_taxes / without_taxes / without_icms
    ).quantize(_TARIFF_PRECISION, rounding=ROUND_DOWN)


def _full_tariff_item(financial: OfficialFinancialSnapshot):
    """Return the invoice item that publishes the month's energy tariff."""
    for code in _FULL_TARIFF_CODES:
        item = _unique_item(financial.items, code=code)
        if item is not None and _tariff(item) is not None:
            return item
    return None


def _published_full_tariff(
    financial: OfficialFinancialSnapshot,
) -> tuple[Decimal | None, Decimal | None]:
    """Return the full-consumption and flag tariffs this invoice publishes."""
    item = _full_tariff_item(financial)
    full = None if item is None else _tariff(item)
    flag_items = _matching_items(financial.items, category=_FLAG_CATEGORY)
    flag = _tariff(flag_items[0]) if len(flag_items) == 1 else None
    return full, flag


def resolve_published_energy_tariff(
    financial: OfficialFinancialSnapshot,
) -> Decimal | None:
    """Return the energy tariff one invoice publishes, or None.

    Fronteira publica sobre a resolucao que ja existia aqui. Outros dominios
    precisam da mesma tarifa; reimplementar a busca produziria duas versoes de
    uma regra que a distribuidora tem uma so.
    """
    full, _ = _published_full_tariff(financial)
    return full


def tariff_disagreement(
    financial: OfficialFinancialSnapshot,
    investment: PaybackConfiguration | None,
) -> tuple[Decimal, Decimal] | None:
    """Return (published, declared) when the invoice contradicts the declared base.

    A mesma comparação que o cálculo já faz em silêncio para decidir qual tarifa
    usar. Exposta porque a divergência interessa por si: ela é o sinal de que a
    distribuidora reajustou e o modelo ficou para trás. Devolve None quando as
    duas concordam, quando não há base declarada, ou quando o ciclo atravessa
    uma troca de vigência — ali a fatura imprime a média por dias e divergir da
    tarifa cheia é o comportamento correto, não um desacordo.
    """
    if investment is None:
        return None
    published = resolve_published_energy_tariff(financial)
    if published is None:
        return None
    start, end = financial.period_start, financial.period_end
    if start is None or end is None or start >= end:
        return None
    if investment.tariff_at(start + timedelta(days=1)) != investment.tariff_at(end):
        return None
    base = investment.tariff_for_period(start, end)
    if base is None:
        return None
    declared = _tariff_from_base(financial, base)
    if declared is None or abs(declared - published) <= _TARIFF_TOLERANCE:
        return None
    return published, declared


def _reference_full_tariff(
    units: tuple[PaybackUnitCycle, ...],
) -> tuple[Decimal | None, str | None, FullTariffBasis | None]:
    """Resolve the month tariff shared by the invoices, when there is one.

    Only the energy tariff is resolved system-wide: it is regulated and uniform
    for the distributor in the month. The tariff-flag rate is deliberately not
    resolved here — each unit has its own reading cycle, so the proportion of
    days under each flag colour differs and the effective rate is unit-specific.
    """
    values: dict[Decimal, list[str]] = {}
    publishers: dict[Decimal, OfficialFinancialSnapshot] = {}
    for unit in units:
        if unit.financial is None:
            continue
        full, _ = _published_full_tariff(unit.financial)
        if full is not None:
            values.setdefault(full, []).append(unit.unit_id)
            publishers.setdefault(full, unit.financial)
    if len(values) > 1:
        return None, "divergent_month_tariff", None
    if not values:
        return None, "missing_month_tariff", None
    value, sources = next(iter(values.items()))
    snapshot = publishers[value]
    item = _full_tariff_item(snapshot)
    rates = snapshot.tax_rates
    without_taxes = None if item is None else item.tariff_without_taxes
    pis_cofins_divisor = icms_divisor = after_pis_cofins = None
    if rates.pis_percent is not None and rates.cofins_percent is not None:
        pis_cofins_divisor = (
            _HUNDRED - rates.pis_percent - rates.cofins_percent
        ) / _HUNDRED
        if without_taxes is not None and pis_cofins_divisor > 0:
            after_pis_cofins = without_taxes / pis_cofins_divisor
    if rates.icms_percent is not None:
        icms_divisor = (_HUNDRED - rates.icms_percent) / _HUNDRED
    return value, None, FullTariffBasis(
        value=value,
        without_taxes=without_taxes,
        pis_percent=rates.pis_percent,
        cofins_percent=rates.cofins_percent,
        icms_percent=rates.icms_percent,
        item_code=None if item is None else item.code,
        sources=tuple(sources),
        pis_cofins_divisor=pis_cofins_divisor,
        icms_divisor=icms_divisor,
        after_pis_cofins=after_pis_cofins,
    )


def _flag_charged(items: tuple[OfficialFinancialItem, ...]) -> Decimal:
    """Quanto a bandeira custou nesta fatura, somando todas as suas linhas."""
    return sum(
        (item.value for item in items if item.category == _FLAG_CATEGORY), _ZERO
    )


def _other_items(
    items: tuple[OfficialFinancialItem, ...],
) -> tuple[Decimal, tuple[tuple[str, Decimal], ...]]:
    """Itens cobrados que nenhuma coluna nomeada da auditoria representa.

    A regra é por exclusão, e não por lista: um código novo numa fatura futura
    aparece aqui automaticamente, em vez de sumir e quebrar o fechamento da
    linha — foi assim que o bônus de Itaipu passou despercebido até agosto.
    """
    detail = tuple(
        (item.code, item.value)
        for item in items
        if item.code not in _ENERGY_CODES
        and item.code not in _LABELLED_CHARGE_CODES
        and item.category != _FLAG_CATEGORY
    )
    return sum((value for _code, value in detail), _ZERO), detail


def _built_bill_without_credit(
    financial: OfficialFinancialSnapshot,
    consumed_kwh: Decimal,
    unit_price: Decimal,
    other_total: Decimal,
) -> Decimal:
    """A fatura que teria vindo sem compensação, montada dos componentes.

    Todo o consumo do ciclo à tarifa cheia — inclusive a parcela que já veio não
    compensada, que sem o sistema teria vindo igual — mais os encargos que a
    fatura cobra havendo geração ou não.
    """
    def amount(value: Decimal | None) -> Decimal:
        return _ZERO if value is None else value

    return (
        consumed_kwh * unit_price
        + amount(financial.cip_cosip)
        + amount(financial.interest)
        + amount(financial.fine)
        + other_total
    )


def _resolve_unit_tariff(
    financial: OfficialFinancialSnapshot,
    basis: FullTariffBasis | None,
    investment: PaybackConfiguration | None,
) -> tuple[Decimal, tuple[str, ...], str] | None:
    """Resolve the energy tariff of one unit in one reference.

    Ordem de preferência: a base anual elevada pelas alíquotas desta fatura é a
    única que serve para toda unidade, inclusive as que compensaram todo o
    consumo e por isso não imprimem tarifa. Sem base configurada, vale a tarifa
    que a própria fatura publica; sem nenhuma das duas, a tarifa resolvida para
    o mês a partir das outras faturas.
    """
    own, _ = _published_full_tariff(financial)
    # A base vale por vigência, e o ciclo desta unidade tem as próprias datas:
    # no ciclo que atravessa um reajuste, a base é a média por dias, como a
    # distribuidora faz.
    base = (
        None if investment is None
        else investment.tariff_for_period(financial.period_start, financial.period_end)
    )
    derived = None if base is None else _tariff_from_base(financial, base)
    if derived is not None and own is not None and abs(derived - own) > _TARIFF_TOLERANCE:
        # A fatura publica a tarifa e a base configurada não a reproduz: a base
        # está desatualizada ou é de outra distribuidora. Vale o que a fatura diz.
        derived = None
    if derived is not None:
        return derived, (financial.unit_id,), "own_invoice_taxes"
    if own is not None:
        return own, (financial.unit_id,), "own_invoice"
    if basis is None:
        # Nem tarifa própria, nem base declarada, nem tarifa única do mês: não
        # há preço para esta unidade nesta referência, e inventar um seria pior
        # do que deixar a parcela dela de fora.
        return None
    return basis.value, basis.sources, "month_reference"


def _avoided_cost(
    financial: OfficialFinancialSnapshot,
    basis: FullTariffBasis | None,
    paid: Decimal | None,
    investment: PaybackConfiguration | None = None,
) -> tuple[Decimal, SavingsDerivation] | None:
    """Value one unit's compensated energy at the tariff it avoided paying.

    A tarifa preferida é a que a **própria fatura da unidade** publica. Só quando
    ela não publica nenhuma — o que acontece sempre que a unidade compensou todo
    o consumo e por isso não tem linha de consumo não compensado — é que se usa a
    tarifa resolvida para o mês. As duas nunca divergem: o ciclo é recusado antes
    disso se as faturas do mês discordarem entre si.
    """
    injection = _unique_item(financial.items, code=_INJECTION_CODE)
    transition = _unique_item(financial.items, code=_COMPENSATED_CODE)
    if injection is None or transition is None:
        return None
    kwh = injection.quantity
    paid_transition = transition.value
    if not isinstance(kwh, Decimal) or not isinstance(paid_transition, Decimal):
        return None
    if not kwh.is_finite() or not paid_transition.is_finite() or kwh < 0:
        return None
    _own, flag = _published_full_tariff(financial)
    flag = _ZERO if flag is None else flag
    resolved = _resolve_unit_tariff(financial, basis, investment)
    if resolved is None:
        return None
    full, sources, origin = resolved
    unit_price = full + flag
    # Sem arredondamento: o valor exato é o que a auditoria confere. Cortar em
    # centavos aqui faria a soma das unidades deixar de bater com o total do
    # ciclo, e a soma dos ciclos com o acumulado — o erro de cada corte é
    # pequeno, mas ele se acumula e reaparece como um centavo que não fecha.
    gross = kwh * unit_price
    avoided = kwh * unit_price - paid_transition

    non_compensated = _full_tariff_item(financial)
    non_compensated_kwh = _ZERO
    non_compensated_value = _ZERO
    if non_compensated is not None:
        if isinstance(non_compensated.quantity, Decimal):
            non_compensated_kwh = non_compensated.quantity
        if isinstance(non_compensated.value, Decimal):
            non_compensated_value = non_compensated.value
    other_total, other_detail = _other_items(financial.items)
    flag_paid = _flag_charged(financial.items)
    derived = None if paid is None else paid + avoided
    built = _built_bill_without_credit(
        financial, kwh + non_compensated_kwh, unit_price, other_total
    )
    return (
        avoided,
        SavingsDerivation(
            compensated_kwh=kwh,
            full_tariff=full,
            full_tariff_sources=sources,
            flag_tariff=flag,
            full_tariff_origin=origin,
            unit_price=unit_price,
            gross_value=gross,
            transition_paid=paid_transition,
            bill_without_credit=derived,
            non_compensated_kwh=non_compensated_kwh,
            non_compensated_value=non_compensated_value,
            flag_charged=flag_paid,
            other_items=other_total,
            other_items_detail=other_detail,
            bill_without_credit_built=built,
            bill_without_credit_mismatch=(
                None if derived is None or built is None else built - derived
            ),
        ),
    )


def _unit_savings(
    unit: PaybackUnitCycle,
    reference: str,
    basis: FullTariffBasis | None,
    investment: PaybackConfiguration | None = None,
) -> tuple[UnitCycleSavings, str | None]:
    """Return one unit's official contribution and an optional warning code."""
    financial = unit.financial
    if not isinstance(financial, OfficialFinancialSnapshot):
        raise PaybackProjectionError("unit financial must be an OfficialFinancialSnapshot")
    if financial.unit_id != unit.unit_id or financial.billing_reference != reference:
        raise PaybackProjectionError("unit financial does not match the reference")
    if financial.currency != "BRL":
        raise PaybackProjectionError("payback projection requires BRL invoices")

    paid = _paid_total(financial)
    charges = {
        "public_lighting": financial.cip_cosip,
        "interest": financial.interest,
        "fine": financial.fine,
    }
    scee = unit.scee_savings
    if scee is None:
        return UnitCycleSavings(unit.unit_id, _ZERO, paid, "no_credit", **charges), None
    if not isinstance(scee, SceeSavingsResult):
        raise PaybackProjectionError("unit scee_savings must be a SceeSavingsResult")
    if scee.status == "confirmed":
        if scee.amount is None or scee.currency != financial.currency:
            raise PaybackProjectionError("confirmed scee savings are inconsistent")
        if _resolve_unit_tariff(financial, basis, investment) is None:
            return (
                UnitCycleSavings(unit.unit_id, _ZERO, paid, "unconfirmed", **charges),
                f"missing_unit_tariff:{unit.unit_id}",
            )
        valued = _avoided_cost(financial, basis, paid, investment)
        if valued is None:
            return (
                UnitCycleSavings(unit.unit_id, _ZERO, paid, "unconfirmed", **charges),
                f"missing_compensated_energy:{unit.unit_id}",
            )
        avoided, derivation = valued
        if avoided < _ZERO:
            return (
                UnitCycleSavings(unit.unit_id, _ZERO, paid, "unconfirmed", **charges),
                f"negative_avoided_cost:{unit.unit_id}",
            )
        return (
            UnitCycleSavings(
                unit.unit_id, avoided, paid, "confirmed", derivation, **charges
            ),
            None,
        )
    if set(scee.blockers) & _NO_CREDIT_BLOCKERS:
        return UnitCycleSavings(unit.unit_id, _ZERO, paid, "no_credit", **charges), None
    return (
        UnitCycleSavings(unit.unit_id, _ZERO, paid, "unconfirmed", **charges),
        f"unconfirmed_scee_savings:{unit.unit_id}",
    )


def _hypothetical_inputs(
    cycle: PaybackCycleInput,
    reference: str,
    basis: FullTariffBasis | None,
    investment: PaybackConfiguration | None = None,
) -> tuple[Decimal, Decimal, Decimal, Decimal, str, str] | None:
    """Return (kwh, non_compensated, flag, compensated, coverage) for the generator.

    Partial coverage participates with the energy actually observed. Nothing is
    extrapolated for the intervals without measurement, so an incomplete cycle
    only understates — which is the safe direction for a payback.
    """
    physical = cycle.self_consumption
    if physical is None:
        return None
    if not isinstance(physical, SelfConsumptionResult):
        raise PaybackProjectionError("self_consumption must be a SelfConsumptionResult")
    if physical.billing_reference != reference:
        raise PaybackProjectionError("self_consumption does not match the reference")
    if physical.status not in _ACCEPTED_COVERAGE or physical.self_consumption_kwh is None:
        return None
    generator = next(
        (unit for unit in cycle.units if unit.unit_id == physical.unit_id), None
    )
    if generator is None or generator.financial is None:
        return None
    items = generator.financial.items
    # A tarifa segue a mesma ordem de preferência da parcela de fatura. Exigir a
    # linha de consumo não compensado da própria geradora deixava o autoconsumo
    # sem preço justamente nos meses em que ela compensou todo o consumo — e um
    # mês desses sumia do gráfico sem explicação.
    resolved = _resolve_unit_tariff(generator.financial, basis, investment)
    if resolved is None:
        return None
    non_compensated, _sources, _origin = resolved
    compensated = _tariff(_unique_item(items, code=_COMPENSATED_CODE))
    flag_items = _matching_items(items, category=_FLAG_CATEGORY)
    if len(flag_items) > 1:
        return None
    flag = _ZERO if not flag_items else _tariff(flag_items[0])
    if non_compensated is None or compensated is None or flag is None:
        return None
    kwh = _finite_decimal(physical.self_consumption_kwh, "self_consumption_kwh")
    return kwh, non_compensated, flag, compensated, physical.status, physical.unit_id


@dataclass(frozen=True)
class _EligibleReference:
    """Internal, already validated projection input for one reference."""

    reference: str
    units: tuple[UnitCycleSavings, ...]
    official_savings: Decimal
    paid_total: Decimal | None
    hypothetical: tuple[Decimal, Decimal, Decimal, Decimal, str, str] | None
    full_tariff_basis: FullTariffBasis | None = None
    missing_units: tuple[str, ...] = ()


def _eligible_reference(
    cycle: PaybackCycleInput,
    investment: PaybackConfiguration | None = None,
) -> tuple[_EligibleReference | None, tuple[str, ...]]:
    if not isinstance(cycle, PaybackCycleInput):
        raise PaybackProjectionError("cycles must contain PaybackCycleInput values")
    reference = cycle.billing_reference
    _reference_key(reference)
    if not isinstance(cycle.units, tuple) or not cycle.units:
        raise PaybackProjectionError("cycle units must be a non-empty tuple")
    if len({unit.unit_id for unit in cycle.units}) != len(cycle.units):
        raise PaybackProjectionError(f"duplicate unit in reference: {reference}")

    # Cada unidade entra assim que a própria fatura chega. Esperar todas
    # esconderia do gráfico uma economia que já está comprovada em fatura; a
    # pendência fica registrada no ciclo e o tira da média, não do recuperado.
    present = tuple(unit for unit in cycle.units if unit.financial is not None)
    missing = tuple(unit.unit_id for unit in cycle.units if unit.financial is None)
    if not present:
        return None, (f"missing_invoice:{reference}",)

    _full_tariff, tariff_problem, tariff_basis = _reference_full_tariff(present)

    savings: list[UnitCycleSavings] = []
    warnings: list[str] = [f"missing_invoice:{reference}"] if missing else []
    if tariff_problem is not None:
        # Não é motivo para recusar o mês. Cada unidade ainda tem a tarifa que a
        # própria fatura publica, e a base declarada atende quem compensou tudo.
        # No mês seguinte a um reajuste as faturas divergem de verdade — cada
        # unidade lê num dia diferente e pega proporções diferentes das duas
        # tarifas —, e recusar ali apagaria o mês inteiro do gráfico, com todas
        # as unidades, por um desacordo que é legítimo.
        warnings.append(f"{tariff_problem}:{reference}")
    for unit in present:
        entry, warning = _unit_savings(unit, reference, tariff_basis, investment)
        savings.append(entry)
        if warning is not None:
            warnings.append(warning)

    if (
        not any(item.status == "confirmed" for item in savings)
        and any(item.status == "unconfirmed" for item in savings)
    ):
        return None, (*warnings, f"no_confirmed_savings:{reference}")

    official = sum((item.scee_savings for item in savings), _ZERO)
    # Only units that actually received credit belong in the paid comparison:
    # a unit without compensation pays the same with or without the system, so
    # including it would inflate both sides and blur what the system changed.
    compensated = [item for item in savings if item.status == "confirmed"]
    paid_values = [item.paid_total for item in compensated]
    paid = (
        sum(paid_values, _ZERO)
        if compensated and all(value is not None for value in paid_values)
        else None
    )
    return (
        _EligibleReference(
            reference=reference,
            units=tuple(savings),
            official_savings=official,
            paid_total=paid,
            hypothetical=_hypothetical_inputs(
                cycle, reference, tariff_basis, investment
            ),
            full_tariff_basis=tariff_basis,
            missing_units=missing,
        ),
        tuple(warnings),
    )


def _scenario(
    name: str,
    fraction: Decimal,
    eligible: tuple[_EligibleReference, ...],
    investment_total: Decimal,
) -> PaybackScenario:
    if not eligible:
        return PaybackScenario(
            name=name,
            status="unavailable",
            compensation_fraction=fraction,
            cycles=(),
            average_monthly_savings=None,
            annualized_savings=None,
            payback_months=None,
            payback_years=None,
            blockers=("no_eligible_cycles",),
        )
    benefits = []
    for item in eligible:
        if item.hypothetical is None:
            kwh = tariff = flag = compensated = coverage = owner = None
            self_consumption_saving = _ZERO
            self_consumption_price = None
        else:
            kwh, tariff, flag, compensated, coverage, owner = item.hypothetical
            full_tariff_saving = kwh * (tariff + flag)
            fully_compensated_saving = kwh * compensated
            self_consumption_saving = (
                (Decimal("1") - fraction) * full_tariff_saving
                + fraction * fully_compensated_saving
            )
            # Preço efetivo do cenário, para a linha do autoconsumo poder ser
            # lida como as demais: kWh x preço = valor cheio. Não há fio B a
            # subtrair, porque essa energia nunca passou pelo medidor — por isso
            # o valor cheio e a economia coincidem nessa linha.
            self_consumption_price = (
                (Decimal("1") - fraction) * (tariff + flag) + fraction * compensated
            )
        official = item.official_savings
        total = official + self_consumption_saving
        benefits.append(ProjectedCycleBenefit(
            billing_reference=item.reference,
            units=item.units,
            official_scee_savings=official,
            paid_total=item.paid_total,
            self_consumption_kwh=kwh,
            non_compensated_tariff=tariff,
            flag_tariff=flag,
            compensated_tariff=compensated,
            scenario_self_consumption_savings=self_consumption_saving,
            projected_cycle_benefit=total,
            self_consumption_financial_status=(
                "unavailable" if item.hypothetical is None else "scenario_only"
            ),
            self_consumption_coverage=coverage,
            self_consumption_unit_id=owner,
            self_consumption_unit_price=self_consumption_price,
            full_tariff_basis=item.full_tariff_basis,
            missing_units=item.missing_units,
        ))
    cycles = tuple(benefits)
    # A média só enxerga ciclos completos: um mês com fatura pendente puxaria o
    # ritmo para baixo e alongaria o prazo por um valor que ainda vai chegar.
    complete = tuple(item for item in cycles if not item.missing_units)
    if not complete:
        return PaybackScenario(
            name=name,
            status="unavailable",
            compensation_fraction=fraction,
            cycles=cycles,
            average_monthly_savings=None,
            annualized_savings=None,
            payback_months=None,
            payback_years=None,
            blockers=("no_eligible_cycles",),
        )
    # Cada parcela é dividida pela amostra que a produziu: a oficial existe em
    # toda referência elegível, o autoconsumo apenas onde houve medição. Diluir
    # o autoconsumo pelos ciclos anteriores ao medidor projetaria para o futuro
    # uma limitação de instrumentação que já não existe.
    measured = sum(
        1 for item in complete
        if item.self_consumption_financial_status == "scenario_only"
    )
    official_average = sum(
        (item.official_scee_savings for item in complete), _ZERO
    ) / Decimal(len(complete))
    self_consumption_average = (
        sum((item.scenario_self_consumption_savings for item in complete), _ZERO)
        / Decimal(measured)
    ) if measured else _ZERO
    average = official_average + self_consumption_average
    annualized = average * _TWELVE
    if average <= 0:
        months = years = None
        blockers = ("non_positive_monthly_savings",)
    else:
        months = investment_total / average
        years = months / _TWELVE
        blockers = ()
    return PaybackScenario(
        name=name,
        status="scenario_only",
        compensation_fraction=fraction,
        cycles=cycles,
        average_monthly_savings=average,
        annualized_savings=annualized,
        payback_months=months,
        payback_years=years,
        blockers=blockers,
    )


def _validated_balances(
    balances: tuple[UnitCreditBalance, ...],
) -> tuple[UnitCreditBalance, ...]:
    if not isinstance(balances, tuple):
        raise PaybackProjectionError("balances must be a tuple")
    seen: set[str] = set()
    for item in balances:
        if not isinstance(item, UnitCreditBalance):
            raise PaybackProjectionError("balances must contain UnitCreditBalance values")
        _finite_decimal(item.balance_kwh, f"balance.{item.unit_id}")
        _reference_key(item.billing_reference)
        if item.unit_id in seen:
            raise PaybackProjectionError(f"duplicate balance unit: {item.unit_id}")
        seen.add(item.unit_id)
    return balances


def project_simple_payback(
    investment: PaybackConfiguration,
    cycles: tuple[PaybackCycleInput, ...],
    balances: tuple[UnitCreditBalance, ...] = (),
) -> PaybackProjectionResult:
    """Annualize matched confirmed references into explicit sensitivity scenarios."""
    if not isinstance(investment, PaybackConfiguration):
        raise PaybackProjectionError("investment must be a PaybackConfiguration")
    if not isinstance(cycles, tuple):
        raise PaybackProjectionError("cycles must be a tuple")
    investment_total = _finite_decimal(investment.investment_total, "investment_total")
    if investment_total <= 0:
        raise PaybackProjectionError("investment_total must be positive")
    balances = _validated_balances(balances)

    by_reference: dict[str, _EligibleReference] = {}
    collected: list[str] = []
    for cycle in cycles:
        resolved, cycle_warnings = _eligible_reference(cycle, investment)
        collected.extend(cycle_warnings)
        if resolved is None:
            continue
        if resolved.reference in by_reference:
            raise PaybackProjectionError(
                f"duplicate eligible reference: {resolved.reference}"
            )
        by_reference[resolved.reference] = resolved

    eligible = tuple(
        sorted(by_reference.values(), key=lambda item: _reference_key(item.reference))
    )
    # A base da projeção é a mesma amostra da média: só ciclos completos.
    references = tuple(item.reference for item in eligible if not item.missing_units)
    warnings = [*dict.fromkeys(collected), "self_consumption_financial_scenario_only"]
    if len(references) < 12:
        warnings.insert(0, "limited_sample")
    # Os cenarios diferem so em quanto do autoconsumo contam; a economia
    # confirmada em fatura e a mesma em todos, e e dela que sai o marco.
    cenarios = tuple(
        _scenario(name, fraction, eligible, investment_total)
        for name, fraction in _SCENARIOS
    )
    return PaybackProjectionResult(
        investment=investment,
        settlement=settle_investment(
            next(
                (c.cycles for c in cenarios if c.name == PRIMARY_SCENARIO),
                (),
            ),
            investment_total,
        ),
        method=PaybackProjectionMethod(
            type="simple_payback",
            projection_method="annualized_from_confirmed_matched_cycles",
            eligible_cycle_count=len(references),
            eligible_references=references,
            sample_start=references[0] if references else None,
            sample_end=references[-1] if references else None,
        ),
        realized=RealizedPayback(),
        scenarios=cenarios,
        balances=balances,
        warnings=tuple(warnings),
    )


def project_simple_payback_from_model(
    financial_model_path: str | Path,
    cycles: tuple[PaybackCycleInput, ...],
    balances: tuple[UnitCreditBalance, ...] = (),
) -> PaybackProjectionResult:
    """Load the financial authority and calculate the scenario-only projection."""
    return project_simple_payback(
        load_financial_model(financial_model_path), cycles, balances
    )
