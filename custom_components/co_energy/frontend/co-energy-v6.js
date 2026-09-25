(() => {
  "use strict";

  const CARD_TAG = "co-energy-overview-card-v6";
  //: O mesmo componente registrado como painel da barra lateral. O nome e
  //: acordado com `panel_custom` no backend: mudar aqui exige mudar la.
  const PANEL_TAG = "co-energy-panel-v6";
  const API_VERSION = 1;
  const OVERVIEW_COMMAND = "co_energy/get_overview";
  const HISTORY_COMMAND = "co_energy/get_history";
  const CYCLES_COMMAND = "co_energy/get_cycles";
  const COMPARISON_COMMAND = "co_energy/get_comparison";
  const AUDIT_COMMAND = "co_energy/get_audit";
  const SCEE_COMMAND = "co_energy/get_scee";
  const FINANCE_COMMAND = "co_energy/get_finance";
  const DISTRIBUTION_COMMAND = "co_energy/get_distribution";
  const SET_DISTRIBUTION_COMMAND = "co_energy/set_distribution_immediate";
  const SCHEDULE_DISTRIBUTION_COMMAND = "co_energy/schedule_distribution";
  const CANCEL_DISTRIBUTION_COMMAND = "co_energy/cancel_scheduled_distribution";
  const SELF_CONSUMPTION_COMMAND = "co_energy/get_self_consumption";
  const CYCLE_COST_COMMAND = "co_energy/get_cycle_cost_estimate";
  const DAILY_BALANCE_COMMAND = "co_energy/get_daily_balance";
  const INSTANT_STATISTICS_COMMAND = "co_energy/get_instant_statistics";
  const MEASUREMENTS_COMMAND = "co_energy/get_measurements";
  // O Home Assistant empurra um `hass` novo a cada mudanca de estado da
  // casa inteira, nao so das nossas entidades. Sem esta espera seriam
  // dezenas de consultas por minuto para redesenhar os mesmos numeros.
  const MEASUREMENTS_DEBOUNCE_MS = 2000;
  // A janela e do backend; aqui ela so e escrita na tela. Um maximo sem o
  // intervalo a que pertence nao significa nada.
  const INSTANT_STATISTICS_WINDOW = "24 h";
  // A unidade que gera. O rateio parte dela, e por isso ela e a unica que
  // nao tem "recebido" nem "saldo do dia" a mostrar.
  //
  // Quem responde e o backend, pelo papel declarado no modelo — e a resposta
  // pode ser "ninguem". Nao ha mais valor padrao aqui: o nome de uma unidade
  // desta casa como palpite fazia uma instalacao sem geracao pedir dados de
  // uma unidade que nao existe.
  // Onde a tela aberta fica guardada entre recargas. So a aba e a unidade:
  // referencia de fatura e periodo dos graficos abrem sempre no mais
  // recente, de proposito.
  const VIEW_STORAGE_KEY = "co-energy-v6:view";
  const SETTINGS_GET_COMMAND = "co_energy/get_settings";
  const SETTINGS_SET_COMMAND = "co_energy/set_settings";
  const SENSORS_GET_COMMAND = "co_energy/get_sensors";
  const SENSORS_SET_COMMAND = "co_energy/set_sensors";
  const MODEL_GET_COMMAND = "co_energy/get_model_config";
  const MODEL_IMPORT_COMMAND = "co_energy/import_model";
  const MODEL_SET_UNIT_COMMAND = "co_energy/set_unit";
  const MODEL_SET_UNIT_SENSOR_COMMAND = "co_energy/set_unit_sensor";
  const MODEL_SWAP_METER_COMMAND = "co_energy/swap_unit_meter";
  // O envio da foto nao passa pelo WebSocket: JSON deixaria uma foto de
  // celular um terco maior e carregada duas vezes na memoria.
  const UNIT_IMAGE_UPLOAD_URL = "/api/co_energy/unit_image";
  // As faturas lidas pelo proprio Home Assistant. O PDF vai por HTTP, como a
  // foto, e o resto pelo WebSocket.
  const INVOICE_UPLOAD_URL = "/api/co_energy/invoice";
  const INVOICES_GET_COMMAND = "co_energy/get_invoices";
  const INVOICES_OWNER_COMMAND = "co_energy/set_uc_owner";
  const INVOICES_COMPARE_COMMAND = "co_energy/compare_invoices";
  const INVOICES_USE_COMMAND = "co_energy/use_invoice_storage";
  const INVOICE_DELETE_COMMAND = "co_energy/delete_invoice";
  const INVOICES_EXPORT_COMMAND = "co_energy/export_invoices";

  // SHA-256 de um arquivo, para saber antes de enviar se ele ja foi lido. O
  // navegador tem o seu (crypto.subtle), mas so o oferece em HTTPS — e o Home
  // Assistant aberto pelo IP da rede de casa e HTTP. Sem esta versao em
  // JavaScript puro, quem abre pelo IP reenviaria a pasta inteira todo mes.
  const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  function sha256HexPuro(bytes) {
    const h = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);
    const tamanho = bytes.length;
    const total = Math.ceil((tamanho + 9) / 64) * 64;
    const msg = new Uint8Array(total);
    msg.set(bytes);
    msg[tamanho] = 0x80;
    const dv = new DataView(msg.buffer);
    const bits = tamanho * 8;
    dv.setUint32(total - 8, Math.floor(bits / 0x100000000));
    dv.setUint32(total - 4, bits >>> 0);
    const w = new Uint32Array(64);
    for (let bloco = 0; bloco < total; bloco += 64) {
      for (let i = 0; i < 16; i += 1) w[i] = dv.getUint32(bloco + i * 4);
      for (let i = 16; i < 64; i += 1) {
        const x = w[i - 15];
        const y = w[i - 2];
        const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i += 1) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + SHA256_K[i] + w[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] += a; h[1] += b; h[2] += c; h[3] += d;
      h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
    }
    return Array.from(h, (v) => v.toString(16).padStart(8, "0")).join("");
  }

  // A UC costuma estar no nome do arquivo ("01-26 <UC>.pdf"). A tela mostra
  // o nome para dizer em que PDF a leitura esta, e nao precisa da UC inteira
  // para isso: fica o final, como em todo lugar onde a UC aparece.
  function maskLongNumbers(texto) {
    return String(texto ?? "").replace(
      /[0-9]{6,}/g, (numero) => "•".repeat(numero.length - 4) + numero.slice(-4),
    );
  }

  async function sha256Hex(buffer) {
    if (globalThis.crypto?.subtle?.digest) {
      try {
        const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
      } catch (_) {
        // Cai para a versao em JavaScript.
      }
    }
    return sha256HexPuro(new Uint8Array(buffer));
  }
  const ROLE_GENERATOR = "producer_consumer";
  const ROLE_CONSUMER = "consumer_beneficiary";
  // Como a tela mostra cada estado de presenca. "Nao existe" e o unico que
  // pede acao aqui: os outros ou estao certos, ou se resolvem no equipamento.
  const SENSOR_PRESENCE = {
    present: ["tag tag-ok", "Recebendo"],
    unavailable: ["tag tag-warn", "Sem valor"],
    missing: ["tag tag-crit", "Não existe aqui"],
    unknown: ["tag tag-log", "Não apurado"],
  };
  const PAYBACK_PROJECTION_COMMAND = "co_energy/get_payback_projection";
  const ENERGY_FLOW_COMMAND = "co_energy/get_energy_flow";
  const UNITS_COMMAND = "co_energy/get_units";
  const DATA_HEALTH_COMMAND = "co_energy/get_data_health";
  // Paginas que nao leem o snapshot da unidade: tem comando proprio ou so
  // mexem em configuracao. Bloquea-las junto com o snapshot tirava do ar
  // justamente as telas de onde se enxerga o problema e se dispara a correcao
  // — foi assim que apagar o arquivo de faturas deixou o painel sem saida.
  const UNIT_FREE_PAGES = new Set([
    "payback", "diagnostico", "configuracao", "alertas", "auditoria",
  ]);
  // Sem o arquivo de faturas o sistema entra em modo reduzido. Estas paginas
  // continuam de pe porque nao dependem dele: a configuracao e onde se dispara
  // a extracao que recria o arquivo, e a saude dos dados e onde se enxerga o
  // que esta faltando — ela tem comando proprio, o backend dela ja trata o
  // documento ausente e o redesenho dela nunca reconstroi a pagina inteira.
  const PAGES_WITHOUT_BILLING = new Set(["configuracao", "diagnostico", "excluir"]);
  const BILLING_UNAVAILABLE_CODE = "billing_source_unavailable";
  // A pagina de saude se relê sozinha enquanto esta aberta: e ela que tem de
  // mostrar um medidor caindo sem o operador apertar nada.
  const DATA_HEALTH_REFRESH_MS = 60000;
  // O payback compara com nao ter o sistema: a energia autoconsumida
  // teria sido comprada a tarifa cheia. Ver contrato-funcional §14.
  const PRIMARY_SCENARIO = "optimistic";
  // A posicao liquida comeca antes do primeiro ciclo, no fundo do
  // investimento. Esta categoria e esse ponto de partida, e ela nao rotula
  // mes nenhum — nao ha fatura ali.
  const INICIO_CATEGORIA = "​inicio";
  // Abaixo do zero ainda se deve, acima e saldo. As duas leituras do payback
  // e a legenda usam estas cores, para "saldo positivo" ser a mesma coisa em
  // qualquer canto do painel.
  const COR_DEVENDO = "#e8734a";
  const COR_SALDO = "#7ed321";
  // Opacidade alta de proposito. Sobre um fundo quase preto, cor translucida
  // vira uma versao suja de si mesma: o verde a 34% saia como (67, 93, 56),
  // que e oliva, e o vermelho como vinho. A 55% cada um chega na tela como a
  // cor que tem nome.
  const FUNDO_DEVENDO = "rgba(232, 62, 54, .55)";
  const FUNDO_SALDO = "rgba(155, 246, 90, .55)";
  // Ordem única das colunas da auditoria: o cabeçalho e o rótulo que cada célula
  // carrega no celular saem daqui, para não poderem divergir entre si.
  const _AUDIT_COLUMNS = Object.freeze([
    "Unidade", "Compensada", "Tarifa com tributos", "Bandeira", "Preço unitário",
    "Valor cheio", "Fio B cobrado", "Energia não compensada",
    "Bandeira da Energia não compensada", "Ilum. pública", "Multa e juros",
    "Outros itens", "Valor Oficial da Fatura",
    "Valor da Fatura sem o crédito", "Economia",
  ]);
  // A ordem serve às três conferências que a auditoria exige. A soma da fatura
  // paga é a mais longa e a mais fácil de errar, então as seis parcelas dela
  // ficam seguidas; e o resultado final fica ao lado das duas que o produzem.
  const _AUDIT_GROUPS = Object.freeze([
    { label: "", span: 1 },
    { label: "Valor da energia compensada", span: 5 },
    { label: "O que a fatura cobrou", span: 7 },
    { label: "Resultado", span: 2 },
  ]);
  // ===================== PALETA =====================
  // Fonte unica de verdade das cores do painel. Documentada em PALETA.md, mas
  // quem decide e este bloco: a doc pode ficar velha, o codigo nao.
  //
  // Sao tres familias que precisam nunca ser confundidas entre si:
  //   1. GRANDEZAS  — o que foi medido. Saturadas, Material 500/A400.
  //   2. DERIVADAS  — o que resulta das medidas, como o saldo repartido.
  //   3. UNIDADES   — quem consome. Surdas de proposito (400/700), porque no
  //      Fluxo de Energia elas aparecem lado a lado com as grandezas, e
  //      separar por saturacao — nao so por matiz — impede ler uma unidade
  //      como se fosse uma medicao.

  // Chaveado pelo sufixo do logical_id, nunca pela posicao numa lista: o
  // grafico da curva e o Fluxo de Energia leem a mesma tabela, e reordenar as
  // series nao pode trocar as cores de dono.
  const METRIC_COLORS = Object.freeze({
    generation_energy: "#FFC107",
    export_energy: "#00E676",
    import_energy: "#FF5722",
    self_consumption: "#00BCD4",
    physical_consumption: "#2196F3",
    // A beneficiaria mede contra o mesmo campo da fatura que a importacao
    // da geradora; dar outra cor sugeriria outra grandeza.
    consumption_energy: "#FF5722",
  });

  // O saldo que sobra para o rateio. Nao e medicao: e o que resta da
  // exportacao depois da importacao, e por isso tem cor propria em vez de
  // herdar a de uma das duas.
  const DISTRIBUTION_COLOR = "#9C27B0";

  // O periodo anterior no grafico de Comparacao. Neutro de proposito: ele
  // acompanha qualquer grandeza que o seletor escolher, entao nao pode ser a
  // cor de nenhuma delas.
  const COMPARISON_PREVIOUS_COLOR = "#673AB7";

  // Cada unidade precisa de uma cor estavel para se reconhecer no grafico e
  // na rosca do rateio. Uma tabela com o nome de cada unidade resolvia isso
  // so para esta casa: em outra instalacao, toda unidade cairia no neutro.
  // A paleta e fixa, e o indice sai do proprio identificador — mesma unidade,
  // mesma cor, sempre, sem o codigo precisar conhece-la.
  // Nem toda cor esta livre. As grandezas ja ocupam ambar, verde, laranja,
  // ciano e azul; o rateio usa roxo e a comparacao, violeta; e o payback tem
  // laranja no investimento e ambar no mes parcial. Medindo os matizes, sobram
  // tres faixas: lima (~98), indigo (~234) e rosa (~333).
  //
  // Por isso a paleta vive nessas tres, variando a luminosidade, mais dois
  // neutros que se distinguem pela saturacao baixa. A ordem alterna as faixas:
  // duas unidades vizinhas nunca recebem tons parecidos, o que importa no
  // payback, onde as barras se encostam empilhadas.
  const UNIT_PALETTE = Object.freeze([
    "#EC407A", // rosa
    "#5F68C7", // indigo
    "#9CCC65", // lima
    "#A1887F", // marrom, neutro quente
    "#F48FB1", // rosa claro
    "#3842AB", // indigo escuro
    "#689F38", // lima escura
    "#90A4AE", // azul acinzentado, neutro frio
  ]);

  // O icone diz o papel, nao a identidade: quem gera ganha o raio, o resto
  // ganha a casa. E o unico traco que o codigo pode saber de qualquer unidade.
  const UNIT_ICON_GENERATOR = "mdi:home-lightning-bolt";
  const UNIT_ICON_CONSUMER = "mdi:home-outline";

  const HISTORY_MODES = Object.freeze({
    day: Object.freeze({ label: "DIA", resolution: "hour" }),
    month: Object.freeze({ label: "MÊS", resolution: "day" }),
    year: Object.freeze({ label: "ANO", resolution: "month" }),
    cycle: Object.freeze({ label: "CICLO", resolution: "day" }),
  });
  const HISTORY_TODAY_TTL_MS = 5 * 60 * 1000;
  const COMPARISON_CURRENT_TTL_MS = 5 * 60 * 1000;
  const CYCLES_CATALOG_TTL_MS = 5 * 60 * 1000;
  // Servido pela propria integracao, ao lado deste arquivo. Antes apontava
  // para /local/, que exigia copiar o bundle para `www` a mao — e `www` e
  // servido sem login.
  const CHART_MODULE_URL = new URL(
    "./co-energy-chart-v6.js", import.meta.url,
  ).href;
  const ALLOWED_PERIODS = new Set(["hour", "5minute"]);
  class CoEnergyOverviewCardV6 extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = null;
      this._hass = null;
      this._selectedUnit = null;
      // A aba volta de onde o usuario estava. A unidade salva e aplicada no
      // setConfig, quando ja se sabe quais unidades existem.
      this._storedView = this._readStoredView();
      // Qual leitura do payback esta aberta: as barras de sempre, ou a
      // posicao liquida. E preferencia de leitura, nao estado de dado.
      this._paybackChartMode = this._storedView.paybackChart ?? "bars";
      // A aba guardada vale como esta. Conferir aqui se ela existe dava sempre
      // "nao": a lista de unidades ainda nao chegou, e sem ela so existe a
      // Configuracao — toda recarga jogava a pessoa para fora da aba em que
      // estava. Quem confere e _renderPage, ja com a lista na mao; primeira
      // abertura, sem nada guardado, cai na Visao geral.
      this._page = this._storedView.page ?? "overview";
      this._cache = new Map();
      this._stale = new Map();
      this._errors = new Map();
      this._inFlight = new Map();
      this._selectionToken = 0;
      this._configGeneration = 0;
      this._historyMode = "day";
      this._historyCycleIds = new Map();
      this._historyReferences = {
        day: this._localDateValue(new Date()),
        month: null,
        year: null,
        cycle: null,
      };
      this._billingReference = null;
      // Distingue a escolha do usuario do padrao do sistema. Sem isso as duas
      // sao o mesmo campo, e manter a referencia ao trocar de unidade —
      // desejavel depois de uma escolha — impedia cada unidade de abrir na
      // sua mais recente.
      this._billingReferenceChosen = false;
      this._billingCapabilityPending = new Set();
      // Unidades em que a pessoa escolheu o modo do grafico: ali o padrao
      // "ano" da unidade so com fatura nao se impoe de novo.
      this._historyModeChosen = new Set();
      this._historyModeAntesDoPadrao = null;
      this._cyclesCatalogCache = new Map();
      this._cyclesCatalogErrors = new Map();
      this._cyclesCatalogInFlight = new Map();
      this._cycleInvalidReferenceRetries = new Set();
      this._historyCache = new Map();
      this._historyErrors = new Map();
      this._historyInFlight = new Map();
      this._historyRequestToken = 0;
      this._historyVisible = false;
      this._historyLegendSelection = new Map();
      this._chartModulePromise = null;
      this._chartModule = null;
      this._chartModuleError = "";
      this._historyChart = null;
      // Janelas de ocorrencia a pintar no grafico, vindas da auditoria.
      // { unit, events: [{ start, end }] } ou null.
      this._historyHighlight = null;
      this._historyResizeObserver = null;
      this._historyIntersectionObserver = null;
      this._comparisonReference = this._localMonthValue(new Date());
      this._comparisonMode = "month";
      this._comparisonReferences = {
        day: this._localDateValue(new Date()),
        rolling_days: this._localDateValue(new Date()),
        month: this._comparisonReference,
      };
      this._comparisonStrategy = "automatic";
      this._comparisonCustomDraft = {
        baseStart: "",
        baseEnd: "",
        comparisonStart: "",
        comparisonEnd: "",
      };
      // Instante de corte do modo ciclo. Vazio significa "agora", que e o que
      // se quer quase sempre; preenchido, congela a janela num ponto passado
      // para conferir a conta sem ela se mexer entre um clique e outro.
      this._comparisonCycleCut = "";
      // Dia e Intervalo so carregam depois que o Comparar congela um intervalo.
      // O ciclo nao tem intervalo a congelar — as janelas vem dos proprios
      // ciclos — entao o que ele congela e o consentimento em si.
      this._comparisonCycleApplied = false;
      // O seletor de grandeza e montado junto com o titulo mas so entra no DOM
      // na linha dos controles; este campo o carrega entre os dois momentos.
      this._comparisonMetricControl = null;
      this._comparisonCustomRange = null;
      this._comparisonCustomPeriodType = "day";
      this._comparisonCustomResolution = "hour";
      this._comparisonCustomResolutionManual = false;
      this._comparisonLogicalIds = new Map();
      // Quais grandezas cada unidade aceita comparar, e em que ordem. Vem do
      // backend em available_metrics; aqui so guardamos a ultima que chegou.
      this._comparisonMetricsByUnit = new Map();
      this._comparisonCache = new Map();
      this._comparisonErrors = new Map();
      this._comparisonInFlight = new Map();
      this._comparisonRequestToken = 0;
      this._comparisonChart = null;
      this._comparisonResizeObserver = null;
      this._auditCache = new Map();
      // Qual ocorrencia esta aberta no modal, ou null. Um por vez: sao janelas
      // de investigacao, nao algo para comparar lado a lado.
      this._auditIssueModal = null;
      // O recorte do grafico aberto sobre a auditoria, ou null. Estado proprio:
      // ele nao pode mexer na unidade nem na data do painel de historico.
      this._auditChartModal = null;
      this._auditChartModal = null;
      this._auditChart = null;
      this._auditChartResizeObserver = null;
      this._auditErrors = new Map();
      this._auditInFlight = new Map();
      this._auditRequestToken = 0;
      this._sceeCache = new Map();
      this._sceeErrors = new Map();
      this._sceeInFlight = new Map();
      this._sceeRequestToken = 0;
      this._financeCache = new Map();
      this._financeErrors = new Map();
      this._financeInFlight = new Map();
      this._financeRequestToken = 0;
      this._selfConsumptionCache = new Map();
      this._selfConsumptionErrors = new Map();
      this._selfConsumptionInFlight = new Map();
      this._selfConsumptionRequestToken = 0;
      this._paybackProjectionData = null;
      this._paybackProjectionError = "";
      this._paybackProjectionInFlight = null;
      this._paybackProjectionRequestToken = 0;
      this._distributionData = null;
      this._distributionError = "";
      this._distributionLoading = false;
      this._distributionRequestToken = 0;
      this._distributionMode = "idle";
      this._distributionDraft = null;
      this._distributionConfirmation = null;
      // Qual vista do rateio esta aberta em popup: "editar", "historico" ou
      // null. O painel completo saiu da Visao geral e passou a morar aqui.
      this._distributionModal = null;
      // Qual referencia esta com o diagnostico de qualidade aberto, e o que ja
      // foi baixado sobre ela. A evidencia vem do endpoint de autoconsumo, que
      // e quem mede a cobertura das series de onde o fluxo tira os numeros.
      this._qualityModal = null;
      this._qualityEvidence = new Map();
      this._qualityErrors = new Map();
      this._qualityInFlight = new Map();
      this._qualityChart = null;
      this._qualityChartResizeObserver = null;
      this._flowChart = null;
      this._flowChartResizeObserver = null;
      // Estimativa de custo do ciclo em curso, por unidade. O calculo mora no
      // backend; aqui so se guarda o que ele respondeu.
      this._cycleCost = new Map();
      this._cycleCostInFlight = new Map();
      this._cycleCostErrors = new Map();
      // Consumido, recebido e saldo do dia corrente, por unidade.
      this._dailyBalance = new Map();
      this._dailyBalanceInFlight = new Map();
      this._instantStats = new Map();
      this._instantStatsInFlight = new Map();
      this._measurementsTimer = null;
      this._measurementsInFlight = false;
      // Variacao do ciclo contra o anterior, por unidade. Vem pronta do
      // backend, pela mesma comparacao que o grafico usa.
      this._cycleTrend = new Map();
      this._cycleTrendInFlight = new Map();
      // Ajustes operacionais: o que o backend respondeu, o rascunho em edicao
      // e o estado da gravacao. O rascunho e separado do gravado de proposito
      // — digitar nao pode recalcular o historico a cada tecla.
      this._settings = null;
      this._settingsError = "";
      this._settingsLoading = false;
      this._settingsDraft = null;
      this._settingsSaveState = "idle";
      this._settingsSaveMessage = "";
      // As faturas lidas pelo HA: o que esta guardado, a leitura de uma pasta
      // em andamento, e a comparacao com o arquivo antigo.
      this._invoices = null;
      this._invoicesLoading = false;
      this._invoiceRun = null;
      this._invoiceMessage = "";
      this._invoiceMessageKind = "ok";
      this._invoiceCompare = null;
      this._invoiceBusy = false;
      this._settingsModal = null;
      this._settingsNewTariff = null;
      // Correspondencia entre a entidade declarada no modelo e a desta
      // instalacao. Mesma separacao entre gravado e rascunho: trocar o nome de
      // um sensor muda de onde toda serie le, e nao pode acontecer por tecla.
      this._sensors = null;
      this._sensorsError = "";
      this._sensorsLoading = false;
      this._sensorsDraft = null;
      this._sensorsSaveState = "idle";
      this._sensorsSaveMessage = "";
      // O modelo em si: quais unidades existem, como se chamam, quem gera.
      // Editar aqui grava no Home Assistant, e o arquivo declarado deixa de
      // ser lido — por isso a origem anda junto com os dados.
      this._modelConfig = null;
      this._modelError = "";
      this._modelLoading = false;
      this._modelSaveState = "idle";
      this._modelSaveMessage = "";
      this._modelNewUnit = null;
      // A grandeza escolhida que ainda espera um sensor. Ela nao vai
      // para o modelo enquanto nao tiver entidade: uma serie sem fonte
      // nao e valida, e nem deveria ser.
      this._modelPendingMetric = null;
      // A troca de medidor em curso: entidade nova, instante e rotulo. Nao
      // vai para o modelo enquanto nao tiver os dois primeiros.
      this._modelPendingSwap = null;
      // Qual unidade esta aberta na configuracao. Uma por vez: com cinco
      // abertas, chegar na ultima exigia rolar a tela inteira.
      this._modelOpenUnit = null;
      // A unidade cujo titulo deve ser enquadrado no proximo desenho.
      this._modelScrollToUnit = null;
      // Preenchido pelo catalogo de unidades; ate la vale o palpite.
      this._generatorUnit = null;
      // Ligado quando o backend responde billing_source_unavailable, o que so
      // acontece quando o arquivo de faturas nao pode ser lido.
      this._billingUnavailable = false;
      this._dataHealth = null;
      this._dataHealthError = "";
      this._dataHealthInFlight = null;
      this._dataHealthAttemptAt = 0;
      this._dataHealthTimer = null;
      this._dataHealthOpen = new Map();
      this._dataHealthInfoOpen = false;
      this._distributionMutationState = "idle";
      this._distributionMutationMessage = "";
      this._energyFlowData = null;
      this._energyFlowReference = null;
      // Qual ciclo o painel mostra. null significa "o atual" — nao um valor
      // ausente: e o pedido sem billing_reference, que o backend resolve para
      // o ciclo em andamento. O painel responde "como esta o sistema agora",
      // entao esse e o padrao, nao a ultima fatura.
      this._energyFlowSelection = null;
      // Recorte do fluxo. "cycle" e o unico com apuracao oficial; dia e mes
      // existem para observar o sistema numa janela mais curta.
      //
      // ANO fica de fora por enquanto: uma janela de centenas de dias sem
      // leitura gera milhares de ocorrencias de balde parcial, e o trecho que
      // as associa as fatias ainda e quadratico. O pedido nao volta.
      this._energyFlowPeriodKind = "cycle";
      this._energyFlowCalendar = {
        day: this._localDateValue(new Date()),
        month: this._localMonthValue(new Date()),
      };
      this._energyFlowError = "";
      this._energyFlowLoading = false;
      this._energyFlowRequestToken = 0;
      this._unitCatalog = null;
      this._unitCapabilities = null;
      this._unitCatalogRequest = null;
      this._paybackChart = null;
      this._paybackResizeObserver = null;

      this._style = document.createElement("style");
      this._style.textContent = this._styles();
      this._root = document.createElement("div");
      this._root.className = "root";
      this.shadowRoot.append(this._style, this._root);
      this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
      // No celular, deslizar o dedo muda de aba. `passive` de proposito: o
      // gesto nunca e cancelado, entao a rolagem vertical continua fluida.
      this.shadowRoot.addEventListener(
        "touchstart", (event) => this._onSwipeStart(event), { passive: true },
      );
      this.shadowRoot.addEventListener(
        "touchend", (event) => this._onSwipeEnd(event), { passive: true },
      );
      this.shadowRoot.addEventListener("change", (event) => this._handleChange(event));
      this.shadowRoot.addEventListener("input", (event) => this._handleInput(event));
    }

    // O exemplo que o Home Assistant oferece ao adicionar o cartao. Nao nomeia
    // unidade nenhuma: quem sabe quais existem e o modelo, e o cartao pergunta
    // a ele. Listar as desta casa faria o cartao nascer errado em outra.
    static getStubConfig() {
      return {
        type: `custom:${CARD_TAG}`,
        statistics_period: "hour",
      };
    }

    setConfig(config) {
      if (!config || typeof config !== "object") {
        throw new Error("A configuração do card é obrigatória.");
      }
      // `units` deixou de ser obrigatorio: quem sabe quais unidades existem e
      // o modelo, e o cartao pergunta a ele. Continua aceito porque quem ja
      // tem a lista escrita no painel nao deveria ter de apaga-la — e serve
      // de reserva ate o catalogo chegar, no primeiro quadro.
      if (config.units !== undefined && !Array.isArray(config.units)) {
        throw new Error("units, quando informado, deve ser uma lista.");
      }

      const units = (config.units ?? []).map((unit) => {
        if (typeof unit !== "string" || !unit.trim()) {
          throw new Error("Todos os itens de units devem ser strings não vazias.");
        }
        return unit;
      });
      const defaultUnit = config.default_unit ?? units[0] ?? null;
      if (defaultUnit !== null
        && (typeof defaultUnit !== "string"
          || (units.length > 0 && !units.includes(defaultUnit)))) {
        throw new Error("default_unit deve pertencer a units.");
      }

      const statisticsPeriod = config.statistics_period ?? "hour";
      if (!ALLOWED_PERIODS.has(statisticsPeriod)) {
        throw new Error("statistics_period deve ser hour ou 5minute.");
      }

      const nextConfig = {
        units,
        defaultUnit,
        statisticsPeriod,
      };
      const changed = this._configSignature(this._config)
        !== this._configSignature(nextConfig);
      this._config = nextConfig;

      if (changed) {
        this._selectionToken += 1;
        this._configGeneration += 1;
        this._selectedUnit = units.includes(this._storedView?.unit)
          ? this._storedView.unit
          : defaultUnit;
        this._cache.clear();
        this._stale.clear();
        this._errors.clear();
        this._inFlight.clear();
        this._historyMode = "day";
        this._historyCycleIds.clear();
        this._historyReferences = {
          day: this._localDateValue(new Date()),
          month: null,
          year: null,
          cycle: null,
        };
        this._billingReference = null;
        this._billingReferenceChosen = false;
        this._billingCapabilityPending.clear();
        this._cyclesCatalogCache.clear();
        this._cyclesCatalogErrors.clear();
        this._cyclesCatalogInFlight.clear();
        this._cycleInvalidReferenceRetries.clear();
        this._historyCache.clear();
        this._historyErrors.clear();
        this._historyInFlight.clear();
        this._historyRequestToken += 1;
        this._historyVisible = false;
        this._historyLegendSelection.clear();
        this._comparisonReference = this._localMonthValue(new Date());
        this._comparisonMode = "month";
        this._comparisonReferences = {
          day: this._localDateValue(new Date()),
          rolling_days: this._localDateValue(new Date()),
          month: this._comparisonReference,
        };
        this._comparisonStrategy = "automatic";
        this._comparisonCustomDraft = {
          baseStart: "",
          baseEnd: "",
          comparisonStart: "",
          comparisonEnd: "",
        };
        this._comparisonCustomRange = null;
        this._comparisonCustomPeriodType = "day";
        this._comparisonCustomResolution = "hour";
        this._comparisonCustomResolutionManual = false;
        this._comparisonLogicalIds.clear();
        this._comparisonMetricsByUnit.clear();
        this._comparisonCache.clear();
        this._comparisonErrors.clear();
        this._comparisonInFlight.clear();
        this._comparisonRequestToken += 1;
        this._auditCache.clear();
        this._auditErrors.clear();
        this._auditInFlight.clear();
        this._auditRequestToken += 1;
        this._sceeCache.clear();
        this._sceeErrors.clear();
        this._sceeInFlight.clear();
        this._sceeRequestToken += 1;
        this._financeCache.clear();
        this._financeErrors.clear();
        this._financeInFlight.clear();
        this._financeRequestToken += 1;
        this._selfConsumptionCache.clear();
        this._selfConsumptionErrors.clear();
        this._selfConsumptionInFlight.clear();
        this._selfConsumptionRequestToken += 1;
        this._paybackProjectionData = null;
        this._paybackProjectionError = "";
        this._paybackProjectionInFlight = null;
        this._paybackProjectionRequestToken += 1;
        this._distributionData = null;
        this._distributionError = "";
        this._distributionLoading = false;
        this._distributionRequestToken += 1;
        this._resetDistributionInteraction();
        this._energyFlowData = null;
        this._energyFlowReference = null;
        this._energyFlowSelection = null;
        this._energyFlowError = "";
        this._energyFlowLoading = false;
        this._energyFlowRequestToken += 1;
        this._cleanupHistoryRendering();
        this._cleanupComparisonChart();
      } else if (!this._selectedUnit) {
        this._selectedUnit = units.includes(this._storedView?.unit)
          ? this._storedView.unit
          : defaultUnit;
      }

      this._render();
      if (changed) {
        this._loadSelected();
        this._loadOverviewUnits();
        this._loadUnitCatalog();
        this._loadDistribution();
        this._loadEnergyFlow();
        this._ensureBillingOnlyMode(this._selectedUnit);
      }
    }

    // localStorage pode faltar ou lancar (navegacao privada, bloqueio de
    // dados do site). Sem ele a tela abre no padrao, como sempre abriu.
    _readStoredView() {
      try {
        const bruto = window.localStorage.getItem(VIEW_STORAGE_KEY);
        const dados = bruto ? JSON.parse(bruto) : null;
        return {
          page: typeof dados?.page === "string" ? dados.page : null,
          unit: typeof dados?.unit === "string" ? dados.unit : null,
          paybackChart: dados?.paybackChart === "curve" ? "curve" : "bars",
        };
      } catch {
        return { page: null, unit: null, paybackChart: "bars" };
      }
    }

    // Deslizar o dedo para o lado vai para a aba vizinha. Existe porque a
    // faixa de icones rola, e no telefone chegar na ultima aba custava rolar
    // a faixa antes de poder tocar.
    _onSwipeStart(event) {
      const toque = event.touches?.[0];
      // So gesto de um dedo: dois dedos sao zoom, e a pagina nao se mete.
      if (!toque || event.touches.length !== 1) {
        this._swipe = null;
        return;
      }
      // A borda esquerda pertence ao "voltar" do navegador.
      if (toque.clientX < 24) {
        this._swipe = null;
        return;
      }
      this._swipe = {
        x: toque.clientX,
        y: toque.clientY,
        em: Date.now(),
        // Gesto que nasce dentro de algo que rola na horizontal — a faixa de
        // icones, uma tabela larga, o proprio grafico — pertence aquilo.
        rolavel: this._temRolagemHorizontal(event),
      };
    }

    _temRolagemHorizontal(event) {
      const caminho = typeof event.composedPath === "function"
        ? event.composedPath()
        : [event.target];
      for (const no of caminho) {
        if (!(no instanceof HTMLElement)) continue;
        if (no.scrollWidth <= no.clientWidth + 2) continue;
        // Conteudo mais largo que a caixa nao quer dizer que a caixa ROLA:
        // com overflow-x clip ela so corta, e scrollWidth cresce do mesmo
        // jeito. Sem esta checagem, o clip que segura a pagina faria o gesto
        // desistir no meio da tela.
        const estilo = globalThis.getComputedStyle?.(no);
        const overflow = estilo?.overflowX;
        if (overflow === "auto" || overflow === "scroll") return true;
      }
      return false;
    }

    _onSwipeEnd(event) {
      const inicio = this._swipe;
      this._swipe = null;
      if (!inicio || inicio.rolavel) return;
      // Dialogo aberto tem os proprios gestos; trocar de aba por baixo dele
      // deixaria o operador numa pagina que ele nao pediu.
      if (this._settingsModal || this._auditIssueModal || this._distributionModal) return;
      const toque = event.changedTouches?.[0];
      if (!toque) return;

      const dx = toque.clientX - inicio.x;
      const dy = toque.clientY - inicio.y;
      // Horizontal de verdade: 60px de curso, e mais que o dobro do desvio
      // vertical. Abaixo disso e rolagem da pagina com a mao torta.
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
      if (Date.now() - inicio.em > 700) return;

      const paginas = this._pages().map((item) => item[0]);
      const atual = paginas.indexOf(this._page);
      if (atual < 0) return;
      const destino = atual + (dx < 0 ? 1 : -1);
      if (destino < 0 || destino >= paginas.length) return;
      this._page = paginas[destino];
      this._storeView();
      this._render();
    }

    _storeView() {
      try {
        window.localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify({
          page: this._page,
          unit: this._selectedUnit,
          paybackChart: this._paybackChartMode,
        }));
      } catch {
        // Sem armazenamento a navegacao continua funcionando; so nao sobrevive
        // a recarga.
      }
    }

    set hass(hass) {
      const hadValidHass = this._hass && typeof this._hass.callWS === "function";
      const hasValidHass = hass && typeof hass.callWS === "function";
      this._hass = hass;
      // Depois da primeira carga, cada `hass` novo agenda so a releitura das
      // medicoes instantaneas. O resto da tela responde a ciclo e fatura, que
      // nao mudam de segundo em segundo.
      if (hadValidHass && hasValidHass) this._scheduleMeasurementsRefresh();
      if (!hadValidHass && hasValidHass) {
        this._render();
        this._loadSelected();
        this._loadOverviewUnits();
        this._loadUnitCatalog();
        this._loadDistribution();
        this._loadEnergyFlow();
        this._ensureBillingOnlyMode(this._selectedUnit);
      }
    }

    connectedCallback() {
      // Voltar de outra pagina do Home Assistant — a da integracao, onde se
      // cria e exclui unidade e se aponta sensor — reencontra o painel como
      // ficou. Sem recarregar, a unidade excluida la continuava aqui, com erro
      // e sem saida, ate alguem apertar atualizar.
      if (this._wasConnected) {
        this._render();
        this._refreshAll();
        return;
      }
      this._wasConnected = true;
      this._render();
      this._loadSelected();
      this._loadOverviewUnits();
      this._loadUnitCatalog();
      this._loadDistribution();
      this._loadEnergyFlow();
      this._ensureBillingOnlyMode(this._selectedUnit);
    }

    disconnectedCallback() {
      if (this._measurementsTimer) {
        clearTimeout(this._measurementsTimer);
        this._measurementsTimer = null;
      }
      this._cleanupHistoryRendering();
      this._cleanupComparisonChart();
      this._stopDataHealthRefresh();
    }

    _configSignature(config) {
      if (!config) return "";
      return JSON.stringify([
        config.units,
        config.defaultUnit,
        config.statisticsPeriod,
      ]);
    }

    _key(unit = this._selectedUnit) {
      return `${unit}|${this._config?.statisticsPeriod ?? "hour"}`;
    }

    _displayData(key = this._key()) {
      return this._cache.get(key) ?? this._stale.get(key) ?? null;
    }

    _billingReferenceFor(unit = this._selectedUnit) {
      return unit === this._selectedUnit
        && this._closedBillingReferences(unit).includes(this._billingReference)
        ? this._billingReference
        : null;
    }

    _auditReference(unit = this._selectedUnit) {
      return this._billingReferenceFor(unit);
    }

    // A tabela comparativa nao depende de qual unidade esta selecionada: cada
    // uma e auditada na SUA ultima referencia fechada. `_auditReference` devolve
    // null fora da selecionada, e era por isso que so uma linha se preenchia.
    _latestClosedReference(unit) {
      return this._closedBillingReferences(unit)[0] ?? null;
    }

    // Todas as referencias fechadas de qualquer unidade, da mais recente para a
    // mais antiga. Como cada unidade fecha em data propria, a lista e a uniao —
    // uma referencia pode existir em tres unidades e faltar na quarta.
    _allClosedReferences() {
      const seen = new Set();
      for (const unit of this._unitIds()) {
        for (const reference of this._closedBillingReferences(unit)) seen.add(reference);
      }
      return [...seen].sort((left, right) => {
        const a = this._billingReferenceParts(left);
        const b = this._billingReferenceParts(right);
        if (!a || !b) return 0;
        return (b.year - a.year) || (b.month - a.month);
      });
    }

    _auditScopeValue() {
      if (this._auditScope === "all") return "all";
      const references = this._allClosedReferences();
      if (this._auditScope && references.includes(this._auditScope)) return this._auditScope;
      return references[0] ?? null;
    }

    _setAuditScope(value) {
      this._auditScope = value;
      // Uma referencia escolhida tambem move o detalhe abaixo, para o painel
      // inteiro falar do mesmo ciclo; "todos" nao mexe na selecao.
      if (value !== "all" && value) this._setBillingReference(value);
      else this._render();
      this._loadAllAudits();
    }

    _auditKey(
      unit = this._selectedUnit,
      reference = this._auditReference(unit),
    ) {
      return `${unit}|${reference ?? ""}`;
    }

    _closedBillingReferences(unit = this._selectedUnit) {
      return (this._cyclesCatalog(unit) ?? [])
        .filter((cycle) => (
          cycle?.status === "closed"
          && typeof cycle.billing_reference === "string"
          && cycle.billing_reference.trim()
        ))
        .map((cycle) => cycle.billing_reference)
        .sort((left, right) => {
          const leftParts = this._billingReferenceParts(left);
          const rightParts = this._billingReferenceParts(right);
          if (!leftParts || !rightParts) return 0;
          return (rightParts.year - leftParts.year)
            || (rightParts.month - leftParts.month);
        });
    }

    _reconcileBillingReference(unit = this._selectedUnit) {
      const references = this._closedBillingReferences(unit);
      // Uma escolha explicita e mantida onde ela existir: e o que permite
      // olhar o mesmo mes em quatro unidades seguidas.
      //
      // Enquanto ninguem escolheu, porem, cada unidade abre na SUA referencia
      // mais recente. Elas fecham em datas diferentes — uma vira o mes no
      // dia 1, outra no dia 14 — e herdar o mes da unidade anterior
      // so por ele existir na lista mostrava um ciclo velho numa unidade que
      // ja tinha um mais novo.
      if (this._billingReferenceChosen
        && references.includes(this._billingReference)) {
        return this._billingReference;
      }
      // A lista ja vem da mais recente para a mais antiga. A referencia da
      // ultima fatura registrada nao serve de padrao: ela atrasa, porque o
      // ciclo fecha semanas antes de a fatura chegar.
      const next = references[0] ?? null;
      this._billingReference = next;
      return next;
    }

    _sceeReference(unit = this._selectedUnit) {
      return this._billingReferenceFor(unit);
    }

    _sceeKey(
      unit = this._selectedUnit,
      reference = this._sceeReference(unit),
    ) {
      return `${unit}|${reference ?? ""}`;
    }

    _financeReference(unit = this._selectedUnit) {
      return this._billingReferenceFor(unit);
    }

    _financeKey(
      unit = this._selectedUnit,
      reference = this._financeReference(unit),
    ) {
      return `${unit}|${reference ?? ""}`;
    }

    _selfConsumptionKey(
      unit = this._selectedUnit,
      reference = this._billingReferenceFor(unit),
    ) {
      return `${unit}|${reference ?? ""}`;
    }

    _localDateValue(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    _localMonthValue(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    }

    _localYearValue(date) {
      return String(date.getFullYear()).padStart(4, "0");
    }

    _parseLocalDate(value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return this._localDateValue(date) === value ? date : null;
    }

    _parseLocalMonth(value) {
      if (!/^\d{4}-\d{2}$/.test(value)) return null;
      const [year, month] = value.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      return this._localMonthValue(date) === value ? date : null;
    }

    _parseLocalYear(value) {
      if (!/^\d{4}$/.test(value)) return null;
      const year = Number(value);
      const date = new Date(year, 0, 1);
      return this._localYearValue(date) === value ? date : null;
    }

    _historyReferenceDefinition(mode = this._historyMode) {
      const definitions = {
        day: {
          parse: (value) => this._parseLocalDate(value),
          current: () => this._localDateValue(new Date()),
        },
        month: {
          parse: (value) => this._parseLocalMonth(value),
          current: () => this._localMonthValue(new Date()),
        },
        year: {
          parse: (value) => this._parseLocalYear(value),
          current: () => this._localYearValue(new Date()),
        },
      };
      return definitions[mode];
    }

    _currentHistoryReference() {
      if (this._historyMode === "cycle") {
        return this._selectedHistoryCycle()?.cycle_id ?? null;
      }
      return this._historyReferences[this._historyMode];
    }

    _historyResolution() {
      return HISTORY_MODES[this._historyMode].resolution;
    }

    _historyKey(
      unit = this._selectedUnit,
      mode = this._historyMode,
      reference = this._currentHistoryReference(),
      resolution = this._historyResolution(),
    ) {
      return `${unit}|${mode}|${reference}|${resolution}`;
    }

    _historyCacheEntry(key = this._historyKey()) {
      return this._historyCache.get(key) ?? null;
    }

    _historyCacheIsFresh(key = this._historyKey()) {
      const entry = this._historyCacheEntry(key);
      if (!entry) return false;
      if (this._historyMode === "cycle") {
        if (this._isOpenCycle()) {
          return Date.now() - entry.cachedAt <= HISTORY_TODAY_TTL_MS;
        }
        return this._cyclesCatalogIsFresh(this._selectedUnit);
      }
      const currentReference = this._historyReferenceDefinition().current();
      if (this._currentHistoryReference() !== currentReference) return true;
      return Date.now() - entry.cachedAt <= HISTORY_TODAY_TTL_MS;
    }

    _historyData(key = this._historyKey()) {
      return this._historyCacheEntry(key)?.data ?? null;
    }

    _historyHasNumericData(history) {
      return Array.isArray(history?.series)
        && history.series.some((series) => (
          Array.isArray(series?.points)
          && series.points.some((point) => (
            typeof point?.value === "number" && Number.isFinite(point.value)
          ))
        ));
    }

    _historyHasEnergyVariation(history) {
      return Array.isArray(history?.series)
        && history.series.some((series) => (
          Array.isArray(series?.points)
          && series.points.some((point) => (
            typeof point?.value === "number"
            && Number.isFinite(point.value)
            && point.value !== 0
          ))
        ));
    }

    _historyEmptyMessage(mode = this._historyMode) {
      return {
        day: "Sem dados de medição disponíveis para este dia.",
        month: "Sem dados de medição disponíveis para este mês.",
        year: "Sem dados de medição disponíveis para este ano.",
        cycle: "Sem dados de medição disponíveis para este ciclo.",
      }[mode] ?? "Sem dados de medição disponíveis para este período.";
    }

    _historyNoVariationMessage(mode = this._historyMode) {
      return {
        day: "Nenhuma variação de energia registrada neste dia.",
        month: "Nenhuma variação de energia registrada neste mês.",
        year: "Nenhuma variação de energia registrada neste ano.",
        cycle: "Nenhuma variação de energia registrada neste ciclo.",
      }[mode] ?? "Nenhuma variação de energia registrada neste período.";
    }

    _comparisonMetrics(unit = this._selectedUnit) {
      return this._comparisonMetricsByUnit.get(unit) ?? [];
    }

    // null significa "ainda nao sei": o pedido sai sem logical_id e o backend
    // responde com a primeira da ordem publica dele. Chutar um padrao aqui era
    // o que obrigava o frontend a conhecer a lista antes de perguntar.
    _comparisonLogicalId(unit = this._selectedUnit) {
      const metrics = this._comparisonMetrics(unit);
      const selected = this._comparisonLogicalIds.get(unit);
      if (!selected) return null;
      if (!metrics.length) return selected;
      return metrics.some((metric) => metric.logicalId === selected)
        ? selected
        : null;
    }

    _comparisonUnavailable(unit = this._selectedUnit) {
      const overview = this._displayData(this._key(unit));
      // Sem a lista local, quem responde por "esta unidade compara?" e o
      // proprio snapshot: unidade sem medidor nao tem serie para comparar.
      return overview?.snapshot?.measured === false
        || this._unitIsBillingOnly(unit);
    }

    _comparisonKey(
      unit = this._selectedUnit,
      reference = this._comparisonReferences[this._comparisonMode],
      logicalId = this._comparisonLogicalId(unit),
    ) {
      // Sem grandeza escolhida a chave e "auto": e um recorte legitimo, o de
      // abrir na grandeza que o backend considera a primeira.
      logicalId = logicalId ?? "auto";
      if (this._comparisonStrategy === "custom") {
        const range = this._comparisonCustomRange;
        return [
          unit,
          logicalId,
          "custom",
          range?.baseStart ?? "",
          range?.baseEnd ?? "",
          range?.comparisonStart ?? "",
          range?.comparisonEnd ?? "",
          this._comparisonCustomPeriodType,
          this._comparisonCustomResolution,
          this._comparisonCycleCut,
        ].join("|");
      }
      const windowDays = this._comparisonMode === "rolling_days" ? 7 : "";
      return `${unit}|${logicalId}|automatic|${this._comparisonMode}|${reference}|${windowDays}`;
    }

    _comparisonCacheIsFresh(key = this._comparisonKey()) {
      const entry = this._comparisonCache.get(key);
      if (!entry) return false;
      const today = this._localDateValue(new Date());
      const current = this._comparisonStrategy === "automatic"
        ? this._comparisonReferences[this._comparisonMode]
          === (this._comparisonMode === "month" ? today.slice(0, 7) : today)
        // Ciclo sem corte fixado termina "agora": e sempre um recorte vivo, e
        // portanto sujeito ao TTL curto como qualquer periodo que inclui hoje.
        : this._comparisonCustomPeriodType === "cycle"
          ? !this._comparisonCycleCut
          : this._comparisonCustomRange?.baseEnd === today
          || this._comparisonCustomRange?.comparisonEnd === today;
      if (!current) return true;
      return Date.now() - entry.cachedAt <= COMPARISON_CURRENT_TTL_MS;
    }

    _comparisonData(key = this._comparisonKey()) {
      return this._comparisonCache.get(key)?.data ?? null;
    }

    _comparisonSeriesHasNumericData(series) {
      return Array.isArray(series?.points) && series.points.some((point) => (
        typeof point?.value === "number" && Number.isFinite(point.value)
      ));
    }

    _comparisonSeriesHasVariation(series) {
      return Array.isArray(series?.points) && series.points.some((point) => (
        typeof point?.value === "number"
        && Number.isFinite(point.value)
        && point.value !== 0
      ));
    }

    _cyclesCatalogEntry(unit = this._selectedUnit) {
      return this._cyclesCatalogCache.get(unit) ?? null;
    }

    _cyclesCatalog(unit = this._selectedUnit) {
      return this._cyclesCatalogEntry(unit)?.cycles ?? null;
    }

    _cyclesCatalogIsFresh(unit = this._selectedUnit) {
      const entry = this._cyclesCatalogEntry(unit);
      return Boolean(entry)
        && Date.now() - entry.cachedAt <= CYCLES_CATALOG_TTL_MS;
    }

    _selectedCycle(unit = this._selectedUnit) {
      const reference = this._billingReferenceFor(unit);
      return this._cyclesCatalog(unit)?.find((cycle) => (
        cycle?.status === "closed" && cycle?.billing_reference === reference
      )) ?? null;
    }

    _selectedHistoryCycle(unit = this._selectedUnit) {
      const cycles = this._selectableHistoryCycles(unit);
      const selectedId = this._historyCycleIds.get(unit);
      const selected = cycles.find((cycle) => cycle?.cycle_id === selectedId);
      if (selected) return selected;
      const operational = cycles.find((cycle) => (
        cycle?.status === "open" || cycle?.status === "provisional"
      ));
      if (operational) return operational;
      const reference = this._billingReferenceFor(unit);
      return cycles.find((cycle) => cycle?.billing_reference === reference)
        ?? cycles[0]
        ?? null;
    }

    _selectableHistoryCycles(unit = this._selectedUnit) {
      const cycles = this._cyclesCatalog(unit);
      if (!Array.isArray(cycles)) return [];
      return cycles.filter((cycle) => (
        typeof cycle?.cycle_id === "string"
        && ["open", "provisional", "closed"].includes(cycle.status)
      ));
    }

    _cycleSupportsHistory(cycle = this._selectedHistoryCycle()) {
      return cycle?.capability === "operational_history"
        && cycle.history_available === true
        && cycle.period !== null
        && typeof cycle.period === "object";
    }

    _unitIsBillingOnly(unit = this._selectedUnit) {
      // A unidade que diz "sem medidor" e so fatura, qualquer que seja o
      // catalogo. Depender so dele deixava o grafico de sensor — dia, mes,
      // "sem dados de medicao" — numa unidade que nunca vai ter medicao.
      const snapshot = this._displayData(this._key(unit))?.snapshot;
      if (snapshot?.measured === false) return true;
      const cycles = this._cyclesCatalog(unit);
      return Array.isArray(cycles)
        && cycles.some((cycle) => cycle?.capability === "billing_only");
    }

    // Um ciclo que traz o consumo oficial da fatura — o que o historico de
    // unidade so com fatura desenha.
    _cycleHasOfficialConsumption(cycle) {
      const valor = cycle?.official_consumption?.value;
      return typeof valor === "number" && Number.isFinite(valor);
    }

    // MMM/AAAA vira MM/AA: uma lista de ciclos medidos cabe numa linha só.
    _compactReference(reference) {
      const parts = this._billingReferenceParts(reference);
      if (!parts) return String(reference ?? "");
      return `${String(parts.month).padStart(2, "0")}/${String(parts.year).slice(-2)}`;
    }

    _billingReferenceParts(reference) {
      const match = /^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/(\d{4})$/.exec(
        String(reference),
      );
      if (!match) return null;
      const months = [
        "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
        "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
      ];
      return { month: months.indexOf(match[1]) + 1, year: Number(match[2]) };
    }

    async _ensureBillingOnlyMode(unit = this._selectedUnit) {
      if (!unit) return;
      this._billingCapabilityPending.add(unit);
      try {
        await this._loadCyclesCatalog({ unit, allowOutsideCycle: true });
      } finally {
        this._billingCapabilityPending.delete(unit);
      }
      if (unit !== this._selectedUnit) return;
      this._reconcileBillingReference(unit);
      if (!this._unitIsBillingOnly(unit)) {
        // Voltando de uma unidade so com fatura: o modo que ela impos (ano)
        // nao pode seguir para a unidade com sensor, que estava em outro.
        if (this._historyModeAntesDoPadrao) {
          this._historyMode = this._historyModeAntesDoPadrao;
          this._historyModeAntesDoPadrao = null;
          this._historyRequestToken += 1;
        }
        this._render();
        return;
      }
      // Sem sensor, o ano e a visao que mais diz: todas as faturas lado a
      // lado. Abre nele — no ano da fatura mais recente, que em janeiro ainda
      // e o ano anterior — ate a pessoa escolher outro modo nesta unidade.
      if (!this._historyModeChosen.has(unit)) {
        const anos = (this._cyclesCatalog(unit) ?? [])
          .map((cycle) => this._billingReferenceParts(cycle?.billing_reference)?.year)
          .filter(Number.isInteger);
        if (this._historyMode !== "year" || anos.length) {
          if (!this._historyModeAntesDoPadrao && this._historyMode !== "year") {
            this._historyModeAntesDoPadrao = this._historyMode;
          }
          this._historyMode = "year";
          if (anos.length) this._historyReferences.year = String(Math.max(...anos));
          this._historyRequestToken += 1;
        }
      } else if (this._historyMode !== "cycle" && this._historyMode !== "year") {
        this._historyMode = "year";
        this._historyRequestToken += 1;
      }
      this._render();
      if (this._historyVisible) this._renderHistoryChart();
    }

    // Unidade sem sensor so tem o que a concessionaria publica. Sem nenhuma
    // fatura com consumo, nao ha curva a desenhar, e o grafico sai da tela.
    // Enquanto o catalogo nao chegou, nao se sabe — e o grafico fica.
    _unitHasOfficialHistory(unit = this._selectedUnit) {
      const cycles = this._cyclesCatalog(unit);
      if (!Array.isArray(cycles)) return true;
      return cycles.some((cycle) => {
        const valor = cycle?.official_consumption?.value;
        return typeof valor === "number" && Number.isFinite(valor);
      });
    }

    _isOpenCycle(cycle = this._selectedHistoryCycle()) {
      return cycle?.status === "open";
    }

    _isProvisionalCycle(cycle = this._selectedHistoryCycle()) {
      return cycle?.status === "provisional";
    }

    async _loadCyclesCatalog({
      force = false,
      unit = this._selectedUnit,
      allowOutsideCycle = false,
      // Sem redesenho da pagina: quem chama atualiza so o que precisa. Na
      // Visao geral sao quatro catalogos chegando juntos, e cada _render
      // remontaria o Sankey inteiro.
      quiet = false,
    } = {}) {
      if (
        (!allowOutsideCycle && (
          !this._historyVisible || this._historyMode !== "cycle"
        ))
        || !unit
        || !this._hass
        || typeof this._hass.callWS !== "function"
      ) {
        return null;
      }
      if (!force && this._cyclesCatalogIsFresh(unit)) {
        return this._cyclesCatalog(unit);
      }
      if (this._cyclesCatalogInFlight.has(unit)) {
        return this._cyclesCatalogInFlight.get(unit);
      }

      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._cyclesCatalogErrors.delete(unit);
      if (!quiet) this._render();
      const request = requestHass.callWS({
        type: CYCLES_COMMAND,
        unit_id: unit,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato de ciclos incompatível com esta versão do card.");
        }
        if (!response.data || !Array.isArray(response.data.cycles)) {
          throw new Error("Resposta de ciclos inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        const cycles = response.data.cycles;
        this._cyclesCatalogCache.set(unit, { cycles, cachedAt: Date.now() });
        if (unit === this._selectedUnit) {
          const previousReference = this._billingReference;
          const nextReference = this._reconcileBillingReference(unit);
          if (previousReference !== nextReference) {
            this._historyRequestToken += 1;
            this._auditRequestToken += 1;
            this._sceeRequestToken += 1;
            this._financeRequestToken += 1;
            this._selfConsumptionRequestToken += 1;
          }
        }
        this._cyclesCatalogErrors.delete(unit);
        if (!quiet && unit === this._selectedUnit) {
          this._render();
        }
        return cycles;
      }).catch(() => {
        if (configGeneration !== this._configGeneration) return null;
        this._cyclesCatalogErrors.set(
          unit,
          "Não foi possível carregar os ciclos de faturamento.",
        );
        if (!quiet && unit === this._selectedUnit) {
          this._render();
        }
        return null;
      }).finally(() => {
        if (this._cyclesCatalogInFlight.get(unit) === request) {
          this._cyclesCatalogInFlight.delete(unit);
        }
        if (
          !quiet
          && configGeneration === this._configGeneration
          && unit === this._selectedUnit
        ) {
          this._render();
        }
      });
      this._cyclesCatalogInFlight.set(unit, request);
      if (!quiet) this._render();
      return request;
    }

    async _loadOverviewUnits({ force = false } = {}) {
      if (!this._config) return;
      await Promise.all(this._unitIds().map((unit) => (
        this._loadOverviewUnit(unit, { force })
      )));
    }

    async _loadSelected({ force = false } = {}) {
      return this._loadOverviewUnit(this._selectedUnit, { force });
    }

    async _loadOverviewUnit(unit, { force = false } = {}) {
      if (
        !this._config
        || !unit
        || !this._unitIds().includes(unit)
        || !this._hass
        || typeof this._hass.callWS !== "function"
      ) {
        return;
      }
      const key = this._key(unit);
      if (!force && this._cache.has(key)) return;
      if (this._inFlight.has(key)) return this._inFlight.get(key);
      // Uma chave que ja falhou nao se repede sozinha. Sem isto o erro se
      // grava e chama _render(), o render reagenda a carga e a carga falha de
      // novo — a tela se redesenha sem parar e o botao e destruido entre o
      // apertar e o soltar do mouse, entao nenhum clique completa. Mesma
      // protecao que a comparacao ja tinha. Nova tentativa so por "Tentar
      // novamente" ou pelo refresh, que passam force.
      if (!force && this._errors.has(key)) return;

      const token = this._selectionToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._errors.delete(key);
      this._render();

      const request = requestHass.callWS({
        type: OVERVIEW_COMMAND,
        unit_id: unit,
        statistics_period: this._config.statisticsPeriod,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato incompatível com esta versão do card.");
        }
        if (!response.data || typeof response.data !== "object") {
          throw new Error("Resposta de overview inválida.");
        }

        if (configGeneration !== this._configGeneration) return null;
        this._billingUnavailable = false;
        this._cache.set(key, response.data);
        this._stale.delete(key);
        this._errors.delete(key);
        if (this._page === "overview" || (
          token === this._selectionToken && unit === this._selectedUnit
        )) {
          this._render();
        }
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        const code = error?.code ?? error?.error?.code;
        if (code === BILLING_UNAVAILABLE_CODE) {
          this._billingUnavailable = true;
          // A pagina aberta pode ser uma das que acabaram de ser bloqueadas.
          if (!PAGES_WITHOUT_BILLING.has(this._page)) {
            this._page = "configuracao";
            this._storeView();
          }
        }
        const message = error instanceof Error && error.message
          ? error.message
          : "Não foi possível carregar os dados da unidade.";
        this._errors.set(key, message);
        if (this._page === "overview" || (
          token === this._selectionToken && unit === this._selectedUnit
        )) {
          this._render();
        }
        return null;
      }).finally(() => {
        if (this._inFlight.get(key) === request) this._inFlight.delete(key);
        if (
          configGeneration === this._configGeneration
          && (
            this._page === "overview"
            || (token === this._selectionToken && unit === this._selectedUnit)
          )
        ) {
          this._render();
        }
      });

      this._inFlight.set(key, request);
      this._render();
      return request;
    }

    async _loadHistory({ force = false } = {}) {
      if (
        !this._historyVisible
        || !this._selectedUnit
        || !this._hass
        || typeof this._hass.callWS !== "function"
      ) {
        return null;
      }
      if (this._billingCapabilityPending.has(this._selectedUnit)) return null;

      // Unidade so com fatura nao tem serie no Home Assistant: ano e ciclo
      // saem do catalogo de ciclos, que ja traz o consumo oficial de cada um.
      if (this._unitIsBillingOnly()) {
        await this._loadCyclesCatalog({ force: false });
        this._render();
        this._renderHistoryChart();
        return null;
      }

      if (this._historyMode === "cycle") {
        const cycles = await this._loadCyclesCatalog({ force: false });
        if (!Array.isArray(cycles) || cycles.length === 0) return null;
        if (!this._cycleSupportsHistory()) {
          return null;
        }
      }

      const unit = this._selectedUnit;
      const mode = this._historyMode;
      const reference = this._currentHistoryReference();
      const resolution = this._historyResolution();
      const key = this._historyKey(unit, mode, reference, resolution);
      if (!force && this._historyCacheIsFresh(key)) {
        this._render();
        return this._historyData(key);
      }
      if (this._historyInFlight.has(key)) return this._historyInFlight.get(key);

      const token = this._historyRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._historyErrors.delete(key);
      this._render();

      const request = requestHass.callWS({
        type: HISTORY_COMMAND,
        unit_id: unit,
        mode,
        reference,
        resolution,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato histórico incompatível com esta versão do card.");
        }
        if (!response.data || typeof response.data !== "object") {
          throw new Error("Resposta de histórico inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;

        this._historyCache.set(key, {
          data: response.data,
          cachedAt: Date.now(),
        });
        if (mode === "cycle") {
          this._cycleInvalidReferenceRetries.delete(`${unit}|${reference}`);
        }
        this._historyErrors.delete(key);
        if (
          token === this._historyRequestToken
          && unit === this._selectedUnit
          && mode === this._historyMode
          && reference === this._currentHistoryReference()
          && resolution === this._historyResolution()
          && key === this._historyKey()
        ) {
          this._render();
        }
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        const code = error?.code ?? error?.error?.code;
        if (mode === "cycle" && code === "history_invalid_reference") {
          const retryKey = `${unit}|${reference}`;
          if (!this._cycleInvalidReferenceRetries.has(retryKey)) {
            this._cycleInvalidReferenceRetries.add(retryKey);
            this._cyclesCatalogCache.delete(unit);
            queueMicrotask(async () => {
              await this._loadCyclesCatalog({ force: true });
              if (this._historyMode === "cycle" && unit === this._selectedUnit) {
                this._loadHistory({ force: true });
              }
            });
            return null;
          }
        }
        if (mode === "cycle" && code === "history_unavailable") {
          this._historyCache.set(key, {
            data: { available: false, mode, series: [] },
            cachedAt: Date.now(),
          });
          this._historyErrors.delete(key);
        } else {
          this._historyErrors.set(key, this._historyErrorMessage(error));
        }
        if (
          token === this._historyRequestToken
          && unit === this._selectedUnit
          && mode === this._historyMode
          && reference === this._currentHistoryReference()
          && resolution === this._historyResolution()
          && key === this._historyKey()
        ) {
          this._render();
        }
        return null;
      }).finally(() => {
        if (this._historyInFlight.get(key) === request) {
          this._historyInFlight.delete(key);
        }
        if (
          configGeneration === this._configGeneration
          && token === this._historyRequestToken
          && unit === this._selectedUnit
          && mode === this._historyMode
          && reference === this._currentHistoryReference()
          && resolution === this._historyResolution()
          && key === this._historyKey()
        ) {
          this._render();
        }
      });

      this._historyInFlight.set(key, request);
      this._render();
      return request;
    }

    async _loadComparison({ force = false } = {}) {
      if (
        !this._selectedUnit
        || this._comparisonUnavailable()
        || !this._hass
        || typeof this._hass.callWS !== "function"
      ) {
        return null;
      }
      const unit = this._selectedUnit;
      const mode = this._comparisonMode;
      const reference = this._comparisonReferences[this._comparisonMode];
      const logicalId = this._comparisonLogicalId(unit);
      const strategy = this._comparisonStrategy;
      const customResolution = this._comparisonCustomResolution;
      const customPeriodType = this._comparisonCustomPeriodType;
      const customRange = this._comparisonCustomRange;
      // Nenhum modo personalizado carrega sozinho. Dia e Intervalo esperam o
      // intervalo que o Comparar congela; o ciclo nao tem intervalo a congelar,
      // entao espera a marca que o mesmo botao deixa.
      if (strategy === "custom") {
        if (customPeriodType === "cycle") {
          if (!this._comparisonCycleApplied) return null;
        } else if (!customRange) {
          return null;
        }
      }
      const key = this._comparisonKey(unit, reference, logicalId);
      if (!force && this._comparisonCacheIsFresh(key)) {
        return this._comparisonData(key);
      }
      if (this._comparisonInFlight.has(key)) {
        return this._comparisonInFlight.get(key);
      }

      const token = this._comparisonRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._comparisonErrors.delete(key);
      // Quando o pedido sai sem grandeza, a chave da tela muda ao adotarmos a
      // que o backend escolheu. As tres etapas da promessa precisam enxergar
      // essa mudanca, ou o "Atualizando…" fica preso depois da primeira carga.
      let chaveResolvida = key;
      const payload = strategy === "custom" ? {
        type: COMPARISON_COMMAND,
        unit_id: unit,
        mode: "custom",
        strategy: "custom",
        ...(logicalId ? { logical_id: logicalId } : {}),
        ...(customPeriodType === "cycle" ? {} : {
          base_start: customRange.baseStart,
          base_end: customRange.baseEnd,
          comparison_start: customRange.comparisonStart,
          comparison_end: customRange.comparisonEnd,
        }),
        ...(customPeriodType === "cycle" && this._comparisonCycleCut
          ? { cut_instant: this._comparisonCycleCut } : {}),
        resolution: customResolution,
        period_type: customPeriodType,
      } : {
        type: COMPARISON_COMMAND,
        unit_id: unit,
        mode,
        strategy: "automatic",
        reference,
        ...(logicalId ? { logical_id: logicalId } : {}),
        ...(mode === "rolling_days" ? { window_days: 7 } : {}),
      };
      const request = Promise.resolve()
        .then(() => requestHass.callWS(payload))
        .then((response) => {
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato de comparação incompatível com esta versão do card.");
        }
        const data = response.data;
        if (
          !data
          || typeof data !== "object"
          || data.unit_id !== unit
          || data.mode !== (strategy === "custom" ? "custom" : mode)
          || (data.strategy ?? "automatic") !== strategy
          || (logicalId !== null && data.logical_id !== logicalId)
          || !Array.isArray(data.available_metrics)
          || !data.available_metrics.length
          || (strategy === "custom" && data.resolution !== customResolution)
          || (strategy === "custom" && data.period_type !== customPeriodType)
          || !(strategy === "custom"
            ? ["custom_equal_duration", "custom_different_duration"]
            : ["full_periods", "equivalent_elapsed"]).includes(data.alignment)
          || !data.base?.series
          || !data.comparison?.series
          || data.base.series.logical_id !== data.logical_id
          || data.comparison.series.logical_id !== data.logical_id
          || !Array.isArray(data.base.series.points)
          || !Array.isArray(data.comparison.series.points)
        ) {
          throw new Error("Resposta de comparação inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        this._comparisonCache.set(key, { data, cachedAt: Date.now() });
        this._comparisonErrors.delete(key);
        this._comparisonMetricsByUnit.set(unit, data.available_metrics.map(
          (item) => ({ logicalId: item.logical_id, label: item.label }),
        ));
        if (!logicalId) {
          // O pedido saiu sem grandeza; adotamos a que voltou. A resposta e
          // guardada tambem sob a chave dessa grandeza, senao a proxima
          // leitura — ja com a escolha concreta — daria falta no cache e
          // repetiria a mesma consulta.
          this._comparisonLogicalIds.set(unit, data.logical_id);
          chaveResolvida = this._comparisonKey(unit, reference, data.logical_id);
          this._comparisonCache.set(
            chaveResolvida, { data, cachedAt: Date.now() },
          );
        }
        // A chave atual pode ter acabado de mudar por causa da adocao acima;
        // por isso as duas contam como "ainda e esta a tela".
        const chaveAtual = this._comparisonKey();
        if (
          token === this._comparisonRequestToken
          && (key === chaveAtual || chaveResolvida === chaveAtual)
        ) {
          this._renderComparisonUpdate();
        }
        return data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        this._comparisonErrors.set(key, this._comparisonErrorMessage(error));
        if (
          token === this._comparisonRequestToken
          && (key === this._comparisonKey()
            || chaveResolvida === this._comparisonKey())
        ) {
          this._renderComparisonUpdate();
        }
        return null;
      }).finally(() => {
        if (this._comparisonInFlight.get(key) === request) {
          this._comparisonInFlight.delete(key);
        }
        if (configGeneration === this._configGeneration && this.isConnected) {
          this._renderComparisonUpdate();
        }
      });
      this._comparisonInFlight.set(key, request);
      this._renderComparisonUpdate();
      return request;
    }

    // `unit` explicito porque a aba de Auditoria compara as quatro de uma vez.
    // O padrao continua sendo a unidade selecionada, para os chamadores antigos.
    async _loadAudit({ force = false, unit = this._selectedUnit, reference = null } = {}) {
      if (
        !unit
        || !this._hass
        || typeof this._hass.callWS !== "function"
      ) {
        return null;
      }
      const billingReference = reference
        ?? (unit === this._selectedUnit
          ? this._auditReference(unit)
          : this._latestClosedReference(unit));
      if (!this._closedBillingReferences(unit).includes(billingReference)) {
        this._reconcileBillingReference(unit);
        this._renderAuditUpdate();
        return null;
      }
      const key = this._auditKey(unit, billingReference);
      if (!force && this._auditCache.has(key)) {
        this._renderAuditUpdate();
        return this._auditCache.get(key);
      }
      if (this._auditInFlight.has(key)) return this._auditInFlight.get(key);

      const token = this._auditRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._auditErrors.delete(key);
      this._renderAuditUpdate();
      const request = requestHass.callWS({
        type: AUDIT_COMMAND,
        unit_id: unit,
        billing_reference: billingReference,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato de auditoria incompatível com esta versão do card.");
        }
        if (!response.data || typeof response.data !== "object") {
          throw new Error("Resposta de auditoria inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        this._auditCache.set(key, response.data);
        this._auditErrors.delete(key);
        if (this._auditStillInFocus(token, unit, billingReference, key)) {
          this._renderAuditUpdate();
        }
        this._renderAuditOverviewUpdate();
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        this._auditErrors.set(key, this._auditErrorMessage(error));
        if (this._auditStillInFocus(token, unit, billingReference, key)) {
          this._renderAuditUpdate();
        }
        this._renderAuditOverviewUpdate();
        return null;
      }).finally(() => {
        if (this._auditInFlight.get(key) === request) {
          this._auditInFlight.delete(key);
        }
        if (
          configGeneration === this._configGeneration
          && this._auditStillInFocus(token, unit, billingReference, key)
        ) {
          this._renderAuditUpdate();
        }
        this._renderAuditOverviewUpdate();
      });
      this._auditInFlight.set(key, request);
      this._renderAuditUpdate();
      return request;
    }

    // Soma simples dos caracteres: nao precisa ser criptografica, precisa ser
    // a mesma toda vez para o mesmo identificador.
    // A cor escolhida vence a derivada. A derivada existe para que toda
    // unidade tenha uma cor estavel desde o primeiro instante, sem ninguem
    // precisar escolher — nao para impor a escolha.
    _unitColor(unitId) {
      const unidades = this._units();
      const indice = unidades.findIndex((unidade) => unidade.id === unitId);
      const escolhida = indice >= 0 ? unidades[indice].color : null;
      if (typeof escolhida === "string" && escolhida) return escolhida;
      // Pela posicao no modelo, nao por um numero tirado do nome. Duas razoes:
      // unidades vizinhas nunca caem na mesma cor, e a primeira, a segunda e a
      // terceira recebem sempre as mesmas cores — que sao as quatro primeiras
      // da paleta, as mesmas que a tabela por nome dava antes.
      return UNIT_PALETTE[(indice >= 0 ? indice : 0) % UNIT_PALETTE.length];
    }

    _unitIcon(unitId) {
      return unitId === this._generator ? UNIT_ICON_GENERATOR : UNIT_ICON_CONSUMER;
    }

    _unitIsMeasured(unit) {
      const snapshot = this._displayData(this._key(unit))?.snapshot;
      if (snapshot?.measured === false) return false;
      return !this._unitIsBillingOnly(unit);
    }


    _auditStillInFocus(token, unit, billingReference, key) {
      return token === this._auditRequestToken
        && unit === this._selectedUnit
        && billingReference === this._auditReference()
        && key === this._auditKey();
    }

    // Cada unidade tem o proprio ciclo de faturamento, entao cada uma e auditada
    // na SUA ultima referencia fechada — nao existe um mes comum as quatro.
    async _loadAllAudits({ force = false } = {}) {
      if (!this._config) return;
      // O resumo traz `latest_bill` e o flag `measured` de cada unidade, que a
      // tabela usa para a linha da unidade sem sensor.
      await this._loadOverviewUnits({ force });
      const unitScope = this._auditUnitScope();
      const alvoUnidades = this._unitIds()
        .filter((unit) => unitScope === "all" || unit === unitScope);
      await Promise.all(alvoUnidades.map(async (unit) => {
        if (!Array.isArray(this._cyclesCatalog(unit))) {
          await this._loadCyclesCatalog({ unit, allowOutsideCycle: true });
        }
        if (!this.isConnected) return;
        const scope = this._auditScopeValue();
        const alvos = scope === "all"
          ? this._closedBillingReferences(unit)
          : [scope].filter((item) => (
            item && this._closedBillingReferences(unit).includes(item)
          ));
        for (const reference of alvos) {
          if (!this.isConnected) return;
          const key = this._auditKey(unit, reference);
          if (!force && (this._auditCache.has(key) || this._auditInFlight.has(key))) continue;
          await this._loadAudit({ force, unit, reference });
        }
      }));
      this._renderAuditOverviewUpdate();
    }

    // O modal vive fora da tabela: recarregar a auditoria nao pode fecha-lo.
    _renderAuditIssueModalUpdate() {
      const host = this.shadowRoot?.querySelector("[data-audit-modal-host]");
      if (!host) return;
      // Trocar o conteudo descarta o grafico anterior: sem isto a instancia
      // do ECharts ficaria pendurada num elemento que ja saiu do DOM.
      this._cleanupAuditChart();
      host.replaceChildren();
      const modal = this._auditChartModal
        ? this._renderAuditChartModal()
        : this._renderAuditIssueModal();
      if (modal) host.append(modal);
      if (this._auditChartModal) {
        queueMicrotask(() => {
          if (this.isConnected) this._renderAuditChart();
        });
      }
    }

    _closeAuditModal() {
      this._auditIssueModal = null;
      this._auditChartModal = null;
      this._renderAuditIssueModalUpdate();
    }

    _renderAuditOverviewUpdate() {
      const current = this.shadowRoot?.querySelector("[data-audit-overview]");
      if (current) current.replaceWith(this._renderAuditOverview());
    }

    // A pergunta da aba, com o limite lido do dado. Escrever "5%" a mao criaria
    // uma segunda fonte da verdade: se o energy-model mudar a tolerancia, o
    // titulo passaria a mentir ate alguem lembrar de edita-lo.
    _auditOverviewTitle() {
      const base = `A divergência entre a Fatura (${this._distributorLabel()}) `
        + "e o Sensor (HA) ficou dentro do limite";
      const tolerancia = this._auditTolerancePercent();
      // Nada carregado ainda: melhor a pergunta sem o numero do que um numero
      // chutado. A secao inteira e redesenhada quando a auditoria chega.
      if (tolerancia === null) return `${base}?`;
      const numero = this._truncateDecimals(String(tolerancia), 1)
        .replace(/[.,]0$/, "")
        .replace(".", ",");
      return `${base} de ±${numero}%?`;
    }

    _auditTolerancePercent() {
      for (const data of this._auditCache.values()) {
        for (const entry of (Array.isArray(data?.entries) ? data.entries : [])) {
          if (Number.isFinite(entry?.tolerance_percent)) {
            return entry.tolerance_percent;
          }
        }
      }
      return null;
    }

    // A pergunta da aba: a fatura e o sensor batem dentro da tolerancia?
    // Uma linha por unidade, com o veredito na frente.
    _renderAuditOverview() {
      // A pergunta e os seletores ficam acima do cartao. A marca de atualizacao
      // sobe para o invólucro: e ela que _renderAuditOverviewUpdate troca, e o
      // titulo depende do dado — sem isso o ±5% nunca apareceria.
      const wrapper = this._element("div", "audit-overview-wrap");
      wrapper.dataset.auditOverview = "";
      const heading = this._element("div", "audit-overview-heading");
      heading.append(
        this._element("h3", "section-title", this._auditOverviewTitle()),
        this._renderAuditUnitControl(),
        this._renderAuditScopeControl(),
      );
      wrapper.append(heading);

      const section = this._element("section", "panel block audit-overview");

      const scroll = this._element("div", "audit-overview-scroll");
      const table = this._element("table", "audit-overview-table");
      // So a Unidade tem medida propria; as outras seis dividem o resto em
      // partes iguais no layout fixo. A largura vai por classe, e nao inline,
      // para a media query poder encolhe-la no tablet e no celular.
      const colgroup = this._element("colgroup", "");
      for (const classe of [
        "audit-col-unit", "", "", "", "", "audit-col-diff", "",
      ]) {
        colgroup.append(this._element("col", classe));
      }
      table.append(colgroup);
      const head = this._element("tr", "");
      for (const label of [
        "Unidade", "Ciclo", "Sentido (Fluxo)", `Fatura (${this._distributorLabel()})`, "Sensor (HA)",
        "Diferença", "Conferência",
      ]) {
        head.append(this._element("th", "", label));
      }
      const thead = this._element("thead", "");
      thead.append(head);
      table.append(thead);

      const body = this._element("tbody", "");
      const scope = this._auditScopeValue();
      const unitScope = this._auditUnitScope();
      const units = this._unitIds()
        .filter((unit) => unitScope === "all" || unit === unitScope);
      units.forEach((unit, unitIndex) => {
        // O bloco e montado inteiro antes de ir para a tabela: o rowspan da
        // primeira coluna precisa saber quantas linhas a unidade tem, e isso
        // so se sabe depois de percorrer todos os ciclos dela.
        const linhas = [];
        if (scope === "all") {
          const references = this._closedBillingReferences(unit);
          if (!references.length) {
            linhas.push(...this._renderAuditOverviewRows(unit, null));
          } else {
            references.forEach((reference, index) => {
              for (const row of this._renderAuditOverviewRows(unit, reference)) {
                // Zebra por ciclo, nao por linha: as duas grandezas do mesmo
                // mes recebem o mesmo fundo e passam a ler como um bloco.
                if (index % 2 === 1) row.classList.add("banded");
                linhas.push(row);
              }
            });
          }
        } else {
          // Ciclo unico: cada unidade e um grupo, entao a zebra alterna por
          // unidade — sem isso as quatro ficavam sem separacao nenhuma.
          for (const row of this._renderAuditOverviewRows(unit, scope)) {
            if (unitIndex % 2 === 1) row.classList.add("banded");
            linhas.push(row);
          }
        }
        if (!linhas.length) return;
        linhas[0].classList.add("unit-start");
        this._mergeAuditUnitColumn(linhas, unit);
        for (const row of linhas) body.append(row);
      });
      table.append(body);
      scroll.append(table);
      section.append(scroll, this._renderAuditSignLegend());
      wrapper.append(section);
      return wrapper;
    }

    // O sinal e a informacao mais facil de ler errado da tabela. Dito uma vez,
    // no rodape, com o percentual fechando na conta que o titulo anuncia.
    _renderAuditSignLegend() {
      const legend = this._element("p", "audit-overview-note");
      legend.append(
        this._element("strong", "audit-sign up", "+"),
        this._element("span", "", " a fatura registrou "),
        this._element("strong", "", "mais"),
        this._element("span", "", " energia que o medidor  ·  "),
        this._element("strong", "audit-sign down", "−"),
        this._element("span", "", " registrou "),
        this._element("strong", "", "menos"),
        this._element("span", "", "."),
      );
      return legend;
    }

    _auditUnitCell(label) {
      return this._element("td", "audit-unit-cell", label);
    }

    // A unidade vira uma celula so, alta como o bloco inteiro, com o nome
    // grudado no topo dela. Repetir o nome em cada linha era ruido; some-lo de
    // vez deixava voce sem referencia ao rolar. O sticky resolve os dois, e a
    // celula mesclada e o que da a ele a altura certa para soltar no fim.
    _mergeAuditUnitColumn(rows, unit) {
      const principal = rows[0].querySelector(".audit-unit-cell");
      if (!principal) return;
      principal.rowSpan = rows.length;
      const grudado = this._element("span", "audit-unit-sticky");
      grudado.append(
        this._element("span", "audit-unit-name", this._unitLabel(unit)),
      );
      const foto = this._auditUnitPhoto(unit, rows.length);
      if (foto) grudado.append(foto);
      principal.replaceChildren(grudado);
      for (const row of rows.slice(1)) {
        row.querySelector(".audit-unit-cell")?.remove();
      }
    }

    // A foto cresce com o bloco. A celula mesclada e alta na proporcao dos
    // ciclos que a unidade tem, entao uma miniatura de tamanho unico ou
    // desperdicaria o espaco das unidades longas ou estouraria o das curtas.
    // A imagem ja esta em memoria: _loadOverviewUnits busca as quatro no
    // arranque, nao so a selecionada — nao ha chamada nova ao backend.
    _auditUnitPhoto(unit, linhas) {
      const ALTURA_LINHA = 31;   // altura media de uma linha desta tabela
      const RESERVA_NOME = 26;   // o nome mais o respiro ate a foto
      const LARGURA_MAXIMA = 200; // coluna de 240 menos o respiro lateral
      const LARGURA_MINIMA = 76;  // bloco de um ciclo: identifica sem dominar
      const imagem = this._cache.get(this._key(unit))?.snapshot?.image;
      if (!imagem) return null;
      const disponivel = (linhas * ALTURA_LINHA) - RESERVA_NOME;
      // Abaixo do piso a foto nao encolhe mais e a linha e que cresce um pouco
      // para acomoda-la — preferivel a unidade ficar sem rosto no seletor de
      // ciclo unico, que e onde a comparacao entre as quatro mais importa.
      const largura = Math.max(
        LARGURA_MINIMA, Math.min(LARGURA_MAXIMA, Math.round((disponivel * 4) / 3)),
      );
      const wrap = this._element("div", "audit-unit-photo-wrap");
      // Proposta, nao decisao: a media query aperta esse valor nas telas em que
      // a coluna encolhe. Largura e altura saem daqui em vez de aspect-ratio,
      // que estava recortando diferente no iPhone e no tablet.
      wrap.style.setProperty("--audit-foto", `${largura}px`);
      const img = this._element("img", "audit-unit-photo");
      img.alt = this._unitLabel(unit);
      // Sem espaco reservado: se a imagem falhar, a coluna volta a ser so o
      // nome, em vez de guardar um retangulo vazio no meio da tabela.
      img.addEventListener("error", () => wrap.remove());
      img.src = imagem;
      wrap.append(img);
      return wrap;
    }

    _auditUnitScope() {
      const units = this._unitIds();
      return units.includes(this._auditUnit) ? this._auditUnit : "all";
    }

    _setAuditUnitScope(value) {
      this._auditUnit = value;
      // Escolher uma unidade tambem move o detalhe abaixo; "todas" preserva a
      // selecao que veio das outras abas.
      if (value !== "all") this._selectUnit(value);
      else this._render();
      this._loadAllAudits();
    }

    _renderAuditUnitControl() {
      const wrapper = this._element("div", "audit-scope");
      wrapper.append(this._element("span", "audit-scope-label", "Unidade"));
      const select = this._element("select", "audit-scope-select");
      select.dataset.action = "audit-unit";
      select.setAttribute("aria-label", "Unidade exibida na comparação");
      const current = this._auditUnitScope();
      const todas = this._element("option", "", "Todas as unidades");
      todas.value = "all";
      todas.selected = current === "all";
      select.append(todas);
      for (const unit of this._unitIds()) {
        const option = this._element("option", "", this._unitLabel(unit));
        option.value = unit;
        option.selected = unit === current;
        select.append(option);
      }
      wrapper.append(select);
      return wrapper;
    }

    _renderAuditScopeControl() {
      const wrapper = this._element("div", "audit-scope");
      wrapper.append(this._element("span", "audit-scope-label", "Ciclo"));
      const select = this._element("select", "audit-scope-select");
      select.dataset.action = "audit-scope";
      select.setAttribute("aria-label", "Ciclo exibido na comparação");
      const references = this._allClosedReferences();
      const current = this._auditScopeValue();
      const todos = this._element("option", "", "Todos os ciclos");
      todos.value = "all";
      todos.selected = current === "all";
      select.append(todos);
      for (const reference of references) {
        const option = this._element("option", "", reference);
        option.value = reference;
        option.selected = reference === current;
        select.append(option);
      }
      if (references.length === 0) select.disabled = true;
      wrapper.append(select);
      return wrapper;
    }

    // Consumo oficial daquele ciclo, e nao o da ultima fatura: sem isso a
    // unidade sem sensor repetia o mesmo numero em todas as linhas.
    _officialConsumption(unit, reference) {
      if (!reference) return null;
      const cycle = (this._cyclesCatalog(unit) ?? []).find((item) => (
        item?.status === "closed" && item?.billing_reference === reference
      ));
      // O contrato entrega { value, unit, classification } — nao um numero
      // solto. `classification` distingue o que veio da fatura do que falta.
      const official = cycle?.official_consumption;
      return official?.classification === "official"
        && Number.isFinite(official?.value)
        ? official.value
        : null;
    }

    // As entradas que dao para comparar, na ordem em que a tabela mostra.
    // Uma funcao so porque o indice dela e o que o modal usa para achar a
    // metrica clicada: filtrar ou ordenar diferente nos dois lugares abriria
    // a porta para o modal mostrar a metrica errada.
    _auditComparableEntries(data) {
      const ORDEM = ["export_energy", "import_energy"];
      return (Array.isArray(data?.entries) ? data.entries : [])
        .filter((entry) => (
          Number.isFinite(entry?.official_value)
          && Number.isFinite(entry?.measured_value)
        ))
        .map((entry, index) => ({ entry, index }))
        .sort((a, b) => {
          const posicao = (item) => {
            // metric vem qualificado pela unidade — "<unidade>.export_energy" —,
            // entao a comparacao e com o sufixo, nao com a string inteira.
            const sufixo = String(item.entry?.metric ?? "").split(".").pop();
            const rank = ORDEM.indexOf(sufixo);
            return rank === -1 ? ORDEM.length : rank;
          };
          // Empate mantem a ordem que veio do backend.
          return posicao(a) - posicao(b) || a.index - b.index;
        })
        .map((item) => item.entry);
    }

    // A referencia com o periodo embaixo. Ciclo nao e mes: sem as datas, ABR
    // ficaria lido como 01/04 a 30/04, quando na verdade vai de 13/03 a 14/04.
    // E cada unidade fecha num dia diferente, entao o periodo e por unidade.
    _auditCycleCell(unit, reference) {
      const cell = this._element("td", "audit-cycle-cell");
      if (!reference) {
        cell.textContent = "—";
        return cell;
      }
      cell.append(this._element("span", "audit-cycle-reference", reference));
      const periodo = this._auditCyclePeriod(unit, reference);
      if (periodo) {
        cell.append(this._element("span", "audit-cycle-period", ` · ${periodo}`));
      }
      return cell;
    }

    _auditCyclePeriod(unit, reference) {
      const cycle = (this._cyclesCatalog(unit) ?? []).find((item) => (
        item?.status === "closed" && item?.billing_reference === reference
      ));
      const start = cycle?.period?.start;
      const end = cycle?.period?.end;
      if (!start || !end) return null;
      return `${this._formatHistoryCycleDay(start)} a `
        + `${this._formatHistoryCycleDay(end)}`;
    }

    // As beneficiarias medem consumption_energy, mas o alvo oficial delas e o
    // mesmo meter_active_kwh que a geradora audita como import_energy: e a mesma
    // leitura, do mesmo campo da fatura. Chamar de dois nomes so atrapalhava
    // comparar as unidades entre si.
    // A auditoria existe para bater com um papel: arredondar aqui criaria um
    // digito que nenhum medidor leu, e para cima, ainda por cima. Corta em duas
    // casas e formata o que sobrou. Passa por toFixed antes porque numero
    // pequeno vira notacao exponencial em String(), que o corte nao entende.
    _auditTruncate(value, casas = 2) {
      if (!Number.isFinite(Number(value))) return null;
      const cortado = Number(this._truncateDecimals(Number(value).toFixed(8), casas));
      // Number("-0.00") e -0, que o Intl imprime com o menos na frente.
      return cortado === 0 ? 0 : cortado;
    }

    _auditValue(value, unit, minimoDecimais = 2) {
      const cortado = this._auditTruncate(value);
      if (cortado === null) return "Indisponível";
      const rotulo = unit ?? "kWh";
      const numero = this._formatNumber(cortado, 2, minimoDecimais);
      return rotulo ? `${numero} ${rotulo}` : numero;
    }

    // A diferenca em kWh vem na frente do percentual. Sozinho, o percentual
    // nao diz se 5% sao dois quilowatts-hora ou duzentos — e e o kWh que se
    // confere contra o papel da fatura.
    _auditDifferenceCell(entry, dentro) {
      const td = this._element("td", `num audit-diff-cell${dentro ? "" : " paid"}`);
      // Os dois numeros saem dos valores ja cortados das colunas ao lado, e nao
      // do desvio cru do backend. Sem isso a linha nao fecha na mao: com sensor
      // 277,325 a tela mostrava 285,00 − 277,32 = 7,67, porque o desvio vinha
      // do valor cheio (7,675) enquanto a coluna ao lado ja tinha perdido a
      // terceira casa. Numa tabela feita para conferir contra a fatura, o que
      // esta escrito precisa somar.
      const oficial = this._auditTruncate(entry.official_value);
      const medido = this._auditTruncate(entry.measured_value);
      const absoluto = oficial === null || medido === null
        ? null
        : this._auditTruncate(oficial - medido);
      const percentual = absoluto === null || medido === null || medido === 0
        ? null
        : this._auditTruncate((absoluto / medido) * 100);
      if (absoluto === null && percentual === null) {
        td.textContent = "—";
        return td;
      }
      // O sinal so aparece quando sobrevive ao corte. Com uma casa, -0,034%
      // virava "-0,0%": um menos na frente de zero, que parecia defeito de
      // conta. Duas casas mostram o -0,03% que de fato existe, e um valor que
      // zera de vez nao ganha sentido nenhum.
      const comSinal = (valor, sufixo) => (
        `${valor > 0 ? "+" : ""}${this._formatNumber(valor, 2, 2)}${sufixo}`
      );
      td.append(
        this._element(
          "span", "audit-diff-energy",
          absoluto === null ? "—" : comSinal(absoluto, ` ${entry.unit ?? "kWh"}`),
        ),
        this._element(
          "small", "audit-diff-percent",
          percentual === null ? "—" : comSinal(percentual, "%"),
        ),
      );
      return td;
    }

    _auditMetricLabel(entry) {
      const sufixo = String(entry?.metric ?? "").split(".").pop();
      if (sufixo === "consumption_energy") return "Importação";
      return entry?.label ?? entry?.metric ?? "—";
    }

    // Uma linha por grandeza auditada. A geradora tem importacao E exportacao;
    // resumir na de maior desvio, como fazia antes, escondia a outra metade.
    _renderAuditOverviewRows(unit, reference = this._latestClosedReference(unit)) {
      const key = reference ? this._auditKey(unit, reference) : null;
      const data = key ? this._auditCache.get(key) : null;
      const error = key ? this._auditErrors.get(key) : null;
      const loading = key ? this._auditInFlight.has(key) : false;
      const semCiclo = !reference
        || !this._closedBillingReferences(unit).includes(reference);

      const cell = (text, cls = "") => this._element("td", cls, text);
      const linha = (celulas, cls = "") => {
        const row = this._element("tr", cls);
        for (const item of celulas) row.append(item);
        return row;
      };
      const cabeca = () => [
        this._auditUnitCell(this._unitLabel(unit)),
        this._auditCycleCell(unit, reference),
      ];
      const unica = (texto, titulo = null, extraLinha = "") => [linha([
        ...cabeca(),
        cell("—", "audit-metric-cell"),
        cell("—", "num"), cell("—", "num"), cell("—", "num"),
        this._auditNeutralVerdictCell(texto, titulo),
      ], extraLinha)];

      // Sem sensor nao ha comparacao, mas o lado da fatura existe e vale
      // mostrar: e o unico numero que essa unidade tem.
      if (!this._unitIsMeasured(unit)) {
        return [linha([
          ...cabeca(),
          cell("Importação", "audit-metric-cell"),
          cell(this._valueWithUnit(
            this._officialConsumption(unit, reference), "kWh"), "num"),
          cell("sem sensor", "num"),
          cell("—", "num"),
          this._auditNeutralVerdictCell(
            "Só fatura", "Unidade sem medidor: existe o lado da fatura, não o medido",
          ),
        ], "muted")];
      }
      if (semCiclo) return unica("Sem ciclo", "Nenhum ciclo fechado nesta referência", "muted");
      // O motivo do backend nao cabe na coluna, mas nao se perde: vai no title.
      if (!data) {
        return loading
          ? unica("Carregando", "Consultando a auditoria deste ciclo")
          : unica("Sem dados", error ?? "Auditoria não disponível para este ciclo");
      }

      const entries = this._auditComparableEntries(data);
      if (!entries.length) {
        return unica("Sem dados", "Nenhuma grandeza com medido e faturado no mesmo ciclo");
      }

      const rows = [];
      entries.forEach((entry, index) => {
        const dentro = entry.within_tolerance !== false;
        const tolerancia = this._truncateDecimals(
          String(entry.tolerance_percent ?? 5), 1,
        ).replace(".", ",");
        // Só a primeira grandeza repete o ciclo: as demais sao o mesmo ciclo
        // visto por outro medidor.
        const primeira = index === 0;
        rows.push(linha([
          this._auditUnitCell(this._unitLabel(unit)),
          primeira
            ? this._auditCycleCell(unit, reference)
            : cell("", "audit-cycle-cell"),
          cell(this._auditMetricLabel(entry), "audit-metric-cell"),
          // A fatura nao pede casa decimal: a Equatorial cobra em kWh inteiro
          // quase sempre. Mas o minimo e zero, nao o maximo — as poucas
          // leituras que vem com fracao (95,13) continuam aparecendo inteiras.
          cell(this._auditValue(entry.official_value, entry.unit, 0), "num"),
          cell(this._auditValue(entry.measured_value, entry.unit), "num"),
          this._auditDifferenceCell(entry, dentro),
          this._auditVerdictCell(entry, {
            dentro, tolerancia, unit, reference, index,
            timezone: data.period?.timezone,
          }),
        ], primeira ? "" : "metric-continued"));
      });
      this._mergeAuditCycleColumn(rows);
      return rows;
    }

    // O ciclo mescla dentro do proprio par. Com uma celula por linha o rotulo
    // ficava preso na primeira grandeza; mesclado, ele centraliza entre as duas
    // e o par passa a ler como um bloco unico tambem na coluna do ciclo.
    _mergeAuditCycleColumn(rows) {
      if (rows.length < 2) return;
      const principal = rows[0].querySelector(".audit-cycle-cell");
      if (!principal) return;
      principal.rowSpan = rows.length;
      for (const row of rows.slice(1)) {
        row.querySelector(".audit-cycle-cell")?.remove();
      }
    }

    // Estado sem veredito usa o mesmo chip, em cinza. Texto solto no meio de
    // pastilhas quebrava a coluna; o motivo detalhado fica no title.
    _auditNeutralVerdictCell(texto, titulo = null) {
      const cell = this._element("td", "verdict none");
      const inner = this._element("div", "verdict-inner");
      const chip = this._element("span", "audit-chip");
      chip.append(
        this._element("span", "audit-chip-dot"),
        this._element("span", "", texto),
      );
      if (titulo) chip.title = titulo;
      inner.append(chip, this._element("span", "audit-issue-slot"));
      cell.append(inner);
      return cell;
    }

    // A conferencia vira botao quando ha ocorrencia registrada. Ocorrencia nao e
    // o mesmo que estourar a tolerancia: um ciclo pode fechar dentro dos 5% e
    // ainda ter tido buraco na medicao — e e isso que o clique revela.
    _auditVerdictCell(entry, { dentro, tolerancia, unit, reference, index, timezone }) {
      const ocorrencias = Number(entry?.issue_count) || 0;
      const cell = this._element("td", `verdict ${dentro ? "in" : "out"}`);
      const inner = this._element("div", "verdict-inner");
      cell.append(inner);
      const chip = this._element("span", "audit-chip");
      chip.append(
        this._element("span", "audit-chip-dot"),
        this._element("span", "", dentro ? "Dentro" : "Fora"),
      );
      // O numero da tolerancia sai da linha mas nao do painel: repetido em vinte
      // linhas era o maior ruido da tabela, e no titulo continua conferivel.
      chip.title = `${dentro ? "Dentro" : "Fora"} da tolerância de ${tolerancia}%`;
      inner.append(chip);
      // O lugar do badge existe mesmo vazio: sem isso o chip andava para a
      // direita nas linhas sem ocorrencia e a coluna inteira ficava serrilhada.
      if (!ocorrencias) {
        inner.append(this._element("span", "audit-issue-slot"));
        return cell;
      }

      const button = this._button("", "audit-issue-open", "audit-issue-button");
      button.dataset.unit = unit;
      button.dataset.reference = reference ?? "";
      button.dataset.index = String(index);
      button.setAttribute("aria-haspopup", "dialog");
      const rotulo = `${ocorrencias} ${ocorrencias === 1 ? "ocorrência" : "ocorrências"}`;
      button.title = rotulo;
      button.setAttribute("aria-label", rotulo);
      const glyph = this._element("ha-icon", "audit-issue-glyph");
      glyph.setAttribute("icon", "mdi:alert-circle-outline");
      button.append(glyph, this._element("span", "audit-issue-count", String(ocorrencias)));
      inner.append(button);
      return cell;
    }

    // O modal e a janela de investigacao: motivo, quando, de onde, e o atalho
    // para ver o dia no grafico. Centralizado, para nao recortar no celular.
    _renderAuditIssueModal() {
      const alvo = this._auditIssueModal;
      if (!alvo) return null;
      const data = this._auditCache.get(this._auditKey(alvo.unit, alvo.reference));
      const entry = this._auditComparableEntries(data)[alvo.index];
      if (!entry) return null;

      const overlay = this._element("div", "audit-modal-overlay");
      // O despacho global so olha <button>; o clique no fundo precisa do proprio
      // ouvinte, e so fecha quando o alvo e o fundo, nao o conteudo.
      overlay.addEventListener("click", (event) => {
        if (event.target !== overlay) return;
        this._closeAuditModal();
      });
      const dialog = this._element("div", "audit-modal");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Ocorrências da medição");

      const head = this._element("div", "audit-modal-head");
      head.append(
        this._element("div", "audit-modal-title",
          `${this._unitLabel(alvo.unit)} · ${alvo.reference} · `
          + `${entry.label ?? entry.metric ?? ""}`),
        this._button("✕", "audit-issue-close", "audit-modal-close"),
      );
      dialog.append(head);

      const timezone = data?.period?.timezone;
      const body = this._element("div", "audit-modal-body");
      const events = Array.isArray(entry.issue_events) ? entry.issue_events : [];
      const groups = events.length ? this._groupAuditIssueEvents(events) : [];
      if (!groups.length) {
        body.append(this._renderAuditIssueList(entry, timezone));
        dialog.append(body);
        overlay.append(dialog);
        return overlay;
      }

      // Motivo e fonte costumam ser os mesmos em todas as ocorrencias. Subir o
      // que e comum para o topo deixa na lista so o que de fato varia: quando.
      const motivo = this._uniformIssueValue(
        groups, (group) => this._auditIssueCategory(group.reason));
      const fonte = this._uniformIssueValue(groups, (group) => group.source_entity_id);
      const contexto = this._element("div", "audit-modal-context");
      if (motivo !== null) {
        contexto.append(this._element("strong", "audit-modal-reason", motivo));
      }
      if (fonte !== null) {
        contexto.append(this._element(
          "small", "audit-event-source",
          this._formatAuditIssueSource(groups[0].source_label, fonte),
        ));
      }
      if (contexto.childElementCount) body.append(contexto);

      const list = this._element("div", "audit-modal-list");
      let atravessaDia = false;
      for (const group of groups) {
        const row = this._element("div", "audit-modal-row");
        // Tres trilhos fixos: quando · quantos · atalho. O que e opcional entra
        // no primeiro trilho, para o botao nunca cair para a linha de baixo.
        const main = this._element("div", "audit-modal-main");
        // O motivo so aparece na linha quando nao pode ser subido para o topo.
        if (motivo === null) {
          main.append(this._element(
            "strong", "audit-modal-reason",
            this._auditIssueCategory(group.reason),
          ));
        }
        main.append(this._element("span", "audit-modal-when",
          this._formatAuditIssueInterval(group.start, group.end, timezone)));
        if (fonte === null) {
          main.append(this._element(
            "small", "audit-event-source",
            this._formatAuditIssueSource(group.source_label, group.source_entity_id),
          ));
        }
        row.append(
          main,
          this._element("small", "audit-modal-count",
            `${group.count} ${group.count === 1 ? "intervalo" : "intervalos"}`),
        );
        const destino = this._auditIssueChartTarget(group, alvo, timezone);
        if (destino) {
          const button = this._button(destino.label, "audit-issue-goto", "audit-modal-goto");
          button.dataset.unit = alvo.unit;
          // A janela desta linha viaja no botao: e ela que o grafico pinta.
          button.dataset.start = group.start ?? "";
          button.dataset.end = group.end ?? "";
          if (destino.cycle) button.dataset.cycle = destino.cycle;
          else button.dataset.day = destino.day;
          row.append(button);
          if (destino.parcial) atravessaDia = true;
        }
        list.append(row);
      }
      body.append(list);
      // So para as que abrem no dia sem caber nele. As que abrem o ciclo
      // mostram a janela inteira, e avisar ali seria falso.
      if (atravessaDia) {
        body.append(this._element("small", "audit-modal-note",
          "\"Ver o dia\" abre o primeiro dia da ocorrência."));
      }
      dialog.append(body);
      overlay.append(dialog);
      return overlay;
    }

    // Devolve o valor quando ele e o mesmo em todos os grupos; null se varia.
    _uniformIssueValue(groups, pick) {
      const first = pick(groups[0]);
      if (first === undefined || first === null || first === "") return null;
      return groups.every((group) => pick(group) === first) ? first : null;
    }

    // Ocorrencia que cabe num dia abre no dia; a que atravessa a virada abre o
    // ciclo, porque o recorte de um dia mostraria so um pedaco dela. Sem ciclo
    // mapeado, cai no dia — recorte parcial vale mais que nenhum atalho.
    _auditIssueChartTarget(group, alvo, timezone) {
      const inicio = this._auditIssueDay(group.start, timezone);
      if (!inicio) return null;
      const dias = this._auditIssueDaySpan(group, timezone);
      if (dias > 1) {
        const ciclo = this._auditIssueCycle(alvo.unit, alvo.reference);
        if (ciclo) return { label: "Ver o ciclo", cycle: ciclo.cycle_id, parcial: false };
      }
      return { label: "Ver o dia", day: inicio, parcial: dias > 1 };
    }

    // Quantos dias civis o intervalo toca, das duas pontas cruas. O `end` vem
    // exclusivo do backend, entao uma ocorrencia que fecha a meia-noite cabe no
    // dia anterior; ainda assim contamos o dia do `end`, para que o limiar
    // bata com as datas que a propria linha mostra.
    _auditIssueDaySpan(group, timezone) {
      const inicio = this._auditIssueDay(group.start, timezone);
      const fim = this._auditIssueDay(group.end, timezone);
      if (!inicio || !fim || fim <= inicio) return 1;
      const passo = Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`);
      return Number.isFinite(passo) ? Math.round(passo / 86400000) + 1 : 1;
    }

    // O ciclo do historico que corresponde a referencia auditada.
    _auditIssueCycle(unit, reference) {
      if (!unit || !reference) return null;
      return this._selectableHistoryCycles(unit).find((cycle) => (
        cycle?.billing_reference === reference
      )) ?? null;
    }

    // Data local do evento no formato que o seletor de dia do historico usa.
    _auditIssueDay(value, timezone) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return null;
      const options = typeof timezone === "string" && timezone
        ? { timeZone: timezone } : {};
      const parts = new Intl.DateTimeFormat("en-CA", {
        ...options, year: "numeric", month: "2-digit", day: "2-digit",
      }).format(date);
      return /^\d{4}-\d{2}-\d{2}$/.test(parts) ? parts : null;
    }


    // O grafico da ocorrencia abre sobre a propria auditoria. Nada do estado do
    // painel de historico e tocado: unidade, modo e referencia vivem so aqui,
    // senao fechar o modal deixaria a aba Unidades noutro dia sem aviso.
    _openAuditChart(dataset) {
      const unit = dataset?.unit;
      const mode = dataset?.cycle ? "cycle" : "day";
      const reference = dataset?.cycle || dataset?.day;
      if (!unit || !reference) return;
      const resolution = HISTORY_MODES[mode].resolution;
      this._auditChartModal = {
        unit,
        mode,
        reference,
        resolution,
        key: this._historyKey(unit, mode, reference, resolution),
        // So a janela da linha clicada: e ela que o markArea pinta.
        events: dataset.start && dataset.end
          ? [{ start: dataset.start, end: dataset.end }]
          : [],
      };
      this._renderAuditIssueModalUpdate();
      this._loadAuditChartHistory(this._auditChartModal);
    }

    // Busca so o recorte que o modal precisa, dividindo cache, erros e fila com
    // o painel: se aquele dia ja foi baixado la, o modal abre instantaneo. A
    // auditoria olha ciclo fechado, dado que nao muda mais, entao qualquer
    // entrada em cache serve e nao ha TTL a respeitar aqui.
    async _loadAuditChartHistory(target) {
      const { unit, mode, reference, resolution, key } = target;
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (this._historyCache.has(key)) return this._historyData(key);
      if (this._historyInFlight.has(key)) return this._historyInFlight.get(key);

      const configGeneration = this._configGeneration;
      this._historyErrors.delete(key);
      const request = this._hass.callWS({
        type: HISTORY_COMMAND,
        unit_id: unit,
        mode,
        reference,
        resolution,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato histórico incompatível com esta versão do card.");
        }
        if (!response.data || typeof response.data !== "object") {
          throw new Error("Resposta de histórico inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        this._historyCache.set(key, { data: response.data, cachedAt: Date.now() });
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        // "Indisponivel" nao e falha de rede: e a resposta de que nao existe
        // serie para o recorte. Guardar como dado evita rebuscar em looping.
        const code = error?.code ?? error?.error?.code;
        if (code === "history_unavailable") {
          this._historyCache.set(key, {
            data: { available: false, mode, series: [] },
            cachedAt: Date.now(),
          });
        } else {
          this._historyErrors.set(key, this._historyErrorMessage(error));
        }
        return null;
      }).finally(() => {
        if (this._historyInFlight.get(key) === request) {
          this._historyInFlight.delete(key);
        }
        if (this._auditChartModal?.key === key) this._renderAuditIssueModalUpdate();
      });

      this._historyInFlight.set(key, request);
      return request;
    }

    _renderAuditChartModal() {
      const alvo = this._auditChartModal;
      if (!alvo) return null;
      const overlay = this._element("div", "audit-modal-overlay");
      overlay.addEventListener("click", (event) => {
        if (event.target !== overlay) return;
        this._closeAuditModal();
      });
      const dialog = this._element("div", "audit-modal audit-modal-wide");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Gráfico da ocorrência");

      // Um overlay so. O detalhe da ocorrencia continua vivo por tras e a seta
      // e o caminho de volta; empilhar dois modais tornaria o clique no fundo
      // ambiguo — nao daria para saber qual dos dois ele fecha.
      const head = this._element("div", "audit-modal-head");
      const voltar = this._button(
        "‹", "audit-chart-back", "audit-modal-close audit-modal-back",
      );
      voltar.setAttribute("aria-label", "Voltar às ocorrências");
      head.append(
        voltar,
        this._element("div", "audit-modal-title", this._auditChartTitle(alvo)),
        this._button("✕", "audit-issue-close", "audit-modal-close"),
      );
      dialog.append(head);

      const body = this._element("div", "audit-modal-body");
      body.append(this._renderAuditChartContent(alvo));
      dialog.append(body);
      overlay.append(dialog);
      return overlay;
    }

    _auditChartTitle(alvo) {
      const partes = [this._unitLabel(alvo.unit)];
      // Dia com ano: o modal pode ficar aberto sobre um ciclo antigo, e "17/04"
      // sozinho nao diz de qual.
      const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(alvo.reference ?? "");
      partes.push(alvo.mode === "cycle"
        ? `Ciclo ${this._auditIssueModal?.reference ?? alvo.reference}`
        : dia ? `${dia[3]}/${dia[2]}/${dia[1]}` : alvo.reference);
      const origem = this._auditIssueModal;
      if (origem) {
        const dados = this._auditCache.get(this._auditKey(origem.unit, origem.reference));
        const entry = this._auditComparableEntries(dados)[origem.index];
        const rotulo = entry ? this._auditMetricLabel(entry) : "";
        if (rotulo) partes.push(rotulo);
      }
      return partes.join(" · ");
    }

    _renderAuditChartContent(alvo) {
      const data = this._historyData(alvo.key);
      const loading = this._historyInFlight.has(alvo.key);
      const error = this._historyErrors.get(alvo.key);
      if (!data) {
        if (error && !loading) return this._historyStatus(error);
        return this._historyStatus("Carregando histórico…", "loading");
      }
      if (
        data.available === false
        || !Array.isArray(data.series)
        || data.series.length === 0
        || !this._historyHasNumericData(data)
      ) {
        return this._historyStatus("Sem dados registrados para este recorte.");
      }
      if (this._chartModuleError) return this._historyStatus(this._chartModuleError);

      const frame = this._element("div", "history-chart-frame audit-chart-frame");
      const chart = this._element("div", "history-chart");
      chart.dataset.auditChart = "";
      chart.setAttribute("role", "img");
      chart.setAttribute(
        "aria-label",
        `Histórico de ${this._unitLabel(alvo.unit)} com a ocorrência destacada`,
      );
      frame.append(chart);
      return frame;
    }

    async _renderAuditChart() {
      const alvo = this._auditChartModal;
      if (!alvo) return;
      const data = this._historyData(alvo.key);
      const element = this.shadowRoot?.querySelector("[data-audit-chart]");
      if (
        !element
        || !data
        || data.available === false
        || !Array.isArray(data.series)
        || data.series.length === 0
      ) {
        return;
      }
      try {
        const chartModule = await this._loadChartModule();
        if (
          !element.isConnected
          || this._auditChartModal?.key !== alvo.key
          || element !== this.shadowRoot.querySelector("[data-audit-chart]")
        ) {
          return;
        }
        this._cleanupAuditChart();
        this._auditChart = chartModule.initChart(
          element,
          // O destaque viaja por argumento: o do painel se apoia na unidade
          // selecionada, que aqui deliberadamente continua sendo outra.
          this._historyChartOptions(
            data,
            { unit: alvo.unit, events: alvo.events },
            this._auditChartLegend(data),
          ),
        );
        if (typeof ResizeObserver !== "undefined") {
          this._auditChartResizeObserver = new ResizeObserver(() => {
            if (this._auditChart === null) return;
            chartModule.resizeChart(this._auditChart);
          });
          this._auditChartResizeObserver.observe(element);
        }
      } catch {
        /* o modal continua util sem o grafico */
      }
    }

    _cleanupAuditChart() {
      this._auditChartResizeObserver?.disconnect();
      this._auditChartResizeObserver = null;
      if (this._auditChart && this._chartModule) {
        this._chartModule.disposeChart(this._auditChart);
      }
      this._auditChart = null;
    }

    _renderAuditUpdate() {
      const current = this.shadowRoot.querySelector("[data-audit-result]");
      if (!current) return;
      const overview = this._displayData();
      current.replaceWith(this._renderAuditResult(overview?.quality_evidence));
    }

    _scheduleAuditLoading() {
      queueMicrotask(async () => {
        if (!this.isConnected) return;
        if (!Array.isArray(this._cyclesCatalog())) {
          await this._loadCyclesCatalog({ allowOutsideCycle: true });
        }
        if (!this.isConnected) return;
        const reference = this._reconcileBillingReference();
        if (!reference) {
          this._renderAuditUpdate();
          return;
        }
        const key = this._auditKey();
        if (!this._auditCache.has(key) && !this._auditInFlight.has(key)) {
          this._loadAudit();
        }
      });
    }

    _auditErrorMessage(error) {
      const translations = new Map([
        ["audit_invalid_reference", "Auditoria indisponível para esta referência."],
        ["audit_unavailable", "Dados insuficientes para realizar a auditoria."],
        ["runtime_unavailable", "Serviço de energia temporariamente indisponível."],
      ]);
      const code = error?.code ?? error?.error?.code;
      return translations.get(code) ?? "Não foi possível carregar a auditoria.";
    }

    _resetDistributionInteraction() {
      this._distributionMode = "idle";
      this._distributionDraft = null;
      this._distributionConfirmation = null;
      this._distributionMutationState = "idle";
      this._distributionMutationMessage = "";
    }

    // Quem gera nesta instalacao, segundo o modelo, ou `null` quando ninguem
    // gera. Nao ha palpite: o nome de uma unidade desta casa como padrao fazia
    // uma instalacao sem geracao — que e o caso mais comum — pedir dados de
    // uma unidade inexistente, e receber erro em vez de uma tela honesta.
    get _generator() {
      return this._generatorUnit;
    }

    // A unidade que a Visao geral toma como referencia de ciclo. E a geradora
    // quando existe — e o ciclo dela que organiza a pagina —, e a unidade
    // aberta quando ninguem gera. Sem isto, a Visao geral de uma instalacao
    // sem geracao ficava sem seletor de referencia nenhum.
    _referenceUnit() {
      return this._generator ?? this._selectedUnit;
    }

    // Se esta instalacao gera energia. Enquanto o catalogo nao chegou a
    // resposta e "ainda nao sei", e nao "nao gera": esconder tudo nesse
    // intervalo faria as secoes piscarem na abertura.
    // Instalacao que ainda nao tem unidade nenhuma. Enquanto o catalogo nao
    // chegou a resposta e "ainda nao sei", e nao "esta vazia": dizer que esta
    // vazia na abertura faria a tela de boas-vindas piscar em toda instalacao
    // ja configurada.
    get _isEmptyInstallation() {
      return Array.isArray(this._unitCatalog) && this._unitCatalog.length === 0;
    }

    // Nada para mostrar: nenhuma unidade, ou unidades sem sensor e sem fatura.
    // O assistente da integracao obriga a criar uma unidade, entao a
    // instalacao nunca fica "vazia" — e quem desmarcava "tem medidor" e
    // concluia caia em oito abas sem dado nenhum, sem saber o que faltava.
    // Com um sensor OU uma fatura, as abas aparecem sozinhas.
    get _setupIncomplete() {
      if (this._isEmptyInstallation) return true;
      if (!Array.isArray(this._unitCatalog) || !this._unitCapabilities) return false;
      const podem = this._capabilities;
      return !podem.measurement && !podem.instant_readings && !podem.billing;
    }

    // Enquanto o catalogo nao chegou, "nao sei" nao e "tem unidades". As oito
    // abas apareciam, a pessoa clicava numa delas, e so entao o aviso de ir
    // para a Configuracao surgia por cima — atraso que parecia falha. Sem
    // catalogo, a tela mostra o que ja e certo e espera o resto.
    // O que esta instalacao e capaz de mostrar, dito pelo backend. Enquanto
    // o catalogo nao chega, tudo e falso: "nao sei" nao pode virar promessa.
    //
    // A tela NAO deduz capacidade a partir de dado. Deduzir foi o que fez o
    // payback aparecer numa casa sem placa: ter fatura nao inventa geracao.
    get _capabilities() {
      const bruto = this._unitCapabilities;
      const vazio = {
        units: false, generation: false, distribution: false,
        measurement: false, instant_readings: false,
        billing: false, investment: false,
      };
      if (!bruto || typeof bruto !== "object") return vazio;
      const resultado = { ...vazio };
      for (const chave of Object.keys(vazio)) {
        resultado[chave] = bruto[chave] === true;
      }
      return resultado;
    }

    get _catalogPending() {
      return !Array.isArray(this._unitCatalog);
    }

    // Os nomes do que a unidade mede, sem repetir e comecando com maiuscula.
    // O backend rotula em minuscula porque os rotulos tambem aparecem no meio
    // de frases; aqui eles abrem um item de lista, e "tensão, corrente" lido
    // depois do nome da unidade parece continuacao da frase anterior.
    _unitMeasuredNames(unidade) {
      const rotulos = [];
      for (const grupo of [unidade?.metrics, unidade?.readings]) {
        if (!Array.isArray(grupo)) continue;
        for (const item of grupo) {
          const bruto = typeof item?.label === "string" ? item.label.trim() : "";
          if (!bruto) continue;
          const nome = bruto.charAt(0).toUpperCase() + bruto.slice(1);
          if (!rotulos.includes(nome)) rotulos.push(nome);
        }
      }
      return rotulos;
    }

    // Mantido para quem ainda o consulta, agora apoiado na capacidade em vez
    // de deduzir. A versao antiga devolvia VERDADEIRO enquanto o catalogo nao
    // chegava — "nao sei" virava "tem" —, e o fluxo energetico tentava
    // carregar antes de existir geracao, falhando com "nao foi possivel
    // carregar o fluxo desta referencia".
    get _hasGeneration() {
      return this._capabilities.generation;
    }

    // Quais unidades existem, segundo o modelo. A lista escrita na
    // configuracao do cartao so vale enquanto o catalogo nao chegou: uma
    // unidade criada pela tela precisa aparecer sem que ninguem edite o YAML
    // do painel — que e justamente o YAML que este trabalho quer eliminar.
    _unitIds() {
      return this._units().map((unidade) => unidade.id);
    }

    _units() {
      if (Array.isArray(this._unitCatalog) && this._unitCatalog.length > 0) {
        return this._unitCatalog;
      }
      return (this._config?.units ?? []).map((id) => ({ id, label: id }));
    }

    async _loadUnitCatalog({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && this._unitCatalog) return this._unitCatalog;
      if (this._unitCatalogRequest) return this._unitCatalogRequest;

      const requestHass = this._hass;
      const request = (async () => {
        try {
          const response = await requestHass.callWS({ type: UNITS_COMMAND });
          // Lista VAZIA e resposta valida, nao contrato quebrado: e o que
          // toda instalacao nova devolve. Recusa-la aqui deixava o catalogo
          // em null, e `_isEmptyInstallation` — que exige um array vazio —
          // nunca era verdadeiro. Todo o mecanismo de primeira instalacao
          // existia e nunca disparava: a tela de boas-vindas nao aparecia, as
          // abas sem conteudo continuavam clicaveis, e quem instalou caia
          // numa Visao geral vazia sem saber por onde comecar.
          if (
            !response
            || response.api_version !== API_VERSION
            || !Array.isArray(response.data?.units)
          ) {
            throw new Error("Contrato do catálogo de unidades incompatível.");
          }
          const units = response.data.units.map((item) => {
            if (
              typeof item?.unit_id !== "string" || !item.unit_id.trim()
              || typeof item.name !== "string" || !item.name.trim()
            ) {
              throw new Error("Catálogo de unidades inválido.");
            }
            return Object.freeze({
              id: item.unit_id,
              label: item.name,
              role: item.role ?? null,
              color: typeof item.color === "string" ? item.color : null,
            });
          });
          this._unitCatalog = Object.freeze(units);
          // Um cartao adicionado sem lista de unidades nasce sem nenhuma
          // selecionada. O catalogo e quem sabe quais existem, entao e aqui
          // que a primeira escolha acontece — depois disso o operador manda.
          // A selecionada tambem pode ter sido excluida na pagina da
          // integracao: ficar com ela era pedir dados de quem nao existe.
          if (units.length > 0 && !units.some((u) => u.id === this._selectedUnit)) {
            this._selectedUnit = units[0].id;
          }
          // Quem gera vem dito pelo backend. Um catalogo sem geradora deixa o
          // campo nulo, e o card esconde o que depende dela em vez de pedir a
          // unidade errada.
          const gerador = response.data.generator_unit_id;
          this._generatorUnit = typeof gerador === "string" && gerador.trim()
            ? gerador
            : null;
          // O que esta instalacao e capaz de mostrar. Vem do backend porque a
          // regra e de dominio — "rateio precisa de mais de uma unidade" nao
          // e decisao de tela —, e chega junto com o catalogo porque as duas
          // respostas decidem a mesma coisa: o que desenhar.
          this._unitCapabilities = response.data.capabilities ?? null;
          const distribuidora = response.data.distributor;
          this._distributorName = typeof distribuidora === "string" && distribuidora.trim()
            ? distribuidora.trim()
            : null;
          this._render();
          // As cargas pedidas ao abrir a pagina desistem enquanto a unidade
          // nao esta na lista — e a lista e este catalogo. Ao recarregar a
          // pagina ele chegava depois delas, ninguem pedia de novo, e a tela
          // ficava em "Aguardando dados da unidade" ate alguem apertar
          // atualizar. Pedir aqui e seguro: o que ja esta em cache ou em
          // curso nao se repete.
          this._loadSelected();
          this._loadOverviewUnits();
          this._ensureBillingOnlyMode(this._selectedUnit);
          return this._unitCatalog;
        } catch (error) {
          return null;
        } finally {
          this._unitCatalogRequest = null;
        }
      })();
      this._unitCatalogRequest = request;
      return request;
    }

    _distributionSharesFrom(rule) {
      return Object.fromEntries(this._units().map(({ id }) => [
        id,
        typeof rule?.shares?.[id] === "string" ? rule.shares[id] : "",
      ]));
    }

    _distributionDecimalUnits(value) {
      if (typeof value !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(value)) {
        return null;
      }
      const [whole, fraction = ""] = value.split(".");
      const units = (BigInt(whole) * 10000n) + BigInt(fraction.padEnd(4, "0"));
      return units <= 1000000n ? units : null;
    }

    _distributionDraftTotal(draft = this._distributionDraft) {
      if (!draft?.shares) return null;
      let total = 0n;
      for (const { id } of this._units()) {
        const units = this._distributionDecimalUnits(draft.shares[id]);
        if (units === null) return null;
        total += units;
      }
      return total;
    }

    _formatDistributionTotal(total) {
      if (typeof total !== "bigint") return "Inválido";
      const whole = total / 10000n;
      const fraction = String(total % 10000n).padStart(4, "0").replace(/0+$/, "");
      return `${whole}${fraction ? `,${fraction}` : ""}%`;
    }

    _distributionDraftIsValid(draft = this._distributionDraft) {
      return this._distributionDraftTotal(draft) === 1000000n;
    }

    _startDistributionMode(mode) {
      if (!this._distributionData || this._distributionMutationState === "saving"
        || this._distributionMutationState === "scheduling"
        || this._distributionMutationState === "cancelling") return;
      if (mode === "schedule" && this._distributionData.scheduled !== null) return;
      this._distributionMode = mode;
      this._distributionConfirmation = null;
      this._distributionMutationState = "idle";
      this._distributionMutationMessage = "";
      const now = new Date(Date.now() + 60 * 60 * 1000);
      const local = this._zonedDateTimeParts(now, this._distributionTimezone());
      this._distributionDraft = {
        shares: this._distributionSharesFrom(this._distributionData.current),
        label: "",
        date: local ? `${local.year}-${local.month}-${local.day}` : "",
        time: local ? `${local.hour}:${local.minute}` : "",
      };
      this._renderDistributionUpdate();
    }

    // O fuso em que a linha do tempo do rateio foi escrita. Na falta dela, o
    // do proprio Home Assistant — nunca um fixo: aqui havia o da instalacao
    // de quem desenvolveu, e uma casa em Manaus veria as datas de vigencia
    // deslocadas em uma hora sem nada explicar.
    _distributionTimezone() {
      if (typeof this._distributionData?.timezone === "string") {
        return this._distributionData.timezone;
      }
      const daCasa = this._hass?.config?.time_zone;
      if (typeof daCasa === "string" && daCasa.trim()) return daCasa;
      // Ultimo recurso: o do navegador de quem esta olhando.
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }

    _zonedDateTimeParts(date, timeZone) {
      try {
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hourCycle: "h23",
        }).formatToParts(date);
        return Object.fromEntries(parts.filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value]));
      } catch {
        return null;
      }
    }

    _timeZoneOffsetMilliseconds(epoch, timeZone) {
      const parts = this._zonedDateTimeParts(new Date(epoch), timeZone);
      if (!parts) return null;
      const representedAsUtc = Date.UTC(
        Number(parts.year), Number(parts.month) - 1, Number(parts.day),
        Number(parts.hour), Number(parts.minute), Number(parts.second),
      );
      return representedAsUtc - (Math.floor(epoch / 1000) * 1000);
    }

    _distributionEffectiveFrom(draft = this._distributionDraft) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(draft?.date ?? "")
        || !/^\d{2}:\d{2}$/.test(draft?.time ?? "")) return null;
      const [year, month, day] = draft.date.split("-").map((value) => Number(value));
      const [hour, minute] = draft.time.split(":").map((value) => Number(value));
      const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
      const timeZone = this._distributionTimezone();
      let offset = this._timeZoneOffsetMilliseconds(desiredAsUtc, timeZone);
      if (offset === null) return null;
      let epoch = desiredAsUtc - offset;
      offset = this._timeZoneOffsetMilliseconds(epoch, timeZone);
      if (offset === null) return null;
      epoch = desiredAsUtc - offset;
      const check = this._zonedDateTimeParts(new Date(epoch), timeZone);
      if (!check || `${check.year}-${check.month}-${check.day}` !== draft.date
        || `${check.hour}:${check.minute}` !== draft.time) return null;
      const sign = offset < 0 ? "-" : "+";
      const absoluteMinutes = Math.abs(offset) / 60000;
      const offsetHours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
      const offsetMinutes = String(absoluteMinutes % 60).padStart(2, "0");
      return `${draft.date}T${draft.time}:00${sign}${offsetHours}:${offsetMinutes}`;
    }

    _distributionScheduleIsValid() {
      const effectiveFrom = this._distributionEffectiveFrom();
      return this._distributionDraftIsValid()
        && effectiveFrom !== null
        && new Date(effectiveFrom).getTime() > Date.now();
    }

    _distributionErrorMessage(error) {
      const code = error?.code ?? error?.error?.code;
      return {
        distribution_unavailable: "Rateio configurado indisponível.",
        distribution_invalid: "Os dados do rateio são inválidos. Revise os percentuais e a vigência.",
        distribution_not_found: "Não há alteração agendada para cancelar.",
        distribution_storage_error: "Não foi possível salvar o rateio.",
      }[code] ?? "Não foi possível atualizar o rateio.";
    }

    _applyDistributionResponse(response) {
      const data = response?.data;
      if (!response || response.api_version !== API_VERSION || !data
        || typeof data !== "object" || Array.isArray(data)
        || !Number.isInteger(data.revision)
        // `current` nulo e rateio pendente: ninguem informou ainda.
        || (data.current !== null && typeof data.current !== "object")
        || !Array.isArray(data.history)) {
        throw new Error("Resposta de rateio inválida.");
      }
      this._distributionData = data;
      this._distributionError = "";
      return data;
    }

    async _mutateDistribution(type) {
      if (!this._distributionData || this._distributionMutationState === "saving"
        || this._distributionMutationState === "scheduling"
        || this._distributionMutationState === "cancelling") return;
      const expectedRevision = this._distributionData.revision;
      if (!Number.isInteger(expectedRevision)) return;
      const command = {
        immediate: SET_DISTRIBUTION_COMMAND,
        schedule: SCHEDULE_DISTRIBUTION_COMMAND,
        cancel: CANCEL_DISTRIBUTION_COMMAND,
      }[type];
      const payload = { type: command, expected_revision: expectedRevision };
      if (type !== "cancel") {
        payload.shares = { ...this._distributionDraft.shares };
        if (this._distributionDraft.label.trim()) payload.label = this._distributionDraft.label.trim();
      }
      if (type === "schedule") payload.effective_from = this._distributionEffectiveFrom();
      this._distributionMutationState = {
        immediate: "saving", schedule: "scheduling", cancel: "cancelling",
      }[type];
      this._distributionMutationMessage = "";
      this._renderDistributionUpdate();
      try {
        const response = await this._hass.callWS(payload);
        this._applyDistributionResponse(response);
        this._distributionMode = "idle";
        this._distributionDraft = null;
        this._distributionConfirmation = null;
        this._distributionMutationState = "success";
        this._distributionMutationMessage = type === "cancel"
          ? "Agendamento cancelado com sucesso."
          : type === "schedule"
            ? "Alteração de rateio agendada com sucesso."
            : "Rateio atualizado com sucesso.";
      } catch (error) {
        const code = error?.code ?? error?.error?.code;
        this._distributionConfirmation = null;
        if (code === "distribution_revision_conflict") {
          this._distributionMode = "idle";
          this._distributionDraft = null;
          this._distributionMutationState = "revision_conflict";
          this._distributionMutationMessage = "A configuração de rateio foi alterada em outro lugar. Os dados serão recarregados antes de uma nova tentativa.";
          this._distributionData = null;
          this._renderDistributionUpdate();
          await this._loadDistribution({ force: true });
          this._distributionMutationState = "revision_conflict";
        } else {
          this._distributionMutationState = "error";
          this._distributionMutationMessage = this._distributionErrorMessage(error);
        }
      }
      this._renderDistributionUpdate();
    }

    async _loadDistribution({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && this._distributionData) {
        this._renderDistributionUpdate();
        return this._distributionData;
      }
      if (this._distributionLoading) return null;

      const token = ++this._distributionRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._distributionLoading = true;
      this._distributionError = "";
      this._renderDistributionUpdate();

      try {
        const response = await requestHass.callWS({ type: DISTRIBUTION_COMMAND });
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato de rateio incompatível com esta versão do card.");
        }
        if (
          token !== this._distributionRequestToken
          || configGeneration !== this._configGeneration
        ) return null;
        const data = this._applyDistributionResponse(response);
        return data;
      } catch (error) {
        if (
          token !== this._distributionRequestToken
          || configGeneration !== this._configGeneration
        ) return null;
        const code = error?.code ?? error?.error?.code;
        this._distributionError = code === "distribution_unavailable"
          ? "Rateio configurado indisponível"
          : "Não foi possível carregar o rateio configurado.";
        return null;
      } finally {
        if (
          token === this._distributionRequestToken
          && configGeneration === this._configGeneration
        ) {
          this._distributionLoading = false;
          this._renderDistributionUpdate();
        }
      }
    }

    _renderDistributionUpdate() {
      const current = this.shadowRoot.querySelector("[data-distribution-section]");
      // A seção dentro do popup é reconstruída pelo próprio popup, com a
      // moldura desligada. Trocá-la aqui devolveria a borda e o título de
      // painel dentro do diálogo.
      if (current && !current.closest("[data-distribution-modal-host]")) {
        current.replaceWith(this._renderDistribution());
      }
      const donut = this.shadowRoot.querySelector("[data-distribution-donut]");
      if (donut) donut.replaceWith(this._renderDistributionDonut());
      if (this._distributionModal) this._renderDistributionModalUpdate();
    }

    _energyFlowRequestReference() {
      if (this._energyFlowPeriodKind !== "cycle") {
        return this._energyFlowCalendar[this._energyFlowPeriodKind] ?? null;
      }
      const escolha = this._energyFlowSelection;
      if (!escolha) return null;
      return this._energyFlowReferences().some((item) => item.value === escolha)
        ? escolha
        : null;
    }

    _setEnergyFlowPeriodKind(kind) {
      if (!["cycle", "day", "month"].includes(kind)) return;
      if (this._energyFlowPeriodKind === kind) return;
      this._energyFlowPeriodKind = kind;
      this._energyFlowData = null;
      this._loadEnergyFlow({ force: true });
      this._render();
    }

    _setEnergyFlowCalendar(value) {
      const kind = this._energyFlowPeriodKind;
      if (kind === "cycle" || !value) return;
      if (this._energyFlowCalendar[kind] === value) return;
      this._energyFlowCalendar = { ...this._energyFlowCalendar, [kind]: value };
      this._energyFlowData = null;
      this._loadEnergyFlow({ force: true });
      this._render();
    }

    // Anda um passo no recorte atual. As datas sao montadas em UTC de proposito
    // e lidas de volta como texto: somar um dia sobre a data local esbarraria
    // no horario de verao, que faz um dia ter 23 ou 25 horas.
    _shiftEnergyFlowCalendar(passo) {
      const kind = this._energyFlowPeriodKind;
      const atual = this._energyFlowCalendar[kind];
      if (kind === "day") {
        const base = new Date(`${atual}T00:00:00Z`);
        base.setUTCDate(base.getUTCDate() + passo);
        this._setEnergyFlowCalendar(base.toISOString().slice(0, 10));
        return;
      }
      if (kind === "month") {
        const [ano, mes] = atual.split("-").map(Number);
        const base = new Date(Date.UTC(ano, mes - 1 + passo, 1));
        this._setEnergyFlowCalendar(base.toISOString().slice(0, 7));
      }
    }

    // O limite superior do campo: nao ha medicao de periodo que ainda nao
    // comecou, e o backend recusa — melhor a interface nao chegar la.
    _energyFlowCalendarMax() {
      const hoje = new Date();
      return {
        day: this._localDateValue(hoje),
        month: this._localMonthValue(hoje),
      }[this._energyFlowPeriodKind] ?? "";
    }

    // O ciclo em andamento primeiro, depois os fechados. O aberto nao tem
    // referencia faturada: e a prevista que o identifica, a mesma que o
    // backend usa para respondar por ele.
    _energyFlowReferences() {
      const catalogo = this._cyclesCatalog(this._generator) ?? [];
      const atual = catalogo.find((cycle) => (
        cycle?.status !== "closed"
        && typeof cycle?.predicted_reference === "string"
        && cycle.predicted_reference.trim()
      ));
      const fechadas = this._closedBillingReferences(this._generator);
      // O ciclo que ja terminou pela data mas ainda nao tem fatura fica entre o
      // atual e os fechados. Sem ele o mes sumia do seletor exatamente no
      // intervalo em que a pergunta "como foi o ultimo ciclo?" mais aparece.
      // Quando a fatura chega, o backend o transforma em fechado com o mesmo
      // nome, e a opcao troca de rotulo sem mudar de valor.
      const provisorios = catalogo
        .filter((cycle) => (
          cycle?.status === "provisional"
          && typeof cycle?.predicted_reference === "string"
          && cycle.predicted_reference.trim()
          && !fechadas.includes(cycle.predicted_reference)
        ))
        .map((cycle) => ({
          value: cycle.predicted_reference,
          label: `${cycle.predicted_reference} · Aguardando fatura`,
        }));
      return [
        { value: "", label: atual
          ? `${atual.predicted_reference} · Em andamento`
          : "Ciclo atual" },
        ...provisorios,
        ...fechadas.map((reference) => (
          { value: reference, label: reference }
        )),
      ];
    }

    _validateEnergyFlowResponse(response, reference) {
      if (!response || response.api_version !== API_VERSION || !response.data) {
        throw new Error("Contrato de fluxo energético incompatível.");
      }
      const data = response.data;
      const requiredFields = [
        "generation_kwh",
        "self_consumption_kwh",
        "export_kwh",
        "generator_compensation_kwh",
        "distributable_balance_kwh",
      ];
      if (
        (reference !== null && data.billing_reference !== reference)
        || typeof data.billing_reference !== "string"
        || !["closed", "provisional", "open"].includes(data.cycle_status)
        || !requiredFields.every((field) => Object.hasOwn(data, field))
        || !Array.isArray(data.allocations)
        || !data.quality
        || !["confirmed", "partial", "unavailable"].includes(data.quality.status)
      ) {
        throw new Error("Resposta de fluxo energético inválida.");
      }
      const allocationIds = data.allocations.map((item) => item?.unit_id);
      if (!this._units().every((unit) => allocationIds.includes(unit.id))) {
        throw new Error("Destinos do fluxo energético incompletos.");
      }
      return data;
    }

    async _loadEnergyFlow({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      // Quem gera vem do catalogo, e na primeira carga ele ainda nao chegou.
      // Desistir nesse instante deixava o painel vazio ate alguem clicar em
      // atualizar ou trocar de mes: "ainda nao sei" nao e "nao ha".
      if (!Array.isArray(this._unitCatalog)) await this._loadUnitCatalog();
      // O fluxo confronta geracao, exportacao e consumo. Sem quem gere, nao
      // ha fluxo a compor — e pedi-lo mandaria ao backend uma unidade nula.
      if (!this._generator) return null;

      // O catalogo alimenta o seletor do painel; o pedido em si nao depende
      // dele, porque sem referencia o backend ja devolve o ciclo atual.
      if ((this._cyclesCatalog(this._generator) ?? []).length === 0) {
        await this._loadCyclesCatalog({ unit: this._generator, allowOutsideCycle: true });
      }
      // null e um pedido valido agora, entao nao ha mais o que barrar aqui. E
      // o painel deixou de mexer no _billingReference da pagina: ele tem
      // seletor proprio, e escrever no da pagina movia os cartoes das unidades
      // junto, sem ninguem ter pedido.
      const reference = this._energyFlowRequestReference();
      if (!force && this._energyFlowData && this._energyFlowReference === reference) {
        this._renderEnergyFlowUpdate();
        return this._energyFlowData;
      }

      const token = ++this._energyFlowRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._energyFlowData = null;
      this._energyFlowReference = reference;
      this._energyFlowError = "";
      this._energyFlowLoading = true;
      this._renderEnergyFlowUpdate();
      try {
        const response = await requestHass.callWS({
          type: ENERGY_FLOW_COMMAND,
          ...(reference ? { billing_reference: reference } : {}),
          ...(this._energyFlowPeriodKind !== "cycle"
            ? { period_kind: this._energyFlowPeriodKind } : {}),
        });
        const data = this._validateEnergyFlowResponse(response, reference);
        if (
          token !== this._energyFlowRequestToken
          || configGeneration !== this._configGeneration
          || reference !== this._energyFlowRequestReference()
        ) return null;
        this._energyFlowData = data;
        return data;
      } catch (error) {
        if (
          token !== this._energyFlowRequestToken
          || configGeneration !== this._configGeneration
        ) return null;
        this._energyFlowError = "Não foi possível carregar o fluxo energético desta referência.";
        return null;
      } finally {
        if (
          token === this._energyFlowRequestToken
          && configGeneration === this._configGeneration
        ) {
          this._energyFlowLoading = false;
          this._renderEnergyFlowUpdate();
        }
      }
    }

    _renderEnergyFlowUpdate() {
      const current = this.shadowRoot.querySelector("[data-energy-flow]");
      if (!current) return;
      this._cleanupFlowChart();
      current.replaceWith(this._renderEnergyFlow());
      queueMicrotask(() => {
        if (this.isConnected && this._page === "overview") this._renderFlowChart();
      });
      // A rosca le o mesmo `allocations`: trocar o ciclo sem redesenha-la
      // deixaria os dois paineis em periodos diferentes.
      const donut = this.shadowRoot?.querySelector("[data-distribution-donut]");
      if (donut) donut.replaceWith(this._renderDistributionDonut());
    }

    async _loadScee({ force = false } = {}) {
      if (
        !this._selectedUnit
        || !this._hass
        || typeof this._hass.callWS !== "function"
      ) {
        return null;
      }
      const unit = this._selectedUnit;
      const billingReference = this._sceeReference(unit);
      if (!this._closedBillingReferences(unit).includes(billingReference)) {
        this._reconcileBillingReference(unit);
        this._renderSceeUpdate();
        return null;
      }
      const key = this._sceeKey(unit, billingReference);
      if (!force && this._sceeCache.has(key)) {
        this._renderSceeUpdate();
        return this._sceeCache.get(key);
      }
      if (!force && this._sceeInFlight.has(key)) return this._sceeInFlight.get(key);

      const token = this._sceeRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._sceeErrors.delete(key);
      this._renderSceeUpdate();
      const request = requestHass.callWS({
        type: SCEE_COMMAND,
        unit_id: unit,
        billing_reference: billingReference,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION) {
          throw new Error("Contrato SCEE incompatível com esta versão do card.");
        }
        if (
          !response.data
          || typeof response.data !== "object"
          || Array.isArray(response.data)
        ) {
          throw new Error("Resposta SCEE inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        const isCurrentKey = unit === this._selectedUnit
          && billingReference === this._sceeReference()
          && key === this._sceeKey();
        if (isCurrentKey && token !== this._sceeRequestToken) return null;
        this._sceeCache.set(key, response.data);
        this._sceeErrors.delete(key);
        if (
          token === this._sceeRequestToken
          && unit === this._selectedUnit
          && billingReference === this._sceeReference()
          && key === this._sceeKey()
        ) {
          this._renderSceeUpdate();
        }
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        this._sceeErrors.set(key, this._sceeErrorMessage(error));
        if (
          token === this._sceeRequestToken
          && unit === this._selectedUnit
          && billingReference === this._sceeReference()
          && key === this._sceeKey()
        ) {
          this._renderSceeUpdate();
        }
        return null;
      }).finally(() => {
        if (this._sceeInFlight.get(key) === request) {
          this._sceeInFlight.delete(key);
        }
        if (
          configGeneration === this._configGeneration
          && token === this._sceeRequestToken
          && unit === this._selectedUnit
          && billingReference === this._sceeReference()
          && key === this._sceeKey()
        ) {
          this._renderSceeUpdate();
        }
      });
      this._sceeInFlight.set(key, request);
      this._renderSceeUpdate();
      return request;
    }

    _renderCompositionUpdate() {
      const atual = this.shadowRoot?.querySelector("[data-composition-panel]");
      if (atual) atual.replaceWith(this._renderConsumptionComposition());
    }

    _renderSceeUpdate() {
      // A composicao le o mesmo payload do SCEE: atualizar so um dos dois
      // deixaria a barra falando de um ciclo e a tabela de outro.
      this._renderCompositionUpdate();
      const current = this.shadowRoot.querySelector("[data-scee-section]");
      if (!current) return;
      current.replaceWith(this._renderScee());
    }

    _scheduleSceeLoading() {
      queueMicrotask(async () => {
        if (!this.isConnected) return;
        if (!Array.isArray(this._cyclesCatalog())) {
          await this._loadCyclesCatalog({ allowOutsideCycle: true });
        }
        if (!this.isConnected) return;
        const reference = this._reconcileBillingReference();
        if (!reference) {
          this._renderSceeUpdate();
          return;
        }
        const key = this._sceeKey();
        if (!this._sceeCache.has(key) && !this._sceeInFlight.has(key)) {
          this._loadScee();
        }
      });
    }

    _sceeErrorMessage() {
      return "Não foi possível carregar os dados oficiais SCEE.";
    }

    async _loadFinance({ force = false } = {}) {
      if (!this._selectedUnit || !this._hass
        || typeof this._hass.callWS !== "function") return null;
      const unit = this._selectedUnit;
      const billingReference = this._financeReference(unit);
      if (!this._closedBillingReferences(unit).includes(billingReference)) {
        this._reconcileBillingReference(unit);
        this._renderFinanceUpdate();
        return null;
      }
      const key = this._financeKey(unit, billingReference);
      if (!force && this._financeCache.has(key)) {
        this._renderFinanceUpdate();
        return this._financeCache.get(key);
      }
      if (!force && this._financeInFlight.has(key)) {
        return this._financeInFlight.get(key);
      }

      const token = this._financeRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._financeErrors.delete(key);
      this._renderFinanceUpdate();
      const request = requestHass.callWS({
        type: FINANCE_COMMAND,
        unit_id: unit,
        billing_reference: billingReference,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION
          || !response.data || typeof response.data !== "object"
          || Array.isArray(response.data)) {
          throw new Error("Resposta financeira oficial inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        const isCurrent = token === this._financeRequestToken
          && unit === this._selectedUnit
          && billingReference === this._financeReference()
          && key === this._financeKey();
        if (!isCurrent) return null;
        this._financeCache.set(key, response.data);
        this._financeErrors.delete(key);
        this._renderFinanceUpdate();
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        const isCurrent = token === this._financeRequestToken
          && unit === this._selectedUnit
          && billingReference === this._financeReference()
          && key === this._financeKey();
        if (!isCurrent) return null;
        this._financeErrors.set(key, this._financeErrorState(error));
        this._renderFinanceUpdate();
        return null;
      }).finally(() => {
        if (this._financeInFlight.get(key) === request) {
          this._financeInFlight.delete(key);
        }
        if (configGeneration === this._configGeneration
          && token === this._financeRequestToken
          && unit === this._selectedUnit
          && billingReference === this._financeReference()
          && key === this._financeKey()) this._renderFinanceUpdate();
      });
      this._financeInFlight.set(key, request);
      this._renderFinanceUpdate();
      return request;
    }

    _renderFinanceUpdate() {
      const current = this.shadowRoot.querySelector("[data-finance-section]");
      if (current) current.replaceWith(this._renderFinance());
    }

    _scheduleFinanceLoading() {
      queueMicrotask(async () => {
        if (!this.isConnected) return;
        if (!Array.isArray(this._cyclesCatalog())) {
          await this._loadCyclesCatalog({ allowOutsideCycle: true });
        }
        if (!this.isConnected) return;
        const reference = this._reconcileBillingReference();
        if (!reference) {
          this._renderFinanceUpdate();
          return;
        }
        const key = this._financeKey();
        if (!this._financeCache.has(key) && !this._financeInFlight.has(key)) {
          this._loadFinance();
        }
      });
    }

    _financeErrorState(error) {
      const code = error?.code ?? error?.error?.code;
      if (code === "finance_not_found") return "not_found";
      if (code === "finance_unavailable") return "unavailable";
      return "error";
    }

    async _loadPaybackProjection({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && this._paybackProjectionData) {
        this._renderPaybackProjectionUpdate();
        return this._paybackProjectionData;
      }
      if (!force && this._paybackProjectionInFlight) {
        return this._paybackProjectionInFlight;
      }
      const token = ++this._paybackProjectionRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._paybackProjectionError = "";
      if (force) this._paybackProjectionData = null;
      this._renderPaybackProjectionUpdate();
      const request = requestHass.callWS({
        type: PAYBACK_PROJECTION_COMMAND,
      }).then((response) => {
        const data = response?.data;
        const scenarios = data?.scenarios;
        if (response?.api_version !== API_VERSION || !data
          || typeof data !== "object" || Array.isArray(data)
          || !scenarios || typeof scenarios !== "object"
          || !["conservative", "base", "optimistic"].every(
            (name) => scenarios[name]?.status === "scenario_only",
          )
          || data.realized?.status !== "unavailable") {
          throw new Error("Resposta de payback projetado inválida.");
        }
        if (configGeneration !== this._configGeneration
          || token !== this._paybackProjectionRequestToken) return null;
        this._paybackProjectionData = data;
        this._paybackProjectionError = "";
        this._renderPaybackProjectionUpdate();
        return data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration
          || token !== this._paybackProjectionRequestToken) return null;
        const code = error?.code ?? error?.error?.code;
        // Instalacao que ainda nao informou quanto custou o sistema nao
        // falhou: so nao tem o que o payback recupera. A tela diz onde se
        // informa, em vez de mandar conferir uma configuracao que esta certa.
        this._paybackProjectionError = code === "payback_investment_missing"
          ? "missing_investment"
          : code === "payback_billing_missing"
            ? "missing_billing"
            : (code === "payback_projection_unavailable" ? "unavailable" : "error");
        this._renderPaybackProjectionUpdate();
        return null;
      }).finally(() => {
        if (this._paybackProjectionInFlight === request) {
          this._paybackProjectionInFlight = null;
        }
        if (configGeneration === this._configGeneration
          && token === this._paybackProjectionRequestToken) {
          this._renderPaybackProjectionUpdate();
        }
      });
      this._paybackProjectionInFlight = request;
      this._renderPaybackProjectionUpdate();
      return request;
    }

    _renderPaybackProjectionUpdate() {
      const current = this.shadowRoot.querySelector("[data-payback-projection-section]");
      if (!current) return;
      this._cleanupPaybackChart();
      const proximo = this._renderPaybackProjection();
      if (!proximo) return;
      current.replaceWith(proximo);
      queueMicrotask(() => {
        if (this.isConnected && this._page === "payback") this._renderPaybackChart();
      });
    }

    // O payback e do sistema solar inteiro: o comando nem aceita unidade, e
    // a aba mostra as quatro juntas. Quem decide se vale carregar e estar na
    // aba dele — amarrar isso a unidade escolhida nas outras telas fazia a
    // projecao nao ser nem pedida quando se chegava aqui vindo de outra
    // unidade.
    _schedulePaybackProjectionLoading() {
      if (this._page !== "payback") return;
      queueMicrotask(() => {
        if (!this.isConnected || this._page !== "payback") return;
        if (!this._paybackProjectionData && !this._paybackProjectionInFlight) {
          this._loadPaybackProjection();
        }
      });
    }

    async _loadSelfConsumption({ force = false } = {}) {
      if (this._selectedUnit !== this._generator || !this._hass
        || typeof this._hass.callWS !== "function") return null;
      const unit = this._generator;
      const selectedCycle = this._selectedCycle(unit);
      const billingReference = selectedCycle?.status === "closed"
        && typeof selectedCycle.billing_reference === "string"
        ? selectedCycle.billing_reference
        : null;
      if (!this._closedBillingReferences(unit).includes(billingReference)) {
        this._renderSelfConsumptionUpdate();
        return null;
      }
      const key = this._selfConsumptionKey(unit, billingReference);
      if (!force && this._selfConsumptionCache.has(key)) {
        this._renderSelfConsumptionUpdate();
        return this._selfConsumptionCache.get(key);
      }
      if (!force && this._selfConsumptionInFlight.has(key)) {
        return this._selfConsumptionInFlight.get(key);
      }

      const token = this._selfConsumptionRequestToken;
      const configGeneration = this._configGeneration;
      const requestHass = this._hass;
      this._selfConsumptionErrors.delete(key);
      this._renderSelfConsumptionUpdate();
      const request = requestHass.callWS({
        type: SELF_CONSUMPTION_COMMAND,
        unit_id: unit,
        billing_reference: billingReference,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION
          || !response.data || typeof response.data !== "object"
          || Array.isArray(response.data)) {
          throw new Error("Resposta de autoconsumo físico inválida.");
        }
        if (response.data.unit_id !== unit
          || response.data.billing_reference !== billingReference) {
          throw new Error("Resposta de autoconsumo físico não corresponde ao ciclo solicitado.");
        }
        if (configGeneration !== this._configGeneration) return null;
        const isCurrent = token === this._selfConsumptionRequestToken
          && this._selectedUnit === this._generator
          && billingReference === this._selectedCycle()?.billing_reference
          && key === this._selfConsumptionKey();
        if (!isCurrent) return null;
        this._selfConsumptionCache.set(key, response.data);
        this._selfConsumptionErrors.delete(key);
        this._renderSelfConsumptionUpdate();
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        const isCurrent = token === this._selfConsumptionRequestToken
          && this._selectedUnit === this._generator
          && billingReference === this._selectedCycle()?.billing_reference
          && key === this._selfConsumptionKey();
        if (!isCurrent) return null;
        this._selfConsumptionErrors.set(key, this._selfConsumptionErrorState(error));
        this._renderSelfConsumptionUpdate();
        return null;
      }).finally(() => {
        if (this._selfConsumptionInFlight.get(key) === request) {
          this._selfConsumptionInFlight.delete(key);
        }
        if (configGeneration === this._configGeneration
          && token === this._selfConsumptionRequestToken
          && this._selectedUnit === this._generator
          && billingReference === this._selectedCycle()?.billing_reference
          && key === this._selfConsumptionKey()) this._renderSelfConsumptionUpdate();
      });
      this._selfConsumptionInFlight.set(key, request);
      this._renderSelfConsumptionUpdate();
      return request;
    }

    _renderSelfConsumptionUpdate() {
      const current = this.shadowRoot.querySelector("[data-self-consumption-section]");
      if (current) {
        const next = this._renderSelfConsumption();
        if (next) current.replaceWith(next);
        else current.remove();
      }
    }

    _scheduleSelfConsumptionLoading() {
      if (this._selectedUnit !== this._generator) return;
      queueMicrotask(async () => {
        if (!this.isConnected) return;
        if (!Array.isArray(this._cyclesCatalog(this._generator))) {
          await this._loadCyclesCatalog({ allowOutsideCycle: true });
        }
        if (!this.isConnected) return;
        const cycle = this._selectedCycle(this._generator);
        const reference = cycle?.status === "closed"
          && typeof cycle.billing_reference === "string"
          ? cycle.billing_reference
          : null;
        if (!reference) {
          this._renderSelfConsumptionUpdate();
          return;
        }
        const key = this._selfConsumptionKey(this._generator, reference);
        if (!this._selfConsumptionCache.has(key) && !this._selfConsumptionInFlight.has(key)) {
          this._loadSelfConsumption();
        }
      });
    }

    _selfConsumptionErrorState(error) {
      const code = error?.code ?? error?.error?.code;
      if (code === "self_consumption_invalid_reference") return "not_found";
      if (code === "self_consumption_unavailable"
        || code === "billing_source_unavailable") return "unavailable";
      return "error";
    }

    _renderComparisonUpdate() {
      const current = this.shadowRoot.querySelector("[data-comparison-result]");
      const replacement = this._renderComparison().querySelector(
        "[data-comparison-result]",
      );
      if (current && replacement) {
        current.replaceWith(replacement);
        this._scheduleComparisonRendering();
        return;
      }
      this._render();
    }

    _renderComparisonSectionUpdate() {
      const current = this.shadowRoot.querySelector("[data-comparison-section]");
      if (!current) {
        this._render();
        return;
      }
      current.replaceWith(this._renderComparison());
      this._scheduleComparisonRendering();
    }

    _comparisonErrorMessage(error) {
      const custom = this._comparisonStrategy === "custom";
      const translations = new Map([
        ["comparison_unknown_unit", "Unidade indisponível para comparação."],
        ["comparison_invalid_mode", "Modo de comparação inválido."],
        [
          "comparison_invalid_reference",
          // No ciclo, a unica referencia que o usuario informa e o corte:
          // "periodos invalidos" nao diria a ele o que corrigir.
          custom && this._comparisonCustomPeriodType === "cycle"
            ? "O corte precisa cair dentro do ciclo atual."
            : custom ? "Períodos personalizados inválidos." : "Mês inválido.",
        ],
        [
          "comparison_future_reference",
          custom
            ? "Selecione hoje ou datas anteriores."
            : "Selecione o mês atual ou um mês anterior.",
        ],
        ["comparison_invalid_logical_id", "Métrica indisponível para comparação."],
        ["comparison_invalid_resolution", "Detalhamento da comparação inválido."],
        [
          "comparison_hourly_range_too_long",
          "Detalhamento horário disponível para períodos de até 7 dias.",
        ],
        [
          "comparison_mixed_range_types_not_allowed",
          "Use Dia nos dois períodos ou Intervalo nos dois períodos.",
        ],
        [
          "comparison_interval_requires_distinct_dates",
          "Intervalo exige data inicial e final diferentes.",
        ],
        [
          "comparison_day_requires_single_date",
          "Comparações de dia exigem uma única data em cada período.",
        ],
        ["comparison_unavailable", "Comparação operacional indisponível para esta unidade."],
        ["runtime_unavailable", "Comparação temporariamente indisponível."],
        ["comparison_failed", "Não foi possível carregar a comparação."],
        ["serialization_failed", "Não foi possível carregar a comparação."],
      ]);
      const code = error?.code ?? error?.error?.code;
      return translations.get(code) ?? "Não foi possível carregar a comparação.";
    }

    _historyErrorMessage(error) {
      const translations = new Map([
        ["history_unknown_unit", "Unidade não disponível para histórico."],
        ["history_invalid_reference", "Data inválida."],
        ["history_future_reference", "Selecione hoje ou uma data anterior."],
        ["history_unavailable", "Histórico operacional indisponível para este ciclo."],
        ["runtime_unavailable", "Histórico temporariamente indisponível."],
        ["history_failed", "Não foi possível carregar o histórico."],
        ["serialization_failed", "Não foi possível carregar o histórico."],
      ]);
      const code = error?.code ?? error?.error?.code;
      return translations.get(code) ?? "Não foi possível carregar o histórico.";
    }

    _activateHistory() {
      if (!this._historyVisible) this._historyVisible = true;
      this._historyIntersectionObserver?.disconnect();
      this._historyIntersectionObserver = null;
      if (this._unitIsBillingOnly()) {
        this._render();
        return;
      }
      this._loadHistory();
    }

    _observeHistorySection() {
      const section = this.shadowRoot.querySelector("[data-history-section]");
      if (!section) return;
      if (this._historyVisible) {
        if (this._billingCapabilityPending.has(this._selectedUnit)) return;
        if (this._unitIsBillingOnly()) {
          if (this._cyclesCatalogIsFresh()) {
            this._renderHistoryChart();
          } else {
            this._loadCyclesCatalog().then(() => this._renderHistoryChart());
          }
          return;
        }
        const key = this._historyKey();
        if (!this._historyCacheIsFresh(key) && !this._historyInFlight.has(key)) {
          this._loadHistory();
        } else {
          this._renderHistoryChart();
        }
        return;
      }
      if (typeof IntersectionObserver === "undefined") {
        this._activateHistory();
        return;
      }
      this._historyIntersectionObserver?.disconnect();
      this._historyIntersectionObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this._activateHistory();
      }, { rootMargin: "200px" });
      this._historyIntersectionObserver.observe(section);
    }

    _scheduleHistoryRendering() {
      queueMicrotask(() => {
        if (this.isConnected) this._observeHistorySection();
      });
    }

    _scheduleComparisonRendering() {
      queueMicrotask(() => {
        if (!this.isConnected || this._comparisonUnavailable()) return;
        const key = this._comparisonKey();
        // Uma chave que ja falhou nao se repede sozinha. O `finally` do pedido
        // redesenha a secao, o redesenho reagendava a carga e a carga falhava
        // de novo: um laco infinito que a tela exibia como "Carregando…" para
        // sempre, escondendo justamente o erro que explicava a falha. Novo
        // pedido so por "Tentar novamente" ou por mudanca de recorte, que
        // produz outra chave.
        if (this._comparisonErrors.has(key)) return;
        if (!this._comparisonCacheIsFresh(key) && !this._comparisonInFlight.has(key)) {
          this._loadComparison();
        } else {
          this._renderComparisonChart();
        }
      });
    }

    _selectUnit(unit) {
      if (!this._unitIds().includes(unit) || unit === this._selectedUnit) return;
      this._historyHighlight = null;
      this._selectedUnit = unit;
      this._storeView();
      if (Array.isArray(this._cyclesCatalog(unit))) {
        this._reconcileBillingReference(unit);
      }
      this._selectionToken += 1;
      this._historyRequestToken += 1;
      this._comparisonRequestToken += 1;
      this._auditRequestToken += 1;
      this._sceeRequestToken += 1;
      this._financeRequestToken += 1;
      this._selfConsumptionRequestToken += 1;
      this._render();
      if (!this._cache.has(this._key(unit))) this._loadSelected();
      this._ensureBillingOnlyMode(unit).then(() => {
        if (unit === this._selectedUnit && this._historyVisible) this._loadHistory();
      });
    }

    // Tudo de novo, sem esperar o botao de atualizar: depois de ler ou apagar
    // faturas, e ao voltar da pagina da integracao, o que existe pode ter
    // mudado — unidades, sensores, donos de UC —, e com isso as abas.
    // Uma fatura nova muda o ciclo de TODAS as unidades que ela toca, e nao
    // so da que esta aberta: a leitura que atrasou de 17 para 21 muda o
    // inicio do ciclo e a proxima leitura. Guardados, os dados de cada
    // unidade continuavam com a data velha ate alguem apertar atualizar. O
    // que estava na tela fica como "antigo" enquanto o novo nao chega.
    _forgetUnitData() {
      for (const unitId of this._unitIds()) {
        const key = this._key(unitId);
        const atual = this._cache.get(key);
        if (atual) this._stale.set(key, atual);
        this._cache.delete(key);
        this._errors.delete(key);
      }
      this._cyclesCatalogCache?.clear?.();
      this._cyclesCatalogErrors?.clear?.();
    }

    _refreshAll() {
      if (!this._hass || typeof this._hass.callWS !== "function") return;
      this._modelConfig = null;
      this._forgetUnitData();
      if (this._page === "configuracao") {
        this._loadSettings({ force: true });
        this._loadSensors({ force: true });
        this._loadModelConfig({ force: true });
        this._loadInvoices({ force: true });
      }
      this._loadUnitCatalog({ force: true }).then((catalogo) => {
        if (!this.isConnected || !catalogo?.length) return;
        this._refresh();
      });
    }

    _closeSettingsModal() {
      this._settingsModal = null;
      this._renderSettingsUpdate();
      // Fechar o dialogo e o "pronto" de quem leu faturas ou mudou rateio e
      // tarifa: o resto do painel se atualiza sem pedir nada.
      this._refreshAll();
    }

    _refresh() {
      if (this._page === "overview") {
        for (const unitId of this._unitIds()) {
          const overviewKey = this._key(unitId);
          const currentOverview = this._cache.get(overviewKey)
            ?? this._stale.get(overviewKey);
          if (currentOverview) this._stale.set(overviewKey, currentOverview);
          this._cache.delete(overviewKey);
          this._errors.delete(overviewKey);
        }
        this._selectionToken += 1;
        this._render();
        this._loadOverviewUnits({ force: true });
        this._loadDistribution({ force: true });
        this._energyFlowRequestToken += 1;
        this._energyFlowData = null;
        this._energyFlowError = "";
        this._loadEnergyFlow({ force: true });
        return;
      }
      const unit = this._selectedUnit;
      const key = this._key();
      const current = this._cache.get(key) ?? this._stale.get(key);
      if (current) this._stale.set(key, current);
      this._cache.delete(key);
      this._errors.delete(key);
      this._selectionToken += 1;
      this._historyRequestToken += 1;
      this._comparisonRequestToken += 1;
      this._auditRequestToken += 1;
      const auditKey = this._auditKey();
      this._auditCache.delete(auditKey);
      this._auditErrors.delete(auditKey);
      this._sceeRequestToken += 1;
      const sceeKey = this._sceeKey();
      this._sceeCache.delete(sceeKey);
      this._sceeErrors.delete(sceeKey);
      this._financeRequestToken += 1;
      const financeKey = this._financeKey();
      this._financeCache.delete(financeKey);
      this._financeErrors.delete(financeKey);
      this._selfConsumptionRequestToken += 1;
      const selfConsumptionKey = this._selfConsumptionKey();
      this._selfConsumptionCache.delete(selfConsumptionKey);
      this._selfConsumptionErrors.delete(selfConsumptionKey);
      this._paybackProjectionRequestToken += 1;
      this._paybackProjectionData = null;
      this._paybackProjectionError = "";
      this._paybackProjectionInFlight = null;
      const comparisonKey = this._comparisonKey();
      this._comparisonCache.delete(comparisonKey);
      this._comparisonErrors.delete(comparisonKey);
      this._cyclesCatalogCache.delete(unit);
      this._cyclesCatalogErrors.delete(unit);
      this._distributionData = null;
      this._distributionError = "";
      this._resetDistributionInteraction();
      this._render();
      this._loadSelected({ force: true });
      this._loadDistribution({ force: true });
      // Mesmo motivo: o payback nao e da unidade que esta sendo atualizada.
      // O refresh invalida sempre, e recarrega na hora so quando a aba dele
      // e a que esta na tela.
      this._paybackProjectionData = null;
      if (this._page === "payback") this._loadPaybackProjection({ force: true });
      if (this._historyVisible) this._loadHistory({ force: true });
      if (!this._comparisonUnavailable()) this._loadComparison({ force: true });
      this._loadCyclesCatalog({
        force: true,
        unit,
        allowOutsideCycle: true,
      }).then(() => {
        if (unit !== this._selectedUnit) return;
        this._reconcileBillingReference(unit);
        this._renderAuditUpdate();
        if (this._auditReference(unit)) this._loadAudit({ force: true });
        this._renderSceeUpdate();
        if (this._sceeReference(unit)) this._loadScee({ force: true });
        this._renderFinanceUpdate();
        if (this._financeReference(unit)) this._loadFinance({ force: true });
      });
    }

    _setComparisonReference(reference) {
      const isMonth = this._comparisonMode === "month";
      const selected = isMonth
        ? this._parseLocalMonth(reference)
        : this._parseLocalDate(reference);
      const currentValue = isMonth
        ? this._localMonthValue(new Date())
        : this._localDateValue(new Date());
      const current = isMonth
        ? this._parseLocalMonth(currentValue)
        : this._parseLocalDate(currentValue);
      if (!selected || !current) {
        this._comparisonErrors.set(this._comparisonKey(), "Período inválido.");
        this._renderComparisonSectionUpdate();
        return;
      }
      if (selected > current) {
        this._comparisonErrors.set(
          this._comparisonKey(),
          "Selecione hoje ou uma data anterior.",
        );
        this._renderComparisonSectionUpdate();
        return;
      }
      if (reference === this._comparisonReferences[this._comparisonMode]) return;
      this._comparisonReferences[this._comparisonMode] = reference;
      if (isMonth) this._comparisonReference = reference;
      this._comparisonRequestToken += 1;
      this._renderComparisonSectionUpdate();
      this._loadComparison();
    }

    _shiftComparisonReference(amount) {
      const isMonth = this._comparisonMode === "month";
      const current = isMonth
        ? this._parseLocalMonth(this._comparisonReferences.month)
        : this._parseLocalDate(this._comparisonReferences[this._comparisonMode]);
      if (!current) return;
      if (isMonth) current.setMonth(current.getMonth() + amount);
      else current.setDate(current.getDate() + amount);
      const shifted = isMonth
        ? this._localMonthValue(current)
        : this._localDateValue(current);
      const maximum = isMonth
        ? this._localMonthValue(new Date())
        : this._localDateValue(new Date());
      if (shifted > maximum) return;
      this._setComparisonReference(shifted);
    }

    _setComparisonMode(mode) {
      if (!["day", "rolling_days", "month"].includes(mode)) return;
      if (mode === this._comparisonMode) return;
      this._comparisonMode = mode;
      this._comparisonRequestToken += 1;
      this._renderComparisonSectionUpdate();
      this._loadComparison();
    }

    _setComparisonLogicalId(logicalId) {
      if (!this._comparisonMetrics().some((item) => item.logicalId === logicalId)) return;
      if (logicalId === this._comparisonLogicalId()) return;
      this._comparisonLogicalIds.set(this._selectedUnit, logicalId);
      this._comparisonRequestToken += 1;
      this._renderComparisonSectionUpdate();
      this._loadComparison();
    }

    _retryComparison() {
      const key = this._comparisonKey();
      this._comparisonErrors.delete(key);
      this._renderComparisonUpdate();
      this._loadComparison({ force: true });
    }

    _setComparisonStrategy(strategy) {
      if (!["automatic", "custom"].includes(strategy)) return;
      if (strategy === this._comparisonStrategy) return;
      this._comparisonStrategy = strategy;
      this._comparisonRequestToken += 1;
      this._renderComparisonSectionUpdate();
      if (strategy === "automatic") this._loadComparison();
    }

    _setComparisonCustomDraft(field, value) {
      if (!Object.hasOwn(this._comparisonCustomDraft, field)) return;
      const changes = { [field]: value };
      if (field === "baseStart" && this._comparisonCustomPeriodType === "day") {
        changes.baseEnd = value;
      }
      if (
        field === "comparisonStart"
        && this._comparisonCustomPeriodType === "day"
      ) {
        changes.comparisonEnd = value;
      }
      this._comparisonCustomDraft = {
        ...this._comparisonCustomDraft,
        ...changes,
      };
      this._comparisonCustomRange = null;
      this._comparisonRequestToken += 1;
      this._comparisonErrors.delete(this._comparisonKey());
      this._updateComparisonCustomFormState();
    }

    _civilInclusiveDays(start, end) {
      const startParts = String(start).split("-").map(Number);
      const endParts = String(end).split("-").map(Number);
      if (startParts.length !== 3 || endParts.length !== 3) return null;
      const startTime = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
      const endTime = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);
      return Number.isFinite(startTime) && Number.isFinite(endTime)
        ? Math.floor((endTime - startTime) / 86400000) + 1
        : null;
    }

    _customComparisonValidation() {
      if (this._comparisonCustomPeriodType === "cycle") {
        if (!this._comparisonCycleCut) return "";
        const corte = Date.parse(this._comparisonCycleCut);
        if (!Number.isFinite(corte)) return "Informe um instante válido.";
        if (corte > Date.now()) return "O corte não pode estar no futuro.";
        return "";
      }
      const range = this._comparisonCustomDraft;
      const values = [
        range.baseStart, range.baseEnd, range.comparisonStart, range.comparisonEnd,
      ];
      const dates = values.map((value) => this._parseLocalDate(value));
      const today = this._parseLocalDate(this._localDateValue(new Date()));
      if (dates.some((value) => value === null) || !today) return "Preencha datas válidas.";
      if (dates.some((value) => value > today)) return "Selecione hoje ou datas anteriores.";
      if (dates[0] > dates[1] || dates[2] > dates[3]) {
        return "A data inicial não pode ser posterior à data final.";
      }
      if (
        this._comparisonCustomPeriodType === "range"
        && (range.baseStart === range.baseEnd || range.comparisonStart === range.comparisonEnd)
      ) {
        return "Intervalo exige data inicial e final diferentes.";
      }
      if (
        this._comparisonCustomResolution === "hour"
        && (
          this._civilInclusiveDays(range.baseStart, range.baseEnd) > 7
          || this._civilInclusiveDays(range.comparisonStart, range.comparisonEnd) > 7
        )
      ) {
        return "Detalhamento horário disponível para períodos de até 7 dias.";
      }
      return "";
    }

    _updateComparisonCustomFormState() {
      const form = this.shadowRoot.querySelector("[data-comparison-custom-form]");
      if (!form) return;
      const error = this._customComparisonValidation();
      const apply = form.querySelector('[data-action="comparison-apply"]');
      if (apply) apply.disabled = Boolean(error);
      const message = form.querySelector("[data-comparison-custom-validation]");
      if (message) {
        message.textContent = error;
        message.hidden = !error;
      }
    }

    _refreshComparisonCustomForm() {
      const currentOptions = this.shadowRoot.querySelector("[data-comparison-custom-options]");
      if (currentOptions) currentOptions.replaceWith(this._renderComparisonCustomOptions());
      const current = this.shadowRoot.querySelector("[data-comparison-custom-form]");
      if (current) current.replaceWith(this._renderComparisonCustomControls());
    }

    _setComparisonCustomPeriodType(type) {
      if (!["day", "range", "cycle"].includes(type)) return;
      if (this._comparisonCustomPeriodType === type) return;
      this._comparisonCustomPeriodType = type;
      // No modo ciclo nao ha rascunho de datas a acertar: as duas janelas vem
      // dos proprios ciclos de faturamento.
      if (type === "cycle") {
        this._comparisonCustomResolution = "day";
        this._comparisonCustomResolutionManual = false;
        this._comparisonCustomRange = null;
        this._comparisonRequestToken += 1;
        this._comparisonCycleApplied = false;
        this._refreshComparisonCustomForm();
        return;
      }
      if (type === "day") {
        this._comparisonCustomDraft = {
          ...this._comparisonCustomDraft,
          baseEnd: this._comparisonCustomDraft.baseStart,
          comparisonEnd: this._comparisonCustomDraft.comparisonStart,
        };
      } else {
        this._comparisonCustomDraft = {
          ...this._comparisonCustomDraft,
          baseEnd: this._comparisonCustomDraft.baseEnd
            || this._comparisonCustomDraft.baseStart,
          comparisonEnd: this._comparisonCustomDraft.comparisonEnd
            || this._comparisonCustomDraft.comparisonStart,
        };
      }
      this._comparisonCustomResolution = type === "day" ? "hour" : "day";
      this._comparisonCustomResolutionManual = false;
      this._comparisonCustomRange = null;
      this._comparisonRequestToken += 1;
      this._refreshComparisonCustomForm();
    }

    _setComparisonCustomResolution(resolution) {
      if (!["day", "hour"].includes(resolution)) return;
      if (this._comparisonCustomPeriodType === "day" && resolution !== "hour") return;
      // A janela de um ciclo tem semanas: em barras de hora seriam centenas
      // delas, e o backend recusa acima de sete dias.
      if (this._comparisonCustomPeriodType === "cycle" && resolution !== "day") return;
      this._comparisonCustomResolution = resolution;
      this._comparisonCustomResolutionManual = true;
      this._comparisonCustomRange = null;
      this._comparisonRequestToken += 1;
      this._refreshComparisonCustomForm();
    }

    _applyCustomComparison() {
      const range = this._comparisonCustomDraft;
      const validation = this._customComparisonValidation();
      if (validation) {
        this._comparisonErrors.set(this._comparisonKey(), validation);
        this._updateComparisonCustomFormState();
        return;
      }
      // No modo ciclo nao ha intervalo digitado para congelar: as janelas vem
      // dos ciclos, e o que muda entre um pedido e outro e so o corte.
      if (this._comparisonCustomPeriodType === "cycle") {
        this._comparisonCycleApplied = true;
      } else {
        this._comparisonCustomRange = { ...range };
      }
      this._comparisonRequestToken += 1;
      this._comparisonErrors.delete(this._comparisonKey());
      this._renderComparisonUpdate();
      this._loadComparison({ force: true });
    }

    _setHistoryReference(reference) {
      this._historyHighlight = null;
      if (this._historyMode === "cycle") {
        this._setHistoryCycle(reference);
        return;
      }
      const definition = this._historyReferenceDefinition();
      const selected = definition.parse(reference);
      const current = definition.parse(definition.current());
      if (!selected || !current) {
        this._historyErrors.set(this._historyKey(), "Data inválida.");
        this._render();
        return;
      }
      if (selected > current) {
        this._historyErrors.set(
          this._historyKey(),
          this._historyMode === "day"
            ? "Selecione hoje ou uma data anterior."
            : this._historyMode === "month"
              ? "Selecione o mês atual ou um mês anterior."
              : "Selecione o ano atual ou um ano anterior.",
        );
        this._render();
        return;
      }
      if (reference === this._currentHistoryReference()) return;
      this._historyReferences[this._historyMode] = reference;
      this._historyRequestToken += 1;
      this._render();
      this._loadHistory();
    }

    _setHistoryCycle(cycleId) {
      this._historyHighlight = null;
      const cycles = this._selectableHistoryCycles();
      const cycle = cycles.find((item) => item.cycle_id === cycleId);
      if (!cycle || cycle.cycle_id === this._selectedHistoryCycle()?.cycle_id) return;
      this._historyCycleIds.set(this._selectedUnit, cycle.cycle_id);
      this._historyRequestToken += 1;
      if (
        cycle.status === "closed"
        && typeof cycle.billing_reference === "string"
        && cycle.billing_reference !== this._billingReference
      ) {
        this._setBillingReference(cycle.billing_reference);
        return;
      }
      this._render();
      this._loadHistory();
    }

    _shiftHistoryCycle(amount) {
      const cycles = this._selectableHistoryCycles();
      const currentId = this._selectedHistoryCycle()?.cycle_id;
      const currentIndex = cycles.findIndex((cycle) => cycle.cycle_id === currentId);
      const targetIndex = currentIndex + amount;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= cycles.length) return;
      this._setHistoryCycle(cycles[targetIndex].cycle_id);
    }

    _shiftHistoryReference(amount) {
      if (this._historyMode === "cycle") {
        this._shiftBillingReference(-amount);
        return;
      }
      const reference = this._currentHistoryReference();
      const definition = this._historyReferenceDefinition();
      const current = definition.parse(reference);
      if (!current) return;
      if (this._historyMode === "day") {
        current.setDate(current.getDate() + amount);
      } else if (this._historyMode === "month") {
        current.setMonth(current.getMonth() + amount);
      } else {
        current.setFullYear(current.getFullYear() + amount);
      }
      const shifted = this._historyMode === "day"
        ? this._localDateValue(current)
        : this._historyMode === "month"
          ? this._localMonthValue(current)
          : this._localYearValue(current);
      const maximum = definition.current();
      if (shifted > maximum) return;
      this._setHistoryReference(shifted);
    }

    _setHistoryMode(mode) {
      if (!Object.hasOwn(HISTORY_MODES, mode) || mode === this._historyMode) return;
      this._historyHighlight = null;
      // Escolha da pessoa: o padrao "ano" da unidade so com fatura nao a
      // desfaz ao voltar para esta unidade.
      if (this._selectedUnit) this._historyModeChosen.add(this._selectedUnit);
      // Escolha feita: ela vale dali em diante, e nao ha padrao a desfazer.
      this._historyModeAntesDoPadrao = null;
      if (this._unitIsBillingOnly() && mode !== "cycle" && mode !== "year") return;
      if (mode === "month" && this._historyReferences.month === null) {
        this._historyReferences.month = this._historyReferences.day.slice(0, 7);
      }
      if (mode === "year" && this._historyReferences.year === null) {
        const sourceReference = this._historyMode === "cycle"
          ? this._historyReferences.day
          : this._currentHistoryReference();
        this._historyReferences.year = sourceReference.slice(0, 4);
      }
      this._historyMode = mode;
      this._historyRequestToken += 1;
      this._render();
      this._loadHistory();
    }

    _retryHistory() {
      const key = this._historyKey();
      this._historyErrors.delete(key);
      this._chartModuleError = "";
      this._chartModulePromise = null;
      this._render();
      if (!this._historyData(key)) {
        this._loadHistory({ force: true });
      }
    }

    _retryAudit() {
      const key = this._auditKey();
      this._auditErrors.delete(key);
      this._renderAuditUpdate();
      this._loadAudit({ force: true });
    }

    _setBillingReference(reference) {
      const referenceUnit = this._page === "overview"
        ? this._referenceUnit() : this._selectedUnit;
      const references = this._closedBillingReferences(referenceUnit);
      if (!references.includes(reference) || reference === this._billingReference) return;
      this._billingReference = reference;
      this._billingReferenceChosen = true;
      // O seletor da Visao geral e o mesmo controle: trocar a referencia em
      // Unidades tem de deixa-lo apontando para la tambem, senao as duas
      // paginas mostrariam periodos diferentes no mesmo campo.
      if (this._closedBillingReferences(this._generator).includes(reference)) {
        this._energyFlowSelection = reference;
      }
      this._historyRequestToken += 1;
      this._auditRequestToken += 1;
      this._sceeRequestToken += 1;
      this._financeRequestToken += 1;
      this._selfConsumptionRequestToken += 1;
      this._energyFlowRequestToken += 1;
      this._energyFlowData = null;
      this._energyFlowReference = reference;
      this._energyFlowError = "";
      this._render();
      if (this._historyVisible && this._historyMode === "cycle") this._loadHistory();
      this._loadAudit();
      this._loadScee();
      this._loadFinance();
      if (this._selectedUnit === this._generator) this._loadSelfConsumption();
      if (this._page === "overview") this._loadEnergyFlow({ force: true });
    }

    _setOverviewReference(value) {
      const escolha = value || null;
      if (escolha === this._energyFlowSelection) return;
      this._energyFlowSelection = escolha;
      // Uma referencia fechada tambem e a referencia da pagina: quem escolhe
      // AGO/2026 aqui espera achar AGO/2026 ao abrir Unidades. O ciclo em
      // andamento nao tem fatura, entao nao move a referencia da pagina —
      // apenas o fluxo, que sabe ler um ciclo aberto.
      if (escolha && this._closedBillingReferences(this._generator).includes(escolha)
        && escolha !== this._billingReference) {
        this._setBillingReference(escolha);
        return;
      }
      this._render();
      this._loadEnergyFlow({ force: true });
    }

    _shiftBillingReference(amount) {
      const referenceUnit = this._page === "overview"
        ? this._referenceUnit() : this._selectedUnit;
      const references = this._closedBillingReferences(referenceUnit);
      const currentIndex = references.indexOf(this._billingReference);
      const targetIndex = currentIndex + amount;
      if (currentIndex < 0 || targetIndex < 0
        || targetIndex >= references.length) return;
      this._setBillingReference(references[targetIndex]);
    }

    _retrySelfConsumption() {
      const key = this._selfConsumptionKey();
      this._selfConsumptionErrors.delete(key);
      this._renderSelfConsumptionUpdate();
      this._loadSelfConsumption({ force: true });
    }

    _handleClick(event) {
      const button = event.target.closest("button");
      if (!button || !this.shadowRoot.contains(button)) return;
      const action = button.dataset.action;
      if (action === "select-page") {
        const page = button.dataset.page;
        if (this._billingUnavailable && !PAGES_WITHOUT_BILLING.has(page)) return;
        if (this._pages().some((item) => item[0] === page)) {
          this._page = page;
          this._storeView();
          this._render();
          if (page === "overview") {
            this._loadOverviewUnits();
            this._loadEnergyFlow();
          }
          if (page === "auditoria") this._loadAllAudits();
        }
        return;
      }
      if (action === "open-unit") {
        this._page = "units";
        this._storeView();
        this._selectUnit(button.dataset.unit);
        this._render();
        return;
      }
      if (action === "select-unit") this._selectUnit(button.dataset.unit);
      if ((action === "refresh" || action === "retry") && this._page === "diagnostico") {
        this._loadDataHealth({ force: true });
      }
      if (action === "health-focus-unit") {
        const unidade = button.dataset.unit ?? "";
        this._dataHealthOpen.set(unidade, true);
        this._renderDataHealthUpdate();
        this.shadowRoot
          ?.querySelector(`[data-health-unit="${CSS.escape(unidade)}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (action === "refresh" || action === "retry") this._refresh();
      if (action === "history-mode") this._setHistoryMode(button.dataset.mode);
      if (action === "history-previous") this._shiftHistoryReference(-1);
      if (action === "history-next") this._shiftHistoryReference(1);
      if (action === "history-cycle-previous") this._shiftHistoryCycle(1);
      if (action === "history-cycle-next") this._shiftHistoryCycle(-1);
      if (action === "history-retry") this._retryHistory();
      if (action === "comparison-previous") this._shiftComparisonReference(-1);
      if (action === "comparison-next") this._shiftComparisonReference(1);
      if (action === "comparison-retry") this._retryComparison();
      if (action === "audit-issue-open") {
        this._auditIssueModal = {
          unit: button.dataset.unit,
          reference: button.dataset.reference || null,
          index: Number(button.dataset.index),
        };
        this._renderAuditIssueModalUpdate();
        return;
      }
      if (action === "audit-issue-close") {
        this._closeAuditModal();
        return;
      }
      if (action === "audit-issue-goto") {
        this._openAuditChart(button.dataset);
        return;
      }
      if (action === "audit-chart-back") {
        this._auditChartModal = null;
        this._renderAuditIssueModalUpdate();
        return;
      }
      if (action === "audit-retry") this._retryAudit();
      if (action === "billing-reference-previous") this._shiftBillingReference(1);
      if (action === "billing-reference-next") this._shiftBillingReference(-1);
      if (action === "self-consumption-retry") this._retrySelfConsumption();
      if (action === "payback-projection-retry") this._loadPaybackProjection({ force: true });
      if (action === "payback-chart-mode") {
        const modo = button.dataset.mode === "curve" ? "curve" : "bars";
        if (modo !== this._paybackChartMode) {
          this._paybackChartMode = modo;
          this._storeView();
          this._render();
        }
        return;
      }
      // Leva direto ao campo, em vez de mandar procurar: quem chegou aqui
      // veio ver o payback e descobriu que falta um numero.
      if (action === "payback-open-investment") {
        this._page = "configuracao";
        this._settingsModal = button.dataset.modal || "investimento";
        if (this._settingsModal === "extracao") this._loadInvoices({ force: true });
        this._storeView();
        this._refresh();
        return;
      }
      if (action === "distribution-open-editor" || action === "distribution-open-history") {
        this._distributionModal = action === "distribution-open-history"
          ? "historico" : "editar";
        this._renderDistributionModalUpdate();
        return;
      }
      if (action === "settings-open") {
        this._settingsModal = button.dataset.modal ?? null;
        this._renderSettingsUpdate();
        // Abrir o dialogo reapura a presenca: um sensor pode ter caido desde
        // que a pagina abriu, e e justamente isso que se vem conferir aqui.
        if (this._settingsModal === "sensores") this._loadSensors({ force: true });
        if (this._settingsModal === "unidades") this._loadModelConfig({ force: true });
        if (this._settingsModal === "extracao") this._loadInvoices({ force: true });
        if (this._settingsModal === "rateio") this._loadDistribution({ force: true });
        return;
      }
      if (action === "model-import") {
        this._importModel();
        return;
      }
      if (action === "unit-add-open") {
        this._modelNewUnit = { nome: "", gera: false };
        this._modelSaveState = "idle";
        this._modelSaveMessage = "";
        this._renderSettingsUpdate();
        return;
      }
      if (action === "unit-add-cancel") {
        this._modelNewUnit = null;
        this._renderSettingsUpdate();
        return;
      }
      if (action === "unit-add-confirm") {
        this._addUnit();
        return;
      }
      if (action === "unit-toggle") {
        const alvo = button.dataset.unit;
        const abrindo = this._modelOpenUnit !== alvo;
        this._modelOpenUnit = abrindo ? alvo : null;
        // Abrir uma unidade leva o titulo dela para o topo do dialogo. Sem
        // isso, abrir a ultima da lista deixava o conteudo fora da vista e
        // obrigava a rolar atras do que se acabou de pedir.
        this._modelScrollToUnit = abrindo ? alvo : null;
        // Fechar a unidade abandona o que estava em meio a edicao nela: o
        // rascunho pertence a linha que sumiu da tela.
        this._modelPendingMetric = null;
        this._modelPendingSwap = null;
        this._renderSettingsUpdate();
        return;
      }
      if (action === "unit-meter-swap") {
        this._modelPendingSwap = {
          unit: button.dataset.unit,
          metric: button.dataset.metric,
          entity: "",
          at: "",
          label: "",
        };
        this._modelSaveState = "idle";
        this._modelSaveMessage = "";
        this._renderSettingsUpdate();
        return;
      }
      if (action === "unit-meter-swap-cancel") {
        this._modelPendingSwap = null;
        this._renderSettingsUpdate();
        return;
      }
      if (action === "unit-meter-swap-confirm") {
        this._swapUnitMeter();
        return;
      }
      if (action === "unit-metric-new-one") {
        this._modelPendingMetric = {
          unit: button.dataset.unit, metric: button.dataset.metric,
        };
        this._renderSettingsUpdate();
        return;
      }
      if (action === "unit-metric-cancel") {
        this._modelPendingMetric = null;
        this._renderSettingsUpdate();
        return;
      }
      if (action === "unit-metric-remove") {
        const rotulo = button.dataset.label ?? "esta medição";
        // Tirar a medicao pode tirar junto o que dependia dela — autoconsumo
        // sai quando a exportacao sai. Confirmar evita a surpresa.
        if (window.confirm(
          `Excluir ${rotulo}? O que é calculado a partir dela também `
          + "deixa de existir. As leituras no Home Assistant continuam lá.",
        )) this._setUnitSensor(button.dataset.unit, button.dataset.metric, null);
        return;
      }
      if (action === "invoice-compare") {
        this._compareInvoices();
        return;
      }
      if (action === "invoice-use" || action === "invoice-unuse") {
        this._useInvoiceStorage(action === "invoice-use");
        return;
      }
      if (action === "invoice-export") {
        this._exportInvoices();
        return;
      }
      if (action === "invoice-uc-toggle") {
        this._invoiceOpenUcs ??= new Set();
        const uc = button.dataset.uc;
        if (this._invoiceOpenUcs.has(uc)) this._invoiceOpenUcs.delete(uc);
        else this._invoiceOpenUcs.add(uc);
        this._renderInvoiceUpdate();
        return;
      }
      if (action === "invoice-delete-uc") {
        this._deleteUcInvoices(button.dataset.uc, button.dataset.label ?? "esta UC");
        return;
      }
      if (action === "invoice-delete") {
        this._deleteInvoice(button.dataset.digest, button.dataset.label ?? "selecionada");
        return;
      }
      if (action === "unit-color-clear") {
        this._setUnitField(button.dataset.unit, "color", null);
        return;
      }
      if (action === "unit-image-clear") {
        this._setUnitField(button.dataset.unit, "image", null);
        return;
      }
      if (action === "unit-remove") {
        // Excluir uma unidade apaga a configuracao dela, e o historico do
        // Recorder deixa de ter quem o leia. Confirmar pelo nome evita o
        // clique errado numa lista de linhas parecidas.
        const nome = button.dataset.name ?? "esta unidade";
        if (window.confirm(
          `Excluir ${nome}? A configuração dela é apagada. `
          + "As leituras já gravadas no Home Assistant continuam lá, mas "
          + "deixam de ser exibidas.",
        )) this._removeUnit(button.dataset.unit);
        return;
      }
      if (action === "sensors-save") {
        this._saveSensors();
        return;
      }
      if (action === "sensors-reset") {
        // Restaurar e esvaziar a correspondencia, nao copiar a entidade
        // declarada para dentro dela: o YAML volta a ser a unica palavra.
        this._sensorsDraft = {};
        for (const fonte of this._sensorSources()) {
          this._sensorsDraft[fonte.declared_entity_id] = "";
        }
        this._sensorsSaveState = "idle";
        this._sensorsSaveMessage = "";
        this._renderSettingsUpdate();
        return;
      }
      if (action === "settings-vigencia-new") {
        this._settingsNewTariff = { data: "", valor: "", erro: "" };
        this._renderSettingsUpdate();
        return;
      }
      if (action === "settings-vigencia-cancel") {
        this._settingsNewTariff = null;
        this._renderSettingsUpdate();
        return;
      }
      if (action === "settings-vigencia-add") {
        this._addSettingsVigencia();
        return;
      }
      if (action === "settings-modal-close") {
        this._closeSettingsModal();
        return;
      }
      if (action === "settings-save") {
        this._saveSettings();
        return;
      }
      if (action === "settings-clear-investment") {
        if (this._settingsDraft) {
          this._settingsDraft.investimento = "";
          this._settingsDraft.investimentoMes = "";
        }
        this._settingsSaveState = "idle";
        this._settingsSaveMessage = "";
        this._renderSettingsUpdate();
        return;
      }
      if (action === "settings-reset") {
        // Restaurar e esvaziar o ajuste, nao copiar o declarado para dentro
        // dele: o YAML continua sendo a base, e o campo vazio e como se diz
        // isso ao backend.
        this._settingsDraft = {
          boundary: "", tarifas: {}, investimento: "", investimentoMes: "",
        };
        for (const ano of Object.keys(
          this._settings?.distributor_tariffs?.declared ?? {},
        )) this._settingsDraft.tarifas[ano] = "";
        this._settingsSaveState = "idle";
        this._settingsSaveMessage = "";
        this._renderSettingsUpdate();
        return;
      }
      if (action === "energy-flow-period-kind") {
        this._setEnergyFlowPeriodKind(button.dataset.periodKind);
        return;
      }
      if (action === "energy-flow-period-previous") {
        this._shiftEnergyFlowCalendar(-1);
        return;
      }
      if (action === "energy-flow-period-next") {
        this._shiftEnergyFlowCalendar(1);
        return;
      }
      if (action === "energy-flow-quality") {
        this._openQualityModal();
        return;
      }
      if (action === "quality-modal-close") {
        this._closeQualityModal();
        return;
      }
      if (action === "distribution-modal-close") {
        this._distributionModal = null;
        this._renderDistributionModalUpdate();
        return;
      }
      if (action === "distribution-edit") this._startDistributionMode("edit");
      if (action === "distribution-schedule") this._startDistributionMode("schedule");
      if (action === "distribution-close") {
        this._distributionMode = "idle";
        this._distributionDraft = null;
        this._distributionConfirmation = null;
        this._distributionMutationState = "idle";
        this._distributionMutationMessage = "";
        this._renderDistributionUpdate();
      }
      if (action === "distribution-review-immediate" && this._distributionDraftIsValid()) {
        this._distributionConfirmation = "immediate";
        this._renderDistributionUpdate();
      }
      if (action === "distribution-review-schedule" && this._distributionScheduleIsValid()) {
        this._distributionConfirmation = "schedule";
        this._renderDistributionUpdate();
      }
      if (action === "distribution-review-cancel" && this._distributionData?.scheduled) {
        this._distributionConfirmation = "cancel";
        this._renderDistributionUpdate();
      }
      if (action === "distribution-dismiss-confirmation") {
        this._distributionConfirmation = null;
        this._renderDistributionUpdate();
      }
      if (action === "distribution-confirm-immediate") this._mutateDistribution("immediate");
      if (action === "distribution-confirm-schedule") this._mutateDistribution("schedule");
      if (action === "distribution-confirm-cancel") this._mutateDistribution("cancel");
      if (action === "comparison-strategy") {
        this._setComparisonStrategy(button.dataset.strategy);
      }
      if (action === "comparison-period-type") {
        this._setComparisonCustomPeriodType(button.dataset.periodType);
      }
      if (action === "comparison-resolution") {
        this._setComparisonCustomResolution(button.dataset.resolution);
      }
      if (action === "comparison-cycle-now") {
        // Limpar o corte E comparar: o botao existe para voltar ao "agora", e
        // parar no meio do caminho obrigava um segundo clique sem motivo.
        this._comparisonCycleCut = "";
        this._renderComparisonSectionUpdate();
        this._applyCustomComparison();
        return;
      }
      if (action === "comparison-apply") this._applyCustomComparison();
    }

    _handleChange(event) {
      const billingReference = event.target.closest(
        'select[data-action="billing-reference"]',
      );
      if (billingReference && this.shadowRoot.contains(billingReference)) {
        this._setBillingReference(billingReference.value);
        return;
      }
      const auditUnit = event.target.closest('select[data-action="audit-unit"]');
      if (auditUnit && this.shadowRoot.contains(auditUnit)) {
        this._setAuditUnitScope(auditUnit.value);
        return;
      }
      const auditScope = event.target.closest('select[data-action="audit-scope"]');
      if (auditScope && this.shadowRoot.contains(auditScope)) {
        this._setAuditScope(auditScope.value);
        return;
      }
      const overviewReference = event.target.closest(
        'select[data-action="overview-reference"]',
      );
      if (overviewReference && this.shadowRoot.contains(overviewReference)) {
        this._setOverviewReference(overviewReference.value);
        return;
      }
      const historyCycle = event.target.closest(
        'select[data-action="history-cycle"]',
      );
      if (historyCycle && this.shadowRoot.contains(historyCycle)) {
        this._setHistoryCycle(historyCycle.value);
        return;
      }
      const comparisonMetric = event.target.closest(
        'select[data-action="comparison-metric"]',
      );
      if (comparisonMetric && this.shadowRoot.contains(comparisonMetric)) {
        this._setComparisonLogicalId(comparisonMetric.value);
        return;
      }
      const comparisonMode = event.target.closest(
        'select[data-action="comparison-mode"]',
      );
      if (comparisonMode && this.shadowRoot.contains(comparisonMode)) {
        this._setComparisonMode(comparisonMode.value);
        return;
      }
      const comparisonReference = event.target.closest(
        'input[data-action="comparison-reference"]',
      );
      if (comparisonReference && this.shadowRoot.contains(comparisonReference)) {
        this._setComparisonReference(comparisonReference.value);
        return;
      }
      const customDate = event.target.closest(
        'input[data-action="comparison-custom-date"]',
      );
      if (customDate && this.shadowRoot.contains(customDate)) {
        this._setComparisonCustomDraft(customDate.dataset.field, customDate.value);
        return;
      }
      const flowDate = event.target.closest(
        'input[data-action="energy-flow-period-date"]',
      );
      if (flowDate && this.shadowRoot.contains(flowDate)) {
        this._setEnergyFlowCalendar(flowDate.value);
        return;
      }
      const settingsBoundary = event.target.closest(
        'input[data-action="settings-boundary"]',
      );
      if (settingsBoundary && this.shadowRoot.contains(settingsBoundary)) {
        this._setSettingsDraft("boundary", settingsBoundary.value);
        return;
      }
      const investimento = event.target.closest(
        'input[data-action="settings-investment"]',
      );
      if (investimento && this.shadowRoot.contains(investimento)) {
        this._setSettingsDraft(investimento.dataset.field, investimento.value);
        return;
      }
      const sensorEntity = event.target.closest(
        'input[data-action="sensor-entity"]',
      );
      if (sensorEntity && this.shadowRoot.contains(sensorEntity)) {
        this._setSensorDraft(sensorEntity.dataset.declared, sensorEntity.value);
        return;
      }
      const unitName = event.target.closest('input[data-action="unit-name"]');
      if (unitName && this.shadowRoot.contains(unitName)) {
        const valor = unitName.value.trim();
        // Campo vazio nao apaga o nome: o backend recusaria, e o operador
        // ficaria com um erro no lugar do nome que ele ainda esta digitando.
        if (valor) this._setUnitField(unitName.dataset.unit, "name", valor);
        else this._renderSettingsUpdate();
        return;
      }
      const unitColor = event.target.closest('input[data-action="unit-color"]');
      if (unitColor && this.shadowRoot.contains(unitColor)) {
        this._setUnitField(unitColor.dataset.unit, "color", unitColor.value);
        return;
      }
      const unitMeasured = event.target.closest(
        'input[data-action="unit-measured"]',
      );
      if (unitMeasured && this.shadowRoot.contains(unitMeasured)) {
        this._setUnitField(
          unitMeasured.dataset.unit, "measured", unitMeasured.checked,
        );
        return;
      }
      const unitRole = event.target.closest('input[data-action="unit-role"]');
      if (unitRole && this.shadowRoot.contains(unitRole)) {
        this._setUnitField(
          unitRole.dataset.unit,
          "role",
          unitRole.checked ? ROLE_GENERATOR : ROLE_CONSUMER,
        );
        return;
      }
      const metricEntity = event.target.closest(
        'input[data-action="unit-metric-entity"]',
      );
      if (metricEntity && this.shadowRoot.contains(metricEntity)) {
        const valor = metricEntity.value.trim();
        // Campo esvaziado nao remove a medicao em silencio: remover tem botao
        // proprio, com confirmacao, porque leva junto o que dependia dela.
        if (valor) {
          this._setUnitSensor(
            metricEntity.dataset.unit, metricEntity.dataset.metric, valor,
          );
        } else {
          this._renderSettingsUpdate();
        }
        return;
      }
      const sourceEntity = event.target.closest(
        'input[data-action="unit-source-entity"]',
      );
      if (sourceEntity && this.shadowRoot.contains(sourceEntity)) {
        const valor = sourceEntity.value.trim();
        // Uma grandeza com duas fontes nao se resolve trocando a entidade no
        // lugar: cada fonte cobre um trecho, e o comando precisa saber qual.
        if (valor && valor !== sourceEntity.dataset.entity) {
          this._setUnitSensor(
            sourceEntity.dataset.unit, sourceEntity.dataset.metric, valor,
          );
        } else {
          this._renderSettingsUpdate();
        }
        return;
      }
      const swapField = event.target.closest(
        'input[data-action="swap-entity"], input[data-action="swap-at"],'
        + ' input[data-action="swap-label"]',
      );
      if (swapField && this.shadowRoot.contains(swapField)) {
        if (!this._modelPendingSwap) return;
        const campo = {
          "swap-entity": "entity", "swap-at": "at", "swap-label": "label",
        }[swapField.dataset.action];
        this._modelPendingSwap[campo] = swapField.value;
        return;
      }
      const metricNew = event.target.closest(
        'select[data-action="unit-metric-new"]',
      );
      if (metricNew && this.shadowRoot.contains(metricNew)) {
        const metric = metricNew.value;
        metricNew.value = "";
        if (!metric) return;
        // A grandeza nasce sem sensor e com o campo pronto para receber um.
        // Gravar so acontece quando houver entidade: o modelo nao aceita uma
        // serie sem fonte, e nem deveria.
        this._modelPendingMetric = { unit: metricNew.dataset.unit, metric };
        this._renderSettingsUpdate();
        return;
      }
      const pastaFaturas = event.target.closest(
        'input[data-action="invoice-folder"], input[data-action="invoice-files"]',
      );
      if (pastaFaturas && this.shadowRoot.contains(pastaFaturas)) {
        const arquivos = Array.from(pastaFaturas.files ?? []);
        // Limpo antes de ler: escolher a mesma pasta de novo no mes seguinte
        // precisa disparar o evento outra vez.
        pastaFaturas.value = "";
        // Diz na hora o que o seletor entregou. Sem isso, um seletor que
        // devolve nada — o do celular, com a pasta de cima — deixava a tela
        // igual, e parecia que o clique nao tinha pegado.
        const pdfs = arquivos.filter((a) => /\.pdf$/i.test(a.name ?? "")).length;
        this._invoiceNotice(
          `Encontrei ${arquivos.length} arquivo${arquivos.length === 1 ? "" : "s"}, `
          + `${pdfs} PDF${pdfs === 1 ? "" : "s"}.`
          + (pdfs ? " Conferindo quais são novos…" : ""),
          pdfs ? "ok" : "warn",
        );
        this._importInvoiceFiles(arquivos);
        return;
      }
      const donoUc = event.target.closest('select[data-action="invoice-uc-owner"]');
      if (donoUc && this.shadowRoot.contains(donoUc)) {
        this._setInvoiceUcOwner(donoUc.dataset.uc, donoUc.value || null);
        return;
      }
      const unitImage = event.target.closest('input[data-action="unit-image"]');
      if (unitImage && this.shadowRoot.contains(unitImage)) {
        const arquivo = unitImage.files?.[0];
        // O campo e limpo antes do envio: sem isso, escolher o mesmo arquivo
        // duas vezes seguidas nao dispara o evento na segunda.
        unitImage.value = "";
        this._uploadUnitImage(unitImage.dataset.unit, arquivo);
        return;
      }
      const novaUnidade = event.target.closest(
        'input[data-action="unit-new-name"], input[data-action="unit-new-role"]',
      );
      if (novaUnidade && this.shadowRoot.contains(novaUnidade)) {
        if (!this._modelNewUnit) return;
        if (novaUnidade.dataset.action === "unit-new-name") {
          this._modelNewUnit.nome = novaUnidade.value;
        } else {
          this._modelNewUnit.gera = novaUnidade.checked;
        }
        return;
      }
      const novaVigencia = event.target.closest(
        'input[data-action="settings-vigencia-date"],'
        + ' input[data-action="settings-vigencia-value"]',
      );
      if (novaVigencia && this.shadowRoot.contains(novaVigencia)) {
        if (!this._settingsNewTariff) return;
        const campo = novaVigencia.dataset.action === "settings-vigencia-date"
          ? "data" : "valor";
        this._settingsNewTariff[campo] = novaVigencia.value;
        this._settingsNewTariff.erro = "";
        return;
      }
      const settingsTariff = event.target.closest(
        'input[data-action="settings-tariff"]',
      );
      if (settingsTariff && this.shadowRoot.contains(settingsTariff)) {
        this._setSettingsDraft(
          "tarifa", settingsTariff.value, settingsTariff.dataset.vigencia,
        );
        return;
      }
      const cycleCut = event.target.closest(
        'input[data-action="comparison-cycle-cut"]',
      );
      if (cycleCut && this.shadowRoot.contains(cycleCut)) {
        this._comparisonCycleCut = cycleCut.value ?? "";
        // So redesenha o formulario: a comparacao em si espera o "Comparar",
        // como nos outros modos personalizados.
        this._comparisonCycleApplied = false;
        this._renderComparisonSectionUpdate();
        return;
      }
      const input = event.target.closest('input[data-action="history-date"]');
      if (!input || !this.shadowRoot.contains(input)) return;
      this._setHistoryReference(input.value);
    }

    _handleInput(event) {
      const input = event.target.closest("[data-distribution-field]");
      if (!input || !this.shadowRoot.contains(input) || !this._distributionDraft) return;
      const field = input.dataset.distributionField;
      if (field === "label" || field === "date" || field === "time") {
        this._distributionDraft[field] = input.value;
      } else if (this._units().some((unit) => unit.id === field)) {
        this._distributionDraft.shares[field] = input.value;
      } else {
        return;
      }
      this._distributionConfirmation = null;
      this._distributionMutationMessage = "";
      this._renderDistributionUpdate();
      const replacement = this.shadowRoot.querySelector(
        `[data-distribution-field="${field}"]`,
      );
      replacement?.focus();
      if (replacement?.setSelectionRange) {
        const end = replacement.value.length;
        replacement.setSelectionRange(end, end);
      }
    }

    _element(tag, className = "", text = null) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== null && text !== undefined) element.textContent = String(text);
      return element;
    }

    _button(text, action, className = "button") {
      const button = this._element("button", className, text);
      button.type = "button";
      button.dataset.action = action;
      return button;
    }

    _formatNumber(value, maximumFractionDigits = 3, minimumFractionDigits = 0) {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "Indisponível";
      }
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(Number(value));
    }

    _formatCurrency(value, currency) {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "Indisponível";
      }
      if (typeof currency !== "string" || !currency.trim()) {
        return this._formatNumber(value, 2);
      }
      try {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency,
        }).format(Number(value));
      } catch {
        return this._formatNumber(value, 2);
      }
    }

    _translateCycleStatus(value) {
      const translations = new Map([
        ["open", "Aberto"],
        ["no_base", "Sem base"],
      ]);
      return translations.get(value) ?? value;
    }

    _translateClassification(value) {
      const translations = new Map([
        ["official", "Oficial"],
        ["measured", "Medido"],
        ["calculated", "Calculado"],
        ["projected", "Projetado"],
        ["estimated", "Estimado"],
        ["unavailable", "Indisponível"],
      ]);
      return translations.get(value) ?? value;
    }

    _displayUnit(unit) {
      return unit === "cos_phi" ? "cos φ" : unit;
    }

    _unitMismatchDetail(measurement) {
      const declared = measurement.unit ?? measurement.expected_unit;
      return [
        measurement.state_unit
          ? `entidade reporta ${this._displayUnit(measurement.state_unit)}`
          : "entidade sem unidade",
        declared
          ? `modelo declara ${this._displayUnit(declared)}`
          : "modelo sem unidade declarada",
      ].join(", ");
    }

    _formatDate(value) {
      if (!value) return "—";
      let date;
      let includeTime = false;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(value);
        includeTime = String(value).includes("T");
      }
      if (!Number.isFinite(date.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        ...(includeTime ? { timeStyle: "short" } : {}),
      }).format(date);
    }

    _escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]);
    }

    _formatHistoryNumber(value) {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "Indisponível";
      }
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }).format(Number(value));
    }

    _formatHistoryHour(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      return `${new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        hour12: false,
      }).format(date)}h`;
    }

    _formatHistoryDay(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
    }

    _formatHistoryCycleDay(value) {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
      if (match) return `${match[3]}/${match[2]}`;
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(date);
    }

    _formatBillingMethod(value) {
      if (typeof value !== "string" || !value.trim()) return null;
      const official = value.trim();
      const normalized = official.toLocaleUpperCase("pt-BR");
      if (normalized === "LIDA") return "Lida";
      if (normalized === "MEDIA" || normalized === "MÉDIA") return "Média";
      if (["AUTOLEITURA", "AUTO_LEITURA", "AUTO LEITURA"].includes(normalized)) {
        return "Autoleitura";
      }
      return official;
    }

    _formatHistoryCycleDate(value) {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
      if (match) return `${match[3]}/${match[2]}/${match[1]}`;
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
    }

    _formatHistoryCycleTime(value) {
      const match = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/.exec(String(value));
      return match ? `${match[1]}:${match[2]}` : "—";
    }

    _predictedCycleReference(value) {
      const match = /^(\d{4})-(\d{2})-\d{2}/.exec(String(value));
      if (!match) return null;
      const months = [
        "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
        "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
      ];
      const month = months[Number(match[2]) - 1];
      return month ? `${month}/${match[1]}` : null;
    }

    _openCycleState(cycle) {
      if (!this._isOpenCycle(cycle)) return null;
      if (!cycle?.expected_end) return "Ciclo em andamento";
      return `Ciclo em andamento · Próxima leitura prevista: ${this._formatHistoryCycleDate(cycle.expected_end)}`;
    }

    _provisionalCycleState(cycle) {
      return this._isProvisionalCycle(cycle)
        ? "Período provisório · aguardando fatura oficial"
        : null;
    }

    _cycleOptionLabel(cycle) {
      if (this._isOpenCycle(cycle)) {
        const start = cycle?.period?.start;
        const predictedReference = cycle?.predicted_reference
          ?? this._predictedCycleReference(cycle?.expected_end);
        if (predictedReference && start) {
          return `${predictedReference} · ${this._formatHistoryCycleDay(start)} · Em andamento`;
        }
        return start
          ? `CICLO ATUAL · ${this._formatHistoryCycleDay(start)} · Em andamento`
          : "CICLO ATUAL · Em andamento";
      }
      if (this._isProvisionalCycle(cycle)) {
        const reference = cycle?.predicted_reference ?? "CICLO PROVISÓRIO";
        if (!cycle?.period?.start || !cycle?.period?.end) return reference;
        return `${reference} · ${this._formatHistoryCycleDay(cycle.period.start)} → ${this._formatHistoryCycleDay(cycle.period.end)}`;
      }
      const reference = cycle?.billing_reference ?? "—";
      if (!cycle?.period?.start || !cycle?.period?.end) return reference;
      return `${reference} · ${this._formatHistoryCycleDay(cycle.period.start)} → ${this._formatHistoryCycleDay(cycle.period.end)}`;
    }

    _formatHistoryMonth(value, includeYear = false) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      const formatted = new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        ...(includeYear ? { year: "numeric" } : {}),
        timeZone: "UTC",
      }).format(date).replaceAll(".", "").toUpperCase();
      return includeYear ? formatted.replace(" DE ", "/") : formatted;
    }

    _formatHistoryTime(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    }

    _translateHistoryIssue(reason) {
      const translations = new Map([
        ["partial_bucket", "Intervalo incompleto"],
        ["missing_change", "Variação de energia ausente"],
        ["skip_first_change", "Primeira variação descartada na troca de fonte"],
        ["negative_change", "Variação negativa descartada"],
        ["max_change_exceeded", "Variação acima do limite descartada"],
      ]);
      return translations.get(reason) ?? reason;
    }

    _historyDefaultLegend(data) {
      if (!this._generator) {
        return Object.fromEntries(
          (data.series ?? []).map((series) => [series.label, true]),
        );
      }
      return Object.fromEntries((data.series ?? []).map((series) => [
        series.label,
        ![
          this._generator + ".import_energy",
          this._generator + ".export_energy",
          this._generator + ".self_consumption",
        ].includes(series.logical_id),
      ]));
    }

    // No modal da auditoria so importacao e exportacao vem ligadas: e esse o
    // par que a tabela confronta com a fatura. Geracao e consumo fisico ficam
    // na legenda, a um clique, mas fora do desenho inicial — eles sao uma ordem
    // de grandeza maiores e achatam justamente as barras em questao.
    _auditChartLegend(data) {
      const series = Array.isArray(data?.series) ? data.series : [];
      if (series.length < 2) return null;
      const alvo = new Set(["import_energy", "export_energy"]);
      const selecao = {};
      let algum = false;
      for (const item of series) {
        const ligado = alvo.has(String(item?.logical_id ?? "").split(".").pop());
        selecao[item.label] = ligado;
        if (ligado) algum = true;
      }
      // Beneficiaria nao tem esse par: sem isto o grafico dela abriria vazio.
      return algum ? selecao : null;
    }

    _historyLegendKey(data) {
      return `${data.unit_id}|${data.mode ?? this._historyMode}`;
    }

    _historyLegend(data) {
      const key = this._historyLegendKey(data);
      if (!this._historyLegendSelection.has(key)) {
        this._historyLegendSelection.set(
          key,
          this._historyDefaultLegend(data),
        );
      }
      return this._historyLegendSelection.get(key);
    }

    _billingOnlyChartData(unit = this._selectedUnit) {
      if (!this._unitIsBillingOnly(unit)) return null;
      const cycle = this._selectedHistoryCycle(unit);
      if (!cycle || !this._cycleHasOfficialConsumption(cycle)) return null;
      const numericValue = cycle.official_consumption?.value;
      const points = [{
        start: cycle.billing_reference,
        end: cycle.billing_reference,
        value: typeof numericValue === "number" && Number.isFinite(numericValue)
          ? numericValue : null,
        complete: true,
        issues: [],
        cycle,
      }];
      return {
        billingOnly: true,
        available: true,
        unit_id: unit,
        mode: "cycle",
        reference: cycle.billing_reference,
        series: [{
          logical_id: `${unit}.official_cycle_consumption`,
          label: "Consumo oficial do ciclo",
          unit: "kWh",
          total: points[0].value,
          points,
        }],
      };
    }

    _billingOnlyTooltip(data, params) {
      const entry = (Array.isArray(params) ? params : [params]).find(
        (item) => Number.isInteger(item?.dataIndex),
      );
      const point = data.series?.[0]?.points?.[entry?.dataIndex];
      const cycle = point?.cycle;
      if (!cycle || point.value === null || point.value === undefined) return "";
      const period = cycle.billing_cycle_period?.start && cycle.billing_cycle_period?.end
        ? `${this._formatHistoryCycleDay(cycle.billing_cycle_period.start)} → ${this._formatHistoryCycleDay(cycle.billing_cycle_period.end)}`
        : "Indisponível";
      const diagnostic = cycle.billing_reading_diagnostic ?? {};
      const diagnosticLabels = {
        compatible: "Compatível com o ciclo",
        possible_estimate: "Possível média/estimativa",
        unknown: "Não determinada",
      };
      const readingDays = Number.isInteger(diagnostic.reading_days)
        ? String(diagnostic.reading_days)
        : "Indisponível";
      const billingMethod = this._formatBillingMethod(cycle.billing_method);
      const billingDetail = billingMethod
        ? `<small>Tipo de faturamento: ${this._escapeHtml(billingMethod)}</small>`
        : `<small>Situação da leitura: ${this._escapeHtml(diagnosticLabels[diagnostic.classification] ?? diagnosticLabels.unknown)}</small>`;
      const formattedOfficialReading = diagnostic.reported_previous
        ? this._formatDate(diagnostic.reported_previous)
        : null;
      const officialLastReading = ["Média", "Autoleitura"].includes(billingMethod)
        && formattedOfficialReading
        && formattedOfficialReading !== "—"
        ? `<small>Última leitura da ${this._escapeHtml(this._distributorLabel("distribuidora"))}: ${this._escapeHtml(formattedOfficialReading)}</small>`
        : "";
      const reportedPrevious = !billingMethod
        && diagnostic.classification === "possible_estimate"
        && diagnostic.reported_previous
        ? `<small>Leitura anterior informada: ${this._escapeHtml(this._formatDate(diagnostic.reported_previous))}</small>`
        : "";
      return `<section class="history-tooltip"><b>${this._escapeHtml(cycle.billing_reference)}</b><div><strong>Consumo oficial</strong><span>${this._escapeHtml(`${this._formatHistoryNumber(point.value)} kWh`)}</span></div><small>Período do ciclo: ${this._escapeHtml(period)}</small><small>Dias faturados: ${this._escapeHtml(readingDays)}</small>${billingDetail}${officialLastReading}${reportedPrevious}<small>Fonte: ${this._escapeHtml(this._distributorLabel())}</small><small>Classificação: Oficial</small></section>`;
    }

    _historyTooltip(data, params) {
      if (data.billingOnly) return this._billingOnlyTooltip(data, params);
      const entries = Array.isArray(params) ? params : [params];
      const dataIndex = entries.find((entry) => Number.isInteger(entry?.dataIndex))
        ?.dataIndex;
      if (!Number.isInteger(dataIndex)) return "";
      const firstPoint = data.series?.[0]?.points?.[dataIndex];
      if (!firstPoint) return "";

      const isYear = data.mode === "year";
      const isMonth = data.mode === "month";
      const isCycle = data.mode === "cycle";
      const date = isYear
        ? this._formatHistoryMonth(firstPoint.start, true)
        : isCycle
          ? this._formatHistoryCycleDate(firstPoint.start)
          : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })
            .format(new Date(firstPoint.start));
      const interval = isMonth || isYear
        ? ""
        : isCycle
          ? ` · ${this._formatHistoryCycleTime(firstPoint.start)} → ${this._formatHistoryCycleTime(firstPoint.end)}`
          : ` · ${this._formatHistoryTime(firstPoint.start)}–${this._formatHistoryTime(firstPoint.end)}`;
      const pointStart = new Date(firstPoint.start).getTime();
      const pointEnd = new Date(firstPoint.end).getTime();
      const isCurrentBucket = (isMonth || isYear)
        && firstPoint.complete === false
        && pointStart <= Date.now()
        && Date.now() < pointEnd;
      const isOpenCycleBucket = isCycle
        && this._isOpenCycle()
        && firstPoint.complete === false
        && dataIndex === (data.series?.[0]?.points?.length ?? 0) - 1;
      const rows = (data.series ?? []).map((series) => {
        const point = series.points?.[dataIndex];
        const value = point?.value === null || point?.value === undefined
          ? "Indisponível"
          : `${this._formatHistoryNumber(point.value)} kWh`;
        const issues = Array.isArray(point?.issues) && point.issues.length
          ? `<small>${point.issues.map((issue) => this._escapeHtml(
            this._translateHistoryIssue(issue),
          )).join(" · ")}</small>`
          : "";
        return `<div><strong>${this._escapeHtml(series.label)}</strong><span>${this._escapeHtml(value)}</span>${issues}</div>`;
      }).join("");
      const progress = isCurrentBucket || isOpenCycleBucket
        ? `<small>${isYear ? "Mês em andamento" : "Dia em andamento"}</small>`
        : "";
      return `<section class="history-tooltip"><b>${this._escapeHtml(date)}${this._escapeHtml(interval)}</b>${progress}${rows}</section>`;
    }

    _historyChartOptions(
      data,
      destaque = this._historyPanelHighlight(),
      legenda = null,
    ) {
      const series = Array.isArray(data.series) ? data.series : [];
      const points = series[0]?.points ?? [];
      const multiple = series.length > 1;
      // A legenda de fora nao entra no _historyLegendSelection: ela vale so
      // para este desenho. Gravar ali mudaria a legenda do painel de historico,
      // que e outro grafico com outra pergunta.
      const selected = legenda ?? this._historyLegend(data);
      // A faixa vai numa serie so — repetida em todas, a mesma area seria
      // pintada varias vezes e ficaria mais escura. Mas tem de ser uma serie
      // ligada: numa desligada o ECharts esconde o markArea junto com as
      // barras, e a faixa sumia sem aviso.
      const indiceFaixa = Math.max(0, series.findIndex(
        (item) => selected?.[item.label] !== false,
      ));
      const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches === true;
      return {
        ...this._chartBase(),
        animation: !reducedMotion,
        grid: {
          left: 58,
          right: 18,
          top: multiple ? 58 : 28,
          bottom: 48,
          containLabel: false,
        },
        legend: {
          show: multiple,
          type: "plain",
          top: 4,
          selected,
          ...this._chartLegendSkin(),
        },
        tooltip: {
          trigger: "axis",
          confine: true,
          transitionDuration: 0,
          hideDelay: 0,
          enterable: false,
          formatter: (params) => this._historyTooltip(data, params),
          ...this._chartTooltipSkin(),
        },
        xAxis: {
          type: "category",
          data: points.map((point) => point.start),
          ...this._chartCategoryAxisSkin(),
          axisLabel: {
            color: this._chartInk(),
            fontSize: 11,
            hideOverlap: true,
            formatter: (value) => (
              data.billingOnly
                ? value
                : data.mode === "year"
                ? this._formatHistoryMonth(value)
                : data.mode === "month"
                  ? this._formatHistoryDay(value)
                  : data.mode === "cycle"
                    ? this._formatHistoryCycleDay(value)
                  : this._formatHistoryHour(value)
            ),
          },
        },
        yAxis: {
          type: "value",
          min: 0,
          name: "Energia (kWh)",
          nameLocation: "middle",
          nameGap: 43,
          ...this._chartValueAxisSkin(),
        },
        series: series.map((item, index) => ({
          id: item.logical_id,
          name: item.label,
          type: "bar",
          data: item.points.map((point) => (
            point.value === null || point.value === undefined ? null : point.value
          )),
          barMaxWidth: multiple ? 22 : 34,
          ...(this._historySeriesColor(item)
            ? { itemStyle: { color: this._historySeriesColor(item) } }
            : {}),
          ...(index === indiceFaixa ? this._historyMarkArea(points, destaque) : {}),
        })),
      };
    }

    // Cor amarrada ao logical_id, nao a posicao na lista. Reordenar as series
    // no backend passa a ser seguro: cada grandeza leva a sua cor junto, em vez
    // de herdar a que calhar de estar naquele indice da paleta.
    _historySeriesColor(series) {
      return METRIC_COLORS[
        String(series?.logical_id ?? "").split(".").pop()
      ] ?? null;
    }

    // O destaque do painel de historico, que so vale para a unidade que esta
    // selecionada. O modal da auditoria passa o seu proprio por argumento,
    // justamente porque ele nao mexe na selecao.
    _historyPanelHighlight() {
      const destaque = this._historyHighlight;
      if (!destaque || destaque.unit !== this._selectedUnit) return null;
      return destaque;
    }

    // Faixas da auditoria sobre o grafico. Cada barra cobre um periodo, nao um
    // instante, entao o teste e de sobreposicao: a barra acende quando ela e a
    // janela se cruzam. Testar so o inicio da barra perderia o dia parcial em
    // que a falha comecou, que e justamente o que se quer ver.
    _historyMarkArea(points, destaque) {
      if (!destaque || !Array.isArray(destaque.events) || !destaque.events.length) {
        return {};
      }
      if (!Array.isArray(points) || !points.length) return {};
      const intervalos = points.map((point) => ({
        inicio: Date.parse(point.start),
        fim: Date.parse(point.end),
      }));
      const trechos = [];
      for (const janela of destaque.events) {
        const inicio = Date.parse(janela.start);
        const fim = Date.parse(janela.end);
        if (!Number.isFinite(inicio) || !Number.isFinite(fim)) continue;
        const dentro = [];
        intervalos.forEach((barra, index) => {
          if (!Number.isFinite(barra.inicio) || !Number.isFinite(barra.fim)) return;
          if (barra.inicio < fim && barra.fim > inicio) dentro.push(index);
        });
        if (dentro.length) trechos.push([dentro[0], dentro.at(-1)]);
      }
      if (!trechos.length) return {};

      // Janelas vizinhas caem na mesma barra e pintariam duas vezes, deixando
      // aquele trecho mais escuro do que os outros sem querer.
      trechos.sort((a, b) => a[0] - b[0]);
      const unidos = [trechos[0]];
      for (const [de, ate] of trechos.slice(1)) {
        const anterior = unidos.at(-1);
        if (de <= anterior[1] + 1) anterior[1] = Math.max(anterior[1], ate);
        else unidos.push([de, ate]);
      }
      const faixas = unidos.map(([de, ate]) => [
        { xAxis: points[de].start },
        { xAxis: points[ate].start },
      ]);
      return {
        markArea: {
          silent: true,
          itemStyle: { color: "rgba(229, 83, 75, 0.16)" },
          label: {
            show: true,
            position: "insideTop",
            distance: 4,
            color: "rgba(229, 83, 75, 0.9)",
            fontSize: 9,
            formatter: "sem dados",
          },
          data: faixas,
        },
      };
    }

    _formatComparisonReference(reference) {
      const range = String(reference).split("/");
      if (range.length === 2) {
        return this._formatComparisonPeriodDates(range[0], range[1]);
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(reference))) {
        return this._formatComparisonDate(reference);
      }
      const match = /^(\d{4})-(\d{2})$/.exec(String(reference));
      if (!match) return String(reference ?? "—");
      const months = [
        "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
        "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
      ];
      return `${months[Number(match[2]) - 1] ?? match[2]}/${match[1]}`;
    }

    _formatComparisonDate(value) {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
      return match ? `${match[3]}/${match[2]}/${match[1]}` : "—";
    }

    _formatComparisonPeriodDates(startDate, endDate) {
      const start = this._formatComparisonDate(startDate);
      const end = this._formatComparisonDate(endDate);
      return String(startDate) === String(endDate) ? start : `${start} → ${end}`;
    }

    _comparisonSideLabel(side) {
      const range = side?.requested_range;
      if (range?.start_date && range?.end_date) {
        return this._formatComparisonPeriodDates(range.start_date, range.end_date);
      }
      return this._formatComparisonReference(side?.reference);
    }

    _comparisonPointDay(point) {
      const match = /^\d{4}-\d{2}-(\d{2})/.exec(String(point?.start));
      const day = match ? Number(match[1]) : NaN;
      return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
    }

    _comparisonPointsByDay(series) {
      const result = new Map();
      for (const point of series?.points ?? []) {
        const day = this._comparisonPointDay(point);
        if (day !== null) result.set(day, point);
      }
      return result;
    }

    _comparisonIsMultiDayHourly(data) {
      return data.strategy === "custom"
        && data.resolution === "hour"
        && [data.base, data.comparison].some((side) => (
          side?.requested_range?.start_date !== side?.requested_range?.end_date
        ));
    }

    _comparisonTooltip(data, params) {
      const entries = Array.isArray(params) ? params : [params];
      const dataIndex = entries.find((entry) => Number.isInteger(entry?.dataIndex))
        ?.dataIndex;
      if (!Number.isInteger(dataIndex)) return "";
      const day = dataIndex + 1;
      const sides = [data.comparison, data.base];
      const rows = sides.map((side) => {
        const point = data.strategy === "custom" || data.mode !== "month"
          ? side.series.points?.[dataIndex]
          : this._comparisonPointsByDay(side.series).get(day);
        const value = typeof point?.value === "number" && Number.isFinite(point.value)
          ? `${this._formatHistoryNumber(point.value)} ${side.series.unit}`
          : "Indisponível";
        const date = (data.strategy === "custom" || data.mode !== "month") && point?.start
          ? `<small>${this._escapeHtml(
            data.resolution === "hour"
              ? `${this._formatComparisonDate(point.start)} · ${this._formatHistoryHour(point.start)}h`
              : this._formatComparisonDate(point.start),
          )}</small>`
          : "";
        const incomplete = point?.complete === false
          ? "<small>Intervalo em andamento</small>"
          : "";
        const issues = Array.isArray(point?.issues) && point.issues.length
          ? `<small>${point.issues.map((issue) => this._escapeHtml(
            this._translateHistoryIssue(issue),
          )).join(" · ")}</small>`
          : "";
        return `<div><strong>${this._escapeHtml(this._comparisonSideLabel(side))}</strong><span>${this._escapeHtml(value)}</span>${date}${incomplete}${issues}</div>`;
      }).join("");
      const title = data.resolution === "hour"
        ? this._comparisonIsMultiDayHourly(data)
          ? `Dia ${Math.floor(dataIndex / 24) + 1} · ${String(dataIndex % 24).padStart(2, "0")}h`
          : `${String(day - 1).padStart(2, "0")}h`
        : data.strategy === "custom" || data.mode === "rolling_days"
        ? `Dia ${day} do período`
        : `Dia ${String(day).padStart(2, "0")}`;
      return `<section class="history-tooltip"><b>${title}</b>${rows}</section>`;
    }

    _comparisonChartOptions(data) {
      const relative = data.strategy === "custom" || data.mode !== "month";
      const categoryCount = data.resolution === "hour"
        ? Math.max(data.base.series.points.length, data.comparison.series.points.length)
        : data.mode === "rolling_days"
          ? data.window_days
          : data.strategy === "custom"
            ? Math.max(data.base.series.points.length, data.comparison.series.points.length)
            : 31;
      const categories = Array.from({ length: categoryCount }, (_, index) => (
        relative
          ? data.resolution === "hour"
            ? this._comparisonIsMultiDayHourly(data)
              ? `D${Math.floor(index / 24) + 1} ${String(index % 24).padStart(2, "0")}h`
              : String(index).padStart(2, "0")
            : `Dia ${index + 1}`
          : String(index + 1).padStart(2, "0")
      ));
      const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches === true;
      return {
        ...this._chartBase(),
        animation: !reducedMotion,
        grid: { left: 58, right: 18, top: 58, bottom: 48, containLabel: false },
        legend: {
          show: true,
          type: "plain",
          top: 4,
          data: [
            this._comparisonSideLabel(data.comparison),
            this._comparisonSideLabel(data.base),
          ],
          // Faltava aqui: a legenda saia na fonte padrao do ECharts, maior que
          // a da Analise da curva, que ja usava este mesmo tema.
          ...this._chartLegendSkin(),
        },
        tooltip: {
          trigger: "axis",
          confine: true,
          transitionDuration: 0,
          hideDelay: 0,
          enterable: false,
          formatter: (params) => this._comparisonTooltip(data, params),
          ...this._chartTooltipSkin(),
        },
        xAxis: {
          type: "category",
          data: categories,
          ...this._chartCategoryAxisSkin(),
          axisLabel: { color: this._chartInk(), fontSize: 11, hideOverlap: true },
        },
        yAxis: {
          type: "value",
          min: 0,
          name: `Energia (${data.base.series.unit})`,
          nameLocation: "middle",
          nameGap: 43,
          ...this._chartValueAxisSkin(),
        },
        // Da esquerda para a direita, do mais antigo para o mais recente: e
        // assim que se le uma evolucao. A cor do periodo atual e a da propria
        // grandeza, a mesma do grafico da curva; o periodo anterior recebe um
        // roxo neutro, que nao concorre com nenhuma grandeza da paleta.
        series: [data.comparison, data.base].map((side, index) => {
          const byDay = this._comparisonPointsByDay(side.series);
          const cor = index === 0
            ? COMPARISON_PREVIOUS_COLOR
            : this._historySeriesColor({ logical_id: data.logical_id });
          return {
            id: `${side.reference}|${data.logical_id}`,
            name: this._comparisonSideLabel(side),
            type: "bar",
            ...(cor ? { itemStyle: { color: cor } } : {}),
            data: categories.map((_, index) => {
              const value = relative
                ? side.series.points?.[index]?.value
                : byDay.get(index + 1)?.value;
              return typeof value === "number" && Number.isFinite(value) ? value : null;
            }),
            barMaxWidth: 22,
          };
        }),
      };
    }

    async _loadChartModule() {
      if (!this._chartModulePromise) {
        this._chartModulePromise = import(CHART_MODULE_URL).then((module) => {
          this._chartModule = module;
          this._chartModuleError = "";
          return module;
        }).catch((error) => {
          this._chartModuleError = "Não foi possível carregar o gráfico.";
          console.error("CoEnergy: falha ao carregar o runtime gráfico.", error);
          throw error;
        });
      }
      return this._chartModulePromise;
    }

    async _renderHistoryChart() {
      const billingOnly = this._unitIsBillingOnly();
      const key = billingOnly ? this._billingOnlyHistoryKey() : this._historyKey();
      const data = billingOnly ? this._billingOnlyHistoryData() : this._historyData(key);
      const element = this.shadowRoot.querySelector("[data-history-chart]");
      if (
        !element
        || !data
        || data.available === false
        || !Array.isArray(data.series)
        || data.series.length === 0
      ) {
        return;
      }
      try {
        const chartModule = await this._loadChartModule();
        if (
          !element.isConnected
          || key !== (this._unitIsBillingOnly()
            ? this._billingOnlyHistoryKey()
            : this._historyKey())
          || element !== this.shadowRoot.querySelector("[data-history-chart]")
        ) {
          return;
        }
        this._cleanupHistoryChart();
        this._historyChart = chartModule.initChart(
          element,
          this._historyChartOptions(data),
        );
        if (data.series.length > 1) {
          this._historyChart.on("legendselectchanged", (event) => {
            this._historyLegendSelection.set(
              this._historyLegendKey(data),
              { ...event.selected },
            );
            this._updateHistoryTotals(data);
          });
        }
        if (typeof ResizeObserver !== "undefined") {
          this._historyResizeObserver = new ResizeObserver(() => {
            if (this._historyChart === null) return;
            chartModule.resizeChart(this._historyChart);
          });
          this._historyResizeObserver.observe(element);
        }
      } catch {
        this._render();
      }
    }

    _cleanupHistoryChart() {
      this._historyResizeObserver?.disconnect();
      this._historyResizeObserver = null;
      if (this._historyChart && this._chartModule) {
        this._chartModule.disposeChart(this._historyChart);
      }
      this._historyChart = null;
    }

    async _renderComparisonChart() {
      const key = this._comparisonKey();
      const data = this._comparisonData(key);
      const element = this.shadowRoot.querySelector("[data-comparison-chart]");
      if (!element || !data) return;
      try {
        const chartModule = await this._loadChartModule();
        if (
          !element.isConnected
          || key !== this._comparisonKey()
          || element !== this.shadowRoot.querySelector("[data-comparison-chart]")
        ) {
          return;
        }
        this._cleanupComparisonChart();
        this._comparisonChart = chartModule.initChart(
          element,
          this._comparisonChartOptions(data),
        );
        if (typeof ResizeObserver !== "undefined") {
          this._comparisonResizeObserver = new ResizeObserver(() => {
            if (this._comparisonChart === null) return;
            chartModule.resizeChart(this._comparisonChart);
          });
          this._comparisonResizeObserver.observe(element);
        }
      } catch {
        this._render();
      }
    }

    _cleanupComparisonChart() {
      this._comparisonResizeObserver?.disconnect();
      this._comparisonResizeObserver = null;
      if (this._comparisonChart && this._chartModule) {
        this._chartModule.disposeChart(this._comparisonChart);
      }
      this._comparisonChart = null;
    }

    _cleanupHistoryRendering() {
      this._historyIntersectionObserver?.disconnect();
      this._historyIntersectionObserver = null;
      this._cleanupHistoryChart();
    }

    // O icone vem da grandeza declarada no modelo, nao do rotulo em
    // portugues: e o campo canonico, e uma grandeza nova sem mapa fica sem
    // icone em vez de ganhar o icone errado.
    _measurementIcon(quantity) {
      return {
        voltage: "mdi:sine-wave",
        current: "mdi:current-ac",
        power: "mdi:flash",
        // cos phi e um angulo — o icone diz literalmente o que a grandeza e.
        power_factor: "mdi:angle-acute",
        frequency: "mdi:pulse",
        energy: "mdi:lightning-bolt",
      }[quantity] ?? null;
    }

    _valueWithUnit(value, unit, fractionDigits = null) {
      if (value === null || value === undefined) return "Indisponível";
      const formatted = fractionDigits === null
        ? this._formatNumber(value)
        : this._formatNumber(value, fractionDigits, fractionDigits);
      return unit ? `${formatted} ${unit}` : formatted;
    }

    _field(label, value) {
      const field = this._element("div", "field");
      field.append(
        this._element("span", "field-label", label),
        this._element("strong", "field-value", value),
      );
      return field;
    }

    // Redesenhar a pagina inteira destroi o DOM, e junto com ele a posicao da
    // rolagem e o campo em foco de um dialogo aberto. Gravar um sensor
    // recarrega o catalogo de unidades, que redesenha tudo — e a tela pulava
    // de volta ao topo no meio da configuracao. O envoltorio devolve as duas
    // coisas depois, em vez de cada chamador ter de lembrar disso.
    _render() {
      const dialogoAberto = Boolean(this._settingsModal);
      const posicoes = dialogoAberto ? this._captureSettingsScroll() : [];
      const foco = dialogoAberto ? this._settingsFocusKey() : null;
      const rolagem = this._capturePageScroll();

      this._renderShell();

      this._restorePageScroll(rolagem);
      if (!dialogoAberto) return;
      this._restoreSettingsScroll(posicoes);
      this._restoreSettingsFocus(foco);
    }

    // Quem rola a pagina nao e este elemento: e um conteiner do Home
    // Assistant acima dele — ou a janela, quando a tela e um cartao. Sobe a
    // arvore atravessando as shadow roots e guarda cada um que esteja rolado.
    _pageScrollers() {
      const rolaveis = [];
      let no = this;
      while (no) {
        const raiz = no.getRootNode?.();
        const pai = no.parentElement
          ?? (raiz instanceof ShadowRoot ? raiz.host : null);
        if (!pai) break;
        if (pai.scrollHeight > pai.clientHeight) {
          const estilo = getComputedStyle(pai).overflowY;
          if (estilo === "auto" || estilo === "scroll") rolaveis.push(pai);
        }
        no = pai;
      }
      if (document.scrollingElement) rolaveis.push(document.scrollingElement);
      return rolaveis;
    }

    _capturePageScroll() {
      if (!this.isConnected) return null;
      const pares = this._pageScrollers()
        .map((alvo) => [alvo, alvo.scrollTop])
        .filter(([, topo]) => topo > 0);
      if (!pares.length) return null;
      return { pares, altura: this.offsetHeight };
    }

    // Trocar ciclo ou ano redesenha a tela com os blocos "carregando", mais
    // baixos que o conteudo: a pagina encolhia, a rolagem era cortada e a
    // tela pulava para o topo. A altura anterior fica segurada enquanto os
    // dados chegam, e a rolagem volta para onde estava.
    _restorePageScroll(rolagem) {
      if (!rolagem) return;
      this.style.minHeight = `${rolagem.altura}px`;
      clearTimeout(this._alturaSeguraTimer);
      this._alturaSeguraTimer = setTimeout(() => {
        this.style.minHeight = "";
      }, 2500);
      const aplicar = () => {
        for (const [alvo, topo] of rolagem.pares) {
          if (alvo.isConnected && Math.abs(alvo.scrollTop - topo) > 1) {
            alvo.scrollTop = topo;
          }
        }
      };
      aplicar();
      requestAnimationFrame(aplicar);
    }

    // Nao ha um so elemento que rola: dependendo da altura da tela, quem rola
    // e o fundo, o dialogo ou o corpo dele. Guardar os tres pelo seletor, e
    // nao pela referencia, e o que sobrevive ao DOM ser refeito.
    _SETTINGS_SCROLLABLES = [
      ".audit-modal-overlay",
      ".settings-modal",
      ".settings-modal .audit-modal-body",
    ];

    _captureSettingsScroll() {
      const raiz = this.shadowRoot;
      if (!raiz) return [];
      return this._SETTINGS_SCROLLABLES
        .map((seletor) => [seletor, raiz.querySelector(seletor)?.scrollTop ?? 0])
        .filter(([, topo]) => topo > 0);
    }

    _restoreSettingsScroll(pares) {
      if (!pares?.length) return;
      const aplicar = () => {
        for (const [seletor, topo] of pares) {
          const alvo = this.shadowRoot?.querySelector(seletor);
          if (alvo) alvo.scrollTop = topo;
        }
      };
      aplicar();
      // De novo no quadro seguinte: no mesmo tick o conteudo pode ainda nao
      // ter altura, e um scrollTop maior que o conteudo e truncado para zero
      // sem reclamar — que e exatamente o salto para o topo.
      requestAnimationFrame(aplicar);
    }

    _renderShell() {
      this._cleanupHistoryRendering();
      this._cleanupComparisonChart();
      this._cleanupPaybackChart();
      this._cleanupAuditChart();
      this._cleanupQualityChart();
      this._cleanupFlowChart();
      this._root.replaceChildren();
      const card = this._element("ha-card", "card");
      this._root.append(card);

      if (!this._config) {
        card.append(this._status("Configure as unidades para iniciar."));
        return;
      }

      const key = this._key();
      const data = this._displayData(key);
      const loading = this._inFlight.has(key);
      const error = this._errors.get(key);

      // Shell de supervisao: coluna de navegacao fixa a esquerda, area de
      // trabalho a direita com cabecalho preso no topo. A navegacao nunca sai
      // da tela — num sistema de supervisao trocar de vista e a acao mais
      // frequente, e ela nao pode depender de rolar a pagina de volta.
      const shell = this._element("div", "shell");
      const sidebar = this._element("aside", "sidebar");
      sidebar.append(this._renderBrand(), this._renderMainNavigation());
      const main = this._element("div", "main-area");
      // A aba guardada pode ser uma que deixou de existir — o painel de quem
      // acabou de instalar abre na Visao geral por padrao.
      // So a instalacao sem unidade nenhuma vai para a Configuracao: e a unica
      // tela que ela tem. Enquanto a lista de unidades nao chega, nao se sabe
      // se ela e vazia — e a aba em que a pessoa estava fica onde estava.
      if (this._setupIncomplete && this._page !== "configuracao") {
        this._page = "configuracao";
      }
      main.append(this._renderTopBar(data));
      const scroll = this._element("div", "main-scroll");
      main.append(scroll);
      shell.append(sidebar, main);
      card.append(shell);

      if (this._catalogPending) {
        scroll.append(this._status("Carregando…", "loading"));
        return;
      }

      if (!data && !UNIT_FREE_PAGES.has(this._page)) {
        if (loading) {
          scroll.append(this._status("Carregando dados da unidade…", "loading"));
        } else if (error) {
          scroll.append(this._renderError(error));
        } else {
          scroll.append(this._status("Aguardando dados da unidade."));
        }
        return;
      }

      // Em modo reduzido o aviso e um so, e diz o que fazer. O erro cru da
      // unidade seria ruido: a causa nao e a unidade, e o arquivo que falta.
      if (this._billingUnavailable) {
        scroll.append(this._renderBillingNotice());
      } else if (error) {
        scroll.append(this._renderError(error, true));
      }
      scroll.append(this._renderPage(data));

      // Sem snapshot nao ha o que agendar: todas as cargas abaixo sao da
      // unidade selecionada. E nao e so desperdicio — varias delas, quando nao
      // encontram o proprio bloco na tela, chamam _render() como ultimo
      // recurso. Numa pagina que nao contem esse bloco isso vira reconstrucao
      // em laco: a tela se redesenha sem parar e o clique nunca chega ao
      // botao, sem erro nenhum no console.
      if (!data) return;

      this._scheduleHistoryRendering();
      this._scheduleComparisonRendering();
      this._scheduleSelfConsumptionLoading();
      this._scheduleSceeLoading();
      this._scheduleFinanceLoading();
      this._schedulePaybackProjectionLoading();
      this._scheduleAuditLoading();
    }

    _renderBrand() {
      const brand = this._element("div", "brand");
      brand.append(
        this._element("h1", "brand-name", "Gestão de Energia"),
        this._element("span", "brand-sub", "CoEnergy V6"),
      );
      return brand;
    }

    // As paginas do produto. A ordem segue a leitura de uma operacao: o que
    // esta acontecendo, o detalhe por unidade, a conferencia contra a fatura,
    // o retorno do investimento, a procedencia do dado e o que exige acao.
    _pages() {
      // Sem nenhuma unidade nao ha o que ver em lugar nenhum: as outras abas
      // abririam vazias e a pessoa procuraria um problema que nao existe. Elas
      // voltam sozinhas assim que a primeira unidade e criada.
      // Catalogo ainda nao chegou conta como vazio de proposito: mostrar as
      // oito e recolher depois era o atraso que parecia falha. Uma aba a
      // mais aparecendo em seguida incomoda menos que sete sumindo.
      // Lista ainda a caminho: nenhuma aba, por um instante. Mostrar so a
      // Configuracao aqui fazia a recarga parecer uma instalacao vazia.
      if (this._catalogPending) return [];
      if (this._setupIncomplete) {
        return [["configuracao", "mdi:cog-outline", "Configuração"]];
      }
      // Cada aba declara de que DEPENDE, e o backend diz o que existe. A
      // diferenca entre sumir e ficar pendente e a que organiza a leitura:
      //
      //   nao existe     a instalacao nao tem a capacidade. Payback numa
      //                  casa sem placa nao esta indisponivel — ele nao
      //                  existe, e prometer a aba seria mentir.
      //
      //   falta informar a capacidade existe e o dado nao chegou. Auditoria
      //                  sem fatura e isso: a aba fica e diz o que falta.
      //
      // Visao geral e Auditoria pedem os DOIS: sensor e fatura. A Visao geral
      // junta o ciclo de cada unidade — datas da fatura, consumo do sensor —,
      // e com um so dos dois mostrava apenas "Hoje" ou nada. A auditoria
      // compara o medido com o cobrado: sem um dos lados, era uma tabela de
      // espera. Sem elas o painel abre em Unidades & analise, e a
      // Configuracao diz qual e o proximo passo.
      const podem = this._capabilities;
      const completo = podem.measurement && podem.billing;
      return [
        ...(completo
          ? [["overview", "mdi:view-dashboard-outline", "Visão geral"]]
          : []),
        ["units", "mdi:home-city-outline", "Unidades & análise"],
        ...(completo
          ? [["auditoria", "mdi:scale-balance", "Auditoria"]]
          : []),
        ...(podem.generation
          ? [["payback", "mdi:solar-power-variant-outline", "Payback"]]
          : []),
        ["diagnostico", "mdi:heart-pulse", "Saúde dos dados"],
        ["alertas", "mdi:bell-alert-outline", "Alertas"],
        ["configuracao", "mdi:cog-outline", "Configuração"],
        ["excluir", "mdi:trash-can-outline", "Excluir"],
      ];
    }

    // O nome que as faturas imprimem, dito pelo backend. Sem fatura, ou com
    // mais de uma distribuidora, o generico: o painel nao presume qual e a
    // concessionaria de quem instalou.
    _distributorLabel(generico = "Distribuidora") {
      return this._distributorName ?? generico;
    }

    _pageLabel(page = this._page) {
      // Carregando, nao se sabe ainda o nome da aba: o do produto e o honesto.
      if (this._catalogPending) return "Gestão de Energia";
      const abas = this._pages();
      return (abas.find((item) => item[0] === page) ?? abas[0])?.[2] ?? "Gestão de Energia";
    }

    // O estado reduzido dito por extenso: o que falta, o que continua valendo
    // e o caminho de volta. Sem isso o operador ve abas apagadas sem motivo.
    _renderBillingNotice() {
      const aviso = this._element("section", "panel billing-notice");
      aviso.append(this._element(
        "h3", "billing-notice-title", "Arquivo de faturas pendente",
      ));
      aviso.append(this._element(
        "p", "billing-notice-text",
        "O arquivo de faturas não pôde ser lido, então tudo que depende de"
        + " valores faturados está indisponível: visão geral, unidades,"
        + " auditoria, payback e alertas. As medições dos sensores continuam"
        + " sendo gravadas normalmente — nada se perde.",
      ));
      aviso.append(this._element(
        "p", "billing-notice-text",
        "Para restaurar, gere a extração em Configuração → Extração de faturas."
        + " A Saúde dos dados continua disponível e mostra o que está faltando"
        + " em cada unidade.",
      ));
      if (this._page !== "configuracao") {
        const acao = this._button(
          "Ir para Configuração", "select-page", "button primary",
        );
        acao.dataset.page = "configuracao";
        aviso.append(acao);
      }
      return aviso;
    }

    // Troca so a coluna de navegacao. O contador de alertas dela muda quando
    // uma medicao volta ou cai, e redesenhar a pagina inteira por causa de um
    // numero remontaria os graficos a cada mudanca de sensor.
    _renderMainNavigationUpdate() {
      const atual = this.shadowRoot?.querySelector("[data-main-nav]");
      if (atual) atual.replaceWith(this._renderMainNavigation());
    }

    _renderMainNavigation() {
      const nav = this._element("nav", "main-nav");
      nav.dataset.mainNav = "";
      nav.setAttribute("aria-label", "Navegação principal");
      // Alertas ativos aparecem no proprio item de menu. Um alerta que so se
      // descobre entrando na aba de alertas nao e um alerta.
      const criticos = this._operationalAlerts()
        .filter((item) => item.severity === "critical").length;
      const total = this._operationalAlerts().length;
      for (const [page, iconName, label] of this._pages()) {
        const button = this._button("", "select-page", "nav-button");
        const icon = this._element("ha-icon", "");
        icon.setAttribute("icon", iconName);
        button.append(icon, this._element("span", "nav-label", label));
        if (page === "alertas" && total > 0) {
          button.append(this._element(
            "span",
            `nav-badge ${criticos > 0 ? "critical" : "attention"}`,
            String(total),
          ));
        }
        button.dataset.page = page;
        // Em modo reduzido a aba continua visivel, mas desligada e dizendo por
        // que: some-la faria parecer que a funcao deixou de existir.
        const bloqueada = this._billingUnavailable
          && !PAGES_WITHOUT_BILLING.has(page);
        if (bloqueada) {
          button.disabled = true;
          button.classList.add("nav-blocked");
          button.title = "Precisa do arquivo de faturas."
            + " Gere a extração em Configuração.";
        }
        button.classList.toggle("active", this._page === page);
        button.setAttribute("aria-current", this._page === page ? "page" : "false");
        nav.append(button);
      }
      return nav;
    }

    // A barra do topo carrega o contexto que vale para a pagina inteira: onde
    // estou, de que periodo estou falando e se a leitura esta viva.
    _renderTopBar(data = null) {
      const header = this._element("header", "top-bar");
      const copy = this._element("div", "top-bar-copy");
      copy.append(this._element("h2", "page-title", this._pageLabel()));
      const contexto = this._topBarContext(data);
      if (contexto) copy.append(this._element("span", "top-bar-context", contexto));
      header.append(copy);

      const acoes = this._element("div", "top-bar-actions");
      // A Visao geral nao tem seletor de periodo no topo: os cartoes seguem o
      // ciclo de cada unidade, e o unico que obedecia a ele era o fluxo, que
      // ja tem o proprio seletor. Dois controles do mesmo estado, um deles
      // em cima de cartoes que o ignoravam, so confundiam.
      acoes.append(this._renderSystemStatus());

      const refresh = this._button("", "refresh", "icon-button");
      refresh.setAttribute("aria-label", "Atualizar dados");
      refresh.title = "Atualizar";
      refresh.disabled = this._inFlight.has(this._key());
      const refreshIcon = this._element("ha-icon", "");
      refreshIcon.setAttribute("icon", "mdi:refresh");
      refresh.replaceChildren(refreshIcon);
      acoes.append(refresh);
      header.append(acoes);
      return header;
    }

    _topBarContext(data) {
      if (this._page === "overview") {
        const total = this._unitIds().length;
        return `${total} ${total === 1 ? "unidade" : "unidades"} · cada uma no seu ciclo`;
      }
      if (this._page === "units") {
        const cycle = data?.cycle_energy?.cycle;
        const nome = data?.snapshot?.name ?? this._unitLabel(this._selectedUnit);
        return cycle?.expected_next_reading
          ? `${nome} · próxima leitura ${this._formatDate(cycle.expected_next_reading)}`
          : nome;
      }
      if (this._page === "auditoria") return `Medido no Home Assistant × faturado pela ${this._distributorLabel("distribuidora")}`;
      if (this._page === "payback") return "Retorno do investimento no sistema solar";
      if (this._page === "diagnostico") return "Sensores, cobertura do ciclo e faturas de cada unidade";
      if (this._page === "alertas") return "Condições que exigem verificação";
      if (this._page === "configuracao") {
        return "Ajustes que valem para todo o sistema";
      }
      if (this._page === "excluir") {
        return `${data?.snapshot?.name ?? this._unitLabel(this._selectedUnit)} `
          + "· seções movidas de Unidades & análise";
      }
      return "";
    }

    // O selo de estado le o que o card realmente sabe: se ha requisicao em
    // curso, se a ultima falhou, e quantos alertas estao abertos. Nao existe
    // "ONLINE" fixo — isso seria enfeite, nao supervisao.
    _renderSystemStatus() {
      // O catalogo de unidades tambem e carga: enquanto ele nao chega a tela
      // nao tem o que mostrar, e o selo nao pode dizer "Operacional".
      const carregando = this._inFlight.size > 0 || Boolean(this._unitCatalogRequest);
      const falha = this._errors.size > 0;
      const criticos = this._operationalAlerts()
        .filter((item) => item.severity === "critical").length;
      let tom = "ok";
      let texto = "Operacional";
      // Sem unidade nenhuma nao ha o que supervisionar, e dizer "Operacional"
      // e a mentira mais facil de contar: nada falhou porque nada rodou. Quem
      // acabou de instalar lia o selo verde e procurava por que a tela estava
      // vazia.
      if (this._setupIncomplete) { tom = "info"; texto = "Aguardando configuração"; }
      else if (carregando) { tom = "info"; texto = "Sincronizando"; }
      else if (falha) { tom = "critical"; texto = "Falha de leitura"; }
      else if (criticos > 0) { tom = "critical"; texto = `${criticos} crítico${criticos > 1 ? "s" : ""}`; }
      const selo = this._element("div", `system-status ${tom}`);
      selo.append(
        this._element("span", "system-status-dot"),
        this._element("span", "", texto),
      );
      selo.setAttribute("role", "status");
      return selo;
    }

    _renderPage(data) {
      const page = this._element("main", "page-content");
      // A aba aberta fica guardada entre recargas, e o conjunto de abas depende
      // do modelo: quem tinha Payback aberto e passou a usar um modelo sem
      // geracao voltaria para uma aba sem botao, sem saida e sem explicacao.
      // Sem Visao geral, a primeira aba que existe.
      const abas = this._pages();
      if (abas.length && !abas.some(([id]) => id === this._page)) {
        this._page = abas[0][0];
      }
      if (this._page === "overview") page.append(this._renderOverview(data));
      if (this._page === "units") {
        page.append(this._renderToolbar(), this._renderUnitPage(data));
      }
      // A auditoria saiu de dentro de Unidades, que carregava nove seções. Ela
      // responde a uma pergunta própria — se o medido e a fatura concordam — e
      // por isso merece aba, não um bloco no fim de outra página.
      if (this._page === "auditoria") {
        const content = this._element("div", "content audit-page");
        const modalHost = this._element("div", "audit-modal-host");
        modalHost.dataset.auditModalHost = "";
        content.append(this._renderAuditOverview(), modalHost);
        // Sem seletor de unidade: a tabela mostra as quatro de uma vez, e o
        // detalhe abaixo acompanha a unidade escolhida nas outras abas.
        page.append(content);
        queueMicrotask(() => {
          if (!this.isConnected || this._page !== "auditoria") return;
          // O host nasce vazio a cada _render. Sem reconstruir aqui, qualquer
          // atualizacao de dados fecharia sozinha o modal que estava aberto.
          if (this._auditIssueModal || this._auditChartModal) {
            this._renderAuditIssueModalUpdate();
          }
          this._loadAllAudits();
        });
      }
      if (this._page === "payback") {
        const content = this._element("div", "content payback-page");
        const blocks = this._element("div", "blocks");
        // append(null) nao e ignorado: o DOM escreve a palavra "null" na
        // tela, e foi exatamente assim que a aba aparecia vazia com esse
        // texto no lugar da projecao.
        const projecao = this._renderPaybackProjection();
        if (projecao) blocks.append(projecao);
        content.append(blocks);
        page.append(content);
        queueMicrotask(() => {
          if (this.isConnected && this._page === "payback") this._renderPaybackChart();
        });
      }
      if (this._page === "diagnostico") {
        page.append(this._renderDataHealthPage());
        queueMicrotask(async () => {
          if (!this.isConnected || this._page !== "diagnostico") return;
          this._loadDataHealth();
          this._startDataHealthRefresh();
        });
      }
      if (this._page === "configuracao") {
        page.append(this._renderSettingsPage());
        queueMicrotask(async () => {
          if (!this.isConnected || this._page !== "configuracao") return;
          this._loadSettings();
          // Sem isso o cartao de sensores abriria sempre mostrando "—", e um
          // sensor sem entidade so apareceria depois de abrir o dialogo.
          this._loadSensors();
          this._loadModelConfig();
          this._loadInvoices();
        });
      }
      if (this._page === "excluir") {
        page.append(this._renderExclusionPage(data));
      }
      if (this._page === "alertas") {
        page.append(this._renderAlertsPage());
        queueMicrotask(() => {
          if (!this.isConnected || this._page !== "alertas") return;
          this._loadOverviewUnits();
          this._loadAllAudits();
        });
      }
      return page;
    }

    async _loadCycleCost(unitId, { force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && this._cycleCost.has(unitId)) return this._cycleCost.get(unitId);
      if (this._cycleCostInFlight.has(unitId)) return this._cycleCostInFlight.get(unitId);
      const configGeneration = this._configGeneration;
      this._cycleCostErrors.delete(unitId);
      const request = this._hass.callWS({
        type: CYCLE_COST_COMMAND,
        unit_id: unitId,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION
          || !response.data || typeof response.data !== "object") {
          throw new Error("Resposta de estimativa de custo inválida.");
        }
        if (response.data.unit_id !== unitId) {
          throw new Error("Estimativa de custo não corresponde à unidade pedida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        this._cycleCost.set(unitId, response.data);
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        this._cycleCostErrors.set(
          unitId, error?.message ?? "Estimativa de custo indisponível.",
        );
        return null;
      }).finally(() => {
        if (this._cycleCostInFlight.get(unitId) === request) {
          this._cycleCostInFlight.delete(unitId);
        }
        this._renderOverviewCardUpdate(unitId);
      });
      this._cycleCostInFlight.set(unitId, request);
      return request;
    }

    async _loadDailyBalance(unitId, { force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && this._dailyBalance.has(unitId)) return this._dailyBalance.get(unitId);
      if (this._dailyBalanceInFlight.has(unitId)) {
        return this._dailyBalanceInFlight.get(unitId);
      }
      const configGeneration = this._configGeneration;
      const request = this._hass.callWS({
        type: DAILY_BALANCE_COMMAND,
        unit_id: unitId,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION
          || !response.data || typeof response.data !== "object") return null;
        if (response.data.unit_id !== unitId) return null;
        if (configGeneration !== this._configGeneration) return null;
        this._dailyBalance.set(unitId, response.data);
        return response.data;
      }).catch(() => null).finally(() => {
        if (this._dailyBalanceInFlight.get(unitId) === request) {
          this._dailyBalanceInFlight.delete(unitId);
        }
        this._renderOverviewCardUpdate(unitId);
      });
      this._dailyBalanceInFlight.set(unitId, request);
      return request;
    }

    _scheduleMeasurementsRefresh() {
      if (this._measurementsTimer || this._measurementsInFlight) return;
      this._measurementsTimer = setTimeout(() => {
        this._measurementsTimer = null;
        this._refreshMeasurements();
      }, MEASUREMENTS_DEBOUNCE_MS);
    }

    // Le so as grandezas instantaneas da unidade selecionada. O valor vem do
    // backend ja na unidade que o modelo declara: qualquer conversao — como a
    // de mA para A que um medidor pode exigir ate ser trocado — fica
    // la, e nunca e repetida aqui.
    async _refreshMeasurements() {
      const unidade = this._selectedUnit;
      if (!unidade || !this.isConnected) return;
      if (!this._hass || typeof this._hass.callWS !== "function") return;
      // So vale a pena quando o painel esta na tela: fora dele, o pedido
      // atualizaria um cache que ninguem esta olhando.
      if (!this.shadowRoot?.querySelector("[data-measurements-panel]")) return;
      const configGeneration = this._configGeneration;
      this._measurementsInFlight = true;
      try {
        const resposta = await this._hass.callWS({
          type: MEASUREMENTS_COMMAND,
          unit_id: unidade,
        });
        if (!resposta || resposta.api_version !== API_VERSION) return;
        const dados = resposta.data;
        if (!dados || dados.unit_id !== unidade) return;
        if (!Array.isArray(dados.measurements)) return;
        if (configGeneration !== this._configGeneration) return;
        if (unidade !== this._selectedUnit) return;
        // Substitui as medicoes e a evidencia delas dentro do snapshot em
        // cache: o resto do overview continua valendo, e remonta-lo aqui
        // piscaria a pagina.
        //
        // A evidencia entra junto porque e dela que saem os alertas de
        // "sensor sem leitura". Atualizando so as medicoes, o cartao mostrava
        // o valor de volta e o alerta continuava aberto, ate alguem forcar a
        // releitura do overview — que tem cache sem prazo.
        const chave = this._key(unidade);
        const evidencias = Array.isArray(dados.measurement_evidence)
          ? dados.measurement_evidence
          : null;
        for (const mapa of [this._cache, this._stale]) {
          const atual = mapa.get(chave);
          if (!atual?.snapshot) continue;
          const proximo = {
            ...atual,
            snapshot: { ...atual.snapshot, measurements: dados.measurements },
          };
          if (evidencias && atual.quality_evidence) {
            proximo.quality_evidence = {
              ...atual.quality_evidence,
              measurements: evidencias,
            };
          }
          mapa.set(chave, proximo);
        }
        this._renderMeasurementsUpdate();
        // O contador de alertas vive na navegacao, fora do bloco de medicoes,
        // entao ele nao vem junto no redesenho acima.
        this._renderMainNavigationUpdate();
      } catch {
        // Falha em silencio: perder uma atualizacao nao pode virar erro na
        // tela, e a proxima mudanca de estado tenta de novo.
      } finally {
        this._measurementsInFlight = false;
      }
    }

    // As 24 horas de cada grandeza instantanea, como o Recorder as gravou.
    // Uma unidade sem estatistica devolve serie vazia, e a tela diz isso — e
    // diferente de nao ter sensor.
    async _loadInstantStatistics(unitId, { force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && this._instantStats.has(unitId)) {
        return this._instantStats.get(unitId);
      }
      if (this._instantStatsInFlight.has(unitId)) {
        return this._instantStatsInFlight.get(unitId);
      }
      const configGeneration = this._configGeneration;
      const request = this._hass.callWS({
        type: INSTANT_STATISTICS_COMMAND,
        unit_id: unitId,
      }).then((response) => {
        if (configGeneration !== this._configGeneration) return null;
        const valido = response && response.api_version === API_VERSION
          && response.data && typeof response.data === "object"
          && response.data.unit_id === unitId
          && Array.isArray(response.data.measurements);
        // A falha tambem fica registrada. Sem isso o finally redesenha, o
        // redesenho reagenda a carga, e a falha vira um laco infinito.
        this._instantStats.set(unitId, valido ? response.data : null);
        return valido ? response.data : null;
      }).catch(() => {
        if (configGeneration === this._configGeneration) {
          this._instantStats.set(unitId, null);
        }
        return null;
      }).finally(() => {
        if (this._instantStatsInFlight.get(unitId) === request) {
          this._instantStatsInFlight.delete(unitId);
        }
        this._renderMeasurementsUpdate();
      });
      this._instantStatsInFlight.set(unitId, request);
      return request;
    }

    // Troca so o painel de medicoes. Redesenhar a pagina inteira aqui
    // remontaria os dois graficos do ciclo a cada resposta que chega.
    _renderMeasurementsUpdate() {
      const atual = this.shadowRoot?.querySelector("[data-measurements-panel]");
      if (!atual) return;
      const dados = this._displayData();
      if (!dados) return;
      const novo = this._renderMeasurements(dados.snapshot ?? {});
      if (novo) atual.replaceWith(novo);
      else atual.remove();
    }

    // Troca so o cartao da unidade. Um _render completo aqui remontaria o
    // Sankey a cada resposta que chega, e sao quatro chegando em paralelo.
    _renderOverviewCardUpdate(unitId) {
      const atual = this.shadowRoot?.querySelector(
        `[data-overview-card="${unitId}"]`,
      );
      if (atual) atual.replaceWith(this._renderOverviewUnitCard(unitId));
    }

    // O ciclo em curso e o ultimo fechado, em pontos diarios. E com eles que
    // saem o consumo de hoje e a comparacao com o mesmo ponto do ciclo passado.
    // A variacao do cartao passa a vir da comparacao por ciclo do backend — a
    // mesma que o grafico desenha. Antes o cartao somava as fatias diarias do
    // ciclo anterior por conta propria, e arredondava a janela para cima:
    // 19,21 dias decorridos viravam 20 fatias inteiras, e o lado anterior saia
    // maior do que deveria. Dois lugares calculando a mesma coisa davam dois
    // numeros, e o do cartao era o errado.
    async _loadCycleTrend(unitId, logicalId) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (this._cycleTrend.has(unitId)) return this._cycleTrend.get(unitId);
      if (this._cycleTrendInFlight.has(unitId)) {
        return this._cycleTrendInFlight.get(unitId);
      }
      const configGeneration = this._configGeneration;
      const request = Promise.resolve().then(() => this._hass.callWS({
        type: COMPARISON_COMMAND,
        unit_id: unitId,
        mode: "custom",
        strategy: "custom",
        resolution: "day",
        period_type: "cycle",
        ...(logicalId ? { logical_id: logicalId } : {}),
      })).then((response) => {
        if (!response || response.api_version !== API_VERSION) return null;
        const data = response.data;
        const atual = Number(data?.base?.series?.total);
        const anterior = Number(data?.comparison?.series?.total);
        if (!Number.isFinite(atual) || !Number.isFinite(anterior)) return null;
        if (configGeneration !== this._configGeneration) return null;
        this._cycleTrend.set(unitId, {
          atual,
          anterior,
          dias: Number(data?.base?.duration_days),
          inicio: data?.base?.period?.start ?? null,
          fim: data?.base?.period?.end ?? null,
        });
        return this._cycleTrend.get(unitId);
      }).catch(() => null).finally(() => {
        if (this._cycleTrendInFlight.get(unitId) === request) {
          this._cycleTrendInFlight.delete(unitId);
        }
        this._renderOverviewCardUpdate(unitId);
      });
      this._cycleTrendInFlight.set(unitId, request);
      return request;
    }

    // Nao existe motor de alarme neste sistema: nao ha limiar de tensao, de
    // corrente nem de potencia em lugar nenhum do modelo. O que existe sao
    // estados que o proprio backend declara — sensor indisponivel, unidade
    // divergente, validacao pendente, auditoria fora da tolerancia, alerta de
    // extracao de fatura. Esta lista e exatamente esses estados, nada alem.
    _operationalAlerts() {
      const alertas = [];
      for (const unit of this._unitIds()) {
        const id = typeof unit === "string" ? unit : unit?.id;
        if (!id) continue;
        const nome = this._unitLabel(id);
        const dados = this._displayData(this._key(id));
        const evidencia = dados?.quality_evidence;

        for (const medicao of evidencia?.measurements ?? []) {
          const rotulo = medicao.label ?? medicao.logical_id ?? "Medição";
          if (medicao.available === false) {
            alertas.push({
              severity: "critical", unit: nome, subject: rotulo,
              description: "Sensor sem leitura disponível no Home Assistant.",
              origin: "quality_evidence.measurements[].available",
            });
          }
          if (medicao.unit_mismatch === true) {
            alertas.push({
              severity: "critical", unit: nome, subject: rotulo,
              description: `Unidade divergente: ${this._unitMismatchDetail(medicao)}.`,
              origin: "quality_evidence.measurements[].unit_mismatch",
            });
          }
          if (medicao.validation_required === true) {
            alertas.push({
              severity: "attention", unit: nome, subject: rotulo,
              description: medicao.validation_note
                ? `Validação pendente. ${medicao.validation_note}`
                : "Validação pendente para esta grandeza.",
              origin: "quality_evidence.measurements[].validation_required",
            });
          }
        }

        for (const aviso of evidencia?.billing?.extraction_alerts ?? []) {
          alertas.push({
            severity: "attention", unit: nome, subject: "Fatura",
            description: String(aviso),
            origin: "quality_evidence.billing.extraction_alerts",
          });
        }

        // Auditoria fora da tolerancia: quem julga e o backend, no campo
        // within_tolerance. A tolerancia vem junto e nao e arbitrada aqui.
        const referencia = this._latestClosedReference(id);
        const auditoria = referencia
          ? this._auditCache.get(this._auditKey(id, referencia))
          : null;
        for (const entry of this._auditComparableEntries(auditoria)) {
          if (entry.within_tolerance !== false) continue;
          alertas.push({
            severity: "critical", unit: nome,
            subject: `${this._auditMetricLabel(entry)} · ${referencia}`,
            description: "Medido e faturado divergem além da tolerância do ciclo.",
            origin: "audit.entries[].within_tolerance",
          });
        }
      }

      // Qualidade do fluxo do ciclo exibido na Visao geral.
      const fluxo = this._energyFlowData;
      if (fluxo?.quality?.status === "partial" && fluxo.cycle_status === "closed") {
        alertas.push({
          severity: "attention", unit: this._unitLabel(this._generator),
          subject: `Cobertura de série · ${fluxo.billing_reference}`,
          description: "Ciclo fechado com leitura incompleta; os valores são só os observados.",
          origin: "energy_flow.quality.status",
        });
      }
      if (fluxo?.quality?.status === "unavailable") {
        alertas.push({
          severity: "critical", unit: this._unitLabel(this._generator),
          subject: `Fluxo energético · ${fluxo.billing_reference ?? "—"}`,
          description: "Não foi possível compor o fluxo energético desta referência.",
          origin: "energy_flow.quality.status",
        });
      }

      const peso = { critical: 0, attention: 1 };
      return alertas.sort((a, b) => peso[a.severity] - peso[b.severity]);
    }

    async _loadSettings({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && (this._settings || this._settingsLoading)) return this._settings;
      this._settingsLoading = true;
      this._settingsError = "";
      this._renderSettingsUpdate();
      try {
        const response = await this._hass.callWS({ type: SETTINGS_GET_COMMAND });
        if (!response || response.api_version !== API_VERSION || !response.data) {
          throw new Error("Resposta de configuração inválida.");
        }
        this._settings = response.data;
        this._settingsDraft = this._settingsDraftFrom(response.data);
      } catch (error) {
        this._settingsError = error?.message ?? "Configuração indisponível.";
      } finally {
        this._settingsLoading = false;
        this._renderSettingsUpdate();
      }
      return this._settings;
    }

    async _loadModelConfig({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && (this._modelConfig || this._modelLoading)) return this._modelConfig;
      this._modelLoading = true;
      this._modelError = "";
      this._renderSettingsUpdate();
      try {
        const response = await this._hass.callWS({ type: MODEL_GET_COMMAND });
        if (!response || response.api_version !== API_VERSION || !response.data) {
          throw new Error("Resposta de configuração inválida.");
        }
        this._modelConfig = response.data;
      } catch (error) {
        this._modelError = error?.message ?? "Configuração indisponível.";
      } finally {
        this._modelLoading = false;
        this._renderSettingsUpdate();
      }
      return this._modelConfig;
    }

    // Toda edicao do modelo passa por aqui: o backend devolve o estado inteiro
    // depois da mudanca, e e ele que substitui o que a tela mostrava. Nao ha
    // rascunho a conciliar porque nao ha o que conciliar — a resposta e a
    // verdade.
    // O backend recusa em ingles, com a razao tecnica. Quem le a tela nao
    // precisa da razao tecnica — precisa saber o que fazer com ela.
    _modelErrorText(bruto) {
      const texto = String(bruto ?? "");
      if (/only one unit may generate/.test(texto)) {
        const outra = texto.match(/'([^']+)'/)?.[1];
        return `${outra ? this._unitLabel(outra) : "Outra unidade"} já gera `
          + "energia. Só uma unidade pode gerar: desmarque a outra primeiro.";
      }
      if (/last unit cannot be removed/.test(texto)) {
        return "Esta é a última unidade. O sistema precisa de pelo menos uma.";
      }
      if (/more than one source/.test(texto)) {
        return "Esta medição tem histórico em dois trechos. Use “Trocar "
          + "medidor” para registrar uma troca nova.";
      }
      if (/already ends at/.test(texto)) {
        return "Esta fonte já foi encerrada por uma troca anterior.";
      }
      if (/the new meter is the one already in use/.test(texto)) {
        return "Este já é o medidor em uso. Informe o medidor novo.";
      }
      if (/swap must come after/.test(texto)) {
        return "A data da troca precisa ser posterior ao início do medidor atual.";
      }
      if (/not a valid datetime|swap instant/.test(texto)) {
        return "Informe a data e a hora da troca.";
      }
      return texto || "Não foi possível aplicar a alteração.";
    }

    async _applyModelChange(mensagem, { sucesso = "Alterado." } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return false;
      this._modelSaveState = "saving";
      this._modelSaveMessage = "";
      this._renderSettingsUpdate();
      try {
        const response = await this._hass.callWS(mensagem);
        if (!response || response.api_version !== API_VERSION || !response.data) {
          throw new Error("Resposta de configuração inválida.");
        }
        this._modelConfig = response.data;
        this._modelSaveState = "saved";
        this._modelSaveMessage = sucesso;
        // Mudar o modelo muda o que cada calculo le. O que esta em cache foi
        // obtido do modelo anterior; descartar e mais honesto do que deixar
        // numeros de duas configuracoes na mesma tela.
        this._invalidateDerivedCaches();
        this._unitCatalog = null;
        this._loadUnitCatalog?.();
      } catch (error) {
        this._modelSaveState = "error";
        this._modelSaveMessage = this._modelErrorText(error?.message);
        this._renderSettingsUpdate();
        return false;
      }
      this._renderSettingsUpdate();
      return true;
    }

    async _importModel() {
      await this._applyModelChange(
        { type: MODEL_IMPORT_COMMAND },
        { sucesso: "Modelo importado. A edição já vale." },
      );
    }

    async _setUnitSensor(unitId, metric, entityId) {
      await this._applyModelChange(
        {
          type: MODEL_SET_UNIT_SENSOR_COMMAND,
          unit_id: unitId,
          metric,
          entity_id: entityId,
        },
        { sucesso: entityId ? "Sensor aplicado." : "Medição removida." },
      );
      this._modelPendingMetric = null;
      this._renderSettingsUpdate();
    }

    async _swapUnitMeter() {
      const rascunho = this._modelPendingSwap;
      if (!rascunho) return;
      const entidade = String(rascunho.entity ?? "").trim();
      const quando = String(rascunho.at ?? "").trim();
      if (!entidade || !quando) {
        this._modelSaveState = "error";
        this._modelSaveMessage =
          "Informe a entidade do medidor novo e a data da troca.";
        this._renderSettingsUpdate();
        return;
      }
      const ok = await this._applyModelChange(
        {
          type: MODEL_SWAP_METER_COMMAND,
          unit_id: rascunho.unit,
          metric: rascunho.metric,
          entity_id: entidade,
          at: quando,
          label: String(rascunho.label ?? "").trim() || null,
        },
        { sucesso: "Medidor trocado. O histórico anterior segue no lugar." },
      );
      if (ok) {
        this._modelPendingSwap = null;
        this._renderSettingsUpdate();
      }
    }

    async _setUnitField(unitId, campo, valor) {
      await this._applyModelChange(
        { type: MODEL_SET_UNIT_COMMAND, unit_id: unitId, [campo]: valor },
      );
    }

    async _addUnit() {
      const nome = String(this._modelNewUnit?.nome ?? "").trim();
      if (!nome) {
        this._modelSaveState = "error";
        this._modelSaveMessage = "Informe o nome da unidade.";
        this._renderSettingsUpdate();
        return;
      }
      const ok = await this._applyModelChange(
        {
          type: MODEL_SET_UNIT_COMMAND,
          action: "add",
          name: nome,
          role: this._modelNewUnit?.gera ? ROLE_GENERATOR : ROLE_CONSUMER,
        },
        { sucesso: `${nome} adicionada.` },
      );
      if (ok) {
        this._modelNewUnit = null;
        this._renderSettingsUpdate();
      }
    }

    async _removeUnit(unitId) {
      await this._applyModelChange(
        { type: MODEL_SET_UNIT_COMMAND, action: "remove", unit_id: unitId },
        { sucesso: "Unidade removida." },
      );
    }

    // O Home Assistant ja sabe autenticar um pedido seu: `fetchWithAuth` usa
    // a sessao corrente e renova o token quando preciso. Ler o token a mao
    // funcionava so enquanto ele estivesse exatamente onde eu adivinhei que
    // estaria — e nao estava.
    _fetchWithAuth(url, options) {
      const hass = this._hass;
      if (typeof hass?.fetchWithAuth === "function") {
        return hass.fetchWithAuth(url, options);
      }
      const token = hass?.auth?.data?.access_token ?? hass?.auth?.accessToken;
      if (!token) {
        return Promise.reject(
          new Error("Esta sessão não autoriza envios. Recarregue a página."),
        );
      }
      return fetch(url, {
        ...options,
        headers: { ...(options?.headers ?? {}), Authorization: `Bearer ${token}` },
      });
    }

    // A foto vai por HTTP, nao pelo WebSocket, porque JSON deixaria uma foto
    // de celular um terco maior. Gravada a foto, o caminho dela ainda precisa
    // entrar no modelo — sao duas etapas, e a segunda so acontece se a
    // primeira deu certo.
    async _uploadUnitImage(unitId, file) {
      if (!file) return;
      this._modelSaveState = "saving";
      this._modelSaveMessage = "Enviando a foto…";
      this._renderSettingsUpdate();

      let url = null;
      try {
        const corpo = new FormData();
        corpo.append("unit_id", unitId);
        corpo.append("file", file);
        const resposta = await this._fetchWithAuth(UNIT_IMAGE_UPLOAD_URL, {
          method: "POST",
          body: corpo,
        });
        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok) {
          // O codigo vai junto: sem ele, "nao foi possivel" nao diz se o
          // problema e a sessao, o formato do arquivo ou o endereco.
          throw new Error(
            dados?.message ?? `O envio falhou (HTTP ${resposta.status}).`,
          );
        }
        url = dados?.url;
        if (!url) throw new Error("O servidor não devolveu o endereço da foto.");
      } catch (error) {
        this._modelSaveState = "error";
        this._modelSaveMessage = error?.message ?? "Falha ao enviar a foto.";
        this._renderSettingsUpdate();
        return;
      }
      await this._applyModelChange(
        { type: MODEL_SET_UNIT_COMMAND, unit_id: unitId, image: url },
        { sucesso: "Foto atualizada." },
      );
    }

    async _loadSensors({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && (this._sensors || this._sensorsLoading)) return this._sensors;
      this._sensorsLoading = true;
      this._sensorsError = "";
      this._renderSettingsUpdate();
      try {
        const response = await this._hass.callWS({ type: SENSORS_GET_COMMAND });
        if (!response || response.api_version !== API_VERSION || !response.data) {
          throw new Error("Resposta de sensores inválida.");
        }
        this._sensors = response.data;
        this._sensorsDraft = this._sensorsDraftFrom(response.data);
      } catch (error) {
        this._sensorsError = error?.message ?? "Sensores indisponíveis.";
      } finally {
        this._sensorsLoading = false;
        this._renderSettingsUpdate();
      }
      return this._sensors;
    }

    // O catalogo e agrupado por unidade e por grandeza, mas quase tudo aqui
    // trata de fonte: contar, resumir, montar o rascunho. Achatar num lugar so
    // evita repetir os dois niveis em cada contagem.
    _sensorSources(dados = this._sensors) {
      return (dados?.units ?? [])
        .flatMap((unidade) => unidade.metrics ?? [])
        .flatMap((metrica) => metrica.sources ?? []);
    }

    // Mesma regra do rascunho de ajustes: vazio significa "vale o declarado".
    // O campo mostra a entidade declarada como placeholder em vez de ja vir
    // preenchido com ela, senao nao daria para distinguir "nao mexi" de
    // "escolhi exatamente a mesma".
    _sensorsDraftFrom(data) {
      const trocas = {};
      for (const fonte of this._sensorSources(data)) {
        trocas[fonte.declared_entity_id] = fonte.overridden
          ? fonte.effective_entity_id : "";
      }
      return trocas;
    }

    _setSensorDraft(declarada, valor) {
      if (!this._sensorsDraft) return;
      this._sensorsDraft[declarada] = valor;
      this._sensorsSaveState = "idle";
      this._sensorsSaveMessage = "";
      this._renderSettingsUpdate();
    }

    async _saveSensors() {
      if (!this._hass || typeof this._hass.callWS !== "function") return;
      const rascunho = this._sensorsDraft;
      if (!rascunho) return;

      // Campo vazio nao vira par: e assim que se diz "vale o que o YAML diz".
      const trocas = {};
      for (const [declarada, valor] of Object.entries(rascunho)) {
        const limpo = String(valor ?? "").trim();
        if (limpo && limpo !== declarada) trocas[declarada] = limpo;
      }
      const invalida = Object.values(trocas)
        .find((entidade) => !/^[a-z][a-z0-9_]*\.[a-z0-9_]+$/.test(entidade));
      if (invalida) {
        this._sensorsSaveState = "error";
        this._sensorsSaveMessage = `"${invalida}" não é uma entidade válida. `
          + "Use o formato domínio.nome, como sensor.meu_medidor.";
        this._renderSettingsUpdate();
        return;
      }

      this._sensorsSaveState = "saving";
      this._sensorsSaveMessage = "";
      this._renderSettingsUpdate();
      try {
        const response = await this._hass.callWS({
          type: SENSORS_SET_COMMAND,
          entity_ids: Object.keys(trocas).length ? trocas : null,
        });
        if (!response || response.api_version !== API_VERSION || !response.data) {
          throw new Error("Resposta de sensores inválida.");
        }
        this._sensors = response.data;
        this._sensorsDraft = this._sensorsDraftFrom(response.data);
        this._sensorsSaveState = "saved";
        this._sensorsSaveMessage = "Sensores aplicados.";
        // Trocar a entidade troca a fonte de toda leitura derivada dela. O que
        // esta em cache foi calculado a partir do sensor antigo e agora esta
        // errado — descartar e mais honesto do que misturar na tela.
        this._invalidateDerivedCaches();
      } catch (error) {
        this._sensorsSaveState = "error";
        this._sensorsSaveMessage = error?.message
          ?? "Não foi possível gravar os sensores.";
      }
      this._renderSettingsUpdate();
    }

    // O rascunho parte do ajuste gravado; vazio significa "vale o declarado",
    // e e por isso que o campo mostra o declarado como placeholder em vez de
    // ja vir preenchido com ele.
    _settingsDraftFrom(data) {
      const tarifas = {};
      for (const vigencia of Object.keys(data?.distributor_tariffs?.declared ?? {})) {
        tarifas[vigencia] = data?.distributor_tariffs?.override?.[vigencia] ?? "";
      }
      for (const [vigencia, valor] of Object.entries(
        data?.distributor_tariffs?.override ?? {},
      )) tarifas[vigencia] = valor;
      return {
        boundary: data?.boundary_time?.override ?? "",
        tarifas,
        investimento: this._moneyFromDecimal(
          data?.solar_investment?.override?.amount,
        ),
        investimentoMes: data?.solar_investment?.override?.period ?? "",
      };
    }

    async _saveSettings() {
      if (!this._hass || typeof this._hass.callWS !== "function") return;
      const rascunho = this._settingsDraft;
      if (!rascunho) return;
      const erro = this._settingsValidation();
      if (erro) {
        this._settingsSaveState = "error";
        this._settingsSaveMessage = erro;
        this._renderSettingsUpdate();
        return;
      }
      // Campo vazio vira `null`, que e o pedido explicito de voltar ao YAML.
      const tarifas = {};
      for (const [ano, valor] of Object.entries(rascunho.tarifas ?? {})) {
        if (String(valor).trim()) tarifas[ano] = String(valor).trim();
      }
      this._settingsSaveState = "saving";
      this._settingsSaveMessage = "";
      this._renderSettingsUpdate();
      try {
        const response = await this._hass.callWS({
          type: SETTINGS_SET_COMMAND,
          boundary_time: rascunho.boundary.trim() || null,
          distributor_tariffs: Object.keys(tarifas).length ? tarifas : null,
          solar_investment: this._investmentPayload(rascunho),
        });
        if (!response || response.api_version !== API_VERSION || !response.data) {
          throw new Error("Resposta de configuração inválida.");
        }
        this._settings = response.data;
        this._settingsDraft = this._settingsDraftFrom(response.data);
        this._settingsSaveState = "saved";
        this._settingsSaveMessage = "Ajustes aplicados.";
        // Tudo que foi calculado com a fronteira antiga precisa ser refeito.
        // Descartar os caches e mais honesto do que deixar numeros velhos na
        // tela ao lado de numeros novos.
        this._invalidateDerivedCaches();
      } catch (error) {
        this._settingsSaveState = "error";
        this._settingsSaveMessage = error?.message
          ?? "Não foi possível gravar os ajustes.";
      }
      this._renderSettingsUpdate();
    }

    // Toda leitura derivada do ciclo nasce da hora de fronteira. Mudou a
    // fronteira, mudou tudo — histórico, comparação, auditoria, fluxo, custo.
    _invalidateDerivedCaches() {
      this._historyCache.clear();
      this._comparisonCache.clear();
      this._comparisonErrors.clear();
      this._auditCache.clear();
      this._auditErrors.clear();
      this._sceeCache.clear();
      this._financeCache?.clear?.();
      this._cycleCost.clear();
      this._dailyBalance.clear();
      this._instantStats.clear();
      this._cycleTrend.clear();
      this._cyclesCatalogCache?.clear?.();
      this._energyFlowData = null;
      this._paybackProjection = null;
      this._refresh();
    }

    // O campo mostra dinheiro do jeito que se escreve dinheiro aqui, e o
    // backend recebe decimal com ponto. As duas formas nunca se encontram: a
    // conversao acontece so nas bordas, aqui.
    _maskMoney(texto) {
      const limpo = String(texto ?? "").replace(/\./g, "").replace(/[^\d,]/g, "");
      const [inteiro = "", ...resto] = limpo.split(",");
      const digitos = inteiro.replace(/^0+(?=\d)/, "");
      const comPontos = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      if (!resto.length) return comPontos;
      // Uma virgula so, e no maximo dois centavos: o resto o teclado digitou
      // sem querer.
      return `${comPontos || "0"},${resto.join("").replace(/\D/g, "").slice(0, 2)}`;
    }

    // "25.000,50" -> "25000.50". Vazio significa "nao informado", nao zero.
    _moneyToDecimal(texto) {
      const limpo = String(texto ?? "").replace(/\./g, "").trim();
      if (!limpo) return "";
      const [inteiro = "", centavos = ""] = limpo.split(",");
      const reais = inteiro.replace(/\D/g, "") || "0";
      const cents = centavos.replace(/\D/g, "");
      return cents ? `${reais}.${cents.padEnd(2, "0")}` : reais;
    }

    // "25000.50" -> "25.000,50", para o campo mostrar o que foi gravado.
    _moneyFromDecimal(valor) {
      const texto = String(valor ?? "").trim();
      if (!texto) return "";
      const [inteiro = "", centavos = ""] = texto.split(".");
      const comCentavos = centavos ? `${inteiro},${centavos.slice(0, 2)}` : inteiro;
      return this._maskMoney(comCentavos);
    }

    // O tracado do mes entra sozinho: digitar 202601 basta.
    _maskMonth(texto) {
      const digitos = String(texto ?? "").replace(/\D/g, "").slice(0, 6);
      if (digitos.length <= 4) return digitos;
      return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
    }

    // Valor e mes andam juntos: um investimento sem data nao se situa na
    // linha do tempo que o payback percorre, e uma data sem valor nao soma
    // nada. Os dois vazios sao o pedido de limpar.
    _investmentPayload(rascunho) {
      const valor = this._moneyToDecimal(rascunho?.investimento);
      const mes = String(rascunho?.investimentoMes ?? "").trim();
      if (!valor || !mes) return null;
      return { amount: valor, period: mes };
    }

    _settingsValidation() {
      const rascunho = this._settingsDraft;
      if (!rascunho) return "";
      const investimento = this._moneyToDecimal(rascunho.investimento);
      const investimentoMes = String(rascunho.investimentoMes ?? "").trim();
      if (investimento && !investimentoMes) {
        return "Informe o mês em que o sistema solar foi pago.";
      }
      if (investimentoMes && !investimento) {
        return "Informe quanto custou o sistema solar, ou limpe o mês.";
      }
      if (investimento && Number(investimento) <= 0) {
        return "O investimento precisa ser maior que zero.";
      }
      if (investimentoMes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(investimentoMes)) {
        return "O mês precisa ter o ano com quatro dígitos e o mês de 01 a 12.";
      }
      const hora = rascunho.boundary.trim();
      if (hora && !/^\d{2}:\d{2}$/.test(hora)) {
        return "Horário deve usar HH:MM, com zero à esquerda (ex.: 08:00).";
      }
      if (hora) {
        const [h, m] = hora.split(":").map(Number);
        if (h > 23 || m > 59) return "Horário fora do intervalo válido.";
      }
      for (const [vigencia, valor] of Object.entries(rascunho.tarifas ?? {})) {
        const texto = String(valor).trim();
        if (!texto) continue;
        if (!/^\d+(\.\d+)?$/.test(texto) || Number(texto) <= 0) {
          return `Tarifa desde ${this._formatDate(vigencia)} deve ser um número`
            + " positivo com ponto decimal.";
        }
      }
      return "";
    }

    // Acrescentar vigencia e o caminho certo do reajuste: o valor antigo
    // continua valendo para os ciclos antigos, e so os dias a partir da data
    // nova usam a tarifa nova. Corrigir a linha existente reescreveria o
    // passado — por isso as duas acoes sao separadas na tela.
    _addSettingsVigencia() {
      const nova = this._settingsNewTariff;
      if (!nova) return;
      const data = String(nova.data ?? "").trim();
      const valor = String(nova.valor ?? "").trim();
      const existentes = this._settingsTariffKeys();
      let erro = "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) {
        erro = "Informe a data de início de vigência.";
      } else if (existentes.includes(data)) {
        erro = "Já existe uma vigência com essa data.";
      } else if (!/^\d+(\.\d+)?$/.test(valor) || Number(valor) <= 0) {
        erro = "A tarifa deve ser um número positivo com ponto decimal.";
      }
      if (erro) {
        nova.erro = erro;
        this._renderSettingsUpdate();
        return;
      }
      if (!this._settingsDraft) return;
      this._settingsDraft.tarifas[data] = valor;
      this._settingsNewTariff = null;
      this._settingsSaveState = "idle";
      this._settingsSaveMessage = "";
      this._renderSettingsUpdate();
    }

    // Vigencias que a tela conhece: as do YAML, as ajustadas e as que acabaram
    // de ser acrescentadas no rascunho e ainda nao foram gravadas.
    _settingsTariffKeys(dados = this._settings) {
      return Object.keys({
        ...(dados?.distributor_tariffs?.declared ?? {}),
        ...(dados?.distributor_tariffs?.override ?? {}),
        ...(this._settingsDraft?.tarifas ?? {}),
      }).sort();
    }

    _setSettingsDraft(campo, valor, vigencia = null) {
      if (!this._settingsDraft) return;
      if (campo === "boundary") this._settingsDraft.boundary = valor;
      if (campo === "tarifa" && vigencia) this._settingsDraft.tarifas[vigencia] = valor;
      if (campo === "investimento") {
        this._settingsDraft.investimento = this._maskMoney(valor);
      }
      if (campo === "investimentoMes") {
        this._settingsDraft.investimentoMes = this._maskMonth(valor);
      }
      this._settingsSaveState = "idle";
      this._settingsSaveMessage = "";
      this._renderSettingsUpdate();
    }

    // O painel inteiro e refeito a cada mudanca, e isso custava a posicao da
    // rolagem: escolher uma medicao no fim da lista jogava a tela de volta ao
    // topo, e o operador perdia de vista justamente o que acabou de mexer.
    // O mesmo vale para o campo em foco.
    _renderSettingsUpdate() {
      const atual = this.shadowRoot?.querySelector("[data-settings-page]");
      if (!atual) return;

      const posicoes = this._captureSettingsScroll();
      const foco = this._settingsFocusKey();

      atual.replaceWith(this._renderSettingsPage());

      this._restoreSettingsScroll(posicoes);
      this._restoreSettingsFocus(foco);
      this._frameOpenUnit();
    }

    // Leva o titulo da unidade recem aberta para o topo da area que rola.
    // Calculado em vez de `scrollIntoView` porque este ultimo rolaria tambem
    // a pagina atras do dialogo.
    _frameOpenUnit() {
      const alvo = this._modelScrollToUnit;
      if (!alvo) return;
      this._modelScrollToUnit = null;
      requestAnimationFrame(() => {
        const rolavel = this.shadowRoot?.querySelector(
          ".settings-modal .audit-modal-body",
        );
        const cabeca = this.shadowRoot?.querySelector(
          `[data-unit-head="${alvo}"]`,
        );
        if (!rolavel || !cabeca) return;
        const deslocamento = cabeca.getBoundingClientRect().top
          - rolavel.getBoundingClientRect().top;
        rolavel.scrollTop += deslocamento;
      });
    }

    // O campo e reencontrado pelo que ele representa, nao por posicao: a
    // lista pode ter mudado de tamanho entre um desenho e outro.
    _settingsFocusKey() {
      const ativo = this.shadowRoot?.activeElement;
      const dados = ativo?.dataset;
      if (!dados?.action) return null;
      return {
        action: dados.action,
        unit: dados.unit ?? "",
        metric: dados.metric ?? "",
        declared: dados.declared ?? "",
        inicio: ativo.selectionStart ?? null,
        fim: ativo.selectionEnd ?? null,
      };
    }

    _restoreSettingsFocus(chave) {
      // Um campo que acabou de nascer tem prioridade: escolher "Consumo" abre
      // o campo do sensor, e o proximo gesto e digitar nele.
      const pendente = this.shadowRoot?.querySelector(
        '.settings-metric-row.pending input[data-action="unit-metric-entity"]',
      );
      if (pendente) {
        pendente.focus();
        return;
      }
      if (!chave) return;
      const partes = [`[data-action="${chave.action}"]`];
      if (chave.unit) partes.push(`[data-unit="${chave.unit}"]`);
      if (chave.metric) partes.push(`[data-metric="${chave.metric}"]`);
      if (chave.declared) partes.push(`[data-declared="${chave.declared}"]`);
      const alvo = this.shadowRoot?.querySelector(partes.join(""));
      if (!alvo) return;
      alvo.focus();
      // A mascara pode ter inserido um ponto ou um tracao: a posicao guardada
      // antes do redesenho aponta para outro caractere.
      if (chave.action === "settings-investment"
        && typeof alvo.setSelectionRange === "function") {
        try {
          alvo.setSelectionRange(alvo.value.length, alvo.value.length);
        } catch {
          // Campo que nao aceita selecao mantem so o foco.
        }
        return;
      }
      if (chave.inicio !== null && typeof alvo.setSelectionRange === "function") {
        try {
          alvo.setSelectionRange(chave.inicio, chave.fim);
        } catch {
          // Nem todo campo aceita selecao; perder o cursor e aceitavel, o
          // foco e o que importa.
        }
      }
    }

    _renderSettingsPage() {
      const content = this._element("div", "content settings-page");
      content.dataset.settingsPage = "";

      if (this._settingsError && !this._settings) {
        content.append(this._renderError(this._settingsError));
        return content;
      }
      if (!this._settings) {
        content.append(this._historyStatus("Carregando configuração…", "loading"));
        return content;
      }
      const dados = this._settings;

      // Quem acabou de instalar nao veio ajustar nada: veio descobrir por onde
      // comecar. O convite vem antes dos ajustes, que ainda nao tem sobre o
      // que incidir.
      if (this._setupIncomplete) content.append(this._renderWelcome());
      else content.append(this._renderNextStep() ?? this._renderIntegrationShortcut());

      // Cada assunto vira um cartao que abre o proprio dialogo. Empilhados na
      // pagina, os tres formularios competiam pela atencao e o operador lia
      // campos de tarifa quando tinha vindo mexer no horario da leitura.
      content.append(this._renderSettingsLaunchers(dados));

      const host = this._element("div", "settings-modal-host");
      host.dataset.settingsModalHost = "";
      const dialogo = this._renderSettingsModal(dados);
      if (dialogo) host.append(dialogo);
      content.append(host);
      return content;
    }

    // Os passos sao numerados porque sao mesmo uma sequencia: sem unidade nao
    // ha onde pendurar um sensor, e sem unidade nao ha de quem seja a fatura.
    // A numeracao aqui diz algo verdadeiro sobre a ordem, nao e enfeite.
    _renderWelcome() {
      const painel = this._element("section", "panel welcome");
      const semUnidade = this._isEmptyInstallation;
      painel.append(this._element(
        "h3", "welcome-title",
        semUnidade ? "Nenhuma unidade ainda" : "Falta pouco para ter o que mostrar",
      ));
      painel.append(this._element(
        "p", "welcome-text",
        semUnidade
          ? "Uma unidade é cada lugar que recebe uma conta de luz: uma casa, um "
            + "apartamento, um sítio. Crie a primeira na página da integração."
          : "A unidade já existe, mas ainda não há sensor nem fatura para ela. "
            + "Qualquer um dos dois basta: assim que um deles chegar, as outras "
            + "abas aparecem sozinhas.",
      ));

      const passos = this._element("ul", "welcome-steps");
      const definicoes = [
        [
          "Tem medidor no Home Assistant? Aponte o sensor",
          "Em Configurar, na página da integração: \"Adicionar sensor à "
          + "unidade\". Com o sensor vêm o consumo, a previsão e os gráficos.",
        ],
        [
          "Só tem a conta de luz? Leia as faturas",
          "Em \"Extração de faturas\", aqui mesmo: escolha a pasta com os PDFs. "
          + "Com as faturas vêm o consumo oficial, a conta explicada e o "
          + "histórico por mês.",
        ],
      ];
      for (const [titulo, descricao] of definicoes) {
        const passo = this._element("li", "welcome-step");
        passo.append(
          this._element("strong", "welcome-step-title", titulo),
          this._element("span", "welcome-step-text", descricao),
        );
        passos.append(passo);
      }
      painel.append(passos);

      const acoes = this._element("div", "settings-unit-actions");
      acoes.append(this._integrationLink(
        semUnidade ? "Criar a primeira unidade" : "Apontar um sensor",
        "button primary",
      ));
      if (!semUnidade) {
        const faturas = this._button("Ler faturas", "settings-open", "button");
        faturas.dataset.modal = "extracao";
        faturas.setAttribute("aria-haspopup", "dialog");
        acoes.append(faturas);
      }
      painel.append(acoes);
      return painel;
    }

    // A configuracao mora na pagina da integracao, como em qualquer
    // integracao do Home Assistant: la estao unidades, sensores, troca de
    // medidor, rateio, tarifa e investimento. Aqui fica o atalho, e o que so
    // a tela sabe fazer — ler a pasta de faturas do computador de quem usa.
    // O que falta para o painel inteiro aparecer, dito como proximo passo.
    // Sem isso quem apontou um sensor via duas abas e nao sabia que as
    // faturas eram o que abria o resto.
    _renderNextStep() {
      const podem = this._capabilities;
      const semDono = Number(this._invoices?.ucs_without_unit) || 0;
      const lerFaturas = (texto, classe) => {
        const botao = this._button(texto, "settings-open", classe);
        botao.dataset.modal = "extracao";
        botao.setAttribute("aria-haspopup", "dialog");
        return botao;
      };
      let titulo;
      let texto;
      let acoes;
      if (semDono) {
        titulo = "Próximo passo: dizer de quem são as faturas";
        texto = semDono === 1
          ? "Há faturas de uma UC que ainda não é de nenhuma unidade. Enquanto "
            + "ela não tiver dono, essas faturas não aparecem em lugar nenhum."
          : `Há faturas de ${semDono} UCs que ainda não são de nenhuma unidade. `
            + "Enquanto elas não tiverem dono, essas faturas não aparecem em "
            + "lugar nenhum.";
        acoes = [lerFaturas("Escolher a unidade", "button primary")];
      } else if (podem.measurement && !podem.billing) {
        titulo = "Próximo passo: ler as faturas";
        texto = "O sensor já mede o consumo. Com as faturas vêm as datas do "
          + "ciclo, a previsão da próxima conta, o preço estimado, a Visão "
          + "geral e a auditoria, que compara o medido com o cobrado. Leia o "
          + "máximo que tiver: cada fatura antiga vira um mês no histórico.";
        acoes = [lerFaturas("Ler faturas", "button primary")];
      } else if (podem.billing && !podem.measurement) {
        titulo = "Próximo passo: apontar um sensor";
        texto = "As faturas já dão o consumo oficial e o histórico por mês. "
          + "Com um sensor de energia do Home Assistant vêm o consumo de hoje, "
          + "os gráficos por hora, a previsão pelo consumo medido, a Visão "
          + "geral e a auditoria.";
        acoes = [
          this._integrationLink("Apontar um sensor", "button primary"),
          lerFaturas("Ler mais faturas", "button"),
        ];
      } else {
        return null;
      }
      const painel = this._element("section", "panel welcome");
      painel.append(
        this._element("h3", "welcome-title", titulo),
        this._element("p", "welcome-text", texto),
      );
      const linha = this._element("div", "settings-unit-actions");
      linha.append(...acoes);
      painel.append(linha);
      return painel;
    }

    _renderIntegrationShortcut() {
      const painel = this._element("section", "panel welcome");
      painel.append(this._element("h3", "welcome-title", "Configuração da integração"));
      painel.append(this._element(
        "p", "welcome-text",
        "Unidades, sensores, troca de medidor, rateio, tarifa e investimento "
        + "se configuram na página da integração, em Configurar. As faturas "
        + "continuam sendo lidas aqui.",
      ));
      painel.append(this._integrationLink("Abrir a configuração", "button primary"));
      return painel;
    }

    _integrationLink(texto, className) {
      const destino = "/config/integrations/integration/co_energy";
      const link = this._element("a", className, texto);
      link.href = destino;
      // Navegacao interna do Home Assistant: sem recarregar a pagina inteira.
      link.addEventListener("click", (evento) => {
        if (evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
        evento.preventDefault();
        window.history.pushState(null, "", destino);
        window.dispatchEvent(new CustomEvent("location-changed", {
          detail: { replace: false },
        }));
      });
      return link;
    }

    _renderSettingsLaunchers(dados) {
      const grade = this._element("div", "settings-launchers");
      const tarifas = {
        ...(dados.distributor_tariffs?.declared ?? {}),
        ...(dados.distributor_tariffs?.effective ?? {}),
      };
      const vigenteAtual = Object.keys(tarifas).sort().pop() ?? null;
      // Fronteira do ciclo e tarifa so existem com sensor: a fronteira alinha
      // a data da fatura com a leitura do medidor, e a tarifa estima o preco
      // do ciclo em andamento a partir do consumo medido. Quem so tem fatura
      // tem o preco na propria fatura — os dois cartoes seriam perguntas sem
      // efeito nenhum.
      const comSensor = this._capabilities.measurement;
      const definicoes = [
        ...(comSensor ? [[
          "ciclo",
          "mdi:clock-outline",
          "Fronteira do ciclo",
          "Horário que o sistema assume para toda leitura de medidor.",
          dados.boundary_time?.effective ?? "—",
        ], [
          "tarifa",
          "mdi:cash-multiple",
          "Tarifa da distribuidora",
          "Base do preço usada quando a fatura do ciclo não publica a própria.",
          vigenteAtual
            ? `${tarifas[vigenteAtual]} · desde ${this._formatDate(vigenteAtual)}`
            : "—",
        ]] : []),
        [
          "unidades",
          "mdi:home-group",
          "Unidades",
          "Quais unidades existem, como se chamam e quais geram energia.",
          this._unitsLauncherSummary(),
        ],
        // A tela de sensores existia para adaptar um modelo que nao se podia
        // editar. Com o modelo no Home Assistant, editar o original substitui
        // a sobreposicao — e manter as duas seria oferecer dois caminhos para
        // o mesmo destino, sem deixar claro qual vence.
        ...(this._modelConfig?.source === "file" ? [[
          "sensores",
          "mdi:tune-vertical",
          "Sensores das unidades",
          "De qual entidade vem cada medição, e o que fazer quando ela não "
          + "existe nesta instalação.",
          this._sensorsLauncherSummary(),
        ]] : []),
        // Sem unidade que gera, nao ha payback, e perguntar quanto custou o
        // sistema solar de quem nao tem um so confunde. Quem marcar uma
        // unidade como geradora ve o cartao aparecer.
        ...(dados.solar_investment?.applies ? [[
          "investimento",
          "mdi:solar-power-variant",
          "Investimento no sistema solar",
          "Quanto custou e quando foi pago. É o que o payback tem a recuperar.",
          this._investmentLauncherSummary(dados),
        ]] : []),
        // O rateio so existe com geradora E mais de uma unidade: numa casa
        // sozinha, distribuir credito e devolve-lo a quem o gerou.
        //
        // O editor sempre existiu, e so abria pela Visao geral — que numa
        // instalacao nova estava vazia JUSTAMENTE por falta de rateio. Ele
        // estava trancado do lado de dentro.
        ...(this._capabilities.distribution ? [[
          "rateio",
          "mdi:chart-donut",
          "Rateio entre as unidades",
          "Qual percentual do crédito cabe a cada unidade, e desde quando.",
          this._distributionLauncherSummary(),
        ]] : []),
        [
          "extracao",
          "mdi:file-pdf-box",
          "Extração de faturas",
          "Lê as faturas em PDF e diz de qual unidade é cada uma.",
          this._invoicesLauncherSummary(),
        ],
      ];
      for (const [id, icone, titulo, descricao, valor] of definicoes) {
        const botao = this._button("", "settings-open", "settings-launcher");
        botao.dataset.modal = id;
        botao.setAttribute("aria-haspopup", "dialog");
        const marca = this._element("ha-icon", "settings-launcher-icon");
        marca.setAttribute("icon", icone);
        const texto = this._element("div", "settings-launcher-copy");
        texto.append(
          this._element("span", "settings-launcher-title", titulo),
          this._element("span", "settings-launcher-desc", descricao),
        );
        const estado = this._element("div", "settings-launcher-state");
        estado.append(this._element("span", "num settings-launcher-value", valor));
        botao.append(marca, texto, estado);
        grade.append(botao);
      }
      return grade;
    }

    // Uma linha só, e a que muda: se está rodando, o quanto já andou; parado,
    // quando foi a última leitura.
    // O cartao resume pelo que exige acao. Um sensor que nao existe e o unico
    // caso que se resolve aqui, entao e ele que aparece; sem nenhum, o resumo
    // e a contagem, que nao pede nada de ninguem.
    // O cartao resume pelo que falta fazer: uma unidade sem sensor e o que
    // impede a instalacao de funcionar, e vem antes da contagem.
    _unitsLauncherSummary() {
      if (!this._modelConfig) return "—";
      const unidades = this._modelConfig.units ?? [];
      if (!unidades.length) return "—";
      if (this._modelConfig.source === "file") return "no arquivo";
      const semSensor = unidades.filter((u) => !Number(u.sensor_count)).length;
      if (semSensor) return `${semSensor} sem sensor`;
      return `${unidades.length} ${unidades.length === 1 ? "unidade" : "unidades"}`;
    }

    _investmentLauncherSummary(dados = this._settings) {
      const vigente = dados?.solar_investment?.effective;
      if (!vigente?.amount) return "não informado";
      return `${this._formatCurrency(Number(vigente.amount))} · ${vigente.period}`;
    }

    _sensorsLauncherSummary() {
      if (!this._sensors) return "—";
      const fontes = this._sensorSources();
      if (!fontes.length) return "—";
      // So conta como ausente a fonte que ainda esta em uso: uma fonte
      // encerrada aponta para um medidor que foi removido de proposito, e
      // cobrar a entidade dela mandaria consertar o que nao esta quebrado.
      const ausentes = fontes.filter(
        (f) => f.presence === "missing" && f.active !== false,
      ).length;
      if (ausentes) return `${ausentes} sem entidade`;
      const trocados = fontes.filter((f) => f.overridden).length;
      if (trocados) return `${trocados} ajustado${trocados > 1 ? "s" : ""}`;
      return `${fontes.length} sensores`;
    }

    _renderSettingsModal(dados) {
      const vista = this._settingsModal;
      if (!vista) return null;
      const titulos = {
        ciclo: "Fronteira do ciclo",
        tarifa: "Tarifa da distribuidora",
        unidades: "Unidades desta instalação",
        sensores: "Sensores das unidades",
        investimento: "Investimento no sistema solar",
        rateio: "Rateio entre as unidades",
        extracao: "Extração de faturas",
      };
      if (!titulos[vista]) return null;

      const overlay = this._element("div", "audit-modal-overlay");
      // O despacho global so olha <button>; o clique no fundo precisa do
      // proprio ouvinte, e so fecha quando o alvo e o fundo.
      overlay.addEventListener("click", (event) => {
        if (event.target !== overlay) return;
        this._closeSettingsModal();
      });
      const dialogo = this._element("div", "audit-modal audit-modal-wide settings-modal");
      dialogo.setAttribute("role", "dialog");
      dialogo.setAttribute("aria-modal", "true");
      dialogo.setAttribute("aria-label", titulos[vista]);

      const cabeca = this._element("div", "audit-modal-head");
      cabeca.append(this._element("div", "audit-modal-title", titulos[vista]));
      const fechar = this._button("✕", "settings-modal-close", "audit-modal-close");
      fechar.setAttribute("aria-label", "Fechar");
      cabeca.append(fechar);
      dialogo.append(cabeca);

      const corpo = this._element("div", "audit-modal-body");
      if (vista === "ciclo") {
        corpo.append(this._renderSettingsBoundary(dados));
        corpo.append(this._renderSettingsActions(dados));
      } else if (vista === "tarifa") {
        corpo.append(this._renderSettingsTariffs(dados));
        corpo.append(this._renderSettingsActions(dados));
      } else if (vista === "investimento") {
        corpo.append(this._renderSettingsInvestment(dados));
        // Numa instalacao nova nada foi declarado, e nao ha o que restaurar:
        // o que existe e apagar o que se informou. Chamar isso de "restaurar
        // o declarado" prometeria um valor que nao existe em lugar nenhum.
        corpo.append(this._renderSettingsActions(
          dados,
          dados.solar_investment?.declared
            ? { rotulo: "Restaurar o declarado", acao: "settings-reset" }
            : ((this._settingsDraft?.investimento
                || dados.solar_investment?.override)
              ? { rotulo: "Limpar o valor", acao: "settings-clear-investment" }
              : false),
        ));
      } else if (vista === "unidades") {
        corpo.append(this._renderUnitsPanel());
      } else if (vista === "sensores") {
        corpo.append(this._renderSensorsPanel());
      } else if (vista === "rateio") {
        // O mesmo editor que a Visao geral abre. Ele sempre existiu; o que
        // faltava era uma porta que nao dependesse de a Visao geral ter
        // conteudo — e numa instalacao nova ela nao tem, justamente por falta
        // de rateio.
        corpo.append(this._renderDistribution({ modal: true }));
      } else {
        corpo.append(this._renderInvoicePanel());
      }
      dialogo.append(corpo);
      overlay.append(dialogo);
      return overlay;
    }

    // Aplicar e restaurar valem para o rascunho inteiro, não só para o campo
    // que está aberto: são os mesmos dois botões nos dois diálogos.
    _renderSettingsActions(dados, voltar = null) {
      const acoes = this._element("div", "settings-actions");
      const validacao = this._settingsValidation();
      const salvar = this._button("Aplicar ajustes", "settings-save", "button primary");
      salvar.disabled = Boolean(validacao) || this._settingsSaveState === "saving";
      acoes.append(salvar);
      // Sem `voltar`, vale o botao de sempre: os dois outros dialogos editam
      // valores que o modelo sempre declara.
      const padrao = { rotulo: "Restaurar o declarado", acao: "settings-reset" };
      const escolhido = voltar === null ? padrao : voltar;
      if (escolhido) {
        acoes.append(this._button(escolhido.rotulo, escolhido.acao, "button"));
      }
      const mensagem = validacao || this._settingsSaveMessage;
      if (mensagem) {
        acoes.append(this._element(
          "p",
          `settings-message ${validacao || this._settingsSaveState === "error" ? "error" : "ok"}`,
          this._settingsSaveState === "saving" ? "Gravando…" : mensagem,
        ));
      }
      if (dados.updated_at) {
        acoes.append(this._element(
          "small", "settings-stamp",
          `Último ajuste em ${this._formatDistributionDate(dados.updated_at, "—")}`,
        ));
      }
      return acoes;
    }

    _distributionLauncherSummary() {
      const regra = this._distributionData?.current;
      if (!regra) return "não informado";
      const partes = Object.entries(regra.shares ?? {})
        // A ordem e (valor, MAXIMO, minimo). Invertida, pede minimo 1 e
        // maximo 0 — e o Intl recusa com "maximumFractionDigits value is out
        // of range", derrubando a tela inteira por causa de um resumo.
        .map(([id, valor]) => (
          `${this._unitLabel(id)} ${this._formatNumber(Number(valor), 1, 0)}%`
        ));
      return partes.length ? partes.join(" · ") : "não informado";
    }

    _invoicesLauncherSummary() {
      const dados = this._invoices;
      if (this._invoiceRun && !this._invoiceRun.fim) {
        return `${this._invoiceRun.feitos} de ${this._invoiceRun.total}`;
      }
      if (!dados?.available || !dados.bills) return null;
      if (dados.ucs_without_unit) {
        return `${dados.ucs_without_unit} UC sem unidade`;
      }
      return `${dados.bills} faturas`;
    }

    async _loadInvoices({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!force && (this._invoices || this._invoicesLoading)) return this._invoices;
      this._invoicesLoading = true;
      try {
        const resposta = await this._hass.callWS({ type: INVOICES_GET_COMMAND });
        if (resposta?.api_version === API_VERSION && resposta.data) {
          this._invoices = resposta.data;
        }
      } catch (_) {
        // Integracao antiga, sem o comando: a tela mostra so o extrator antigo.
        this._invoices = { available: false };
      } finally {
        this._invoicesLoading = false;
      }
      this._renderInvoiceUpdate();
      return this._invoices;
    }

    _renderInvoiceUpdate() {
      const atual = this.shadowRoot?.querySelector("[data-invoice-panel]");
      if (atual) {
        atual.replaceWith(this._renderInvoicePanel());
        return;
      }
      if (this._page === "configuracao") this._renderSettingsUpdate();
    }

    _invoiceNotice(texto, tipo = "ok") {
      this._invoiceMessage = texto;
      this._invoiceMessageKind = tipo;
      this._renderInvoiceUpdate();
    }

    // O que o servidor recusa chega em ingles, para o log; aqui vira o que
    // quem enviou precisa saber para decidir se o arquivo importa.
    _invoiceErrorText(bruto, status) {
      const texto = String(bruto ?? "");
      if (status === 404) {
        return "Este Home Assistant ainda não lê faturas: atualize a integração "
          + "e reinicie.";
      }
      if (/unavailable/.test(texto)) {
        return "A leitura de faturas não está pronta. Reinicie o Home Assistant.";
      }
      if (/only PDF|not a PDF/.test(texto)) return "não é um PDF";
      if (/empty/.test(texto)) return "arquivo vazio";
      if (/too large/.test(texto)) return "grande demais para ser uma fatura";
      if (/reference could not be read/.test(texto)) {
        return "não foi possível ler o mês de referência";
      }
      if (/could not read the invoice/.test(texto)) {
        return "não parece uma fatura da Equatorial, ou o PDF está danificado";
      }
      return texto || `falhou (HTTP ${status ?? "?"})`;
    }

    // Le a pasta escolhida inteira, mas so envia o que o Home Assistant ainda
    // nao tem. A pergunta "ja tenho?" e feita pelo conteudo, nao pelo nome:
    // renomear um PDF nao o faz ser lido de novo.
    async _importInvoiceFiles(arquivos) {
      if (this._invoiceRun && !this._invoiceRun.fim) {
        this._invoiceNotice(
          "Ainda estou lendo a escolha anterior. Espere terminar e escolha de novo.",
          "warn",
        );
        return;
      }
      const pdfs = arquivos.filter((arquivo) => /\.pdf$/i.test(arquivo.name ?? ""));
      this._invoiceCompare = null;
      if (!pdfs.length) {
        this._invoiceNotice(
          arquivos.length
            ? "Nenhum PDF no que foi escolhido. Se os PDFs estão em subpastas e o "
              + "seletor não entrou nelas — acontece no celular —, escolha uma "
              + "subpasta de cada vez, ou use Escolher arquivos."
            : "O seletor não devolveu nenhum arquivo. No celular, escolher a pasta "
              + "de cima nem sempre funciona: escolha uma subpasta de cada vez, "
              + "ou use Escolher arquivos.",
          "warn",
        );
        return;
      }
      await this._loadInvoices({ force: true });
      if (!this._invoices?.available) {
        this._invoiceNotice(this._invoiceErrorText("", 404), "error");
        return;
      }
      const conhecidos = new Set(this._invoices.known_files ?? []);
      const lote = {
        total: pdfs.length, feitos: 0, atual: "", novos: 0, pulados: 0,
        recusados: [], fim: false,
      };
      this._invoiceRun = lote;
      this._invoiceMessage = "";
      this._renderInvoiceUpdate();

      // O lote termina sempre, com ou sem erro no meio: um lote que nunca
      // termina travava a proxima escolha em silencio.
      try {
        for (const arquivo of pdfs) {
          lote.atual = arquivo.name;
          this._renderInvoiceUpdate();
          let digest = null;
          try {
            digest = await sha256Hex(await arquivo.arrayBuffer());
          } catch (_) {
            digest = null;
          }
          if (digest && conhecidos.has(digest)) {
            lote.pulados += 1;
            lote.feitos += 1;
            continue;
          }
          try {
            const corpo = new FormData();
            corpo.append("file", arquivo, arquivo.name);
            const resposta = await this._fetchWithAuth(INVOICE_UPLOAD_URL, {
              method: "POST", body: corpo,
            });
            const dados = await resposta.json().catch(() => null);
            if (!resposta.ok) {
              throw new Error(this._invoiceErrorText(dados?.message, resposta.status));
            }
            if (dados?.new === false) lote.pulados += 1;
            else lote.novos += 1;
            if (digest) conhecidos.add(digest);
          } catch (error) {
            lote.recusados.push({ nome: arquivo.name, motivo: error?.message ?? "falhou" });
            // Sem o endpoint, nenhum dos seguintes vai passar: parar poupa uma
            // lista de trinta recusas iguais.
            if (/ainda não lê faturas/.test(error?.message ?? "")) break;
          }
          lote.feitos += 1;
          this._renderInvoiceUpdate();
        }
      } catch (error) {
        lote.recusados.push({ nome: "(leitura interrompida)", motivo: error?.message ?? "falhou" });
      } finally {
        lote.fim = true;
      }
      lote.atual = "";
      const partes = [`${lote.total} PDF${lote.total > 1 ? "s" : ""} na pasta`];
      partes.push(`${lote.novos} lido${lote.novos === 1 ? "" : "s"} agora`);
      if (lote.pulados) partes.push(`${lote.pulados} já conhecido${lote.pulados === 1 ? "" : "s"}`);
      if (lote.recusados.length) partes.push(`${lote.recusados.length} recusado${lote.recusados.length === 1 ? "" : "s"}`);
      this._invoiceMessage = partes.join(" · ") + ".";
      this._invoiceMessageKind = lote.recusados.length ? "warn" : "ok";
      await this._loadInvoices({ force: true });
      // A primeira fatura pode ser o que destrava as outras abas: sem refazer
      // o catalogo, elas so apareciam depois de recarregar a pagina.
      this._forgetUnitData();
      this._loadUnitCatalog({ force: true });
    }

    // Dar dono a uma UC e corrigir o dono sao o mesmo gesto. Mover pede
    // confirmacao porque leva todas as faturas da UC junto — as antigas
    // tambem —, e isso aparece em outra unidade na mesma hora.
    async _setInvoiceUcOwner(ucHash, unitId) {
      const uc = (this._invoices?.ucs ?? []).find((item) => item.hash === ucHash);
      if (!uc) return;
      const nome = (id) => (this._invoices?.units ?? []).find((u) => u.unit_id === id)?.name ?? id;
      const faturas = `${uc.bills} fatura${uc.bills === 1 ? "" : "s"}`;
      if (uc.unit_id && uc.unit_id !== unitId) {
        const texto = unitId
          ? `Mover as ${faturas} da UC ${this._invoiceUcLabel(uc)} de ${nome(uc.unit_id)} `
            + `para ${nome(unitId)}?`
          : `Deixar a UC ${this._invoiceUcLabel(uc)} sem unidade? As ${faturas} `
            + `dela deixam de aparecer em ${nome(uc.unit_id)}.`;
        if (!window.confirm(texto)) {
          this._renderInvoiceUpdate();
          return;
        }
      }
      this._invoiceBusy = true;
      this._renderInvoiceUpdate();
      try {
        const resposta = await this._hass.callWS({
          type: INVOICES_OWNER_COMMAND, uc_hash: ucHash, unit_id: unitId,
        });
        if (resposta?.data) this._invoices = resposta.data;
        this._invoiceCompare = null;
        this._invoiceMessage = unitId
          ? `As ${faturas} da UC ${this._invoiceUcLabel(uc)} agora são de ${nome(unitId)}.`
          : `A UC ${this._invoiceUcLabel(uc)} ficou sem unidade.`;
        this._invoiceMessageKind = "ok";
        // O modelo mudou: a lista de unidades da configuracao tambem — e o que
        // cada unidade tem, que decide quais abas aparecem.
        this._modelConfig = null;
        this._forgetUnitData();
        this._loadUnitCatalog({ force: true });
      } catch (error) {
        this._invoiceMessage = error?.message ?? "Não foi possível gravar.";
        this._invoiceMessageKind = "error";
      } finally {
        this._invoiceBusy = false;
        this._renderInvoiceUpdate();
      }
    }

    async _compareInvoices() {
      this._invoiceBusy = true;
      this._renderInvoiceUpdate();
      try {
        const resposta = await this._hass.callWS({ type: INVOICES_COMPARE_COMMAND });
        this._invoiceCompare = resposta?.data ?? null;
        this._invoiceMessage = "";
      } catch (error) {
        this._invoiceMessage = error?.message ?? "Não foi possível comparar.";
        this._invoiceMessageKind = "error";
      } finally {
        this._invoiceBusy = false;
        this._renderInvoiceUpdate();
      }
    }

    async _useInvoiceStorage(usar) {
      const texto = usar
        ? "Passar a usar as faturas lidas pelo Home Assistant em todas as telas? "
          + "O arquivo antigo não é apagado, e dá para voltar."
        : "Voltar a usar o arquivo do extrator antigo em todas as telas?";
      if (!window.confirm(texto)) return;
      this._invoiceBusy = true;
      this._renderInvoiceUpdate();
      try {
        const resposta = await this._hass.callWS({ type: INVOICES_USE_COMMAND, use: usar });
        if (resposta?.data) this._invoices = resposta.data;
        this._invoiceMessage = usar
          ? "Pronto: as telas passam a usar as faturas lidas pelo Home Assistant. "
            + "Recarregue a página para ver todas com elas."
          : "Pronto: as telas voltam a usar o arquivo antigo. Recarregue a página.";
        this._invoiceMessageKind = "ok";
      } catch (error) {
        this._invoiceMessage = error?.message ?? "Não foi possível trocar a fonte.";
        this._invoiceMessageKind = "error";
      } finally {
        this._invoiceBusy = false;
        this._renderInvoiceUpdate();
      }
    }

    async _exportInvoices() {
      try {
        const resposta = await this._hass.callWS({ type: INVOICES_EXPORT_COMMAND });
        const conteudo = JSON.stringify(resposta?.data ?? {}, null, 2);
        const blob = new Blob([conteudo], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const hoje = new Date().toISOString().slice(0, 10);
        link.download = `faturas_energia_v6_${hoje}.json`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      } catch (error) {
        this._invoiceNotice(error?.message ?? "Não foi possível exportar.", "error");
      }
    }

    _invoiceUcLabel(uc) {
      return uc.suffix ? `•••• ${uc.suffix}` : "sem número";
    }

    // Um seletor de arquivo escondido atras de um rotulo com cara de botao,
    // o mesmo recurso da foto da unidade: <input type=file> nao se estiliza.
    _invoicePicker(rotulo, acao, pasta) {
      const botao = this._element("label", "button settings-unit-file");
      botao.append(this._element("span", "", rotulo));
      const campo = this._element("input", "settings-unit-file-input");
      campo.type = "file";
      campo.multiple = true;
      campo.dataset.action = acao;
      if (pasta) campo.setAttribute("webkitdirectory", "");
      else campo.accept = ".pdf,application/pdf";
      campo.disabled = Boolean(this._invoiceRun && !this._invoiceRun.fim);
      botao.append(campo);
      return botao;
    }

    _renderInvoicePanel() {
      const painel = this._element("section", "panel settings-panel");
      painel.dataset.invoicePanel = "";
      painel.append(this._settingsHead(
        "Faturas",
        "Ler faturas do computador",
        "Escolha a pasta onde você guarda os PDFs. O Home Assistant lê só os "
        + "que ainda não conhece, tira os dados e descarta o arquivo — o PDF "
        + "continua só no seu computador.",
      ));
      const dados = this._invoices;
      if (dados && dados.available === false) {
        painel.append(this._element(
          "p", "settings-note",
          "Esta instalação ainda não lê faturas. Atualize a integração e "
          + "reinicie o Home Assistant.",
        ));
        return painel;
      }

      const escolher = this._element("div", "settings-unit-actions");
      escolher.append(
        this._invoicePicker("Escolher pasta", "invoice-folder", true),
        this._invoicePicker("Escolher arquivos", "invoice-files", false),
      );
      painel.append(escolher);

      const lote = this._invoiceRun;
      if (lote && !lote.fim) painel.append(this._renderInvoiceProgress(lote));
      if (this._invoiceMessage) {
        painel.append(this._element(
          "p", `settings-message ${this._invoiceMessageKind}`, this._invoiceMessage,
        ));
      }
      if (lote?.fim && lote.recusados.length) {
        const lista = this._element("ul", "invoice-refusals");
        for (const item of lote.recusados) {
          const linha = this._element("li");
          linha.append(
            this._element("span", "invoice-refusal-name", maskLongNumbers(item.nome)),
            this._element("span", "invoice-refusal-reason", item.motivo),
          );
          lista.append(linha);
        }
        painel.append(lista);
      }

      if (!dados?.bills) return painel;
      painel.append(this._renderInvoiceOwners(dados));
      painel.append(this._renderInvoiceSource(dados));
      return painel;
    }

    _renderInvoiceBills(uc) {
      const lista = this._element("div", "invoice-bill-list");
      const digests = (uc.invoices ?? []).map((f) => f.digest).filter(Boolean);
      if (digests.length > 1) {
        const todas = this._button(
          `Apagar as ${digests.length} faturas desta UC`,
          "invoice-delete-uc", "button invoice-bill-delete",
        );
        todas.dataset.uc = uc.hash;
        todas.dataset.label = `UC ${this._invoiceUcLabel(uc)}`;
        todas.disabled = this._invoiceBusy;
        lista.append(todas);
      }
      for (const fatura of uc.invoices ?? []) {
        const item = this._element("div", "invoice-bill");
        const partes = [fatura.reference ?? "—"];
        if (typeof fatura.consumption_kwh === "number") {
          partes.push(`${this._formatNumber(fatura.consumption_kwh, 0, 0)} kWh`);
        }
        if (typeof fatura.total_amount === "number") {
          partes.push(this._formatCurrency(fatura.total_amount, "BRL"));
        }
        item.append(this._element("span", "num invoice-bill-text", partes.join(" · ")));
        const apagar = this._button("Apagar", "invoice-delete", "button invoice-bill-delete");
        apagar.dataset.digest = fatura.digest ?? "";
        apagar.dataset.label = `${fatura.reference ?? "esta fatura"} da UC ${this._invoiceUcLabel(uc)}`;
        apagar.disabled = this._invoiceBusy || !fatura.digest;
        item.append(apagar);
        lista.append(item);
      }
      return lista;
    }

    // Sobras de uma unidade excluida, ou PDFs de outra pessoa: apagar um a um
    // era clicar e confirmar para cada mes. Uma confirmacao, todas da UC.
    async _deleteUcInvoices(ucHash, rotulo) {
      const uc = (this._invoices?.ucs ?? []).find((item) => item.hash === ucHash);
      const digests = (uc?.invoices ?? []).map((f) => f.digest).filter(Boolean);
      if (!digests.length) return;
      if (!window.confirm(
        `Apagar as ${digests.length} faturas da ${rotulo}? Para trazê-las de `
        + "volta, basta ler os mesmos PDFs de novo.",
      )) return;
      this._invoiceBusy = true;
      this._renderInvoiceUpdate();
      let apagadas = 0;
      try {
        for (const digest of digests) {
          const resposta = await this._hass.callWS({ type: INVOICE_DELETE_COMMAND, digest });
          if (resposta?.data) this._invoices = resposta.data;
          apagadas += 1;
        }
        this._invoiceMessage = `${apagadas} faturas da ${rotulo} apagadas.`;
        this._invoiceMessageKind = "ok";
      } catch (error) {
        this._invoiceMessage = `${apagadas} de ${digests.length} apagadas; `
          + (error?.message ?? "a seguinte falhou.");
        this._invoiceMessageKind = "error";
      } finally {
        this._invoiceBusy = false;
        this._forgetUnitData();
        this._loadUnitCatalog({ force: true });
        this._renderInvoiceUpdate();
      }
    }

    async _deleteInvoice(digest, rotulo) {
      if (!digest) return;
      if (!window.confirm(
        `Apagar a fatura ${rotulo}? Os cálculos desse ciclo passam a ficar sem `
        + "o dado oficial. Para trazê-la de volta, basta enviar o mesmo PDF de novo.",
      )) return;
      this._invoiceBusy = true;
      this._renderInvoiceUpdate();
      try {
        const resposta = await this._hass.callWS({ type: INVOICE_DELETE_COMMAND, digest });
        if (resposta?.data) this._invoices = resposta.data;
        this._invoiceMessage = `Fatura ${rotulo} apagada.`;
        this._forgetUnitData();
        this._loadUnitCatalog({ force: true });
        this._invoiceMessageKind = "ok";
        // Ciclos, auditoria e custo se montam a partir das faturas: o que
        // estava em cache ainda conta com a que saiu.
        this._cyclesCatalogCache?.clear?.();
      } catch (error) {
        this._invoiceMessage = error?.message ?? "Não foi possível apagar a fatura.";
        this._invoiceMessageKind = "error";
      } finally {
        this._invoiceBusy = false;
        this._renderInvoiceUpdate();
      }
    }

    _renderInvoiceProgress(lote) {
      const caixa = this._element("div", "extraction-progress");
      const trilho = this._element("div", "extraction-bar");
      const preenchido = this._element("span", "extraction-bar-fill");
      preenchido.style.width = `${Math.min(100, (lote.feitos / lote.total) * 100)}%`;
      trilho.append(preenchido);
      caixa.append(trilho);
      const legenda = this._element("div", "extraction-progress-legend");
      legenda.append(this._element("span", "num", `${lote.feitos} de ${lote.total} PDFs`));
      if (lote.atual) {
        legenda.append(this._element("span", "extraction-file", maskLongNumbers(lote.atual)));
      }
      caixa.append(legenda);
      return caixa;
    }

    // Cada UC aponta para uma unidade. Sem dono, ela vem primeiro e marcada:
    // e a unica pergunta que a tela precisa que alguem responda.
    _renderInvoiceOwners(dados) {
      const secao = this._metricSection(
        "De qual unidade é cada UC",
        "todas as faturas da UC, as antigas e as que vierem, aparecem na unidade escolhida",
      );
      for (const uc of dados.ucs ?? []) {
        const semDono = !uc.unit_id;
        const linha = this._element("div", `invoice-uc-row${semDono ? " sem-dono" : ""}`);
        const id = this._element("div", "invoice-uc-id");
        id.append(this._element("span", "invoice-uc-number", `UC ${this._invoiceUcLabel(uc)}`));
        if (semDono) id.append(this._element("span", "tag tag-warn settings-tag", "Sem unidade"));
        linha.append(id);

        const periodo = uc.first_reference === uc.last_reference
          ? uc.first_reference
          : `${uc.first_reference} → ${uc.last_reference}`;
        // O periodo abre a lista das faturas da UC: e de la que se apaga a
        // que entrou errada. Fechada por padrao — a lista toda aberta seria
        // um paredao de linhas para quem so veio dizer de quem e cada UC.
        const aberta = this._invoiceOpenUcs?.has(uc.hash) ?? false;
        const abrir = this._button(
          `${aberta ? "▾" : "▸"} ${periodo} · ${uc.bills} fatura${uc.bills === 1 ? "" : "s"}`,
          "invoice-uc-toggle",
          "invoice-uc-period invoice-uc-toggle",
        );
        abrir.dataset.uc = uc.hash;
        abrir.setAttribute("aria-expanded", String(aberta));
        linha.append(abrir);

        const escolha = this._element("select", "settings-input invoice-uc-owner");
        escolha.dataset.action = "invoice-uc-owner";
        escolha.dataset.uc = uc.hash;
        escolha.disabled = this._invoiceBusy;
        escolha.setAttribute("aria-label", `Unidade da UC ${this._invoiceUcLabel(uc)}`);
        const vazio = this._element("option", "", semDono ? "De qual unidade é?" : "— sem unidade —");
        vazio.value = "";
        escolha.append(vazio);
        for (const unidade of dados.units ?? []) {
          const opcao = this._element("option", "", unidade.name);
          opcao.value = unidade.unit_id;
          escolha.append(opcao);
        }
        escolha.value = uc.unit_id ?? "";
        linha.append(escolha);
        secao.append(linha);
        if (aberta) secao.append(this._renderInvoiceBills(uc));
      }
      if (dados.bills_without_uc) {
        secao.append(this._element(
          "p", "settings-note",
          `${dados.bills_without_uc} fatura${dados.bills_without_uc === 1 ? "" : "s"} `
          + "sem UC legível no PDF: não há como dizer de quem são.",
        ));
      }
      return secao;
    }

    // A chave que troca a fonte. Antes de virar, compara-se: se sair igual,
    // trocar nao muda nenhuma tela.
    _renderInvoiceSource(dados) {
      // Sem arquivo declarado nao ha duas fontes: as faturas lidas aqui sao a
      // unica que existe. Falar em "arquivo antigo" para quem nunca teve um,
      // e oferecer voltar para ele, mandava a instalacao nova para uma fonte
      // inexistente — e o faturamento ficava vazio ate alguem desfazer.
      const temArquivo = dados.has_file === true;
      const secao = this._metricSection(
        "Fonte das faturas",
        !temArquivo
          ? "as faturas lidas pelo Home Assistant"
          : dados.in_use
            ? "em uso: as faturas lidas pelo Home Assistant"
            : "em uso: o arquivo do extrator antigo — as lidas aqui esperam você conferir",
      );
      const acoes = this._element("div", "settings-unit-actions");
      if (temArquivo) {
        const comparar = this._button(
          "Comparar com o arquivo atual", "invoice-compare", "button",
        );
        comparar.disabled = this._invoiceBusy;
        const virar = dados.in_use
          ? this._button("Voltar para o arquivo antigo", "invoice-unuse", "button")
          : this._button("Usar as faturas do HA", "invoice-use", "button primary");
        virar.disabled = this._invoiceBusy;
        acoes.append(comparar, virar);
      }
      const exportar = this._button("Exportar JSON", "invoice-export", "button");
      acoes.append(exportar);
      secao.append(acoes);

      if (!dados.in_use && dados.ucs_without_unit) {
        secao.append(this._element(
          "p", "settings-message warn",
          `${dados.ucs_without_unit} UC sem unidade: as faturas dela não aparecem `
          + "em nenhuma tela até você dizer de quem são.",
        ));
      }
      const resultado = this._invoiceCompare;
      if (resultado) secao.append(this._renderInvoiceCompare(resultado));
      secao.append(this._element(
        "small", "settings-stamp",
        "Uma cópia JSON é gravada a cada leitura em /config/co_energy/faturas/, "
        + "guardando os 12 dias mais recentes.",
      ));
      return secao;
    }

    _renderInvoiceCompare(resultado) {
      const caixa = this._element("div", "invoice-compare");
      const nome = (id) => (this._invoices?.units ?? []).find((u) => u.unit_id === id)?.name
        ?? id ?? "sem unidade";
      if (resultado.equal) {
        caixa.append(this._element(
          "p", "settings-message ok",
          `Iguais: as ${resultado.bills_in_both} faturas são as mesmas do arquivo, `
          + "nas mesmas unidades. Trocar a fonte não muda nenhuma tela.",
        ));
        return caixa;
      }
      caixa.append(this._element(
        "p", "settings-message warn",
        `${resultado.bills_in_both} faturas nos dois lados. Diferenças:`,
      ));
      const grupos = [
        ["Só nas lidas pelo HA", resultado.only_in_storage, (i) => `${nome(i.unit)} · ${i.reference ?? "?"}`],
        ["Só no arquivo antigo", resultado.only_in_file, (i) => `${nome(i.unit)} · ${i.reference ?? "?"}`],
        ["Lidas de outro jeito", resultado.different, (i) => (
          i.unit_before && i.unit_before !== i.unit
            ? `${i.reference ?? "?"} · ${nome(i.unit_before)} → ${nome(i.unit)}`
            : `${nome(i.unit)} · ${i.reference ?? "?"}`
        )],
      ];
      for (const [titulo, itens, texto] of grupos) {
        if (!itens?.length) continue;
        caixa.append(this._element("span", "settings-derived-label", titulo));
        const lista = this._element("ul", "invoice-compare-list");
        for (const item of itens) lista.append(this._element("li", "", texto(item)));
        caixa.append(lista);
      }
      return caixa;
    }

    _renderUnitsPanel() {
      const painel = this._element("section", "panel settings-panel");
      painel.append(this._settingsHead(
        "Unidades",
        "Unidades desta instalação",
        "Quais unidades existem, como se chamam, quais geram energia e qual "
        + "foto representa cada uma.",
      ));

      if (this._modelError && !this._modelConfig) {
        painel.append(this._renderError(this._modelError));
        return painel;
      }
      if (!this._modelConfig) {
        painel.append(this._historyStatus("Carregando unidades…", "loading"));
        return painel;
      }

      const dados = this._modelConfig;
      const doArquivo = dados.source === "file";
      if (doArquivo) painel.append(this._renderModelImportNotice(dados));

      for (const unidade of dados.units ?? []) {
        painel.append(this._renderUnitRow(unidade, doArquivo));
      }

      if (!doArquivo) painel.append(this._renderAddUnit());
      if (this._modelSaveMessage) {
        painel.append(this._element(
          "p",
          `settings-save-message ${this._modelSaveState}`,
          this._modelSaveMessage,
        ));
      }
      return painel;
    }

    // Enquanto o modelo vem do arquivo, editar aqui nao teria efeito: a
    // proxima partida leria o arquivo de novo. Importar e o ato que passa a
    // palavra para o Home Assistant, e acontece uma vez.
    _renderModelImportNotice(dados) {
      const aviso = this._element("div", "settings-warning");
      aviso.append(
        this._element("strong", "", "Este modelo vem de um arquivo."),
        this._element("span", "", " Para editar as unidades por aqui, traga-o "
          + "para dentro do Home Assistant. Depois disso o arquivo deixa de ser "
          + "lido, e toda a configuração passa a ser feita nesta tela. O "
          + "arquivo não é apagado."),
      );
      if (dados.model_path) {
        const caminho = this._element("code", "settings-sensor-declared");
        caminho.textContent = dados.model_path;
        aviso.append(caminho);
      }
      const acoes = this._element("div", "settings-actions-row");
      const importar = this._button(
        this._modelSaveState === "saving" ? "Importando…" : "Importar o modelo",
        "model-import",
        "button primary",
      );
      importar.disabled = this._modelSaveState === "saving" || !dados.can_import;
      acoes.append(importar);
      aviso.append(acoes);
      return aviso;
    }

    // A unidade e uma faixa que abre. Fechada, ela cabe numa linha e diz o
    // essencial: foto, nome, se gera e quantos sensores tem. Aberta, mostra o
    // resto. Uma por vez, porque a lista cresce com a instalacao.
    _renderUnitRow(unidade, somenteLeitura) {
      const aberta = this._modelOpenUnit === unidade.unit_id;
      const bloco = this._element("div", `settings-unit${aberta ? " open" : ""}`);
      bloco.append(this._renderUnitHeader(unidade, aberta));
      if (aberta) bloco.append(this._renderUnitDetail(unidade, somenteLeitura));
      return bloco;
    }

    _renderUnitHeader(unidade, aberta) {
      const faixa = this._button("", "unit-toggle", "settings-unit-head");
      faixa.dataset.unit = unidade.unit_id;
      faixa.dataset.unitHead = unidade.unit_id;
      // O identificador interno fica na dica, nao na tela: ele amarra fatura,
      // rateio e historico, mas depois de renomear a unidade ele parece um
      // nome errado para quem so veio configurar.
      faixa.title = `Identificador interno: ${unidade.unit_id}`;
      faixa.setAttribute("aria-expanded", aberta ? "true" : "false");

      const seta = this._element("ha-icon", "settings-unit-caret");
      seta.setAttribute("icon", aberta ? "mdi:chevron-down" : "mdi:chevron-right");
      faixa.append(seta);

      const foto = this._element("div", "settings-unit-photo small");
      if (unidade.image) {
        const imagem = this._element("img", "settings-unit-thumb");
        imagem.src = unidade.image;
        imagem.alt = "";
        imagem.loading = "lazy";
        foto.append(imagem);
      } else {
        const vazio = this._element("ha-icon", "settings-unit-thumb empty");
        vazio.setAttribute("icon", "mdi:home-outline");
        foto.append(vazio);
      }
      faixa.append(foto);

      const texto = this._element("div", "settings-unit-title");
      texto.append(this._element("span", "settings-unit-name", unidade.name));
      // A ordem e a da pergunta que se faz olhando a lista: o que esta
      // unidade mede, e depois o que ela e. O papel vem por ultimo porque so
      // uma unidade o tem, e as outras nao precisam dizer que nao geram.
      const resumo = [];
      const quantos = Number(unidade.sensor_count ?? 0);
      const semMedidor = unidade.measured === false;
      if (semMedidor) resumo.push("Só pela fatura");
      else if (!quantos) resumo.push("Sem sensor");
      else {
        // O que ela mede, pelo nome. "3 sensores" obriga a abrir a unidade
        // para descobrir QUAIS — e a pergunta de quem olha a lista e
        // exatamente essa. Com os nomes, a lista se le sem abrir nada.
        const nomes = this._unitMeasuredNames(unidade);
        resumo.push(nomes.length
          ? nomes.join(", ")
          : `${quantos} ${quantos === 1 ? "sensor" : "sensores"}`);
      }
      if (unidade.role === ROLE_GENERATOR) resumo.push("Gera energia");
      texto.append(this._element("span", "settings-unit-summary", resumo.join(" · ")));
      faixa.append(texto);

      // Falta sensor so e pendencia em quem deveria ter um. Quem se acompanha
      // pela fatura esta completo assim, e cobra-lo seria mandar consertar o
      // que nao esta quebrado.
      if (!quantos && !semMedidor) {
        faixa.append(this._element("span", "tag tag-warn settings-tag", "Configurar"));
      }
      return faixa;
    }

    _renderUnitDetail(unidade, somenteLeitura) {
      const corpo = this._element("div", "settings-unit-body");

      const campoNome = this._element("label", "settings-field");
      campoNome.append(this._element("span", "settings-label", "Nome"));
      const nome = this._element("input", "history-date-input settings-input");
      nome.type = "text";
      nome.value = unidade.name ?? "";
      nome.dataset.action = "unit-name";
      nome.dataset.unit = unidade.unit_id;
      nome.disabled = somenteLeitura;
      nome.setAttribute("aria-label", `Nome de ${unidade.name}`);
      campoNome.append(nome);
      corpo.append(campoNome);

      const escolhas = this._element("div", "settings-unit-flags");
      escolhas.append(
        this._renderUnitRoleField(unidade, somenteLeitura),
        this._renderUnitMeasuredField(unidade, somenteLeitura),
      );
      corpo.append(escolhas);

      if (!somenteLeitura) corpo.append(this._renderUnitMetrics(unidade));

      if (!somenteLeitura) corpo.append(this._renderUnitActions(unidade));
      return corpo;
    }

    // Duas naturezas, duas secoes. A energia acumula, entra no ciclo e vira
    // conta; a leitura do momento nao acumula, nao entra em ciclo e nao vira
    // nada. Na mesma lista, apontar um voltimetro parecia mexer numa conta.
    // So uma unidade gera. Em vez de deixar marcar e recusar depois, as
    // outras ja vem desligadas dizendo quem e a geradora — a recusa depois do
    // clique obriga a desfazer o que nunca deveria ter sido oferecido.
    _renderUnitRoleField(unidade, somenteLeitura) {
      const geradora = (this._modelConfig?.units ?? [])
        .find((item) => item.role === ROLE_GENERATOR);
      const ehGeradora = unidade.role === ROLE_GENERATOR;
      const ocupada = Boolean(geradora) && !ehGeradora;

      let dica = "Uma unidade que gera mede geração, exportação e importação. "
        + "O consumo dela é calculado.";
      if (ocupada) {
        dica = `Quem gera nesta instalação é ${geradora.name}. Só uma unidade `
          + "pode gerar: para trocar, desmarque nela primeiro.";
      }
      return this._flagField({
        label: "Gera energia",
        action: "unit-role",
        unitId: unidade.unit_id,
        checked: ehGeradora,
        disabled: somenteLeitura || ocupada,
        blocked: ocupada,
        hint: dica,
      });
    }

    _renderUnitMeasuredField(unidade, somenteLeitura) {
      const temMedidor = unidade.measured !== false;
      return this._flagField({
        label: "Tem medidor no HA",
        action: "unit-measured",
        unitId: unidade.unit_id,
        checked: temMedidor,
        disabled: somenteLeitura,
        hint: temMedidor
          ? "Desmarque se esta unidade não tem medidor no Home Assistant e é "
            + "acompanhada só pela fatura da distribuidora."
          : "Acompanhada só pela fatura da distribuidora. Sem medidor não há "
            + "leitura própria para comparar, e é assim mesmo.",
      });
    }

    // Uma caixa de marcacao com a explicacao guardada numa dica. Ela existe
    // porque o texto embaixo de cada caixa empurrava tudo para baixo e se
    // repetia em cinco unidades — mas some-lo de vez deixaria um campo
    // desligado sem motivo a vista.
    _flagField({ label, action, unitId, checked, disabled, blocked, hint }) {
      const campo = this._element(
        "label", `settings-flag${blocked ? " blocked" : ""}`,
      );
      const marca = this._element("input");
      marca.type = "checkbox";
      marca.checked = Boolean(checked);
      marca.dataset.action = action;
      marca.dataset.unit = unitId;
      marca.disabled = Boolean(disabled);
      campo.append(marca, this._element("span", "settings-flag-label", label));
      if (hint) {
        const marca_dica = this._element("ha-icon", "settings-flag-mark");
        marca_dica.setAttribute("icon", "mdi:information-outline");
        campo.append(marca_dica);
        // Sem `title`: o balao branco do navegador repetia o mesmo texto por
        // cima do nosso. Quem navega por teclado ve a dica pelo foco.
        campo.append(this._element("span", "settings-flag-hint", hint));
      }
      return campo;
    }

    _renderUnitMetrics(unidade) {
      const bloco = this._element("div", "settings-unit-metrics");
      // Sem medidor nao ha sensor a apontar. Mostrar os campos vazios
      // convidaria a preencher o que nao existe.
      if (unidade.measured === false) return bloco;
      bloco.append(this._renderEnergySection(unidade));
      bloco.append(this._renderReadingSection(unidade));
      return bloco;
    }

    _metricSection(titulo, nota) {
      const secao = this._element("section", "settings-metric-section");
      const cabeca = this._element("div", "settings-metric-section-head");
      cabeca.append(
        this._element("span", "settings-metric-section-title", titulo),
        this._element("span", "settings-metric-section-note", nota),
      );
      secao.append(cabeca);
      return secao;
    }

    _renderEnergySection(unidade) {
      const secao = this._metricSection(
        "Energia medida",
        "em kWh · é o que entra no ciclo, na fatura e nos gráficos",
      );
      const medidas = unidade.metrics ?? [];

      if (!medidas.length) {
        secao.append(this._element(
          "p",
          "settings-note",
          "Esta unidade ainda não mede nada. Aponte um sensor para ela "
          + "começar a aparecer nos gráficos, na auditoria e no rateio.",
        ));
      }
      for (const medida of medidas) {
        secao.append(this._renderUnitMetricRow(unidade, medida));
      }

      const derivadas = unidade.derived ?? [];
      if (derivadas.length) {
        const nota = this._element("div", "settings-derived");
        nota.append(
          this._element("span", "settings-derived-label", "Calculado a partir disso"),
          this._element(
            "span", "settings-derived-value",
            derivadas.map((item) => item.label).join(" · "),
          ),
        );
        secao.append(nota);
      }

      const pendente = this._modelPendingMetric;
      if (pendente?.unit === unidade.unit_id) {
        secao.append(this._renderUnitMetricPending(unidade, pendente.metric));
      } else {
        secao.append(this._renderUnitMetricAdd(unidade));
      }
      return secao;
    }

    _renderReadingSection(unidade) {
      const secao = this._metricSection(
        "Leituras do momento",
        "tensão, corrente, potência · não acumulam nem entram em ciclo",
      );
      for (const leitura of unidade.readings ?? []) {
        secao.append(this._renderUnitReadingRow(unidade, leitura));
      }
      if (this._modelPendingMetric?.unit !== unidade.unit_id) {
        secao.append(this._renderUnitReadingAdd(unidade));
      }
      return secao;
    }

    // Uma grandeza com um medidor so e uma linha: rotulo, campo, acoes. Depois
    // de uma troca ela vira duas linhas com vigencia, porque ai ha um
    // historico em dois trechos e e preciso dizer qual e qual.
    _renderUnitMetricRow(unidade, medida) {
      const fontes = medida.sources ?? [];
      const unica = fontes.length <= 1;
      const bloco = this._element(
        "div", `settings-metric-group${unica ? " single" : ""}`,
      );

      const cabeca = this._element("div", "settings-metric-row head");
      cabeca.append(this._element("span", "settings-metric-label", medida.label));

      if (unica) {
        const campo = this._element("input", "history-date-input settings-input");
        campo.type = "text";
        campo.value = fontes[0]?.entity_id ?? "";
        campo.placeholder = "sensor.meu_medidor";
        campo.dataset.action = "unit-source-entity";
        campo.dataset.unit = unidade.unit_id;
        campo.dataset.metric = medida.metric;
        campo.dataset.entity = fontes[0]?.entity_id ?? "";
        campo.setAttribute("aria-label", `Sensor de ${medida.label}`);
        cabeca.append(campo);
      } else {
        cabeca.append(this._element(
          "span", "settings-sensor-count", `${fontes.length} fontes`,
        ));
      }

      cabeca.append(this._renderMetricActions(unidade, medida));
      bloco.append(cabeca);

      if (!unica) {
        for (const fonte of fontes) {
          bloco.append(this._renderUnitMetricSource(unidade, medida, fonte));
        }
      }
      const pendente = this._modelPendingSwap;
      if (pendente?.unit === unidade.unit_id && pendente.metric === medida.metric) {
        bloco.append(this._renderMeterSwapForm(unidade, medida));
      }
      return bloco;
    }

    _renderMetricActions(unidade, medida) {
      const acoes = this._element("div", "settings-metric-actions");
      if (medida.swappable) {
        const trocar = this._button("Trocar medidor", "unit-meter-swap", "button");
        trocar.dataset.unit = unidade.unit_id;
        trocar.dataset.metric = medida.metric;
        trocar.dataset.label = medida.label;
        trocar.title = `Registrar a troca do medidor de ${medida.label}`;
        acoes.append(trocar);
      }
      const tirar = this._button(
        "\u2715", "unit-metric-remove", "button icon-only icon-remove",
      );
      tirar.dataset.unit = unidade.unit_id;
      tirar.dataset.metric = medida.metric;
      tirar.dataset.label = medida.label;
      tirar.title = `Excluir a medição de ${medida.label}`;
      tirar.setAttribute("aria-label", `Excluir a medição de ${medida.label}`);
      acoes.append(tirar);
      return acoes;
    }

    _renderUnitMetricSource(unidade, medida, fonte) {
      const encerrada = fonte.active === false;
      const linha = this._element(
        "div", `settings-metric-row source${encerrada ? " retired" : ""}`,
      );

      const legenda = this._element("div", "settings-source-legend");
      if (fonte.label) {
        legenda.append(this._element("span", "settings-sensor-source", fonte.label));
      }
      const vigencia = this._sensorWindowLabel(fonte);
      if (vigencia) {
        // Sem nome de medidor, a vigencia sobe para a primeira linha: deixar
        // a linha de cima vazia so para manter o formato seria formato pelo
        // formato.
        legenda.append(this._element(
          "span",
          `settings-sensor-window${fonte.label ? "" : " alone"}`,
          vigencia,
        ));
      }
      legenda.append(this._element(
        "span",
        encerrada ? "tag tag-log settings-tag" : "tag tag-ok settings-tag",
        encerrada ? "Encerrada" : "Em uso",
      ));
      linha.append(legenda);

      const campo = this._element("input", "history-date-input settings-input");
      campo.type = "text";
      campo.value = fonte.entity_id ?? "";
      campo.placeholder = "sensor.meu_medidor";
      campo.dataset.action = "unit-source-entity";
      campo.dataset.unit = unidade.unit_id;
      campo.dataset.metric = medida.metric;
      campo.dataset.entity = fonte.entity_id ?? "";
      campo.setAttribute("aria-label", `Sensor de ${medida.label}`);
      linha.append(campo);

      // O aviso vira dica do proprio campo: ele fala de quem o le, e repetido
      // em cada fonte encerrada enchia a tela de texto igual.
      campo.title = "Esta fonte cobre um per\u00edodo encerrado. Troc\u00e1-la altera "
        + "o hist\u00f3rico daquele trecho, n\u00e3o a leitura atual.";
      return linha;
    }

    // Trocar de medidor pede duas coisas: qual entidade passa a valer e a
    // partir de quando. A data e do operador — errar um corte reescreve meses
    // de leitura, e o sistema nao pode adivinha-la.
    _renderMeterSwapForm(unidade, medida) {
      const bloco = this._element("div", "settings-metric-row swap");
      const rascunho = this._modelPendingSwap;

      const campoEntidade = this._element("label", "settings-field");
      campoEntidade.append(
        this._element("span", "settings-label", "Entidade do medidor novo"),
      );
      const entidade = this._element("input", "history-date-input settings-input");
      entidade.type = "text";
      entidade.placeholder = "sensor.medidor_novo";
      entidade.value = rascunho.entity ?? "";
      entidade.dataset.action = "swap-entity";
      campoEntidade.append(entidade);

      const campoData = this._element("label", "settings-field");
      campoData.append(this._element("span", "settings-label", "Trocado em"));
      const data = this._element("input", "history-date-input settings-input");
      data.type = "datetime-local";
      data.value = rascunho.at ?? "";
      data.dataset.action = "swap-at";
      campoData.append(data);

      const campoRotulo = this._element("label", "settings-field");
      campoRotulo.append(
        this._element("span", "settings-label", "Nome do medidor (opcional)"),
      );
      const rotulo = this._element("input", "history-date-input settings-input");
      rotulo.type = "text";
      rotulo.placeholder = "Ex.: medidor novo";
      rotulo.value = rascunho.label ?? "";
      rotulo.dataset.action = "swap-label";
      campoRotulo.append(rotulo);

      const acoes = this._element("div", "settings-unit-actions");
      const confirmar = this._button(
        this._modelSaveState === "saving" ? "Trocando…" : "Confirmar troca",
        "unit-meter-swap-confirm",
        "button primary",
      );
      confirmar.disabled = this._modelSaveState === "saving";
      acoes.append(
        confirmar, this._button("Cancelar", "unit-meter-swap-cancel", "button"),
      );

      const aviso = this._element("div", "settings-warning");
      aviso.append(
        this._element("strong", "", "A leitura anterior não é apagada."),
        this._element("span", "", " O medidor atual passa a cobrir até a data "
          + "informada, e o novo daí em diante. O corte é levado para a hora "
          + "cheia, e a primeira variação do medidor novo é descartada — senão "
          + "a diferença entre o zero dele e a primeira leitura entraria como "
          + "consumo."),
      );

      bloco.append(campoEntidade, campoData, campoRotulo, aviso, acoes);
      return bloco;
    }

    _renderUnitReadingRow(unidade, leitura) {
      const linha = this._element("div", "settings-metric-row reading");
      const rotulo = this._element("span", "settings-metric-label");
      rotulo.textContent = leitura.label;
      linha.append(rotulo);

      const campo = this._element("input", "history-date-input settings-input");
      campo.type = "text";
      campo.value = leitura.entity_id ?? "";
      campo.placeholder = "sensor.meu_medidor";
      campo.dataset.action = "unit-metric-entity";
      campo.dataset.unit = unidade.unit_id;
      campo.dataset.metric = leitura.metric;
      campo.setAttribute("aria-label", `Sensor de ${leitura.label}`);
      linha.append(campo);

      const tirar = this._button(
        "✕", "unit-metric-remove", "button icon-only icon-remove",
      );
      tirar.dataset.unit = unidade.unit_id;
      tirar.dataset.metric = leitura.metric;
      tirar.dataset.label = leitura.label;
      tirar.title = `Excluir a leitura de ${leitura.label}`;
      tirar.setAttribute("aria-label", `Excluir a leitura de ${leitura.label}`);
      linha.append(tirar);
      return linha;
    }

    _renderUnitReadingAdd(unidade) {
      const disponiveis = (this._modelConfig?.available_readings ?? []).filter(
        (item) => !(unidade.readings ?? []).some((r) => r.metric === item.metric),
      );
      if (!disponiveis.length) return this._element("span", "");

      const linha = this._element("div", "settings-metric-row add");
      const escolha = this._element("select", "settings-input settings-metric-pick");
      escolha.dataset.action = "unit-metric-new";
      escolha.dataset.unit = unidade.unit_id;
      const vazio = this._element("option", "", "Adicionar leitura instantânea…");
      vazio.value = "";
      escolha.append(vazio);
      for (const item of disponiveis) {
        const opcao = this._element("option", "", `${item.label} (${item.unit})`);
        opcao.value = item.metric;
        escolha.append(opcao);
      }
      linha.append(escolha);
      return linha;
    }

    _renderUnitMetricPending(unidade, metric) {
      const catalogo = [
        ...(unidade.available_metrics ?? []),
        ...(this._modelConfig?.available_metrics ?? []),
        ...(this._modelConfig?.available_readings ?? []),
      ];
      const rotulo = catalogo.find((item) => item.metric === metric)?.label
        ?? metric;
      const linha = this._element("div", "settings-metric-row pending");
      linha.append(this._element("span", "settings-metric-label", rotulo));

      const campo = this._element("input", "history-date-input settings-input");
      campo.type = "text";
      campo.placeholder = "sensor.meu_medidor";
      campo.dataset.action = "unit-metric-entity";
      campo.dataset.unit = unidade.unit_id;
      campo.dataset.metric = metric;
      campo.setAttribute("aria-label", `Sensor de ${rotulo}`);
      linha.append(campo);

      const cancelar = this._button(
        "✕", "unit-metric-cancel", "button icon-only",
      );
      cancelar.title = "Cancelar";
      cancelar.setAttribute("aria-label", "Cancelar");
      linha.append(cancelar);
      return linha;
    }

    // As opcoes vem da propria unidade: quem consome mede consumo, quem gera
    // mede os tres fluxos da fronteira. Com uma opcao so, escolher numa lista
    // de um item nao e escolha — vira botao.
    _renderUnitMetricAdd(unidade) {
      const disponiveis = unidade.available_metrics ?? [];
      if (!disponiveis.length) return this._element("span", "");

      const linha = this._element("div", "settings-metric-row add");
      if (disponiveis.length === 1) {
        const unica = disponiveis[0];
        const botao = this._button(
          `Adicionar ${unica.label.toLowerCase()}`, "unit-metric-new-one", "button",
        );
        botao.dataset.unit = unidade.unit_id;
        botao.dataset.metric = unica.metric;
        linha.append(botao);
        return linha;
      }

      const escolha = this._element("select", "settings-input settings-metric-pick");
      escolha.dataset.action = "unit-metric-new";
      escolha.dataset.unit = unidade.unit_id;
      const vazio = this._element("option", "", "Adicionar medição…");
      vazio.value = "";
      escolha.append(vazio);
      for (const item of disponiveis) {
        const opcao = this._element("option", "", item.label);
        opcao.value = item.metric;
        escolha.append(opcao);
      }
      linha.append(escolha);
      return linha;
    }

    _renderUnitActions(unidade) {
      const acoes = this._element("div", "settings-unit-actions");

      // A cor identifica a unidade onde varias aparecem juntas — no payback e
      // na rosca do rateio. Vem preenchida com a que esta valendo, seja a
      // escolhida ou a derivada do identificador.
      const cor = this._element("label", "settings-unit-color");
      cor.title = "Cor desta unidade nos gráficos";
      const seletor = this._element("input", "settings-unit-color-input");
      seletor.type = "color";
      seletor.value = unidade.color ?? this._unitColor(unidade.unit_id);
      seletor.dataset.action = "unit-color";
      seletor.dataset.unit = unidade.unit_id;
      seletor.setAttribute("aria-label", `Cor de ${unidade.name}`);
      cor.append(seletor, this._element("span", "", "Cor"));
      acoes.append(cor);
      if (unidade.color) {
        const limpar = this._button("Cor padrão", "unit-color-clear", "button");
        limpar.dataset.unit = unidade.unit_id;
        acoes.append(limpar);
      }

      // <input type=file> nao se estiliza; o rotulo e o botao visivel, e o
      // campo fica escondido atras dele.
      const escolher = this._element("label", "button settings-unit-file");
      escolher.append(this._element(
        "span", "", unidade.image ? "Trocar foto" : "Escolher foto",
      ));
      const arquivo = this._element("input", "settings-unit-file-input");
      arquivo.type = "file";
      arquivo.accept = "image/png,image/jpeg,image/webp,image/gif";
      arquivo.dataset.action = "unit-image";
      arquivo.dataset.unit = unidade.unit_id;
      escolher.append(arquivo);
      acoes.append(escolher);

      if (unidade.image) {
        const limpar = this._button("Remover foto", "unit-image-clear", "button");
        limpar.dataset.unit = unidade.unit_id;
        acoes.append(limpar);
      }
      const remover = this._button("Excluir unidade", "unit-remove", "button danger");
      remover.dataset.unit = unidade.unit_id;
      remover.dataset.name = unidade.name ?? unidade.unit_id;
      acoes.append(remover);
      return acoes;
    }

    _renderAddUnit() {
      if (!this._modelNewUnit) {
        const acoes = this._element("div", "settings-actions-row");
        acoes.append(this._button("Adicionar unidade", "unit-add-open", "button"));
        return acoes;
      }
      const bloco = this._element("div", "settings-unit new");
      const corpo = this._element("div", "settings-unit-body");

      const campo = this._element("label", "settings-field");
      campo.append(this._element("span", "settings-label", "Nome da unidade"));
      const nome = this._element("input", "history-date-input settings-input");
      nome.type = "text";
      nome.value = this._modelNewUnit.nome ?? "";
      nome.placeholder = "Casa, Loja, Sítio…";
      nome.dataset.action = "unit-new-name";
      campo.append(nome);
      corpo.append(campo);

      // Se ja ha geradora, a caixa nasce desligada: oferecer para depois
      // recusar obriga a desfazer o que nunca deveria ter sido oferecido.
      const geradora = (this._modelConfig?.units ?? [])
        .find((item) => item.role === ROLE_GENERATOR);
      const geracao = this._element(
        "label", `settings-flag${geradora ? " blocked" : ""}`,
      );
      const marca = this._element("input");
      marca.type = "checkbox";
      marca.checked = Boolean(this._modelNewUnit.gera) && !geradora;
      marca.dataset.action = "unit-new-role";
      marca.disabled = Boolean(geradora);
      geracao.append(marca, this._element("span", "settings-flag-label", "Gera energia"));
      geracao.append(this._element(
        "span",
        "settings-flag-hint",
        geradora
          ? `Quem gera nesta instalação é ${geradora.name}. Só uma unidade pode gerar.`
          : "Uma unidade que gera mede geração, exportação e importação.",
      ));
      corpo.append(geracao);
      bloco.append(corpo);

      const acoes = this._element("div", "settings-unit-actions");
      const criar = this._button(
        this._modelSaveState === "saving" ? "Criando…" : "Criar",
        "unit-add-confirm",
        "button primary",
      );
      criar.disabled = this._modelSaveState === "saving";
      acoes.append(criar, this._button("Cancelar", "unit-add-cancel", "button"));
      bloco.append(acoes);
      return bloco;
    }

    _renderSensorsPanel() {
      const painel = this._element("section", "panel settings-panel");
      painel.append(this._settingsHead(
        "Unidades",
        "Sensores de cada unidade",
        "O modelo declara de qual entidade vem cada medição. Se uma delas não "
        + "existe nesta instalação, aponte aqui a entidade equivalente — o "
        + "arquivo do modelo continua intacto.",
      ));

      if (this._sensorsError && !this._sensors) {
        painel.append(this._renderError(this._sensorsError));
        return painel;
      }
      if (!this._sensors) {
        painel.append(this._historyStatus("Carregando sensores…", "loading"));
        return painel;
      }

      // Uma fonte encerrada apontando para o vazio e o esperado: o medidor
      // antigo foi removido, e e por isso que existe uma fonte nova. Cobrar a
      // entidade dela mandaria consertar o que nao esta quebrado.
      const ausentes = this._sensorSources()
        .filter((f) => f.presence === "missing" && f.active !== false).length;
      if (ausentes > 0) {
        const aviso = this._element("div", "settings-warning");
        aviso.append(
          this._element("strong", "", `${ausentes} ${ausentes > 1
            ? "entidades em uso não existem" : "entidade em uso não existe"}`
            + " nesta instalação."),
          this._element("span", "", " Enquanto isso, as medições que dependem "
            + "dela ficam sem fonte — indisponíveis, nunca zero."),
        );
        painel.append(aviso);
      }

      for (const unidade of this._sensors.units ?? []) {
        painel.append(this._renderSensorsUnit(unidade));
      }

      const sobras = this._sensors.unused_overrides ?? [];
      if (sobras.length) {
        // Nao e erro: o modelo pode ter mudado depois da troca. Mas e a
        // diferenca entre "o sensor esta trocado" e "a troca nao esta valendo".
        const nota = this._element("p", "settings-note");
        nota.textContent = "Trocas gravadas que o modelo não declara mais, e "
          + `por isso não estão valendo: ${sobras.join(", ")}.`;
        painel.append(nota);
      }

      painel.append(this._renderSensorsActions());
      return painel;
    }

    _renderSensorsUnit(unidade) {
      const bloco = this._element("div", "settings-sensor-unit");
      bloco.append(this._element("h4", "settings-sensor-unit-name", unidade.name));

      const metricas = unidade.metrics ?? [];
      if (!metricas.length) {
        // Dizer que nao ha e diferente de omitir a unidade: ha unidade sem
        // medicao no Home Assistant, e isso e um fato da instalacao, nao
        // uma falha de configuracao.
        bloco.append(this._element(
          "p", "settings-note", "Sem medição no Home Assistant.",
        ));
        return bloco;
      }
      for (const metrica of metricas) bloco.append(this._renderSensorMetric(metrica));
      return bloco;
    }

    // A grandeza e o titulo, e as fontes sao as linhas embaixo dela. Uma troca
    // de medidor deixa duas: juntas elas se leem como um historico; separadas,
    // seriam duas linhas "Geracao" identicas, e trocar a errada reescreveria o
    // passado sem nada aparecer na tela.
    _renderSensorMetric(metrica) {
      const bloco = this._element("div", "settings-sensor-metric");
      const titulo = this._element("div", "settings-sensor-metric-head");
      titulo.append(this._element("span", "settings-sensor-usage", metrica.label));
      const fontes = metrica.sources ?? [];
      if (fontes.length > 1) {
        titulo.append(this._element(
          "span", "settings-sensor-count", `${fontes.length} fontes`,
        ));
      }
      bloco.append(titulo);
      for (const fonte of fontes) bloco.append(this._renderSensorSource(fonte));
      return bloco;
    }

    _renderSensorSource(fonte) {
      const ativa = fonte.active === true;
      const encerrada = fonte.active === false;
      const linha = this._element(
        "div",
        `settings-sensor-row${ativa ? " active" : ""}${encerrada ? " retired" : ""}`,
      );

      const cabeca = this._element("div", "settings-sensor-head");
      if (fonte.source_label) {
        cabeca.append(this._element("span", "settings-sensor-source", fonte.source_label));
      }
      const vigencia = this._sensorWindowLabel(fonte);
      if (vigencia) {
        cabeca.append(this._element("span", "settings-sensor-window", vigencia));
      }
      // O selo de presenca fala da entidade; o de vigencia, do periodo. So o
      // segundo diz se mexer nesta linha altera o que se le hoje.
      if (ativa) cabeca.append(this._element("span", "tag tag-ok settings-tag", "Em uso"));
      if (encerrada) {
        cabeca.append(this._element("span", "tag tag-log settings-tag", "Encerrada"));
      }
      const [classe, texto] = SENSOR_PRESENCE[fonte.presence]
        ?? SENSOR_PRESENCE.unknown;
      cabeca.append(this._element("span", `${classe} settings-tag`, texto));
      linha.append(cabeca);

      const declarada = this._element("code", "settings-sensor-declared");
      declarada.textContent = fonte.declared_entity_id;
      linha.append(declarada);

      const campo = this._element("label", "settings-field");
      campo.append(this._element("span", "settings-label", "Entidade nesta casa"));
      const input = this._element("input", "history-date-input settings-input");
      input.type = "text";
      input.placeholder = fonte.declared_entity_id;
      input.value = this._sensorsDraft?.[fonte.declared_entity_id] ?? "";
      input.dataset.action = "sensor-entity";
      input.dataset.declared = fonte.declared_entity_id;
      input.setAttribute("aria-label", `Entidade para ${fonte.declared_entity_id}`);
      campo.append(input);
      linha.append(campo);

      if (encerrada) {
        // O aviso e da linha, nao da tela: trocar aqui nao muda o sensor de
        // hoje, muda de onde o passado e lido. Quem nao souber disso troca a
        // fonte errada e nao recebe erro nenhum.
        linha.append(this._element(
          "p",
          "settings-note",
          "Esta fonte cobre um período encerrado. Trocá-la altera o histórico "
          + "daquele trecho, não a leitura atual.",
        ));
      }
      return linha;
    }

    // "até" e "desde" em vez das duas datas: cada fonte tem so um limite, e o
    // outro lado e o comeco ou o fim do tempo.
    _sensorWindowLabel(fonte) {
      const desde = fonte.from ? this._formatDistributionDate(fonte.from, "") : "";
      const ate = fonte.until ? this._formatDistributionDate(fonte.until, "") : "";
      if (desde && ate) return `de ${desde} até ${ate}`;
      if (desde) return `desde ${desde}`;
      if (ate) return `até ${ate}`;
      return "";
    }

    _renderSensorsActions() {
      const acoes = this._element("div", "settings-actions-row");
      const gravar = this._button(
        this._sensorsSaveState === "saving" ? "Aplicando…" : "Aplicar",
        "sensors-save",
        "button primary",
      );
      gravar.disabled = this._sensorsSaveState === "saving";
      acoes.append(gravar);
      acoes.append(this._button("Restaurar o modelo", "sensors-reset", "button"));
      if (this._sensorsSaveMessage) {
        acoes.append(this._element(
          "span",
          `settings-save-message ${this._sensorsSaveState}`,
          this._sensorsSaveMessage,
        ));
      }
      return acoes;
    }

    _renderSettingsInvestment(dados) {
      const painel = this._element("section", "panel settings-panel");
      painel.append(this._settingsHead(
        "Investimento no sistema solar",
        "Quanto custou",
        "O valor que o sistema solar tem a devolver. É o total investido que o "
        + "payback persegue, e nada mais depende dele.",
      ));

      const linha = this._element("div", "settings-field-row");
      const campoValor = this._element("label", "settings-field");
      campoValor.append(this._element("span", "settings-label", "Valor (R$)"));
      const valor = this._element("input", "history-date-input settings-input");
      valor.type = "text";
      valor.inputMode = "decimal";
      valor.placeholder = this._moneyFromDecimal(
        dados.solar_investment?.declared?.amount,
      ) || "0";
      valor.value = this._settingsDraft?.investimento ?? "";
      valor.dataset.action = "settings-investment";
      valor.dataset.field = "investimento";
      campoValor.append(valor);
      linha.append(campoValor);

      const campoMes = this._element("label", "settings-field");
      campoMes.append(this._element("span", "settings-label", "Mês (AAAA-MM)"));
      const mes = this._element("input", "history-date-input settings-input");
      mes.type = "text";
      mes.inputMode = "numeric";
      mes.placeholder = dados.solar_investment?.declared?.period ?? "2026-01";
      mes.value = this._settingsDraft?.investimentoMes ?? "";
      mes.dataset.action = "settings-investment";
      mes.dataset.field = "investimentoMes";
      campoMes.append(mes);
      linha.append(campoMes);

      const vigente = dados.solar_investment?.effective;
      linha.append(this._settingsValueBox(
        "Valendo",
        vigente?.amount
          ? `${this._formatCurrency(Number(vigente.amount))} · ${vigente.period}`
          : "não informado",
        true,
      ));
      painel.append(linha);

      const nota = this._element("div", "settings-note");
      nota.textContent = "Digite só os números: o valor se separa sozinho "
        + "(25000 vira 25.000) e o mês também (202601 vira 2026-01). Para "
        + "centavos, use vírgula. O mês basta, porque o sistema raciocina por "
        + "ciclo.";
      painel.append(nota);
      return painel;
    }

    _renderSettingsBoundary(dados) {
      const painel = this._element("section", "panel settings-panel");
      painel.append(this._settingsHead(
        "Fronteira do ciclo",
        "Horário da leitura",
        "A fatura publica a data da leitura, não a hora. Este é o horário que o "
        + "sistema assume para toda leitura, e é ele que define onde cada ciclo "
        + "começa e termina.",
      ));

      const linha = this._element("div", "settings-field-row");
      const campo = this._element("label", "settings-field");
      campo.append(this._element("span", "settings-label", "Horário (HH:MM)"));
      const input = this._element("input", "history-date-input settings-input");
      input.type = "text";
      input.inputMode = "numeric";
      input.placeholder = dados.boundary_time?.declared ?? "10:00";
      input.value = this._settingsDraft?.boundary ?? "";
      input.dataset.action = "settings-boundary";
      campo.append(input);
      linha.append(campo);
      linha.append(this._settingsValueBox(
        "Declarado no YAML", dados.boundary_time?.declared ?? "—",
      ));
      linha.append(this._settingsValueBox(
        "Em vigor", dados.boundary_time?.effective ?? "—", true,
      ));
      painel.append(linha);

      // O aviso e permanente, nao condicional: nao existe mudanca de fronteira
      // que nao recalcule o passado, porque a hora nao esta gravada em ciclo
      // nenhum — e uma hipotese unica aplicada a todas as datas de leitura.
      const aviso = this._element("div", "settings-warning");
      aviso.append(
        this._element("strong", "", "Muda o passado, não só o futuro."),
        this._element(
          "span",
          "",
          " Todo ciclo é recalculado com o horário novo: histórico, comparação, "
          + "auditoria, SCEE, fluxo e previsões. Depois de alterar, confira a aba "
          + "Auditoria — se as divergências contra a fatura aumentarem, o "
          + "horário novo está mais longe da leitura real do que o anterior.",
        ),
      );
      painel.append(aviso);
      return painel;
    }

    _renderSettingsTariffs(dados) {
      const painel = this._element("section", "panel settings-panel");
      painel.append(this._settingsHead(
        "Tarifa da distribuidora",
        "Tarifa homologada, sem tributos",
        "Base do preço da energia, por vigência da resolução da ANEEL. A tarifa "
        + "impressa na fatura continua vencendo esta quando existe — o valor aqui "
        + "só é usado quando a fatura do ciclo não publica tarifa própria. O ciclo "
        + "que atravessa um reajuste recebe a média por dias entre as duas.",
      ));
      const vigencias = this._settingsTariffKeys(dados);
      if (vigencias.length === 0) {
        painel.append(this._historyStatus(
          "Nenhuma tarifa declarada no modelo financeiro.", "compact",
        ));
        painel.append(this._renderSettingsVigenciaForm());
        return painel;
      }
      // A que vale hoje e a ultima vigencia ja iniciada.
      const hoje = new Date().toISOString().slice(0, 10);
      const emVigor = vigencias.filter((item) => item <= hoje).pop() ?? null;
      for (const vigencia of vigencias) {
        const linha = this._element("div", "settings-field-row");
        const campo = this._element("label", "settings-field");
        const rotulo = this._element("span", "settings-label");
        rotulo.append(document.createTextNode(
          `Vigência desde ${this._formatDate(vigencia)}`,
        ));
        if (vigencia === emVigor) {
          rotulo.append(this._element("span", "tag tag-ok settings-tag", "em vigor"));
        } else if (vigencia > hoje) {
          rotulo.append(this._element("span", "tag tag-log settings-tag", "futura"));
        }
        campo.append(rotulo);
        const fonte = dados.distributor_tariffs?.sources?.[vigencia];
        if (fonte) campo.append(this._element("span", "settings-source", fonte));
        const input = this._element("input", "history-date-input settings-input");
        input.type = "text";
        input.inputMode = "decimal";
        input.placeholder = dados.distributor_tariffs?.declared?.[vigencia] ?? "0.000000";
        input.value = this._settingsDraft?.tarifas?.[vigencia] ?? "";
        input.dataset.action = "settings-tariff";
        input.dataset.vigencia = vigencia;
        campo.append(input);
        linha.append(campo);
        linha.append(this._settingsValueBox(
          "Declarado no YAML", dados.distributor_tariffs?.declared?.[vigencia] ?? "—",
        ));
        linha.append(this._settingsValueBox(
          "Valendo", dados.distributor_tariffs?.effective?.[vigencia] ?? "—", true,
        ));
        painel.append(linha);
      }
      painel.append(this._renderSettingsVigenciaForm());
      return painel;
    }

    // Duas acoes com efeitos diferentes, por isso separadas: o campo de cada
    // linha corrige aquela vigencia (e recalcula todo ciclo que dependia dela);
    // este formulario acrescenta uma nova, sem tocar no passado.
    _renderSettingsVigenciaForm() {
      const caixa = this._element("div", "settings-add-vigencia");
      const nova = this._settingsNewTariff;
      if (!nova) {
        caixa.append(
          this._button("Adicionar vigência", "settings-vigencia-new", "button"),
          this._element(
            "span", "settings-note",
            "Use ao chegar um reajuste: a tarifa nova passa a valer só a partir"
            + " da data informada, e os ciclos anteriores continuam como estão.",
          ),
        );
        return caixa;
      }
      const data = this._element("label", "settings-field");
      data.append(this._element("span", "settings-label", "Início de vigência"));
      const dataInput = this._element("input", "history-date-input settings-input");
      dataInput.type = "date";
      dataInput.value = nova.data ?? "";
      dataInput.dataset.action = "settings-vigencia-date";
      data.append(dataInput);

      const valor = this._element("label", "settings-field");
      valor.append(this._element(
        "span", "settings-label", "Tarifa homologada, sem tributos",
      ));
      const valorInput = this._element("input", "history-date-input settings-input");
      valorInput.type = "text";
      valorInput.inputMode = "decimal";
      valorInput.placeholder = "0.000000";
      valorInput.value = nova.valor ?? "";
      valorInput.dataset.action = "settings-vigencia-value";
      valor.append(valorInput);

      caixa.append(
        data,
        valor,
        this._button("Incluir", "settings-vigencia-add", "button primary"),
        this._button("Cancelar", "settings-vigencia-cancel", "button"),
      );
      if (nova.erro) {
        caixa.append(this._element("p", "settings-message error", nova.erro));
      }
      return caixa;
    }

    // Titulo e explicacao lado a lado. Empilhados, a explicacao quebrava em
    // tres linhas curtas no meio de uma tela larga e vazia.
    _settingsHead(kicker, titulo, nota) {
      const head = this._element("div", "settings-head");
      const copy = this._element("div", "settings-head-copy");
      copy.append(
        this._element("span", "section-kicker", kicker),
        this._element("h3", "section-title", titulo),
      );
      head.append(copy, this._element("p", "settings-note", nota));
      return head;
    }

    _settingsValueBox(rotulo, valor, destaque = false) {
      const caixa = this._element("div", `settings-value ${destaque ? "current" : ""}`);
      caixa.append(
        this._element("span", "settings-label", rotulo),
        this._element("strong", "num", String(valor)),
      );
      return caixa;
    }

    // As secoes que ficavam abaixo dos dois graficos em Unidades & analise.
    // Elas continuam lendo a unidade selecionada la — o seletor de unidade
    // permanece naquela aba, e e ele que manda aqui tambem.
    _renderExclusionPage(data) {
      const content = this._element("div", "content unit-page");
      const snapshot = data.snapshot ?? {};
      const blocks = this._element("div", "blocks");
      blocks.append(
        this._renderCycle(data.cycle_energy),
        this._renderBill(snapshot.latest_bill),
        this._renderPrediction(data.prediction),
        this._renderFinance(),
      );
      const selfConsumptionSection = this._renderSelfConsumption();
      if (selfConsumptionSection) blocks.append(selfConsumptionSection);
      blocks.append(
        this._renderDistribution(),
        this._renderScee(),
      );
      blocks.append(this._renderAuditQuality(data.quality_evidence));
      content.append(blocks);
      return content;
    }

    _renderAlertsPage() {
      const content = this._element("div", "content alerts-page");
      const alertas = this._operationalAlerts();
      const criticos = alertas.filter((item) => item.severity === "critical").length;
      const atencao = alertas.length - criticos;

      const resumo = this._element("div", "alert-summary");
      resumo.append(
        this._renderAlertTotal("Críticos", criticos, "critical"),
        this._renderAlertTotal("Atenção", atencao, "attention"),
        this._renderAlertTotal("Unidades monitoradas", this._unitIds().length, "neutral"),
      );
      content.append(resumo);

      const painel = this._element("section", "panel console-panel");
      painel.append(this._element(
        "div", "console-head", "Condições abertas · derivadas do estado declarado pelo backend",
      ));
      if (alertas.length === 0) {
        painel.append(this._element(
          "p", "console-empty",
          "Nenhuma condição aberta. Todos os sensores respondem, nenhuma grandeza "
          + "está fora da tolerância de auditoria e não há validação pendente.",
        ));
        content.append(painel);
        content.append(this._renderAlertsScopeNote());
        return content;
      }
      const lista = this._element("div", "console-list");
      for (const item of alertas) {
        const linha = this._element("div", "console-line");
        linha.append(
          this._element(
            "span",
            `tag ${item.severity === "critical" ? "tag-crit" : "tag-warn"}`,
            item.severity === "critical" ? "Crítico" : "Atenção",
          ),
          this._element("span", "console-unit", item.unit),
          this._element("span", "console-subject", item.subject),
          this._element("span", "console-desc", item.description),
          this._element("code", "console-origin", item.origin),
        );
        lista.append(linha);
      }
      painel.append(lista);
      content.append(painel, this._renderAlertsScopeNote());
      return content;
    }

    _renderAlertTotal(label, value, tone) {
      const item = this._element("div", `alert-total ${tone}`);
      item.append(
        this._element("span", "alert-total-label", label),
        this._element("strong", "alert-total-value", String(value)),
      );
      return item;
    }

    _renderAlertsScopeNote() {
      const nota = this._element("section", "panel scope-note");
      nota.append(
        this._element("h3", "section-title", "O que esta página não cobre"),
        this._element(
          "p",
          "",
          "Não há limiares elétricos configurados no modelo — nem tensão, nem corrente, "
          + "nem fator de potência. Por isso não existe alerta do tipo “tensão acima do "
          + "limite”: inventar um limiar aqui produziria alarme sem base. As condições "
          + "acima são estados que o próprio backend declara, e cada linha mostra o campo "
          + "de origem para conferência.",
        ),
      );
      return nota;
    }

    // ------------------------------------------------------------ Saude dos dados
    // A pagina diz se o dado que alimenta o resto do painel esta chegando.
    // Toda classificacao (critico, atencao, lacuna, atraso) vem pronta do
    // backend; aqui so se desenha e se escreve em portugues. O unico calculo
    // local e o "ha quanto tempo", que precisa andar com o relogio.
    async _loadDataHealth({ force = false } = {}) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (this._dataHealthInFlight) return this._dataHealthInFlight;
      // Sem isso cada renderizacao do card dispararia uma consulta ao Recorder.
      if (!force && Date.now() - this._dataHealthAttemptAt < DATA_HEALTH_REFRESH_MS) {
        return this._dataHealth;
      }
      this._dataHealthAttemptAt = Date.now();
      const configGeneration = this._configGeneration;
      const request = this._hass.callWS({ type: DATA_HEALTH_COMMAND }).then((response) => {
        if (response?.api_version !== API_VERSION || !Array.isArray(response?.data?.units)) {
          throw new Error("Resposta de saúde dos dados inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        this._dataHealth = response.data;
        this._dataHealthError = "";
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        const code = error?.code ?? error?.error?.code;
        this._dataHealthError = code === "data_health_unavailable"
          ? "O backend não conseguiu montar a saúde dos dados."
          : "Não foi possível ler a saúde dos dados.";
        return null;
      }).finally(() => {
        if (this._dataHealthInFlight === request) this._dataHealthInFlight = null;
        if (this.isConnected && this._page === "diagnostico") this._renderDataHealthUpdate();
      });
      this._dataHealthInFlight = request;
      this._renderDataHealthUpdate();
      return request;
    }

    _startDataHealthRefresh() {
      if (this._dataHealthTimer) return;
      this._dataHealthTimer = setInterval(() => {
        if (!this.isConnected || this._page !== "diagnostico") {
          this._stopDataHealthRefresh();
          return;
        }
        this._loadDataHealth({ force: true });
      }, DATA_HEALTH_REFRESH_MS);
    }

    _stopDataHealthRefresh() {
      if (this._dataHealthTimer) {
        clearInterval(this._dataHealthTimer);
        this._dataHealthTimer = null;
      }
    }

    _renderDataHealthUpdate() {
      const atual = this.shadowRoot?.querySelector("[data-data-health-page]");
      if (atual) atual.replaceWith(this._renderDataHealthPage());
    }

    _renderDataHealthPage() {
      const content = this._element("div", "content data-health-page");
      content.dataset.dataHealthPage = "";
      const dados = this._dataHealth;
      if (!dados) {
        content.append(this._dataHealthError
          ? this._renderError(this._dataHealthError)
          : this._historyStatus("Verificando sensores, cobertura e faturas…", "loading"));
        return content;
      }
      const unidades = dados.units;
      const grade = this._element("div", "health-units");
      for (const unidade of unidades) grade.append(this._renderHealthUnitCard(unidade));
      content.append(grade, this._renderHealthFindings(unidades));
      for (const unidade of unidades) content.append(this._renderHealthUnitDetail(unidade));
      content.append(this._renderHealthFootnote(dados));
      return content;
    }

    _healthTag(status) {
      const [classe, texto] = {
        critical: ["tag-crit", "Crítico"],
        attention: ["tag-warn", "Atenção"],
        ok: ["tag-ok", "OK"],
        info: ["tag-log", "Info"],
      }[status] ?? ["tag-log", String(status)];
      return this._element("span", `tag ${classe}`, texto);
    }

    _healthBlock(titulo, dica) {
      const bloco = this._element("section", "health-block");
      bloco.append(this._element("h4", "health-block-title", titulo));
      if (dica) bloco.append(this._element("p", "health-block-hint", dica));
      return bloco;
    }

    _formatAge(value) {
      const instante = Date.parse(value ?? "");
      if (!Number.isFinite(instante)) return "—";
      const segundos = Math.max(0, Math.round((Date.now() - instante) / 1000));
      if (segundos < 60) return `há ${segundos} s`;
      const minutos = Math.floor(segundos / 60);
      if (minutos < 60) return `há ${minutos} min`;
      const horas = Math.floor(minutos / 60);
      if (horas < 48) return `há ${horas} h${minutos % 60 ? ` ${minutos % 60} min` : ""}`;
      return `há ${Math.floor(horas / 24)} dias`;
    }

    _formatShortInstant(value) {
      const data = new Date(value ?? "");
      if (!Number.isFinite(data.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      }).format(data).replace(",", "");
    }

    // Tarifa tem seis casas e é comparada nelas; cortar em duas esconderia
    // justamente a diferença que o aviso está apontando.
    _formatTariff(valor) {
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return "—";
      return `${this._formatNumber(numero, 6, 6)} R$/kWh`;
    }

    _healthDays(dias) {
      if (!Number.isInteger(dias)) return "—";
      if (dias === 0) return "menos de 1 dia";
      return `${dias} ${dias === 1 ? "dia" : "dias"}`;
    }

    _healthLastReport(sensor) {
      const instantes = [sensor?.last_reported, sensor?.last_updated]
        .map((valor) => Date.parse(valor ?? ""))
        .filter(Number.isFinite);
      return instantes.length ? new Date(Math.max(...instantes)).toISOString() : null;
    }

    // A serie com pior cobertura representa o ciclo: as series de um mesmo
    // medidor caem juntas, e somar as lacunas das tres triplicaria as horas.
    _healthWorstSeries(unidade) {
      let pior = null;
      for (const ciclo of unidade.coverage ?? []) {
        for (const serie of ciclo.series ?? []) {
          if (!Number.isInteger(serie.observed_hours) || !(serie.expected_hours > 0)) continue;
          const razao = serie.observed_hours / serie.expected_hours;
          if (!pior || razao < pior.razao) pior = { razao, serie, ciclo };
        }
      }
      return pior;
    }

    _healthPercent(razao) {
      return `${this._formatNumber(Math.floor(razao * 1000) / 10, 1, 0)}%`;
    }

    _renderHealthUnitCard(unidade) {
      const card = this._button("", "health-focus-unit", `panel health-unit ${unidade.status}`);
      card.dataset.unit = unidade.unit_id;
      card.style.setProperty("--unit-cor", this._unitColor(unidade.unit_id));
      const cabeca = this._element("div", "health-unit-head");
      cabeca.append(
        this._element("span", "cell-unit-dot"),
        this._element("strong", "health-unit-name", unidade.name),
        this._healthTag(unidade.status),
      );
      const linhas = this._element("div", "health-unit-rows");
      for (const [rotulo, valor, tom] of this._healthCardRows(unidade)) {
        const linha = this._element("div", "health-unit-row");
        linha.append(
          this._element("span", "health-unit-label", rotulo),
          this._element("span", `health-unit-value ${tom}`.trim(), valor),
        );
        linhas.append(linha);
      }
      card.append(cabeca, linhas);
      return card;
    }

    _healthCardRows(unidade) {
      const linhas = [];
      const sensores = unidade.sensors ?? [];
      if (sensores.length) {
        const ok = sensores.filter((sensor) => sensor.status === "ok").length;
        const mudo = (unidade.findings ?? []).some((item) => item.code === "meter_silent");
        linhas.push([
          "Medidor",
          `${ok}/${sensores.length} respondendo`
            + (unidade.meter_last_report ? ` · ${this._formatAge(unidade.meter_last_report)}` : ""),
          ok < sensores.length || mudo ? "crit" : "ok",
        ]);
        const pior = this._healthWorstSeries(unidade);
        if (pior) {
          const horas = pior.serie.gaps.reduce((total, lacuna) => total + lacuna.hours, 0);
          linhas.push([
            "Cobertura do ciclo",
            `${this._healthPercent(pior.razao)}${horas ? ` · ${horas} h sem registro` : ""}`,
            horas ? "warn" : "ok",
          ]);
        } else {
          linhas.push(["Cobertura do ciclo", "sem hora fechada", ""]);
        }
      } else {
        linhas.push(["Medidor", "sem medidor · só fatura", ""]);
      }
      const fatura = unidade.invoice ?? {};
      if (!this._dataHealth?.billing_available) {
        linhas.push(["Fatura", "arquivo indisponível", "warn"]);
      } else if (fatura.invoice_status) {
        const atrasada = fatura.invoice_status === "late";
        linhas.push([
          "Fatura",
          `${fatura.awaiting_reference} ${atrasada ? "atrasada" : "aguardando"}`
            + ` · ${this._healthDays(fatura.waiting_days)}`,
          atrasada ? "crit" : "warn",
        ]);
      } else if (fatura.available) {
        linhas.push(["Fatura", `${fatura.latest_reference} recebida`, "ok"]);
      } else {
        linhas.push(["Fatura", "nenhuma no arquivo", "warn"]);
      }
      return linhas;
    }

    _healthFindingText(item) {
      const quando = (valor) => this._formatShortInstant(valor);
      const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
      const assunto = [item.label, item.reference].filter(Boolean).join(" · ");
      const prazo = this._dataHealth?.invoice_late_after_days;
      switch (item.code) {
        case "meter_unreachable":
          return ["Medidor sem comunicação",
            "Todos os sensores da unidade estão indisponíveis"
            + `${item.start ? ` desde ${quando(item.start)}` : ""}.`
            + " Verifique energia, Wi-Fi e endereço IP do medidor."];
        case "meter_silent":
          return ["Medidor em silêncio",
            `Nenhuma grandeza instantânea chegou há ${item.count} min`
            + ` (última às ${quando(item.start)}). O valor na tela pode estar parado.`];
        case "sensor_unavailable":
          return [item.label, "Sensor indisponível no Home Assistant"
            + `${item.start ? ` desde ${quando(item.start)}` : ""}.`];
        case "sensor_missing":
          return [item.label, "A entidade não existe no Home Assistant. Foi renomeada ou removida?"];
        case "sensor_invalid":
          return [item.label, "O sensor publica um valor que não é número."];
        case "series_without_source":
          return [item.label, "Nenhuma fonte declarada no modelo vale para este momento."];
        case "coverage_gap":
          return [assunto,
            `${item.hours} h sem registro no Recorder em ${plural(item.count, "trecho", "trechos")};`
            + ` o maior de ${quando(item.start)} a ${quando(item.end)}.`];
        case "coverage_unavailable":
          return [assunto, "O Recorder não respondeu à consulta desta série."];
        case "readings_discarded":
          return [assunto,
            `${plural(item.count, "leitura descartada", "leituras descartadas")} por `
            + (item.reason === "negative_change"
              ? "variação negativa do contador."
              : "variação acima do limite declarado para a fonte.")];
        case "source_cutover_protection":
          return [assunto,
            "A primeira leitura da fonte nova foi descartada na troca de medidor,"
            + " como o modelo manda. Não é falha."];
        case "invoice_late":
          return [`Fatura ${item.reference}`,
            `Leitura prevista em ${quando(item.start)}; ${this._healthDays(item.days)} sem fatura`
            + `${prazo ? `, acima do prazo de ${prazo} dias` : ""}.`];
        case "invoice_awaiting":
          return [`Fatura ${item.reference}`,
            `Leitura prevista em ${quando(item.start)}; aguardando há ${this._healthDays(item.days)}.`];
        case "tariff_out_of_date":
          return [`Tarifa · ${item.reference}`,
            `A fatura publica ${this._formatTariff(item.published)} e o modelo`
            + ` declara ${this._formatTariff(item.declared)} para o mesmo ciclo.`
            + " Provável reajuste: acrescente a vigência nova em Configuração →"
            + " Tarifa da distribuidora. Enquanto isso vale a tarifa da fatura."];
        case "extraction_alerts":
          return [`Fatura ${item.reference}`,
            `A extração do PDF registrou ${plural(item.count, "alerta", "alertas")}.`];
        case "cycles_unavailable":
          return ["Ciclos", "Não foi possível montar os ciclos desta unidade a partir das faturas."];
        default:
          return [assunto || item.code, item.code];
      }
    }

    _renderHealthFindingLine(unidade, item) {
      const [assunto, descricao] = this._healthFindingText(item);
      const linha = this._element("div", "console-line health-finding");
      linha.append(
        this._healthTag(item.severity),
        this._element("span", "console-unit", unidade.name),
        this._element("span", "console-subject", assunto),
        this._element("span", "console-desc", descricao),
      );
      return linha;
    }

    _renderHealthFindings(unidades) {
      const painel = this._element("section", "panel console-panel health-findings");
      const itens = unidades.flatMap((unidade) => (unidade.findings ?? [])
        .map((item) => [unidade, item]));
      const acao = itens.filter(([, item]) => item.severity !== "info");
      const informativos = itens.filter(([, item]) => item.severity === "info");
      painel.append(this._element("div", "console-head", "O que precisa de atenção"));
      if (acao.length === 0) {
        painel.append(this._element(
          "p", "console-empty",
          "Nada fora do normal: sensores respondendo, ciclos sem lacuna no Recorder"
          + " e faturas dentro do prazo.",
        ));
      } else {
        const lista = this._element("div", "console-list");
        for (const [unidade, item] of acao) lista.append(this._renderHealthFindingLine(unidade, item));
        painel.append(lista);
      }
      if (informativos.length) {
        const extra = this._element("details", "health-info");
        extra.open = this._dataHealthInfoOpen;
        extra.addEventListener("toggle", () => { this._dataHealthInfoOpen = extra.open; });
        extra.append(this._element(
          "summary", "health-info-summary", `Registros informativos (${informativos.length})`,
        ));
        const lista = this._element("div", "console-list");
        for (const [unidade, item] of informativos) {
          lista.append(this._renderHealthFindingLine(unidade, item));
        }
        extra.append(lista);
        painel.append(extra);
      }
      return painel;
    }

    _renderHealthUnitDetail(unidade) {
      const caixa = this._element("details", `panel health-detail ${unidade.status}`);
      caixa.dataset.healthUnit = unidade.unit_id;
      caixa.style.setProperty("--unit-cor", this._unitColor(unidade.unit_id));
      const lembrado = this._dataHealthOpen.get(unidade.unit_id);
      caixa.open = lembrado ?? unidade.status !== "ok";
      caixa.addEventListener("toggle", () => {
        this._dataHealthOpen.set(unidade.unit_id, caixa.open);
      });
      const resumo = this._element("summary", "health-detail-summary");
      const ciclos = unidade.coverage?.length ?? 0;
      resumo.append(
        this._element("span", "cell-unit-dot"),
        this._element("strong", "", unidade.name),
        this._healthTag(unidade.status),
        this._element("span", "health-detail-hint", unidade.sensors?.length
          ? `${unidade.sensors.length} sensores · ${ciclos} ${ciclos === 1 ? "ciclo" : "ciclos"} sem fatura`
          : "sem medidor · acompanhada só pela fatura"),
      );
      const corpo = this._element("div", "health-detail-body");
      if (unidade.sensors?.length) corpo.append(this._renderHealthSensors(unidade));
      if (ciclos) corpo.append(this._renderHealthCoverage(unidade));
      if (unidade.sources?.length) corpo.append(this._renderHealthSources(unidade));
      corpo.append(this._renderHealthInvoice(unidade));
      caixa.append(resumo, corpo);
      return caixa;
    }

    _renderHealthSensors(unidade) {
      const bloco = this._healthBlock(
        "Sensores",
        "Estado atual no Home Assistant. A última leitura conta também as leituras"
        + " que repetiram o valor anterior.",
      );
      const rolagem = this._element("div", "table-scroll");
      const tabela = this._element("table", "scada-table health-table");
      const cabeca = this._element("thead");
      const linhaCabeca = this._element("tr");
      for (const titulo of ["Grandeza", "Fonte no Home Assistant", "Estado", "Valor", "Última leitura", "Última mudança"]) {
        linhaCabeca.append(this._element("th", "", titulo));
      }
      cabeca.append(linhaCabeca);
      const corpo = this._element("tbody");
      const estados = {
        ok: ["tag-ok", "Respondendo"],
        unavailable: ["tag-crit", "Indisponível"],
        missing: ["tag-crit", "Não existe"],
        invalid: ["tag-crit", "Valor inválido"],
      };
      for (const sensor of unidade.sensors) {
        const linha = this._element("tr");
        const grandeza = this._element("td");
        grandeza.append(
          this._element("strong", "", sensor.label),
          this._element("span", "health-muted",
            sensor.kind === "series" ? "energia acumulada" : "instantânea"),
        );
        const fonte = this._element("td", "health-source-cell");
        if (sensor.source_label) fonte.append(this._element("span", "", sensor.source_label));
        fonte.append(this._element("code", "health-entity", sensor.entity_id));
        const estado = this._element("td");
        const [classe, texto] = estados[sensor.status] ?? ["tag-log", sensor.status];
        estado.append(this._element("span", `tag ${classe}`, texto));
        const numero = Number(sensor.raw_state);
        const valor = sensor.status === "ok" && Number.isFinite(numero)
          ? `${this._formatNumber(numero, 3, 0)}${sensor.unit ? ` ${sensor.unit}` : ""}`
          : "—";
        const ultima = this._healthLastReport(sensor);
        const leitura = this._element("td", "num", ultima ? this._formatAge(ultima) : "—");
        if (ultima) leitura.title = this._formatDate(ultima);
        const mudanca = this._element("td", "num",
          sensor.last_changed ? this._formatAge(sensor.last_changed) : "—");
        if (sensor.last_changed) mudanca.title = this._formatDate(sensor.last_changed);
        linha.append(grandeza, fonte, estado, this._element("td", "num", valor), leitura, mudanca);
        corpo.append(linha);
      }
      tabela.append(cabeca, corpo);
      rolagem.append(tabela);
      bloco.append(rolagem);
      return bloco;
    }

    _renderHealthCoverage(unidade) {
      const bloco = this._healthBlock(
        "Cobertura do Recorder nos ciclos sem fatura",
        "Horas fechadas com registro de energia. Hora sem registro não é zero:"
        + " o Recorder simplesmente não tem dado dela.",
      );
      for (const ciclo of unidade.coverage) {
        const cabeca = this._element("div", "health-cycle-head");
        cabeca.append(
          this._element("strong", "", `Ciclo ${ciclo.reference ?? "—"}`),
          this._element("span", "tag tag-log",
            ciclo.status === "provisional" ? "aguardando fatura" : "em andamento"),
          this._element("span", "health-cycle-period",
            `${this._formatShortInstant(ciclo.start)} → ${this._formatShortInstant(ciclo.end)}`
            + (ciclo.evaluated_until
              ? ` · avaliado até ${this._formatShortInstant(ciclo.evaluated_until)}` : "")),
        );
        const lista = this._element("div", "health-series-list");
        for (const serie of ciclo.series ?? []) {
          lista.append(this._renderHealthSeriesCoverage(ciclo, serie));
        }
        bloco.append(cabeca, lista);
      }
      return bloco;
    }

    _renderHealthSeriesCoverage(ciclo, serie) {
      const linha = this._element("div", "health-series");
      const topo = this._element("div", "health-series-top");
      let texto;
      let tom = "";
      if (serie.status === "empty") {
        texto = "sem hora fechada ainda";
      } else if (serie.status === "unavailable") {
        texto = "Recorder não respondeu";
        tom = "warn";
      } else {
        texto = `${this._healthPercent(serie.observed_hours / serie.expected_hours)}`
          + ` · ${serie.observed_hours} de ${serie.expected_hours} h`;
        if (serie.gaps.length) tom = "warn";
      }
      topo.append(
        this._element("span", "", serie.label),
        this._element("span", `health-series-value ${tom}`.trim(), texto),
      );
      linha.append(topo);

      const inicio = Date.parse(ciclo.start ?? "");
      const fim = Date.parse(ciclo.evaluated_until ?? "");
      if (Number.isFinite(inicio) && Number.isFinite(fim) && fim > inicio
        && Number.isInteger(serie.observed_hours)) {
        const faixa = this._element("div", "health-strip");
        faixa.setAttribute("role", "img");
        faixa.setAttribute("aria-label",
          `${serie.label}: ${serie.gaps.length} lacunas no período avaliado`);
        for (const lacuna of serie.gaps) {
          const a = Date.parse(lacuna.start);
          const b = Date.parse(lacuna.end);
          if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
          const trecho = this._element("span", "health-strip-gap");
          trecho.style.left = `${Math.max(0, ((a - inicio) / (fim - inicio)) * 100)}%`;
          trecho.style.width = `${Math.min(100, ((b - a) / (fim - inicio)) * 100)}%`;
          trecho.title = `${this._formatShortInstant(lacuna.start)} → `
            + `${this._formatShortInstant(lacuna.end)} · ${lacuna.hours} h`;
          faixa.append(trecho);
        }
        linha.append(faixa);
      }

      if (serie.gaps.length) {
        const lista = this._element("ul", "health-gaps");
        const visiveis = serie.gaps.slice(-6);
        for (const lacuna of visiveis) {
          const seguinte = typeof lacuna.next_hour_value === "number"
            ? ` · a hora seguinte registrou ${this._formatNumber(lacuna.next_hour_value, 2, 0)} ${serie.unit}`
            : "";
          lista.append(this._element(
            "li", "",
            `${this._formatShortInstant(lacuna.start)} → ${this._formatShortInstant(lacuna.end)}`
            + ` · ${lacuna.hours} h${lacuna.source_label ? ` · ${lacuna.source_label}` : ""}${seguinte}`,
          ));
        }
        if (serie.gaps.length > visiveis.length) {
          lista.append(this._element(
            "li", "health-muted",
            `e mais ${serie.gaps.length - visiveis.length} trechos anteriores`,
          ));
        }
        linha.append(lista);
      }

      const descartes = serie.issue_counts ?? {};
      const protecao = descartes.skip_first_change ?? 0;
      const negativos = (descartes.negative_change ?? 0) + (descartes.max_change_exceeded ?? 0);
      if (negativos) {
        linha.append(this._element("p", "health-note warn",
          `${negativos} ${negativos === 1 ? "leitura descartada" : "leituras descartadas"}`
          + " por variação inválida do contador."));
      }
      if (protecao) {
        linha.append(this._element("p", "health-note",
          "Primeira leitura da fonte nova descartada na troca de medidor (proteção do modelo)."));
      }
      return linha;
    }

    _renderHealthSources(unidade) {
      const bloco = this._healthBlock(
        "Fontes de cada série",
        "Qual entidade alimenta cada série em cada época, como declarado no modelo.",
      );
      for (const serie of unidade.sources) {
        const linha = this._element("div", "health-source-row");
        linha.append(this._element("span", "health-source-label", serie.label));
        const cadeia = this._element("div", "health-source-chain");
        serie.sources.forEach((fonte, indice) => {
          if (indice) cadeia.append(this._element("span", "health-source-arrow", "→"));
          const chip = this._element("div", `health-source${fonte.active ? " active" : ""}`);
          const nome = this._element("div", "health-source-name");
          nome.append(this._element("span", "", fonte.label ?? fonte.entity_id));
          if (fonte.active) nome.append(this._element("span", "tag tag-ok", "atual"));
          let periodo = "sem data de corte";
          if (fonte.start && fonte.end) {
            periodo = `${this._formatDate(fonte.start)} até ${this._formatDate(fonte.end)}`;
          } else if (fonte.start) {
            periodo = `desde ${this._formatDate(fonte.start)}`;
          } else if (fonte.end) {
            periodo = `até ${this._formatDate(fonte.end)}`;
          }
          chip.append(
            nome,
            this._element("span", "health-source-period", periodo),
            this._element("code", "health-entity", fonte.entity_id),
          );
          cadeia.append(chip);
        });
        linha.append(cadeia);
        bloco.append(linha);
      }
      return bloco;
    }

    _renderHealthInvoice(unidade) {
      const bloco = this._healthBlock("Fatura", null);
      const fatura = unidade.invoice ?? {};
      if (!this._dataHealth?.billing_available) {
        bloco.append(this._element("p", "health-note warn",
          "O backend não conseguiu ler o arquivo de faturas."));
        return bloco;
      }
      if (!fatura.available) {
        bloco.append(this._element("p", "health-note", "Nenhuma fatura desta unidade no arquivo."));
        return bloco;
      }
      const prazo = this._dataHealth?.invoice_late_after_days;
      let situacao = "em dia — nenhuma fatura esperada agora";
      let tom = "";
      if (fatura.invoice_status === "late") {
        situacao = `${fatura.awaiting_reference} atrasada: ${this._healthDays(fatura.waiting_days)}`
          + ` desde a leitura prevista${prazo ? ` (prazo de ${prazo} dias)` : ""}`;
        tom = "crit";
      } else if (fatura.invoice_status === "awaiting") {
        situacao = `${fatura.awaiting_reference} aguardando há ${this._healthDays(fatura.waiting_days)}`;
        tom = "warn";
      }
      const grade = this._element("dl", "health-facts");
      for (const [rotulo, valor, classe] of [
        ["Última fatura", fatura.latest_reference ?? "—", ""],
        ["Leitura da última fatura", this._formatDate(fatura.latest_reading), ""],
        ["Tarifa publicada na fatura", fatura.published_tariff
          ? this._formatTariff(fatura.published_tariff) : "não publicada", ""],
        ["Próxima leitura impressa", this._formatDate(fatura.next_reading), ""],
        ["Situação", situacao, tom],
        ["Extração do PDF", fatura.extraction_status ?? "—", ""],
      ]) {
        const item = this._element("div", "health-fact");
        item.append(this._element("dt", "", rotulo), this._element("dd", classe, valor));
        grade.append(item);
      }
      bloco.append(grade);
      for (const alerta of fatura.extraction_alerts ?? []) {
        bloco.append(this._element("p", "health-note warn", String(alerta)));
      }
      return bloco;
    }

    _renderHealthFootnote(dados) {
      const partes = [
        `Verificado ${this._formatAge(dados.generated_at)}`,
        "atualiza sozinho a cada minuto nesta página",
      ];
      if (Number.isInteger(dados.meter_silent_after_minutes)) {
        partes.push(`medidor em silêncio após ${dados.meter_silent_after_minutes} min sem leitura`);
      }
      if (Number.isInteger(dados.invoice_late_after_days)) {
        partes.push(`fatura atrasada ${dados.invoice_late_after_days} dias após a leitura prevista`);
      }
      if (this._dataHealthInFlight) partes.push("atualizando…");
      if (this._dataHealthError) partes.push(this._dataHealthError);
      return this._element("p", "health-footnote", partes.join(" · "));
    }

    // A ordem da pagina segue a leitura de uma operacao: o que esta medindo
    // agora, como a conta do ciclo se compoe, como isso evoluiu no tempo e, so
    // depois, o detalhe contratual. Antes o detalhe vinha antes do grafico, o
    // que obrigava a rolar a pagina inteira para ver a tendencia.
    _renderUnitPage(data) {
      const content = this._element("div", "content unit-page");
      const snapshot = data.snapshot ?? {};
      content.append(
        ...[
          this._renderIdentity(snapshot, data.cycle_energy?.cycle),
          this._renderBillEstimate(snapshot, data.prediction),
          this._renderMeasurements(snapshot),
          // "Entenda a conta" explica uma fatura: sem nenhuma, nao ha o que
          // entender, e o quadro era so um aviso de ausencia.
          this._unitHasOfficialHistory() ? this._renderConsumptionComposition() : null,
        ].filter(Boolean),
      );

      // Os dois graficos lado a lado: um responde "como foi dentro do ciclo",
      // o outro "como este ciclo se compara ao anterior". Empilhados, comparar
      // exigia memoria; lado a lado, exige o olho.
      // Sem sensor nao ha o que comparar: a comparacao sai, em vez de ocupar
      // metade da linha para dizer "indisponivel". Volta quando houver sensor.
      const semComparacao = this._comparisonUnavailable();
      const semCurva = snapshot.measured === false && !this._unitHasOfficialHistory();
      if (!semCurva) {
        const graficos = this._element("div", `charts-row${semComparacao ? " single" : ""}`);
        graficos.append(this._renderHistory());
        if (!semComparacao) graficos.append(this._renderComparison());
        content.append(graficos);
      }

      return content;
    }

    // "Entenda a conta": o consumo do ciclo repartido entre o que o credito
    // cobriu e o que sobrou para pagar. Todos os numeros sao campos oficiais
    // da fatura (bloco `official` do SCEE) — nada e recalculado aqui, nem
    // estimado quando falta. A barra e a leitura da proporcao; o texto abaixo
    // e a mesma informacao em linguagem de conta de luz, para quem so quer
    // saber quanto pagou e por que.
    _renderConsumptionComposition() {
      const section = this._element("section", "panel composition-panel");
      section.dataset.compositionPanel = "";
      const head = this._element("div", "composition-head");
      const titulo = this._element("div", "composition-title");
      titulo.append(
        this._element("span", "section-kicker", "Entenda a conta"),
        this._element("h3", "section-title", "Composição do consumo"),
      );
      head.append(titulo);

      const reference = this._sceeReference();
      const data = reference ? this._sceeCache.get(this._sceeKey()) : null;
      const official = data?.official && typeof data.official === "object"
        ? data.official
        : null;
      const numero = (valor) => {
        const n = Number(valor);
        return Number.isFinite(n) ? n : null;
      };
      // O total e o consumo da fatura, nao a parcela que participa do SCEE.
      // Usar a parcela como denominador fazia compensado dar 100% ao lado de
      // um nao compensado de 6,5% — a barra somava 106,5%.
      const parcelaScee = numero(official?.consumption_scee_kwh);
      const compensado = numero(official?.energy_compensated_kwh);
      const naoCompensado = numero(official?.non_compensated_consumption_kwh);
      const totalDeclarado = numero(official?.consumption_total_kwh);
      // Sem o total declarado, a soma das duas parcelas o reconstroi: e a
      // identidade que as faturas cumprem, nao uma estimativa.
      const total = totalDeclarado ?? (
        compensado !== null && naoCompensado !== null
          ? compensado + naoCompensado
          : parcelaScee
      );

      if (official?.applicable === false) {
        section.append(head, this._historyStatus(
          "SCEE não aplicável nesta referência: não há consumo compensado a repartir.",
          "compact",
        ));
        return section;
      }
      if (total === null || compensado === null || naoCompensado === null) {
        section.append(head, this._historyStatus(
          reference
            ? "Composição disponível quando a fatura oficial deste ciclo for lida."
            : "Composição disponível para faturas oficiais fechadas.",
          this._sceeInFlight.has(this._sceeKey()) ? "loading compact" : "compact",
        ));
        return section;
      }

      head.append(this._element(
        "div", "composition-total num", this._formatSceeEnergy(total),
      ));
      section.append(head);

      const pct = (parte) => (total > 0 ? (parte / total) * 100 : 0);
      const barra = this._element("div", "composition-bar");
      barra.setAttribute("aria-hidden", "true");
      const faixaComp = this._element("span", "composition-bar-comp");
      faixaComp.style.width = `${Math.max(0, Math.min(100, pct(compensado)))}%`;
      const faixaNao = this._element("span", "composition-bar-uncomp");
      faixaNao.style.width = `${Math.max(0, Math.min(100, pct(naoCompensado)))}%`;
      barra.append(faixaComp, faixaNao);
      section.append(barra);

      const legenda = this._element("div", "composition-legend");
      for (const [classe, rotulo, valor] of [
        ["comp", "Compensado pelo crédito", compensado],
        ["uncomp", "Não compensado", naoCompensado],
      ]) {
        const item = this._element("div", `composition-legend-item ${classe}`);
        item.append(
          this._element("span", "composition-dot"),
          this._element("span", "composition-legend-name", rotulo),
          this._element(
            "strong",
            "num",
            `${this._formatSceeEnergy(valor)} · ${this._formatNumber(pct(valor), 1, 1)}%`,
          ),
        );
        legenda.append(item);
      }
      section.append(legenda);

      const nome = this._unitLabel(this._selectedUnit);
      const geradora = this._selectedUnit === this._generator;
      const rateio = numero(official?.excess_received_kwh);
      const saldo = numero(official?.balance_kwh);
      const expira30 = numero(official?.balance_expiring_30_days_kwh);
      const expira60 = numero(official?.balance_expiring_60_days_kwh);
      const geracao = geradora ? numero(official?.cycle_generation_kwh) : null;
      // A base do rateio e o que sobra da geracao depois do consumo da propria
      // geradora. Conferido nos oito ciclos: base vezes o percentual de cada
      // unidade da exatamente o excedente que a fatura dela publica.
      const baseRateio = geracao !== null && compensado !== null
        ? geracao - compensado
        : null;
      const percentual = numero(official?.distribution_percent);
      // Na geradora o consumo e liquidado contra a propria geracao antes do
      // rateio, entao ela nunca puxa do saldo compartilhado: o que ela recebe
      // da propria fatia so acumula.
      const movimento = geradora
        ? (rateio !== null && rateio > 0.005
          ? { usado: false, quantidade: rateio }
          : null)
        : this._sceeBalanceMovement(compensado, rateio);

      const blocos = geradora
        ? this._renderCompositionGeneration({
          geracao, baseRateio, rateio, percentual, saldo,
        })
        : this._renderCompositionBalance({ rateio, movimento, saldo });
      if (blocos) section.append(blocos);

      const fatia = percentual !== null
        ? ` (${this._formatNumber(percentual, 2, 0)}%)`
        : "";
      // Um centesimo de kWh e o limite do que a fatura publica: abaixo disso
      // "sobrou" e "faltou" sao arredondamento, nao fato.
      const houveNaoCompensado = naoCompensado > 0.005;
      const dinheiro = this._billMoney();
      const emReais = (valor) => this._formatCurrency(Math.abs(valor), dinheiro.moeda);
      // "Coberto por crédito" nao quer dizer de graca: a parcela injetada sem
      // desconto e cobrada sobre a mesma energia compensada, e numa
      // beneficiaria ela pode ser a maior linha da fatura.
      const custoCompensado = dinheiro?.parcelaSemDesconto > 0.005
        ? `, que ainda ${geradora ? "custaram" : "custou"} ${
          emReais(dinheiro.parcelaSemDesconto)} de parcela sem desconto`
        : "";
      const custoNaoCompensado = dinheiro?.naoCompensado > 0.005
        ? `, a ${emReais(dinheiro.naoCompensado)}`
        : "";
      const frases = [];
      if (geradora && geracao !== null) {
        frases.push(`${nome} gerou ${this._formatSceeEnergy(geracao)} no ciclo ${reference}.`);
        frases.push(
          `Consumiu ${this._formatSceeEnergy(total)}: `
          + `${this._formatSceeEnergy(compensado)} cobertos pela própria geração `
          + `(${this._formatNumber(pct(compensado), 1, 1)}%)${custoCompensado}`
          + (houveNaoCompensado
            ? ` e ${this._formatSceeEnergy(naoCompensado)} não compensados${custoNaoCompensado}.`
            : ", sem nenhum kWh fora da compensação."),
        );
      } else {
        frases.push(
          `${nome} consumiu ${this._formatSceeEnergy(total)} no ciclo ${reference}: `
          + (houveNaoCompensado
            ? `${this._formatSceeEnergy(compensado)} cobertos por crédito `
              + `(${this._formatNumber(pct(compensado), 1, 1)}%)${custoCompensado} e `
              + `${this._formatSceeEnergy(naoCompensado)} não compensados${custoNaoCompensado}.`
            : `todo o consumo foi coberto por crédito${custoCompensado}.`),
        );
      }
      if (geradora) {
        if (baseRateio !== null) {
          frases.push(
            `Sobraram ${this._formatSceeEnergy(baseRateio)} para o rateio — `
            + "o consumo da geradora sai da geração antes de a energia ser repartida.",
          );
        }
        if (rateio !== null) {
          frases.push(
            `A fatia da ${nome}${fatia} foi ${this._formatSceeEnergy(rateio)}, `
            + "que foram inteiros para o saldo.",
          );
        }
      } else if (rateio !== null) {
        // A fatia entra nas quatro, nao so na geradora: sem ela, o numero do
        // rateio nao se liga ao percentual configurado do outro lado da tela.
        frases.push(
          `O rateio trouxe ${this._formatSceeEnergy(rateio)} de crédito neste `
          + `ciclo${fatia ? `, a fatia de${fatia.replace(" (", " ").replace(")", "")} desta unidade` : ""}.`,
        );
      }
      if (movimento && !geradora) {
        // Sem veredito: consumir do saldo em mes de menor geracao e o
        // funcionamento normal do SCEE, e "nao bastou" fazia a mesma frase
        // servir para uma unidade folgada e para uma sem reserva. Quem diz se
        // e confortavel e a autonomia, logo abaixo.
        frases.push(movimento.usado
          ? `O consumo superou o rateio em ${this._formatSceeEnergy(movimento.quantidade)}, `
            + "cobertos pelo saldo acumulado."
          : `Sobrou crédito: ${this._formatSceeEnergy(movimento.quantidade)} `
            + "foram para o saldo acumulado.");
      }
      // O credito acabou antes do consumo. E a unica frase que explica a
      // situacao de uma unidade cuja fatia e menor que o proprio consumo, e
      // sem ela o painel mostrava dois numeros iguais sem ligar um ao outro.
      if (!geradora && houveNaoCompensado && !(saldo > 0.005)) {
        frases.push(
          "O crédito acabou antes do consumo: sem saldo acumulado, "
          + `${this._formatSceeEnergy(naoCompensado)} foram faturados.`,
        );
      }
      if (saldo !== null) {
        frases.push(
          `O ciclo terminou com ${this._formatSceeEnergy(saldo)} de saldo.`
          + this._sceeAutonomySentence(saldo, total),
        );
      }
      // Fecha a conta em dinheiro. Uma forma so: antes → crédito → depois
      // quando houve crédito, e só o total quando não houve.
      if (dinheiro) {
        frases.push(dinheiro.creditos < -0.005 && dinheiro.rotuloCredito
          ? `A conta somaria ${emReais(dinheiro.antes)}; com ${dinheiro.rotuloCredito} `
            + `de ${emReais(dinheiro.creditos)}, a fatura fechou em ${emReais(dinheiro.total)}.`
          : `A fatura fechou em ${emReais(dinheiro.total)}.`);
      }
      const texto = this._element("div", "composition-text");
      for (const frase of frases) {
        const linha = this._element("p", "");
        linha.append(this._emphasizeValues(frase));
        texto.append(linha);
      }

      // Credito de SCEE vence. Este campo existia no contrato e nao aparecia
      // em lugar nenhum da tela — perder saldo por prazo e a unica coisa aqui
      // que ninguem descobre olhando o consumo.
      const vencendo = [
        [expira30, "30 dias"],
        [expira60, "60 dias"],
      ].filter(([valor]) => valor !== null && valor > 0);
      if (vencendo.length > 0) {
        const [valor, prazo] = vencendo[0];
        texto.append(this._element(
          "p",
          "composition-expiring",
          `Atenção: ${this._formatSceeEnergy(valor)} de saldo expiram em ${prazo}.`,
        ));
      }
      section.append(texto);
      const fora = this._renderBillOutliers(reference);
      if (fora) section.append(fora);
      return section;
    }

    // O lado financeiro do mesmo ciclo, lido da fatura oficial.
    //
    // O "antes dos creditos" NAO e uma soma minha de itens: e o proprio total
    // da fatura menos os creditos que ela declara. Assim um item de cobranca
    // que eu nao conheco ja entra no numero, porque ele entrou no total — a
    // frase continua verdadeira mesmo quando a fatura ganha uma linha nova.
    _billMoney() {
      const dados = this._financeCache.get(this._financeKey());
      const oficial = dados?.official;
      if (!oficial) return null;
      const numero = (valor) => {
        const n = Number(valor);
        return Number.isFinite(n) ? n : null;
      };
      const total = numero(oficial.bill_total);
      if (total === null) return null;
      const creditos = numero(oficial.financial_credits) ?? 0;
      const itens = Array.isArray(dados.items) ? dados.items : [];
      const valorDe = (codigo) => {
        const item = itens.find((linha) => linha?.code === codigo);
        return item ? numero(item.value) : null;
      };
      // Codigos ausentes devolvem null e a clausula correspondente some da
      // frase. Melhor perder a informacao do que publicar o numero errado se
      // a distribuidora renomear a linha.
      return {
        moeda: dados.currency ?? "BRL",
        total,
        creditos,
        antes: total - creditos,
        parcelaSemDesconto: valorDe("parc_injet_s_desc"),
        naoCompensado: valorDe("consumo_nao_compensado") ?? valorDe("consumo_kwh"),
        rotuloCredito: this._billCreditLabel(itens),
      };
    }

    // Como nomear o credito na frase. Um credito que eu nao reconheco vira
    // "créditos da distribuidora" em vez de sumir.
    _billCreditLabel(itens) {
      const creditos = itens.filter((item) => item?.category === "credito_financeiro");
      if (creditos.length === 0) return null;
      const codigos = creditos.map((item) => String(item.code ?? ""));
      if (codigos.every((codigo) => codigo.startsWith("dev_") || codigo.startsWith("juros_dev_"))) {
        return "a devolução";
      }
      if (codigos.every((codigo) => codigo === "bonus_itaipu")) return "o bônus Itaipu";
      return "os créditos da distribuidora";
    }

    // Os itens financeiros do ciclo — o que de fato foi cobrado e o que de
    // fato abateu.
    //
    // Quatro linhas da fatura ficam de fora, e a exclusao foi verificada nas
    // 33 faturas: `consumo_scee` e `injecao_scee` se anulam ao centavo, e o
    // mesmo vale para o beneficio tarifario bruto e o liquido. Sao R$ 6.234
    // de ida e volta contabil que nao mudam o total. Tirando as quatro, o
    // resto soma exatamente o valor impresso em 33 de 33 faturas.
    //
    // Aqui tambem nao entram a parcela sem desconto nem o consumo nao
    // compensado: os dois ja aparecem na frase acima, amarrados aos kWh que
    // os geraram, que e onde eles se explicam melhor.
    _renderBillOutliers(reference) {
      const dados = this._financeCache.get(this._financeKey());
      const oficial = dados?.official;
      if (!oficial) return null;
      const numero = (valor) => {
        const n = Number(valor);
        return Number.isFinite(n) ? n : null;
      };
      const moeda = dados.currency ?? "BRL";
      const itens = Array.isArray(dados.items) ? dados.items : [];
      const dinheiro = (valor) => this._formatCurrency(Math.abs(valor), moeda);
      const somaCategoria = (categoria) => itens
        .filter((item) => item?.category === categoria)
        .reduce((soma, item) => soma + (numero(item.value) ?? 0), 0);

      const linhas = [];
      const cip = numero(oficial.cip_cosip) ?? 0;
      if (cip > 0.005) {
        linhas.push([
          "cobranca iluminacao", "mdi:lightbulb-on-outline", "Iluminação pública",
          dinheiro(cip),
          "Contribuição municipal (CIP/COSIP). Não depende do seu consumo e o "
          + "sistema solar não a reduz.",
        ]);
      }
      const bandeira = somaCategoria("bandeira_tarifaria");
      if (bandeira > 0.005) {
        // A cor sai da descricao que a fatura imprime, nao do codigo do item:
        // o codigo e um slug gerado pelo nome, e so a amarela tem regra
        // propria no extrator. A descricao traz "ADC BANDEIRA <COR>" sempre.
        const cor = this._bandeiraColor(itens);
        linhas.push([
          `cobranca bandeira${cor ? ` bandeira-${cor}` : ""}`,
          "mdi:flag-variant",
          cor ? `Bandeira ${cor}` : "Bandeira tarifária",
          dinheiro(bandeira),
          "Acréscimo definido pela ANEEL conforme o custo de geração do país.",
        ]);
      }
      const juros = numero(oficial.interest) ?? 0;
      const multa = numero(oficial.fine) ?? 0;
      if (juros + multa > 0.005) {
        linhas.push([
          "atencao", "mdi:alert-circle-outline", "Juros e multa",
          dinheiro(juros + multa),
          "A fatura anterior foi paga depois do vencimento — é a única linha "
          + "desta lista que dependeu de você.",
        ]);
      }

      // Creditos, um a um. Codigo desconhecido entra com a descricao que a
      // propria fatura imprime: nunca some por eu nao conhece-lo.
      const explicacoes = {
        bonus_itaipu: [
          "Bônus Itaipu",
          "Crédito previsto na Lei 10.438/02, repassado pela distribuidora.",
        ],
        dev_icms_cobrado_a_maior: [
          "Devolução de ICMS",
          "Imposto cobrado a maior em ciclo anterior, devolvido nesta fatura.",
        ],
        juros_dev_faturado_a_maior: [
          "Juros da devolução",
          "Correção sobre o valor que a distribuidora devolveu.",
        ],
      };
      for (const item of itens) {
        if (item?.category !== "credito_financeiro") continue;
        const valor = numero(item.value);
        if (valor === null || valor > -0.005) continue;
        const [titulo, detalhe] = explicacoes[item.code]
          ?? [item.description ?? "Crédito da distribuidora",
            "Abatimento lançado pela distribuidora nesta fatura."];
        linhas.push(["credito", "mdi:cash-refund", titulo, `−${dinheiro(valor)}`, detalhe]);
      }

      // O extrator declarou que nao conseguiu fechar a soma dos itens com o
      // total impresso. O total continua valendo — quem nao fecha e o detalhe.
      const diferenca = numero(dados.reconciliation?.difference);
      if (dados.reconciliation?.reconciled === false
        && diferenca !== null && Math.abs(diferenca) > 0.005) {
        linhas.push([
          "atencao", "mdi:file-alert-outline", "Fatura para revisão",
          dinheiro(diferenca),
          "Este valor do total não foi identificado item a item na leitura do PDF.",
        ]);
      }

      if (linhas.length === 0) return null;
      const caixa = this._element("div", "bill-outliers");
      caixa.append(this._element(
        "span", "bill-outliers-kicker", `Itens financeiros do ciclo · ${reference}`,
      ));
      for (const [tom, icone, titulo, valor, detalhe] of linhas) {
        const item = this._element("div", `bill-outlier ${tom}`);
        const marca = this._element("ha-icon", "bill-outlier-icon");
        marca.setAttribute("icon", icone);
        const copia = this._element("div", "bill-outlier-copy");
        copia.append(
          this._element("strong", "bill-outlier-title", titulo),
          this._element("span", "bill-outlier-detail", detalhe),
        );
        item.append(marca, copia, this._element("span", "num bill-outlier-value", valor));
        caixa.append(item);
      }
      return caixa;
    }

    // Destaca as grandezas do texto: energia em kWh e dinheiro em reais.
    // Percentual fica de fora de proposito — ele qualifica um numero que ja
    // esta em negrito ao lado, e destacar os dois nao destaca nenhum.
    //
    // Monta nos de texto, nunca innerHTML: a frase carrega nome de unidade e
    // valores formatados, e nada disso deveria poder virar marcacao.
    _emphasizeValues(texto) {
      const fragmento = document.createDocumentFragment();
      const padrao = /(R\$\s?\d[\d.]*(?:,\d+)?|\d[\d.]*(?:,\d+)?\s?kWh)/g;
      let ultimo = 0;
      for (const achado of String(texto).matchAll(padrao)) {
        if (achado.index > ultimo) {
          fragmento.append(texto.slice(ultimo, achado.index));
        }
        fragmento.append(this._element("strong", "", achado[0]));
        ultimo = achado.index + achado[0].length;
      }
      if (ultimo < texto.length) fragmento.append(texto.slice(ultimo));
      return fragmento;
    }

    // Verde, amarela ou vermelha, lida do texto que a distribuidora imprime.
    // Sem cor reconhecida devolve null, e o cartao fica neutro em vez de
    // adotar uma cor que a fatura nao disse.
    _bandeiraColor(itens) {
      for (const item of itens) {
        if (item?.category !== "bandeira_tarifaria") continue;
        // Sem normalizar acento: as tres cores nao tem nenhum, e a descricao
        // que a fatura imprime e sempre maiuscula.
        const achado = /BANDEIRA\s+(VERDE|AMARELA|VERMELHA)/i
          .exec(String(item.description ?? ""));
        if (achado) return achado[1].toLowerCase();
      }
      return null;
    }

    // O que o rateio trouxe menos o que o consumo comeu. Positivo de um lado,
    // saiu do saldo; do outro, entrou nele. Nao e leitura de campo: a fatura
    // traz `saldo_anterior` e `credito_utilizado` sempre nulos, e esta e a
    // mesma aritmetica que fecha o saldo de um ciclo para o seguinte.
    _sceeBalanceMovement(compensado, rateio) {
      if (compensado === null || rateio === null) return null;
      const diferenca = compensado - rateio;
      // Centesimo de kWh e o limite do que a fatura publica: abaixo disso a
      // diferenca e arredondamento, nao movimento de saldo.
      if (Math.abs(diferenca) < 0.005) return null;
      return { usado: diferenca > 0, quantidade: Math.abs(diferenca) };
    }

    // Quantos ciclos o saldo cobriria, no ritmo de consumo deste ciclo.
    // Saldo zero tambem responde — e justamente onde a resposta importa mais.
    _sceeAutonomySentence(saldo, total) {
      if (saldo !== null && saldo <= 0.005) {
        return " Sem reserva: o próximo ciclo depende inteiramente do rateio.";
      }
      if (!(saldo > 0) || !(total > 0)) return "";
      // O aviso de "sem reserva" fica: ele nao mede folga, avisa que nao ha
      // nenhuma. A contagem de ciclos saiu — era detalhe, nao alerta.
      if (saldo / total < 0.1) {
        return " Sem reserva: o próximo ciclo depende inteiramente do rateio.";
      }
      return "";
    }

    // A geradora conta outra historia: nao "quanto crédito recebi", e sim
    // "quanto gerei, quanto do meu consumo saiu daí, e quanto sobrou para as
    // outras". Os mesmos campos da fatura, na ordem em que a energia anda.
    _renderCompositionGeneration({ geracao, baseRateio, rateio, percentual, saldo }) {
      const itens = [];
      if (geracao !== null) {
        itens.push(["Geração do ciclo", this._formatSceeEnergy(geracao), "", null]);
      }
      if (baseRateio !== null) {
        itens.push(["Base do rateio", this._formatSceeEnergy(baseRateio), "", null]);
      }
      if (rateio !== null) {
        itens.push([
          "Guardado no saldo", `+${this._formatSceeEnergy(rateio)}`, "positive", null,
        ]);
      }
      if (saldo !== null) {
        itens.push(["Saldo ao fim do ciclo", this._formatSceeEnergy(saldo), "", null]);
      }
      return this._compositionBalanceBox(itens);
    }

    _renderCompositionBalance({ rateio, movimento, saldo }) {
      const itens = [];
      if (rateio !== null) {
        itens.push(["Rateio recebido", this._formatSceeEnergy(rateio), ""]);
      }
      if (movimento) {
        itens.push([
          movimento.usado ? "Usado do saldo" : "Guardado no saldo",
          `${movimento.usado ? "−" : "+"}${this._formatSceeEnergy(movimento.quantidade)}`,
          movimento.usado ? "negative" : "positive",
        ]);
      }
      if (saldo !== null) {
        // Sem nota sob o valor: a autonomia em ciclos ja e dita por extenso no
        // texto logo abaixo, e repetida aqui virava a mesma coisa duas vezes.
        itens.push(["Saldo ao fim do ciclo", this._formatSceeEnergy(saldo), "", null]);
      }
      return this._compositionBalanceBox(itens);
    }

    _compositionBalanceBox(itens) {
      if (itens.length === 0) return null;
      const caixa = this._element("div", "composition-balance");
      for (const [rotulo, valor, tom, nota] of itens) {
        const item = this._element("div", `composition-balance-item ${tom}`);
        item.append(
          this._element("span", "composition-balance-label", rotulo),
          this._element("strong", "num composition-balance-value", valor),
        );
        if (nota) {
          item.append(this._element("small", "composition-balance-note", nota));
        }
        caixa.append(item);
      }
      return caixa;
    }

    _renderToolbar() {
      const toolbar = this._element("header", "toolbar");
      const selector = this._element("nav", "unit-selector");
      selector.setAttribute("aria-label", "Selecionar unidade");

      for (const unit of this._unitIds()) {
        const key = this._key(unit);
        const cached = this._cache.get(key) ?? this._stale.get(key);
        // O catalogo ja traz o nome antes de cada unidade carregar os
        // proprios dados; sem ele a aba mostrava o id ("apto_1") ate o clique.
        const visibleName = cached?.snapshot?.name ?? this._unitLabel(unit);
        const button = this._button(visibleName, "select-unit", "unit-button");
        button.dataset.unit = unit;
        button.setAttribute("aria-pressed", String(unit === this._selectedUnit));
        selector.append(button);
      }

      toolbar.append(selector, this._renderBillingReferenceControl());
      return toolbar;
    }

    _renderHistoryCycleControl() {
      const cycles = this._selectableHistoryCycles();
      const selected = this._selectedHistoryCycle();
      const selectedIndex = cycles.findIndex((cycle) => (
        cycle.cycle_id === selected?.cycle_id
      ));
      // Mesmas classes do controle de dia/mes/ano: e o mesmo controle, so que
      // com um seletor no lugar do campo de data. O rotulo "Ciclo" que ficava
      // por cima saiu junto — o botao CICLO logo ao lado ja diz o que e, e ele
      // era a unica coisa que fazia este controle ter altura diferente dos
      // outros tres.
      const controls = this._element("div", "history-controls");
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", "Selecionar ciclo de faturamento");
      const previous = this._button(
        "‹", "history-cycle-previous", "history-date-button",
      );
      previous.disabled = selectedIndex < 0 || selectedIndex >= cycles.length - 1;
      previous.setAttribute("aria-label", "Ciclo anterior");
      const select = this._element("select", "history-date-input history-cycle-select");
      select.dataset.action = "history-cycle";
      select.setAttribute("aria-label", "Ciclo selecionado");
      if (cycles.length === 0) {
        const option = this._element("option", "", "Indisponível");
        option.value = "";
        select.append(option);
        select.disabled = true;
      } else {
        for (const cycle of cycles) {
          const option = this._element("option", "", this._cycleOptionLabel(cycle));
          option.value = cycle.cycle_id;
          option.selected = cycle.cycle_id === selected?.cycle_id;
          select.append(option);
        }
      }
      const next = this._button(
        "›", "history-cycle-next", "history-date-button",
      );
      next.disabled = selectedIndex <= 0;
      next.setAttribute("aria-label", "Próximo ciclo");
      controls.append(previous, select, next);
      return controls;
    }

    _renderBillingReferenceControl(unit = this._selectedUnit) {
      const references = this._closedBillingReferences(unit);
      const selected = references.includes(this._billingReference) ? this._billingReference : null;
      const selectedIndex = references.indexOf(selected);
      const wrapper = this._element("div", "billing-reference-global");
      const controls = this._element("div", "billing-reference-global-controls");
      controls.setAttribute("role", "group");
      controls.setAttribute("aria-label", "Referência oficial fechada da dashboard");
      const previous = this._button(
        "‹", "billing-reference-previous", "billing-reference-global-button",
      );
      previous.disabled = selectedIndex < 0 || selectedIndex >= references.length - 1;
      previous.setAttribute("aria-label", "Referência fechada anterior");
      const select = this._element("select", "billing-reference-global-select");
      select.dataset.action = "billing-reference";
      select.setAttribute("aria-label", "Referência oficial fechada selecionada");
      if (references.length === 0) {
        const option = this._element(
          "option", "", this._cyclesCatalogInFlight.has(unit)
            ? "Carregando…" : "Indisponível",
        );
        option.value = "";
        select.append(option);
        select.disabled = true;
      } else {
        for (const reference of references) {
          const option = this._element("option", "", reference);
          option.value = reference;
          option.selected = reference === selected;
          select.append(option);
        }
      }
      const next = this._button(
        "›", "billing-reference-next", "billing-reference-global-button",
      );
      next.disabled = selectedIndex <= 0;
      next.setAttribute("aria-label", "Próxima referência fechada");
      controls.append(previous, select, next);
      wrapper.append(controls);
      return wrapper;
    }

    // O seletor da Visao geral virou um so. Ele mantem o que ja fazia — fixar
    // a referencia fechada que a pagina Unidades herda — e absorve o que o
    // painel de fluxo fazia por conta propria: oferecer tambem o ciclo em
    // andamento. Dois controles de periodo na mesma tela, um deles sem efeito
    // visivel, so tinham como resultado a duvida sobre qual mandava.
    // So o seletor: o rotulo repetia o que a propria opcao ja diz e as setas
    // percorriam a mesma lista que o menu abre de uma vez.
    _renderOverviewReferenceControl() {
      const opcoes = this._energyFlowReferences();
      const escolhido = this._energyFlowSelection ?? "";
      const select = this._element("select", "billing-reference-global-select");
      select.dataset.action = "overview-reference";
      select.setAttribute("aria-label", "Referência da visão geral");
      for (const opcao of opcoes) {
        const option = this._element("option", "", opcao.label);
        option.value = opcao.value;
        option.selected = opcao.value === escolhido;
        select.append(option);
      }
      return select;
    }

    _status(message, modifier = "") {
      const status = this._element("div", `status ${modifier}`.trim(), message);
      status.setAttribute("aria-live", "polite");
      return status;
    }

    _renderError(message, compact = false) {
      const box = this._element("section", compact ? "error compact" : "error");
      box.setAttribute("aria-live", "polite");
      box.append(
        this._element("strong", "", "Não foi possível carregar o overview."),
        this._element("span", "error-detail", message),
        this._button("Tentar novamente", "retry"),
      );
      return box;
    }

    _renderOverview(data) {
      const content = this._element("div", "content overview-page");
      // O titulo e o seletor de referencia subiram para a barra do topo, que
      // vale para a pagina inteira. Repeti-los aqui seria dizer duas vezes de
      // que periodo a tela esta falando.
      const grid = this._element("section", "overview-unit-grid");
      grid.setAttribute("aria-label", "Resumo das unidades");
      for (const unit of this._unitIds()) {
        grid.append(this._renderOverviewUnitCard(unit));
      }
      // Fluxo e rateio respondem a mesma pergunta — para onde foi a energia —
      // e por isso ficam lado a lado, na mesma altura. O painel completo de
      // rateio, com edicao e agendamento, continua na aba Unidades: repetir os
      // mesmos quatro percentuais duas vezes na mesma tela nao ajudaria.
      //
      // Os dois falam da energia gerada. Sem quem gere, a linha inteira sai:
      // um painel vazio permanente seria pior do que a ausencia dele.
      const modalHost = this._element("div", "distribution-modal-host");
      modalHost.dataset.distributionModalHost = "";
      // As quatro unidades primeiro: elas sao o estado do sistema, e o fluxo
      // e o rateio explicam como se chegou nele.
      content.append(grid);
      // Fluxo e rateio nao tem a mesma condicao. O fluxo precisa de geracao;
      // o rateio precisa de geracao E de mais de uma unidade — numa casa
      // sozinha nao ha para quem distribuir, e a rosca aparecia dizendo
      // "rateio configurado indisponivel" sobre algo que nao existe.
      const podem = this._capabilities;
      if (podem.generation) {
        const linha = this._element("div", "overview-flow-row");
        linha.append(this._renderEnergyFlow());
        if (podem.distribution) linha.append(this._renderDistributionDonut());
        linha.setAttribute(
          "aria-label",
          podem.distribution ? "Fluxo energético e rateio" : "Fluxo energético",
        );
        content.append(linha);
      }
      content.append(modalHost);
      // Um _render completo esvazia o host; sem reconstruir, salvar um rateio
      // fecharia o proprio popup em que se estava editando.
      if (this._distributionModal || this._qualityModal) {
        queueMicrotask(() => {
          if (this.isConnected) this._renderDistributionModalUpdate();
        });
      }
      queueMicrotask(async () => {
        if (!this.isConnected || this._page !== "overview") return;
        this._renderFlowChart();
        for (const unit of this._unitIds()) {
          const id = typeof unit === "string" ? unit : unit?.id;
          if (!id) continue;
          this._loadCycleCost(id);
          this._loadDailyBalance(id);
          // O catalogo diz se a unidade tem ciclo aguardando fatura, que e o
          // que o selo da foto mostra. Troca so o cartao ao chegar.
          this._loadCyclesCatalog({ unit: id, allowOutsideCycle: true, quiet: true })
            .then(() => {
              if (this.isConnected && this._page === "overview") {
                this._renderOverviewCardUpdate(id);
              }
            });
          // O backend resolve as duas janelas do ciclo sozinho: nao ha mais
          // catalogo a carregar nem serie diaria a somar aqui.
          this._loadCycleTrend(
            id, this._overviewPrimaryMetric(this._displayData(this._key(id)))?.logical_id,
          );
        }
      });
      return content;
    }

    _formatEnergyFlowValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return "—";
      return `${new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(numeric)} kWh`;
    }

    // O ciclo que esta na tela, com as datas. Sem elas "referencia selecionada"
    // obriga o leitor a subir ate o seletor para saber de quando e o numero —
    // e no ciclo aberto nem existe referencia faturada para ele achar la.
    _energyFlowSubtitle() {
      const data = this._energyFlowData;
      if (!data) {
        const quem = this._generator ? this._unitLabel(this._generator) : "sistema";
        return `Fluxo consolidado da ${quem}.`;
      }
      // Fora do ciclo a leitura muda de natureza, e o subtitulo precisa dizer
      // isso: o lado fisico continua medido, mas compensacao e saldo para
      // rateio deixam de ter apuracao oficial.
      if (data.period_kind && data.period_kind !== "cycle") {
        const inicio = this._formatHistoryCycleDay(data.period?.start);
        const fim = this._formatHistoryCycleDay(data.period?.end);
        const janela = inicio && fim && inicio !== "—" && fim !== "—"
          ? `${inicio} a ${fim}` : data.billing_reference;
        return `${janela} · rateio e compensação estimados, apuração é por ciclo`;
      }
      const inicio = this._formatHistoryCycleDay(data.period?.start);
      const fim = this._formatHistoryCycleDay(data.period?.end);
      const periodo = inicio && fim && inicio !== "—" && fim !== "—"
        ? ` · ${inicio} a ${fim}`
        : "";
      // Tres estados, tres frases. O provisorio ja terminou pela data: dizer
      // "medicao em curso" dele contaria um ciclo encerrado como se ainda
      // estivesse acontecendo.
      const origem = {
        closed: "fatura fechada",
        provisional: "ciclo encerrado, aguardando fatura oficial",
      }[data.cycle_status] ?? "medição em curso, sem fatura";
      return `${data.billing_reference}${periodo} · ${origem}`;
    }

    // A rosca segue a referencia selecionada, nao a regra vigente hoje. Quem
    // le MAI/2026 no fluxo ao lado tem de ver os percentuais de MAI/2026 na
    // rosca — antes o fluxo ja rateava pela regra da epoca e a rosca
    // insistia na regra atual, duas respostas para a mesma
    // pergunta na mesma linha da tela.
    //
    // A fonte e o proprio `allocations` do fluxo: e o backend que resolve qual
    // regra valia naquele ciclo, e repetir essa resolucao aqui abriria espaco
    // para as duas divergirem de novo. Sem fluxo carregado, cai na regra atual.
    _distributionSharesForSelection() {
      const allocations = this._energyFlowData?.allocations;
      if (Array.isArray(allocations) && allocations.length) {
        const shares = {};
        for (const item of allocations) {
          if (typeof item?.unit_id !== "string") continue;
          shares[item.unit_id] = item.share_percent;
        }
        return shares;
      }
      const shares = this._distributionData?.current?.shares;
      return shares && typeof shares === "object" ? shares : null;
    }

    // O rateio como rosca. Quatro percentuais que somam um todo pedem area,
    // nao uma lista: a fatia diz a proporcao antes de o numero ser lido.
    _renderDistributionDonut() {
      const section = this._element("section", "panel rateio-card");
      section.dataset.distributionDonut = "";
      section.append(
        this._element("span", "section-kicker", "Distribuição por período"),
        this._element("h3", "section-title", "Percentuais de rateio"),
      );

      const shares = this._distributionSharesForSelection();
      if (!shares) {
        section.append(this._historyStatus(
          this._distributionError && !this._distributionLoading
            ? this._distributionError
            : "Carregando rateio configurado…",
          this._distributionLoading ? "loading compact" : "compact",
        ));
        return section;
      }

      const fatias = [];
      let acumulado = 0;
      for (const unit of this._units()) {
        const valor = Number(shares[unit.id]);
        if (!Number.isFinite(valor) || valor <= 0) continue;
        const inicio = acumulado;
        acumulado += valor;
        fatias.push({
          unit,
          valor,
          parada: `${this._unitColor(unit.id)} ${inicio}% ${acumulado}%`,
        });
      }

      const body = this._element("div", "rateio-body");
      const ring = this._element("div", "rateio-ring");
      const fill = this._element("div", "rateio-ring-fill");
      if (fatias.length) {
        // O ultimo trecho fecha em 100% mesmo que a soma configurada nao chegue
        // la: o buraco ficaria como um vazio sem nome no desenho.
        fill.style.background = `conic-gradient(${fatias.map((item) => item.parada)
          .join(", ")}, color-mix(in srgb, var(--secondary-text-color) 20%, transparent) `
          + `${acumulado}% 100%)`;
      }
      const centro = this._element("div", "rateio-ring-body");
      centro.append(
        this._element("strong", "rateio-total",
          `${this._formatNumber(acumulado, 2, 0)}%`),
        this._element("small", "rateio-total-label", "rateio"),
      );
      ring.append(fill, centro);

      const legend = this._element("div", "rateio-legend");
      for (const unit of this._units()) {
        const item = this._element("div", "rateio-legend-item");
        item.style.setProperty("--unit-cor", this._unitColor(unit.id));
        item.append(
          this._element("span", "rateio-dot"),
          this._element("span", "rateio-legend-name", unit.label),
          this._element("strong", "",
            this._formatDistributionPercent(shares[unit.id])),
        );
        legend.append(item);
      }
      body.append(ring, legend);
      section.append(body);

      const acoes = this._element("div", "rateio-actions");
      acoes.append(
        this._button("Editar rateio", "distribution-open-editor", "rateio-action"),
        this._button("Histórico de vigências", "distribution-open-history", "rateio-action"),
      );
      section.append(acoes);
      return section;
    }

    // Mesmo chrome do popup da auditoria: um overlay, cabecalho com titulo e
    // fechar, corpo rolavel. Duas telas que se comportam igual nao deveriam
    // parecer duas coisas diferentes.
    _renderDistributionModal() {
      const vista = this._distributionModal;
      if (!vista) return null;
      const overlay = this._element("div", "audit-modal-overlay");
      // O despacho global so olha <button>; o clique no fundo precisa do
      // proprio ouvinte, e so fecha quando o alvo e o fundo.
      overlay.addEventListener("click", (event) => {
        if (event.target !== overlay) return;
        this._distributionModal = null;
        this._renderDistributionModalUpdate();
      });
      const dialog = this._element("div", "audit-modal audit-modal-wide");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Rateio configurado");

      const head = this._element("div", "audit-modal-head");
      head.append(
        this._element("div", "audit-modal-title", vista === "historico"
          ? "Histórico de vigências do rateio"
          : "Rateio configurado"),
        this._button("✕", "distribution-modal-close", "audit-modal-close"),
      );
      dialog.append(head);

      const body = this._element("div", "audit-modal-body");
      if (vista === "historico") {
        const historico = this._distributionData?.history;
        body.append(historico
          ? this._renderDistributionHistory(historico)
          : this._historyStatus("Nenhuma vigência registrada.", "compact"));
      } else {
        body.append(this._renderDistribution({ modal: true, includeHistory: false }));
      }
      dialog.append(body);
      overlay.append(dialog);
      return overlay;
    }

    _openQualityModal() {
      const referencia = this._energyFlowData?.billing_reference;
      if (typeof referencia !== "string" || !referencia.trim()) return;
      if (!this._generator) return;
      this._distributionModal = null;
      this._qualityModal = {
        reference: referencia,
        unit: this._generator,
        // Mesma chave do painel de historico: se o ciclo ja foi baixado por
        // outra tela, o grafico abre sem nova ida ao servidor.
        key: this._historyKey(this._generator, "cycle", referencia, HISTORY_MODES.cycle.resolution),
      };
      this._renderDistributionModalUpdate();
      this._loadQualityEvidence(referencia);
      this._loadQualityHistory(this._qualityModal);
    }

    _closeQualityModal() {
      this._qualityModal = null;
      this._cleanupQualityChart();
      this._renderDistributionModalUpdate();
    }

    // O fluxo so diz QUE o ciclo esta parcial. Quem sabe em qual grandeza e por
    // quanto e o endpoint de autoconsumo: e ele que carrega as razoes de
    // cobertura e aceitacao medidas em cada serie.
    async _loadQualityEvidence(referencia) {
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (!this._generator) return null;
      if (this._qualityEvidence.has(referencia)) return this._qualityEvidence.get(referencia);
      if (this._qualityInFlight.has(referencia)) return this._qualityInFlight.get(referencia);
      const configGeneration = this._configGeneration;
      this._qualityErrors.delete(referencia);
      const request = this._hass.callWS({
        type: SELF_CONSUMPTION_COMMAND,
        unit_id: this._generator,
        billing_reference: referencia,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION
          || !response.data || typeof response.data !== "object"
          || Array.isArray(response.data)) {
          throw new Error("Resposta de autoconsumo físico inválida.");
        }
        if (response.data.billing_reference !== referencia) {
          throw new Error("Resposta de autoconsumo não corresponde ao ciclo solicitado.");
        }
        if (configGeneration !== this._configGeneration) return null;
        this._qualityEvidence.set(referencia, response.data);
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        this._qualityErrors.set(
          referencia,
          error?.message ?? "Não foi possível carregar a evidência de qualidade.",
        );
        return null;
      }).finally(() => {
        if (this._qualityInFlight.get(referencia) === request) {
          this._qualityInFlight.delete(referencia);
        }
        if (this._qualityModal?.reference === referencia) {
          this._renderDistributionModalUpdate();
        }
      });
      this._qualityInFlight.set(referencia, request);
      return request;
    }

    async _loadQualityHistory(target) {
      const { unit, key } = target;
      if (!this._hass || typeof this._hass.callWS !== "function") return null;
      if (this._historyCache.has(key)) return this._historyData(key);
      if (this._historyInFlight.has(key)) return this._historyInFlight.get(key);
      const configGeneration = this._configGeneration;
      this._historyErrors.delete(key);
      const request = this._hass.callWS({
        type: HISTORY_COMMAND,
        unit_id: unit,
        mode: "cycle",
        reference: target.reference,
        resolution: HISTORY_MODES.cycle.resolution,
      }).then((response) => {
        if (!response || response.api_version !== API_VERSION
          || !response.data || typeof response.data !== "object") {
          throw new Error("Resposta de histórico inválida.");
        }
        if (configGeneration !== this._configGeneration) return null;
        this._historyCache.set(key, { data: response.data, cachedAt: Date.now() });
        return response.data;
      }).catch((error) => {
        if (configGeneration !== this._configGeneration) return null;
        const code = error?.code ?? error?.error?.code;
        if (code === "history_unavailable") {
          this._historyCache.set(key, {
            data: { available: false, mode: "cycle", series: [] },
            cachedAt: Date.now(),
          });
        } else {
          this._historyErrors.set(key, this._historyErrorMessage(error));
        }
        return null;
      }).finally(() => {
        if (this._historyInFlight.get(key) === request) {
          this._historyInFlight.delete(key);
        }
        if (this._qualityModal?.key === key) this._renderDistributionModalUpdate();
      });
      this._historyInFlight.set(key, request);
      return request;
    }

    // Os codigos vem do backend em ingles e por contrato. Traduzir na exibicao
    // mantem o contrato intacto e ainda deixa o codigo cru visivel ao lado —
    // e ele que se procura ao abrir um log.
    _qualityReasonLabel(code) {
      return {
        coverage_incomplete: "A série não cobriu o ciclo inteiro",
        acceptance_below_confirmed_threshold: "Parte das leituras foi rejeitada na validação",
        missing_observations: "Faltam observações registradas no período",
        excessive_rejected_duration: "Houve um trecho rejeitado longo demais e seguido",
        unrecognized_rejection_reason: "Uma leitura foi rejeitada por um motivo não catalogado",
        observed_value_is_not_full_cycle: "O valor exibido é só o observado, sem extrapolar as falhas",
        import_unavailable: "Importação indisponível no período",
        generation_unavailable: "Geração indisponível no período",
        export_unavailable: "Exportação indisponível no período",
        self_consumption_unavailable: "Autoconsumo não pôde ser calculado",
        invalid_billing_period: "O período de faturamento não é válido para auditoria",
      }[code] ?? code;
    }

    _qualityRatio(value) {
      return typeof value === "number" && Number.isFinite(value)
        ? `${this._formatNumber(value * 100, 2, 2)}%`
        : "—";
    }

    _renderQualityModal() {
      const alvo = this._qualityModal;
      if (!alvo) return null;
      const overlay = this._element("div", "audit-modal-overlay");
      overlay.addEventListener("click", (event) => {
        if (event.target !== overlay) return;
        this._closeQualityModal();
      });
      const dialog = this._element("div", "audit-modal audit-modal-wide");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Diagnóstico de dados parciais");

      const head = this._element("div", "audit-modal-head");
      head.append(
        this._element("div", "audit-modal-title", `Dados parciais · ${alvo.reference}`),
        this._button("✕", "quality-modal-close", "audit-modal-close"),
      );
      dialog.append(head);

      const body = this._element("div", "audit-modal-body");
      body.append(
        this._element(
          "p",
          "quality-modal-lead",
          "O ciclo foi fechado, mas as séries que alimentam geração, autoconsumo, "
          + "exportação e importação não passaram no critério de leitura completa. "
          + "Os valores exibidos são os efetivamente observados — nada foi "
          + "extrapolado para cobrir as falhas, então tendem a ficar abaixo do real.",
        ),
        this._renderQualityReasons(alvo),
        this._renderQualityCoverage(alvo),
        this._renderQualityChartContent(alvo),
      );
      dialog.append(body);
      overlay.append(dialog);
      return overlay;
    }

    _renderQualityReasons(alvo) {
      const bloco = this._element("section", "quality-block");
      bloco.append(this._element("h4", "quality-block-title", "O que falhou"));
      const evidencia = this._qualityEvidence.get(alvo.reference);
      // O fluxo ja traz os motivos; a evidencia de autoconsumo traz os mesmos
      // mais os avisos. Unir as duas evita uma lista que muda ao carregar.
      const codigos = [...new Set([
        ...(this._energyFlowData?.quality?.warnings ?? []),
        ...(evidencia?.blockers ?? []),
        ...(evidencia?.warnings ?? []),
      ])];
      if (codigos.length === 0) {
        bloco.append(this._historyStatus(
          this._qualityInFlight.has(alvo.reference)
            ? "Carregando evidência…"
            : this._qualityErrors.get(alvo.reference)
              ?? "O backend não detalhou o motivo desta referência.",
          this._qualityInFlight.has(alvo.reference) ? "loading compact" : "compact",
        ));
        return bloco;
      }
      const lista = this._element("ul", "quality-reason-list");
      for (const codigo of codigos) {
        const item = this._element("li", "quality-reason");
        item.append(
          this._element("span", "quality-reason-text", this._qualityReasonLabel(codigo)),
          this._element("code", "quality-reason-code", codigo),
        );
        lista.append(item);
      }
      bloco.append(lista);
      return bloco;
    }

    _renderQualityCoverage(alvo) {
      const bloco = this._element("section", "quality-block");
      bloco.append(this._element("h4", "quality-block-title", "Onde falhou"));
      const evidencia = this._qualityEvidence.get(alvo.reference);
      const qualidade = evidencia?.quality;
      if (!qualidade) {
        bloco.append(this._historyStatus(
          this._qualityInFlight.has(alvo.reference)
            ? "Carregando cobertura por grandeza…"
            : this._qualityErrors.get(alvo.reference) ?? "Cobertura indisponível.",
          this._qualityInFlight.has(alvo.reference) ? "loading compact" : "compact",
        ));
        return bloco;
      }
      const tabela = this._element("div", "quality-coverage");
      tabela.append(
        this._element("span", "quality-coverage-head", "Grandeza"),
        this._element("span", "quality-coverage-head", "Cobertura"),
        this._element("span", "quality-coverage-head", "Aceitação"),
      );
      const linhas = [
        ["Geração", "generation_energy", qualidade.generation],
        ["Exportação", "export_energy", qualidade.export],
        ["Importação", "import_energy", qualidade.import],
      ];
      for (const [rotulo, metrica, dados] of linhas) {
        const nome = this._element("span", "quality-coverage-metric", rotulo);
        nome.style.setProperty("--grandeza-cor", METRIC_COLORS[metrica]);
        tabela.append(
          nome,
          this._element("span", "quality-coverage-value",
            this._qualityRatio(dados?.coverage_ratio)),
          this._element("span", "quality-coverage-value",
            this._qualityRatio(dados?.acceptance_ratio)),
        );
      }
      bloco.append(tabela);
      bloco.append(this._element(
        "small",
        "quality-note",
        "Cobertura é quanto do ciclo tem observação registrada; aceitação é "
        + "quanto dessas observações passou na validação. Qualquer uma abaixo "
        + "do exigido derruba o ciclo para parcial.",
      ));
      return bloco;
    }

    _renderQualityChartContent(alvo) {
      const bloco = this._element("section", "quality-block");
      bloco.append(this._element("h4", "quality-block-title", "A curva do ciclo"));
      const data = this._historyData(alvo.key);
      const loading = this._historyInFlight.has(alvo.key);
      const error = this._historyErrors.get(alvo.key);
      if (!data) {
        bloco.append(error && !loading
          ? this._historyStatus(error)
          : this._historyStatus("Carregando histórico…", "loading"));
        return bloco;
      }
      if (data.available === false || !Array.isArray(data.series)
        || data.series.length === 0 || !this._historyHasNumericData(data)) {
        bloco.append(this._historyStatus("Sem série registrada para este ciclo."));
        return bloco;
      }
      if (this._chartModuleError) {
        bloco.append(this._historyStatus(this._chartModuleError));
        return bloco;
      }
      const frame = this._element("div", "history-chart-frame audit-chart-frame");
      const chart = this._element("div", "history-chart");
      chart.dataset.qualityChart = "";
      chart.setAttribute("role", "img");
      chart.setAttribute(
        "aria-label",
        `Curva do ciclo ${alvo.reference} da ${this._unitLabel(this._generator)}`,
      );
      frame.append(chart);
      bloco.append(frame, this._element(
        "small",
        "quality-note",
        "Os dias sem barra são onde a série não registrou observação. É esse "
        + "buraco que o backend contabiliza como cobertura incompleta.",
      ));
      return bloco;
    }

    async _renderQualityChart() {
      const alvo = this._qualityModal;
      if (!alvo) return;
      const data = this._historyData(alvo.key);
      const element = this.shadowRoot?.querySelector("[data-quality-chart]");
      if (!element || !data || data.available === false
        || !Array.isArray(data.series) || data.series.length === 0) return;
      try {
        const chartModule = await this._loadChartModule();
        if (!element.isConnected || this._qualityModal?.key !== alvo.key
          || element !== this.shadowRoot.querySelector("[data-quality-chart]")) return;
        this._cleanupQualityChart();
        this._qualityChart = chartModule.initChart(
          element,
          // Geracao e exportacao pre-selecionadas: sao exatamente as duas
          // series que o backend mede para decidir confirmado x parcial.
          this._historyChartOptions(
            data,
            { unit: alvo.unit, events: [] },
            this._qualityChartLegend(data),
          ),
        );
        if (typeof ResizeObserver !== "undefined") {
          this._qualityChartResizeObserver = new ResizeObserver(() => {
            if (this._qualityChart === null) return;
            chartModule.resizeChart(this._qualityChart);
          });
          this._qualityChartResizeObserver.observe(element);
        }
      } catch {
        /* o diagnostico continua util sem o grafico */
      }
    }

    _qualityChartLegend(data) {
      const series = Array.isArray(data?.series) ? data.series : [];
      if (series.length < 2) return null;
      const alvo = new Set(["generation_energy", "export_energy"]);
      const selecao = {};
      let algum = false;
      for (const item of series) {
        const ligado = alvo.has(String(item?.logical_id ?? "").split(".").pop());
        selecao[item.label] = ligado;
        if (ligado) algum = true;
      }
      return algum ? selecao : null;
    }

    _cleanupQualityChart() {
      this._qualityChartResizeObserver?.disconnect();
      this._qualityChartResizeObserver = null;
      if (this._qualityChart && this._chartModule) {
        this._chartModule.disposeChart(this._qualityChart);
      }
      this._qualityChart = null;
    }

    // Um host, dois popups. Nunca os dois ao mesmo tempo: abrir um fecha o
    // outro, senao o clique no fundo nao saberia qual dos dois dispensa.
    _renderDistributionModalUpdate() {
      const host = this.shadowRoot?.querySelector("[data-distribution-modal-host]");
      if (!host) return;
      this._cleanupQualityChart();
      host.replaceChildren();
      const modal = this._renderDistributionModal() ?? this._renderQualityModal();
      if (modal) host.append(modal);
      if (this._qualityModal) {
        queueMicrotask(() => {
          if (this.isConnected) this._renderQualityChart();
        });
      }
    }

    _renderEnergyFlow() {
      const section = this._element("section", "panel energy-flow");
      section.dataset.energyFlow = "";
      section.dataset.engine = "energy.flow";
      const header = this._element("header", "energy-flow-header");
      const heading = this._element("div", "energy-flow-heading");
      heading.append(
        this._element("h3", "section-title", "Fluxo energético do sistema"),
        this._element("p", "overview-description", this._energyFlowSubtitle()),
      );
      header.append(heading, this._renderEnergyFlowPeriodControl());
      // No ciclo em andamento os selos nao informam: "em andamento" repete o
      // que o seletor do topo ja diz, e "dados parciais" e a condicao normal
      // de um ciclo que ainda nao terminou. Num ciclo fechado, os dois pesam.
      const qualityStatus = this._energyFlowData?.quality?.status;
      const fechado = this._energyFlowData?.cycle_status === "closed";
      if (fechado && qualityStatus === "partial") {
        const selo = this._button(
          "Dados parciais", "energy-flow-quality", "energy-flow-quality partial",
        );
        selo.setAttribute(
          "aria-label", "Ver por que os dados deste ciclo estão parciais",
        );
        header.append(selo);
      }
      section.append(header);

      if (this._energyFlowError && !this._energyFlowLoading) {
        section.append(this._element("p", "energy-flow-state", this._energyFlowError));
        return section;
      }
      if (qualityStatus === "unavailable") {
        section.append(this._element(
          "p", "energy-flow-state", "Fluxo energético indisponível para esta referência.",
        ));
        return section;
      }
      if (this._energyFlowLoading && !this._energyFlowData) {
        section.append(this._historyStatus("Carregando fluxo energético…", "loading"));
        return section;
      }
      if (!this._energyFlowSankey()) {
        section.append(this._element(
          "p", "energy-flow-state", "Sem valores suficientes para compor o fluxo.",
        ));
        return section;
      }

      const frame = this._element("div", "flow-chart-frame");
      const chart = this._element("div", "flow-chart");
      chart.dataset.flowChart = "";
      chart.setAttribute("role", "img");
      chart.setAttribute(
        "aria-label",
        `Fluxo energético de ${this._energyFlowData?.billing_reference ?? "referência atual"}`,
      );
      frame.append(chart);
      section.append(frame);
      return section;
    }

    // Mesmo par de controles do historico: os modos a esquerda, o seletor do
    // periodo a direita. Sao a mesma pergunta em duas telas, e responder de
    // formas diferentes obrigaria a reaprender o controle em cada uma.
    _renderEnergyFlowPeriodControl() {
      const caixa = this._element("div", "energy-flow-period");
      // Mesma classe do seletor de modo do historico: os dois controles sao a
      // mesma coisa e nao deveriam ter estilos separados.
      const modos = this._element("div", "history-mode-selector");
      for (const [kind, rotulo] of [
        ["day", "DIA"], ["month", "MÊS"], ["cycle", "CICLO"],
      ]) {
        const botao = this._button(rotulo, "energy-flow-period-kind", "history-mode-button");
        botao.dataset.periodKind = kind;
        botao.setAttribute(
          "aria-pressed", String(this._energyFlowPeriodKind === kind),
        );
        modos.append(botao);
      }
      caixa.append(modos);

      if (this._energyFlowPeriodKind === "cycle") {
        caixa.append(this._renderOverviewReferenceControl());
        return caixa;
      }

      const grupo = this._element("div", "comparison-reference-group");
      const anterior = this._button("‹", "energy-flow-period-previous", "history-date-button");
      anterior.setAttribute("aria-label", "Período anterior do fluxo");
      const campo = this._element("input", "history-date-input");
      campo.type = this._energyFlowPeriodKind === "day" ? "date" : "month";
      campo.value = this._energyFlowCalendar[this._energyFlowPeriodKind];
      campo.max = this._energyFlowCalendarMax();
      campo.dataset.action = "energy-flow-period-date";
      campo.setAttribute("aria-label", "Período do fluxo energético");
      const proximo = this._button("›", "energy-flow-period-next", "history-date-button");
      proximo.setAttribute("aria-label", "Período seguinte do fluxo");
      proximo.disabled = this._energyFlowCalendar[this._energyFlowPeriodKind]
        >= this._energyFlowCalendarMax();
      grupo.append(anterior, campo, proximo);
      caixa.append(grupo);
      return caixa;
    }

    // O grafo. Cada aresta e um campo do payload — nenhuma soma inventada aqui:
    // o proprio Sankey soma as entradas de cada no, e e assim que o consumo
    // da geradora aparece como autoconsumo + importacao sem que ninguem calcule.
    _energyFlowSankey() {
      const data = this._energyFlowData;
      if (!data) return null;
      const n = (valor) => {
        const numero = Number(valor);
        return Number.isFinite(numero) && numero > 0 ? numero : 0;
      };
      const geracao = n(data.generation_kwh);
      const autoconsumo = n(data.self_consumption_kwh);
      const exportacao = n(data.export_kwh);
      const importacao = n(data.import_kwh);
      const compensacao = n(data.generator_compensation_kwh);
      const saldo = n(data.distributable_balance_kwh);
      if (geracao === 0 && exportacao === 0 && importacao === 0) return null;

      const nos = [];
      const arestas = [];
      // `depth` e a coluna; a ordem no array e a posicao vertical dentro dela.
      // As duas sao fixadas aqui porque o layout automatico do ECharts
      // reordenava os nos a cada carga, e a leitura do desenho mudava sem que
      // nada nos dados tivesse mudado.
      const no = (name, depth, color) => {
        nos.push({ name, depth, itemStyle: { color } });
      };
      const aresta = (source, target, value) => {
        if (value > 0) arestas.push({ source, target, value });
      };

      // Os dois nos que levam o nome de quem gera. Antes vinham escritos, e
      // o diagrama falava de uma unidade so, em qualquer instalacao.
      const quemGera = this._unitLabel(this._generator);
      const consumoNo = `Consumo ${quemGera}`;
      const compensacaoNo = `Compensação ${quemGera}`;

      // Coluna 0 — o que entra no sistema.
      no("Geração solar", 0, METRIC_COLORS.generation_energy);
      no("Importação", 0, METRIC_COLORS.import_energy);

      // Coluna 1 — para onde a geracao se reparte.
      no("Exportação", 1, METRIC_COLORS.export_energy);
      no("Autoconsumo", 1, METRIC_COLORS.self_consumption);

      // Coluna 2 — o excedente, antes de ser distribuido.
      no("Saldo para rateio", 2, DISTRIBUTION_COLOR);

      aresta("Geração solar", "Autoconsumo", autoconsumo);
      aresta("Geração solar", "Exportação", exportacao);
      aresta("Autoconsumo", consumoNo, autoconsumo);
      aresta("Importação", consumoNo, importacao);
      // A exportacao se reparte em duas coisas de natureza diferente: o que
      // volta como credito no proprio consumo (compensacao) e o excedente que
      // vai para as beneficiarias. Sao campos independentes do backend, nao
      // uma divisao feita aqui.
      aresta("Exportação", compensacaoNo, compensacao);
      aresta("Exportação", "Saldo para rateio", saldo);

      for (const alocacao of data.allocations ?? []) {
        const valor = n(alocacao?.allocated_energy_kwh);
        if (valor === 0) continue;
        const rotulo = `${alocacao.name ?? this._unitLabel(alocacao.unit_id)}`;
        no(rotulo, 3, this._unitColor(alocacao.unit_id));
        aresta("Saldo para rateio", rotulo, valor);
      }

      // Coluna 3, abaixo das beneficiarias — os dois destinos que ficam na
      // propria geradora. Sao declarados depois do laco porque a ordem do array
      // e a ordem vertical, e eles vao no pe da coluna.
      //
      // A declaracao e condicional: um no sem fita nenhuma apareceria como um
      // rotulo solto de zero kWh, o que parece defeito e nao informacao.
      // A compensacao vem antes do consumo: as duas fitas que chegam aqui
      // nascem em alturas diferentes na coluna 1 — a exportacao em cima, o
      // autoconsumo embaixo — e nesta ordem cada uma desce direto para o seu
      // destino, sem passar por cima da outra.
      if (compensacao > 0) {
        no(compensacaoNo, 3, METRIC_COLORS.import_energy);
      }
      if (autoconsumo > 0 || importacao > 0) {
        no(consumoNo, 3, METRIC_COLORS.physical_consumption);
      }
      if (arestas.length === 0) return null;
      return { nos, arestas };
    }

    _flowChartOptions() {
      const grafo = this._energyFlowSankey();
      if (!grafo) return null;
      const formatar = (valor) => this._formatEnergyFlowValue(valor);
      return {
        backgroundColor: "transparent",
        animationDuration: 420,
        tooltip: {
          trigger: "item",
          backgroundColor: "#1a1d21",
          borderColor: "rgba(255,255,255,.14)",
          textStyle: { color: "#f2f5f8", fontSize: 12 },
          formatter: (params) => (params.dataType === "edge"
            ? `${params.data.source} → ${params.data.target}<br/><b>${formatar(params.data.value)}</b>`
            : `${params.name}<br/><b>${formatar(params.value)}</b>`),
        },
        series: [{
          type: "sankey",
          layout: "none",
          nodeAlign: "justify",
          // Sem iteracoes de layout o ECharts respeita a ordem declarada acima
          // em vez de minimizar cruzamentos por conta propria. Aqui a ordem
          // carrega significado, e vale mais que um cruzamento a menos.
          layoutIterations: 0,
          nodeGap: 14,
          nodeWidth: 13,
          left: 8,
          // Espaco para o rotulo mais longo da direita, "Compensação <unidade>
          // — 133,6 kWh". Com menos que isto o texto era cortado pela borda.
          right: 210,
          top: 14,
          bottom: 14,
          emphasis: { focus: "adjacency" },
          data: grafo.nos,
          links: grafo.arestas,
          // A fita herda a cor da origem: e assim que se segue de onde veio a
          // energia sem precisar ler rotulo nenhum.
          lineStyle: { color: "source", curveness: .55, opacity: .32 },
          label: {
            color: "#d7dee6",
            fontSize: 11.5,
            fontFamily: "Inter, Roboto, system-ui, sans-serif",
            // Nome e valor recebem estilos diferentes, entao o rotulo e escrito
            // em rich text. Nele nada herda do bloco acima: cada trecho declara
            // a propria fonte e cor, ou sai no padrao do ECharts.
            //
            // Travessao entre os dois: com dois espacos, "<unidade> 314,9"
            // podia ser lido como um numero so.
            formatter: (params) => (
              `{nome|${params.name} — }{valor|${formatar(params.value)}}`
            ),
            rich: {
              nome: {
                color: "#d7dee6",
                fontSize: 11.5,
                fontFamily: "Inter, Roboto, system-ui, sans-serif",
              },
              valor: {
                color: "#f2f5f8",
                fontSize: 11.5,
                fontWeight: 700,
                fontFamily: "Inter, Roboto, system-ui, sans-serif",
              },
            },
            overflow: "none",
          },
          itemStyle: { borderWidth: 0 },
        }],
      };
    }

    async _renderFlowChart() {
      const element = this.shadowRoot?.querySelector("[data-flow-chart]");
      const options = this._flowChartOptions();
      if (!element || !options) return;
      try {
        const chartModule = await this._loadChartModule();
        if (!element.isConnected
          || element !== this.shadowRoot.querySelector("[data-flow-chart]")) return;
        this._cleanupFlowChart();
        this._flowChart = chartModule.initChart(element, options);
        if (typeof ResizeObserver !== "undefined") {
          this._flowChartResizeObserver = new ResizeObserver(() => {
            if (this._flowChart === null) return;
            chartModule.resizeChart(this._flowChart);
          });
          this._flowChartResizeObserver.observe(element);
        }
      } catch {
        /* o painel continua util sem o grafico */
      }
    }

    _cleanupFlowChart() {
      this._flowChartResizeObserver?.disconnect();
      this._flowChartResizeObserver = null;
      if (this._flowChart && this._chartModule) {
        this._chartModule.disposeChart(this._flowChart);
      }
      this._flowChart = null;
    }

    _overviewPrimaryMetric(data) {
      const metrics = data?.cycle_energy?.current_energy?.metrics;
      if (!Array.isArray(metrics) || metrics.length === 0) return null;
      const unitId = data?.snapshot?.unit_id;
      const preferredId = unitId === this._generator
        ? this._generator + ".physical_consumption"
        : `${unitId}.consumption_energy`;
      return metrics.find((metric) => metric.logical_id === preferredId) ?? metrics[0];
    }

    _renderOverviewUnitCard(unit) {
      const key = this._key(unit);
      const data = this._displayData(key);
      const loading = this._inFlight.has(key);
      const error = this._errors.get(key);
      const article = this._element("article", "unit-card panel");
      article.dataset.overviewCard = unit;
      article.style.setProperty("--unit-cor", this._unitColor(unit));

      if (!data) {
        // Sem dado, sem carregamento em curso e sem erro, ninguem pediu o
        // resumo desta unidade ainda — o que acontece com uma unidade criada
        // depois que a pagina abriu. Pedir aqui e o que a tira do limbo.
        if (!loading && !error) {
          queueMicrotask(() => {
            if (this.isConnected) this._loadOverviewUnit(unit);
          });
        }
        article.append(
          this._element("h3", "unit-card-name", this._unitLabel(unit)),
          this._element(
            "p",
            "empty",
            loading || !error ? "Carregando resumo…" : error,
          ),
        );
        return article;
      }

      const snapshot = data.snapshot ?? {};
      const cycle = data.cycle_energy?.cycle ?? {};
      const metric = this._overviewPrimaryMetric(data);
      const prediction = data.prediction;

      const media = this._element("div", "unit-card-media");
      const placeholder = this._element("ha-icon", "unit-card-placeholder");
      placeholder.setAttribute("icon", this._unitIcon(unit));
      media.append(placeholder);
      if (snapshot.image) {
        const image = this._element("img", "unit-card-photo");
        image.alt = snapshot.name ?? this._unitLabel(unit);
        image.loading = "lazy";
        image.addEventListener("load", () => { placeholder.hidden = true; });
        image.addEventListener("error", () => { image.hidden = true; });
        image.src = snapshot.image;
        media.append(image);
      }
      const capa = this._element("div", "unit-card-caption");
      capa.append(this._element(
        "h3", "unit-card-name", snapshot.name ?? this._unitLabel(unit),
      ));
      // O selo sobre a foto passou a carregar o progresso do ciclo. O estado
      // "aberto" repetia o que as datas do rodape ja dizem; quanto do previsto
      // ja foi consumido e a unica coisa ali que muda de um dia para o outro.
      const aguardando = this._awaitingInvoiceCycle(unit);
      if (aguardando) {
        // Enquanto a fatura do ciclo encerrado nao chega, o ciclo novo nao tem
        // data de termino e o selo de progresso nao tem o que medir. A cor vem
        // do backend: o prazo de atraso e declarado no modelo, nao aqui.
        const atrasada = aguardando.invoice_status === "late";
        const selo = this._element(
          "span", `tag ${atrasada ? "tag-crit" : "tag-warn"}`, "Aguardando fatura",
        );
        const leitura = aguardando.period?.end;
        const instante = Date.parse(leitura ?? "");
        if (Number.isFinite(instante)) {
          const desde = Math.max(0, Math.floor((Date.now() - instante) / 86400000));
          selo.title = `${aguardando.predicted_reference ?? "Ciclo encerrado"}`
            + ` · leitura prevista em ${this._formatDate(leitura)}`
            + ` · ${desde} dia${desde === 1 ? "" : "s"} sem fatura`
            + (atrasada ? " · prazo de atraso ultrapassado" : "");
        }
        capa.append(selo);
      } else {
        const progresso = this._cycleProgressRatio(metric, prediction);
        const dias = this._cycleElapsedDays(cycle);
        // Os dois juntos porque um sozinho engana: 91% do previsto no dia 26 de
        // 29 e ritmo normal; os mesmos 91% no dia 10 seria um estouro a caminho.
        // O percentual diz o quanto ja foi gasto, os dias dizem de quanto tempo.
        const partes = [];
        if (progresso !== null) partes.push(`${this._formatNumber(progresso, 0, 0)}%`);
        if (dias) partes.push(`${dias.decorridos} de ${dias.total} dias`);
        if (partes.length) {
          capa.append(this._element(
            "span",
            `tag ${progresso !== null && progresso > 100 ? "tag-warn" : "tag-log"}`,
            partes.join(" - "),
          ));
        }
      }
      media.append(capa);

      const body = this._element("div", "unit-card-body");
      const topo = this._element("div", "unit-card-metric-head");
      // O mesmo titulo nas quatro unidades: o que muda entre elas nao e a
      // pergunta, e como se chegou na resposta — e isso ja esta na etiqueta
      // ao lado. Rotulos diferentes sugeriam grandezas diferentes.
      topo.append(
        this._element("span", "unit-card-metric-label", "Consumo no ciclo"),
        this._element(
          "span",
          "tag tag-log",
          metric
            ? this._translateClassification(metric.classification ?? "unavailable")
            : snapshot.measured ? "Indisponível" : "Sem medição",
        ),
      );
      body.append(topo);

      // Linha principal: o numero do ciclo com a variacao ao lado, e o consumo
      // de hoje encostado a direita. Os dois respondem perguntas diferentes —
      // "quanto vai fechar" e "como esta agora" — e por isso dividem a linha.
      const linha = this._element("div", "unit-card-value-row");
      const esquerda = this._element("div", "unit-card-value-main");
      const valor = this._element("strong", "unit-card-value num");
      valor.textContent = metric ? this._formatNumber(metric.value, 1, 1) : "—";
      esquerda.append(valor, this._element("span", "unit-card-value-unit",
        metric ? this._displayUnit(metric.unit) : ""));
      const tendencia = this._renderUnitCardTrend(unit, metric, cycle);
      if (tendencia) esquerda.append(tendencia);
      linha.append(esquerda, this._renderUnitCardToday(unit, metric));
      body.append(linha);

      const kpis = this._element("div", "unit-card-kpis");
      // Ciclo primeiro, dia depois. A linha de cima do cartao ja e do ciclo —
      // consumo acumulado e tendencia — entao previsao e preco continuam esse
      // assunto antes de a leitura descer para o que aconteceu hoje.
      // Um selo so, no canto, para o bloco inteiro — como o "Medido" do
      // consumo acima. Um selo ao lado de cada valor disputava a linha com o
      // numero, e consumo alto quebrava "kWh" para a linha de baixo.
      //
      // O selo e o NOME do bloco, nao um aviso de que ha numero: fica sempre,
      // tambem quando a projecao ainda nao tem valor (ciclo aguardando
      // fatura). O traco embaixo ja diz "sem valor agora"; sem o selo, o
      // cartao mudava de forma e o bloco ficava sem dizer o que e.
      const cabecalho = this._element("div", "unit-card-kpis-head");
      cabecalho.append(this._element("span", "tag tag-log", "Projeção"));
      // Sem medicao nao ha projecao: o numero que existe para essa unidade e
      // a fatura anterior repetida, e ele mora na tela da unidade, com a
      // conta explicada. Aqui ficam os tracos — que, junto do "Sem medicao"
      // la em cima, dizem por si que falta sensor.
      const semMedicao = snapshot.measured === false;
      const previsao = semMedicao ? null : prediction;
      kpis.append(
        cabecalho,
        this._unitCardKpi(
          "Previsão do ciclo",
          // Uma casa decimal: a previsao vem com a precisao do calculo, e
          // "266,643 kWh" sugere uma exatidao que uma projecao nao tem.
          previsao
            ? this._valueWithUnit(previsao.predicted_value, previsao.unit, 1)
            : "—",
        ),
        this._renderUnitCardCost(unit, { semMedicao }),
        // Recebido e saldo so existem onde alguma unidade gera: sem geracao
        // nao ha credito a receber, e a linha seria dois tracos soltos. Com
        // geracao ela fica em todas as unidades — inclusive na que nao tem
        // sensor, onde o traco diz "falta medicao", nao "nao se aplica".
        ...(this._hasGeneration ? [
          // O mesmo traco que separa o total do ciclo destes KPIs, pela mesma
          // razao: acima e o ciclo inteiro, abaixo e so hoje.
          this._element("div", "unit-card-kpi-divider"),
          ...this._renderUnitCardDay(unit),
        ] : []),
      );
      body.append(kpis);

      const rodape = this._element("div", "unit-card-footer");
      const curto = (valor) => {
        const texto = this._formatDate(valor);
        // So dia/mes no inicio: o ano aparece uma vez, no fim, onde faz falta.
        const partes = /^(\d{2}\/\d{2})\/\d{4}/.exec(texto ?? "");
        return partes ? partes[1] : texto ?? "—";
      };
      const longo = (valor) => {
        const texto = this._formatDate(valor);
        const partes = /^(\d{2}\/\d{2}\/\d{4})/.exec(texto ?? "");
        return partes ? partes[1] : texto ?? "—";
      };
      rodape.append(
        this._element("span", "num", `${curto(cycle.current_start)} → ${longo(cycle.expected_next_reading)}`),
        this._element("span", "unit-card-footer-sep", "|"),
        this._element("span", "unit-card-footer-label", "Próx. leitura:"),
        this._element("span", "num unit-card-footer-strong", longo(cycle.expected_next_reading)),
      );
      body.append(rodape);

      const action = this._button("Abrir análise", "open-unit", "unit-card-action");
      action.dataset.unit = unit;
      body.append(action);

      article.append(media, body);
      if (loading) article.append(this._element("small", "unit-card-note", "Atualizando…"));
      if (error) article.append(this._element("small", "unit-card-note error-text", error));
      return article;
    }

    _renderUnitCardToday(unit, metric) {
      const caixa = this._element("div", "unit-card-today");
      const dados = this._dailyBalance.get(unit)?.energy;
      // O consumo do dia vem do mesmo calculo que produziu o recebido e o
      // saldo: pegar um da serie do historico e os outros do saldo diario
      // abriria a chance de a subtracao na tela nao fechar.
      const valor = dados?.consumed_kwh;
      caixa.append(
        this._element("span", "unit-card-today-label", "Hoje"),
        this._element(
          "span",
          "num unit-card-today-value",
          valor === null || valor === undefined
            ? "—"
            : `${this._formatNumber(valor, 1, 1)} ${this._displayUnit(metric?.unit) ?? "kWh"}`,
        ),
      );
      return caixa;
    }

    // Recebido e saldo do dia, lado a lado. O saldo e a subtracao dos dois, e
    // o sinal e o recado: positivo, o credito do dia cobriu o consumo do dia.
    _renderUnitCardDay(unit) {
      const dados = this._dailyBalance.get(unit)?.energy;
      const carregando = this._dailyBalanceInFlight.has(unit);
      const kwh = (valor, sinal = false) => {
        if (valor === null || valor === undefined) return carregando ? "…" : "—";
        const prefixo = sinal && valor > 0 ? "+" : "";
        return `${prefixo}${this._formatNumber(valor, 1, 1)} kWh`;
      };

      // A geradora nao recebe rateio de ninguem: "recebido" e "saldo do dia"
      // seriam sempre o proprio 1% dela contra o proprio consumo, o que nao
      // responde nada. O que importa nela e quanto produziu e quanto mandou
      // para a rede — e e isso que estes dois campos passam a mostrar.
      if (unit === this._generator) {
        return [
          this._unitCardKpi("Geração hoje", kwh(dados?.generator_generation_kwh)),
          this._unitCardKpi("Exportação hoje", kwh(dados?.generator_export_kwh)),
        ];
      }
      const saldo = dados?.balance_kwh;
      const tom = saldo === null || saldo === undefined
        ? "" : saldo >= 0 ? "positive" : "negative";

      const recebido = this._unitCardKpi(
        "Recebido hoje", kwh(dados?.received_kwh),
      );

      const item = this._element("div", `unit-card-kpi saldo ${tom}`);
      item.append(this._element("span", "unit-card-kpi-label", "Saldo do dia"));
      const linha = this._element("div", "unit-card-kpi-value");
      linha.append(this._element("span", "num unit-card-saldo", kwh(saldo, true)));
      item.append(linha);
      item.title = "Recebido de rateio hoje menos o consumido hoje. "
        + "A compensação oficial é apurada por ciclo, não por dia.";
      return [recebido, item];
    }

    // A seta compara com o mesmo trecho do ciclo passado. Para consumo, subir e
    // ruim e descer e bom — por isso a cor segue o significado operacional, nao
    // o sinal do numero.
    _renderUnitCardTrend(unit, metric, cycle) {
      const dados = this._cycleTrend.get(unit);
      if (!dados || !(dados.anterior > 0)) return null;
      const valor = ((dados.atual - dados.anterior) / dados.anterior) * 100;
      const subindo = valor > 0.05;
      const descendo = valor < -0.05;
      const caixa = this._element(
        "div", `unit-card-trend ${subindo ? "up" : descendo ? "down" : "flat"}`,
      );
      caixa.append(
        this._element("span", "unit-card-trend-arrow", subindo ? "▲" : descendo ? "▼" : "—"),
        this._element("span", "num", `${this._formatNumber(Math.abs(valor), 1, 1)}%`),
      );
      const dias = Number.isFinite(dados.dias)
        ? `${this._formatNumber(dados.dias, 2, 2)} dias`
        : "o mesmo trecho";
      caixa.title = `${this._formatNumber(dados.atual, 3, 3)} kWh em ${dias}, `
        + `contra ${this._formatNumber(dados.anterior, 3, 3)} kWh no mesmo trecho `
        + "do ciclo anterior. Mesmo cálculo do gráfico Comparação, modo Ciclo.";
      return caixa;
    }

    // O preco vem pronto do backend, com a composicao e os avisos que o proprio
    // calculo declarou. O tooltip mostra essa composicao: um numero de dinheiro
    // sem a conta atras dele nao se confere.
    _renderUnitCardCost(unit, { semMedicao = false } = {}) {
      const dados = semMedicao ? null : this._cycleCost.get(unit);
      const carregando = this._cycleCostInFlight.has(unit);
      const total = dados?.money?.total_amount;
      const item = this._element("div", "unit-card-kpi");
      item.append(this._element(
        "span", "unit-card-kpi-label", "Preço estimado s/ SCEE",
      ));
      const linha = this._element("div", "unit-card-kpi-value");
      linha.append(this._element(
        "span",
        "num",
        total === null || total === undefined
          ? (carregando ? "…" : "—")
          : this._formatCurrency(Number(total), dados.currency),
      ));
      item.append(linha);
      const explicacao = this._cycleCostExplanation(dados);
      if (explicacao) item.title = explicacao;
      return item;
    }

    _cycleCostExplanation(dados) {
      if (!dados) return "";
      const energia = dados.energy ?? {};
      const dinheiro = dados.money ?? {};
      const linhas = [];
      if (energia.billable_kwh !== null && energia.billable_kwh !== undefined) {
        linhas.push(
          `Energia faturável: ${this._formatNumber(Number(energia.billable_kwh), 1, 1)} kWh`
          + (energia.availability_floor_applied
            ? ` (piso de disponibilidade de ${energia.minimum_billable_kwh} kWh)` : ""),
        );
      }
      if (dinheiro.tariff_with_taxes) {
        linhas.push(
          `Tarifa com impostos: ${dinheiro.tariff_with_taxes}`
          + (dinheiro.tariff_source ? ` (fatura ${dinheiro.tariff_source})` : ""),
        );
      }
      if (dinheiro.energy_amount) linhas.push(`Energia: ${dinheiro.energy_amount}`);
      if (dinheiro.cip_cosip_amount) linhas.push(`CIP/COSIP: ${dinheiro.cip_cosip_amount}`);
      const avisos = Array.isArray(dados.warnings) ? dados.warnings : [];
      const traduzidos = avisos
        .map((codigo) => ({
          compensation_not_projected: "não projeta crédito no ciclo aberto",
          excludes_tariff_flag: "não inclui bandeira tarifária",
          excludes_interest_and_fine: "não inclui juros nem multa",
          tariff_unavailable: "sem tarifa oficial disponível",
          cip_cosip_unavailable: "sem CIP/COSIP disponível",
          forecast_unavailable: "sem previsão de consumo",
          availability_floor_unavailable: "sem piso de disponibilidade configurado",
        })[codigo])
        .filter(Boolean);
      if (traduzidos.length) linhas.push(`Ressalvas: ${traduzidos.join("; ")}.`);
      return linhas.join("\n");
    }

    // Saldo e credito so existem na fatura fechada: sao numeros que a Equatorial
    // publica, nao medicoes que se acompanham ao vivo.
    _cycleProgressRatio(metric, prediction) {
      const consumido = Number(metric?.value);
      const previsto = Number(prediction?.predicted_value);
      if (!Number.isFinite(consumido) || !Number.isFinite(previsto) || previsto <= 0) {
        return null;
      }
      return (consumido / previsto) * 100;
    }

    // Dias decorridos e duracao do ciclo, das mesmas datas que o rodape do
    // cartao ja mostra. Decorridos e o que fechou: no dia da leitura ainda nao
    // se contou o ultimo dia inteiro.
    // O ciclo que ja encerrou pela data e ainda espera a fatura oficial.
    _awaitingInvoiceCycle(unit) {
      const catalogo = this._cyclesCatalog(unit);
      if (!Array.isArray(catalogo)) return null;
      return catalogo.find((item) => item?.status === "provisional") ?? null;
    }

    _cycleElapsedDays(cycle) {
      const inicio = Date.parse(cycle?.current_start ?? "");
      const fim = Date.parse(cycle?.expected_next_reading ?? "");
      if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) {
        return null;
      }
      const dia = 86400000;
      const total = Math.round((fim - inicio) / dia);
      if (total <= 0) return null;
      const decorridos = Math.min(
        total, Math.max(0, Math.floor((Date.now() - inicio) / dia)),
      );
      return { decorridos, total };
    }

    _unitCardKpi(label, value, hint = null) {
      const item = this._element("div", "unit-card-kpi");
      item.append(this._element("span", "unit-card-kpi-label", label));
      const linha = this._element("div", "unit-card-kpi-value");
      linha.append(this._element("span", "num", value));
      if (hint) linha.append(this._element("span", "unit-card-kpi-hint", hint));
      item.append(linha);
      return item;
    }

    _renderHistory() {
      const section = this._element("section", "panel history-panel");
      section.dataset.historySection = "";
      const billingOnly = this._unitIsBillingOnly();
      const header = this._element("header", "history-header");
      const heading = this._element("div", "history-heading");
      heading.append(this._element(
        "h3", "section-title", billingOnly ? "Histórico das faturas" : "Análise da curva",
      ));
      const modeSelector = this._element("div", "history-mode-selector");
      modeSelector.setAttribute("role", "group");
      modeSelector.setAttribute("aria-label", "Modo do histórico");
      for (const [mode, definition] of Object.entries(HISTORY_MODES)) {
        // Sem sensor nao ha curva de dia nem de mes: os botoes somem em vez
        // de ficarem apagados. Ano e ciclo saem das faturas. Quando a unidade
        // ganha sensor, deixa de ser "so fatura" e os quatro voltam.
        if (billingOnly && (mode === "day" || mode === "month")) continue;
        const button = this._button(
          definition.label,
          "history-mode",
          "history-mode-button",
        );
        button.dataset.mode = mode;
        button.setAttribute("aria-pressed", String(mode === this._historyMode));
        if (mode === "cycle") {
          button.setAttribute("aria-label", "Exibir histórico por ciclo de faturamento");
        }
        modeSelector.append(button);
      }
      heading.append(modeSelector);

      let controls = null;
      if (this._historyMode === "cycle") {
        controls = this._renderHistoryCycleControl();
      } else {
        controls = this._element("div", "history-controls");
        controls.setAttribute("role", "group");
        const controlLabels = {
          day: ["Selecionar dia do histórico", "Dia anterior", "Data do histórico", "Dia seguinte"],
          month: ["Selecionar mês do histórico", "Mês anterior", "Mês do histórico", "Mês seguinte"],
          year: ["Selecionar ano do histórico", "Ano anterior", "Ano do histórico", "Ano seguinte"],
        }[this._historyMode];
        controls.setAttribute("aria-label", controlLabels[0]);
        const previous = this._button("‹", "history-previous", "history-date-button");
        previous.setAttribute("aria-label", controlLabels[1]);
        const input = this._element("input", "history-date-input");
        input.type = this._historyMode === "year"
          ? "number"
          : this._historyMode === "day" ? "date" : "month";
        input.value = this._currentHistoryReference();
        input.max = this._historyReferenceDefinition().current();
        if (this._historyMode === "year") {
          input.min = "1000";
          input.step = "1";
          input.inputMode = "numeric";
        }
        input.dataset.action = "history-date";
        input.setAttribute("aria-label", controlLabels[2]);
        const next = this._button("›", "history-next", "history-date-button");
        next.setAttribute("aria-label", controlLabels[3]);
        next.disabled = this._currentHistoryReference() >= input.max;
        controls.append(previous, input, next);
      }
      header.append(heading);
      if (controls) header.append(controls);
      section.append(header);

      if (billingOnly && this._historyMode === "year") {
        if (!Array.isArray(this._cyclesCatalog())) {
          section.append(this._historyStatus("Carregando faturas…", "loading"));
          return section;
        }
        this._appendBillingOnlyYear(section);
        return section;
      }

      if (this._historyMode === "cycle") {
        const catalogLoading = this._cyclesCatalogInFlight.has(this._selectedUnit);
        const catalogError = this._cyclesCatalogErrors.get(this._selectedUnit);
        const cycles = this._cyclesCatalog();
        if (!this._historyVisible || (cycles === null && catalogLoading)) {
          section.append(this._historyStatus("Carregando ciclos de faturamento…", "loading"));
          return section;
        }
        if (cycles === null && catalogError) {
          section.append(this._renderHistoryError(catalogError));
          return section;
        }
        if (!Array.isArray(cycles)) {
          section.append(this._historyStatus("Carregando ciclos de faturamento…", "loading"));
          return section;
        }
        if (cycles.length === 0) {
          section.append(this._historyStatus("Nenhum ciclo de faturamento disponível.", "compact"));
          return section;
        }
        if (billingOnly) {
          this._appendBillingOnlyCycles(section);
          return section;
        }
        const selectedCycle = this._selectedHistoryCycle();
        if (!selectedCycle) {
          section.append(this._historyStatus("Carregando ciclos de faturamento…", "loading"));
          return section;
        }
        if (!this._cycleSupportsHistory(selectedCycle)) {
          this._appendHistoryEmptyState(section, "cycle");
          return section;
        }
        const openState = this._openCycleState(selectedCycle);
        const provisionalState = this._provisionalCycleState(selectedCycle);
        const operationalState = openState ?? provisionalState;
        if (operationalState) {
          section.append(this._element(
            "p",
            "history-cycle-open-state",
            operationalState,
          ));
        }
      }

      const key = this._historyKey();
      const data = this._historyData(key);
      const loading = this._historyInFlight.has(key);
      const error = this._historyErrors.get(key);

      if (!this._historyVisible || (!data && loading)) {
        section.append(this._historyStatus("Carregando histórico…", "loading"));
        return section;
      }
      if (!data && error) {
        section.append(this._renderHistoryError(error));
        return section;
      }
      if (!data) {
        section.append(this._historyStatus("Carregando histórico…", "loading"));
        return section;
      }
      if (data.available === false) {
        if (error) {
          this._cleanupHistoryChart();
          section.append(this._renderHistoryError(error, true));
        } else {
          this._appendHistoryEmptyState(section, data.mode);
        }
        return section;
      }
      if (!Array.isArray(data.series)) {
        this._cleanupHistoryChart();
        section.append(this._historyStatus(
          "Nenhum dado histórico disponível para o período selecionado.",
        ));
        return section;
      }
      if (data.series.length === 0 || !this._historyHasNumericData(data)) {
        if (error) {
          this._cleanupHistoryChart();
          section.append(this._renderHistoryError(error, true));
        } else {
          this._appendHistoryEmptyState(section, data.mode);
        }
        return section;
      }
      if (!this._historyHasEnergyVariation(data)) {
        this._cleanupHistoryChart();
        section.append(error
          ? this._renderHistoryError(error, true)
          : this._historyStatus(this._historyNoVariationMessage(data.mode)));
        return section;
      }
      if (error) section.append(this._renderHistoryError(error, true));

      if (loading) {
        section.append(this._element("p", "history-refreshing", "Atualizando…"));
      }
      if (this._chartModuleError) {
        section.append(this._renderHistoryError(this._chartModuleError));
        return section;
      }

      const frame = this._element("div", "history-chart-frame");
      const chart = this._element("div", "history-chart");
      chart.dataset.historyChart = "";
      chart.setAttribute("role", "img");
      chart.setAttribute(
        "aria-label",
        `Energia ${{ day: "horária", month: "diária", year: "mensal", cycle: "diária do ciclo" }[data.mode]} de ${data.unit_id ?? this._selectedUnit} em ${this._currentHistoryReference()}`,
      );
      frame.append(chart);
      section.append(frame);

      const hasIncomplete = data.series.some((series) => (
        series.points?.some((point) => point.complete === false)
      ));
      if (hasIncomplete) {
        section.append(this._element(
          "p",
          "history-progress",
          {
            day: "Dia em andamento",
            month: "Mês em andamento",
            year: "Ano em andamento",
            cycle: "Dia em andamento",
          }[data.mode],
        ));
      }
      section.append(this._renderHistoryTotals(data));

      if (data.series.some((series) => Number(series.issue_count) > 0)) {
        section.append(this._element(
          "p",
          "history-issues",
          "Há ocorrências de medição neste período.",
        ));
      }
      return section;
    }

    // Um ano de faturas: uma barra por referencia que tem fatura. Mes sem
    // fatura nao vira barra zerada — ausencia de dado nao e zero.
    _billingOnlyYearData(unit = this._selectedUnit) {
      if (!this._unitIsBillingOnly(unit)) return null;
      const year = Number(this._historyReferences.year ?? this._currentHistoryReference());
      const cycles = (this._cyclesCatalog(unit) ?? [])
        .filter((cycle) => (
          this._cycleHasOfficialConsumption(cycle)
          && this._billingReferenceParts(cycle.billing_reference)?.year === year
        ))
        .sort((a, b) => (
          this._billingReferenceParts(a.billing_reference).month
          - this._billingReferenceParts(b.billing_reference).month
        ));
      const points = cycles.map((cycle) => {
        const numericValue = cycle.official_consumption?.value;
        return {
          start: cycle.billing_reference,
          end: cycle.billing_reference,
          value: typeof numericValue === "number" && Number.isFinite(numericValue)
            ? numericValue : null,
          complete: true,
          issues: [],
          cycle,
        };
      });
      const values = points.map((point) => point.value).filter((value) => value !== null);
      return {
        billingOnly: true,
        available: true,
        unit_id: unit,
        mode: "year",
        reference: String(year),
        series: [{
          logical_id: `${unit}.official_year_consumption`,
          label: "Consumo oficial no ano",
          unit: "kWh",
          total: values.length ? values.reduce((soma, value) => soma + value, 0) : null,
          points,
        }],
      };
    }

    _billingOnlyHistoryKey() {
      return this._historyMode === "year"
        ? `${this._selectedUnit}|billing_only_year|${this._historyReferences.year ?? this._currentHistoryReference()}`
        : `${this._selectedUnit}|billing_only|${this._billingReferenceFor()}`;
    }

    _billingOnlyHistoryData() {
      return this._historyMode === "year"
        ? this._billingOnlyYearData()
        : this._billingOnlyChartData();
    }

    _appendBillingOnlyYear(section) {
      const data = this._billingOnlyYearData();
      if (!data || !data.series[0].points.some((point) => point.value !== null)) {
        section.append(this._historyStatus(
          "Nenhuma fatura lida neste ano.",
          "compact",
        ));
        return;
      }
      section.append(this._element(
        "p", "history-cycle-reference", `Faturas de ${data.reference}`,
      ));
      if (this._chartModuleError) {
        section.append(this._renderHistoryError(this._chartModuleError));
        return;
      }
      const frame = this._element("div", "history-chart-frame");
      const chart = this._element("div", "history-chart");
      chart.dataset.historyChart = "";
      chart.setAttribute("role", "img");
      chart.setAttribute(
        "aria-label",
        `Consumo oficial de ${this._selectedUnit} em ${data.reference}`,
      );
      frame.append(chart);
      section.append(frame, this._renderHistoryTotals(data));
    }

    _appendBillingOnlyCycles(section) {
      const data = this._billingOnlyChartData();
      if (!data || !data.series[0].points.some((point) => point.value !== null)) {
        section.append(this._historyStatus(
          "Consumo oficial indisponível para esta referência.",
          "compact",
        ));
        return;
      }
      section.append(this._element(
        "p", "history-cycle-reference", `Referência fechada: ${data.reference}`,
      ));
      if (this._chartModuleError) {
        section.append(this._renderHistoryError(this._chartModuleError));
        return;
      }
      const frame = this._element("div", "history-chart-frame");
      const chart = this._element("div", "history-chart");
      chart.dataset.historyChart = "";
      chart.setAttribute("role", "img");
      chart.setAttribute(
        "aria-label",
        `Consumo oficial de ${this._selectedUnit} em ${data.reference}`,
      );
      frame.append(chart);
      section.append(frame, this._renderHistoryTotals(data));
    }

    _historyStatus(message, modifier = "") {
      const status = this._element(
        "div",
        `history-state ${modifier}`.trim(),
        message,
      );
      status.setAttribute("aria-live", "polite");
      return status;
    }

    _appendHistoryEmptyState(section, mode = this._historyMode) {
      this._cleanupHistoryChart();
      section.append(this._historyStatus(this._historyEmptyMessage(mode)));
    }

    _renderCycleUnavailable(cycle) {
      const state = this._element("div", "history-state history-cycle-unavailable");
      state.setAttribute("aria-live", "polite");
      state.append(this._element("strong", "", `CICLO — ${cycle.billing_reference ?? "—"}`));
      const official = cycle.official_consumption ?? {};
      const numericValue = Number(official.value);
      const hasOfficial = official.classification === "official"
        && official.value !== null
        && official.value !== undefined
        && Number.isFinite(numericValue);
      const officialValue = hasOfficial
        ? `${new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numericValue)} ${official.unit ?? "kWh"}`
        : "Consumo oficial indisponível";
      const summary = this._element("div", "history-cycle-official");
      summary.append(
        this._element("span", "", "Consumo oficial da fatura"),
        this._element("strong", "", officialValue),
      );
      state.append(summary);
      if (hasOfficial) {
        state.append(
          this._element("small", "", `Fonte: ${this._distributorLabel()}`),
          this._element("small", "", "Classificação: Oficial"),
        );
      }
      state.append(this._element(
        "p",
        "",
        cycle.capability === "billing_only"
          ? "Curva diária não disponível para esta unidade."
          : "Histórico operacional indisponível para este ciclo.",
      ));
      return state;
    }

    _renderHistoryError(message, compact = false) {
      const error = this._element(
        "div",
        `history-state history-error${compact ? " compact" : ""}`,
      );
      error.setAttribute("aria-live", "polite");
      error.append(
        this._element("span", "", message),
        this._button("Tentar novamente", "history-retry"),
      );
      return error;
    }

    _renderHistoryTotals(data) {
      const totals = this._element("div", "history-totals");
      totals.dataset.historyTotals = "";
      totals.setAttribute("aria-label", "Totais do período");
      const selection = data.series.length > 1 ? this._historyLegend(data) : null;
      for (const series of data.series) {
        if (selection && selection[series.label] === false) continue;
        const item = this._element("div", "history-total");
        item.append(
          this._element("span", "", series.label),
          this._element(
            "strong",
            "",
            series.total === null || series.total === undefined
              ? "Indisponível"
              : `${this._formatHistoryNumber(series.total)} kWh`,
          ),
        );
        totals.append(item);
      }
      return totals;
    }

    _updateHistoryTotals(data) {
      const current = this.shadowRoot.querySelector("[data-history-totals]");
      if (current) current.replaceWith(this._renderHistoryTotals(data));
    }

    _renderComparison() {
      const section = this._element("section", "panel comparison-panel");
      section.dataset.comparisonSection = "";
      const header = this._element("header", "comparison-header");
      const heading = this._element("div", "comparison-heading comparison-heading-left");
      heading.append(this._element("h3", "section-title", "Comparação"));
      const strategies = this._element("div", "history-mode-selector");
      strategies.setAttribute("role", "group");
      strategies.setAttribute("aria-label", "Estratégia da comparação");
      for (const [strategy, label] of [
        ["automatic", "Automática"],
        ["custom", "Personalizada"],
      ]) {
        const button = this._button(label, "comparison-strategy", "history-mode-button");
        button.dataset.strategy = strategy;
        button.setAttribute(
          "aria-pressed",
          String(strategy === this._comparisonStrategy),
        );
        strategies.append(button);
      }
      heading.append(strategies);
      const metrics = this._comparisonMetrics();
      if (metrics.length > 1) {
        const metric = this._element("select", "comparison-metric");
        metric.dataset.action = "comparison-metric";
        metric.setAttribute("aria-label", "Métrica da comparação");
        for (const definition of metrics) {
          const option = this._element("option", "", definition.label);
          option.value = definition.logicalId;
          option.selected = definition.logicalId === this._comparisonLogicalId();
          metric.append(option);
        }
        // Guardado para entrar com os demais, na mesma linha. No bloco do
        // titulo ele empurrava o resto para uma segunda linha.
        this._comparisonMetricControl = metric;
      }

      header.append(heading);
      if (this._comparisonStrategy === "automatic") {
        const controls = this._element("div", "history-controls comparison-controls");
        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", "Período da comparação");
        const mode = this._element("select", "comparison-metric");
        mode.dataset.action = "comparison-mode";
        mode.setAttribute("aria-label", "Tipo de período da comparação");
        for (const [value, label] of [
          ["day", "Dia"],
          ["rolling_days", "Últimos 7 dias"],
          ["month", "Mês"],
        ]) {
          const option = this._element("option", "", label);
          option.value = value;
          option.selected = value === this._comparisonMode;
          mode.append(option);
        }
        const previous = this._button("‹", "comparison-previous", "history-date-button");
        previous.setAttribute("aria-label", "Período anterior da comparação");
        const input = this._element("input", "history-date-input");
        input.type = this._comparisonMode === "month" ? "month" : "date";
        input.value = this._comparisonReferences[this._comparisonMode];
        input.max = this._comparisonMode === "month"
          ? this._localMonthValue(new Date())
          : this._localDateValue(new Date());
        input.dataset.action = "comparison-reference";
        input.setAttribute(
          "aria-label",
          this._comparisonMode === "rolling_days" ? "Data final da comparação" : "Data da comparação",
        );
        const next = this._button("›", "comparison-next", "history-date-button");
        next.setAttribute("aria-label", "Período seguinte da comparação");
        next.disabled = this._comparisonReferences[this._comparisonMode] >= input.max;
        const referenceGroup = this._element("div", "comparison-reference-group");
        referenceGroup.append(previous, input, next);
        // Grandeza, tipo de periodo e navegacao, nesta ordem: do que se mede,
        // para o recorte, para qual recorte.
        if (this._comparisonMetricControl) {
          controls.append(this._comparisonMetricControl);
        }
        controls.append(mode, referenceGroup);
        header.append(controls);
      } else {
        const controls = this._element("div", "history-controls comparison-controls");
        if (this._comparisonMetricControl) {
          controls.append(this._comparisonMetricControl);
        }
        controls.append(this._renderComparisonCustomOptions());
        header.append(controls);
      }
      this._comparisonMetricControl = null;
      section.append(header);

      if (this._comparisonUnavailable()) {
        this._cleanupComparisonChart();
        section.append(this._historyStatus(
          "Comparação operacional indisponível para esta unidade.",
          "compact",
        ));
        return section;
      }

      if (this._comparisonStrategy === "custom") {
        section.append(this._renderComparisonCustomControls());
      }
      const resultContainer = this._element("div", "comparison-result");
      resultContainer.dataset.comparisonResult = "";
      section.append(resultContainer);

      const key = this._comparisonKey();
      const data = this._comparisonData(key);
      const loading = this._comparisonInFlight.has(key);
      const error = this._comparisonErrors.get(key);
      // O modo ciclo nao tem intervalo digitado — as janelas vem dos ciclos —
      // entao exigir um aqui deixava a area de resultado presa no aviso e a
      // comparacao nunca aparecia.
      if (this._comparisonStrategy === "custom"
        && this._comparisonCustomPeriodType !== "cycle"
        && !this._comparisonCustomRange) {
        if (error) resultContainer.append(this._renderComparisonError(error, true));
        resultContainer.append(this._historyStatus(
          "Escolha os dois períodos e selecione Comparar.",
          "compact",
        ));
        return section;
      }
      if (!data && loading) {
        resultContainer.append(this._historyStatus("Carregando comparação…", "loading"));
        return section;
      }
      if (!data && error) {
        resultContainer.append(this._renderComparisonError(error));
        return section;
      }
      if (!data) {
        resultContainer.append(this._historyStatus(
          this._comparisonInFlight.size > 0
            ? "Carregando comparação…"
            : "Selecione Comparar para carregar o período.",
          this._comparisonInFlight.size > 0 ? "loading" : "compact",
        ));
        return section;
      }
      if (error) resultContainer.append(this._renderComparisonError(error, true));
      if (loading) {
        resultContainer.append(this._element("p", "history-refreshing", "Atualizando…"));
      }

      const baseHasData = this._comparisonSeriesHasNumericData(data.base.series);
      const comparisonHasData = this._comparisonSeriesHasNumericData(
        data.comparison.series,
      );
      const baseHasVariation = this._comparisonSeriesHasVariation(data.base.series);
      const comparisonHasVariation = this._comparisonSeriesHasVariation(
        data.comparison.series,
      );
      const alignment = {
        equivalent_elapsed: "Períodos equivalentes até o momento",
        full_periods: {
          day: "Dias completos",
          rolling_days: "Períodos completos",
          month: "Meses completos",
        }[data.mode] ?? "Períodos completos",
        custom_equal_duration: "Períodos com duração equivalente",
        custom_different_duration: "Períodos com durações diferentes",
      }[data.alignment] ?? "Comparação de períodos";
      // O tipo de alinhamento sai da tela: e uma informacao sobre COMO os dois
      // recortes foram formados, nao sobre o resultado. Vai para o rotulo de
      // acessibilidade do bloco de totais, onde continua disponivel para quem
      // precisar sem ocupar uma linha do painel.
      //
      // O aviso de duracoes diferentes fica: aquele muda a leitura do numero,
      // e nao pode depender de o operador procurar.
      if (data.alignment === "custom_different_duration") {
        resultContainer.append(this._element(
          "p",
          "comparison-duration-warning",
          "Os totais representam janelas de durações diferentes.",
        ));
      }

      if (!baseHasData && !comparisonHasData) {
        this._cleanupComparisonChart();
        resultContainer.append(this._historyStatus(
          "Sem dados de medição disponíveis para os períodos comparados.",
        ));
        resultContainer.append(this._renderComparisonTotals(data, alignment));
        return section;
      }
      if (
        baseHasData
        && comparisonHasData
        && !baseHasVariation
        && !comparisonHasVariation
      ) {
        this._cleanupComparisonChart();
        resultContainer.append(this._historyStatus(
          "Nenhuma variação de energia registrada nos períodos comparados.",
        ));
        resultContainer.append(this._renderComparisonTotals(data, alignment));
        return section;
      }
      if (this._chartModuleError) {
        resultContainer.append(this._renderComparisonError(this._chartModuleError));
        resultContainer.append(this._renderComparisonTotals(data, alignment));
        return section;
      }

      const frame = this._element("div", "history-chart-frame comparison-chart-frame");
      const chart = this._element("div", "history-chart comparison-chart");
      chart.dataset.comparisonChart = "";
      chart.setAttribute("role", "img");
      chart.setAttribute(
        "aria-label",
        `${data.base.series.label}: ${this._comparisonSideLabel(data.base)} comparado com ${this._comparisonSideLabel(data.comparison)}`,
      );
      frame.append(chart);
      resultContainer.append(frame, this._renderComparisonTotals(data, alignment));
      // Mesmo aviso, mesma posicao e mesma classe da Analise da curva: e a
      // mesma condicao nas duas telas, e um sinal de qualidade nao deveria
      // aparecer de um jeito num painel e de outro no vizinho.
      if ([data.comparison, data.base].some(
        (side) => Number(side.series.issue_count) > 0,
      )) {
        resultContainer.append(this._element(
          "p",
          "history-issues",
          "Há ocorrências de medição neste período.",
        ));
      }
      return section;
    }

    _renderComparisonCustomOptions() {
      const options = this._element("div", "comparison-custom-options comparison-heading-right");
      options.dataset.comparisonCustomOptions = "";
      const optionDefinitions = [
        [
          "Tipo",
          "comparison-period-type",
          [["day", "Dia"], ["range", "Intervalo"], ["cycle", "Ciclo"]],
          this._comparisonCustomPeriodType,
        ],
        [
          "Detalhamento",
          "comparison-resolution",
          this._comparisonCustomPeriodType === "day"
            ? [["hour", "Horário"]]
            : [["day", "Diário"], ["hour", "Horário"]],
          this._comparisonCustomResolution,
        ],
      ];
      for (const [label, action, values, selected] of optionDefinitions) {
        const control = this._element("div", "comparison-custom-option");
        control.append(this._element("span", "", label));
        const choices = this._element("div", "comparison-custom-choice");
        for (const [value, text] of values) {
          if (action === "comparison-resolution"
            && this._comparisonCustomPeriodType === "cycle" && value === "hour") {
            continue;
          }
          if (action === "comparison-resolution" && this._comparisonCustomPeriodType === "day") {
            const fixed = this._element("span", "history-mode-button comparison-custom-fixed", text);
            fixed.setAttribute("aria-label", "Comparações de dia utilizam detalhamento horário.");
            fixed.setAttribute("aria-pressed", "true");
            fixed.title = "Comparações de dia utilizam detalhamento horário.";
            choices.append(fixed);
            continue;
          }
          const button = this._button(text, action, "history-mode-button");
          if (action === "comparison-period-type") button.dataset.periodType = value;
          else button.dataset.resolution = value;
          button.setAttribute("aria-pressed", String(selected === value));
          choices.append(button);
        }
        control.append(choices);
        options.append(control);
      }
      return options;
    }

    _renderComparisonCustomControls() {
      const form = this._element("div", "comparison-custom-form");
      form.dataset.comparisonCustomForm = "";
      if (this._comparisonCustomPeriodType === "cycle") {
        return this._renderComparisonCycleControls(form);
      }
      const maximum = this._localDateValue(new Date());
      const definitions = [
        ["Período A", "baseStart", "baseEnd"],
        ["Período B", "comparisonStart", "comparisonEnd"],
      ];
      for (const [label, startField, endField] of definitions) {
        const period = this._element(
          "fieldset",
          this._comparisonCustomPeriodType === "day"
            ? "comparison-custom-period comparison-custom-period-single"
            : "comparison-custom-period",
        );
        period.append(this._element("legend", "", label));
        const fields = this._comparisonCustomPeriodType === "day"
          ? [[startField, "Data"]]
          : [[startField, "Data inicial"], [endField, "Data final"]];
        for (const [field, fieldLabel] of fields) {
          const wrapper = this._element("label", "comparison-custom-field");
          wrapper.append(this._element("span", "", fieldLabel));
          const input = this._element("input", "history-date-input");
          input.type = "date";
          input.max = maximum;
          input.value = this._comparisonCustomDraft[field];
          input.dataset.action = "comparison-custom-date";
          input.dataset.field = field;
          wrapper.append(input);
          period.append(wrapper);
        }
        form.append(period);
      }
      const validation = this._customComparisonValidation();
      const message = this._element("p", "comparison-custom-validation", validation);
      message.dataset.comparisonCustomValidation = "";
      message.hidden = !validation;
      const apply = this._button("Comparar", "comparison-apply", "button");
      apply.disabled = Boolean(validation);
      const submit = this._element("div", "comparison-custom-submit");
      submit.append(apply);
      form.append(message, submit);
      return form;
    }

    // O modo ciclo nao pede datas: as duas janelas saem dos proprios ciclos de
    // faturamento, que ja tem inicio e fim definidos. O unico ajuste possivel
    // e onde cortar — por padrao agora, e e assim que a comparacao responde
    // "estou gastando mais que no ciclo passado ATE ESTE PONTO?".
    _renderComparisonCycleControls(form) {
      const bloco = this._element("fieldset", "comparison-custom-period comparison-cycle");
      bloco.append(this._element("legend", "", "Ciclo atual × ciclo anterior"));
      const inicio = this._comparisonCycleStart();
      bloco.append(this._element(
        "p",
        "comparison-cycle-note",
        "As duas janelas começam no início de cada ciclo e têm o mesmo tempo "
        + "decorrido. Sem corte informado, vale o instante atual."
        // O limite nao pode ficar so no atributo do campo: um corte anterior
        // ao ciclo atual e recusado, e o motivo precisa estar escrito.
        + (inicio
          ? ` O corte precisa cair dentro do ciclo atual, aberto em ${
            this._formatHistoryCycleDay(inicio.toISOString())}.`
          : ""),
      ));

      const campo = this._element("label", "comparison-custom-field");
      campo.append(this._element("span", "", "Cortar em (opcional)"));
      const input = this._element("input", "history-date-input");
      input.type = "datetime-local";
      // O maximo e agora: uma janela que avanca sobre o futuro compararia
      // consumo registrado com consumo que ainda nao aconteceu.
      input.max = this._localDateTimeValue(new Date());
      // Um minuto depois do inicio, nao no inicio: o corte tem de ser
      // estritamente posterior, ou a janela do ciclo atual teria duracao zero
      // e nao haveria o que comparar.
      const inicioDoCiclo = this._comparisonCycleStart();
      if (inicioDoCiclo) {
        input.min = this._localDateTimeValue(
          new Date(inicioDoCiclo.getTime() + 60000),
        );
      }
      input.value = this._comparisonCycleCut;
      input.dataset.action = "comparison-cycle-cut";
      campo.append(input);
      // Campo e atalho na mesma linha: o botao desfaz o que o campo ao lado
      // faz, e numa linha propria parecia uma acao do bloco inteiro.
      const linha = this._element("div", "comparison-cycle-row");
      linha.append(campo);
      if (this._comparisonCycleCut) {
        linha.append(this._button(
          "Voltar para agora", "comparison-cycle-now", "button comparison-cycle-now",
        ));
      }
      bloco.append(linha);
      form.append(bloco);

      const apply = this._button("Comparar", "comparison-apply", "button");
      const submit = this._element("div", "comparison-custom-submit");
      submit.append(apply);
      form.append(submit);
      return form;
    }

    // Valor para <input type="datetime-local">: hora local, sem fuso, que e
    // exatamente o que o backend interpreta no fuso do modelo.
    _localDateTimeValue(date) {
      const dois = (valor) => String(valor).padStart(2, "0");
      return `${date.getFullYear()}-${dois(date.getMonth() + 1)}-${dois(date.getDate())}`
        + `T${dois(date.getHours())}:${dois(date.getMinutes())}`;
    }

    // Mesma escolha do backend: o ciclo em aberto e o "atual"; sem nenhum
    // aberto, o mais recente com periodo faz esse papel.
    _comparisonCycleStart(unit = this._selectedUnit) {
      const cycles = this._cyclesCatalog(unit);
      if (!Array.isArray(cycles)) return null;
      const comPeriodo = cycles.filter((item) => item?.period?.start);
      const atual = comPeriodo.find((item) => item.status !== "closed")
        ?? comPeriodo[0];
      if (!atual) return null;
      const inicio = new Date(atual.period.start);
      return Number.isNaN(inicio.getTime()) ? null : inicio;
    }

    _renderComparisonError(message, compact = false) {
      const error = this._element(
        "div",
        `history-state history-error${compact ? " compact" : ""}`,
      );
      error.setAttribute("aria-live", "polite");
      error.append(
        this._element("span", "", message),
        this._button("Tentar novamente", "comparison-retry"),
      );
      return error;
    }

    _renderComparisonTotals(data, alignment = "") {
      const totals = this._element("div", "comparison-totals");
      totals.setAttribute(
        "aria-label",
        alignment
          ? `Totais dos períodos comparados · ${alignment}`
          : "Totais dos períodos comparados",
      );
      // Mesma ordem do grafico: anterior a esquerda, atual a direita.
      for (const side of [data.comparison, data.base]) {
        const series = side.series;
        const hasData = this._comparisonSeriesHasNumericData(series);
        const hasVariation = this._comparisonSeriesHasVariation(series);
        // Nome e valor, exatamente como o total da Analise da curva. Aqui o
        // nome e o periodo, porque e ele que distingue um bloco do outro.
        //
        // Classificacao, duracao efetiva, estado da medicao e ocorrencias saem
        // do bloco mas nao se perdem: vao para o title. Sao ressalvas sobre o
        // numero, e um numero sem ressalva a vista precisa ao menos te-la a um
        // passe de mouse.
        const item = this._element("article", "comparison-total");
        item.append(
          this._element("span", "", this._comparisonSideLabel(side)),
          this._element(
            "strong",
            "comparison-value",
            series.total === null || series.total === undefined
              ? "Indisponível"
              : `${this._formatHistoryNumber(series.total)} ${series.unit}`,
          ),
        );
        const detalhes = [
          `${series.label} · ${this._translateClassification(series.classification)}`,
        ];
        if (typeof side.duration_days === "number" && Number.isFinite(side.duration_days)) {
          const durationLabel = side.duration_days === 1 ? "dia efetivo" : "dias efetivos";
          detalhes.push(
            `${this._formatNumber(side.duration_days, 2)} ${durationLabel}`,
          );
        }
        if (!hasData) detalhes.push("Sem dados de medição disponíveis.");
        else if (!hasVariation) detalhes.push("Nenhuma variação de energia registrada.");
        if (Number(series.issue_count) > 0) {
          detalhes.push(`Ocorrências de medição: ${series.issue_count}`);
        }
        item.title = detalhes.join("\n");
        totals.append(item);
      }
      return totals;
    }

    _renderIdentity(snapshot, cycle) {
      const section = this._element("section", "identity panel");
      const media = this._element("div", "photo-wrap");
      const placeholder = this._element("div", "photo-placeholder", "Sem foto");
      media.append(placeholder);

      if (snapshot.image) {
        const image = this._element("img", "photo");
        image.alt = snapshot.name ?? "Unidade";
        image.hidden = true;
        const showImage = () => {
          placeholder.hidden = true;
          image.hidden = false;
        };
        const showPlaceholder = () => {
          image.hidden = true;
          placeholder.hidden = false;
        };
        image.addEventListener("load", showImage);
        image.addEventListener("error", showPlaceholder);
        media.append(image);
        image.src = snapshot.image;
        if (image.complete) {
          if (image.naturalWidth > 0) {
            showImage();
          } else {
            showPlaceholder();
          }
        }
      }

      const copy = this._element("div", "identity-copy");
      copy.append(
        this._element("h2", "", snapshot.name ?? this._selectedUnit),
        this._element(
          "span",
          "measurement-mode",
          snapshot.measured ? "Com medição" : "Somente faturamento",
        ),
      );

      const cycleSummary = this._element("div", "identity-cycle");
      cycleSummary.append(
        this._field(
          "Estado do ciclo",
          this._translateCycleStatus(cycle?.status ?? "—"),
        ),
        this._field("Início atual", this._formatDate(cycle?.current_start)),
        this._field(
          "Próxima leitura",
          this._formatDate(cycle?.expected_next_reading),
        ),
      );
      section.append(media, copy, cycleSummary);
      return section;
    }

    // Unidade sem nenhuma leitura instantanea declarada nao ganha o quadro:
    // um painel inteiro para dizer "nao ha" e so espaco ocupado. Quando um
    // sensor de tensao, corrente ou potencia for apontado, ele aparece.
    _renderMeasurements(snapshot) {
      const measurements = Array.isArray(snapshot.measurements)
        ? snapshot.measurements
        : [];
      if (measurements.length === 0) return null;

      const section = this._element("section", "panel");
      section.dataset.measurementsPanel = "";
      section.append(this._element("h3", "section-title", "Medições instantâneas"));

      const grid = this._element("div", "metric-grid");
      for (const measurement of measurements) {
        const item = this._element("article", "metric");
        const available = measurement.available !== false
          && measurement.value !== null
          && measurement.value !== undefined;

        // Icone e rotulo na mesma linha: o icone identifica a grandeza de
        // relance, o rotulo a nomeia. Separados, o icone viraria enfeite.
        const cabeca = this._element("div", "metric-head");
        const icone = this._measurementIcon(measurement.quantity);
        if (icone) {
          const marca = this._element("ha-icon", "metric-icon");
          marca.setAttribute("icon", icone);
          cabeca.append(marca);
        }
        cabeca.append(
          this._element("span", "metric-label", measurement.label ?? "Medição"),
        );
        item.append(cabeca);

        // Numero e unidade em elementos proprios. Numa string unica os dois
        // tinham o mesmo peso, e quem le de longe le o numero, nao o "V".
        const valor = this._element("strong", "metric-value");
        if (available) {
          const digitos = measurement.quantity === "current" ? 2 : null;
          valor.append(this._element(
            "span",
            "metric-number",
            digitos === null
              ? this._formatNumber(measurement.value)
              : this._formatNumber(measurement.value, digitos, digitos),
          ));
          const unidade = this._displayUnit(measurement.unit);
          if (unidade) {
            valor.append(this._element("span", "metric-unit", unidade));
          }
        } else {
          valor.append(this._element("span", "metric-number", "Indisponível"));
        }
        item.append(valor);

        // Historico das ultimas 24 h, como o Recorder o gravou. So aparece
        // quando ha serie: uma unidade cujo sensor e novo nao tem 24 h de
        // estatistica, e uma linha reta ali mentiria sobre isso.
        const historico = this._instantStatistics(measurement.logical_id);
        if (historico) {
          const linha = this._renderSparkline(
            historico.points, measurement.logical_id,
          );
          if (linha) item.append(linha);
          const extremos = this._renderInstantRange(historico, measurement);
          if (extremos) item.append(extremos);
        }
        if (measurement.unit_mismatch === true) {
          item.append(
            this._element("span", "unit-mismatch", "⚠ Unidade divergente"),
            this._element(
              "span",
              "unit-mismatch-detail",
              this._unitMismatchDetail(measurement),
            ),
          );
        }
        if (measurement.validation_required === true) {
          item.append(this._element("span", "validation", "Validação pendente"));
          if (measurement.validation_note) {
            const note = this._element("details", "validation-note");
            note.append(
              this._element("summary", "", "Ver observação"),
              this._element("p", "", measurement.validation_note),
            );
            item.append(note);
          }
        }
        grid.append(item);
      }
      section.append(grid);
      queueMicrotask(() => {
        if (this.isConnected && this._selectedUnit) {
          this._loadInstantStatistics(this._selectedUnit);
        }
      });
      return section;
    }

    _instantStatistics(logicalId) {
      const dados = this._instantStats.get(this._selectedUnit);
      if (!dados || !Array.isArray(dados.measurements)) return null;
      return dados.measurements.find(
        (item) => item?.logical_id === logicalId,
      ) ?? null;
    }

    // Sparkline em SVG puro: sao cinco por unidade, e carregar uma biblioteca
    // de grafico para desenhar cinco polilinhas custaria mais que o desenho.
    _renderSparkline(points, logicalId) {
      if (!Array.isArray(points) || points.length < 2) return null;
      const valores = points
        .map((ponto) => (Array.isArray(ponto) ? ponto[1] : null))
        .map((valor) => (typeof valor === "number" && Number.isFinite(valor)
          ? valor : null));
      const presentes = valores.filter((valor) => valor !== null);
      if (presentes.length < 2) return null;
      const minimo = Math.min(...presentes);
      const maximo = Math.max(...presentes);
      const amplitude = maximo - minimo;
      const largura = 100;
      const altura = 24;
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", `0 0 ${largura} ${altura}`);
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("class", "metric-spark");
      svg.setAttribute("aria-hidden", "true");

      // Um gradiente por sparkline, com id proprio: cinco defs com o mesmo id
      // no mesmo shadow root fariam as cinco apontarem para a primeira.
      const gradienteId = "spark-"
        + String(logicalId ?? "sem-id").replace(/[^A-Za-z0-9_-]/g, "-");
      const defs = document.createElementNS(NS, "defs");
      const gradiente = document.createElementNS(NS, "linearGradient");
      gradiente.setAttribute("id", gradienteId);
      gradiente.setAttribute("x1", "0");
      gradiente.setAttribute("y1", "0");
      gradiente.setAttribute("x2", "0");
      gradiente.setAttribute("y2", "1");
      for (const [offset, classe] of [
        ["0%", "spark-stop-top"], ["100%", "spark-stop-bottom"],
      ]) {
        const parada = document.createElementNS(NS, "stop");
        parada.setAttribute("offset", offset);
        parada.setAttribute("class", classe);
        gradiente.append(parada);
      }
      defs.append(gradiente);
      svg.append(defs);

      const posicao = (indice, valor) => {
        const x = (indice / (valores.length - 1)) * largura;
        // Amplitude zero é linha reta no meio: dividir por ela daria NaN, e a
        // grandeza realmente não variou na janela.
        const y = amplitude > 0
          ? altura - ((valor - minimo) / amplitude) * altura
          : altura / 2;
        return [x, y];
      };

      // Lacunas quebram a linha em vez de serem atravessadas: o Recorder nao
      // gravou nada ali, e ligar os dois lados desenharia um dado inventado.
      // A area segue os mesmos trechos — preenchimento sobre lacuna sugeriria
      // medicao onde nao houve.
      let segmento = [];
      const fecha = () => {
        if (segmento.length >= 2) {
          const traco = segmento.map((par) => par.join(",")).join("L");
          const primeiro = segmento[0];
          const ultimo = segmento[segmento.length - 1];
          const area = document.createElementNS(NS, "path");
          area.setAttribute("class", "spark-area");
          area.setAttribute("fill", "url(#" + gradienteId + ")");
          area.setAttribute(
            "d",
            "M" + traco
            + "L" + ultimo[0] + "," + altura
            + "L" + primeiro[0] + "," + altura + "Z",
          );
          svg.append(area);
          const linha = document.createElementNS(NS, "polyline");
          linha.setAttribute(
            "points", segmento.map((par) => par.join(",")).join(" "),
          );
          svg.append(linha);
        }
        segmento = [];
      };
      valores.forEach((valor, indice) => {
        if (valor === null) { fecha(); return; }
        const [x, y] = posicao(indice, valor);
        segmento.push([x.toFixed(2), y.toFixed(2)]);
      });
      fecha();
      if (svg.querySelector("polyline") === null) return null;

      // O ponto final vai como elemento HTML, nao como <circle>: o SVG estica
      // sem manter proporcao para preencher a largura, e um circulo dentro
      // dele viraria elipse.
      const caixa = this._element("div", "metric-spark-wrap");
      caixa.append(svg);
      const ultimoIndice = valores.reduce(
        (achado, valor, indice) => (valor === null ? achado : indice), -1,
      );
      if (ultimoIndice >= 0) {
        const [x, y] = posicao(ultimoIndice, valores[ultimoIndice]);
        const ponto = this._element("span", "metric-spark-dot");
        ponto.style.left = (x / largura) * 100 + "%";
        ponto.style.top = (y / altura) * 100 + "%";
        caixa.append(ponto);
      }
      return caixa;
    }

    _renderInstantRange(historico, measurement) {
      if (historico.minimum === null || historico.minimum === undefined) return null;
      if (historico.maximum === null || historico.maximum === undefined) return null;
      const digitos = measurement.quantity === "current" ? 2 : null;
      const escreve = (valor) => {
        const numero = digitos === null
          ? this._formatNumber(valor)
          : this._formatNumber(valor, digitos, digitos);
        const unidade = this._displayUnit(historico.unit);
        return unidade ? `${numero} ${unidade}` : numero;
      };
      const faixa = this._element(
        "span",
        "metric-range",
        `Máx: ${escreve(historico.maximum)} | Mín: ${escreve(historico.minimum)}`,
      );
      // A janela fica no title e no proprio texto: um maximo sem o intervalo
      // a que pertence nao diz se e do dia ou do ciclo.
      faixa.append(this._element("span", "metric-range-window", INSTANT_STATISTICS_WINDOW));
      faixa.title = `Extremos registrados nas últimas ${INSTANT_STATISTICS_WINDOW}`;
      return faixa;
    }

    _renderCycle(cycleEnergy) {
      const section = this._element("section", "panel block");
      section.append(this._element("h3", "section-title", "Ciclo atual"));
      const cycle = cycleEnergy?.cycle;
      if (!cycle) {
        section.append(this._element("p", "empty", "Ciclo indisponível"));
        return section;
      }

      section.append(
        this._field(
          "Estado",
          this._translateCycleStatus(cycle.status ?? "—"),
        ),
        this._field("Início", this._formatDate(cycle.current_start)),
        this._field("Próxima leitura", this._formatDate(cycle.expected_next_reading)),
      );
      const metrics = cycleEnergy?.current_energy?.metrics;
      if (!Array.isArray(metrics) || metrics.length === 0) {
        section.append(this._element("p", "empty", "Energia do ciclo indisponível"));
        return section;
      }

      const list = this._element("div", "compact-list");
      for (const metric of metrics) {
        const row = this._element("div", "compact-row");
        const label = this._element("span", "");
        label.append(
          this._element("strong", "", metric.label ?? "Métrica"),
          this._element(
            "small",
            "",
            this._translateClassification(metric.classification ?? ""),
          ),
        );
        row.append(
          label,
          this._element(
            "b",
            "",
            this._valueWithUnit(metric.value, metric.unit),
          ),
        );
        list.append(row);
      }
      section.append(list);
      return section;
    }

    _renderBill(bill) {
      const section = this._element("section", "panel block");
      section.append(this._element("h3", "section-title", "Última fatura"));
      if (!bill) {
        section.append(this._element("p", "empty", "Fatura indisponível"));
        return section;
      }
      section.append(
        this._field("Referência", bill.reference ?? "—"),
        this._field(
          "Consumo",
          this._valueWithUnit(bill.consumption_kwh, "kWh"),
        ),
        this._field(
          "Valor total",
          this._formatCurrency(bill.total_amount, bill.currency),
        ),
        this._field("Leitura atual", this._formatDate(bill.reading_current)),
        this._field("Próxima leitura", this._formatDate(bill.next_reading)),
        this._field("Extração", bill.extraction_status ?? "—"),
      );
      return section;
    }

    // So para a unidade sem medicao: o que se espera da proxima conta,
    // repetindo o ritmo da ultima fatura. Nao e projecao — nao ha sensor para
    // projetar —, e por isso tem nome proprio, selo "Estimado" e a conta a
    // vista: quem le sabe exatamente de onde o numero saiu.
    _renderBillEstimate(snapshot, prediction) {
      const base = prediction?.basis;
      if (snapshot.measured !== false || !base) return null;
      const section = this._element("section", "panel bill-estimate");
      section.dataset.billEstimate = "";
      const head = this._element("div", "unit-card-metric-head");
      head.append(
        this._element("h3", "section-title", "Estimativa pela última fatura"),
        this._element("span", "tag tag-log", "Estimado"),
      );
      section.append(head);

      const valores = this._element("div", "bill-estimate-values");
      valores.append(this._field(
        "Consumo estimado do ciclo",
        this._valueWithUnit(prediction.predicted_value, prediction.unit, 1),
      ));
      // O preco sai do mesmo calculo que o cartao da Visao geral usa. Quem
      // abria a unidade direto nunca tinha passado por la, o calculo nao
      // existia, e o quadro vinha so com o consumo. Aqui ele e pedido; ao
      // chegar, so este quadro e redesenhado.
      const unidade = this._selectedUnit;
      const custo = this._cycleCost.get(unidade);
      if (
        !custo && !this._cycleCostInFlight.has(unidade)
        && !this._cycleCostErrors.has(unidade)
      ) {
        this._loadCycleCost(unidade).then(() => this._renderBillEstimateUpdate());
      }
      const total = custo?.money?.total_amount;
      valores.append(this._field(
        "Preço estimado s/ SCEE",
        total !== null && total !== undefined
          ? this._formatCurrency(Number(total), "BRL")
          : this._cycleCostInFlight.has(unidade) ? "…" : "—",
      ));
      section.append(valores);

      const porDia = Number(base.average_daily_value);
      const dias = Number(base.target_days);
      if (Number.isFinite(porDia) && Number.isFinite(dias)) {
        section.append(this._element(
          "p", "bill-estimate-note",
          `Fatura de ${base.billing_reference ?? "—"}: `
          + `${this._formatNumber(porDia, 2, 2)} kWh por dia × `
          + `${this._formatNumber(dias, 0, 0)} dias do ciclo atual. `
          + "Não é medição: repete o ritmo da última fatura, e não acompanha "
          + "o que acontece agora.",
        ));
      }
      return section;
    }

    _renderBillEstimateUpdate() {
      const atual = this.shadowRoot?.querySelector("[data-bill-estimate]");
      if (!atual) return;
      const dados = this._displayData();
      if (!dados) return;
      const novo = this._renderBillEstimate(dados.snapshot ?? {}, dados.prediction);
      if (novo) atual.replaceWith(novo);
    }

    _renderPrediction(prediction) {
      const section = this._element("section", "panel block");
      section.append(this._element("h3", "section-title", "Previsão"));
      if (!prediction) {
        section.append(this._element(
          "p",
          "empty",
          "Previsão indisponível para este ciclo",
        ));
        return section;
      }
      section.append(
        this._field(
          "Valor previsto",
          this._valueWithUnit(prediction.predicted_value, prediction.unit),
        ),
        this._field(
          "Classificação",
          this._translateClassification(prediction.classification ?? "—"),
        ),
        this._field("Início", this._formatDate(prediction.target_start)),
        this._field("Fim", this._formatDate(prediction.target_end)),
      );
      return section;
    }

    _formatDistributionPercent(value) {
      if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) {
        return "Não informado";
      }
      return `${value.replace(".", ",")}%`;
    }

    _formatDistributionDate(value, emptyLabel) {
      if (value === null || value === undefined) return emptyLabel;
      if (typeof value !== "string") return "Não informado";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      try {
        return new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: this._distributionTimezone(),
        }).format(date);
      } catch {
        return value;
      }
    }

    _distributionLabel(rule) {
      return typeof rule?.label === "string" && rule.label.trim()
        ? rule.label
        : "Regra sem nome";
    }

    _renderDistributionShares(rule, modifier = "") {
      const grid = this._element(
        "div",
        `distribution-shares ${modifier}`.trim(),
      );
      const shares = rule?.shares && typeof rule.shares === "object"
        ? rule.shares
        : {};
      for (const unit of this._units()) {
        const item = this._element("div", "distribution-share");
        item.append(
          this._element("span", "distribution-unit", unit.label),
          this._element(
            "strong",
            "distribution-percent",
            this._formatDistributionPercent(shares[unit.id]),
          ),
        );
        grid.append(item);
      }
      return grid;
    }

    _renderDistributionRule(rule, kind) {
      const block = this._element("section", `distribution-rule ${kind}`);
      const heading = kind === "scheduled"
        ? "Próximo rateio agendado"
        : "Regra vigente";
      block.append(
        this._element("h4", "distribution-rule-title", heading),
        this._element("strong", "distribution-rule-label", this._distributionLabel(rule)),
        this._renderDistributionShares(rule),
      );
      const period = this._element("div", "distribution-period");
      period.append(
        this._field(
          "Início da vigência",
          this._formatDistributionDate(
            rule?.effective_from,
            "Desde o início do histórico disponível",
          ),
        ),
        this._field(
          "Fim da vigência",
          this._formatDistributionDate(rule?.effective_until, "Vigente"),
        ),
        this._field(
          "Total configurado",
          this._formatDistributionPercent(rule?.total_percent),
        ),
      );
      block.append(period);
      return block;
    }

    _renderDistributionHistory(history) {
      const block = this._element("details", "distribution-history");
      block.append(this._element(
        "summary",
        "distribution-history-summary",
        `Histórico de vigências (${history.length})`,
      ));
      const list = this._element("div", "distribution-history-list");
      for (const rule of history) {
        const item = this._element("article", "distribution-history-item");
        item.append(
          this._element("strong", "distribution-rule-label", this._distributionLabel(rule)),
          this._element(
            "span",
            "distribution-history-period",
            `${this._formatDistributionDate(
              rule?.effective_from,
              "Desde o início do histórico disponível",
            )} → ${this._formatDistributionDate(rule?.effective_until, "Vigente")}`,
          ),
          this._renderDistributionShares(rule, "compact"),
        );
        list.append(item);
      }
      block.append(list);
      return block;
    }

    _renderDistributionEditor() {
      const scheduling = this._distributionMode === "schedule";
      const form = this._element("section", "distribution-editor");
      form.append(this._element(
        "h4",
        "distribution-editor-title",
        scheduling ? "Agendar alteração" : "Editar rateio",
      ));
      if (scheduling) {
        const scheduleFields = this._element("div", "distribution-schedule-fields");
        for (const [field, label, type] of [
          ["date", "Data de início", "date"],
          ["time", "Hora de início", "time"],
          ["label", "Nome da regra (opcional)", "text"],
        ]) {
          const wrapper = this._element("label", "distribution-input-field");
          wrapper.append(this._element("span", "field-label", label));
          const input = this._element("input", "distribution-input");
          input.type = type;
          input.value = this._distributionDraft[field];
          input.dataset.distributionField = field;
          input.setAttribute("aria-label", label);
          wrapper.append(input);
          scheduleFields.append(wrapper);
        }
        form.append(scheduleFields);
      }

      const inputs = this._element("div", "distribution-input-grid");
      for (const unit of this._units()) {
        const wrapper = this._element("label", "distribution-input-field");
        wrapper.append(this._element("span", "field-label", unit.label));
        const control = this._element("span", "distribution-percent-control");
        const input = this._element("input", "distribution-input");
        input.type = "text";
        input.inputMode = "decimal";
        input.autocomplete = "off";
        input.value = this._distributionDraft.shares[unit.id];
        input.dataset.distributionField = unit.id;
        input.setAttribute("aria-label", `Percentual de ${unit.label}`);
        control.append(input, this._element("span", "distribution-percent-suffix", "%"));
        wrapper.append(control);
        inputs.append(wrapper);
      }
      form.append(inputs);

      const total = this._distributionDraftTotal();
      const valid = total === 1000000n;
      const totalLine = this._element(
        "div",
        `distribution-editor-total ${valid ? "valid" : "invalid"}`,
      );
      totalLine.setAttribute("aria-live", "polite");
      totalLine.append(
        this._element("span", "", "Total"),
        this._element("strong", "", this._formatDistributionTotal(total)),
        this._element(
          "small",
          "",
          valid ? "Total válido" : "O total deve ser exatamente 100%",
        ),
      );
      form.append(totalLine);
      if (scheduling) {
        const effectiveFrom = this._distributionEffectiveFrom();
        form.append(this._element(
          "p",
          "distribution-schedule-preview",
          effectiveFrom
            ? `Vigência: ${this._formatDistributionDate(effectiveFrom, "Não informado")}`
            : "Informe uma data e hora válidas.",
        ));
      }
      const actions = this._element("div", "distribution-actions");
      actions.append(this._button("Cancelar", "distribution-close"));
      const review = this._button(
        scheduling ? "Revisar agendamento" : "Salvar alteração",
        scheduling ? "distribution-review-schedule" : "distribution-review-immediate",
        "distribution-primary-action",
      );
      review.disabled = scheduling
        ? !this._distributionScheduleIsValid()
        : !this._distributionDraftIsValid();
      actions.append(review);
      form.append(actions);
      return form;
    }

    _renderDistributionConfirmation() {
      const type = this._distributionConfirmation;
      if (!type) return null;
      const dialog = this._element("section", "distribution-confirmation");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      if (type === "cancel") {
        const effectiveFrom = this._distributionData?.scheduled?.effective_from;
        dialog.append(
          this._element("h4", "distribution-editor-title", "Cancelar agendamento"),
          this._element(
            "p",
            "distribution-confirmation-copy",
            `Cancelar a alteração de rateio agendada para ${this._formatDistributionDate(effectiveFrom, "data não informada")}?`,
          ),
        );
      } else {
        const scheduling = type === "schedule";
        dialog.append(this._element(
          "h4",
          "distribution-editor-title",
          scheduling ? "Novo rateio agendado" : "Novo rateio",
        ));
        if (scheduling) {
          dialog.append(this._element(
            "p",
            "distribution-confirmation-copy",
            `Vigência a partir de: ${this._formatDistributionDate(
              this._distributionEffectiveFrom(), "Não informado",
            )}`,
          ));
        }
        dialog.append(this._renderDistributionShares({ shares: this._distributionDraft.shares }));
        dialog.append(this._element(
          "p",
          "distribution-confirmation-total",
          `Total: ${this._formatDistributionTotal(this._distributionDraftTotal())}`,
        ));
        if (!scheduling) {
          dialog.append(this._element(
            "p",
            "distribution-confirmation-copy",
            "A alteração passa a valer imediatamente e encerra a vigência da configuração atual.",
          ));
        }
      }
      const actions = this._element("div", "distribution-actions");
      actions.append(this._button(
        type === "cancel" ? "Manter agendamento" : "Cancelar",
        "distribution-dismiss-confirmation",
      ));
      const confirm = this._button(
        type === "cancel" ? "Cancelar agendamento"
          : type === "schedule" ? "Confirmar agendamento" : "Confirmar alteração",
        `distribution-confirm-${type}`,
        "distribution-primary-action",
      );
      confirm.disabled = ["saving", "scheduling", "cancelling"]
        .includes(this._distributionMutationState);
      actions.append(confirm);
      dialog.append(actions);
      return dialog;
    }

    // `modal` tira a moldura de painel e o titulo, que o cabecalho do popup ja
    // dá; `includeHistory` separa as duas vistas sem duplicar o corpo do
    // editor, que e a parte com estado.
    _renderDistribution({ modal = false, includeHistory = true } = {}) {
      const section = this._element(
        "section",
        modal ? "distribution-section distribution-in-modal" : "panel block distribution-section",
      );
      section.dataset.distributionSection = "";
      if (!modal) {
        section.append(
          this._element("h3", "section-title", "Rateio configurado"),
          this._element(
            "p",
            "distribution-context",
            "Configuração temporal do rateio. O percentual oficial observado na fatura é exibido separadamente em SCEE e créditos.",
          ),
        );
      }
      if (this._distributionLoading && !this._distributionData) {
        section.append(this._historyStatus("Carregando rateio configurado…", "loading compact"));
        return section;
      }
      if (this._distributionError && !this._distributionData) {
        section.append(this._element("div", "distribution-error", this._distributionError));
        return section;
      }
      const data = this._distributionData;
      if (!data) {
        section.append(this._historyStatus("Aguardando rateio configurado…", "compact"));
        return section;
      }

      const busy = ["saving", "scheduling", "cancelling"]
        .includes(this._distributionMutationState);
      const toolbar = this._element("div", "distribution-toolbar");
      const edit = this._button("Editar rateio", "distribution-edit");
      const schedule = this._button("Agendar alteração", "distribution-schedule");
      edit.disabled = busy || this._distributionMode !== "idle" || data.scheduled !== null;
      // Agendar precisa de um rateio vigente ate a data escolhida.
      schedule.disabled = busy || this._distributionMode !== "idle" || data.scheduled !== null
        || data.current === null;
      toolbar.append(edit, schedule);
      section.append(toolbar);
      if (this._distributionMutationMessage) {
        const state = this._distributionMutationState === "success" ? "success"
          : this._distributionMutationState === "revision_conflict" ? "conflict" : "error";
        const message = this._element(
          "div", `distribution-mutation-message ${state}`, this._distributionMutationMessage,
        );
        message.setAttribute("aria-live", "assertive");
        section.append(message);
      }
      if (busy) {
        section.append(this._historyStatus(
          this._distributionMutationState === "saving" ? "Salvando rateio…"
            : this._distributionMutationState === "scheduling" ? "Agendando rateio…"
              : "Cancelando agendamento…",
          "loading compact",
        ));
      }
      if (data.current === null) {
        section.append(this._element(
          "p", "distribution-empty",
          "Rateio ainda não informado. Diga quanto da energia excedente vai "
          + "para cada unidade em \"Editar rateio\" — ou em Configurar, na "
          + "página da integração.",
        ));
      } else {
        section.append(this._renderDistributionRule(data.current, "current"));
      }
      if (this._distributionMode !== "idle" && this._distributionDraft) {
        section.append(this._renderDistributionEditor());
      }
      if (data.scheduled === null) {
        section.append(this._element(
          "p",
          "distribution-empty",
          "Nenhuma alteração de rateio agendada",
        ));
      } else {
        section.append(this._renderDistributionRule(data.scheduled, "scheduled"));
        section.append(this._element(
          "p", "distribution-scheduled-note", "Já existe uma alteração de rateio agendada.",
        ));
        const cancel = this._button(
          "Cancelar agendamento", "distribution-review-cancel", "distribution-danger-action",
        );
        cancel.disabled = busy;
        section.append(cancel);
      }
      const confirmation = this._renderDistributionConfirmation();
      if (confirmation) section.append(confirmation);
      if (includeHistory) section.append(this._renderDistributionHistory(data.history));
      return section;
    }

    _formatOfficialDecimal(value, minimumFractionDigits = 0) {
      if (typeof value !== "string"
        || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return "Não informado";
      const negative = value.startsWith("-");
      const unsigned = negative ? value.slice(1) : value;
      const [whole, rawFraction = ""] = unsigned.split(".");
      const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const fraction = rawFraction.padEnd(minimumFractionDigits, "0");
      return `${negative ? "-" : ""}${grouped}${fraction ? `,${fraction}` : ""}`;
    }

    // O domínio deixou de arredondar, então a tela também não pode: corta as
    // casas excedentes por truncamento. Arredondar aqui exibiria um valor que a
    // soma das próprias linhas não reproduz, que é justamente o que a auditoria
    // existe para impedir — e truncar nunca exibe mais economia do que houve.
    _truncateDecimals(value, places) {
      const text = String(value);
      if (!text.includes(".")) return text;
      const [whole, fraction] = text.split(".");
      const cut = fraction.slice(0, places);
      return cut ? `${whole}.${cut}` : whole;
    }

    // Número em ponto flutuante para string de centavos, sem arredondar.
    _cents(value) {
      if (!Number.isFinite(value)) return "0.00";
      return this._truncateDecimals(value.toFixed(8), 2);
    }

    _formatOfficialMoney(value, currency = "BRL") {
      if (value === null || value === undefined) return "Não informado";
      const formatted = this._formatOfficialDecimal(value, 2);
      if (formatted === "Não informado") return formatted;
      const negative = formatted.startsWith("-");
      const unsigned = negative ? formatted.slice(1) : formatted;
      const prefix = currency === "BRL" ? "R$" : String(currency || "").trim();
      return `${negative ? "-" : ""}${prefix ? `${prefix} ` : ""}${unsigned}`;
    }

    _formatProjectedYears(value) {
      if (typeof value !== "string"
        || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return "Indisponível";
      const [whole, fraction = ""] = value.split(".");
      let integer = BigInt(whole);
      let tenth = Number(fraction[0] ?? "0");
      if (Number(fraction[1] ?? "0") >= 5) tenth += 1;
      if (tenth === 10) {
        integer += 1n;
        tenth = 0;
      }
      return `${integer.toLocaleString("pt-BR")},${tenth} anos`;
    }

    _renderPaybackProjection() {
      const section = this._element("section", "panel block payback-projection-section");
      section.dataset.paybackProjectionSection = "";
      const heading = this._element("div", "payback-projection-heading");
      heading.append(this._element("h3", "section-title", "Payback"));
      // A linha de contexto acompanha o titulo da secao em vez de abrir um
      // bloco proprio: ela situa o periodo, nao merece um cabecalho inteiro.
      const inicio = this._formatPeriodLabel(
        this._paybackProjectionData?.investment?.payment_period,
      );
      if (inicio) {
        heading.append(this._element(
          "span", "payback-header-eyebrow", `Sistema solar · início em ${inicio}`,
        ));
      }
      section.append(heading);
      if (!this._paybackProjectionData && this._paybackProjectionInFlight) {
        section.append(this._historyStatus("Carregando projeção de payback...", "loading compact"));
        return section;
      }
      if (!this._paybackProjectionData && this._paybackProjectionError) {
        const faltaInvestimento =
          this._paybackProjectionError === "missing_investment";
        const faltaFatura = this._paybackProjectionError === "missing_billing";
        const pendente = faltaInvestimento || faltaFatura;
        const message = faltaInvestimento
          ? "Informe quanto custou o sistema solar para o payback ser calculado."
            + " O valor fica em Configuração › Investimento no sistema solar."
          : faltaFatura
            ? "O payback soma a economia que aparece nas faturas, e nenhuma foi"
              + " lida ainda. Leia as faturas em Configuração › Extração de faturas."
            : (this._paybackProjectionError === "unavailable"
              ? "Projeção de payback indisponível. Verifique a configuração financeira."
              : "Não foi possível carregar a projeção de payback.");
        const error = this._element(
          "div",
          `payback-projection-error ${pendente ? "pending" : ""}`,
        );
        const botao = this._button(
          pendente ? "Abrir a Configuração" : "Tentar novamente",
          pendente ? "payback-open-investment" : "payback-projection-retry",
        );
        if (faltaFatura) botao.dataset.modal = "extracao";
        error.append(this._element("span", "", message), botao);
        section.append(error);
        return section;
      }
      const data = this._paybackProjectionData;
      if (!data) {
        section.append(this._historyStatus("Carregando projeção de payback...", "loading compact"));
        return section;
      }
      const summary = this._paybackSummary(data);
      section.append(this._renderPaybackHero(data, summary));
      section.append(this._renderPaybackKpis(data, summary));

      // O seletor fica ACIMA do grafico, nao sobre ele: flutuando no canto,
      // ele cobria o desenho e voltava a cobrir a cada mudanca de largura.
      const barraDoGrafico = this._element("div", "payback-chart-bar");
      barraDoGrafico.append(this._renderPaybackChartToggle());
      section.append(barraDoGrafico);
      const chartWrap = this._element("div", "payback-chart-wrap");
      const chart = this._element("div", "payback-chart");
      chart.dataset.paybackChart = "";
      chartWrap.append(chart);
      if (summary.points.length === 0) {
        chartWrap.append(this._element(
          "p", "payback-chart-empty",
          "Sem ciclos elegiveis para montar a curva de economia.",
        ));
      }
      section.append(chartWrap);
      section.append(this._renderPaybackLegend(summary));
      section.append(this._renderPaybackMetadata(data, summary));
      const audit = this._renderPaybackAudit(data, summary);
      if (audit) section.append(audit);
      return section;
    }

    // Duas perguntas diferentes sobre o mesmo dado: "de onde veio o dinheiro"
    // e "onde eu estou". Nenhum dos dois desenhos responde bem as duas, e por
    // isso o seletor existe — nao e preferencia estetica.
    _renderPaybackChartToggle() {
      const caixa = this._element("div", "payback-chart-modes");
      const modos = [
        ["bars", "mdi:chart-bar", "Composição por unidade, mês a mês"],
        ["curve", "mdi:chart-line", "Posição líquida: quanto falta, quanto sobrou"],
      ];
      for (const [modo, icone, titulo] of modos) {
        const ativo = this._paybackChartMode === modo;
        const botao = this._button(
          "", "payback-chart-mode", `payback-chart-mode${ativo ? " active" : ""}`,
        );
        botao.dataset.mode = modo;
        botao.title = titulo;
        botao.setAttribute("aria-label", titulo);
        botao.setAttribute("aria-pressed", ativo ? "true" : "false");
        const marca = this._element("ha-icon", "");
        marca.setAttribute("icon", icone);
        botao.append(marca);
        caixa.append(botao);
      }
      return caixa;
    }

    _paybackChartOptions(summary) {
      return this._paybackChartMode === "curve"
        ? this._paybackNetOptions(summary)
        : this._paybackBarsOptions(summary);
    }

    // A posicao liquida: acumulado menos investimento. O zero passa a ser a
    // quitacao, entao a linha tracejada do investimento deixa de ser
    // necessaria — ela virou o proprio eixo.
    _paybackNetOptions(summary) {
      const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches === true;
      const inv = summary.investment;
      const categorias = [INICIO_CATEGORIA, ...summary.points.map((p) => p.reference)];
      const valores = [
        -inv,
        ...summary.points.map((p) => p.combinedAccumulated - inv),
      ];
      const maximo = Math.max(...valores, 0);
      const quitacao = summary.settlement;
      const marco = quitacao?.status === "settled"
        ? categorias.indexOf(quitacao.settled_reference)
        : -1;
      return {
        ...this._chartBase(),
        animation: !reducedMotion,
        grid: { left: 62, right: 62, top: 26, bottom: 40, containLabel: false },
        tooltip: {
          trigger: "axis",
          confine: true,
          transitionDuration: 0,
          hideDelay: 0,
          formatter: (params) => this._paybackNetTooltip(summary, params),
          ...this._chartTooltipSkin(),
        },
        xAxis: {
          type: "category",
          data: categorias,
          boundaryGap: false,
          ...this._chartCategoryAxisSkin(),
          axisLabel: {
            color: this._chartInk(),
            fontSize: 11,
            hideOverlap: true,
            formatter: (value) => (value === INICIO_CATEGORIA ? "" : value),
          },
        },
        yAxis: {
          type: "value",
          // Arredondado para o milhar: o minimo calculado virava rotulo
          // quebrado no pe do eixo, colado no vizinho.
          min: -Math.ceil((inv * 1.08) / 1000) * 1000,
          max: Math.max(Math.ceil((maximo * 1.2) / 1000) * 1000, 1000),
          name: "Posição (R$)",
          nameLocation: "middle",
          nameGap: 50,
          ...this._chartValueAxisSkin(),
          axisLabel: {
            color: this._chartInk(),
            fontSize: 11,
            formatter: (value) => this._formatCompactMoney(value),
          },
        },
        series: [
        {
          id: "preenchimento",
          type: "line",
          silent: true,
          z: 1,
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: {
            origin: 0,
            color: this._paybackCutFill(valores, 0, FUNDO_SALDO, FUNDO_DEVENDO),
          },
          tooltip: { show: false },
          data: valores,
        },
        {
          id: "posicao",
          name: "Posição líquida",
          type: "line",
          smooth: false,
          symbol: "circle",
          symbolSize: 7,
          showSymbol: true,
          z: 3,
          // Branca nos dois modos: e o mesmo caminho, e trocar de cor com o
          // sinal faria a linha dizer o que o preenchimento ja diz.
          itemStyle: { color: "#dfe3e8" },
          lineStyle: { width: 2, color: "#dfe3e8" },
          data: valores.map((valor, indice) => {
            const ponto = summary.points[indice - 1];
            return ponto?.partial
              ? { value: valor, symbol: "emptyCircle", symbolSize: 9 }
              : valor;
          }),
          markLine: {
            silent: true,
            symbol: "none",
            label: {
              formatter: "pago",
              position: "end",
              distance: 8,
              align: "left",
              verticalAlign: "middle",
              fontSize: 11,
              fontWeight: 700,
              color: this._chartInk(),
            },
            lineStyle: { type: "solid", color: this._chartInk(), opacity: .55 },
            data: [{ yAxis: 0 }],
          },
          markPoint: marco < 0 ? undefined : {
            silent: true,
            symbol: "circle",
            symbolSize: 10,
            itemStyle: { color: COR_SALDO },
            label: {
              formatter: `quitado · ${quitacao.settled_reference}`,
              position: "top",
              distance: 12,
              color: COR_SALDO,
              fontSize: 11,
              fontWeight: 700,
            },
            data: [{ coord: [marco, valores[marco]] }],
          },
        }],
      };
    }

    // Duas series recortadas por sinal desenhavam, no trecho que atravessa o
    // corte, um triangulo cada uma: elas se cruzavam em vez de parar na linha.
    // Uma area so, com o corte de cor na ALTURA do valor, para exatamente onde
    // a linha esta — em qualquer ponto, nao so nos meses.
    _paybackCutFill(valores, corte, acima, abaixo) {
      const topo = Math.max(...valores, corte);
      const fundo = Math.min(...valores, corte);
      if (!(topo > fundo)) return acima;
      const parada = Math.min(Math.max((topo - corte) / (topo - fundo), 0), 1);
      // As duas paradas nao podem cair no MESMO ponto: com offsets iguais o
      // desenho descarta uma delas e o corte vira um degrade — foi o que
      // deixou a area de baixo esverdeada perto do zero, puxando a cor de
      // cima para dentro dela. Um fio de distancia basta para a borda ser
      // uma borda; 0,0005 da menos de meio pixel na altura do grafico.
      const fio = 0.0005;
      return {
        type: "linear",
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: acima },
          { offset: Math.max(parada - fio, 0), color: acima },
          { offset: Math.min(parada + fio, 1), color: abaixo },
          { offset: 1, color: abaixo },
        ],
      };
    }

    _paybackNetTooltip(summary, params) {
      const lista = Array.isArray(params) ? params : [params];
      const referencia = lista[0]?.axisValue ?? "";
      const money = (value) => this._formatOfficialMoney(
        this._cents(value), summary.currency,
      );
      if (referencia === INICIO_CATEGORIA) {
        return `<strong>Ponto de partida</strong>`
          + `<div style="opacity:.8">Investimento: ${money(summary.investment)}</div>`
          + `<div style="opacity:.7;font-size:11px">antes de qualquer ciclo</div>`;
      }
      const ponto = summary.points.find((item) => item.reference === referencia);
      if (!ponto) return "";
      // O saldo positivo ja sai do tooltip comum, nos dois modos. Aqui so
      // entra o outro lado: quanto ainda falta.
      const posicao = ponto.combinedAccumulated - summary.investment;
      const falta = posicao < 0
        ? `<div style="color:${COR_DEVENDO}">Falta recuperar: <strong>${money(-posicao)}</strong></div>`
        : "";
      return this._paybackTooltip(summary, params) + falta;
    }

    _paybackBarsOptions(summary) {
      const points = summary.points;
      const unitIds = [...summary.unitTotals.keys()];
      const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches === true;
      // Passar o mouse numa barra acende a unidade inteira ao longo dos ciclos e
      // apaga as demais: é assim que se lê a participação de uma unidade sem ter
      // de caçar a mesma cor mês a mês.
      const focusUnit = {
        emphasis: { focus: "series" },
        blur: { itemStyle: { opacity: .18 } },
      };
      const bars = unitIds.map((unitId) => ({
        id: unitId,
        name: this._unitLabel(unitId),
        type: "bar",
        stack: "economia",
        itemStyle: { color: this._paybackUnitColor(unitId) },
        data: points.map((point) => this._paybackBarDatum(point, point.units.get(unitId) ?? 0)),
        ...focusUnit,
      }));
      if (points.some((point) => point.selfConsumption > 0)) {
        const owner = summary.selfConsumptionOwner;
        const tone = this._paybackUnitColor(owner ?? unitIds[0]);
        const series = {
          id: "autoconsumo",
          name: `Autoconsumo HA${owner ? ` · ${this._unitLabel(owner)}` : ""}`,
          type: "bar",
          stack: "economia",
          itemStyle: {
            color: this._mixWithSurface(tone, 0.34),
            borderColor: tone,
            borderWidth: 1,
            borderType: "dashed",
          },
          data: points.map((point) => this._paybackBarDatum(point, point.selfConsumption)),
          ...focusUnit,
        };
        // encostado na barra da própria unidade, para a relação ser visual
        const at = unitIds.indexOf(owner);
        if (at >= 0) bars.splice(at + 1, 0, series);
        else bars.push(series);
      }
      const accumulated = {
        id: "acumulado",
        name: "Economia acumulada",
        type: "line",
        yAxisIndex: 1,
        smooth: false,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { color: "#d7dbe0" },
        // A curva e a meta são o quadro de referência: continuam nítidas quando
        // uma unidade é destacada, senão o gráfico perde a escala no hover.
        blur: { lineStyle: { opacity: 1 }, itemStyle: { opacity: 1 } },
        data: points.map((point) => (point.partial
          ? { value: point.combinedAccumulated, symbol: "emptyCircle", symbolSize: 8 }
          : point.combinedAccumulated)),
        markLine: summary.investment > 0 ? {
          silent: true,
          symbol: "none",
          // O rótulo vai para a borda direita, na altura da própria linha, e fica
          // com a mesma cor dela: lê-se como mais um valor do eixo acumulado, sem
          // a palavra "Investimento" atravessando a área do gráfico.
          // `distance` e `align` copiam a margem e o alinhamento padrão dos
          // rótulos do eixo (8px, à esquerda), para este valor cair na mesma
          // coluna dos demais em vez de flutuar deslocado ao lado deles.
          label: {
            formatter: this._formatCompactMoney(summary.investment),
            position: "end",
            distance: 8,
            align: "left",
            verticalAlign: "middle",
            fontSize: 11,
            fontWeight: 700,
            color: "#e8734a",
          },
          lineStyle: { type: "dashed", color: "#e8734a" },
          data: [{ yAxis: summary.investment }],
        } : undefined,
      };
      return {
        ...this._chartBase(),
        animation: !reducedMotion,
        grid: {
          left: 62, right: 62, top: 20,
          bottom: summary.partialPoints.length ? 54 : 40,
          containLabel: false,
        },
        tooltip: {
          trigger: "axis",
          confine: true,
          transitionDuration: 0,
          hideDelay: 0,
          formatter: (params) => this._paybackTooltip(summary, params),
          ...this._chartTooltipSkin(),
        },
        xAxis: {
          type: "category",
          data: points.map((point) => point.reference),
          ...this._chartCategoryAxisSkin(),
          axisLabel: {
            color: this._chartInk(),
            fontSize: 11,
            hideOverlap: true,
            // Embaixo do mes parcial, quantas faturas ja chegaram.
            formatter: (value) => {
              const point = points.find((item) => item.reference === value);
              return point?.partial
                ? `${value}\n{partial|${point.invoicesPresent}/${point.invoicesExpected} faturas}`
                : value;
            },
            rich: { partial: { color: "#f2b544", fontSize: 10, lineHeight: 16 } },
          },
        },
        yAxis: [
          {
            type: "value",
            min: 0,
            name: "Economia no ciclo (R$)",
            nameLocation: "middle",
            nameGap: 48,
            ...this._chartValueAxisSkin(),
            axisLabel: {
              color: this._chartInk(),
              fontSize: 11,
              formatter: (value) => this._formatCompactMoney(value),
            },
          },
          {
            type: "value",
            min: 0,
            max: summary.investment > 0
              ? Math.max(summary.investment, summary.combinedTotal) * 1.05
              : undefined,
            name: "Acumulado (R$)",
            nameLocation: "middle",
            nameGap: 50,
            ...this._chartValueAxisSkin(),
            splitLine: { show: false },
            axisLabel: {
              color: this._chartInk(),
              fontSize: 11,
              formatter: (value) => this._formatCompactMoney(value),
            },
          },
        ],
        series: [...bars, accumulated],
      };
    }

    // O mes parcial e o mesmo valor de fatura, so que ainda crescendo: a
    // hachura diz "vai subir" sem inventar a altura que falta.
    _paybackBarDatum(point, value) {
      if (!point.partial) return value;
      return {
        value,
        itemStyle: {
          opacity: 0.78,
          decal: {
            symbol: "rect",
            symbolSize: 1,
            color: "rgba(255, 255, 255, .30)",
            dashArrayX: [1, 0],
            dashArrayY: [2, 4],
            rotation: -Math.PI / 4,
          },
        },
      };
    }

    _formatCompactMoney(value) {
      if (!Number.isFinite(value)) return "";
      // Pela grandeza, nao pelo sinal: com `value >= 1000`, -2000 escapava
      // para o outro formato e o eixo misturava "2,0k" com "-2000".
      return Math.abs(value) >= 1000
        ? `${(value / 1000).toFixed(1).replace(".", ",")}k`
        : String(Math.round(value));
    }

    _paybackTooltip(summary, params) {
      const list = Array.isArray(params) ? params : [params];
      const reference = list[0]?.axisValue ?? "";
      const point = summary.points.find((item) => item.reference === reference);
      if (!point) return "";
      const money = (value) => this._formatOfficialMoney(
        this._cents(value), summary.currency,
      );
      const owner = summary.selfConsumptionOwner;
      // O autoconsumo pertence à unidade geradora: soma no total dela e no
      // percentual dela, em vez de flutuar como uma parcela do sistema.
      const totals = new Map(point.units);
      if (owner && point.selfConsumption > 0) {
        totals.set(owner, (totals.get(owner) ?? 0) + point.selfConsumption);
      }
      const rows = [...totals.entries()]
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([unitId, value]) => {
          const share = point.total > 0 ? (value / point.total) * 100 : 0;
          const line = `<div>${this._unitLabel(unitId)}: <strong>${money(value)}</strong>`
            + ` <span style="opacity:.7">(${share.toFixed(0)}%)</span></div>`;
          if (unitId !== owner || point.selfConsumption <= 0) return line;
          return line
            + `<div style="opacity:.7;font-size:11px;padding-left:10px">`
            + `${money(point.units.get(unitId) ?? 0)} em fatura`
            + ` + ${money(point.selfConsumption)} autoconsumo HA</div>`;
        });
      const paid = point.paid === null ? null : point.paid;
      const without = paid === null ? null : paid + point.saved;
      const rule = '<div style="border-top:1px solid rgba(255,255,255,.16);margin:5px 0"></div>';
      const waiting = point.missingUnits.map((unitId) => this._unitLabel(unitId));
      const generatorPending = point.missingUnits.includes(owner ?? this._generator);
      return [
        `<strong>${reference}</strong>`,
        point.partial
          ? `<div style="color:#f2b544;font-size:11px">Parcial · ${point.invoicesPresent}`
            + ` de ${point.invoicesExpected} faturas · aguardando ${waiting.join(", ")}</div>`
          : "",
        ...rows,
        rule,
        `<div>Economia do ciclo: <strong>${money(point.total)}</strong></div>`,
        point.selfConsumption > 0
          ? `<div style="opacity:.7;font-size:11px">${money(point.saved)} em fatura`
            + ` + ${money(point.selfConsumption)} autoconsumo HA</div>`
          : `<div style="opacity:.7;font-size:11px">${generatorPending
            ? `autoconsumo HA entra com a fatura da ${this._unitLabel(owner ?? this._generator)}`
            : "sem autoconsumo medido neste ciclo"}</div>`,
        point.partial
          ? `<div style="opacity:.7;font-size:11px">fica fora da média até completar</div>`
          : "",
        paid === null ? "" : `<div style="opacity:.75">Pago na fatura: ${money(paid)}</div>`,
        without === null
          ? ""
          : `<div style="opacity:.75">Sem o crédito SCEE: ${money(without)}</div>`,
        `<div style="margin-top:4px;opacity:.75">Acumulado: ${money(point.combinedAccumulated)}</div>`,
        point.surplus > 0
          ? `<div style="color:${COR_SALDO}">Saldo positivo: <strong>${money(point.surplus)}</strong></div>`
          : "",
      ].filter(Boolean).join("");
    }

    async _renderPaybackChart() {
      const element = this.shadowRoot?.querySelector("[data-payback-chart]");
      const data = this._paybackProjectionData;
      if (!element || !data) return;
      const summary = this._paybackSummary(data);
      if (summary.points.length === 0) return;
      try {
        const chartModule = await this._loadChartModule();
        if (
          !element.isConnected
          || element !== this.shadowRoot.querySelector("[data-payback-chart]")
        ) {
          return;
        }
        this._cleanupPaybackChart();
        this._paybackChart = chartModule.initChart(
          element, this._paybackChartOptions(summary),
        );
        if (typeof ResizeObserver !== "undefined") {
          this._paybackResizeObserver = new ResizeObserver(() => {
            if (this._paybackChart === null) return;
            chartModule.resizeChart(this._paybackChart);
          });
          this._paybackResizeObserver.observe(element);
        }
      } catch {
        /* o painel permanece utilizavel sem o grafico */
      }
    }

    _cleanupPaybackChart() {
      this._paybackResizeObserver?.disconnect();
      this._paybackResizeObserver = null;
      if (this._paybackChart && this._chartModule) {
        this._chartModule.disposeChart(this._paybackChart);
      }
      this._paybackChart = null;
    }

    _decimalOrNull(value) {
      if (typeof value !== "string" && typeof value !== "number") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    _unitLabel(unitId) {
      // Sem unidade nao ha nome a dar. Devolver o proprio argumento fazia um
      // `null` virar a palavra "null" escrita na tela — o mesmo jeito pelo
      // qual a aba Payback ja escreveu "null" uma vez.
      if (typeof unitId !== "string" || !unitId) return "—";
      return this._units().find((unit) => unit.id === unitId)?.label ?? unitId;
    }

    // A barra do autoconsumo precisa ser clara sem ser translúcida: com alfa, as
    // linhas de grade do gráfico atravessavam a barra e cruzavam o valor. Aqui a
    // cor é misturada com o fundo do card, o que dá o mesmo tom claro, porém
    // opaco — a barra cobre a grade em vez de deixá-la passar.
    _mixWithSurface(hex, ratio) {
      const surface = this._parseColor(this._chartSurface());
      const tone = this._parseColor(hex);
      if (!tone || !surface) return hex;
      const channel = (index) => Math.round(tone[index] * ratio + surface[index] * (1 - ratio));
      return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
    }

    // Tokens de grafico, espelhando os do CSS. Ficam como constantes porque o
    // ECharts recebe cor resolvida, nao variavel CSS.
    _chartInk() { return "#aeb7c2"; }
    _chartLine() { return "rgba(255, 255, 255, .10)"; }
    _chartSurface() { return "#1a1d21"; }

    _chartBase() {
      return {
        backgroundColor: "transparent",
        textStyle: {
          color: this._chartInk(),
          fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
        },
      };
    }

    _chartTooltipSkin() {
      return {
        backgroundColor: this._chartSurface(),
        borderColor: "rgba(255, 255, 255, .14)",
        textStyle: { color: "#f2f5f8", fontSize: 12 },
        extraCssText: "border-radius: 6px; box-shadow: 0 12px 34px rgba(0,0,0,.45);",
      };
    }

    _chartLegendSkin() {
      return {
        textStyle: { color: this._chartInk(), fontSize: 11.5 },
        inactiveColor: "#5b6472",
        itemWidth: 13,
        itemHeight: 9,
      };
    }

    // Eixo de categoria e eixo de valor pedem tratamentos diferentes: a linha
    // do eixo ajuda no categorico e atrapalha no de valor, onde a grade
    // pontilhada ja da a referencia sem competir com as barras.
    _chartCategoryAxisSkin() {
      return {
        axisLine: { lineStyle: { color: this._chartLine() } },
        axisTick: { show: false },
        axisLabel: { color: this._chartInk(), fontSize: 11 },
      };
    }

    _chartValueAxisSkin() {
      return {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: this._chartInk(), fontSize: 11 },
        nameTextStyle: { color: "#7c8592", fontSize: 10.5 },
        splitLine: { lineStyle: { color: this._chartLine(), type: "dashed" } },
      };
    }

    _parseColor(value) {
      const text = String(value ?? "").trim();
      const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(text);
      if (short) return short.slice(1).map((part) => parseInt(part + part, 16));
      const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(text);
      if (long) return long.slice(1).map((part) => parseInt(part, 16));
      const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
      if (rgb) return rgb.slice(1, 4).map(Number);
      return null;
    }

    // Uma unidade, uma cor, em toda tela. O payback tinha paleta propria, e
    // quem lia uma unidade rosa na Visao geral a encontrava azul aqui — duas
    // legendas para a mesma coisa. Com uma fonte so, escolher a cor de uma
    // unidade na configuracao muda tambem estas barras.
    _paybackUnitColor(unitId) {
      return this._unitColor(unitId);
    }

    _paybackSummary(data) {
      const investment = this._decimalOrNull(data?.investment?.amount) ?? 0;
      const cycles = Array.isArray(data?.cycles) ? data.cycles : [];
      const unitTotals = new Map();
      const points = [];
      let accumulated = 0;
      let paidTotal = 0;
      for (const cycle of cycles) {
        const saved = this._decimalOrNull(cycle?.official_scee_savings) ?? 0;
        const paid = this._decimalOrNull(cycle?.paid_total);
        accumulated += saved;
        if (paid !== null) paidTotal += paid;
        const units = new Map();
        for (const unit of (Array.isArray(cycle?.units) ? cycle.units : [])) {
          const value = this._decimalOrNull(unit?.scee_savings) ?? 0;
          units.set(unit.unit_id, value);
          unitTotals.set(unit.unit_id, (unitTotals.get(unit.unit_id) ?? 0) + value);
        }
        // O backend lista as unidades cuja fatura ainda nao chegou. O ponto
        // entra no grafico e no recuperado, mas nao na media.
        const missingUnits = (Array.isArray(cycle?.missing_units) ? cycle.missing_units : [])
          .filter((value) => typeof value === "string");
        points.push({
          reference: cycle?.billing_reference ?? "",
          saved,
          paid,
          accumulated,
          units,
          missingUnits,
          partial: missingUnits.length > 0,
          invoicesPresent: units.size,
          invoicesExpected: units.size + missingUnits.length,
        });
      }
      const balances = (Array.isArray(data?.balances) ? data.balances : []).map((item) => ({
        unitId: item?.unit_id,
        reference: item?.billing_reference,
        kwh: this._decimalOrNull(item?.balance_kwh) ?? 0,
      }));
      const completePoints = points.filter((point) => !point.partial);
      const officialAverage = completePoints.length
        ? completePoints.reduce((total, point) => total + point.saved, 0) / completePoints.length
        : null;
      // Os indicadores de progresso usam uma base única — a combinada, do cenário
      // que ancora a leitura — para que os meses fechem entre si: corridos +
      // restantes = total. A base só oficial fica ao lado, como comparação.
      const primary = data?.scenarios?.[PRIMARY_SCENARIO];
      const baseCycles = Array.isArray(primary?.cycles) ? primary.cycles : [];
      // A janela de medição não é declarada em lugar nenhum: ela é descoberta
      // pelos ciclos em que o Recorder de fato entregou autoconsumo.
      let selfConsumptionTotal = 0;
      const selfConsumptionRefs = [];
      const selfConsumptionByRef = new Map();
      let selfConsumptionOwner = null;
      let selfConsumptionConfirmed = 0;
      let selfConsumptionPartial = 0;
      for (const item of baseCycles) {
        const value = this._decimalOrNull(item?.self_consumption_savings) ?? 0;
        selfConsumptionTotal += value;
        selfConsumptionByRef.set(item?.billing_reference ?? "", value);
        if (item?.self_consumption_unit_id) {
          selfConsumptionOwner = item.self_consumption_unit_id;
        }
        if (item?.self_consumption_financial_status !== "scenario_only") continue;
        const coverage = item?.self_consumption_coverage;
        selfConsumptionRefs.push(
          `${this._compactReference(item?.billing_reference)}`
          + `${coverage === "partial" ? "*" : ""}`,
        );
        if (coverage === "partial") selfConsumptionPartial += 1;
        else selfConsumptionConfirmed += 1;
      }
      let combined = 0;
      // O saldo de cada ciclo vem calculado do backend: aqui so se le.
      const settlement = data?.settlement ?? null;
      const surplusByRef = new Map(
        (Array.isArray(settlement?.cycles) ? settlement.cycles : [])
          .map((item) => [
            item?.billing_reference ?? "",
            this._decimalOrNull(item?.surplus) ?? 0,
          ]),
      );
      for (const point of points) {
        point.selfConsumption = selfConsumptionByRef.get(point.reference) ?? 0;
        point.total = point.saved + point.selfConsumption;
        combined += point.total;
        point.combinedAccumulated = combined;
        point.surplus = surplusByRef.get(point.reference) ?? 0;
      }
      return {
        settlement,
        selfConsumptionTotal,
        selfConsumptionCycles: selfConsumptionRefs.length,
        selfConsumptionConfirmed,
        selfConsumptionPartial,
        selfConsumptionRefs,
        selfConsumptionOwner,
        combinedTotal: accumulated + selfConsumptionTotal,
        // O backend divide cada parcela pela amostra que a produziu; replicar a
        // conta aqui reintroduziria a diluição que o contrato acabou de proibir.
        combinedAverage: this._decimalOrNull(primary?.average_monthly_savings),
        investment,
        points,
        completeCount: completePoints.length,
        partialPoints: points.filter((point) => point.partial),
        savedTotal: accumulated,
        paidTotal,
        balances,
        balanceTotal: balances.reduce((total, item) => total + item.kwh, 0),
        unitTotals,
        progress: investment > 0
          ? Math.min((accumulated + selfConsumptionTotal) / investment, 1)
          : null,
        officialProgress: investment > 0
          ? Math.min(accumulated / investment, 1)
          : null,
        monthlyAverage: officialAverage,
        currency: data?.investment?.currency ?? "BRL",
      };
    }

    _formatProjectedDuration(scenario) {
      const years = this._formatProjectedYears(scenario?.payback_years);
      const months = this._decimalOrNull(scenario?.payback_months);
      if (months === null) return years;
      const rounded = Math.round(months);
      return `${years} (${rounded} ${rounded === 1 ? "mês" : "meses"})`;
    }

    _paybackRemainingMonths(summary, { official = false } = {}) {
      const average = official ? summary.monthlyAverage : summary.combinedAverage;
      const realized = official ? summary.savedTotal : summary.combinedTotal;
      if (average === null || average <= 0) return null;
      const remaining = summary.investment - realized;
      if (remaining <= 0) return 0;
      return Math.ceil(remaining / average);
    }

    _formatMonthYear(months) {
      if (months === null) return null;
      const target = new Date();
      target.setDate(1);
      target.setMonth(target.getMonth() + months);
      const names = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
      ];
      return `${names[target.getMonth()]} de ${target.getFullYear()}`;
    }

    _formatMonthYearShort(months) {
      if (months === null) return null;
      const target = new Date();
      target.setDate(1);
      target.setMonth(target.getMonth() + months);
      const names = [
        "jan", "fev", "mar", "abr", "mai", "jun",
        "jul", "ago", "set", "out", "nov", "dez",
      ];
      return `${names[target.getMonth()]}/${target.getFullYear()}`;
    }

    _paybackKpiCard({ icon, tone, label, value, hint, explanation, rows }) {
      const card = this._element("article", `payback-kpi ${tone ?? ""}`.trim());
      const badge = this._element("span", "payback-kpi-icon");
      const glyph = this._element("ha-icon", "");
      glyph.setAttribute("icon", icon);
      badge.append(glyph);
      const body = this._element("div", "payback-kpi-body");
      body.append(
        this._element("span", "payback-kpi-label", label),
        this._element("strong", "payback-kpi-value", value),
      );
      if (hint) body.append(this._element("span", "payback-kpi-hint", hint));
      card.append(badge, body);
      if (explanation || rows?.length) {
        card.classList.add("has-detail");
        card.tabIndex = 0;
        const pop = this._element("div", "payback-kpi-pop");
        if (rows?.length) {
          const table = this._element("div", "payback-kpi-pop-rows");
          for (const row of rows) {
            const line = this._element(
              "div", `payback-kpi-pop-row${row.compact ? " compact" : ""}`,
            );
            line.append(
              this._element("span", "payback-kpi-pop-label", row.label),
              this._element("span", "payback-kpi-pop-value", row.value),
            );
            table.append(line);
          }
          pop.append(table);
        }
        if (explanation) {
          pop.append(this._element("p", "payback-kpi-pop-text", explanation));
        }
        card.append(pop);
      }
      return card;
    }

    // Duas linhas apenas: o prazo e o mesmo prazo sem a parcela hipotética. Esse
    // par já expressa a sensibilidade ao autoconsumo — e num intervalo mais largo
    // que o dos três cenários de preço, que por isso saíram do painel.
    _paybackScenarioRows(summary, months, officialMonths) {
      const rows = [];
      if (months !== null) {
        rows.push({
          label: "Fatura + Autoconsumo HA",
          compact: true,
          value: `${this._formatMonthYearShort(months)}`
            + ` · ${summary.points.length + months} meses`,
        });
      }
      rows.push({
        label: "Somente fatura, sem Autoconsumo HA",
        compact: true,
        value: officialMonths === null
          ? "—"
          : `${this._formatMonthYearShort(officialMonths)}`
            + ` · ${summary.points.length + officialMonths} meses`,
      });
      return rows;
    }

    _renderPaybackKpis(data, summary) {
      const currency = summary.currency;
      const money = (value) => this._formatOfficialMoney(this._cents(value), currency);
      const remaining = Math.max(summary.investment - summary.combinedTotal, 0);
      const months = this._paybackRemainingMonths(summary);
      const officialMonths = this._paybackRemainingMonths(summary, { official: true });
      const base = data?.scenarios?.[PRIMARY_SCENARIO] ?? {};

      const wrap = this._element("div", "payback-summary");
      const quitacao = data?.settlement ?? null;
      const quitado = quitacao?.status === "settled";

      const grid = this._element("div", "payback-kpis");
      grid.append(
        // Quitado, "falta recuperar R$ 0,00 · 0 meses restantes" e informacao
        // morta no melhor lugar da fila. O que passou a importar e o quanto ja
        // sobrou, e e esse numero que assume o cartao.
        quitado
          ? this._paybackKpiCard({
            icon: "mdi:cash-plus", tone: "positive", label: "Saldo positivo",
            value: money(this._decimalOrNull(quitacao.surplus_total) ?? 0),
            hint: `desde ${quitacao.settled_reference}`,
            explanation: "O que a economia rendeu depois de o investimento ter"
              + " voltado inteiro. Soma o crédito que a fatura abateu e o"
              + " autoconsumo do mês valorado à tarifa cheia — sem o sistema,"
              + " essa energia teria vindo da rede e sido paga. O autoconsumo é"
              + " medido em casa, não impresso em fatura: é a parcela"
              + " hipotética do cálculo.",
          })
          : this._paybackKpiCard({
            icon: "mdi:target", tone: "alert", label: "Falta recuperar",
            value: money(remaining),
            hint: months === null
              ? "Sem base para estimar"
              : `${months} ${months === 1 ? "mês restante" : "meses restantes"}`
                + " no ritmo atual",
            explanation: "Quanto o sistema ainda precisa devolver. Os meses restantes"
              + " saem deste saldo dividido pela economia média mensal"
              + " (Fatura + Autoconsumo HA).",
          }),
        this._paybackKpiCard({
          icon: "mdi:trending-up", tone: "positive",
          label: "Economia do sistema", value: money(summary.combinedTotal),
          hint: "Fatura + Autoconsumo HA",
          rows: [
            {
              label: `Confirmada em fatura (${summary.points.length} ciclos`
                + `${summary.partialPoints.length
                  ? `, ${summary.partialPoints.length} parcial` : ""})`,
              value: money(summary.savedTotal),
            },
            {
              label: `Autoconsumo HA (${summary.selfConsumptionCycles} ciclos)`,
              value: money(summary.selfConsumptionTotal),
            },
            { label: "Total do sistema", value: money(summary.combinedTotal) },
            ...(summary.selfConsumptionRefs.length
              ? [{
                label: "Medido em (* parcial)",
                value: summary.selfConsumptionRefs.join(", "),
              }]
              : []),
          ],
          explanation: "São duas parcelas. A de fatura é a diferença entre o que seria"
            + " pago pela energia compensada e o que foi pago por ela, em todas as"
            + " unidades — está comprovada nas faturas. O autoconsumo HA é"
            + " a energia gerada e consumida na hora, medida pelo sensor do Home"
            + " Assistant: a energia é real, mas nunca passou pelo medidor da"
            + " distribuidora, então o preço dela é premissa e não fatura. Ciclos"
            + " parciais entram só com os dias realmente medidos, nunca estimados.",
        }),
        this._paybackKpiCard({
          icon: "mdi:calendar-month", tone: "rate", label: "Economia média mensal",
          value: summary.combinedAverage === null ? "—" : money(summary.combinedAverage),
          hint: "Fatura + Autoconsumo HA",
          rows: [
            {
              label: `Em fatura (${summary.completeCount} ciclos)`,
              value: money(summary.monthlyAverage ?? 0),
            },
            {
              label: `Autoconsumo HA (${summary.selfConsumptionCycles} ciclos)`,
              value: money((summary.combinedAverage ?? 0) - (summary.monthlyAverage ?? 0)),
            },
            { label: "Média usada na projeção", value: money(summary.combinedAverage ?? 0) },
          ],
          explanation: "É o ritmo que projeta o prazo: o investimento dividido por esta"
            + " média dá o total de meses. Cada parcela é dividida pela própria amostra"
            + " — a de fatura pelos ciclos faturados, a de autoconsumo pelos ciclos"
            + " medidos — para que um mês sem medição não dilua o que foi medido."
            + " Mês com fatura ainda pendente fica fora da média até completar.",
        }),
        this._renderPaybackBalanceCard(summary),
      );
      wrap.append(grid);
      return wrap;
    }

    _renderPaybackBalanceCard(summary) {
      const rows = [...summary.balances]
        .sort((a, b) => b.kwh - a.kwh)
        .map((item) => {
          const share = summary.balanceTotal > 0
            ? ` · ${((item.kwh / summary.balanceTotal) * 100).toFixed(0)}%`
            : "";
          return {
            label: this._unitLabel(item.unitId)
              + (item.reference ? ` (${item.reference})` : ""),
            value: `${this._formatOfficialDecimal(item.kwh.toFixed(0))} kWh${share}`,
          };
        });
      return this._paybackKpiCard({
        icon: "mdi:battery-charging-medium", tone: "stored",
        label: "Saldo em crédito",
        value: `${this._formatOfficialDecimal(summary.balanceTotal.toFixed(0))} kWh`,
        hint: "Gerado, ainda não monetizado",
        rows,
        explanation: "Energia já gerada que ainda não virou desconto."
          + " Entra na economia quando for consumida.",
      });
    }

    _formatPeriodLabel(period) {
      if (typeof period !== "string") return null;
      const match = /^(\d{4})-(\d{2})$/.exec(period);
      if (!match) return period;
      const names = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
      ];
      const month = Number(match[2]);
      if (month < 1 || month > 12) return period;
      return `${names[month - 1]} de ${match[1]}`;
    }

    // Faixa de destaque. O painel responde tres perguntas — quanto custou,
    // quanto voltou e quando termina — e antes as tres tinham o mesmo peso
    // visual de "saldo em credito", com o investimento e o recuperado repetidos
    // entre o anel e os cartoes. Aqui elas viram a leitura principal, uma vez
    // so, e os cartoes ficam com o que e complemento.
    _renderPaybackHero(data, summary) {
      const hero = this._element("div", "payback-hero");
      const money = (value) => this._formatOfficialMoney(
        this._cents(value), summary.currency,
      );
      const clamp = (value) => Math.min(Math.max(value ?? 0, 0), 1) * 100;
      const official = clamp(summary.officialProgress);
      const total = Math.max(clamp(summary.progress), official);

      const ring = this._element("div", "payback-header-ring");
      ring.style.setProperty("--co-ring-official", `${official}%`);
      ring.style.setProperty("--co-ring-total", `${total}%`);
      const gauge = this._element("div", "payback-header-badge");
      const gaugeBody = this._element("div", "payback-header-ring-body");
      gaugeBody.append(
        this._element("span", "payback-header-badge-label", "recuperado"),
        this._element("strong", "payback-header-badge-value",
          summary.progress === null
            ? "—"
            : `${(summary.progress * 100).toFixed(1).replace(".", ",")}%`),
      );
      gauge.append(ring, gaugeBody);

      const recovered = this._element("div", "payback-hero-block");
      recovered.append(
        this._element("span", "payback-hero-label", "recuperado ate agora"),
        this._element("strong", "payback-hero-value", money(summary.combinedTotal)),
        this._element("span", "payback-hero-sub",
          `de ${money(summary.investment)} investidos`),
      );
      // A composicao fica visivel em vez de escondida no hover: e ela que
      // distingue o que a fatura provou do que so foi medido em casa.
      const split = this._element("div", "payback-hero-split");
      split.append(
        this._paybackHeroChip("fatura", money(summary.savedTotal), "official"),
        this._paybackHeroChip(
          "autoconsumo HA", money(summary.selfConsumptionTotal), "estimated",
        ),
      );
      recovered.append(split);

      const quitacao = data?.settlement ?? null;
      const eta = this._element("div", "payback-hero-block eta");
      // Quitado, a previsao perde a razao de existir: o que a pessoa quer
      // saber deixou de ser quando vai acontecer e passou a ser quando
      // aconteceu.
      if (quitacao?.status === "settled") {
        eta.classList.add("settled");
        eta.append(
          this._element("span", "payback-hero-label", "sistema quitado em"),
          this._element("strong", "payback-hero-value accent",
            quitacao.settled_reference ?? "—"),
          // O valor do saldo mora no cartao "Saldo positivo", logo abaixo.
          // Repeti-lo aqui poria o mesmo numero duas vezes na mesma dobra.
          this._element("span", "payback-hero-sub",
            "a partir daí, cada ciclo é saldo positivo"),
        );
      } else {
        const months = this._paybackRemainingMonths(summary);
        eta.append(
          this._element("span", "payback-hero-label", "previsao de quitacao"),
          this._element("strong", "payback-hero-value accent",
            this._formatMonthYear(months) ?? "—"),
          this._element("span", "payback-hero-sub", months === null
            ? "sem base para estimar"
            : `mes ${summary.points.length} de ${summary.points.length + months}`
              + ` · faltam ${months}`),
        );
      }
      hero.append(gauge, recovered, eta);
      return hero;
    }

    _paybackHeroChip(label, value, kind) {
      const chip = this._element("span", `payback-hero-chip ${kind}`);
      chip.append(
        this._element("i", "payback-hero-dot"),
        this._element("span", "", `${label} ${value}`),
      );
      return chip;
    }

    _renderPaybackLegend(summary) {
      const wrap = this._element("div", "payback-legend-wrap");
      const legend = this._element("div", "payback-legend");
      // No modo curva nenhuma unidade e desenhada: listar as cores delas
      // mandaria procurar no grafico o que nao esta la.
      if (this._paybackChartMode === "curve") {
        const abaixo = this._element("span", "payback-legend-item");
        abaixo.append(
          this._element("i", "payback-legend-area owing"),
          this._element("span", "", "Falta recuperar"),
        );
        const acima = this._element("span", "payback-legend-item");
        acima.append(
          this._element("i", "payback-legend-area surplus"),
          this._element("span", "", "Saldo positivo"),
        );
        const zero = this._element("span", "payback-legend-item");
        zero.title = "Onde o investimento termina de voltar.";
        zero.append(
          this._element("i", "payback-legend-line accumulated"),
          this._element("span", "", "Pago"),
          this._element(
            "span", "payback-legend-note",
            "— a linha do zero; cada ponto é um ciclo",
          ),
        );
        legend.append(abaixo, acima, zero);
        wrap.append(legend);
        return wrap;
      }
      const owner = summary.selfConsumptionOwner;
      const totals = new Map(summary.unitTotals);
      if (owner && summary.selfConsumptionTotal > 0) {
        totals.set(owner, (totals.get(owner) ?? 0) + summary.selfConsumptionTotal);
      }
      const total = summary.combinedTotal;
      const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
      for (const [unitId, value] of entries) {
        const share = total > 0 ? (value / total) * 100 : 0;
        const item = this._element("span", "payback-legend-item");
        const dot = this._element("i", "payback-legend-dot");
        dot.style.background = this._paybackUnitColor(unitId);
        const suffix = unitId === owner && summary.selfConsumptionTotal > 0
          ? ", inclui autoconsumo HA"
          : "";
        item.append(dot, this._element(
          "span", "",
          `${this._unitLabel(unitId)} · ${share.toFixed(0)}%`
          + ` (${this._formatOfficialMoney(this._cents(value), summary.currency)}${suffix})`,
        ));
        legend.append(item);
      }

      const accumulated = this._element("span", "payback-legend-item");
      accumulated.append(
        this._element("i", "payback-legend-line accumulated"),
        this._element("span", "", "Economia acumulada"),
      );
      const target = this._element("span", "payback-legend-item");
      target.title = "Quando a linha branca alcançar a tracejada,"
        + " o investimento estará recuperado.";
      target.append(
        this._element("i", "payback-legend-line investment"),
        this._element("span", "", "Investimento"),
        this._element("span", "payback-legend-note", "— ao cruzarem, o sistema está pago"),
      );
      if (summary.partialPoints.length) {
        const partial = this._element("span", "payback-legend-item");
        partial.title = "Cada unidade soma assim que a própria fatura chega."
          + " O mês completa quando a última fatura entrar.";
        partial.append(
          this._element("i", "payback-legend-dot partial"),
          this._element("span", "", "Mês parcial"),
          this._element("span", "payback-legend-note", "— faturas ainda chegando"),
        );
        legend.append(partial);
      }
      legend.append(accumulated, target);

      wrap.append(legend);
      return wrap;
    }

    _renderPaybackMetadata(data, summary) {
      const metadata = this._element("div", "payback-projection-metadata");
      const method = data?.method ?? {};
      const count = Number.isInteger(method.eligible_cycle_count)
        && method.eligible_cycle_count >= 0 ? method.eligible_cycle_count : null;
      const cycleText = count === null
        ? "Base da projeção indisponível"
        : `${count} ${count === 1 ? "ciclo confirmado" : "ciclos confirmados"}`;
      const partial = summary.partialPoints.map((point) => point.reference);
      const sample = this._element("span", "", `Base da projeção: ${cycleText}`
        + (partial.length ? ` · ${partial.join(", ")} parcial, fora da média` : ""));
      const references = Array.isArray(method.eligible_references)
        ? method.eligible_references.filter((value) => typeof value === "string") : [];
      if (references.length) sample.title = references.join(", ");
      metadata.append(sample, this._element("span", "",
        `Pago no período: ${this._formatOfficialMoney(
          this._cents(summary.paidTotal), summary.currency,
        )}`));
      return metadata;
    }

    // Auditoria: mostra os operandos que o backend usou e o resultado que ele
    // produziu, lado a lado. O frontend NÃO recalcula nada aqui — se a linha não
    // fechar, o erro é do backend e é exatamente isso que a tela serve para
    // revelar. Todo valor exibido vem pronto da API.
    _renderPaybackAudit(data, summary) {
      const cycles = Array.isArray(data?.cycles) ? data.cycles : [];
      if (!cycles.length) return null;
      const scenario = data?.scenarios?.[PRIMARY_SCENARIO];
      const hypothetical = new Map(
        (Array.isArray(scenario?.cycles) ? scenario.cycles : [])
          .map((item) => [item?.billing_reference, item]),
      );
      const box = this._element("details", "payback-audit");
      box.append(this._element("summary", "payback-audit-title", "Detalhamento por ciclo"));
      // O texto espelha os três grupos de colunas da tabela, uma regra por
      // grupo: assim o leitor encontra a conta olhando para o mesmo bloco em
      // que ela acontece, em vez de garimpar num parágrafo corrido.
      const legend = this._element("div", "payback-audit-formula");
      for (const [group, rule] of [
        ["Valor da energia compensada",
          "preço unitário = tarifa com tributos + bandeira ·"
          + " valor cheio = compensada × preço unitário"],
        ["O que a fatura cobrou",
          "as seis parcelas somam o valor oficial da fatura"],
        ["Resultado",
          "economia = fatura sem o crédito − fatura paga"],
      ]) {
        const rowText = this._element("p", "payback-audit-rule");
        rowText.append(
          this._element("strong", "", group),
          this._element("span", "", ` — ${rule}`),
        );
        legend.append(rowText);
      }
      legend.append(this._element(
        "p", "payback-audit-note",
        "A tarifa com tributos é a homologada da distribuidora elevada pelo PIS,"
        + " COFINS e ICMS da própria fatura, e não inclui encargos. Sai da fatura"
        + " da unidade; quem compensou todo o consumo não publica tarifa, e só"
        + " nesse caso vale a do mês.",
      ));
      box.append(legend);
      for (const cycle of cycles) {
        box.append(this._paybackAuditCycle(cycle, hypothetical, summary));
      }
      return box;
    }

    _paybackAuditCycle(cycle, hypothetical, summary) {
      const currency = summary.currency;
      const money = (value) => (value === null || value === undefined
        ? "—"
        : this._formatOfficialMoney(this._truncateDecimals(value, 2), currency));
      // O autoconsumo vem do Recorder e carrega ruído de ponto flutuante
      // (108,27999999999975 kWh). Cortar é só apresentação: o valor usado na
      // conta continua sendo o medido, e por isso corta em vez de arredondar.
      const decimal = (value, places) => {
        if (value === null || value === undefined) return "—";
        let text = String(value);
        if (places !== undefined && text.includes(".")) {
          const [whole, fraction] = text.split(".");
          text = `${whole}.${fraction.slice(0, places)}`.replace(/\.$/, "");
        }
        return this._formatOfficialDecimal(text);
      };
      const reference = cycle?.billing_reference ?? "";
      const extra = hypothetical.get(reference);
      const selfSavings = this._decimalOrNull(extra?.self_consumption_savings) ?? 0;

      const block = this._element("details", "payback-audit-cycle");
      const head = this._element("summary", "payback-audit-cycle-title");
      head.append(
        this._element("strong", "", reference),
        this._element("span", "payback-audit-cycle-total",
          `economia ${money(cycle?.official_scee_savings)}`
          + (selfSavings > 0 ? ` + ${money(extra?.self_consumption_savings)} autoconsumo` : "")),
      );
      const missing = (Array.isArray(cycle?.missing_units) ? cycle.missing_units : [])
        .filter((value) => typeof value === "string");
      if (missing.length) {
        head.insertBefore(this._element(
          "span", "payback-audit-partial",
          `parcial · aguardando ${missing.map((id) => this._unitLabel(id)).join(", ")}`,
        ), head.children[1]);
      }
      block.append(head);

      const basis = this._paybackTariffBasis(cycle?.full_tariff_basis);
      if (basis) block.append(basis);

      const scroll = this._element("div", "payback-audit-scroll");
      const table = this._element("table", "payback-audit-table");
      const groupRow = this._element("tr", "payback-audit-groups");
      for (const group of _AUDIT_GROUPS) {
        const cell = this._element("th", "", group.label);
        cell.colSpan = group.span;
        groupRow.append(cell);
      }
      const headRow = this._element("tr", "");
      for (const label of _AUDIT_COLUMNS) {
        headRow.append(this._element("th", "", label));
      }
      const thead = this._element("thead", "");
      thead.append(groupRow, headRow);
      table.append(thead);

      const body = this._element("tbody", "");
      for (const unit of (Array.isArray(cycle?.units) ? cycle.units : [])) {
        const parts = unit?.derivation;
        const row = this._element("tr", parts ? "" : "muted");
        const tariff = this._element("td", "", parts ? decimal(parts.full_tariff) : "—");
        if (parts) {
          const origin = parts.full_tariff_origin;
          const from = (parts.full_tariff_sources ?? []).map((id) => this._unitLabel(id));
          if (origin === "month_reference") {
            tariff.append(this._element(
              "small", "payback-audit-source", `da fatura de ${from.join(" / ")}`,
            ));
          }
          tariff.title = {
            own_invoice_taxes: "Tarifa homologada da distribuidora, sem tributos e"
              + " configurada por ano, elevada pelas alíquotas de PIS, COFINS e"
              + " ICMS desta fatura. Não inclui multa, juros nem iluminação"
              + " pública, que são encargos e não preço de energia.",
            own_invoice: "Publicada nesta fatura, no item de consumo não compensado.",
          }[origin] ?? "Esta unidade compensou todo o consumo, então não tem linha de"
            + " consumo não compensado e não publica tarifa. Vale a tarifa do mês,"
            + ` regulada e igual para todos — aqui da fatura de ${from.join(", ")}.`;
        }
        row.append(
          this._element("td", "", this._unitLabel(unit?.unit_id)),
          this._element("td", "", parts ? `${decimal(parts.compensated_kwh)} kWh` : "—"),
          tariff,
          this._element("td", "", parts && Number(parts.flag_tariff) !== 0
            ? decimal(parts.flag_tariff) : "—"),
          this._element("td", "", parts ? decimal(parts.unit_price) : "—"),
          this._element("td", "", parts ? money(parts.gross_value) : "—"),
          this._element("td", "", parts ? money(parts.transition_paid) : "—"),
          this._paybackAuditNonCompensated(parts, money),
          this._element("td", "", parts && Number(parts.flag_charged) !== 0
            ? money(parts.flag_charged) : "—"),
          this._element("td", "", money(unit?.public_lighting)),
          this._element("td", "", this._paybackAuditPenalties(unit, money)),
          this._paybackAuditOtherItems(parts, money),
          this._element("td", "", money(unit?.paid_total)),
          this._paybackAuditWithoutCredit(parts, money),
          this._element("td", "payback-audit-value", money(unit?.scee_savings)),
        );
        if (!parts) row.title = this._paybackAuditStatus(unit?.status);
        body.append(this._labelAuditCells(row));
        if (unit?.unit_id === extra?.self_consumption_unit_id && selfSavings > 0) {
          body.append(this._paybackAuditSelfRow(extra, money, decimal));
        }
      }
      // Rede de segurança: se a unidade geradora não estiver entre as faturas do
      // ciclo, a linha do autoconsumo ainda precisa aparecer em algum lugar.
      if (selfSavings > 0 && !body.querySelector(".hypothetical")) {
        body.append(this._paybackAuditSelfRow(extra, money, decimal));
      }
      table.append(body);
      scroll.append(table);
      block.append(scroll);
      block.append(this._paybackAuditFooter(cycle, summary));
      return block;
    }

    // A tarifa cheia não é calculada pelo motor: ele lê a tarifa já com tributos
    // que a distribuidora imprimiu. Este bloco mostra a origem e, quando a
    // fatura publica as alíquotas, a conta que reconstrói aquele número — para
    // conferência, nunca como fonte do valor usado.
    _paybackTariffBasis(basis) {
      if (!basis || basis.value === null || basis.value === undefined) return null;
      const decimal = (value) => this._formatOfficialDecimal(String(value));
      const box = this._element("div", "payback-audit-tariff");
      const rates = ["without_taxes", "pis_percent", "cofins_percent", "icms_percent"];
      const line = this._element("span", "payback-audit-tariff-head");
      const complete = rates
        .every((name) => basis[name] !== null && basis[name] !== undefined);
      // A conta é lida da esquerda para a direita e termina no resultado: o
      // título anuncia o cálculo, os passos aparecem no meio e o valor usado
      // fecha a linha em destaque, no lugar onde a leitura naturalmente para.
      line.append(this._element(
        "span", "payback-audit-tariff-label",
        complete ? "Cálculo tarifa com tributos =" : "Tarifa com tributos",
      ));
      if (complete) {
        // Cada divisor aparece já resolvido ao lado da sua origem, e cada
        // divisão mostra o próprio resultado: assim a conta pode ser conferida
        // passo a passo sem ninguém precisar dividir de cabeça. Os pedaços são
        // `nowrap` para a linha se dobrar entre eles, nunca no meio de um número.
        const cut = (value) => this._truncateDecimals(value, 6);
        for (const part of [
          `${decimal(basis.without_taxes)} valor da tarifa na fatura`,
          `÷ ${cut(basis.pis_cofins_divisor)}`
            + ` (1 − ${decimal(basis.pis_percent)}% PIS`
            + ` − ${decimal(basis.cofins_percent)}% COFINS)`,
          `= ${cut(basis.after_pis_cofins)}`,
          `÷ ${cut(basis.icms_divisor)} (1 − ${decimal(basis.icms_percent)}% ICMS)`,
          "=",
        ]) {
          line.append(this._element("span", "payback-audit-tariff-step", part));
        }
      }
      line.append(this._element(
        "strong", "payback-audit-tariff-value",
        `${decimal(basis.value)} R$/kWh`,
      ));
      box.append(line);
      return box;
    }

    // Fica logo abaixo da unidade geradora, porque o autoconsumo é dela: lida em
    // sequência, a dupla mostra o que passou pelo medidor e o que não passou.
    _paybackAuditSelfRow(extra, money, decimal) {
      const row = this._element("tr", "hypothetical");
      const owner = extra?.self_consumption_unit_id;
      row.append(
        this._element("td", "", `Autoconsumo HA${owner ? ` · ${this._unitLabel(owner)}` : ""}`),
        this._element("td", "", `${decimal(extra?.self_consumption_kwh, 2)} kWh`),
        this._element("td", "", decimal(extra?.non_compensated_tariff)),
        this._element("td", "", Number(extra?.flag_tariff) !== 0
          ? decimal(extra?.flag_tariff) : "—"),
        this._element("td", "", decimal(extra?.self_consumption_unit_price)),
        // Sem fio B a subtrair, o valor cheio e a economia são o mesmo número:
        // nada foi cobrado sobre energia que não passou pelo medidor.
        this._element("td", "", money(extra?.self_consumption_savings)),
        this._element("td", "", "—"),
        this._element("td", "", "—"),
        this._element("td", "", "—"),
        this._element("td", "", "—"),
        this._element("td", "", "—"),
        this._element("td", "", "—"),
        this._element("td", "", "—"),
        this._element("td", "", "—"),
        this._element("td", "payback-audit-value", money(extra?.self_consumption_savings)),
      );
      row.title = "Energia que nunca passou pelo medidor: não há fio B cobrado"
        + " sobre ela, então a economia é o valor cheio."
        + (extra?.self_consumption_coverage === "partial"
          ? " Ciclo de cobertura parcial: entra só com os dias medidos."
          : "");
      return this._labelAuditCells(row);
    }

    _paybackAuditNonCompensated(parts, money) {
      const cell = this._element("td", "");
      if (!parts || Number(parts.non_compensated_value) === 0) {
        cell.textContent = "—";
        return cell;
      }
      cell.textContent = money(parts.non_compensated_value);
      cell.title = `${this._formatOfficialDecimal(String(parts.non_compensated_kwh))} kWh`
        + " que vieram da rede e não foram compensados. Sem o sistema você"
        + " pagaria por eles do mesmo jeito, então entram nas duas faturas.";
      return cell;
    }

    // Saco genérico: tudo que a fatura cobra e que nenhuma coluna nomeada
    // representa. Existe para a linha continuar fechando quando aparecer um item
    // novo — foi assim que o bônus de Itaipu ficou invisível até agosto.
    _paybackAuditOtherItems(parts, money) {
      const cell = this._element("td", "");
      const detail = parts?.other_items_detail ?? [];
      if (!parts || !detail.length) {
        cell.textContent = "—";
        return cell;
      }
      cell.textContent = money(parts.other_items);
      cell.title = detail
        .map((entry) => `${entry.code}: ${money(entry.value)}`)
        .join("\n");
      return cell;
    }

    // A fatura sem crédito é publicada de dois jeitos: derivada de
    // `paga + economia` e construída dos componentes. A derivada não pode
    // discordar da economia nem quando o motor erra; a construída pode. Quando
    // as duas divergem, a célula avisa, porque aí há algo a investigar.
    _paybackAuditWithoutCredit(parts, money) {
      const cell = this._element("td", "");
      if (!parts) {
        cell.textContent = "—";
        return cell;
      }
      cell.textContent = money(parts.bill_without_credit);
      const gap = this._decimalOrNull(parts.bill_without_credit_mismatch);
      if (gap !== null && Math.abs(gap) >= 0.01) {
        cell.classList.add("mismatch");
        cell.append(this._element(
          "small", "payback-audit-source",
          `montada: ${money(parts.bill_without_credit_built)}`,
        ));
        cell.title = "A fatura montada a partir dos itens não bate com a derivada"
          + ` da economia. Diferença de ${money(String(gap))}.`;
      } else {
        cell.title = "Confere com a mesma fatura montada item a item.";
      }
      return cell;
    }

    _paybackAuditPenalties(unit, money) {
      const parts = [unit?.interest, unit?.fine]
        .filter((value) => value !== null && value !== undefined && Number(value) !== 0);
      if (!parts.length) return "—";
      return parts.map((value) => money(value)).join(" + ");
    }

    // No celular a tabela deixa de ser tabela: cada linha vira um bloco e cada
    // célula carrega o nome da própria coluna. Doze colunas nunca caberiam numa
    // tela de telefone, e arrastar lateralmente esconde metade da auditoria.
    _labelAuditCells(row) {
      row.querySelectorAll("td").forEach((cell, index) => {
        if (_AUDIT_COLUMNS[index]) cell.dataset.label = _AUDIT_COLUMNS[index];
        // Célula vazia some no empilhado: no formato tabela um traço alinha a
        // coluna, mas no cartão do celular ele vira uma linha inteira sem
        // conteúdo, e a linha do autoconsumo teria oito delas.
        if (cell.textContent.trim() === "—") cell.dataset.empty = "";
      });
      return row;
    }

    _paybackAuditStatus(status) {
      return {
        no_credit: "Unidade sem crédito SCEE neste ciclo: não entra na conta.",
        unconfirmed: "Economia não confirmada neste ciclo: entra como zero.",
      }[status] ?? "Sem detalhamento disponível para este ciclo.";
    }

    _paybackAuditFooter(cycle, summary) {
      const foot = this._element("div", "payback-audit-foot");
      const paid = this._decimalOrNull(cycle?.paid_total);
      const saved = this._decimalOrNull(cycle?.official_scee_savings) ?? 0;
      const money = (value) => this._formatOfficialMoney(this._cents(value), summary.currency);
      foot.append(this._element(
        "span", "",
        paid === null
          ? "Pago no ciclo: indisponível"
          : `Pago no ciclo: ${money(paid)} · sem o crédito SCEE seria`
            + ` ${money(paid + saved)}`,
      ));
      return foot;
    }

    _renderFinanceItem(item, currency) {
      const card = this._element("article", "finance-item");
      const heading = this._element("div", "finance-item-heading");
      heading.append(
        this._element("strong", "finance-item-description", item?.description ?? "Item da fatura"),
        this._element("strong", `finance-item-value ${item?.nature === "credito" ? "credit" : "charge"}`,
          this._formatOfficialMoney(item?.value, currency)),
      );
      const metadata = this._element("div", "finance-item-metadata");
      metadata.append(
        this._element("span", "", item?.nature === "credito" ? "Crédito" : "Cobrança"),
        this._element("span", "", item?.category ?? "Categoria não informada"),
      );
      card.append(heading, metadata);
      const attributes = this._element("div", "finance-item-attributes");
      if (item?.quantity !== null && item?.quantity !== undefined) {
        const quantity = this._formatOfficialDecimal(item.quantity);
        attributes.append(this._field(
          "Quantidade",
          item.unit ? `${quantity} ${item.unit}` : quantity,
        ));
      }
      if (item?.tariff_with_taxes !== null && item?.tariff_with_taxes !== undefined) {
        attributes.append(this._field(
          "Preço unitário com tributos",
          this._formatOfficialMoney(item.tariff_with_taxes, currency),
        ));
      }
      if (item?.tariff_without_taxes !== null && item?.tariff_without_taxes !== undefined) {
        attributes.append(this._field(
          "Tarifa unitária",
          this._formatOfficialMoney(item.tariff_without_taxes, currency),
        ));
      }
      if (attributes.childElementCount > 0) card.append(attributes);
      return card;
    }

    _renderFinance() {
      const section = this._element("section", "panel block finance-section");
      section.dataset.financeSection = "";
      const header = this._element("header", "finance-header");
      const heading = this._element("div", "finance-heading");
      heading.append(
        this._element("h3", "section-title", "Financeiro oficial"),
        this._element("span", "finance-official-badge", "OFICIAL DA FATURA"),
      );
      header.append(heading);
      section.append(header);

      const reference = this._financeReference();
      const key = this._financeKey();
      const data = reference ? this._financeCache.get(key) : null;
      const error = reference ? this._financeErrors.get(key) : null;
      const loading = reference ? this._financeInFlight.has(key) : false;
      if (!reference) {
        section.append(this._historyStatus(
          this._cyclesCatalogInFlight.has(this._selectedUnit)
            ? "Carregando referências financeiras oficiais..."
            : "Não há fatura oficial para esta referência.",
          this._cyclesCatalogInFlight.has(this._selectedUnit)
            ? "loading compact" : "compact",
        ));
        return section;
      }
      if (!data && loading) {
        section.append(this._historyStatus(
          "Carregando dados financeiros oficiais...", "loading compact",
        ));
        return section;
      }
      if (!data && error) {
        const messages = {
          not_found: "Não há fatura oficial para esta referência.",
          unavailable: "Os dados financeiros oficiais estão indisponíveis no momento.",
          error: "Não foi possível carregar os dados financeiros oficiais.",
        };
        section.append(this._element("div", "finance-error", messages[error]));
        return section;
      }
      if (!data) {
        section.append(this._historyStatus(
          "Carregando dados financeiros oficiais...", "loading compact",
        ));
        return section;
      }

      const official = data.official ?? {};
      const currency = data.currency ?? "BRL";
      const summary = this._element("div", "finance-summary");
      const entries = [
        ["Total da fatura", official.bill_total, "primary"],
        ["Tributos", official.taxes_total, ""],
        ["CIP/COSIP", official.cip_cosip, ""],
        ["Juros", official.interest, ""],
        ["Multa", official.fine, ""],
        ["Créditos financeiros", official.financial_credits, ""],
      ];
      for (const [label, value, modifier] of entries) {
        const metric = this._element("div", `finance-summary-item ${modifier}`.trim());
        metric.append(
          this._element("span", "finance-summary-label", label),
          this._element("strong", "finance-summary-value", this._formatOfficialMoney(value, currency)),
        );
        summary.append(metric);
      }

      const details = this._element("details", "finance-details");
      details.append(this._element("summary", "finance-details-summary", "Detalhamento da fatura"));
      const body = this._element("div", "finance-details-body");
      const period = data.period ?? {};
      body.append(this._element(
        "p", "finance-period",
        `${data.billing_reference ?? reference} · ${this._formatSceeDate(period.start)} → ${this._formatSceeDate(period.end)}`,
      ));
      const items = Array.isArray(data.items) ? data.items : [];
      const list = this._element("div", "finance-items");
      for (const item of items) list.append(this._renderFinanceItem(item, currency));
      if (items.length === 0) {
        list.append(this._element("p", "empty", "Nenhum item oficial informado."));
      }
      body.append(list);
      const reconciliation = data.reconciliation ?? {};
      const reconciliationBox = this._element(
        "div",
        `finance-reconciliation ${reconciliation.reconciled === false ? "warning" : "ok"}`,
      );
      const reconciliationMessage = reconciliation.reconciled === true
        ? "Itens conferem com o total oficial."
        : reconciliation.reconciled === false
          ? "Os itens não reconciliam com o total oficial."
          : "Reconciliação não informada.";
      reconciliationBox.append(
        this._element("strong", "", reconciliationMessage),
        this._element(
          "span", "",
          `Total dos itens: ${this._formatOfficialMoney(reconciliation.items_total, currency)} · Diferença: ${this._formatOfficialMoney(reconciliation.difference, currency)}`,
        ),
      );
      body.append(reconciliationBox);
      details.append(body);
      section.append(summary, details);
      return section;
    }

    _renderSelfConsumption() {
      if (this._selectedUnit !== this._generator) return null;

      const section = this._element("section", "panel block self-consumption-section");
      section.dataset.selfConsumptionSection = "";
      section.append(this._element("h3", "section-title", "Autoconsumo físico calculado"));

      const cycle = this._selectedCycle();
      const reference = cycle?.status === "closed"
        && typeof cycle.billing_reference === "string"
        ? cycle.billing_reference
        : null;
      const key = this._selfConsumptionKey();
      const data = reference ? this._selfConsumptionCache.get(key) : null;
      const error = reference ? this._selfConsumptionErrors.get(key) : null;
      const loading = reference ? this._selfConsumptionInFlight.has(key) : false;

      if (!reference) {
        section.append(this._historyStatus(
          this._cyclesCatalogInFlight.has(this._generator)
            ? "Carregando referências de medição…"
            : "Autoconsumo disponível para faturas oficiais fechadas.",
          this._cyclesCatalogInFlight.has(this._generator)
            ? "loading compact" : "compact",
        ));
        return section;
      }

      if (!data && loading) {
        section.append(this._historyStatus(
          "Carregando autoconsumo físico…", "loading compact",
        ));
        return section;
      }

      if (!data && error) {
        const messages = {
          not_found: "Não há dados de autoconsumo para esta referência.",
          unavailable: "Os dados de autoconsumo físico estão indisponíveis no momento.",
          error: "Não foi possível carregar o autoconsumo físico.",
        };
        const errorBox = this._element(
          "div", "self-consumption-error", messages[error] ?? messages.error,
        );
        errorBox.append(this._button("Tentar novamente", "self-consumption-retry"));
        section.append(errorBox);
        return section;
      }

      if (!data) {
        section.append(this._historyStatus(
          "Carregando autoconsumo físico…", "loading compact",
        ));
        return section;
      }

      const status = data.status ?? "unavailable";
      const energy = data.energy && typeof data.energy === "object" ? data.energy : {};
      const blockers = Array.isArray(data.blockers) ? data.blockers : [];

      const statusConfig = {
        confirmed: {
          label: "Confirmado",
          badgeClass: "sc-badge sc-confirmed",
          description: "Autoconsumo calculado a partir do histórico de geração e exportação.",
        },
        partial: {
          label: "Parcial",
          badgeClass: "sc-badge sc-partial",
          description: "Valor observado no período disponível. O ciclo possui lacunas na medição e não foi extrapolado.",
        },
        unavailable: {
          label: "Indisponível",
          badgeClass: "sc-badge sc-unavailable",
          description: blockers.includes("invalid_billing_period")
            ? "Não há período de medição válido disponível para esta referência."
            : "Dados de medição indisponíveis para esta referência.",
        },
      }[status] ?? {
        label: "Indisponível",
        badgeClass: "sc-badge sc-unavailable",
        description: "Dados de medição indisponíveis para esta referência.",
      };

      const summary = this._element("div", "self-consumption-summary");
      const mainMetric = this._element("div", "self-consumption-main");
      const mainHeader = this._element("div", "self-consumption-main-header");
      mainHeader.append(
        this._element("span", "self-consumption-label", "Autoconsumo solar"),
        this._element("span", statusConfig.badgeClass, statusConfig.label),
      );
      const valueFormatted = typeof energy.self_consumption_kwh === "number"
        ? this._valueWithUnit(energy.self_consumption_kwh, "kWh", 1)
        : "—";

      mainMetric.append(
        mainHeader,
        this._element("strong", "self-consumption-value", valueFormatted),
        this._element("p", "self-consumption-description", statusConfig.description),
      );
      summary.append(mainMetric);

      const period = data.period && typeof data.period === "object" ? data.period : {};
      if (period.from && period.until) {
        const periodBox = this._element("div", "self-consumption-period-box");
        periodBox.append(
          this._element(
            "span", "self-consumption-period-label",
            `Período do ciclo: ${this._formatSceeDate(period.from)} → ${this._formatSceeDate(period.until)}`,
          ),
        );
        summary.append(periodBox);
      }

      section.append(summary);
      return section;
    }

    _formatSceeEnergy(value) {
      if (value === null || value === undefined) return "Não informado";
      return `${this._formatNumber(value, 2, 2)} kWh`;
    }

    _formatSceePercent(value) {
      if (value === null || value === undefined) return "Não informado";
      return `${this._formatNumber(value, 3)}%`;
    }

    _formatSceeDate(value) {
      if (value === null || value === undefined) return "Não informado";
      const formatted = this._formatDate(value);
      return formatted === "—" ? "Não informado" : formatted;
    }

    _renderScee() {
      const section = this._element("section", "panel block scee-section");
      section.dataset.sceeSection = "";
      const header = this._element("header", "scee-header");
      header.append(this._element("h3", "section-title", "SCEE e créditos"));
      section.append(header);

      const reference = this._sceeReference();
      const key = this._sceeKey();
      const data = reference ? this._sceeCache.get(key) : null;
      const error = reference ? this._sceeErrors.get(key) : null;
      const loading = reference ? this._sceeInFlight.has(key) : false;
      if (!reference) {
        section.append(this._historyStatus(
          this._cyclesCatalogInFlight.has(this._selectedUnit)
            ? "Carregando referências SCEE…"
            : "SCEE disponível para faturas oficiais fechadas.",
          this._cyclesCatalogInFlight.has(this._selectedUnit)
            ? "loading compact"
            : "compact",
        ));
        return section;
      }
      if (!data && loading) {
        section.append(this._historyStatus("Carregando SCEE…", "loading compact"));
        return section;
      }
      if (!data && error) {
        section.append(this._element("div", "scee-error", error));
        return section;
      }
      if (!data) {
        section.append(this._historyStatus(
          "SCEE disponível para faturas oficiais fechadas.", "compact",
        ));
        return section;
      }

      const official = data.official && typeof data.official === "object"
        ? data.official
        : {};
      const period = data.period && typeof data.period === "object"
        ? data.period
        : {};
      const extraction = data.extraction && typeof data.extraction === "object"
        ? data.extraction
        : {};
      const metadata = this._element("div", "scee-metadata");
      metadata.append(
        this._field(
          "Período da fatura",
          `${this._formatSceeDate(period.start)} → ${this._formatSceeDate(period.end)}`,
        ),
      );
      if (official.applicable !== false) {
        metadata.append(
          this._field("Ciclo SCEE", official.scee_cycle ?? "Não informado"),
        );
      }

      if (official.applicable === false) {
        const notApplicable = this._element(
          "div",
          "scee-not-applicable",
          "SCEE não aplicável nesta referência",
        );
        const extractionBlock = this._element("div", "scee-extraction");
        extractionBlock.append(this._field(
          "Extração",
          extraction.status ?? "Não informado",
        ));
        const alerts = Array.isArray(extraction.alerts) ? extraction.alerts : [];
        if (alerts.length > 0) {
          const disclosure = this._element("details", "scee-alerts");
          disclosure.append(this._element(
            "summary", "", `Alertas da extração (${alerts.length})`,
          ));
          const list = this._element("ul", "scee-alert-list");
          for (const alert of alerts) list.append(this._element("li", "", alert));
          disclosure.append(list);
          extractionBlock.append(disclosure);
        }
        section.append(metadata, notApplicable, extractionBlock);
        return section;
      }

      const primary = this._element("div", "scee-primary-grid");
      for (const [label, value] of [
        ["Consumo SCEE", official.consumption_scee_kwh],
        ["Energia compensada", official.energy_compensated_kwh],
        ["Consumo não compensado", official.non_compensated_consumption_kwh],
        ["Crédito recebido", official.credit_received_kwh],
        ["Excedente recebido", official.excess_received_kwh],
        ["Saldo", official.balance_kwh],
      ]) {
        primary.append(this._field(label, this._formatSceeEnergy(value)));
      }

      const secondary = this._element("div", "scee-secondary-grid");
      secondary.append(
        this._field(
          "Saldo a expirar em 30 dias",
          this._formatSceeEnergy(official.balance_expiring_30_days_kwh),
        ),
        this._field(
          "Saldo a expirar em 60 dias",
          this._formatSceeEnergy(official.balance_expiring_60_days_kwh),
        ),
        this._field(
          "Percentual oficial na fatura",
          this._formatSceePercent(official.distribution_percent),
        ),
      );

      const extractionBlock = this._element("div", "scee-extraction");
      extractionBlock.append(this._field(
        "Extração",
        extraction.status ?? "Não informado",
      ));
      const alerts = Array.isArray(extraction.alerts) ? extraction.alerts : [];
      if (alerts.length > 0) {
        const disclosure = this._element("details", "scee-alerts");
        disclosure.append(this._element(
          "summary", "", `Alertas da extração (${alerts.length})`,
        ));
        const list = this._element("ul", "scee-alert-list");
        for (const alert of alerts) list.append(this._element("li", "", alert));
        disclosure.append(list);
        extractionBlock.append(disclosure);
      }
      section.append(metadata, primary, secondary, extractionBlock);
      return section;
    }

    _qualityItems(evidence) {
      const items = [];
      const billing = evidence?.billing;
      const alerts = Array.isArray(billing?.extraction_alerts)
        ? billing.extraction_alerts
        : [];
      for (const alert of alerts) {
        items.push(`Faturamento: ${alert}`);
      }
      if (billing?.has_extraction_alerts === true && alerts.length === 0) {
        items.push("Faturamento possui alertas de extração.");
      }

      const measurements = Array.isArray(evidence?.measurements)
        ? evidence.measurements
        : [];
      for (const measurement of measurements) {
        if (measurement.available === false) {
          items.push(`${measurement.label ?? measurement.logical_id}: indisponível.`);
        }
        if (measurement.unit_mismatch === true) {
          items.push(
            `${measurement.label ?? measurement.logical_id}: unidade divergente `
            + `(${this._unitMismatchDetail(measurement)}).`,
          );
        }
        if (measurement.validation_required === true) {
          const suffix = measurement.validation_note
            ? ` ${measurement.validation_note}`
            : "";
          items.push(`${measurement.label ?? measurement.logical_id}: validação pendente.${suffix}`);
        }
      }

      for (const groupName of ["current_energy", "waiting_bill_energy"]) {
        const metrics = Array.isArray(evidence?.[groupName])
          ? evidence[groupName]
          : [];
        for (const metric of metrics) {
          if (metric.has_issues !== true) continue;
          const counts = Array.isArray(metric.issue_counts) ? metric.issue_counts : [];
          if (counts.length === 0) {
            items.push(`${metric.label ?? metric.logical_id}: possui ocorrências.`);
          }
          for (const issue of counts) {
            items.push(
              `${metric.label ?? metric.logical_id}: ${this._auditIssueLabel(issue.reason, issue.count)} (${issue.count ?? "—"}).`,
            );
          }
        }
      }
      return items;
    }

    _auditStatusLabel(status) {
      return {
        ok: "OK",
        attention: "Atenção",
        incomplete: "Incompleto",
        unavailable: "Indisponível",
        not_applicable: "Não aplicável",
      }[status] ?? "Indisponível";
    }

    _auditBadge(status) {
      return this._element(
        "span",
        `audit-badge audit-${status ?? "unavailable"}`,
        this._auditStatusLabel(status),
      );
    }

    _formatSignedAuditNumber(value, maximumFractionDigits = 2) {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "Indisponível";
      }
      const numeric = Number(value);
      const formatted = this._formatNumber(numeric, maximumFractionDigits, 2);
      return numeric > 0 ? `+${formatted}` : formatted;
    }

    _auditIssueLabel(reason, count) {
      const singular = Number(count) === 1;
      const labels = {
        partial_bucket: singular
          ? "Intervalo parcial descartado"
          : "Intervalos parciais descartados",
        missing_change: singular
          ? "Variação de energia ausente no Recorder"
          : "Variações de energia ausentes no Recorder",
        skip_first_change: singular
          ? "Proteção aplicada na troca de fonte"
          : "Proteções aplicadas na troca de fonte",
        negative_change: singular
          ? "Variação negativa descartada"
          : "Variações negativas descartadas",
        max_change_exceeded: singular
          ? "Variação acima do limite descartada"
          : "Variações acima do limite descartadas",
      };
      return labels[reason] ?? "Ocorrência identificada";
    }

    _auditIssuePresentation(reason, count) {
      const numericCount = Number(count);
      const amount = Number.isFinite(numericCount) ? numericCount : "—";
      const interval = numericCount === 1 ? "intervalo" : "intervalos";
      const presentations = {
        missing_change: {
          title: "Dados ausentes",
          description: `${amount} ${interval} sem medição utilizável`,
        },
        // Variacao negativa e dado ausente na pratica: o intervalo tambem fica
        // sem medicao utilizavel, so que por leitura descartada.
        negative_change: {
          title: "Dados ausentes",
          description: `${amount} ${interval} sem medição utilizável`,
        },
        partial_bucket: {
          title: "Intervalo parcial descartado",
          description: `${amount} ${interval}`,
        },
        skip_first_change: {
          title: "Proteção na troca de fonte",
          description: `${amount} ${interval}`,
        },
        max_change_exceeded: {
          title: "Variação acima do limite descartada",
          description: `${amount} ${interval}`,
        },
      };
      return presentations[reason] ?? {
        title: "Ocorrência identificada",
        description: `${amount} ${interval}`,
      };
    }

    // Rotulo exibido para o motivo. Dois motivos que se apresentam com o mesmo
    // titulo sao a mesma categoria para quem le, e agrupam juntos.
    _auditIssueCategory(reason) {
      return this._auditIssuePresentation(reason, 0).title;
    }

    _groupAuditIssueEvents(events) {
      const groups = [];
      for (const event of events) {
        const startTime = new Date(event?.start).getTime();
        const endTime = new Date(event?.end).getTime();
        const previous = groups.at(-1);
        const consecutive = previous
          && this._auditIssueCategory(previous.reason)
            === this._auditIssueCategory(event?.reason)
          && previous.source_entity_id === event?.source_entity_id
          && Number.isFinite(startTime)
          && Number.isFinite(previous.end_time)
          && previous.end_time === startTime;
        if (consecutive) {
          previous.end = event?.end;
          previous.end_time = endTime;
          previous.count += 1;
          continue;
        }
        groups.push({
          reason: event?.reason,
          source_entity_id: event?.source_entity_id,
          source_label: event?.source_label,
          start: event?.start,
          end: event?.end,
          end_time: endTime,
          count: 1,
        });
      }
      return groups;
    }

    _formatAuditIssueSource(sourceLabel, sourceEntityId) {
      if (sourceLabel && sourceEntityId) {
        return `Fonte: ${sourceLabel} · ${sourceEntityId}`;
      }
      return `Fonte: ${sourceLabel || sourceEntityId || "—"}`;
    }

    _formatAuditIssueInterval(startValue, endValue, timezone) {
      const start = new Date(startValue);
      const end = new Date(endValue);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
        return "Intervalo indisponível";
      }
      const zoneOptions = typeof timezone === "string" && timezone
        ? { timeZone: timezone }
        : {};
      try {
        const dateTime = new Intl.DateTimeFormat("pt-BR", {
          ...zoneOptions,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        });
        const time = new Intl.DateTimeFormat("pt-BR", {
          ...zoneOptions,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        });
        // Sem o ano, para o intervalo caber numa linha so. Ele continua na
        // ponta direita, entao nada fica ambiguo enquanto as duas pontas
        // estiverem no mesmo ano — quando nao estiverem, os dois anos aparecem.
        const dayTime = new Intl.DateTimeFormat("pt-BR", {
          ...zoneOptions,
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        });
        const civilDay = (value) => new Intl.DateTimeFormat("en-CA", {
          ...zoneOptions,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(value);
        const startDay = civilDay(start);
        const endDay = civilDay(end);
        if (startDay === endDay) {
          return `${dateTime.format(start)} → ${time.format(end)}`;
        }
        const inicio = startDay.slice(0, 4) === endDay.slice(0, 4)
          ? dayTime.format(start)
          : dateTime.format(start);
        return `${inicio} → ${dateTime.format(end)}`;
      } catch (error) {
        return "Intervalo indisponível";
      }
    }

    _renderAuditEntry(entry, timezone) {
      const card = this._element("article", "audit-entry");
      const header = this._element("header", "audit-entry-header");
      header.append(this._element(
        "strong", "audit-entry-title", entry.label ?? "Métrica",
      ));
      header.append(this._auditBadge(entry.comparison_status ?? entry.status));
      const values = this._element("div", "audit-values");
      values.append(
        this._field(
          this._distributorLabel(),
          this._valueWithUnit(entry.official_value, entry.unit, 2),
        ),
        this._field(
          "Home Assistant",
          this._valueWithUnit(entry.measured_value, entry.unit, 2),
        ),
      );
      const difference = this._element("div", "field audit-difference");
      const differenceValue = this._element("strong", "field-value");
      differenceValue.append(
        this._element(
          "span",
          "",
          entry.deviation === null || entry.deviation === undefined
            ? "Indisponível"
            : `${this._formatSignedAuditNumber(entry.deviation)} ${entry.unit ?? ""}`.trim(),
        ),
        this._element(
          "small",
          "audit-percent",
          entry.deviation_percent === null || entry.deviation_percent === undefined
            ? "Percentual não avaliável"
            : `${this._formatSignedAuditNumber(entry.deviation_percent)}%`,
        ),
      );
      difference.append(
        this._element("span", "field-label", "Diferença"),
        differenceValue,
      );
      values.append(difference);
      card.append(header, values);

      const tolerance = entry.tolerance_percent;
      const toleranceText = entry.within_tolerance === null
        ? "Tolerância não avaliável"
        : entry.within_tolerance === true
          ? `Dentro da tolerância de ±${this._formatNumber(tolerance, 2)}%`
          : `Fora da tolerância de ±${this._formatNumber(tolerance, 2)}%`;
      const toleranceZone = this._element("div", "field audit-tolerance");
      toleranceZone.append(
        this._element("span", "field-label", "Tolerância"),
        this._element("strong", "field-value", toleranceText),
      );
      card.append(toleranceZone);

      const issueCounts = Array.isArray(entry.issue_counts) ? entry.issue_counts : [];
      if (Number(entry.issue_count) > 0) {
        const details = this._element("details", "audit-issues");
        details.append(this._element(
          "summary",
          "",
          `Ocorrências identificadas: ${entry.issue_count}`,
        ));
        details.append(this._renderAuditIssueList(entry, timezone));
        card.append(details);
      } else {
        const explanations = Array.isArray(entry.explanations) ? entry.explanations : [];
        if (explanations.length) {
          card.append(this._element("p", "audit-explanation", explanations[0]));
        }
      }
      return card;
    }

    // Onde e quando a medicao falhou. Extraido para a tabela da aba Auditoria
    // poder mostrar a mesma evidencia sem duplicar o desenho.
    _renderAuditIssueList(entry, timezone) {
      const events = Array.isArray(entry?.issue_events) ? entry.issue_events : [];
      if (events.length) {
        const list = this._element("div", "audit-event-list");
        for (const event of this._groupAuditIssueEvents(events)) {
          const presentation = this._auditIssuePresentation(event.reason, event.count);
          const item = this._element("article", "audit-event");
          item.append(
            this._element("strong", "audit-event-reason", presentation.title),
            this._element("span", "audit-event-description", presentation.description),
            this._element(
              "span", "audit-event-period",
              this._formatAuditIssueInterval(event.start, event.end, timezone),
            ),
            this._element(
              "small", "audit-event-source",
              this._formatAuditIssueSource(event.source_label, event.source_entity_id),
            ),
          );
          list.append(item);
        }
        return list;
      }
      // Sem os eventos detalhados, resta a contagem por motivo.
      const counts = Array.isArray(entry?.issue_counts) ? entry.issue_counts : [];
      const list = this._element("ul", "audit-issue-list");
      for (const issue of counts) {
        const presentation = this._auditIssuePresentation(
          issue?.reason, Number(issue?.count),
        );
        list.append(this._element(
          "li", "", `${presentation.title} · ${presentation.description}`,
        ));
      }
      return list;
    }

    _formatAuditCivilDate(value) {
      if (typeof value !== "string") return "—";
      const [year, month, day] = value.split("-");
      return year && month && day ? `${day}/${month}/${year}` : "—";
    }

    _renderBillingQuality(quality) {
      const block = this._element("section", "audit-billing-quality");
      block.append(this._element("h4", "audit-subtitle", "Qualidade da fatura"));
      if (!quality || typeof quality !== "object") {
        block.append(this._element("p", "empty", "Detalhes da fatura indisponíveis."));
        return block;
      }
      const period = quality.billing_cycle_period;
      const diagnostic = quality.billing_reading_diagnostic;
      const diagnosticLabel = {
        compatible: "Compatível",
        possible_estimate: "Possível estimativa",
        unknown: "Indeterminado",
      }[diagnostic?.classification] ?? "Indeterminado";
      const startSource = {
        previous_current: "Leitura atual da fatura anterior",
        reading_days: "Dias informados na fatura",
      }[period?.start_source] ?? "—";
      block.append(
        this._field("Método de faturamento", quality.billing_method ?? "—"),
        this._field(
          "Período",
          period
            ? `${this._formatAuditCivilDate(period.start)} → ${this._formatAuditCivilDate(period.end)}`
            : "—",
        ),
        this._field("Origem do início", startSource),
        this._field(
          "Leitura anterior informada",
          this._formatAuditCivilDate(diagnostic?.reported_previous),
        ),
        this._field("Dias informados", diagnostic?.reading_days ?? "—"),
        this._field("Dias reconstruídos", diagnostic?.cycle_days ?? "—"),
        this._field("Situação das leituras", diagnosticLabel),
      );
      if (diagnostic?.reading_days_match === true) {
        block.append(this._element(
          "p", "audit-explanation", "Duração da leitura compatível.",
        ));
      }
      return block;
    }

    _renderAuditError(message) {
      const error = this._element("div", "history-state history-error compact");
      error.setAttribute("aria-live", "polite");
      error.append(
        this._element("span", "", message),
        this._button("Tentar novamente", "audit-retry"),
      );
      return error;
    }

    _renderAuditHeader(data) {
      const header = this._element("header", "audit-header");
      const heading = this._element("div", "audit-heading");
      const referenceLine = this._element("div", "audit-reference-line");
      referenceLine.append(
        this._element(
          "span",
          "audit-reference-label",
          data?.status === "not_applicable"
            ? "Referência oficial"
            : `${this._distributorLabel()} × Home Assistant`,
        ),
        this._element("strong", "audit-reference-value", this._auditReference() ?? "—"),
      );
      heading.append(referenceLine);
      if (data?.period?.start && data?.period?.end) {
        heading.append(this._element(
          "small",
          "audit-period",
          `${this._formatDate(data.period.start)} → ${this._formatDate(data.period.end)}`,
        ));
      }
      header.append(heading);
      const entries = Array.isArray(data?.entries) ? data.entries : [];
      if (data && entries.length === 0) header.append(this._auditBadge(data.status));
      return header;
    }

    _renderAuditResult(evidence) {
      const container = this._element("div", "audit-result");
      container.dataset.auditResult = "";
      const reference = this._auditReference();
      const key = this._auditKey();
      const data = reference ? this._auditCache.get(key) : null;
      const error = reference ? this._auditErrors.get(key) : null;
      const loading = reference ? this._auditInFlight.has(key) : false;

      if (reference) container.append(this._renderAuditHeader(data));

      if (!reference) {
        container.append(this._historyStatus(
          "Auditoria disponível para ciclos oficiais fechados.", "compact",
        ));
      } else if (!data && loading) {
        container.append(this._historyStatus("Carregando auditoria…", "loading compact"));
      } else if (!data && error) {
        container.append(this._renderAuditError(error));
      } else if (!data) {
        container.append(this._historyStatus(
          "Auditoria disponível para ciclos oficiais fechados.", "compact",
        ));
      } else {
        const entries = Array.isArray(data.entries) ? data.entries : [];
        if (entries.length) {
          const layout = entries.length === 1 ? "single" : "multiple";
          const grid = this._element(
            "div",
            `audit-entry-grid audit-entry-grid-${layout}`,
          );
          for (const entry of entries) {
            grid.append(this._renderAuditEntry(entry, data.period?.timezone));
          }
          container.append(grid);
        } else if (data.status === "not_applicable") {
          container.append(
            this._element(
              "p",
              "audit-not-applicable",
              "Auditoria operacional não aplicável a esta unidade.",
            ),
            this._renderBillingQuality(data.billing_quality),
          );
        }
        const explanations = Array.isArray(data.explanations) ? data.explanations : [];
        if (entries.length && explanations.length) {
          container.append(this._element("p", "audit-disclaimer", explanations[0]));
        }
      }

      const items = this._qualityItems(evidence);
      const other = this._element("section", "audit-other-evidence");
      other.append(this._element("h4", "audit-subtitle", "Outras evidências"));
      if (items.length) {
        const list = this._element("ul", "quality-list");
        for (const item of items) list.append(this._element("li", "", item));
        other.append(list);
      } else {
        other.append(this._element(
          "p", "empty", "Nenhuma outra ocorrência informada neste overview",
        ));
      }
      container.append(other);
      return container;
    }

    _renderAuditQuality(evidence) {
      const section = this._element("section", "panel block quality audit-quality");
      section.append(this._element("h3", "section-title", "Auditoria e qualidade"));
      section.append(this._renderAuditResult(evidence));
      return section;
    }

    _styles() {
      return `
        :host {
          --energy-control-height: 32px;
          /* Duas larguras para o campo de periodo, nao quatro. Medidas num
             Chromium pt-BR com a fonte e o corpo reais do controle (10px/800,
             padding 4px 8px), pelo rotulo mais longo que cada um chega a
             mostrar:

               dia    104px   23/09/2026
               mes    126px   setembro de 2026   <- o maior dos tres
               ano    131px   largura padrao do campo numerico, nao do texto
               ciclo  200px   CICLO ATUAL · 12/09 · Em andamento

             Dia, mes e ano compartilham 132px: e a medida do mes, o maior
             texto entre eles, com uma folga pequena para outra fonte. O ano
             so parecia maior porque campo numerico reserva largura propria
             para as setinhas; com largura declarada ele obedece.

             O ciclo fica sozinho com a largura maior — o rotulo dele e o
             dobro de um mes, e espremer os tres ate caber nele era o que
             deixava a caixa enorme e vazia. */
          --energy-period-field: 132px;
          --energy-period-field-cycle: 210px;
          display: block;
          min-width: 0;
          color: var(--primary-text-color);
        }
        *, *::before, *::after { box-sizing: border-box; }
        .root, .card, .content, .panel, .block { min-width: 0; }
        /* A regra que faltava: um unico neto largo — uma tabela, o diagrama de
           fluxo, a faixa de icones — subia pelos ancestrais e esticava a pagina
           inteira, que entao arrastava para o lado no telefone. */
        .page-content > *, .content > *, .blocks > *, .panel > * { min-width: 0; }
        /* Sem recorte: o shell rola no scroll da propria pagina e a coluna de
           navegacao fica por position:sticky. Qualquer overflow aqui — clip ou
           hidden — cortaria o conteudo em vez de deixa-lo rolar. */
        .card {
          overflow: visible;
          background: var(--card-background-color);
        }
        .toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-bottom: 1px solid var(--divider-color);
        }
        .unit-selector {
          display: flex;
          flex: 1;
          gap: 8px;
          min-width: 0;
          overflow-x: auto;
          scrollbar-width: thin;
        }
        .billing-reference-global {
          display: grid;
          flex: 0 0 auto;
          gap: 3px;
          min-width: 0;
        }
        .billing-reference-global-controls {
          display: grid;
          grid-template-columns: var(--energy-control-height) minmax(110px, 1fr) var(--energy-control-height);
          gap: 6px;
          min-width: 0;
        }
        .billing-reference-global-button {
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          padding: 0;
        }
        .billing-reference-global-select {
          min-width: 0;
          height: var(--energy-control-height);
          padding: 4px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          color-scheme: light dark;
          font: inherit;
          font-size: 11px;
          font-weight: 800;
        }
        .billing-reference-global-select:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        button {
          min-height: 36px;
          padding: 8px 13px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: transparent;
          color: var(--primary-text-color);
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }
        button:hover { background: color-mix(in srgb, var(--primary-color) 8%, transparent); }
        button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
        button:disabled { cursor: default; opacity: .55; }
        .unit-button { flex: 0 0 auto; white-space: nowrap; }
        .unit-button[aria-pressed="true"] {
          border-color: var(--primary-color);
          background: color-mix(in srgb, var(--primary-color) 14%, transparent);
        }
        .content { display: grid; gap: 14px; padding: 14px; }
        .overview-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          padding: 6px 2px 2px;
        }
        .overview-heading-copy { display: grid; gap: 5px; }
        /* Sem o wrapper que antes segurava rotulo e setas, o seletor responde
           sozinho ao flex do cabecalho: sem isso o titulo o comprimiria. */
        .overview-heading > .billing-reference-global-select {
          flex: 0 0 auto;
          min-width: 190px;
        }
        .overview-description {
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.45;
        }
        .overview-unit-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          min-width: 0;
        }
        .overview-unit-card {
          position: relative;
          display: grid;
          align-content: start;
          gap: 14px;
          overflow: hidden;
        }
        .overview-unit-header {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr);
          align-items: center;
          gap: 11px;
        }
        .overview-unit-photo-wrap {
          position: relative;
          width: 64px;
          height: 64px;
          overflow: hidden;
          border-radius: 13px;
          background: color-mix(in srgb, var(--primary-color) 9%, transparent);
        }
        .overview-unit-photo,
        .overview-unit-photo-placeholder {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .overview-unit-photo { object-fit: cover; }
        .overview-unit-photo-placeholder {
          display: grid;
          place-items: center;
          padding: 18px;
          color: var(--primary-color);
        }
        .overview-unit-photo-placeholder[hidden],
        .overview-unit-photo[hidden] { display: none; }
        .overview-unit-title { display: grid; justify-items: start; gap: 6px; min-width: 0; }
        .overview-unit-name { margin: 0; overflow-wrap: anywhere; font-size: 18px; }
        .overview-cycle-status {
          padding: 3px 7px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--secondary-text-color) 12%, transparent);
          color: var(--secondary-text-color);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .overview-cycle-status.open {
          background: color-mix(in srgb, var(--success-color, #43a047) 14%, transparent);
          color: var(--success-color, #2e7d32);
        }
        .overview-primary-metric {
          display: grid;
          gap: 5px;
          padding: 13px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .overview-primary-label,
        .overview-classification,
        .overview-updating { color: var(--secondary-text-color); font-size: 11px; }
        .overview-primary-value { overflow-wrap: anywhere; font-size: 24px; line-height: 1.1; }
        .overview-classification { font-weight: 700; text-transform: uppercase; }
        .overview-unit-facts { display: grid; gap: 9px; }
        .overview-unit-facts .field {
          padding-top: 8px;
          border-top: 1px solid var(--divider-color);
        }
        .overview-unit-facts .field-value { font-size: 12px; }
        .overview-unit-action {
          width: 100%;
          border-color: color-mix(in srgb, var(--primary-color) 45%, var(--divider-color));
        }
        .overview-updating.error-text { color: var(--error-color, #db4437); }
        .energy-flow {
          display: grid;
          align-content: start;
          gap: 9px;
          min-height: 420px;
          /* Mesmo motivo da faixa de icones: filho de grid tambem nasce com
             min-width auto, e sem isto ele cresce em vez de rolar. */
          min-width: 0;
          overflow-x: auto;
          padding: 20px 22px 16px;
          background: linear-gradient(135deg,
            color-mix(in srgb, #102638 72%, var(--card-background-color)),
            color-mix(in srgb, #08131e 48%, var(--card-background-color)));
        }
        /* Duas colunas de largura desigual: o fluxo tem cinco nos e uma coluna
           de destinos, o rateio tem uma rosca. align-items nao e preciso — no
           grid os dois esticam para a altura da linha por padrao. */
        .overview-flow-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(268px, 330px);
          gap: 14px;
        }
        /* Cinco faixas: marca, titulo, corpo, regra e acoes. So a do corpo
           cresce — assim a rosca fica no meio do espaco que sobra e as acoes
           encostam embaixo, em vez de todo o conteudo pendurado no topo. */
        .rateio-card {
          /* display: grid explicito: .panel nao e grid, entao sem isto o
             grid-template-rows abaixo era simplesmente ignorado e o conteudo
             continuava empilhado no topo. */
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          gap: 2px;
          padding: 10px 16px;
        }
        .rateio-card .section-title { margin: 0 0 4px; font-size: 17px; line-height: 1.2; }
        .rateio-body {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-content: center;
          align-items: center;
          gap: 16px;
        }
        .rateio-ring {
          display: grid;
          place-items: center;
          width: 92px;
          height: 92px;
        }
        .rateio-ring > * { grid-area: 1 / 1; }
        /* Mascara em vez de circulo solido no meio: o furo fica transparente e
           a rosca funciona sobre qualquer fundo, como no anel do payback. */
        .rateio-ring-fill {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          -webkit-mask: radial-gradient(farthest-side, transparent 58%, #000 58%);
          mask: radial-gradient(farthest-side, transparent 58%, #000 58%);
        }
        .rateio-ring-body { display: grid; justify-items: center; gap: 1px; }
        .rateio-total { font-size: 18px; font-weight: 700; line-height: 1; }
        .rateio-total-label {
          color: var(--secondary-text-color);
          font-size: 9px;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .rateio-legend { display: grid; gap: 6px; min-width: 0; }
        .rateio-legend-item {
          display: grid;
          grid-template-columns: 10px minmax(0, 1fr) auto;
          align-items: center;
          gap: 9px;
        }
        .rateio-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          background: var(--unit-cor, var(--secondary-text-color));
        }
        .rateio-legend-name {
          overflow: hidden;
          font-size: 12.5px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rateio-legend-item strong {
          font-size: 12.5px;
          font-variant-numeric: tabular-nums;
        }
        .rateio-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 6px; }
        /* Mesma pilula do atalho do popup da auditoria: sao a mesma acao — abrir
           uma janela de detalhe — e nao deveriam parecer coisas diferentes. */
        .rateio-action {
          appearance: none;
          min-height: 0;
          padding: 5px 11px;
          border: 1px solid var(--divider-color);
          border-radius: 999px;
          background: transparent;
          color: var(--primary-color);
          font: inherit;
          font-size: 11.5px;
          white-space: nowrap;
          cursor: pointer;
        }
        .rateio-action:hover {
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        /* Dentro do popup o painel perde a propria moldura: quem emoldura e o
           dialogo. Duas bordas concentricas so somam ruido. */
        .distribution-in-modal {
          display: grid;
          gap: 12px;
          padding: 0;
          border: 0;
          background: transparent;
        }
        .energy-flow-header { display: flex; justify-content: space-between; gap: 12px; }
        .energy-flow-heading { display: grid; gap: 3px; }
        .energy-flow-heading .section-title { margin: 0; font-size: 17px; line-height: 1.2; }
        .energy-flow-heading .overview-description { display: none; }
        .energy-flow-diagram {
          display: grid;
          grid-template-columns:
            minmax(140px, 1fr) 48px
            minmax(140px, 1fr) 48px
            minmax(140px, 1fr) 48px
            minmax(150px, 1fr) 48px
            minmax(140px, 1fr) minmax(220px, 1.25fr);
          align-items: center;
          gap: 4px;
          min-width: 0;
          min-height: 300px;
          padding: 14px 2px 8px;
        }
        /* Fora dos circulos, o painel usa um neutro so. A cor identifica a
           grandeza no anel; texto, setas e ligacoes nao competem com ela. */
        .energy-flow {
          --fluxo-texto: #f4f7fb;
          --fluxo-rotulo: #d0d7df;
          --fluxo-traco: rgba(208, 215, 223, .55);
        }
        .energy-flow-node {
          position: relative;
          z-index: 1;
          display: grid;
          justify-items: center;
          align-content: start;
          gap: 3px;
          min-width: 0;
          padding: 0 6px;
          background: transparent;
        }
        .energy-flow-icon {
          display: grid;
          place-items: center;
          width: 116px;
          height: 116px;
          border: 2px solid currentColor;
          border-radius: 50%;
          background: radial-gradient(circle,
            color-mix(in srgb, currentColor 19%, #07111c) 0%,
            color-mix(in srgb, currentColor 8%, #07111c) 70%);
          box-shadow: 0 0 20px color-mix(in srgb, currentColor 18%, transparent);
          color: var(--no-cor, var(--primary-color));
        }
        .energy-flow-icon ha-icon {
          width: 52px;
          height: 52px;
          --mdc-icon-size: 52px;
        }
        .energy-flow-node-copy { display: grid; justify-items: center; gap: 0; min-width: 0; text-align: center; }
        /* Entrelinha justa, corpo intacto: e o unico jeito de continuar
           encolhendo na vertical sem diminuir a letra. */
        .energy-flow-label {
          color: var(--fluxo-rotulo);
          font-size: 13px;
          line-height: 1.2;
        }
        .energy-flow-value {
          overflow-wrap: anywhere;
          color: var(--fluxo-texto);
          font-size: 22px;
          line-height: 1.15;
          white-space: nowrap;
        }
        .energy-flow-classification {
          color: var(--secondary-text-color);
          color: #aab6c2;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
        .energy-flow-note {
          color: var(--secondary-text-color);
          max-width: 155px;
          color: #9aa8b6;
          font-size: 10px;
          line-height: 1.2;
        }
        .energy-flow-arrow {
          position: relative;
          z-index: 0;
          width: 100%;
          height: 34px;
          overflow: hidden;
          color: transparent;
          font-size: 0;
          background: linear-gradient(90deg,
            rgba(45, 109, 137, .22),
            rgba(47, 132, 174, .56));
          clip-path: polygon(0 12%, 78% 12%, 100% 50%, 78% 88%, 0 88%, 10% 50%);
        }
        .energy-flow-node.solar + .energy-flow-arrow {
          background: linear-gradient(90deg, rgba(83, 151, 48, .22), rgba(103, 190, 53, .68));
        }
        .energy-flow-node.self-consumption + .energy-flow-arrow {
          background: linear-gradient(90deg, rgba(35, 112, 157, .22), rgba(55, 152, 211, .68));
        }
        .energy-flow-node.export + .energy-flow-arrow,
        .energy-flow-node.network + .energy-flow-arrow {
          background: linear-gradient(90deg, rgba(91, 76, 156, .22), rgba(143, 72, 188, .7));
        }
        .energy-flow-destinations {
          position: relative;
          display: grid;
          gap: 3px;
          min-width: 0;
        }
        .energy-flow-destinations::before {
          content: "";
          position: absolute;
          left: -15px;
          top: 12%;
          bottom: 12%;
          width: 1px;
          background: var(--fluxo-traco);
        }
        .energy-flow-destinations::after {
          content: "";
          position: absolute;
          left: -50px;
          top: 50%;
          width: 35px;
          height: 1px;
          background: var(--fluxo-traco);
        }
        /* Sem borda, sem fundo, sem raio. Eram quatro camadas de moldura para
           exibir tres valores — a moldura ocupava mais pixel que o conteudo. */
        .energy-flow-share {
          position: relative;
          display: grid;
          align-content: center;
          gap: 2px;
          min-width: 0;
          padding: 0;
        }
        .energy-flow-share-head {
          display: grid;
          grid-template-columns: 17px minmax(0, 1fr) auto;
          align-items: baseline;
          gap: 7px;
        }
        .energy-flow-share-track {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 34px;
          align-items: center;
          gap: 8px;
        }
        .energy-flow-share-bar {
          height: 5px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--fluxo-rotulo) 13%, transparent);
          overflow: hidden;
        }
        /* Aqui a cor da unidade tem area de sobra. E o unico lugar em que ela
           carrega significado sem depender de contraste de texto: barra e
           elemento grafico, o limiar e 3,0 e nao 4,5. */
        .energy-flow-share-fill {
          display: block;
          width: 0;
          height: 100%;
          border-radius: inherit;
          background: var(--unit-cor, #607d8b);
        }
        .energy-flow-share::before {
          content: "";
          position: absolute;
          left: -15px;
          top: 50%;
          width: 15px;
          height: 1px;
          background: var(--unit-cor, #607d8b);
        }
        .energy-flow-share ha-icon {
          align-self: center;
          width: 17px;
          color: var(--unit-cor, #607d8b);
          --mdc-icon-size: 17px;
        }
        /* O nome fica neutro: quem carrega a cor da unidade agora e o icone e
           a barra. Em 11px a cor nao passava no contraste — na barra passa. */
        .energy-flow-share-head b {
          overflow: hidden;
          color: var(--fluxo-rotulo);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .02em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* O kWh recebido e a resposta da linha — quanta energia a unidade
           levou. O percentual e so a regra que produziu esse numero, entao
           acompanha na barra em vez de liderar. */
        .energy-flow-share-head small {
          color: var(--fluxo-texto);
          font-size: 14px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          line-height: 1.15;
          white-space: nowrap;
        }
        .energy-flow-share-track strong {
          color: var(--fluxo-rotulo);
          font-size: 10px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .energy-flow-disclaimer {
          margin: 0;
          color: #91a0ae;
          font-size: 10px;
          line-height: 1.4;
          text-align: right;
        }
        .energy-flow {
          min-height: 0;
          overflow: hidden;
          padding: 10px 18px;
        }
        .energy-flow-header { align-items: flex-start; }
        .energy-flow-heading .overview-description { display: block; }
        /* O selo virou botao: sem estes resets o navegador desenharia o
           chrome nativo por cima da pilula. */
        .energy-flow-quality {
          appearance: none;
          min-height: 0;
          margin: 0;
          padding: 5px 9px;
          border: 1px solid var(--warning-color, #f6a623);
          border-radius: 999px;
          background: transparent;
          color: var(--warning-color, #f6a623);
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .04em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .energy-flow-quality:hover {
          background: color-mix(in srgb, var(--warning-color, #f6a623) 15%, transparent);
        }
        .quality-modal-lead {
          margin: 0 0 4px;
          color: var(--secondary-text-color);
          font-size: 12.5px;
          line-height: 1.5;
        }
        .quality-block { display: grid; gap: 8px; margin-top: 16px; }
        .quality-block-title {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .quality-reason-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
        .quality-reason {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
          padding: 9px 12px;
          border-left: 3px solid var(--warning-color, #f6a623);
          border-radius: 0 8px 8px 0;
          background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
        }
        .quality-reason-text { font-size: 13px; }
        /* O codigo cru fica visivel de proposito: e por ele que se procura ao
           abrir o log do backend, e traduzi-lo sem mostra-lo esconderia a
           unica chave de busca que existe. */
        .quality-reason-code {
          color: var(--secondary-text-color);
          font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
          font-size: 10.5px;
        }
        .quality-coverage {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 8px 18px;
        }
        .quality-coverage-head {
          color: var(--secondary-text-color);
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .quality-coverage-head:not(:first-child) { text-align: right; }
        /* Mesma cor que a grandeza tem no grafico logo abaixo: a linha da
           tabela e a serie do grafico sao a mesma coisa. */
        .quality-coverage-metric {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .quality-coverage-metric::before {
          content: "";
          width: 9px;
          height: 9px;
          border-radius: 2px;
          background: var(--grandeza-cor, var(--secondary-text-color));
        }
        .quality-coverage-value {
          font-size: 13px;
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .quality-note {
          color: var(--secondary-text-color);
          font-size: 11px;
          line-height: 1.45;
        }
        .energy-flow-state {
          display: grid;
          place-items: center;
          min-height: 170px;
          margin: 0;
          color: var(--secondary-text-color);
          text-align: center;
        }
        .energy-flow-diagram {
          grid-template-columns:
            minmax(105px, 1fr) 24px minmax(105px, 1fr) 24px
            minmax(105px, 1fr) 24px minmax(105px, 1fr) 24px
            minmax(115px, 1fr) 72px minmax(190px, 1.25fr);
          gap: 2px;
          min-height: 131px;
          padding: 0;
        }
        /* Anel e glifo crescem juntos: 54->81 e 32->48 mantem a mesma
           proporcao de antes (0,59). Agora e a coluna dos nos que manda na
           altura do diagrama, e nao mais a coluna de destinos. */
        .energy-flow-icon { width: 81px; height: 81px; }
        .energy-flow-icon ha-icon { width: 48px; height: 48px; --mdc-icon-size: 48px; }
        .energy-flow-value { font-size: 17px; }
        .energy-flow-arrow {
          height: auto;
          clip-path: none;
          color: var(--fluxo-rotulo);
          font-size: 20px;
          text-align: center;
          background: none !important;
        }
        .energy-flow-branch { align-self: stretch; min-height: 117px; }
        .energy-flow-branch svg { display: block; width: 100%; height: 100%; }
        .energy-flow-branch path {
          fill: none;
          stroke: var(--fluxo-traco);
          stroke-width: 1.2;
          vector-effect: non-scaling-stroke;
        }
        .energy-flow-destinations::before,
        .energy-flow-destinations::after,
        .energy-flow-share::before { display: none; }

        .energy-flow-diagram.loading .energy-flow-icon,
        .energy-flow-diagram.loading .energy-flow-value,
        .energy-flow-diagram.loading .energy-flow-share {
          animation: energy-flow-pulse 1.2s ease-in-out infinite alternate;
        }
        @keyframes energy-flow-pulse { to { opacity: .42; } }
        .panel {
          padding: 16px;
          border: 1px solid var(--divider-color);
          border-radius: 14px;
          background: var(--card-background-color);
        }
        .identity {
          display: grid;
          grid-template-columns: 140px minmax(150px, .8fr) minmax(260px, 1.3fr);
          align-items: center;
          gap: 18px;
        }
        .photo-wrap {
          position: relative;
          width: 140px;
          height: 100px;
          overflow: hidden;
          border-radius: 12px;
          background: color-mix(in srgb, var(--secondary-text-color) 10%, transparent);
        }
        .photo, .photo-placeholder {
          width: 100%;
          height: 100%;
        }
        .photo { display: block; object-fit: cover; }
        .photo-placeholder {
          display: grid;
          place-items: center;
          color: var(--secondary-text-color);
          font-size: 12px;
        }
        .photo[hidden],
        .photo-placeholder[hidden] {
          display: none;
        }
        .identity-copy { display: grid; gap: 8px; }
        h2, h3, p { margin: 0; }
        h2 { font-size: clamp(21px, 3vw, 30px); line-height: 1.1; }
        .measurement-mode, .validation, .unit-mismatch {
          justify-self: start;
          padding: 4px 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--primary-color) 12%, transparent);
          font-size: 11px;
          font-weight: 700;
        }
        .unit-mismatch {
          background: color-mix(in srgb, var(--error-color, #db4437) 16%, transparent);
          color: var(--error-color, #db4437);
          font-size: 10px;
        }
        .payback-summary { display: grid; gap: 12px; }
        /* Sem moldura nem fundo: o anel a direita e o titulo a esquerda ja
           delimitam o bloco, e a caixa so acrescentava peso. */
        /* Faixa de destaque: anel, dinheiro e prazo em tres zonas. O separador
           e uma linha fina entre elas, nao uma caixa em volta de cada uma. */
        .payback-hero {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 18px 26px;
          margin-bottom: 14px;
          padding: 16px 18px;
          border: 1px solid var(--divider-color);
          border-radius: 14px;
          background:
            radial-gradient(120% 140% at 0% 0%,
              color-mix(in srgb, var(--success-color, #4caf7d) 7%, transparent), transparent 58%),
            color-mix(in srgb, var(--primary-text-color) 2%, transparent);
        }
        .payback-hero-block { display: grid; gap: 3px; min-width: 0; }
        .payback-hero-block.eta {
          margin-left: auto;
          text-align: right;
          justify-items: end;
          padding-left: 26px;
          border-left: 1px solid var(--divider-color);
        }
        .payback-hero-label {
          color: var(--secondary-text-color);
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .payback-hero-value {
          font-size: 27px;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
          letter-spacing: -.01em;
        }
        .payback-hero-value.accent { color: var(--warning-color, #f6a623); }
        .payback-hero-sub { color: var(--secondary-text-color); font-size: 11.5px; }
        .payback-hero-split { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 7px; }
        .payback-hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--secondary-text-color);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        }
        .payback-hero-dot {
          width: 8px;
          height: 8px;
          border-radius: 3px;
          background: var(--success-color, #4caf7d);
        }
        /* O mesmo par de tons do anel: cheio para o comprovado, vazado para a
           hipotese. Repetir o codigo visual evita ter de reaprender a leitura. */
        .payback-hero-chip.estimated .payback-hero-dot {
          background: color-mix(in srgb, var(--success-color, #4caf7d) 42%, transparent);
          border: 1px dashed color-mix(in srgb, var(--success-color, #4caf7d) 70%, transparent);
        }
        @media (max-width: 760px) {
          .payback-hero {
            gap: 14px 18px;
            padding: 14px;
          }
          .payback-hero-block.eta {
            margin-left: 0;
            padding-left: 0;
            border-left: 0;
            text-align: left;
            justify-items: start;
            width: 100%;
            padding-top: 12px;
            border-top: 1px solid var(--divider-color);
          }
          .payback-hero-value { font-size: 23px; }
        }
        .payback-header-eyebrow {
          color: var(--primary-color);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
        }
        /* Anel de progresso: o arco cresce com o recuperado e o texto fica no
           centro. Sem moldura nem fundo, porque a forma do anel ja delimita o
           bloco melhor que uma caixa em volta dele. */
        .payback-header-badge {
          --ring-size: 92px;
          --ring-thickness: 8px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: var(--ring-size);
          height: var(--ring-size);
        }
        .payback-header-badge > * { grid-area: 1 / 1; }
        .payback-header-ring {
          width: var(--ring-size);
          height: var(--ring-size);
          border-radius: 50%;
          background: conic-gradient(
            var(--success-color, #43a047) 0 var(--co-ring-official),
            color-mix(in srgb, var(--success-color, #43a047) 42%, transparent)
              var(--co-ring-official) var(--co-ring-total),
            color-mix(in srgb, var(--secondary-text-color) 20%, transparent)
              var(--co-ring-total) 100%
          );
          /* Mascara em vez de circulo interno solido: o furo fica transparente e
             o anel funciona sobre o degrade do cabecalho e em qualquer tema. */
          -webkit-mask: radial-gradient(farthest-side, transparent
            calc(100% - var(--ring-thickness)), #000 calc(100% - var(--ring-thickness)));
          mask: radial-gradient(farthest-side, transparent
            calc(100% - var(--ring-thickness)), #000 calc(100% - var(--ring-thickness)));
        }
        .payback-header-ring-body {
          display: grid;
          justify-items: center;
          gap: 2px;
          padding: 0 6px;
        }
        .payback-header-badge-label {
          color: var(--secondary-text-color);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        .payback-header-badge-value {
          font-size: 21px;
          color: var(--success-color, #43a047);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .payback-kpis {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(232px, 1fr));
          gap: 10px;
        }
        /* No telefone os seis viram uma coluna unica e a secao fica com meio
           metro de rolagem antes do grafico. Duas colunas cabem: o cartao perde
           o icone lateral e empilha rotulo, valor e dica. */
        @media (max-width: 760px) {
          .payback-kpis { grid-template-columns: 1fr 1fr; gap: 8px; }
          .payback-kpi {
            grid-template-columns: minmax(0, 1fr);
            gap: 6px;
            padding: 10px 11px;
          }
          .payback-kpi-icon { width: 26px; height: 26px; border-radius: 8px; }
          .payback-kpi-icon ha-icon { --mdc-icon-size: 15px; width: 15px; height: 15px; }
          .payback-kpi-value { font-size: 17px; }
          .payback-kpi-label, .payback-kpi-hint { font-size: 10px; }
          /* O painel flutuante vira largura total: ancorado ao cartao ele
             sairia da tela nos cartoes da coluna da direita. */
          .payback-kpi-pop { left: 0; right: auto; max-width: none; width: 100%; }
        }
        @media (max-width: 380px) {
          .payback-kpis { grid-template-columns: 1fr; }
        }
        .payback-kpi {
          position: relative;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          align-items: start;
          gap: 11px;
          padding: 13px 14px;
          border: 1px solid var(--divider-color);
          border-radius: 12px;
          transition: border-color .15s ease, background-color .15s ease;
        }
        .payback-kpi:hover {
          border-color: color-mix(in srgb, var(--kpi-tone, var(--primary-color)) 45%, var(--divider-color));
          background: color-mix(in srgb, var(--kpi-tone, var(--primary-color)) 4%, transparent);
        }
        .payback-kpi[title] { cursor: help; }
        .payback-kpi-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--kpi-tone, var(--secondary-text-color)) 15%, transparent);
          color: var(--kpi-tone, var(--secondary-text-color));
        }
        .payback-kpi-icon ha-icon { --mdc-icon-size: 19px; width: 19px; height: 19px; }
        /* A cor do icone codifica o papel do numero, nao o enfeita:
           ambar = custo, vermelho = pendencia, verde = conquistado,
           azul = ritmo, teal = guardado, violeta = projecao. */
        .payback-kpi.invest   { --kpi-tone: #f2b544; }
        .payback-kpi.alert    { --kpi-tone: var(--error-color, #e5534b); }
        .payback-kpi.positive { --kpi-tone: var(--success-color, #4caf7d); }
        .payback-kpi.rate     { --kpi-tone: #4f9df7; }
        .payback-kpi.stored   { --kpi-tone: #26a69a; }
        .payback-kpi.forecast { --kpi-tone: #a97bea; }
        .payback-kpi-body { display: grid; gap: 2px; min-width: 0; }
        .payback-kpi-label {
          color: var(--secondary-text-color);
          font-size: 11px;
          font-weight: 600;
          line-height: 1.3;
        }
        .payback-kpi-value {
          font-size: 20px;
          line-height: 1.2;
          overflow-wrap: anywhere;
          font-variant-numeric: tabular-nums;
        }
        .payback-kpi-hint {
          color: var(--secondary-text-color);
          font-size: 11px;
          line-height: 1.35;
          opacity: .85;
        }
        .payback-kpi.has-detail { cursor: help; }
        .payback-kpi.has-detail::after {
          content: "";
          position: absolute;
          top: 11px;
          right: 11px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--secondary-text-color);
          opacity: .35;
          transition: opacity .12s ease;
        }
        .payback-kpi.has-detail:hover::after,
        .payback-kpi.has-detail:focus-visible::after { opacity: .9; }
        .payback-kpi.has-detail:hover,
        .payback-kpi.has-detail:focus-visible {
          border-color: color-mix(in srgb, var(--primary-color) 40%, var(--divider-color));
          outline: none;
        }
        .payback-kpi-pop {
          position: absolute;
          z-index: 5;
          top: calc(100% + 6px);
          left: 0;
          min-width: 100%;
          max-width: 290px;
          display: grid;
          gap: 7px;
          padding: 10px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: var(--card-background-color, #1c1c1c);
          box-shadow: 0 8px 22px rgba(0, 0, 0, .45);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-3px);
          transition: opacity .12s ease, transform .12s ease, visibility .12s;
        }
        .payback-kpi.has-detail:hover .payback-kpi-pop,
        .payback-kpi.has-detail:focus-visible .payback-kpi-pop {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .payback-kpi-pop-rows { display: grid; gap: 4px; }
        .payback-kpi-pop-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 14px;
          font-size: 12px;
        }
        .payback-kpi-pop-row span:first-child { color: var(--secondary-text-color); }
        /* Rótulo e valor no mesmo corpo reduzido, para que cada prazo caiba numa
           linha só em vez de quebrar no meio da data. */
        .payback-kpi-pop-row.compact { font-size: 10.5px; }
        .payback-kpi-pop-value {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          /* O valor nunca quebra: quando o rótulo é longo, quem se dobra é ele,
             e não a data, que partida ao meio deixa "meses" órfão na linha. */
          white-space: nowrap;
        }
        .payback-kpi-pop-text {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 11px;
          line-height: 1.45;
        }
        .payback-kpi-pop-rows + .payback-kpi-pop-text {
          padding-top: 7px;
          border-top: 1px solid var(--divider-color);
        }
        .payback-kpi:nth-last-child(-n+2) .payback-kpi-pop {
          left: auto;
          right: 0;
        }
        .payback-chart-wrap { margin-top: 4px; }
        .payback-chart { width: 100%; height: 340px; }
        .payback-chart-empty {
          margin: 0;
          padding: 24px 0;
          color: var(--secondary-text-color);
          font-size: 12px;
          text-align: center;
        }
        .payback-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 16px;
          padding-top: 2px;
        }
        .payback-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--secondary-text-color);
          font-size: 11px;
        }
        .payback-legend-dot { width: 9px; height: 9px; border-radius: 3px; }
        .payback-legend-dot.partial {
          background: repeating-linear-gradient(
            -45deg, rgba(255, 255, 255, .6) 0 1.5px, transparent 1.5px 3.5px
          );
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .35);
        }
        .payback-legend-dot.estimated {
          background: rgba(215, 219, 224, .30);
          border: 1px dashed #aab3bd;
        }
        .payback-legend-wrap { display: grid; gap: 5px; }
        .payback-legend-line { width: 18px; height: 0; border-top-width: 2px; }
        .payback-legend-line.accumulated { border-top-style: solid; border-top-color: #d7dbe0; }
        .payback-chart-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 2px;
        }
        .payback-chart-modes {
          display: flex;
          gap: 2px;
          padding: 2px;
          border: 1px solid var(--line);
          border-radius: 7px;
          background: var(--surface, rgba(0, 0, 0, .18));
        }
        .payback-chart-modes .payback-chart-mode {
          display: grid;
          place-items: center;
          width: 28px;
          height: 24px;
          min-height: 0;
          padding: 0;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
        }
        .payback-chart-modes .payback-chart-mode ha-icon {
          --mdc-icon-size: 16px;
          width: 16px;
          height: 16px;
        }
        .payback-chart-modes .payback-chart-mode:hover { color: var(--ink); }
        .payback-chart-modes .payback-chart-mode.active {
          background: var(--line);
          color: var(--ink);
        }
        .payback-legend-area.owing {
          display: inline-block;
          width: 14px;
          height: 10px;
          border-radius: 2px;
          background: rgba(232, 62, 54, .55);
          border: 1px solid rgba(232, 62, 54, .85);
        }
        .payback-legend-area.surplus {
          display: inline-block;
          width: 14px;
          height: 10px;
          border-radius: 2px;
          background: rgba(155, 246, 90, .55);
          border: 1px solid rgba(155, 246, 90, .85);
        }
        .payback-legend-line.investment { border-top-style: dashed; border-top-color: #e8734a; }
        .payback-legend-note {
          color: var(--secondary-text-color);
          font-size: 11px;
          font-style: italic;
          opacity: .8;
        }
        .unit-mismatch-detail {
          color: var(--secondary-text-color);
          font-size: 11px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }
        .identity-cycle {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .section-title { margin-bottom: 13px; font-size: 16px; }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }
        .metric {
          display: grid;
          gap: 7px;
          min-width: 0;
          padding: 13px;
          border-radius: 11px;
          background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
        }
        .metric-label, .field-label, .compact-row small {
          color: var(--secondary-text-color);
          font-size: 11px;
        }
        .metric-value { overflow-wrap: anywhere; font-size: 19px; }
        .validation {
          background: color-mix(in srgb, var(--warning-color, #f6a623) 18%, transparent);
          font-size: 10px;
        }
        .validation-note summary { cursor: pointer; color: var(--secondary-text-color); font-size: 11px; }
        .validation-note p { margin-top: 7px; font-size: 12px; line-height: 1.45; }
        .blocks {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
          gap: 14px;
        }
        .block { align-content: start; display: grid; gap: 9px; }
        .field {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }
        .field-value { min-width: 0; overflow-wrap: anywhere; text-align: right; }
        .compact-list { display: grid; gap: 8px; margin-top: 5px; }
        .compact-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid var(--divider-color);
        }
        .compact-row span { display: grid; gap: 2px; min-width: 0; }
        .compact-row b { text-align: right; }
        .empty { color: var(--secondary-text-color); font-size: 13px; line-height: 1.45; }
        .status, .error {
          margin: 14px;
          padding: 14px;
          border-radius: 11px;
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .status.refreshing { margin-block: 10px 0; padding-block: 9px; font-size: 12px; }
        .error { display: grid; gap: 9px; border: 1px solid var(--error-color, #db4437); }
        .error.compact { margin-block: 10px 0; }
        .error-detail { color: var(--secondary-text-color); font-size: 12px; overflow-wrap: anywhere; }
        .error button { justify-self: start; }
        .quality-list { display: grid; gap: 8px; margin: 0; padding-left: 19px; }
        .quality-list li { line-height: 1.4; font-size: 13px; }
        .distribution-section { grid-column: 1 / -1; }
        .distribution-context { color: var(--secondary-text-color); font-size: 12px; line-height: 1.45; }
        .distribution-toolbar,
        .distribution-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .distribution-primary-action {
          border-color: var(--primary-color);
          background: color-mix(in srgb, var(--primary-color) 14%, transparent);
        }
        .distribution-danger-action {
          justify-self: start;
          border-color: color-mix(in srgb, var(--error-color) 55%, var(--divider-color));
        }
        .distribution-editor,
        .distribution-confirmation {
          display: grid;
          gap: 12px;
          min-width: 0;
          padding: 14px;
          border: 1px solid color-mix(in srgb, var(--primary-color) 45%, var(--divider-color));
          border-radius: 11px;
          background: color-mix(in srgb, var(--primary-color) 6%, var(--card-background-color));
        }
        .distribution-confirmation {
          border-width: 2px;
          box-shadow: 0 8px 24px color-mix(in srgb, #000 16%, transparent);
        }
        .distribution-editor-title { margin: 0; font-size: 15px; }
        .distribution-input-grid,
        .distribution-schedule-fields {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
          min-width: 0;
        }
        .distribution-schedule-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .distribution-input-field { display: grid; gap: 5px; min-width: 0; }
        .distribution-percent-control {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .distribution-input {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          height: var(--energy-control-height);
          padding: 0 10px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font: inherit;
        }
        .distribution-input:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .distribution-percent-suffix { font-weight: 700; }
        .distribution-editor-total {
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr);
          align-items: baseline;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
        }
        .distribution-editor-total.invalid { border-color: var(--error-color, #db4437); }
        .distribution-editor-total.valid { border-color: var(--success-color, #43a047); }
        .distribution-editor-total small { color: var(--secondary-text-color); }
        .distribution-schedule-preview,
        .distribution-confirmation-copy,
        .distribution-confirmation-total,
        .distribution-scheduled-note { font-size: 13px; line-height: 1.45; }
        .distribution-confirmation-total { font-weight: 800; }
        .distribution-scheduled-note { color: var(--secondary-text-color); }
        .distribution-mutation-message {
          padding: 10px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.45;
        }
        .distribution-mutation-message.success {
          border-color: var(--success-color, #43a047);
        }
        .distribution-mutation-message.error,
        .distribution-mutation-message.conflict {
          border-color: var(--error-color, #db4437);
        }
        .distribution-rule {
          display: grid;
          gap: 10px;
          min-width: 0;
          padding: 13px;
          border: 1px solid var(--divider-color);
          border-radius: 11px;
          background: color-mix(in srgb, var(--secondary-text-color) 4%, transparent);
        }
        .distribution-rule.scheduled {
          border-color: color-mix(in srgb, var(--primary-color) 45%, var(--divider-color));
          background: color-mix(in srgb, var(--primary-color) 7%, transparent);
        }
        .distribution-rule-title {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 11px;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .distribution-rule-label { overflow-wrap: anywhere; font-size: 15px; }
        .distribution-shares {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          min-width: 0;
        }
        .distribution-share {
          display: grid;
          gap: 5px;
          min-width: 0;
          padding: 10px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
        }
        .distribution-unit { color: var(--secondary-text-color); font-size: 11px; }
        .distribution-percent { overflow-wrap: anywhere; font-size: 20px; }
        .distribution-shares.compact .distribution-share { padding: 8px; }
        .distribution-shares.compact .distribution-percent { font-size: 14px; }
        .distribution-period {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .distribution-period .field { display: grid; align-content: start; gap: 4px; }
        .distribution-period .field-value { text-align: left; }
        .distribution-empty,
        .distribution-error {
          padding: 11px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          color: var(--secondary-text-color);
          font-size: 13px;
        }
        .distribution-error {
          border-color: color-mix(in srgb, var(--error-color) 35%, var(--divider-color));
          color: var(--primary-text-color);
        }
        .distribution-history { min-width: 0; }
        .distribution-history-summary { cursor: pointer; font-size: 13px; font-weight: 700; }
        .distribution-history-list { display: grid; gap: 9px; margin-top: 10px; }
        .distribution-history-item {
          display: grid;
          gap: 7px;
          min-width: 0;
          padding: 11px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
        }
        .distribution-history-period {
          color: var(--secondary-text-color);
          font-size: 11px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }
        .self-consumption-section { grid-column: 1 / -1; min-width: 0; }
        .self-consumption-summary {
          display: grid;
          gap: 12px;
          min-width: 0;
        }
        .self-consumption-main {
          display: grid;
          gap: 6px;
          min-width: 0;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid color-mix(in srgb, var(--primary-color) 38%, var(--divider-color));
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .self-consumption-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .self-consumption-label {
          color: var(--secondary-text-color);
          font-size: 12px;
          font-weight: 600;
        }
        .self-consumption-value {
          overflow-wrap: anywhere;
          font-size: 26px;
          color: var(--primary-text-color);
        }
        .self-consumption-description {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 12px;
          line-height: 1.4;
        }
        .sc-badge {
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .04em;
        }
        .sc-confirmed {
          background: color-mix(in srgb, var(--success-color, #43a047) 16%, transparent);
          color: var(--success-color, #43a047);
        }
        .sc-partial {
          background: color-mix(in srgb, var(--warning-color, #f6a623) 16%, transparent);
          color: var(--warning-color, #f6a623);
        }
        .sc-unavailable {
          background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent);
          color: var(--secondary-text-color);
        }
        .self-consumption-period-box {
          color: var(--secondary-text-color);
          font-size: 11px;
        }
        .self-consumption-error {
          display: grid;
          justify-items: start;
          gap: 8px;
          padding: 11px 12px;
          border: 1px solid color-mix(in srgb, var(--error-color) 35%, var(--divider-color));
          border-radius: 10px;
          font-size: 13px;
        }
        .finance-section { grid-column: 1 / -1; min-width: 0; }
        .finance-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }
        .finance-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .finance-heading .section-title { margin: 0; }
        .finance-official-badge {
          padding: 3px 7px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--primary-color) 13%, transparent);
          color: var(--primary-color);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
        }
        .finance-reference-controls {
          display: grid;
          grid-template-columns: var(--energy-control-height) minmax(110px, auto) var(--energy-control-height);
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .finance-reference-button {
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          padding: 0;
        }
        .finance-reference-select {
          min-width: 0;
          height: var(--energy-control-height);
          padding: 0 28px 0 10px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font: inherit;
          font-size: 12px;
          font-weight: 600;
        }
        .finance-reference-select:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .finance-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
          min-width: 0;
        }
        .finance-summary-item {
          display: grid;
          gap: 5px;
          min-width: 0;
          padding: 11px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
        }
        .finance-summary-item.primary {
          border: 1px solid color-mix(in srgb, var(--primary-color) 38%, var(--divider-color));
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .finance-summary-label { color: var(--secondary-text-color); font-size: 11px; }
        .finance-summary-value { overflow-wrap: anywhere; font-size: 18px; }
        .finance-summary-item.primary .finance-summary-value { font-size: 22px; }
        .finance-details { min-width: 0; }
        .finance-details-summary { cursor: pointer; font-size: 13px; font-weight: 700; }
        .finance-details-summary:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 3px;
        }
        .finance-details-body { display: grid; gap: 11px; margin-top: 11px; min-width: 0; }
        .finance-period { color: var(--secondary-text-color); font-size: 12px; }
        .finance-items { display: grid; gap: 8px; min-width: 0; }
        .finance-item {
          display: grid;
          gap: 8px;
          min-width: 0;
          padding: 11px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
        }
        .finance-item-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: baseline;
        }
        .finance-item-description,
        .finance-item-value { overflow-wrap: anywhere; }
        .finance-item-value.credit { color: var(--success-color, #2e7d32); }
        .finance-item-metadata { display: flex; flex-wrap: wrap; gap: 6px 12px; }
        .finance-item-metadata span { color: var(--secondary-text-color); font-size: 11px; }
        .finance-item-attributes {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          min-width: 0;
        }
        .finance-item-attributes .field {
          display: grid;
          gap: 3px;
          padding-top: 7px;
          border-top: 1px solid var(--divider-color);
        }
        .finance-item-attributes .field-value { text-align: left; }
        .finance-reconciliation {
          display: grid;
          gap: 4px;
          padding: 10px 12px;
          border: 1px solid var(--success-color, #43a047);
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.4;
        }
        .finance-reconciliation.warning {
          border-color: var(--warning-color, #f6a623);
        }
        .finance-reconciliation span { color: var(--secondary-text-color); }
        .finance-error {
          padding: 11px 12px;
          border: 1px solid color-mix(in srgb, var(--error-color) 35%, var(--divider-color));
          border-radius: 10px;
          font-size: 13px;
        }
        .payback-projection-section { grid-column: 1 / -1; min-width: 0; }
        .payback-projection-heading {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px 10px;
          margin-bottom: 12px;
        }
        /* O anel empurra-se para a direita da propria linha do titulo: sem ele
           aqui, sobrava uma faixa inteira com um circulo solto num canto. */
        .payback-projection-heading .payback-header { margin-left: auto; }
        .payback-projection-heading .section-title { margin: 0; }
        /* Tabela comparativa da aba Auditoria. Mesma gramatica da auditoria do
           payback: cabecalho discreto, numeros tabulares, veredito a direita. */
        .audit-overview { display: grid; gap: 10px; }
        .audit-overview-wrap { display: grid; gap: 12px; }
        .audit-overview-heading {
          display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px;
          padding: 0 4px;
        }
        /* A pergunta usa a mesma tipografia dos rotulos de coluna, no azul do
           kicker: caixa alta, corpo pequeno e espacamento largo. */
        .audit-overview-heading .section-title {
          margin: 0;
          color: var(--primary-color, #0288d1);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
        }
        .audit-overview-note {
          margin: 12px 0 0;
          color: var(--secondary-text-color);
          font-size: 11px; line-height: 1.5;
        }
        .audit-overview-note strong {
          color: var(--primary-text-color); font-weight: 600;
        }
        /* Sem cor nos sinais: na tabela o vermelho marca estouro de tolerancia,
           nao o sinal. Colorir aqui ensinaria uma leitura que a coluna nao faz. */
        .audit-sign { font-variant-numeric: tabular-nums; font-weight: 700; }
        .audit-scope { display: flex; align-items: center; gap: 7px; }
        .audit-scope + .audit-scope { margin-left: 4px; }
        .audit-overview-heading .audit-scope:first-of-type { margin-left: auto; }
        .audit-scope-label {
          color: var(--secondary-text-color); font-size: 10px;
          font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
        }
        .audit-scope-select {
          height: var(--energy-control-height);
          padding: 0 9px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font: 600 12px/1 inherit;
        }
        .audit-scope-select:focus-visible {
          outline: 2px solid var(--primary-color); outline-offset: 1px;
        }
        /* Sem overflow aqui no desktop: overflow-x auto faz desta div o
           contentor de rolagem, e como ela nao tem altura o sticky de dentro
           nunca dispara. Na faixa estreita a rolagem volta e o sticky dorme. */
        .audit-overview-scroll { overflow-x: visible; }
        @media (max-width: 1300px) {
          .audit-overview-scroll { overflow-x: auto; }
        }
        /* Ocupa a largura toda. O min-width segura a Conferencia acima do que a
           pastilha mais o badge precisam; abaixo disso a div de fora e que rola. */
        .audit-overview-table {
          width: 100%; min-width: 1160px; table-layout: fixed;
          border-collapse: collapse; font-size: 12.5px;
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }
        .audit-overview-table th {
          padding: 0 10px 7px;
          border-bottom: 1px solid var(--divider-color);
          color: var(--secondary-text-color); text-align: center;
          font-size: 11px; font-weight: 700;
          letter-spacing: .07em; text-transform: uppercase;
        }
        .audit-overview-table td {
          padding: 7px 10px;
          text-align: center;
          vertical-align: middle;
        }
        /* So a unidade fica no topo, e por obrigacao: e de la que o nome
           grudado parte. As demais centralizam na altura da linha. Precisa do
           td na frente para vencer a regra acima, de mesma classe. */
        .audit-overview-table td.audit-unit-cell { vertical-align: top; }
        /* O fio marca troca de ciclo, nunca o meio do par. Antes era o oposto:
           a linha mais forte caia entre Importacao e Exportacao — que sao o
           mesmo ciclo — e a mais fraca entre um mes e o outro. */
        .audit-overview-table tbody tr:not(.metric-continued) td {
          border-top: 1px solid color-mix(in srgb, var(--divider-color) 38%, transparent);
        }
        .audit-overview-table tbody tr:first-child td { border-top: 0; }
        /* Ciclos alternados recebem um tingimento neutro. Neutro de proposito:
           verde e vermelho ja significam o veredito nesta mesma linha. */
        /* A coluna da unidade fica de fora: como a celula atravessa o bloco
           inteiro, tingi-la pintaria a coluna toda com a faixa de um ciclo so. */
        .audit-overview-table tr.banded td:not(.audit-unit-cell) {
          background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
        }
        /* Tudo centralizado. As classes num e audit-metric-cell continuam
           marcando o papel de cada celula: trocar o valor aqui devolve o
           alinhamento por coluna sem mexer na montagem das linhas. */
        .audit-overview-table td.num,
        .audit-overview-table td.audit-metric-cell { text-align: center; }
        /* Unidade e Ciclo sao rotulos de bloco: ancorados a esquerda, eles dao
           a coluna vertical que o olho segue ao descer a tabela. Precisam do
           td na frente para vencer a regra base, que centraliza tudo. */
        .audit-overview-table td.audit-unit-cell,
        .audit-overview-table td.audit-cycle-cell,
        .audit-overview-table th:nth-child(-n+2) { text-align: left; }
        /* A celula da unidade e alta como o bloco; o nome mora no topo dela e
           acompanha a rolagem ate a unidade acabar. */
        .audit-unit-cell { font-weight: 600; }
        .audit-unit-sticky {
          position: sticky;
          top: var(--audit-sticky-top, 64px);
          z-index: 1;
          display: block;
        }
        .audit-unit-name { display: block; line-height: 1.25; }
        .audit-overview-table col.audit-col-unit { width: 240px; }
        .audit-overview-table col.audit-col-diff { width: 200px; }
        .audit-unit-photo-wrap {
          --audit-foto-max: 200px;
          margin-top: 4px;
          width: min(var(--audit-foto, 120px), var(--audit-foto-max));
          height: calc(min(var(--audit-foto, 120px), var(--audit-foto-max)) * 3 / 4);
          overflow: hidden;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
        }
        /* Tablet: a tabela ja rola de lado, entao a coluna da unidade nao
           precisa do mesmo peso que tem no monitor. E o sticky sai de cena: e a
           faixa em que o overflow-x da div de fora ja o impedia de funcionar, e
           dentro de celula de tabela ele ainda desloca o nome para baixo em
           bloco alto — visivel no iPhone e no tablet com "todos os ciclos". */
        @media (max-width: 1300px) {
          .audit-overview-table col.audit-col-unit { width: 190px; }
          .audit-overview-table col.audit-col-diff { width: 190px; }
          .audit-unit-photo-wrap { --audit-foto-max: 150px; }
          .audit-unit-sticky { position: static; }
        }
        /* Celular: aqui a foto identifica, nao ilustra. Grande demais ela vira
           o elemento dominante de uma tela que existe para comparar numeros. */
        @media (max-width: 760px) {
          .audit-overview-table col.audit-col-unit { width: 148px; }
          .audit-overview-table col.audit-col-diff { width: 168px; }
          .audit-unit-photo-wrap { --audit-foto-max: 108px; }
        }
        .audit-unit-photo {
          display: block;
          width: 100%; height: 100%;
          object-fit: cover;
        }
        /* Troca de unidade: fio cheio, sem respiro extra. O recuo de 18px que
           havia aqui nao existia no primeiro bloco, entao a primeira unidade
           comecava colada e as outras afundavam — o fio sozinho ja separa. */
        .audit-overview-table tr.unit-start:not(:first-child) td {
          border-top: 1px solid var(--divider-color);
        }
        .audit-cycle-cell { color: var(--secondary-text-color); font-weight: 600; }
        /* O periodo e leitura de apoio: na mesma linha, menor e mais apagado,
           sem competir com a referencia, que e o que se procura ao varrer. */
        .audit-cycle-period {
          font-size: 10.5px;
          font-weight: 400;
          opacity: .7;
        }
        .audit-overview-table td.paid { color: var(--error-color, #e5534b); font-weight: 600; }
        .audit-diff-cell { white-space: nowrap; }
        /* O kWh lidera e o percentual acompanha, menor. O ponto separa sem
           pesar: com uma barra os dois numeros passariam a ler como fracao. */
        .audit-diff-percent {
          color: var(--secondary-text-color);
          font-size: 11px;
        }
        .audit-diff-percent::before {
          content: "·";
          margin: 0 5px;
          opacity: .55;
        }
        /* Fora da tolerancia a celula inteira fica vermelha, inclusive a parte
           secundaria — senao o percentual seria o unico trecho apagado. */
        .audit-overview-table td.paid .audit-diff-percent { color: inherit; }
        .audit-overview-table tr.muted td { opacity: .55; }
        .audit-overview-table td.verdict {
          font-size: 11.5px; white-space: nowrap;
        }
        .audit-overview-table td.verdict.none { color: var(--secondary-text-color); }
        .verdict.none .audit-chip {
          color: var(--secondary-text-color);
          background: color-mix(in srgb, var(--secondary-text-color) 10%, transparent);
        }
        .verdict.none .audit-chip-dot { opacity: .6; }
        /* Dois trilhos de largura fixa: o chip sempre acaba no mesmo x, e o
           badge sempre comeca no mesmo x, tenha ele conteudo ou nao. */
        .verdict-inner {
          display: grid;
          width: max-content;
          margin-inline: auto;
          grid-template-columns: auto 34px;
          align-items: center;
          gap: 8px;
          justify-items: end;
        }
        /* Chip do veredito: a bolinha carrega a cor, a palavra carrega o sentido.
           O numero da tolerancia mora no title, nao em vinte linhas iguais. */
        /* Largura fixa: a pastilha e a mesma em Dentro, Fora e Sem dados, senao
           a coluna vira um degrau a cada linha. O rotulo mais longo define. */
        .audit-chip {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px;
          min-width: 100px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px; font-weight: 600;
          cursor: default;
        }
        .audit-chip-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor;
        }
        .verdict.in .audit-chip {
          color: var(--success-color, #4caf7d);
          background: color-mix(in srgb, var(--success-color, #4caf7d) 12%, transparent);
        }
        .verdict.out .audit-chip {
          color: var(--error-color, #e5534b);
          background: color-mix(in srgb, var(--error-color, #e5534b) 14%, transparent);
        }
        /* A ocorrencia e clicavel e precisa parecer: badge proprio, separado do
           veredito, porque ter ocorrencia nao e o mesmo que estourar tolerancia. */
        .audit-issue-slot { display: block; width: 34px; }
        .audit-issue-button {
          appearance: none;
          min-height: 0;
          width: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 3px 0;
          border: 1px solid color-mix(in srgb, var(--divider-color) 80%, transparent);
          border-radius: 999px;
          background: transparent;
          color: var(--secondary-text-color);
          font: inherit;
          cursor: pointer;
        }
        .audit-issue-button:hover {
          color: var(--primary-text-color);
          border-color: var(--secondary-text-color);
        }
        .audit-issue-button:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .audit-issue-glyph { --mdc-icon-size: 13px; width: 13px; height: 13px; }
        .audit-issue-count {
          font-size: 10.5px; font-weight: 600; font-style: normal;
          white-space: nowrap;
        }
        .audit-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: color-mix(in srgb, #000 45%, transparent);
        }
        .audit-modal {
          width: min(500px, 100%);
          max-height: min(70vh, 560px);
          display: flex;
          flex-direction: column;
          border-radius: 14px;
          background: var(--card-background-color, var(--ha-card-background, #fff));
          box-shadow: 0 18px 48px color-mix(in srgb, #000 32%, transparent);
        }
        .audit-modal-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px 10px;
          border-bottom: 1px solid var(--divider-color);
        }
        .audit-modal-title {
          flex: 1;
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.35;
        }
        .audit-modal-close {
          appearance: none;
          min-height: 0;
          padding: 0 4px;
          border: 0;
          background: transparent;
          color: var(--secondary-text-color);
          font: inherit;
          line-height: 1;
          cursor: pointer;
        }
        .audit-modal-body {
          display: grid;
          gap: 12px;
          padding: 12px 16px 16px;
          overflow-y: auto;
        }
        .audit-modal-context { display: grid; gap: 2px; }
        .audit-modal-reason { font-size: 12.5px; }
        .audit-modal-list { display: grid; gap: 10px; }
        /* Quando · quantos · atalho, sempre nos mesmos tres trilhos: o botao
           fica na frente de "intervalos" em toda linha, sem quebrar. */
        .audit-modal-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          align-items: center;
          gap: 10px;
        }
        .audit-modal-row + .audit-modal-row {
          padding-top: 10px;
          border-top: 1px solid color-mix(in srgb, var(--divider-color) 55%, transparent);
        }
        .audit-modal-main { display: grid; gap: 2px; min-width: 0; }
        .audit-modal-when {
          font-size: 12px;
          line-height: 1.4;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .audit-modal-count {
          color: var(--secondary-text-color);
          font-size: 11px;
          white-space: nowrap;
        }
        .audit-modal-goto {
          appearance: none;
          min-height: 0;
          white-space: nowrap;
          padding: 4px 10px;
          border: 1px solid var(--divider-color);
          border-radius: 999px;
          background: transparent;
          color: var(--primary-color);
          font: inherit;
          font-size: 11.5px;
          cursor: pointer;
        }
        .audit-modal-goto:hover {
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        /* O grafico pede largura e altura; a lista de ocorrencias, nao. Cada
           vista do modal traz a sua propria caixa. */
        .audit-modal-wide {
          width: min(880px, 100%);
          max-height: min(84vh, 660px);
        }
        .audit-modal-back {
          font-size: 20px;
          color: var(--primary-color);
        }
        .audit-chart-frame { height: clamp(240px, 44vh, 400px); }
        .audit-modal-note {
          padding-top: 10px;
          border-top: 1px solid var(--divider-color);
          color: var(--secondary-text-color);
          font-size: 10.5px;
          line-height: 1.35;
        }
        /* Tela estreita: tudo encolhe junto para os tres trilhos continuarem
           cabendo numa linha so, que e o ponto do arranjo. */
        @media (max-width: 560px) {
          .audit-modal-body { padding: 12px 12px 14px; }
          .audit-chart-frame { height: clamp(200px, 38vh, 300px); }
          .audit-modal-row { gap: 7px; }
          .audit-modal-when { font-size: 10.5px; }
          .audit-modal-count { font-size: 9.5px; }
          .audit-modal-goto { padding: 4px 8px; font-size: 10px; }
        }
        @media (max-width: 760px) {
          .audit-overview-table { font-size: 11.5px; }
          .audit-overview-table th, .audit-overview-table td { padding-right: 9px; }
          .audit-chip { min-width: 92px; padding: 3px 8px; }
          .verdict-inner { grid-template-columns: 1fr 32px; gap: 6px; }
          .audit-issue-slot, .audit-issue-button { width: 32px; }
        }
        .payback-audit {
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: color-mix(in srgb, var(--primary-text-color) 2%, transparent);
        }
        .payback-audit > summary,
        .payback-audit-cycle > summary { cursor: pointer; list-style: none; }
        .payback-audit > summary::-webkit-details-marker,
        .payback-audit-cycle > summary::-webkit-details-marker { display: none; }
        .payback-audit-title {
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
        }
        .payback-audit-title::before,
        .payback-audit-cycle-title::before {
          content: "▸";
          display: inline-block;
          width: 12px;
          color: var(--secondary-text-color);
          transition: transform .15s ease;
        }
        .payback-audit[open] > .payback-audit-title::before,
        .payback-audit-cycle[open] > .payback-audit-cycle-title::before {
          transform: rotate(90deg);
        }
        .payback-audit-formula {
          display: grid;
          gap: 2px;
          padding: 0 12px 9px 24px;
          color: var(--secondary-text-color);
          font-size: 11px;
          line-height: 1.5;
        }
        .payback-audit-rule,
        .payback-audit-note { margin: 0; }
        .payback-audit-rule strong { color: var(--primary-color); }
        .payback-audit-note {
          margin-top: 4px;
          max-width: 96ch;
          opacity: .75;
        }
        .payback-audit-cycle { border-top: 1px solid var(--divider-color); }
        .payback-audit-cycle-title {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 7px 12px;
          font-size: 12px;
        }
        .payback-audit-partial {
          color: #f2b544;
          font-size: 11px;
          font-weight: 600;
        }
        .payback-audit-cycle-total {
          margin-left: auto;
          color: var(--secondary-text-color);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        }
        .payback-audit-tariff {
          display: grid;
          gap: 2px;
          margin: 0 12px 8px;
          padding: 7px 9px;
          border-left: 2px solid var(--primary-color);
          border-radius: 0 6px 6px 0;
          background: color-mix(in srgb, var(--primary-color) 6%, transparent);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        }
        /* Fórmula numa linha só, que se dobra entre os fatores quando a tela é
           estreita — nunca no meio de um número. */
        .payback-audit-tariff-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 3px 6px;
        }
        .payback-audit-tariff-value { white-space: nowrap; }
        .payback-audit-tariff-label { font-weight: 600; white-space: nowrap; }
        .payback-audit-tariff-step {
          color: var(--secondary-text-color);
          white-space: nowrap;
        }
        /* min-width: 0 em toda a cadeia: sem isso a largura intrínseca da tabela
           (doze colunas com nowrap) sobe pelos ancestrais e estica o painel
           inteiro, e aí não é a tabela que rola — é a página que fica larga. */
        .payback-audit,
        .payback-audit-cycle { min-width: 0; }
        .payback-audit-scroll {
          overflow-x: auto;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
          min-width: 0;
          padding: 0 12px;
        }
        .payback-audit-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .payback-audit-table th {
          padding: 4px 8px 4px 0;
          border-bottom: 1px solid var(--divider-color);
          color: var(--secondary-text-color);
          font-weight: 600;
          text-align: right;
        }
        /* Os grupos existem para as três conferências ficarem visíveis como
           blocos: o que a energia valeria, o que a fatura cobrou, e o resultado. */
        .payback-audit-groups th {
          padding-bottom: 2px;
          border-bottom: 0;
          color: var(--primary-color);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .04em;
          text-align: left;
          text-transform: uppercase;
        }
        .payback-audit-groups th + th {
          border-left: 1px solid var(--divider-color);
          padding-left: 8px;
        }
        .payback-audit-table td {
          padding: 4px 8px 4px 0;
          border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 45%, transparent);
          text-align: right;
        }
        .payback-audit-table th:first-child,
        .payback-audit-table td:first-child { text-align: left; }
        .payback-audit-value { font-weight: 700; }
        /* Só acende quando a fatura montada dos itens discorda da derivada da
           economia: ali há algo a investigar, e o silêncio esconderia. */
        .payback-audit-table td.mismatch { color: var(--error-color, #db4437); }
        .payback-audit-source {
          display: block;
          color: var(--warning-color, #f6a623);
          font-size: 9.5px;
          font-style: italic;
        }
        .payback-audit-source.own {
          color: var(--secondary-text-color);
          font-style: normal;
        }
        .payback-audit-table tr.muted td { opacity: .5; }
        .payback-audit-table tr.hypothetical td { font-style: italic; }
        .payback-audit-table tr.hypothetical td:first-child { font-style: normal; }
        /* No telefone a tabela vira uma pilha de blocos: cada unidade é um cartão
           e cada valor traz o nome da própria coluna. Doze colunas não cabem numa
           tela de telefone, e rolar de lado esconde metade da auditoria. */
        @media (max-width: 760px) {
          .payback-audit-scroll { overflow-x: visible; padding: 0 10px; }
          .payback-audit-table { white-space: normal; }
          .payback-audit-table thead { display: none; }
          .payback-audit-table tbody,
          .payback-audit-table tr { display: block; }
          .payback-audit-table tr {
            margin: 8px 0;
            padding: 6px 8px;
            border: 1px solid var(--divider-color);
            border-radius: 8px;
          }
          .payback-audit-table td {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 12px;
            padding: 3px 0;
            border: 0;
            text-align: right;
          }
          .payback-audit-table td::before {
            content: attr(data-label);
            color: var(--secondary-text-color);
            text-align: left;
          }
          /* A unidade é o título do cartão, não mais um par rótulo/valor. */
          .payback-audit-table td:first-child {
            margin-bottom: 3px;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--divider-color);
            font-weight: 700;
            text-align: left;
          }
          .payback-audit-table td:first-child::before { content: none; }
          .payback-audit-table td[data-empty] { display: none; }
          .payback-audit-source { display: inline; }
        }
        .payback-audit-foot {
          padding: 6px 12px 10px;
          color: var(--secondary-text-color);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
        }
        .payback-projection-metadata {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 6px 14px;
          color: var(--secondary-text-color);
          font-size: 12px;
        }
        .payback-projection-metadata strong { color: var(--primary-text-color); }
        .payback-projection-warning,
        .payback-projection-note {
          margin: 0;
          font-size: 12px;
          line-height: 1.45;
        }
        .payback-projection-warning { color: var(--warning-color, #f6a623); }
        .payback-projection-note { color: var(--secondary-text-color); }
        .payback-projection-error {
          display: grid;
          justify-items: start;
          gap: 8px;
          padding: 11px 12px;
          border: 1px solid color-mix(in srgb, var(--error-color) 35%, var(--divider-color));
          border-radius: 10px;
          font-size: 13px;
        }
        .scee-section { grid-column: 1 / -1; }
        .scee-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }
        .scee-header .section-title { margin: 0; }
        .scee-reference-controls {
          display: grid;
          grid-template-columns: var(--energy-control-height) minmax(110px, auto) var(--energy-control-height);
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          min-width: 0;
        }
        .scee-reference-button {
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          min-height: var(--energy-control-height);
          height: var(--energy-control-height);
          padding: 0;
          border-radius: 9px;
        }
        .scee-reference-select {
          min-width: 0;
          height: var(--energy-control-height);
          padding: 0 28px 0 10px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font: inherit;
          font-size: 12px;
          font-weight: 600;
        }
        .scee-metadata,
        .scee-primary-grid,
        .scee-secondary-grid {
          display: grid;
          gap: 10px;
          min-width: 0;
        }
        .scee-metadata { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .scee-primary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .scee-secondary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .scee-metadata .field,
        .scee-primary-grid .field,
        .scee-secondary-grid .field,
        .scee-extraction > .field {
          display: grid;
          align-content: start;
          gap: 4px;
          padding: 10px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: color-mix(in srgb, var(--secondary-text-color) 4%, transparent);
        }
        .scee-metadata .field-value,
        .scee-primary-grid .field-value,
        .scee-secondary-grid .field-value,
        .scee-extraction .field-value { text-align: left; }
        .scee-primary-grid .field-value { font-size: 17px; }
        .scee-not-applicable {
          padding: 14px 16px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: color-mix(in srgb, var(--secondary-text-color) 4%, transparent);
          color: var(--secondary-text-color);
          font-size: 13px;
          font-weight: 500;
        }
        .scee-extraction { display: grid; gap: 8px; min-width: 0; }
        .scee-alerts summary { cursor: pointer; font-size: 12px; font-weight: 700; }
        .scee-alert-list { display: grid; gap: 5px; margin: 8px 0 0; padding-left: 18px; }
        .scee-alert-list li { font-size: 12px; line-height: 1.4; }
        .scee-error {
          padding: 10px 12px;
          border: 1px solid color-mix(in srgb, var(--error-color) 35%, var(--divider-color));
          border-radius: 10px;
          color: var(--primary-text-color);
          font-size: 13px;
        }
        .audit-quality { grid-column: 1 / -1; }
        .audit-result { display: grid; gap: 12px; min-width: 0; }
        .audit-header, .audit-entry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .audit-heading { display: grid; flex: 1 1 auto; gap: 5px; min-width: 0; }
        .audit-reference-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }
        .audit-reference-label {
          color: var(--secondary-text-color);
          font-size: 12px;
        }
        .audit-reference-controls {
          display: grid;
          grid-template-columns: var(--energy-control-height) minmax(112px, auto) var(--energy-control-height);
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          min-width: 0;
        }
        .audit-reference-button {
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          padding: 0;
          font-size: 16px;
          line-height: 1;
        }
        .audit-reference-select {
          width: 100%;
          min-width: 0;
          height: var(--energy-control-height);
          padding: 4px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font: inherit;
          font-size: 12px;
        }
        .audit-period { color: var(--secondary-text-color); font-size: 11px; }
        .audit-badge {
          flex: 0 0 auto;
          padding: 4px 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--secondary-text-color) 12%, transparent);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .04em;
        }
        .audit-ok {
          background: color-mix(in srgb, var(--success-color, #43a047) 16%, transparent);
          color: var(--success-color, #43a047);
        }
        .audit-attention, .audit-incomplete {
          background: color-mix(in srgb, var(--warning-color, #f6a623) 16%, transparent);
          color: var(--warning-color, #f6a623);
        }
        .audit-entry-grid {
          display: grid;
          gap: 10px;
        }
        .audit-entry-grid-single { grid-template-columns: minmax(0, 1fr); }
        .audit-entry-grid-multiple {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .audit-entry {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px 0;
          min-width: 0;
          padding: 12px;
          border: 1px solid var(--divider-color);
          border-radius: 11px;
          background: color-mix(in srgb, var(--primary-text-color) 3%, transparent);
        }
        .audit-entry-title { font-size: 14px; }
        .audit-entry-header {
          align-items: center;
          display: flex;
          grid-column: 1 / -1;
          justify-content: space-between;
        }
        .audit-values { display: contents; }
        .audit-values > .field,
        .audit-entry > .audit-tolerance {
          min-width: 0;
          padding-inline: 12px;
          border-left: 1px solid color-mix(in srgb, var(--divider-color) 55%, transparent);
        }
        .audit-values > .field:first-child {
          padding-left: 0;
          border-left: 0;
        }
        .audit-entry-grid-single .audit-entry {
          align-items: start;
          padding-block: 10px;
        }
        .audit-entry-grid-single .audit-tolerance {
          align-self: start;
        }
        .audit-entry .audit-issues,
        .audit-entry .audit-explanation {
          grid-column: 1 / -1;
          align-self: start;
        }
        .audit-values .field,
        .audit-entry > .audit-tolerance {
          align-content: start;
          display: grid;
          justify-content: stretch;
          gap: 3px;
        }
        .audit-values .field-value { text-align: left; }
        .audit-difference .field-value { display: grid; gap: 2px; }
        .audit-percent { color: var(--secondary-text-color); font-size: 11px; }
        .audit-tolerance, .audit-explanation, .audit-disclaimer,
        .audit-not-applicable {
          color: var(--secondary-text-color);
          font-size: 12px;
          line-height: 1.45;
        }
        .audit-tolerance .field-value {
          color: var(--primary-text-color);
          text-align: left;
        }
        .audit-issues summary { cursor: pointer; font-size: 12px; font-weight: 700; }
        .audit-issue-list { display: grid; gap: 5px; margin: 8px 0 0; padding-left: 18px; }
        .audit-issue-list li { font-size: 12px; line-height: 1.35; }
        .audit-event-list {
          display: grid;
          gap: 8px;
          margin-top: 10px;
        }
        .audit-event {
          display: grid;
          gap: 2px;
          padding-top: 8px;
          border-top: 1px solid color-mix(in srgb, var(--divider-color) 55%, transparent);
        }
        .audit-event-reason { font-size: 12px; }
        .audit-event-description,
        .audit-event-period { font-size: 12px; line-height: 1.4; }
        .audit-event-source { color: var(--secondary-text-color); font-size: 11px; }
        .audit-other-evidence, .audit-billing-quality {
          display: grid;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--divider-color);
        }
        .audit-billing-quality {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .audit-billing-quality > .audit-subtitle,
        .audit-billing-quality > .audit-explanation {
          grid-column: 1 / -1;
        }
        .audit-billing-quality > .field {
          align-content: start;
          display: grid;
          justify-content: stretch;
          gap: 3px;
          min-width: 0;
          padding: 10px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--primary-text-color) 3%, transparent);
        }
        .audit-billing-quality > .field .field-value {
          overflow-wrap: anywhere;
          text-align: left;
        }
        .audit-subtitle { margin: 0; font-size: 13px; }
        .history-panel { display: grid; gap: 13px; overflow: hidden; }
        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .history-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; min-width: 0; }
        .history-heading .section-title { margin: 0; }
        .history-mode-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          padding: 2px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
        }
        .history-mode-button {
          min-height: 26px;
          padding: 3px 8px;
          border: 0;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .06em;
        }
        .history-mode-button[aria-pressed="true"] {
          background: color-mix(in srgb, var(--primary-color) 16%, transparent);
          color: var(--primary-color);
        }
        /* Mesmas medidas do grupo de data da Comparacao. */
        .history-controls {
          display: grid;
          /* A coluna do meio segue a largura declarada no campo, que e fixa
             por modo. Com largura por conteudo, o grupo mudava de tamanho e
             de posicao a cada troca de DIA para MES ou ANO. minmax(0, auto)
             deixa encolher numa tela muito estreita em vez de estourar. As
             ALTURAS nao mudam: continuam todas em --energy-control-height, a
             mesma do segmentado DIA/MES/ANO. */
          grid-template-columns: var(--energy-control-height) minmax(0, auto) var(--energy-control-height);
          justify-content: start;
          align-items: center;
          gap: 5px;
        }
        .history-date-button {
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          padding: 0;
          font-size: 16px;
          line-height: 1;
        }
        .history-date-input {
          width: var(--energy-period-field);
          max-width: 100%;
          min-width: 0;
          text-align: center;
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          padding: 4px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          color-scheme: light dark;
          font-family: inherit;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .03em;
        }
        .history-date-input:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .history-state {
          display: grid;
          place-items: center;
          gap: 10px;
          min-height: clamp(300px, 34vw, 420px);
          padding: 18px;
          border-radius: 11px;
          background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
          color: var(--secondary-text-color);
          text-align: center;
        }
        .history-state.compact {
          min-height: 0;
          padding-block: 14px;
        }
        .history-error { color: var(--primary-text-color); }
        .history-error.compact {
          grid-template-columns: minmax(0, 1fr) auto;
          place-items: center start;
          min-height: 0;
          padding: 10px;
          text-align: left;
        }
        .history-chart-frame {
          position: relative;
          width: 100%;
          min-width: 0;
          height: clamp(300px, 34vw, 420px);
          overflow: hidden;
        }
        .history-chart { width: 100%; height: 100%; min-width: 0; }
        .history-refreshing, .history-progress, .history-issues {
          color: var(--secondary-text-color);
          font-size: 12px;
        }
        .history-refreshing { justify-self: end; }
        .history-progress { font-weight: 700; }
        .history-cycle-reference {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 12px;
          font-weight: 700;
        }
        .history-cycle-open-state {
          margin: -7px 0 0;
          color: var(--secondary-text-color);
          font-size: 12px;
        }
        .history-cycle-unavailable { gap: 8px; }
        .history-cycle-unavailable p { margin: 6px 0 0; }
        .history-cycle-unavailable small { font-size: 12px; }
        .history-cycle-official { display: grid; gap: 4px; }
        .history-cycle-official span { font-size: 12px; }
        .history-cycle-official strong { color: var(--primary-text-color); font-size: 20px; }
        .history-issues {
          padding: 9px 11px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--warning-color, #f6a623) 12%, transparent);
        }
        .history-totals {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
          gap: 8px;
        }
        /* Um bloco so serve os dois paineis: eram duas regras com os mesmos
           numeros escritos duas vezes, e bastava mexer numa para as telas
           divergirem. */
        .history-total,
        .comparison-total {
          display: grid;
          gap: 4px;
          min-width: 0;
          padding: 10px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--primary-text-color) 4%, transparent);
        }
        .history-total span,
        .comparison-total span { color: var(--secondary-text-color); font-size: 11px; }
        .history-tooltip { display: grid; gap: 7px; min-width: 190px; }
        .history-tooltip > div {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 4px 12px;
        }
        .history-tooltip small {
          grid-column: 1 / -1;
          max-width: 280px;
          white-space: normal;
          opacity: .78;
        }
        .comparison-panel {
          display: grid;
          gap: 13px;
          overflow: hidden;
        }
        .comparison-result { display: grid; gap: 13px; min-width: 0; }
        /* Uma linha so, sem quebra: titulo e estrategia a esquerda, os
           controles a direita. Quem cede espaco e o titulo, nao o grupo de
           controles — eles tem tamanho de conteudo e quebrar um deles
           partiria o grupo no meio. Abaixo de 760px a media query empilha
           tudo em coluna, que e a saida honesta para tela estreita. */
        .comparison-header {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px 10px;
        }
        .comparison-controls { flex: 0 0 auto; min-width: 0; }
        .comparison-heading {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }
        .comparison-heading { flex: 0 1 auto; }
        .comparison-heading .section-title { margin: 0; }
        .comparison-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          min-width: 0;
        }
        .comparison-controls > .comparison-metric { flex: 0 0 auto; }
        .comparison-reference-group {
          display: grid;
          /* A comparacao nunca mostra ciclo: o rotulo mais longo dela e o do
             mes. Por isso ela usa a largura curta, e nao a do ciclo — era a
             largura do ciclo que deixava este grupo largo a toa, com um terco
             da caixa vazio ao lado de "setembro de 2026". */
          grid-template-columns: var(--energy-control-height) minmax(0, auto) var(--energy-control-height);
          justify-content: start;
          align-items: center;
          gap: 5px;
          /* Sem largura minima fixa: os 230px anteriores ignoravam as larguras
             acima e sozinhos jogavam a linha de controles para baixo. */
          min-width: 0;
          flex: 0 0 auto;
        }
        .comparison-reference-group .history-date-button {
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          flex-shrink: 0;
          padding: 0;
          font-size: 16px;
          line-height: 1;
        }
        .comparison-reference-group .history-date-input,
        .comparison-custom-field .history-date-input {
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 800;
        }
        /* Sem largura minima: um <select> ja se dimensiona pela opcao mais
           longa que carrega. Os 170px fixos deixavam "Mes" com metade da caixa
           vazia e todos os tres com a mesma largura, independentemente do
           texto. */
        .comparison-metric {
          min-width: 0;
          padding-inline: 7px;
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          padding: 4px 9px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          color-scheme: light dark;
          font-family: inherit;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .03em;
        }
        .comparison-metric:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .comparison-duration-warning {
          padding: 9px 11px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--warning-color, #f6a623) 12%, transparent);
          color: var(--secondary-text-color);
          font-size: 12px;
        }
        .comparison-custom-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
          align-items: end;
          gap: 10px;
        }
        .comparison-custom-period {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          min-width: 0;
          margin: 0;
          padding: 10px;
          border: 1px solid var(--divider-color);
          border-radius: 10px;
        }
        .comparison-custom-period legend { padding-inline: 4px; font-weight: 700; }
        /* Modo Dia: um campo so. Com as duas colunas do intervalo, a data
           ficava numa metade e a outra metade do retangulo vazia. */
        .comparison-custom-period-single { grid-template-columns: minmax(0, 1fr); }
        .comparison-custom-choice {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          padding: 2px;
          border: 1px solid var(--divider-color);
          border-radius: 9px;
        }
        .comparison-custom-options {
          display: flex;
          flex: 0 0 auto;
          flex-wrap: nowrap;
          align-items: center;
          gap: 8px 12px;
          min-width: 0;
        }
        .comparison-custom-option {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .comparison-custom-option > span {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .03em;
        }
        .comparison-custom-fixed {
          display: inline-flex;
          align-items: center;
          cursor: default;
        }
        .comparison-custom-validation {
          align-self: center;
          margin: 0;
          color: var(--warning-color, #f6a623);
          font-size: 12px;
          grid-column: 1 / 3;
          grid-row: 2;
        }
        .comparison-custom-validation[hidden] { display: none; }
        .comparison-custom-submit {
          display: flex;
          grid-column: 3;
          grid-row: 1;
          align-self: stretch;
          align-items: flex-end;
          justify-content: flex-end;
        }
        .comparison-custom-submit > .button {
          width: auto;
          height: var(--energy-control-height);
          min-height: var(--energy-control-height);
          margin: 0;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .03em;
        }
        .comparison-custom-field { display: grid; gap: 4px; min-width: 0; }
        /* O rotulo e texto, nao grade. Ele estava colado no seletor do
           .comparison-totals por uma edicao anterior e herdava dali duas
           colunas de 155px: 318px de largura minima num rotulo escrito
           "Data", que empurravam o campo para fora do retangulo do periodo. */
        .comparison-custom-field > span {
          color: var(--secondary-text-color);
          font-size: 11.5px;
          font-weight: 700;
        }
        .comparison-totals {
          display: grid;
          grid-template-columns: repeat(2, minmax(155px, 1fr));
          gap: 8px;
        }
        /* Sem tamanho proprio: herda o mesmo corpo do total do historico, que
           e o numero equivalente na outra tela. */
        .comparison-value { overflow-wrap: anywhere; }
        @media (max-width: 1200px) {
          .overview-unit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .energy-flow-diagram { min-width: 0; }
          /* Abaixo disto o fluxo perde os cinco nos numa linha; empilhar e
             melhor que espremer os dois paineis lado a lado. */
          .overview-flow-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .overview-unit-grid { grid-template-columns: 1fr; }
          .energy-flow-diagram { min-width: 0; }
          .toolbar { align-items: stretch; flex-direction: column; }
          .billing-reference-global { align-self: start; width: min(100%, 260px); }
          .overview-heading > .billing-reference-global-select { align-self: start; width: min(100%, 260px); }
          .identity {
            grid-template-columns: 92px minmax(0, 1fr);
            align-items: center;
            gap: 12px;
          }
          .photo-wrap { width: 92px; height: 78px; }
          .identity-cycle { grid-column: 1 / -1; }
          .blocks { grid-template-columns: 1fr; }
          .history-header { align-items: stretch; flex-direction: column; }
          .history-controls { align-self: start; width: min(100%, 310px); }
          .comparison-header { align-items: stretch; flex-direction: column; }
          .comparison-custom-options { align-self: flex-start; }
          .comparison-controls {
            align-self: start;
            justify-content: flex-start;
            width: 100%;
          }
          .comparison-custom-form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .comparison-custom-submit {
            grid-column: 1;
            grid-row: 2;
            justify-content: flex-start;
          }
          .comparison-custom-validation { grid-column: 1 / -1; grid-row: 3; }
          .audit-header { align-items: flex-start; }
          .distribution-shares { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .distribution-period { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .distribution-input-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .distribution-schedule-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .scee-primary-grid,
          .scee-secondary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .finance-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .audit-reference-line {
            align-items: flex-start;
            flex-direction: column;
          }
          .audit-entry-grid-multiple,
          .audit-billing-quality { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .audit-entry {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: stretch;
          }
          .audit-values > .field:nth-child(3) {
            padding-left: 0;
            border-left: 0;
          }
          .audit-entry-grid-single .audit-tolerance,
          .audit-entry-grid-single .audit-issues,
          .audit-entry-grid-single .audit-explanation { align-self: auto; }
        }
        @media (max-width: 480px) {
          .energy-flow { padding: 13px; }
          .energy-flow-header { gap: 7px; }
          .energy-flow-heading .section-title { font-size: 17px; }
          .energy-flow-diagram {
            grid-template-columns: 1fr;
            gap: 7px;
            min-height: 0;
          }
          .energy-flow-node { grid-template-columns: 85px minmax(0, 1fr); align-items: center; justify-items: stretch; }
          .energy-flow-icon { width: 81px; height: 81px; }
          .energy-flow-icon ha-icon { width: 39px; height: 39px; --mdc-icon-size: 39px; }
          .energy-flow-node-copy { justify-items: start; text-align: left; }
          .energy-flow-arrow { transform: rotate(90deg); line-height: 18px; }
          .energy-flow-branch {
            min-height: 24px;
            color: var(--fluxo-rotulo);
            text-align: center;
          }
          .energy-flow-branch::after { content: "↓"; font-size: 20px; }
          .energy-flow-branch svg { display: none; }
          .energy-flow-destinations { gap: 6px; }
          .rateio-body { grid-template-columns: 1fr; justify-items: center; }
          .billing-reference-global { align-self: stretch; width: 100%; }
          .overview-heading > .billing-reference-global-select { align-self: stretch; width: 100%; min-width: 0; }
          .content { padding: 9px; gap: 9px; }
          .panel { padding: 13px; }
          .identity-cycle { grid-template-columns: 1fr; }
          .metric-grid { grid-template-columns: 1fr; }
          .field { align-items: flex-start; }
          .history-controls { align-self: start; width: auto; }
          .history-chart-frame, .history-state { height: 300px; min-height: 300px; }
          .history-state.compact { height: auto; min-height: 0; }
          .history-totals { grid-template-columns: 1fr; }
          .comparison-heading { align-items: stretch; flex-direction: column; }
          .comparison-metric { width: 100%; }
          .comparison-controls {
            align-self: stretch;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          /* Nao estica ate a borda: com o campo em largura declarada, a faixa
             de 1fr sobrava a direita dele e separava a setinha do campo. */
          .comparison-reference-group { min-width: 0; width: auto; }
          .comparison-custom-period { grid-template-columns: 1fr; }
          .comparison-custom-form { grid-template-columns: 1fr; }
          /* Numa coluna so, o vao de duas do ciclo criaria uma coluna
             implicita e uma faixa vazia a direita. */
          .comparison-cycle { grid-column: 1; }
          .comparison-custom-options {
            align-items: flex-start;
            flex-direction: column;
          }
          .comparison-custom-submit { grid-column: 1; grid-row: 3; }
          .comparison-custom-validation { grid-column: 1; grid-row: 4; }
          .audit-header { flex-wrap: wrap; }
          .distribution-period { grid-template-columns: 1fr; }
          .distribution-history-item { padding: 9px; }
          .distribution-schedule-fields { grid-template-columns: 1fr; }
          .distribution-editor-total { grid-template-columns: auto auto; }
          .distribution-editor-total small { grid-column: 1 / -1; }
          .distribution-actions > button { flex: 1 1 145px; }
          .scee-header { align-items: flex-start; flex-direction: column; }
          .finance-header { align-items: flex-start; flex-direction: column; }
          .finance-reference-controls {
            grid-template-columns: var(--energy-control-height) minmax(0, 1fr) var(--energy-control-height);
            width: 100%;
          }
          .finance-summary,
          .finance-item-attributes { grid-template-columns: 1fr; }
          .finance-item-heading { grid-template-columns: 1fr; gap: 5px; }
          .scee-reference-controls {
            grid-template-columns: var(--energy-control-height) minmax(0, 1fr) var(--energy-control-height);
            width: 100%;
          }
          .scee-metadata,
          .scee-primary-grid,
          .scee-secondary-grid { grid-template-columns: 1fr; }
          .audit-reference-controls {
            grid-template-columns: var(--energy-control-height) minmax(0, 1fr) var(--energy-control-height);
            width: 100%;
          }
          .comparison-totals { grid-template-columns: 1fr; }
          .audit-entry-grid, .audit-values,
          .audit-billing-quality { grid-template-columns: 1fr; }
          .audit-entry { grid-template-columns: minmax(0, 1fr); }
          .audit-values > .field,
          .audit-entry > .audit-tolerance {
            padding-inline: 0;
            border-left: 0;
          }
        }
        /* =================================================================
           CAMADA DE APRESENTACAO — SUPERVISAO (SCADA)
           Ultima na cascata de proposito: e daqui que sai a identidade
           visual inteira. Nenhum calculo, contrato ou regra de negocio
           passa por este bloco; ele so decide como o que ja existe aparece.
           ================================================================= */
        :host {
          /* Superficies. Tres niveis e o suficiente para hierarquia: o fundo
             da area de trabalho, o corpo do painel e o realce interno. Mais
             que isso vira ruido de profundidade. */
          --bg-app: #101215;
          --bg-rail: #16181c;
          --bg-panel: #1a1d21;
          --bg-inset: #202429;
          --bg-hover: rgba(255, 255, 255, .045);

          /* Neutros levemente frios, puxados para o azul do acento: cinza
             puro nesta vizinhanca le como cor esquecida, nao escolhida. */
          --ink: #f2f5f8;
          --ink-2: #aeb7c2;
          --muted: #7c8592;
          --line: rgba(255, 255, 255, .075);
          --line-strong: rgba(255, 255, 255, .14);

          /* Acento de interface. Nao e cor de grandeza: e o azul do chrome —
             navegacao, foco, links. As grandezas tem paleta propria e
             intocada logo abaixo. */
          --accent: #38bdf8;
          --accent-soft: rgba(56, 189, 248, .12);

          /* Severidade operacional. Separada do acento de proposito: quando
             tudo e azul, "critico" nao consegue gritar. */
          --sev-ok: #22c55e;
          --sev-warn: #f59e0b;
          --sev-crit: #f43f5e;

          /* Grandezas — espelho exato de METRIC_COLORS. Definidas como token
             para o CSS poder usa-las sem duplicar hex; a fonte da verdade
             continua sendo o objeto em JS, e nao esta lista. */
          --c-geracao: #FFC107;
          --c-exportacao: #00E676;
          --c-importacao: #FF5722;
          --c-autoconsumo: #00BCD4;
          --c-consumo: #2196F3;
          --c-rateio: #9C27B0;

          /* Tipografia. Numero em monoespacada com largura tabular: em tela
             de supervisao os digitos precisam alinhar de linha para linha,
             senao a leitura vira comparacao de largura em vez de valor. */
          --font-ui: "Inter", "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif;
          --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", "Cascadia Mono",
            Consolas, "Liberation Mono", monospace;
          --energy-control-height: 34px;
          /* A marca e o titulo da pagina sao a mesma regua horizontal. Uma
             altura declarada uma vez vale mais que dois pares de padding que
             empatavam por acaso e desempataram quando o conteudo mudou. */
          --shell-head: 76px;
          /* Onde termina o topo fixo. Quem gruda abaixo dele parte daqui, em
             vez de repetir a altura medida a mao — que ja divergia entre a
             barra de unidades e o nome da unidade na auditoria. */
          --shell-head-bottom: calc(var(--header-height, 56px) + var(--shell-head));
          --audit-sticky-top: var(--shell-head-bottom);

          display: block;
          background: var(--bg-app);
          color: var(--ink);
          font-family: var(--font-ui);
        }
        .card {
          overflow: visible;
          border: 0;
          border-radius: 0;
          background: var(--bg-app);
          box-shadow: none;
        }

        /* ---------------- Shell ---------------- */
        /* A altura desconta a barra do proprio HA para o painel ocupar a tela
           util sem criar uma segunda barra de rolagem por cima da primeira. */
        .shell {
          display: grid;
          grid-template-columns: 244px minmax(0, 1fr);
          align-items: start;
          min-height: calc(100vh - var(--header-height, 56px));
        }
        .sidebar {
          position: sticky;
          top: var(--header-height, 56px);
          display: flex;
          flex-direction: column;
          height: calc(100vh - var(--header-height, 56px));
          min-width: 0;
          border-right: 1px solid var(--line);
          background: var(--bg-rail);
        }
        .brand {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: var(--shell-head);
          padding: 0 22px;
          border-bottom: 1px solid var(--line);
        }
        .brand-name {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: .01em;
          line-height: 1.25;
        }
        .brand-sub {
          display: block;
          margin-top: 5px;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: .12em;
          text-transform: uppercase;
        }
        .main-nav {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 2px;
          padding: 12px 0;
          overflow-y: auto;
          border: 0;
          background: transparent;
        }
        /* A barra de 3px na borda esquerda e o estado ativo: le antes da cor
           e antes do texto, que e o que se quer de um indicador de posicao. */
        .nav-button {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 0;
          padding: 12px 20px;
          border: 0;
          border-left: 3px solid transparent;
          border-radius: 0;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          white-space: nowrap;
        }
        .nav-button:hover { background: var(--bg-hover); color: var(--ink); }
        .nav-button.active {
          border-left-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 600;
        }
        .nav-button ha-icon { --mdc-icon-size: 19px; width: 19px; height: 19px; }
        .nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .nav-badge {
          padding: 2px 7px;
          border-radius: 999px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
        }
        .nav-badge.critical { background: var(--sev-crit); color: #fff; }
        .nav-badge.attention { background: var(--sev-warn); color: #17181a; }

        .main-area {
          display: grid;
          grid-template-rows: auto auto;
          min-width: 0;
          background: var(--bg-app);
        }
        .top-bar {
          position: sticky;
          top: var(--header-height, 56px);
          z-index: 6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          min-height: var(--shell-head);
          padding: 0 28px;
          border-bottom: 1px solid var(--line);
          background: var(--bg-app);
        }
        .top-bar-copy { display: grid; gap: 4px; min-width: 0; }
        .page-title {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: .02em;
        }
        .top-bar-context { color: var(--muted); font-size: 12px; }
        .top-bar-actions { display: flex; align-items: center; gap: 12px; }
        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: .05em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .system-status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .system-status.ok { color: var(--sev-ok); }
        .system-status.ok .system-status-dot { background: var(--sev-ok); }
        .system-status.info { color: var(--accent); }
        .system-status.info .system-status-dot { background: var(--accent); }
        .system-status.critical { color: var(--sev-crit); }
        .system-status.critical .system-status-dot { background: var(--sev-crit); }
        /* A pagina nunca rola para o lado: o que for mais largo que a tela
           rola dentro da propria caixa, que e quem tem overflow-x auto. clip e
           nao hidden de proposito — nao cria contexto de rolagem, entao o
           position sticky da barra continua funcionando. */
        .main-scroll { min-width: 0; overflow-x: clip; }
        .page-content { display: grid; gap: 22px; padding: 26px 28px 36px; }
        .page-content > .content { padding: 0; }
        .page-content > .toolbar {
          padding: 0 0 16px;
          border-bottom-color: var(--line);
        }
        .content { display: grid; gap: 22px; padding: 0; }
        .blocks { gap: 22px; }

        /* ---------------- Superficies ---------------- */
        /* Raio pequeno e borda de 1px em vez de sombra: sombra difusa e
           linguagem de aplicativo de consumo, nao de sala de operacao. */
        .panel {
          padding: 20px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: var(--bg-panel);
          box-shadow: none;
        }
        .metric, .distribution-rule, .finance-summary-item,
        .comparison-total, .history-total {
          border-radius: 5px;
          background: var(--bg-inset);
        }
        .section-title {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        .section-kicker {
          display: block;
          color: var(--accent);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        h1, h2, h3, h4 { color: var(--ink); }
        .empty, .muted, .overview-description { color: var(--muted); }

        /* Todo numero e monoespacado e tabular. Esta e a regra que mais muda
           a leitura da tela e a que menos custa. */
        .num, .metric-value, .data-val, .overview-primary-value,
        .energy-flow-value, .history-total strong, .comparison-total strong,
        .quality-coverage-value, .scada-table td.num, .alert-total-value {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }

        /* ---------------- Controles ---------------- */
        button {
          border-radius: 5px;
          border-color: var(--line-strong);
          color: var(--ink);
        }
        button:hover { background: var(--bg-hover); }
        button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .icon-button {
          display: grid;
          place-items: center;
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          height: var(--energy-control-height);
          padding: 0;
          border: 1px solid var(--line-strong);
          border-radius: 5px;
          background: var(--bg-panel);
        }
        .billing-reference-global-select, .period-select, select {
          border-radius: 5px;
          border-color: var(--line-strong);
          background: var(--bg-inset);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: .03em;
        }
        .unit-button[aria-pressed="true"] {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
        }

        .settings-source {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
        }
        .settings-tag { margin-left: 8px; vertical-align: middle; }
        .settings-add-vigencia {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 12px;
          padding-top: 6px;
        }
        .settings-add-vigencia .settings-note { flex: 1 1 260px; margin: 0; }
        .settings-add-vigencia .settings-message { flex-basis: 100%; }

        /* Aba desligada continua legivel: apagada, mas nao invisivel — o
           operador precisa ver que ela existe e esta fora do ar. */
        .nav-button.nav-blocked {
          opacity: .38;
          cursor: not-allowed;
        }
        .nav-button.nav-blocked:hover { background: transparent; color: var(--muted); }
        .welcome {
          display: grid;
          gap: 14px;
          border-left: 3px solid var(--accent, #4a9eff);
        }
        .welcome-title { margin: 0; font-size: 16px; font-weight: 600; }
        .welcome a.button { justify-self: start; text-decoration: none; }
        .welcome-text {
          margin: 0;
          max-width: 70ch;
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.55;
        }
        .welcome-steps {
          display: grid;
          gap: 10px;
          margin: 0;
          padding-left: 20px;
        }
        .welcome-step { line-height: 1.5; }
        .welcome-step-title { display: block; font-size: 13.5px; }
        .welcome-step-text {
          color: var(--secondary-text-color);
          font-size: 12.5px;
        }
        .welcome .button { justify-self: start; }
        .billing-notice {
          display: grid;
          gap: 10px;
          border-left: 3px solid var(--warn, #d9a441);
        }
        .billing-notice-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }
        .billing-notice-text {
          margin: 0;
          max-width: 78ch;
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.5;
        }
        .billing-notice .button { justify-self: start; }

        /* ---------------- Saude dos dados ---------------- */
        .data-health-page { display: grid; gap: 16px; }
        .health-units {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 12px;
        }
        .health-unit {
          display: grid;
          align-content: start;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border-left: 3px solid var(--sev-ok);
          color: var(--ink);
          font: inherit;
          text-align: left;
          cursor: pointer;
        }
        .health-unit.attention { border-left-color: var(--sev-warn); }
        .health-unit.critical { border-left-color: var(--sev-crit); }
        .health-unit:hover { background: var(--bg-hover); }
        .health-unit:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .health-unit-head { display: flex; align-items: center; gap: 9px; }
        .health-unit-name { flex: 1; font-size: 14px; }
        .health-unit-rows { display: grid; gap: 7px; }
        .health-unit-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
        }
        .health-unit-label { color: var(--muted); white-space: nowrap; }
        .health-unit-value {
          color: var(--ink-2);
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .health-unit-value.ok { color: var(--ink); }
        .health-unit-value.warn { color: var(--sev-warn); }
        .health-unit-value.crit { color: var(--sev-crit); }
        .console-line.health-finding {
          grid-template-columns: 86px 110px minmax(140px, .9fr) minmax(0, 2fr);
        }
        .health-info { border-top: 1px solid var(--line); }
        .health-info-summary {
          padding: 12px 20px;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
        }
        .health-detail { padding: 0; overflow: hidden; }
        .health-detail-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          list-style: none;
          cursor: pointer;
        }
        .health-detail-summary::-webkit-details-marker { display: none; }
        .health-detail-summary::before {
          content: "▸";
          color: var(--muted);
          transition: transform .15s ease;
        }
        .health-detail[open] > .health-detail-summary::before { transform: rotate(90deg); }
        .health-detail[open] > .health-detail-summary { border-bottom: 1px solid var(--line); }
        .health-detail-hint { margin-left: auto; color: var(--muted); font-size: 12px; }
        .health-detail-body { display: grid; gap: 24px; padding: 16px 20px 20px; }
        .health-block { display: grid; gap: 10px; min-width: 0; }
        .health-block-title {
          margin: 0;
          color: var(--ink);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .health-block-hint { margin: -4px 0 0; color: var(--muted); font-size: 12px; }
        .health-table td { vertical-align: top; }
        .health-table td.health-source-cell { white-space: normal; min-width: 220px; }
        .health-muted {
          display: block;
          color: var(--muted);
          font-size: 11px;
          font-weight: 400;
        }
        .health-entity {
          display: block;
          color: var(--muted);
          font-family: var(--font-mono);
          font-size: 10.5px;
          overflow-wrap: anywhere;
        }
        .health-cycle-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 10px;
          font-size: 12.5px;
        }
        .health-cycle-period {
          color: var(--muted);
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }
        .health-series-list { display: grid; gap: 14px; }
        .health-series { display: grid; gap: 6px; }
        .health-series-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12.5px;
        }
        .health-series-value { color: var(--ink); font-variant-numeric: tabular-nums; }
        .health-series-value.warn { color: var(--sev-warn); }
        .health-strip {
          position: relative;
          height: 8px;
          overflow: hidden;
          border-radius: 4px;
          background: color-mix(in srgb, var(--sev-ok) 32%, transparent);
        }
        .health-strip-gap {
          position: absolute;
          top: 0;
          bottom: 0;
          min-width: 2px;
          background: var(--sev-crit);
        }
        .health-gaps {
          display: grid;
          gap: 3px;
          margin: 0;
          padding-left: 18px;
          color: var(--ink-2);
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }
        .health-note { margin: 0; color: var(--muted); font-size: 11.5px; }
        .health-note.warn { color: var(--sev-warn); }
        .health-source-row {
          display: grid;
          grid-template-columns: minmax(90px, 140px) minmax(0, 1fr);
          align-items: start;
          gap: 12px;
          font-size: 12.5px;
        }
        .health-source-label { padding-top: 8px; color: var(--ink); font-weight: 600; }
        .health-source-chain {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .health-source {
          display: grid;
          gap: 2px;
          min-width: 0;
          padding: 7px 10px;
          border: 1px solid var(--line);
          border-radius: 6px;
        }
        .health-source.active { border-color: color-mix(in srgb, var(--sev-ok) 55%, transparent); }
        .health-source-name {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink);
          font-weight: 600;
        }
        .health-source-period { color: var(--ink-2); font-size: 11.5px; }
        .health-source-arrow { color: var(--muted); }
        .health-facts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px 18px;
          margin: 0;
        }
        .health-fact { display: grid; gap: 3px; }
        .health-fact dt { color: var(--muted); font-size: 11px; }
        .health-fact dd { margin: 0; color: var(--ink); font-size: 13px; }
        .health-fact dd.warn { color: var(--sev-warn); }
        .health-fact dd.crit { color: var(--sev-crit); }
        .health-footnote { margin: 0; color: var(--muted); font-size: 11.5px; }
        @media (max-width: 640px) {
          .health-source-row { grid-template-columns: 1fr; }
          .health-source-label { padding-top: 0; }
          .console-line.health-finding { grid-template-columns: 1fr; gap: 6px; }
          .health-detail-hint { margin-left: 0; }
        }

        /* ---------------- Tabelas de supervisao ---------------- */
        .table-panel { padding: 0; overflow: hidden; }
        .table-panel > .section-title {
          margin: 0;
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
        }
        .table-scroll { min-width: 0; overflow-x: auto; }
        .scada-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        .scada-table th {
          padding: 11px 18px;
          border-bottom: 1px solid var(--line);
          background: rgba(255, 255, 255, .02);
          color: var(--muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .scada-table td {
          padding: 12px 18px;
          border-bottom: 1px solid var(--line);
          color: var(--ink-2);
          white-space: nowrap;
        }
        .scada-table tbody tr:last-child td { border-bottom: 0; }
        .scada-table tbody tr:hover td { background: var(--bg-hover); }
        .scada-table td.num { color: var(--ink); text-align: right; }
        .scada-table td.cell-unit { color: var(--ink); font-weight: 600; }
        .cell-unit { display: flex; align-items: center; gap: 9px; }
        .cell-unit-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: var(--unit-cor, var(--muted));
        }

        /* Etiqueta de estado: contorno + fundo de 10% da propria cor. Le como
           estado mesmo em preto e branco, porque a forma tambem muda. */
        .tag {
          display: inline-block;
          padding: 3px 8px;
          border: 1px solid transparent;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .tag-ok {
          border-color: color-mix(in srgb, var(--sev-ok) 55%, transparent);
          background: color-mix(in srgb, var(--sev-ok) 12%, transparent);
          color: var(--sev-ok);
        }
        .tag-warn {
          border-color: color-mix(in srgb, var(--sev-warn) 55%, transparent);
          background: color-mix(in srgb, var(--sev-warn) 12%, transparent);
          color: var(--sev-warn);
        }
        .tag-crit {
          border-color: color-mix(in srgb, var(--sev-crit) 55%, transparent);
          background: color-mix(in srgb, var(--sev-crit) 12%, transparent);
          color: var(--sev-crit);
        }
        .tag-info {
          border-color: color-mix(in srgb, var(--accent) 55%, transparent);
          background: var(--accent-soft);
          color: var(--accent);
        }
        .tag-log {
          border-color: var(--line-strong);
          background: rgba(255, 255, 255, .04);
          color: var(--muted);
        }

        /* ---------------- Console de eventos ---------------- */
        .console-panel { padding: 0; overflow: hidden; }
        .console-head {
          padding: 14px 20px;
          border-bottom: 1px solid var(--line);
          background: rgba(255, 255, 255, .02);
          color: var(--muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .console-empty { margin: 0; padding: 22px 20px; color: var(--muted); font-size: 13px; }
        .console-list { display: grid; }
        .console-line {
          display: grid;
          grid-template-columns: 86px 110px minmax(140px, .9fr) minmax(0, 2fr) auto;
          align-items: center;
          gap: 16px;
          padding: 13px 20px;
          border-bottom: 1px solid var(--line);
          font-size: 12.5px;
        }
        .console-line:last-child { border-bottom: 0; }
        .console-line:hover { background: var(--bg-hover); }
        .console-unit {
          overflow: hidden;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 11.5px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .console-subject { color: var(--ink); font-weight: 600; }
        .console-desc { color: var(--ink-2); }
        /* O campo de origem fica na linha de proposito: e por ele que se
           confere a afirmacao no payload, e escondê-lo transformaria um
           diagnostico verificavel em opiniao da interface. */
        .console-origin {
          color: var(--muted);
          font-family: var(--font-mono);
          font-size: 10px;
          white-space: nowrap;
        }

        /* ---------------- Totais de alerta ---------------- */
        .alert-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 16px;
        }
        .alert-total {
          display: grid;
          gap: 6px;
          padding: 18px 20px;
          border: 1px solid var(--line);
          border-left: 3px solid var(--muted);
          border-radius: 6px;
          background: var(--bg-panel);
        }
        .alert-total.critical { border-left-color: var(--sev-crit); }
        .alert-total.attention { border-left-color: var(--sev-warn); }
        .alert-total-label {
          color: var(--muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .alert-total-value { font-size: 30px; font-weight: 700; line-height: 1; }
        .alert-total.critical .alert-total-value { color: var(--sev-crit); }
        .alert-total.attention .alert-total-value { color: var(--sev-warn); }
        .scope-note p { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.6; }

        /* ---------------- Visao geral: cartoes de unidade ---------------- */
        .overview-unit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(292px, 1fr));
          gap: 18px;
        }
        .unit-card {
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        }
        /* A foto identifica a unidade mais rapido que o nome. O degrade nao e
           enfeite: sem ele o nome branco depende da imagem para ser legivel. */
        .unit-card-media {
          position: relative;
          display: grid;
          place-items: center;
          /* Proporcao em vez de altura fixa: a caixa acompanha a largura do
             cartao em qualquer tela, em vez de ficar mais panoramica conforme
             a coluna cresce. 21/9 e o meio-termo — a 370px de largura da
             158px, 26 a mais que os 132 anteriores. */
          aspect-ratio: 21 / 9;
          /* Os limites existem para os extremos: com um cartao muito largo,
             21/9 daria 300px de foto; com um muito estreito, 110. */
          min-height: 128px;
          max-height: 178px;
          border-bottom: 1px solid var(--line);
          background: var(--bg-inset);
          overflow: hidden;
        }
        .unit-card-media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom,
            transparent 34%, color-mix(in srgb, var(--bg-panel) 96%, transparent) 100%);
        }
        .unit-card-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* Ainda corta — nao ha como caber uma foto 4:3 inteira numa faixa
             2,3:1 — mas escolhe o que fica: o terco superior, onde estao
             telhado, fachada e ceu. Centralizado, o corte comia justamente a
             parte que identifica a unidade. */
          object-position: center 35%;
        }
        .unit-card-placeholder {
          color: var(--unit-cor, var(--muted));
          opacity: .45;
          --mdc-icon-size: 42px;
        }
        .unit-card-caption {
          position: absolute;
          right: 16px;
          bottom: 13px;
          left: 16px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .unit-card-name {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: .01em;
        }
        .unit-card-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 14px;
          padding: 18px;
        }
        .unit-card-metric-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .unit-card-metric-label {
          color: var(--muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .unit-card-value-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }
        .unit-card-value-main { display: flex; align-items: baseline; gap: 9px; }
        /* A seta segue o significado operacional, nao o sinal: consumir mais
           que no ciclo passado e ruim, e por isso sobe em vermelho. */
        .unit-card-trend {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 12.5px;
          font-weight: 700;
        }
        .unit-card-trend.up { color: var(--sev-crit); }
        .unit-card-trend.down { color: var(--sev-ok); }
        .unit-card-trend.flat { color: var(--muted); }
        .unit-card-trend-arrow { font-size: 10px; }
        .unit-card-today {
          display: grid;
          justify-items: end;
          gap: 2px;
          padding-bottom: 3px;
        }
        .unit-card-today-label {
          color: var(--muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .unit-card-today-value { font-size: 15px; font-weight: 700; }
        /* O numero do ciclo e a resposta do cartao. 34px nao e exagero: e a
           unica coisa que precisa ser lida de longe numa parede de quatro. */
        .unit-card-value { font-size: 34px; font-weight: 700; line-height: 1; }
        .unit-card-value-unit { color: var(--muted); font-size: 14px; }
        .unit-card-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 12px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
        }
        /* Vai de ponta a ponta: dividir com borda nos proprios KPIs deixaria
           a linha partida no vao entre as duas colunas. */
        .unit-card-kpi-divider {
          grid-column: 1 / -1;
          height: 0;
          border-top: 1px solid var(--line);
        }
        .unit-card-kpi { display: grid; gap: 5px; min-width: 0; }
        .unit-card-kpi-label {
          color: var(--muted);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .unit-card-kpi-value {
          display: flex;
          align-items: baseline;
          gap: 7px;
          min-width: 0;
          font-size: 14px;
        }
        /* Numero e unidade nunca se separam: "354,7" numa linha e "kWh" na
           outra era o defeito que o selo por valor causava. */
        .unit-card-kpi-value .num { white-space: nowrap; }
        .unit-card-kpis-head {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          margin-bottom: -6px;
        }
        /* O saldo do dia e o unico numero do cartao cujo SINAL e a mensagem:
           verde quer dizer que o credito rateado cobriu o consumo do dia. */
        .unit-card-kpi.saldo.positive .unit-card-saldo { color: var(--sev-ok); }
        .unit-card-kpi.saldo.negative .unit-card-saldo { color: var(--sev-crit); }
        .unit-card-saldo { font-weight: 700; }
        .unit-card-kpi-hint {
          padding: 1px 5px;
          border-radius: 3px;
          background: rgba(255, 255, 255, .06);
          color: var(--muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        /* Uma linha so, centrada, como no desenho: periodo, separador e a
           proxima leitura. Em telas estreitas quebra em vez de estourar. */
        .unit-card-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: center;
          gap: 4px 8px;
          margin-top: auto;
          padding-top: 13px;
          border-top: 1px solid var(--line);
          color: var(--muted);
          font-size: 10.5px;
        }
        .unit-card-footer-sep { color: var(--line-strong); }
        .unit-card-footer-label {
          color: var(--muted);
          font-size: 10.5px;
        }
        .unit-card-footer-strong { color: var(--ink-2); }
        .unit-card-action {
          width: 100%;
          border-color: var(--line-strong);
          background: var(--bg-inset);
          font-size: 12px;
          font-weight: 600;
        }
        .unit-card-action:hover {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
        }
        .unit-card-note { color: var(--muted); font-size: 11px; padding: 0 18px 14px; }
        .unit-card-note.error-text { color: var(--sev-crit); }

        /* ---------------- Fluxo (Sankey) + rateio ---------------- */
        .overview-flow-row {
          display: grid;
          grid-template-columns: minmax(0, 2.05fr) minmax(276px, .95fr);
          gap: 18px;
          align-items: stretch;
        }
        .energy-flow {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 14px;
          min-height: 0;
          overflow: hidden;
          padding: 20px;
          border: 1px solid var(--line);
          background: var(--bg-panel);
        }
        .energy-flow-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }
        .energy-flow-heading .section-title { margin: 0 0 5px; }
        .energy-flow-heading .overview-description { margin: 0; font-size: 12px; }
        .energy-flow-quality {
          appearance: none;
          min-height: 0;
          margin: 0;
          padding: 4px 9px;
          border: 1px solid color-mix(in srgb, var(--sev-warn) 55%, transparent);
          border-radius: 3px;
          background: color-mix(in srgb, var(--sev-warn) 12%, transparent);
          color: var(--sev-warn);
          font: inherit;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
        }
        .energy-flow-quality:hover {
          background: color-mix(in srgb, var(--sev-warn) 22%, transparent);
        }
        .flow-chart-frame { min-height: 300px; }
        .flow-chart { width: 100%; height: 100%; min-height: 300px; }
        .energy-flow-state {
          display: grid;
          place-items: center;
          min-height: 280px;
          margin: 0;
          color: var(--muted);
          text-align: center;
        }

        .rateio-card {
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          gap: 4px;
          padding: 20px;
        }
        .rateio-card .section-title { margin: 3px 0 14px; }
        .rateio-body {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 18px;
        }
        .rateio-ring { width: 116px; height: 116px; }
        .rateio-total { font-family: var(--font-mono); font-size: 20px; }
        .rateio-total-label { letter-spacing: .12em; }
        .rateio-legend { gap: 11px; }
        .rateio-legend-name { font-size: 12.5px; }
        .rateio-legend-item strong { font-family: var(--font-mono); font-size: 12.5px; }
        .rateio-actions { gap: 8px; margin-top: 14px; }
        .rateio-action {
          flex: 1 1 auto;
          border: 1px solid var(--line-strong);
          border-radius: 4px;
          background: var(--bg-inset);
          color: var(--ink-2);
          font-size: 11px;
          font-weight: 600;
        }
        .rateio-action:hover {
          border-color: var(--c-rateio);
          background: color-mix(in srgb, var(--c-rateio) 15%, transparent);
          color: var(--ink);
        }

        /* ---------------- Unidades: abas e telemetria ---------------- */
        /* A barra da unidade e a barra de contexto da pagina inteira: fica
           presa no topo da area rolavel para que trocar de unidade nao dependa
           de voltar ao inicio depois de descer ate a auditoria do ciclo. */
        .toolbar {
          position: sticky;
          top: var(--shell-head-bottom, 132px);
          z-index: 4;
          align-items: center;
          gap: 14px;
          padding: 0 0 2px;
          border-bottom: 1px solid var(--line);
          background: var(--bg-app);
        }
        .unit-selector { gap: 0; }
        .unit-button {
          min-height: 0;
          padding: 12px 20px;
          border: 0;
          border-bottom: 2px solid transparent;
          border-radius: 0;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: .03em;
        }
        .unit-button:hover { background: transparent; color: var(--ink); }
        .unit-button[aria-pressed="true"] {
          border-bottom-color: var(--accent);
          background: transparent;
          color: var(--accent);
          font-weight: 600;
        }
        .identity { gap: 20px; }
        /* 190px em vez de 158: com tres medicoes os cartoes esticavam e com
           cinco encolhiam, e as unidades deixavam de ser comparaveis entre si.
           A largura minima maior faz os dois casos caberem no mesmo tamanho. */
        .metric-grid { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
        .metric {
          align-content: start;
          gap: 6px;
          padding: 16px;
          border: 1px solid var(--line);
        }
        .metric-head {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }
        /* Do tamanho do rotulo e na cor dele: o icone acompanha o nome da
           grandeza, nao compete com o numero. */
        .metric-icon {
          --mdc-icon-size: 14px;
          flex-shrink: 0;
          width: 14px;
          height: 14px;
          color: var(--muted);
        }
        .metric-label {
          color: var(--muted);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .metric-value {
          display: flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
          margin-top: 6px;
          font-size: 19px;
          font-weight: 600;
          /* Sem entrelinha sobrando: o numero e uma linha so, e a altura
             padrao reservava espaco para uma segunda que nunca vem. */
          line-height: 1;
        }
        .metric-unit {
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
        }
        /* Sem eixo, sem rotulo e sem escala propria: a sparkline mostra a
           forma da variacao, e os numeros dela estao escritos logo abaixo. */
        .metric-spark-wrap { position: relative; width: 100%; margin-top: -6px; }
        .metric-spark {
          display: block;
          width: 100%;
          height: 52px;
          overflow: visible;
        }
        /* stop-color por CSS, nao por atributo: atributo nao resolve var(), e
           a cor do preenchimento tem de ser a mesma do traco. */
        .metric-spark .spark-stop-top { stop-color: var(--accent); stop-opacity: .34; }
        .metric-spark .spark-stop-bottom { stop-color: var(--accent); stop-opacity: 0; }
        .metric-spark .spark-area { stroke: none; }
        /* Marca o valor atual e amarra o desenho ao numero grande acima. */
        .metric-spark-dot {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          transform: translate(-50%, -50%);
        }
        .metric-spark polyline {
          fill: none;
          stroke: var(--accent);
          stroke-width: 1.25;
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }
        .metric-range {
          display: flex;
          align-items: baseline;
          gap: 6px;
          color: var(--muted);
          font-family: var(--font-mono);
          font-size: 9.5px;
          letter-spacing: .03em;
        }
        .metric-range-window {
          padding: 1px 5px;
          border-radius: 999px;
          background: var(--bg-inset);
          font-size: 8.5px;
        }

        /* ---------------- Composicao do consumo ---------------- */
        .composition-panel { display: grid; gap: 15px; }
        .composition-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .composition-title .section-title { margin: 6px 0 0; }
        .composition-total { font-size: 21px; font-weight: 700; }
        /* Ambar para o compensado, azul para o que sobrou a pagar: sao duas
           naturezas diferentes de kWh na mesma conta, e cores da mesma familia
           esconderiam justamente a fronteira que interessa. */
        .composition-bar {
          display: flex;
          height: 26px;
          border-radius: 5px;
          background: var(--bg-inset);
          overflow: hidden;
        }
        .composition-bar-comp { background: var(--sev-warn); }
        .composition-bar-uncomp { background: var(--c-consumo); }
        .composition-legend {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 10px 26px;
        }
        .composition-legend-item {
          display: grid;
          grid-template-columns: 11px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }
        .composition-dot { width: 11px; height: 11px; border-radius: 3px; }
        .composition-legend-item.comp .composition-dot { background: var(--sev-warn); }
        .composition-legend-item.uncomp .composition-dot { background: var(--c-consumo); }
        .composition-legend-name { color: var(--ink-2); }
        .composition-legend-item strong { color: var(--ink); font-size: 13px; }
        /* Os tres numeros que respondem "de onde veio o credito": o que o
           rateio trouxe, o que o saldo cobriu ou recebeu, e o que sobrou. */
        .composition-balance {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
        }
        .composition-balance-item {
          display: grid;
          align-content: start;
          gap: 5px;
          min-width: 0;
          padding: 12px 14px;
          border: 1px solid var(--line);
          border-radius: 5px;
          background: var(--bg-inset);
        }
        .composition-balance-label {
          color: var(--muted);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .composition-balance-value { font-size: 17px; font-weight: 600; }
        /* Tirar do saldo nao e erro, e guardar nao e vitoria: a cor diz a
           direcao do movimento, nao um juizo sobre ele. */
        .composition-balance-item.negative .composition-balance-value { color: var(--sev-warn); }
        .composition-balance-item.positive .composition-balance-value { color: var(--sev-ok); }
        .composition-balance-note {
          color: var(--muted);
          font-family: var(--font-mono);
          font-size: 9.5px;
        }
        .composition-text {
          display: grid;
          gap: 7px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
        }
        /* Fatos do ciclo que o mes comum nao tem. Cor por natureza, nao por
           gravidade: dinheiro que volta e verde, atraso e ambar, e o que so
           encarece sem ser culpa de ninguem fica neutro. */
        /* Lado a lado, preenchendo a largura. Flex em vez de grid com
           auto-fit: o rotulo ocupa a linha inteira, e num grid isso mantinha
           vivas as colunas vazias a direita — auto-fit so colapsa a coluna em
           que nao ha nenhum item, e o rotulo estava em todas. */
        .bill-outliers {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
        }
        .bill-outliers-kicker {
          flex: 1 0 100%;
          color: var(--muted);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .bill-outlier {
          display: grid;
          flex: 1 1 232px;
          grid-template-columns: 18px minmax(0, 1fr);
          align-content: start;
          gap: 4px 9px;
          min-width: 0;
          padding: 12px 13px;
          border: 1px solid var(--line);
          border-left-width: 3px;
          border-radius: 5px;
          background: var(--bg-inset);
        }
        .bill-outlier-icon {
          --mdc-icon-size: 18px;
          width: 18px;
          height: 18px;
          margin-top: 1px;
        }
        .bill-outlier.positivo { border-left-color: var(--sev-ok); }
        .bill-outlier.positivo .bill-outlier-icon { color: var(--sev-ok); }
        .bill-outlier.atencao { border-left-color: var(--sev-warn); }
        .bill-outlier.atencao .bill-outlier-icon { color: var(--sev-warn); }
        .bill-outlier.neutro { border-left-color: var(--line-strong); }
        .bill-outlier.neutro .bill-outlier-icon { color: var(--muted); }
        /* O texto ocupa as duas colunas a partir da segunda linha: o icone
           acompanha so o titulo, e o detalhe usa a largura inteira do cartao. */
        .bill-outlier-copy {
          display: contents;
        }
        .bill-outlier-title { font-size: 12.5px; font-weight: 600; }
        /* O valor sobe para logo abaixo do titulo; a explicacao fecha o
           cartao. Ler o numero nao deveria exigir passar pelo texto. */
        .bill-outlier-detail { grid-column: 1 / -1; order: 1; }
        .bill-outlier-detail {
          color: var(--muted);
          font-size: 11.5px;
          line-height: 1.45;
        }
        /* O valor a direita, na mesma altura do titulo: a coluna de numeros
           deixa a lista comparavel de cima a baixo. */
        .bill-outlier-value {
          grid-column: 1 / -1;
          font-size: 16px;
          font-weight: 600;
        }
        .bill-outlier.credito .bill-outlier-value { color: var(--sev-ok); }
        .bill-outlier.atencao .bill-outlier-value { color: var(--sev-warn); }
        .bill-outlier.cobranca { border-left-color: var(--line-strong); }
        .bill-outlier.cobranca .bill-outlier-icon { color: var(--muted); }
        /* A cor da bandeira e o proprio dado: aqui pintar de vermelho quer
           dizer "vermelha", nao "ruim segundo algum criterio". Sem cor
           reconhecida na fatura, o cartao fica neutro. */
        .bill-outlier.bandeira-verde { border-left-color: #34D399; }
        .bill-outlier.bandeira-verde .bill-outlier-icon,
        .bill-outlier.bandeira-verde .bill-outlier-value { color: #34D399; }
        .bill-outlier.bandeira-amarela { border-left-color: #FFD54A; }
        .bill-outlier.bandeira-amarela .bill-outlier-icon,
        .bill-outlier.bandeira-amarela .bill-outlier-value { color: #FFD54A; }
        .bill-outlier.bandeira-vermelha { border-left-color: #EF4444; }
        .bill-outlier.bandeira-vermelha .bill-outlier-icon,
        .bill-outlier.bandeira-vermelha .bill-outlier-value { color: #EF4444; }
        /* Branco levemente amarelado, da luz do poste. A borda entra junto:
           e ela que identifica o cartao de longe, como nas outras. */
        .bill-outlier.iluminacao { border-left-color: #FFFDF2; }
        .bill-outlier.iluminacao .bill-outlier-icon,
        .bill-outlier.iluminacao .bill-outlier-value { color: #FFFDF2; }
        .bill-outlier.credito { border-left-color: var(--sev-ok); }
        .bill-outlier.credito .bill-outlier-icon { color: var(--sev-ok); }

        .composition-expiring {
          padding: 9px 11px;
          border-radius: 5px;
          background: color-mix(in srgb, var(--sev-warn) 14%, transparent);
          color: var(--sev-warn) !important;
          font-weight: 600;
        }
        .composition-text p {
          margin: 0;
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.55;
        }
        /* O valor em branco cheio contra o texto em cinza: e ele que se quer
           encontrar relendo a frase. */
        .composition-text strong { color: var(--ink); font-weight: 700; }

        /* ---------------- Graficos lado a lado ---------------- */
        .charts-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          align-items: start;
        }
        .charts-row > .panel { min-width: 0; }
        .charts-row.single { grid-template-columns: minmax(0, 1fr); }
        .bill-estimate { display: grid; gap: 12px; }
        .bill-estimate .section-title { margin: 0; }
        .bill-estimate-values {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .bill-estimate-note {
          margin: 0;
          color: var(--muted);
          font-size: 12.5px;
          line-height: 1.5;
        }

        /* ---------------- Auditoria e payback ---------------- */
        .audit-overview-table, .audit-table { font-size: 12.5px; }
        .audit-overview-table th, .audit-table th {
          color: var(--muted);
          font-size: 10px;
          letter-spacing: .09em;
          text-transform: uppercase;
        }
        .audit-overview-table td, .audit-table td { border-color: var(--line); }
        .audit-entry, .audit-values > .field { border-color: var(--line); }
        .field-label, .distribution-unit, .history-total span,
        .comparison-total span, .finance-item-label {
          color: var(--muted);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .field-value, .history-total strong, .comparison-total strong {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }
        .payback-page .panel, .audit-page .panel { border-color: var(--line); }

        /* ---------------- Popups ---------------- */
        .audit-modal-overlay { background: rgba(6, 8, 11, .78); }
        .audit-modal {
          border: 1px solid var(--line-strong);
          border-radius: 8px;
          background: var(--bg-panel);
        }
        .audit-modal-head {
          border-bottom: 1px solid var(--line);
          background: rgba(255, 255, 255, .02);
        }
        .audit-modal-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .04em;
        }

        /* Uma coluna, ao contrario do fieldset comum de duas: aqui nao ha um
           par de datas para alinhar lado a lado, so a explicacao, um campo e
           o atalho. Sem isto os tres herdavam o grid de duas colunas e ficavam
           espalhados sem relacao entre si. */
        .comparison-cycle {
          display: grid;
          grid-column: 1 / 3;
          grid-template-columns: minmax(0, 1fr);
          justify-items: stretch;
          gap: 10px;
        }
        .comparison-cycle-note {
          margin: 0;
          color: var(--muted);
          font-size: 11.5px;
          line-height: 1.5;
        }
        .comparison-cycle-row {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 8px;
        }
        /* Sem largura imposta: um campo de data e hora ja se dimensiona pelo
           formato que exibe. Os 260px fixos deixavam um terco da caixa vazia. */
        .comparison-cycle .comparison-custom-field { width: auto; }
        .comparison-cycle .history-date-input { width: auto; min-width: 0; }
        /* O bloco estica, o atalho nao: um botao da largura do painel
           inteiro para "Voltar para agora" pesaria mais que a acao vale. */
        .comparison-cycle-now {
          justify-self: start;
          min-height: 0;
          padding: 6px 12px;
          font-size: 11.5px;
          font-weight: 600;
        }
        /* ---------------- Configuração ---------------- */
        /* Sem teto de largura: a pagina usa a tela inteira. O que limita a
           linha nao e a pagina, e a coluna em que o texto esta. */
        .settings-panel { display: grid; gap: 14px; padding: 22px 24px; }
        /* Titulo a esquerda, explicacao a direita. Empilhados numa tela larga,
           a explicacao quebrava em tres linhas curtas com metade da tela vazia
           ao lado. */
        .settings-head {
          display: grid;
          grid-template-columns: minmax(210px, 270px) minmax(0, 1fr);
          align-items: start;
          gap: 12px 32px;
        }
        .settings-head-copy { display: grid; gap: 4px; min-width: 0; }
        .settings-panel .section-title { margin: 0; }
        .settings-note {
          margin: 0;
          color: var(--muted);
          font-size: 12.5px;
          line-height: 1.55;
        }
        /* Campo, declarado e em vigor lado a lado: sem os tres juntos nao da
           para saber o que um "restaurar" traria de volta. */
        .settings-field-row {
          display: grid;
          grid-template-columns:
            minmax(180px, 260px) minmax(140px, 220px) minmax(140px, 220px)
            minmax(0, 1fr);
          align-items: end;
          gap: 14px 18px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
        }
        .settings-field { display: grid; gap: 6px; min-width: 0; }
        .settings-label {
          color: var(--muted);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .settings-input {
          width: 100%;
          height: var(--energy-control-height);
          padding: 4px 10px;
          border: 1px solid var(--line-strong);
          border-radius: 5px;
          background: var(--bg-inset);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
        }
        .settings-input:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
        .settings-value { display: grid; gap: 6px; min-width: 0; }
        .settings-value strong {
          padding: 7px 10px;
          border: 1px solid var(--line);
          border-radius: 5px;
          background: rgba(255, 255, 255, .02);
          color: var(--ink-2);
          font-size: 13px;
        }
        .settings-value.current strong {
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          background: var(--accent-soft);
          color: var(--accent);
        }
        /* Uma unidade por bloco, um sensor por linha. O nome da unidade se
           repete acima de cada grupo porque a lista e longa e a entidade
           sozinha nao diz de quem e. */
        .settings-sensor-unit {
          display: grid;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
        }
        .settings-sensor-unit-name {
          margin: 0;
          color: var(--ink);
          font-size: 13px;
          font-weight: 700;
        }
        /* A unidade fechada cabe numa linha; aberta, mostra o resto. */
        .settings-unit {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: rgba(255, 255, 255, .015);
          overflow: hidden;
        }
        .settings-unit.open { border-color: var(--line-strong); }
        /* A unidade em criacao ainda nao existe: a borda tracejada diz
           isso antes de qualquer texto. */
        .settings-unit.new {
          border-style: dashed;
          padding: 12px 14px;
        }
        .settings-unit.new .settings-unit-body {
          padding: 0;
          border-top: 0;
        }
        .settings-unit-head {
          display: grid;
          grid-template-columns: auto auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }
        .settings-unit-head:hover { background: rgba(255, 255, 255, .03); }
        .settings-unit-caret { color: var(--muted); --mdc-icon-size: 20px; }
        .settings-unit-photo {
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          overflow: hidden;
          border-radius: 8px;
          background: var(--bg-inset);
        }
        .settings-unit-photo.small { width: 38px; height: 38px; }
        .settings-unit-thumb { width: 100%; height: 100%; object-fit: cover; }
        .settings-unit-thumb.empty {
          width: auto;
          height: auto;
          color: var(--muted);
          --mdc-icon-size: 20px;
        }
        .settings-unit-title { display: grid; gap: 2px; min-width: 0; }
        .settings-unit-name {
          color: var(--ink);
          font-size: 13.5px;
          font-weight: 700;
        }
        .settings-unit-summary { color: var(--muted); font-size: 11.5px; }
        .settings-unit-body {
          display: grid;
          gap: 12px;
          padding: 4px 14px 14px;
          border-top: 1px solid var(--line);
        }
        /* As duas marcacoes lado a lado. O texto que explicava cada uma
           empurrava o formulario para baixo e se repetia em toda unidade;
           agora ele aparece ao passar o mouse, onde e perguntado. */
        .settings-unit-flags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 18px;
        }
        .settings-flag {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--ink-2);
          font-size: 12.5px;
          cursor: pointer;
        }
        /* Em repouso a caixa nao cria camada; ao abrir a dica ela sobe acima
           do que vem depois. Sem isto, a dica ficava atras dos botoes
           seguintes e o texto deles atravessava o balao. */
        .settings-flag:hover, .settings-flag:focus-within { z-index: 30; }
        .settings-flag.blocked { cursor: not-allowed; }
        /* O esmaecido e do campo, nunca da dica. Enquanto a opacidade estava
           no rotulo inteiro, o balao herdava os 60% e o texto que ficava
           atras dele atravessava a leitura. */
        .settings-flag.blocked > input,
        .settings-flag.blocked > .settings-flag-label,
        .settings-flag.blocked > .settings-flag-mark { opacity: .6; }
        /* Uma marca discreta, do tamanho de um expoente: ela indica que ha
           explicacao, nao disputa a leitura do rotulo. */
        .settings-flag-mark {
          align-self: flex-start;
          margin-top: -2px;
          color: var(--muted);
          --mdc-icon-size: 11px;
        }
        .settings-flag-hint {
          position: absolute;
          top: calc(100% + 6px);
          /* Comeca alinhada com o campo e vai ate a largura da area, para o
             texto caber em poucas linhas em vez de uma coluna estreita. */
          left: 0;
          z-index: 30;
          width: 460px;
          max-width: min(460px, 70vw);
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid var(--line-strong);
          border-radius: 6px;
          background: #22262c;
          box-shadow: 0 10px 26px rgba(0, 0, 0, .6);
          color: var(--ink-2);
          font-size: 11.5px;
          line-height: 1.5;
          text-align: justify;
          text-wrap: pretty;
          opacity: 0;
          visibility: hidden;
          transition: opacity .12s ease;
          pointer-events: none;
        }
        .settings-flag:hover .settings-flag-hint,
        .settings-flag:focus-within .settings-flag-hint {
          opacity: 1;
          visibility: visible;
        }
        /* Dois deles sao rotulos e dois sao botoes — "Cor" e "Trocar foto"
           escondem um <input> que nao se estiliza. Na linha, porem, os quatro
           sao a mesma coisa, entao a regra vale para todos de uma vez: mesma
           altura, mesmo canto, mesma fonte. So o comprimento muda, porque o
           texto muda. */
        .settings-unit-actions > * {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          /* A mesma altura e o mesmo canto dos campos de texto logo acima:
             na vertical a linha de acoes e mais uma linha do formulario, e
             um retangulo mais alto ou mais redondo a destacaria sem razao. */
          height: var(--energy-control-height);
          box-sizing: border-box;
          padding: 0 12px;
          border: 1px solid var(--divider-color);
          border-radius: 5px;
          background: transparent;
          color: var(--primary-text-color);
          font-family: inherit;
          font-size: 12px;
          font-weight: 400;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
        }
        .settings-unit-actions > *:hover {
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        /* O foco vive no input escondido; sem isto, navegar por teclado
           nao mostraria onde se esta. */
        .settings-unit-actions .settings-unit-color:focus-within,
        .settings-unit-actions .settings-unit-file:focus-within {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        /* O quadradinho cabe dentro da altura do botao: sem limite, o seletor
           de cor do navegador cresce e empurra a caixa que o contem. */
        .settings-unit-color-input {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          padding: 0;
          border: 0;
          border-radius: 3px;
          background: transparent;
          cursor: pointer;
        }
        .settings-unit-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        /* O <input type=file> nao se estiliza: o rotulo e o botao visivel e o
           campo fica escondido atras dele, mantendo o clique e o teclado. */
        .settings-unit-file { position: relative; overflow: hidden; }
        .settings-unit-file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        /* Excluir e a unica acao que nao se desfaz. O retangulo e a fonte sao
           os mesmos das outras; o que a separa e a cor e o peso — destaque sem
           quebrar o alinhamento da linha. */
        .settings-unit-actions .button.danger,
        .button.danger {
          border-color: color-mix(in srgb, var(--sev-crit) 45%, transparent);
          color: var(--sev-crit);
          font-weight: 700;
        }
        .settings-unit-actions .button.danger:hover,
        .button.danger:hover {
          background: color-mix(in srgb, var(--sev-crit) 12%, transparent);
        }
        /* As medicoes recuadas sob a unidade. */
        .settings-unit-metrics {
          display: grid;
          gap: 10px;
          padding-left: 10px;
          border-left: 2px solid var(--line);
        }
        /* Duas naturezas, dois blocos. O titulo e a nota dizem em que mundo
           cada um vive antes de qualquer campo aparecer. */
        .settings-metric-section {
          display: grid;
          gap: 8px;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: rgba(255, 255, 255, .012);
        }
        .settings-metric-section-head { display: grid; gap: 2px; }
        .settings-metric-section-title {
          color: var(--ink-2);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .settings-metric-section-note {
          color: var(--muted);
          font-size: 11.5px;
        }
        .settings-metric-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        /* Na linha, o botao e o campo do sensor sao a mesma peca — so muda o
           que cada um faz. Sem isto herdavam os 36px e o canto de 10px do
           botao generico, e ficavam mais altos e mais redondos que o campo
           ao lado deles. */
        .settings-metric-actions .button,
        .settings-metric-row.reading > .button,
        .settings-metric-row.pending > .button {
          height: var(--energy-control-height);
          min-height: 0;
          box-sizing: border-box;
          padding: 0 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 400;
          line-height: 1;
          white-space: nowrap;
        }
        /* Um simbolo so nao precisa de linha: a largura acompanha a altura e o
           X fica no centro de um quadrado, em vez de nadar num retangulo. */
        .button.icon-only {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: var(--energy-control-height);
          min-width: var(--energy-control-height);
          padding: 0;
          font-size: 13px;
        }
        /* Vermelho porque exclui. Ao lado de um campo, um X neutro se le como
           fechar; este tira a medicao da unidade, e a cor e o que separa um
           do outro antes de qualquer texto. */
        .button.icon-remove {
          border-color: color-mix(in srgb, var(--sev-crit) 45%, transparent);
          color: var(--sev-crit);
        }
        .button.icon-remove:hover {
          background: color-mix(in srgb, var(--sev-crit) 12%, transparent);
        }
        /* O que a unidade calcula por medir o que mede: consequencia, nao
           configuracao, e por isso vem depois e em tom menor. */
        .settings-derived {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
          padding-top: 6px;
          border-top: 1px dashed var(--line);
        }
        .settings-derived-label {
          color: var(--muted);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .settings-derived-value { color: var(--ink-2); font-size: 12px; }
        /* Um medidor so: rotulo, campo e acoes na mesma linha. */
        .settings-metric-group.single .settings-metric-row.head {
          display: grid;
          grid-template-columns: minmax(90px, auto) minmax(0, 1fr) auto;
          align-items: center;
        }
        .settings-metric-group.single .settings-metric-label { margin-right: 0; }
        .settings-metric-group { display: grid; gap: 6px; }
        /* O titulo da grandeza e os botoes dela, numa linha so. */
        .settings-metric-row.head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .settings-metric-row.head .settings-metric-label { margin-right: auto; }
        /* A fonte: legenda a esquerda, entidade a direita. O recuo e o que faz
           duas fontes se lerem como o historico de uma coisa so. */
        .settings-metric-row.source {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          align-items: center;
          gap: 8px 12px;
          margin-left: 10px;
          padding: 8px 10px;
          border-left: 2px solid var(--line);
          border-radius: 0 4px 4px 0;
          background: rgba(255, 255, 255, .012);
        }
        .settings-metric-row.source.retired { opacity: .7; background: transparent; }
        .settings-metric-row.source .settings-note { grid-column: 1 / -1; }
        /* A legenda da fonte tem lugar marcado: nome em cima a esquerda, selo
           em cima a direita — sempre na mesma coluna, encostado no campo — e a
           vigencia embaixo. Em fluxo livre, o selo caia depois do nome e
           mudava de lugar a cada fonte, conforme o comprimento do texto. */
        .settings-source-legend {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 2px 8px;
          min-width: 0;
        }
        .settings-source-legend .settings-sensor-source {
          grid-column: 1;
          grid-row: 1;
          overflow-wrap: anywhere;
        }
        /* O selo acompanha o campo, nao a primeira linha da legenda: com
           altura propria e centrado nas duas linhas, ele fica na mesma faixa
           do retangulo do sensor em vez de flutuar acima dele. */
        .settings-source-legend .settings-tag {
          display: inline-flex;
          align-items: center;
          grid-column: 2;
          grid-row: 1 / -1;
          align-self: center;
          height: var(--energy-control-height);
          box-sizing: border-box;
          padding: 0 10px;
          border-radius: 5px;
          margin-left: 0;
          justify-self: end;
        }
        .settings-source-legend .settings-sensor-window {
          grid-column: 1;
          grid-row: 2;
        }
        .settings-source-legend .settings-sensor-window.alone { grid-row: 1; }
        /* Uma medicao instantanea nao tem vigencia: rotulo, campo e o botao. */
        .settings-metric-row.reading {
          display: grid;
          grid-template-columns: minmax(80px, auto) minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
        }
        .settings-metric-row.add { display: grid; }
        /* Uma linha por UC: quem e, o que cobre e de quem e. A sem dono tem
           a borda de aviso — e a unica que pede resposta. */
        .invoice-uc-row {
          display: grid;
          grid-template-columns: minmax(140px, auto) minmax(0, 1fr) minmax(170px, 240px);
          align-items: center;
          gap: 8px 12px;
          padding: 6px 10px;
          border-left: 2px solid var(--line);
          border-radius: 0 4px 4px 0;
        }
        /* O periodo virou botao, mas continua lendo como o texto que era. */
        .invoice-uc-toggle {
          justify-self: start;
          padding: 2px 0;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }
        .invoice-uc-toggle:hover { color: var(--primary-color); }
        .invoice-bill-list {
          display: grid;
          gap: 4px;
          margin: 0 0 6px 22px;
          padding-left: 10px;
          border-left: 1px dashed var(--line);
        }
        .invoice-bill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12.5px;
        }
        .invoice-bill-delete { padding: 3px 10px; font-size: 12px; }
        .invoice-uc-row.sem-dono {
          border-left-color: var(--sev-warn);
          background: color-mix(in srgb, var(--sev-warn) 7%, transparent);
        }
        .invoice-uc-id { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .invoice-uc-number {
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
          white-space: nowrap;
        }
        .invoice-uc-id .settings-tag { margin-left: 0; }
        .invoice-uc-period { color: var(--ink-2); font-size: 12px; }
        .invoice-uc-owner { cursor: pointer; }
        .invoice-refusals, .invoice-compare-list {
          display: grid;
          gap: 4px;
          margin: 0;
          padding-left: 18px;
          color: var(--ink-2);
          font-size: 12px;
        }
        .invoice-refusals li { display: flex; flex-wrap: wrap; gap: 4px 10px; }
        .invoice-refusal-name { font-family: var(--font-mono); color: var(--ink); }
        .invoice-refusal-reason { color: var(--sev-warn); }
        .invoice-compare { display: grid; gap: 6px; }
        .settings-metric-row.pending {
          display: grid;
          grid-template-columns: minmax(80px, auto) minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
        }
        .settings-metric-row.pending .settings-input {
          border-color: color-mix(in srgb, var(--accent) 55%, transparent);
        }
        /* O formulario da troca ocupa a largura toda: sao tres campos e um
           aviso que ninguem deveria ler de canto de olho. */
        .settings-metric-row.swap {
          display: grid;
          gap: 10px;
          margin-left: 10px;
          padding: 12px;
          border: 1px dashed var(--line-strong);
          border-radius: 6px;
        }
        .settings-metric-label {
          color: var(--ink-2);
          font-size: 12.5px;
          font-weight: 600;
        }
        .settings-metric-pick { cursor: pointer; }
        @media (max-width: 640px) {
          .settings-metric-row.source,
          .settings-metric-row.reading,
          .settings-metric-row.pending { grid-template-columns: minmax(0, 1fr); }
          .invoice-uc-row { grid-template-columns: minmax(0, 1fr); }
        }
        /* A grandeza e o titulo; as fontes sao as linhas recuadas sob ela. O
           recuo e o que faz duas fontes se lerem como um historico de uma
           coisa so, em vez de duas medicoes diferentes. */
        .settings-sensor-metric { display: grid; gap: 6px; }
        .settings-sensor-metric-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
        }
        .settings-sensor-count {
          color: var(--muted);
          font-size: 11px;
        }
        .settings-sensor-row {
          display: grid;
          gap: 6px;
          margin-left: 12px;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-left: 2px solid var(--line);
          border-radius: 6px;
          background: rgba(255, 255, 255, .015);
        }
        /* A fonte em uso ganha a marca; a encerrada recua de propósito, para
           a leitura cair primeiro no que vale hoje. */
        .settings-sensor-row.active {
          border-left-color: var(--accent);
        }
        .settings-sensor-row.retired {
          background: transparent;
          opacity: .72;
        }
        .settings-sensor-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        /* O uso vem primeiro e em destaque: e por ele que o sensor e
           reconhecido, nao pelo nome da entidade. */
        .settings-sensor-usage {
          color: var(--ink-2);
          font-size: 12.5px;
          font-weight: 600;
        }
        .settings-sensor-source {
          color: var(--ink-2);
          font-size: 12px;
        }
        .settings-sensor-window {
          color: var(--muted);
          font-size: 11.5px;
          font-variant-numeric: tabular-nums;
        }
        .settings-sensor-declared {
          overflow-wrap: anywhere;
          color: var(--muted);
          font-family: var(--font-mono);
          font-size: 11.5px;
        }
        .settings-sensor-row .settings-field { max-width: 420px; }
        /* Faixa ambar, nao vermelha: nao e erro, e consequencia. */
        .settings-note {
          margin-top: 10px;
          color: var(--muted);
          font-size: 12.5px;
          line-height: 1.5;
        }
        .settings-warning {
          padding: 12px 16px;
          border-left: 3px solid var(--sev-warn);
          border-radius: 0 6px 6px 0;
          background: color-mix(in srgb, var(--sev-warn) 9%, transparent);
          color: var(--ink-2);
          font-size: 12.5px;
          line-height: 1.6;
        }
        .settings-warning strong { color: var(--sev-warn); }
        .settings-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .settings-actions .primary {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 600;
        }
        .settings-message { margin: 0; font-size: 12.5px; }
        .settings-message.error { color: var(--sev-crit); }
        .settings-message.ok { color: var(--sev-ok); }
        /* Lote lido em parte nao e sucesso nem falha, e a cor precisa dizer
           isso — senao a ressalva passa como se tudo tivesse corrido bem. */
        .settings-message.warn { color: var(--sev-warn); }
        /* O botao da extracao fica sozinho no painel, sem o carimbo ao lado
           que empurra a linha de acoes dos ajustes. */
        .settings-actions-row { display: flex; flex-wrap: wrap; gap: 12px; }
        /* ---------------- Configuracao: lancadores ---------------- */
        .settings-launchers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        /* Cartao inteiro clicavel, e nao um botao dentro de um cartao: o alvo
           e do tamanho do que se le, que e como um item de menu se comporta. */
        .settings-launcher {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          align-items: start;
          gap: 4px 14px;
          min-height: 0;
          padding: 18px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg-panel);
          text-align: left;
        }
        .settings-launcher:hover {
          border-color: var(--accent);
          background: var(--bg-inset);
        }
        .settings-launcher-icon {
          --mdc-icon-size: 22px;
          grid-row: 1 / 3;
          width: 38px;
          height: 38px;
          padding: 8px;
          border-radius: 8px;
          background: var(--accent-soft);
          color: var(--accent);
        }
        .settings-launcher-copy { display: grid; gap: 4px; min-width: 0; }
        .settings-launcher-title {
          color: var(--ink);
          font-size: 14px;
          font-weight: 600;
        }
        .settings-launcher-desc {
          color: var(--muted);
          font-size: 11.5px;
          font-weight: 400;
          line-height: 1.45;
        }
        /* O valor em vigor fica na terceira linha, alinhado com o texto: e o
           que responde "preciso abrir isto?" sem abrir. */
        .settings-launcher-state {
          grid-column: 2;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--line);
        }
        .settings-launcher-value {
          color: var(--ink-2);
          font-size: 12px;
          font-weight: 600;
        }
        /* Dentro do dialogo o painel perde a moldura: a moldura ja e o
           proprio dialogo, e duas bordas concentricas so somam ruido. */
        .settings-modal .settings-panel {
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
        }
        .settings-modal .audit-modal-body { display: grid; gap: 18px; }
        .settings-modal .settings-actions {
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }
        .extraction-progress { display: grid; gap: 6px; }
        .extraction-bar {
          overflow: hidden;
          height: 6px;
          border-radius: 999px;
          background: var(--bg-inset);
        }
        .extraction-bar-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: var(--accent);
          transition: width .3s ease;
        }
        .extraction-progress-legend {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 10px;
          color: var(--muted);
          font-size: 11px;
        }
        .extraction-file {
          overflow: hidden;
          font-family: var(--font-mono);
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .settings-actions-row .primary {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 600;
        }
        .settings-stamp {
          margin-left: auto;
          color: var(--muted);
          font-size: 11px;
        }
        /* No painel da extracao o carimbo e uma nota de rodape, nao um valor
           alinhado a direita como na linha de ajustes. */
        .settings-panel > .settings-stamp { margin-left: 0; }
        /* Modos e seletor lado a lado, como no historico. Alinhado ao fim
           porque o cabecalho alinha pelo topo e este bloco tem altura menor
           que o titulo com subtitulo. */
        .energy-flow-period {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-left: auto;
        }
        .energy-flow-period .history-date-input { min-width: 132px; }
        /* O seletor de ciclo herda toda a caixa do campo de data — mesma
           altura, borda e raio — e so acrescenta o que um <select> precisa: a
           seta do sistema no tema certo e largura para o rotulo do ciclo, que
           e bem mais longo que uma data. */
        .history-cycle-select {
          /* A unica largura que foge do padrao dos outros tres modos, porque
             o rotulo do ciclo carrega referencia, dia e situacao numa linha
             so. Ver o comentario das medidas em :host. */
          width: var(--energy-period-field-cycle);
          color-scheme: light dark;
          font-weight: 700;
        }
        /* ---------------- Responsivo ---------------- */
        /* Abaixo de 1080px a coluna vira barra horizontal: manter 244px de
           navegacao fixa num tablet custaria um quarto da largura util. */
        @media (max-width: 1320px) {
          .charts-row { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 1180px) {
          .overview-flow-row { grid-template-columns: minmax(0, 1fr); }
          .rateio-body { grid-template-columns: auto minmax(0, 1fr); }
        }
        @media (max-width: 1080px) {
          .shell { grid-template-columns: minmax(0, 1fr); height: auto; min-height: 0; }
          .sidebar {
            position: static;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            min-width: 0;
            height: auto;
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }
          /* Na faixa estreita a navegacao vira uma linha horizontal: aqui a
             regua compartilhada nao existe mais, e impor sua altura deixaria
             a marca alta demais ao lado dos botoes. */
          .brand {
            flex: 0 0 auto;
            min-height: 0;
            padding: 12px 18px;
            border-bottom: 0;
          }
          .brand-name { font-size: 13px; }
          .brand-sub { display: none; }
          .main-nav {
            flex-direction: row;
            padding: 8px 10px 8px 0;
            overflow-x: auto;
            /* Sem isto o overflow-x acima nunca entra em acao: item de flex
               nasce com min-width auto e se recusa a encolher abaixo do
               proprio conteudo. A faixa crescia ate caber os oito icones,
               empurrava a barra alem da tela, e a PAGINA INTEIRA passava a
               arrastar para o lado — cabecalho junto com o conteudo. */
            min-width: 0;
            scrollbar-width: none;
          }
          .main-nav::-webkit-scrollbar { display: none; }
          .nav-button {
            padding: 9px 13px;
            border-left: 0;
            border-bottom: 2px solid transparent;
            border-radius: 4px;
          }
          .nav-button.active { border-left: 0; border-bottom-color: var(--accent); }
          .top-bar { min-height: 0; padding: 14px 18px; }
          .page-content { padding: 18px; }
          .toolbar { position: static; }
        }
        @media (max-width: 1024px) {
          .settings-head { grid-template-columns: minmax(0, 1fr); gap: 8px; }
        }
        @media (max-width: 860px) {
          .settings-field-row { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 760px) {
          .top-bar { align-items: flex-start; flex-direction: column; gap: 12px; }
          .top-bar-actions { flex-wrap: wrap; width: 100%; }
          .page-content { padding: 14px; gap: 16px; }
          .panel { padding: 16px; }
          .console-line {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 6px 12px;
          }
          .console-subject, .console-desc, .console-origin { grid-column: 1 / -1; }
        }
        @media (max-width: 430px) {
          .nav-label { display: none; }
          .nav-button { padding: 9px 11px; }
          .alert-total-value { font-size: 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
        }
      `;
    }
  }

  if (!customElements.get(CARD_TAG)) {
    customElements.define(CARD_TAG, CoEnergyOverviewCardV6);
  }

  // O mesmo componente como painel proprio, servido pela integracao e
  // registrado na barra lateral. Existe para que instalar a integracao baste:
  // antes disto, a tela so aparecia para quem copiasse o arquivo para `www`,
  // registrasse um recurso do Lovelace e montasse um painel a mao — quatro
  // passos que exigem saber como o Home Assistant funciona por dentro.
  //
  // O cartao continua registrado acima: quem prefere a tela dentro de um
  // painel proprio, ao lado de outros cartoes da mesma unidade, seque
  // podendo. Painel e cartao nao se excluem.
  class CoEnergyPanelV6 extends HTMLElement {
    set hass(hass) {
      this._conteudo().hass = hass;
    }

    // O Home Assistant escreve estas tres em todo painel. Sao aceitas e
    // ignoradas de proposito: a tela ja se adapta a largura por CSS, e
    // guardar a rota faria o painel ter estado que ninguem le.
    set narrow(_valor) {}
    set route(_valor) {}
    set panel(_valor) {}

    _conteudo() {
      if (!this._carta) {
        // Como CARTAO, a tela vive dentro de um painel do Lovelace e rola por
        // baixo do cabecalho do Home Assistant — por isso tudo que e sticky
        // reserva `--header-height`, 56px por padrao. Como PAINEL nao ha
        // cabecalho nenhum acima: a reserva vira deslocamento, e a barra
        // sticky passa a comer o topo do conteudo.
        //
        // Declarar aqui corrige os cinco lugares que dependem da medida de
        // uma vez, e deixa o cartao intacto para quem o usa numa aba propria.
        this.style.setProperty("--header-height", "0px");
        this.style.display = "block";
        this._carta = document.createElement(CARD_TAG);
        // O cartao exige configuracao, e como painel nao ha painel do
        // Lovelace para escreve-la: vale o mesmo exemplo que o Home
        // Assistant oferece ao adicionar o cartao a mao.
        this._carta.setConfig(CoEnergyOverviewCardV6.getStubConfig());
        this.appendChild(this._carta);
      }
      return this._carta;
    }
  }

  if (!customElements.get(PANEL_TAG)) {
    customElements.define(PANEL_TAG, CoEnergyPanelV6);
  }

  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === CARD_TAG)) {
    window.customCards.push({
      type: CARD_TAG,
      name: "CoEnergy Overview V6",
      description: "Visão geral por unidade da Gestão de Energia V6.",
    });
  }
})();
