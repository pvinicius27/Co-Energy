"""Leitura das faturas em PDF da Equatorial Goias.

Veio do extrator que rodava no Windows (``src/extrator/equatorial``), trazido
para dentro da integracao para o Home Assistant ler a fatura sozinho. As regras
de leitura sao as mesmas, linha por linha; saiu apenas o que so fazia sentido
la fora:

* a janela do programa e a exportacao para Excel;
* a busca da UC pelo nome do arquivo. Ela so aceitava numeros que estivessem
  numa lista de UCs escrita no proprio codigo — e e justamente essa lista que
  deixa de existir. Quem diz de quem e cada UC agora e quem instalou, na tela.

Dados pessoais continuam fora: titular, CPF/CNPJ, endereco, PIX e linha
digitavel nunca sao coletados.
"""

import json
import re
import traceback
import unicodedata
from datetime import datetime
from dataclasses import dataclass, asdict, field
from typing import Optional, List, Tuple, Dict, Any

try:
    import pdfplumber
except Exception:
    pdfplumber = None


@dataclass
class ResultadoSCEE:
    arquivo: str

    # A unidade a que a fatura pertence. Quem decide e o modelo de quem
    # instalou, pela UC; a leitura do PDF nunca preenche este campo.
    unidade: Optional[str] = None
    unidade_motivo: Optional[str] = None

    distribuidora: Optional[str] = None
    unidade_consumidora_fatura: Optional[str] = None

    referencia: Optional[str] = None
    tipo_faturamento: Optional[str] = None
    vencimento: Optional[str] = None
    vencimento_corrigido: Optional[str] = None
    leitura_anterior: Optional[str] = None
    leitura_atual: Optional[str] = None
    dias_leitura: Optional[str] = None
    proxima_leitura: Optional[str] = None

    valor_total: Optional[float] = None
    valor_total_texto: Optional[str] = None

    consumo_kwh: Optional[float] = None
    consumo_kwh_texto: Optional[str] = None
    consumo_scee_kwh: Optional[float] = None
    consumo_scee_kwh_texto: Optional[str] = None

    # Tarifa principal mantida apenas como referência interna/Excel.
    # No JSON final, as tarifas são mapeadas por item da fatura.
    tarifa_kwh_com_tributos: Optional[float] = None
    tarifa_kwh_com_tributos_texto: Optional[str] = None
    tarifa_origem: Optional[str] = None

    # Itens da fatura mapeados por linha, com colunas da tabela:
    # quantidade, preço unitário com tributos e valor em R$.
    itens_fatura: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    # Leituras do medidor físico
    leituras_medidor_texto: Optional[str] = None
    medidor_fisico_ativa: Optional[str] = None
    leitura_medidor_ativa_anterior: Optional[str] = None
    leitura_medidor_ativa_atual: Optional[str] = None
    constante_medidor_ativa: Optional[str] = None
    consumo_medidor_ativa_kwh: Optional[float] = None
    consumo_medidor_ativa_kwh_texto: Optional[str] = None
    medidor_fisico_geracao: Optional[str] = None
    leitura_medidor_geracao_anterior: Optional[str] = None
    leitura_medidor_geracao_atual: Optional[str] = None
    constante_medidor_geracao: Optional[str] = None
    consumo_medidor_geracao_kwh: Optional[float] = None
    consumo_medidor_geracao_kwh_texto: Optional[str] = None

    memoria_calculo_texto: Optional[str] = None
    total_calculado_itens: Optional[float] = None
    diferenca_total_calculado: Optional[float] = None

    mensagem_scee: Optional[str] = None
    scee_ciclo: Optional[str] = None
    scee_uc_geracao: Optional[str] = None
    scee_geracao_ciclo_kwh: Optional[float] = None
    scee_geracao_ciclo_kwh_texto: Optional[str] = None
    scee_uc_excedente_recebido: Optional[str] = None
    scee_excedente_recebido_kwh: Optional[float] = None
    scee_excedente_recebido_kwh_texto: Optional[str] = None
    scee_credito_recebido_kwh: Optional[float] = None
    scee_credito_recebido_kwh_texto: Optional[str] = None
    scee_saldo_kwh: Optional[float] = None
    scee_saldo_kwh_texto: Optional[str] = None
    scee_saldo_expirar_30_dias_kwh: Optional[float] = None
    scee_saldo_expirar_30_dias_kwh_texto: Optional[str] = None
    scee_saldo_expirar_60_dias_kwh: Optional[float] = None
    scee_saldo_expirar_60_dias_kwh_texto: Optional[str] = None
    scee_rateio_uc: Optional[str] = None
    scee_rateio_percentual: Optional[float] = None
    scee_rateio_percentual_texto: Optional[str] = None

    status: str = "OK"
    alertas: List[str] = field(default_factory=list)


def normalizar_texto(texto: str) -> str:
    if not texto:
        return ""
    texto = texto.replace("\xa0", " ").replace("\t", " ").replace("\r", "\n")
    texto = re.sub(r"[ ]{2,}", " ", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip()


def texto_linha_unica(texto: str) -> str:
    return re.sub(r"\s+", " ", normalizar_texto(texto)).strip()


def texto_sem_acentos_busca(texto: Optional[str]) -> str:
    """
    Normaliza texto para buscas mais tolerantes:
    - remove acentos;
    - transforma º/° em O;
    - mantém números, pontos, traços e barras.
    """
    if not texto:
        return ""
    texto = str(texto).replace("º", "O").replace("°", "O")
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    texto = re.sub(r"\s+", " ", texto).strip().upper()
    return texto


def limpar_numero_texto(valor: Optional[str]) -> Optional[str]:
    if valor is None:
        return None
    return str(valor).strip().rstrip(".,;:")


def br_para_float(valor) -> Optional[float]:
    if valor is None:
        return None
    valor = str(valor).strip()
    valor = valor.replace("R$", "").replace("%", "").replace("*", "").replace(" ", "")
    valor = valor.replace(".", "").replace(",", ".")
    try:
        return float(valor)
    except Exception:
        return None


def numero_br_para_float(valor: Optional[str]) -> Optional[float]:
    return br_para_float(valor)


def formatar_numero_br(valor, casas=2) -> str:
    if valor is None:
        return ""
    texto = f"{valor:,.{casas}f}"
    return texto.replace(",", "X").replace(".", ",").replace("X", ".")


def formatar_moeda_br(valor) -> str:
    if valor is None:
        return ""
    return f"R$ {formatar_numero_br(valor, 2)}"


def limpar_numeros(valor: Optional[str]) -> Optional[str]:
    if not valor:
        return None
    numeros = re.sub(r"\D", "", str(valor))
    return numeros if numeros else None

def formatar_uc(valor: Optional[str]) -> Optional[str]:
    """
    Formata UC removendo zeros iniciais e aceitando os formatos encontrados nas faturas.

    Exemplos aceitos:
    - 123456789012345 -> 1.234.567.890-12
    - 123456789012    -> 1.234.567.890-12
    - 12345678901     -> 123.456.789-01
    - 12345678        -> 12345678

    Observação:
    Algumas faturas antigas usam UC curta, como 12345678. Nesse caso o programa
    mantém somente os números, sem tentar aplicar pontos e traço.
    """

    if not valor:
        return None

    numeros = re.sub(r"\D", "", str(valor))

    if not numeros:
        return None

    numeros = numeros.lstrip("0")

    if not numeros:
        return None

    # Formato novo com 12 dígitos: 1.234.567.890-12
    if len(numeros) == 12:
        return (
            f"{numeros[0]}."
            f"{numeros[1:4]}."
            f"{numeros[4:7]}."
            f"{numeros[7:10]}-"
            f"{numeros[10:12]}"
        )

    # Formato novo com 13 dígitos: 12.345.678.901-23
    if len(numeros) == 13:
        return (
            f"{numeros[0:2]}."
            f"{numeros[2:5]}."
            f"{numeros[5:8]}."
            f"{numeros[8:11]}-"
            f"{numeros[11:13]}"
        )

    # Formato mostrado como NÚMERO DA UC: 123.456.789-01.
    # Se a fatura antiga trouxer 11 dígitos sem pontos/traço, como 12345678901,
    # mantém o formato original numérico para não transformar em 123.456.789-01.
    if len(numeros) == 11 and re.search(r"[.\-]", str(valor)):
        return (
            f"{numeros[0:3]}."
            f"{numeros[3:6]}."
            f"{numeros[6:9]}-"
            f"{numeros[9:11]}"
        )

    # Formatos curtos/antigos, exemplo: 12345678 ou 12345678901.
    return numeros

def primeira_ocorrencia(texto: str, padroes: List[str]) -> Optional[str]:
    if not texto:
        return None
    for padrao in padroes:
        match = re.search(padrao, texto, re.IGNORECASE | re.DOTALL)
        if match:
            return re.sub(r"\s+", " ", match.group(1)).strip()
    return None


def extrair_texto_pdf(caminho_pdf: str) -> str:
    if pdfplumber is None:
        raise RuntimeError("A biblioteca pdfplumber não está instalada. Instale com: pip install pdfplumber")
    partes = []
    with pdfplumber.open(caminho_pdf) as pdf:
        for pagina in pdf.pages:
            texto_pagina = pagina.extract_text() or ""
            if texto_pagina.strip():
                partes.append(texto_pagina)
    return normalizar_texto("\n".join(partes))


def extrair_distribuidora(texto_unico: str) -> Optional[str]:
    if re.search(r"Equatorial\s+Goi[aá]s", texto_unico, re.IGNORECASE):
        return "Equatorial Goiás"
    if re.search(r"Equatorial", texto_unico, re.IGNORECASE):
        return "Equatorial"
    return None


# As funções de extração de titular, CPF/CNPJ e endereço foram removidas desta versão.
# O extrator mantém apenas dados técnicos da fatura.


def extrair_unidade_consumidora_fatura(texto_unico: str) -> Optional[str]:
    """
    Extrai a UC principal da fatura, evitando capturar CPF/CNPJ, código de barras,
    nota fiscal ou UCs de geração/rateio do bloco SCEE.

    Formatos aceitos:
    - Unidade Consumidora 12345678901
    - Unidade Consumidora 12345678
    - NÚMERO DA UC 123.456.789-01
    - NÚMERO DA UC 1.234.567.890-12
    - referência seguida da UC, exemplo: MAI/2026 1.234.567.890-12

    Importante:
    As faturas antigas, como 01/2026, podem ter o número da UC em caixa colorida
    sem o rótulo aparecer no texto extraído. Nesse caso, quem resolve é o fallback
    extrair_unidade_consumidora_fatura_pdf(), que lê a posição das palavras no PDF.
    """

    if not texto_unico:
        return None

    meses = r"JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ"

    texto_bruto = str(texto_unico)
    texto_compacto = re.sub(r"\s+", " ", texto_bruto).strip()
    texto_normalizado = texto_sem_acentos_busca(texto_compacto)

    textos_busca = [texto_compacto]
    if texto_normalizado and texto_normalizado != texto_compacto:
        textos_busca.append(texto_normalizado)

    # Tipos de número encontrados nas faturas:
    # 1.234.567.890-12, 1.234.567.890-12, 123.456.789-01, 12345678, 12345678901.
    padrao_uc_pontuada_4_blocos = r"\d{1,3}(?:\.\d{3}){3}-\d{2}"
    padrao_uc_pontuada_3_blocos = r"\d{3}\.\d{3}\.\d{3}-\d{2}"
    padrao_uc_curta = r"\d{6,13}"
    padrao_uc_geral = rf"(?:{padrao_uc_pontuada_4_blocos}|{padrao_uc_pontuada_3_blocos}|{padrao_uc_curta})"

    rotulos = [
        r"UNIDADE\s+CONSUMIDORA",
        r"NUMERO\s+DA\s+U\s*C",
        r"N[ÚU]MERO\s+DA\s+U\s*C",
        r"N\s*[ºO]\s+DA\s+U\s*C",
        r"NO\s+DA\s+U\s*C",
        r"N\s*DA\s+U\s*C",
        r"NRO\s+DA\s+U\s*C",
        r"NUM\.?\s+DA\s+U\s*C",
        r"UC\s+DA\s+FATURA",
        r"UC\s+PRINCIPAL",
    ]

    def contexto_proibido(texto: str, inicio: int, fim: int) -> bool:
        """Evita falsos positivos como CPF/CNPJ, nota fiscal, chave de acesso e mensagens ANEEL."""
        antes = texto[max(0, inicio - 80):inicio]
        depois = texto[fim:fim + 100]
        contexto = f"{antes} {depois}"
        contexto_norm = texto_sem_acentos_busca(contexto)

        if re.search(r"CNPJ\s*/\s*CPF|CPF\s*/\s*CNPJ|CPF\b|CNPJ\b|CEP\b", contexto_norm):
            return True
        if re.search(r"NOTA\s+FISCAL|CHAVE\s+DE\s+ACESSO|PROTOCOLO|CODIGO\s+PIX|CODIGO\s+DE\s+BARRAS", contexto_norm):
            return True
        if re.search(r"NUMERO\s+DA\s+UC\s+SERA\s+PADRONIZADO|PADRONIZADO\s+EM\s+TODO\s+PAIS|REN\s+1095", contexto_norm):
            return True
        return False

    # 1) Rótulo explícito. Aqui a distância entre o rótulo e o número é curta de propósito.
    #    Não usamos ".{0,120}" porque isso capturava CPF em mensagens como
    #    "o número da UC será padronizado...".
    for texto in textos_busca:
        for rotulo in rotulos:
            match = re.search(rf"(?:{rotulo})\s*[:\-]?\s*({padrao_uc_geral})", texto, re.IGNORECASE)
            if match and not contexto_proibido(texto, match.start(1), match.end(1)):
                return formatar_uc(match.group(1))

    # 2) Rótulo em uma linha e número nas próximas linhas.
    linhas = [linha.strip() for linha in texto_bruto.splitlines() if linha.strip()]
    for i, linha in enumerate(linhas):
        linha_norm = texto_sem_acentos_busca(linha)
        if any(re.search(rotulo, linha_norm, re.IGNORECASE) for rotulo in rotulos):
            bloco = " ".join(linhas[i:i + 4])
            bloco_norm = texto_sem_acentos_busca(bloco)
            # Ignora mensagem informativa ANEEL sobre padronização da UC.
            if re.search(r"SERA\s+PADRONIZADO|PADRONIZADO\s+EM\s+TODO\s+PAIS|REN\s+1095", bloco_norm, re.IGNORECASE):
                continue
            match = re.search(padrao_uc_geral, bloco, re.IGNORECASE)
            if match and not contexto_proibido(bloco, match.start(), match.end()):
                return formatar_uc(match.group(0))

    # 3) Referência seguida da UC, comum no layout novo.
    #    Exemplos: MAI/2026 1.234.567.890-12 / FEV/2026 123.456.789-01.
    for texto in textos_busca:
        match = re.search(
            rf"\b(?:{meses})\/20\d{{2}}\s+({padrao_uc_pontuada_4_blocos}|{padrao_uc_pontuada_3_blocos}|\d{{6,13}})\b",
            texto,
            re.IGNORECASE,
        )
        if match and not contexto_proibido(texto, match.start(1), match.end(1)):
            return formatar_uc(match.group(1))

    # Não tentamos capturar "número antes da referência" pelo texto corrido, porque
    # em faturas antigas o CEP do endereço pode aparecer antes de JAN/2026/FEV/2026
    # e virar falso positivo. Esse cenário é tratado pelo fallback posicional do PDF.

    # Não há fallback genérico para "qualquer número pontuado", porque isso captura
    # CPF/CNPJ como 0xx.2xx.0xx-xx. Para esses casos, use o fallback posicional do PDF.
    return None


def _linhas_por_palavras_pdfplumber(pagina) -> List[str]:
    """Recria linhas pela posição das palavras do PDF, útil quando extract_text() perde caixas coloridas."""
    try:
        palavras = pagina.extract_words(
            x_tolerance=2,
            y_tolerance=3,
            keep_blank_chars=False,
            use_text_flow=False,
        ) or []
    except Exception:
        return []

    if not palavras:
        return []

    palavras = sorted(palavras, key=lambda p: (round(float(p.get("top", 0)) / 3) * 3, float(p.get("x0", 0))))
    grupos: List[List[Dict[str, Any]]] = []

    for palavra in palavras:
        top = float(palavra.get("top", 0))
        if not grupos:
            grupos.append([palavra])
            continue

        top_grupo = sum(float(p.get("top", 0)) for p in grupos[-1]) / max(len(grupos[-1]), 1)
        if abs(top - top_grupo) <= 4:
            grupos[-1].append(palavra)
        else:
            grupos.append([palavra])

    linhas = []
    for grupo in grupos:
        grupo = sorted(grupo, key=lambda p: float(p.get("x0", 0)))
        linha = " ".join(str(p.get("text", "")).strip() for p in grupo if str(p.get("text", "")).strip())
        linha = re.sub(r"\s+", " ", linha).strip()
        if linha:
            linhas.append(linha)
    return linhas


def _candidato_parece_uc(valor: Optional[str]) -> bool:
    if not valor:
        return False
    digitos = re.sub(r"\D", "", str(valor))
    if not (6 <= len(digitos) <= 13):
        return False
    # Evita datas, valores e porcentagens.
    if re.fullmatch(r"\d{1,2}/\d{1,2}/\d{2,4}", str(valor).strip()):
        return False
    return True


def _extrair_uc_por_posicao_pagina(pagina) -> Optional[str]:
    """
    Lê a UC pela posição visual no PDF.

    Nos layouts da Equatorial analisados, a UC principal fica em uma caixa colorida
    na parte superior da primeira página:
    - layout antigo 01/2026: número puro, ex. 12345678901;
    - layout novo 05/2026: número padronizado, ex. 1.234.567.890-12.

    Esse método evita capturar o Parceiro de Negócio, que fica acima da UC.
    """
    try:
        palavras = pagina.extract_words(
            x_tolerance=1,
            y_tolerance=3,
            keep_blank_chars=False,
            use_text_flow=False,
        ) or []
    except Exception:
        return None

    if not palavras:
        return None

    largura = float(getattr(pagina, "width", 0) or 0)
    altura = float(getattr(pagina, "height", 0) or 0)
    if not largura or not altura:
        return None

    padrao_uc_token = re.compile(r"^(?:\d{1,3}(?:\.\d{3}){2,3}-\d{2}|\d{6,13})$")
    candidatos = []

    for palavra in palavras:
        texto_palavra = str(palavra.get("text", "")).strip()
        if not padrao_uc_token.match(texto_palavra):
            continue
        if not _candidato_parece_uc(texto_palavra):
            continue

        digitos = re.sub(r"\D", "", texto_palavra)
        x0 = float(palavra.get("x0", 0))
        x1 = float(palavra.get("x1", 0))
        top = float(palavra.get("top", 0))
        centro_x = (x0 + x1) / 2

        # Região principal da caixa de UC nos dois layouts anexados.
        na_faixa_visual_uc = (
            0.30 * largura <= centro_x <= 0.56 * largura
            and 0.13 * altura <= top <= 0.18 * altura
        )

        # Região um pouco ampliada para variações de impressão/escala.
        na_faixa_ampliada = (
            0.25 * largura <= centro_x <= 0.62 * largura
            and 0.115 * altura <= top <= 0.205 * altura
        )

        if not na_faixa_ampliada:
            continue

        score = 0
        if na_faixa_visual_uc:
            score += 100
        if 8 <= len(digitos) <= 13:
            score += 20
        if "." in texto_palavra or "-" in texto_palavra:
            score += 10
        # Penaliza o Parceiro de Negócio, que nos layouts testados fica mais alto.
        if top < 0.135 * altura:
            score -= 70
        # A UC antiga 12345678901 fica por volta de y=200; a nova 1.234... por volta de y=185.
        score -= abs(top - 0.150 * altura) / 5

        candidatos.append((score, top, centro_x, texto_palavra))

    if candidatos:
        candidatos.sort(key=lambda item: item[0], reverse=True)
        return formatar_uc(candidatos[0][3])

    return None


def extrair_unidade_consumidora_fatura_pdf(caminho_pdf: str) -> Optional[str]:
    """
    Fallback específico para a UC principal.

    Algumas faturas da Equatorial mostram a UC em caixas coloridas. Dependendo do
    PDF, o pdfplumber.extract_text() lê referência, vencimento e leituras, mas a UC
    fica fora de ordem ou sem rótulo. Este fallback usa:
    1) leitura posicional da caixa de UC na parte superior da página;
    2) extract_text(layout=True);
    3) reconstrução das linhas por extract_words().
    """
    if pdfplumber is None:
        return None

    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages:
                # Primeiro tenta pela posição visual. Isso resolve o layout 01/2026.
                uc_posicao = _extrair_uc_por_posicao_pagina(pagina)
                if uc_posicao:
                    return uc_posicao

                textos_teste = []

                try:
                    texto_layout = pagina.extract_text(
                        x_tolerance=1,
                        y_tolerance=3,
                        layout=True,
                    ) or ""
                    if texto_layout.strip():
                        textos_teste.append(texto_layout)
                except Exception:
                    pass

                linhas_palavras = _linhas_por_palavras_pdfplumber(pagina)
                if linhas_palavras:
                    textos_teste.append("\n".join(linhas_palavras))
                    for i, linha in enumerate(linhas_palavras):
                        linha_norm = texto_sem_acentos_busca(linha)
                        if re.search(r"UNIDADE\s+CONSUMIDORA|NUMERO\s+DA\s+U\s*C|N\s*[Oº]\s+DA\s+U\s*C|NO\s+DA\s+U\s*C|N\s*DA\s+U\s*C", linha_norm):
                            bloco = "\n".join(linhas_palavras[i:i + 5])
                            textos_teste.insert(0, bloco)

                for texto_teste in textos_teste:
                    uc = extrair_unidade_consumidora_fatura(texto_teste)
                    if uc:
                        return uc
    except Exception:
        return None

    return None


def extrair_referencia(texto_unico: str) -> Optional[str]:
    meses = r"JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ"
    valor = primeira_ocorrencia(texto_unico, [
        rf"Refer[eê]ncia\s*[:\-]?\s*(({meses})\/20\d{{2}})",
        rf"M[eê]s\/Ano\s*[:\-]?\s*(({meses})\/20\d{{2}})",
        rf"\b(({meses})\/20\d{{2}})\b",
        r"Refer[eê]ncia\s*[:\-]?\s*(\d{2}\/20\d{2})",
    ])
    return valor.upper() if valor else None


def extrair_tipo_faturamento_pdf(caminho_pdf: str) -> Optional[str]:
    """Lê o tipo da primeira competência exibida no histórico de consumo."""
    if pdfplumber is None:
        return None

    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages:
                palavras = pagina.extract_words(
                    x_tolerance=2,
                    y_tolerance=2,
                    keep_blank_chars=False,
                    use_text_flow=False,
                ) or []
                cabecalhos = [
                    palavra for palavra in palavras
                    if texto_sem_acentos_busca(palavra.get("text")) == "FATURAMENTO"
                ]
                for cabecalho in cabecalhos:
                    x_coluna = float(cabecalho.get("x0", 0))
                    fim_cabecalho = float(cabecalho.get("bottom", cabecalho.get("top", 0)))
                    candidatos = []
                    for palavra in palavras:
                        topo = float(palavra.get("top", 0))
                        x0 = float(palavra.get("x0", 0))
                        if fim_cabecalho < topo <= fim_cabecalho + 100 and x0 >= x_coluna - 12:
                            normalizado = texto_sem_acentos_busca(palavra.get("text"))
                            if re.search(r"[A-Z]", normalizado):
                                candidatos.append((topo, x0, normalizado))

                    for _, _, valor in sorted(candidatos):
                        if valor in {"AUTOLEITURA", "LIDA"}:
                            return valor
                        # Alguns PDFs substituem o É de MÉDIA por um caractere inválido.
                        if valor == "MEDIA" or re.fullmatch(r"M.DIA", valor):
                            return "MÉDIA"
                        if valor in {"ESTIMADA", "MINIMO", "IMPEDIMENTO"}:
                            return valor
    except Exception:
        return None

    return None


def extrair_vencimento(texto_unico: str) -> Optional[str]:
    return primeira_ocorrencia(texto_unico, [
        r"(?:Vencimento\s*[:\-]?\s*|(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/20\d{2}\s+)(\d{2}\/\d{2}\/20\d{2})(?=\s+R\$|\b)",
        r"Data\s+de\s+Vencimento\s*[:\-]?\s*(\d{2}\/\d{2}\/20\d{2})",
        r"Vence\s+em\s*[:\-]?\s*(\d{2}\/\d{2}\/20\d{2})",
        r"R\$\s*\*+\s*[0-9.,]+\s+(\d{2}\/\d{2}\/20\d{2})",
    ])


def extrair_valor_total(texto_unico: str) -> Tuple[Optional[str], Optional[float]]:
    valor = primeira_ocorrencia(texto_unico, [
        r"Total\s+a\s+Pagar\s*[:\-]?\s*R?\$?\s*\*{0,20}\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})",
        r"Valor\s+a\s+Pagar\s*[:\-]?\s*R?\$?\s*\*{0,20}\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})",
        r"R\$\s*\*{3,}\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})",
        r"TOTAL\s+([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})",
    ])
    valor = limpar_numero_texto(valor)
    return valor, numero_br_para_float(valor)


def extrair_consumo_scee_kwh(texto_unico: str) -> Dict[str, Any]:
    """
    Extrai apenas o CONSUMO SCEE quando ele realmente existir na fatura.

    Importante:
    - Fatura comum não possui CONSUMO SCEE. Nesse caso retorna None.
    - Não usa CONSUMO kWh comum como SCEE.
    """
    if not texto_unico:
        return {"texto": None, "valor": None}

    t = re.sub(r"\s+", " ", texto_unico).strip()

    padroes = [
        r"\bCONSUMO\s+SCEE\s+kWh\s+([0-9]{1,8}(?:[.,][0-9]{1,6})?)",
        r"\bCONSUMO\s+SCEE\s+KWH\s+([0-9]{1,8}(?:[.,][0-9]{1,6})?)",
    ]

    for padrao in padroes:
        match = re.search(padrao, t, re.IGNORECASE)
        if match:
            texto = limpar_numero_texto(match.group(1))
            return {"texto": texto, "valor": br_para_float(texto)}

    return {"texto": None, "valor": None}


def extrair_consumo_nao_compensado_kwh(texto_unico: str) -> Dict[str, Any]:
    """
    Extrai a quantidade da linha CONSUMO NÃO COMPENSADO quando ela existir.

    Esse campo representa a parcela do consumo que não foi coberta pelos créditos
    do SCEE. Em uma fatura com as duas linhas, o consumo total da unidade é:

        CONSUMO NÃO COMPENSADO + CONSUMO SCEE

    Quando a linha não existir, retorna texto/valor como None. A ausência pode ser
    legítima (fatura totalmente compensada) ou uma falha de leitura; por isso a
    decisão de gerar alerta é feita posteriormente, em
    reconciliar_consumo_total_scee().
    """
    if not texto_unico:
        return {"texto": None, "valor": None}

    texto_normalizado = texto_sem_acentos_busca(texto_unico)
    texto_normalizado = re.sub(r"\s+", " ", texto_normalizado).strip()

    padroes = [
        r"\bCONSUMO\s+NAO\s+COMPENSADO\s+KWH\s+([0-9]{1,8}(?:[.,][0-9]{1,6})?)",
        r"\bCONSUMO\s+NAO\s+COMPENSADO\s+([0-9]{1,8}(?:[.,][0-9]{1,6})?)",
    ]

    for padrao in padroes:
        match = re.search(padrao, texto_normalizado, re.IGNORECASE)
        if match:
            valor_texto = limpar_numero_texto(match.group(1))
            return {
                "texto": valor_texto,
                "valor": numero_br_para_float(valor_texto),
            }

    return {"texto": None, "valor": None}


def extrair_consumo_kwh(texto: str, texto_unico: str) -> Tuple[Optional[str], Optional[float]]:
    """
    Extrai o consumo total da unidade para o campo consumo_kwh.

    Regras aplicadas:
    1) Fatura SCEE com as duas parcelas:
       consumo total = CONSUMO NÃO COMPENSADO + CONSUMO SCEE.
    2) Se somente uma parcela SCEE for localizada, usa essa parcela como fallback.
       A situação será marcada como COM ALERTA posteriormente.
    3) Fatura comum: usa a quantidade da linha CONSUMO kWh.
    4) Último fallback: usa o consumo da tabela do medidor físico.

    O campo consumo_scee_kwh continua separado e representa somente a parcela
    compensada. Ele não deve substituir o consumo total da unidade.
    """

    consumo_nao_compensado = extrair_consumo_nao_compensado_kwh(texto_unico)
    consumo_scee = extrair_consumo_scee_kwh(texto_unico)

    valor_nao_compensado = consumo_nao_compensado.get("valor")
    valor_scee = consumo_scee.get("valor")

    # Caso correto de uma fatura SCEE com as duas parcelas disponíveis.
    if valor_nao_compensado is not None and valor_scee is not None:
        consumo_total = round(float(valor_nao_compensado) + float(valor_scee), 6)
        return formatar_numero_br(consumo_total, 2), consumo_total

    # Fallback seguro: utiliza a única parcela encontrada. A validação posterior
    # registra alerta para deixar claro que o total foi assumido.
    if valor_scee is not None:
        return consumo_scee.get("texto"), float(valor_scee)

    if valor_nao_compensado is not None:
        return consumo_nao_compensado.get("texto"), float(valor_nao_compensado)

    linhas = [linha.strip() for linha in texto.splitlines() if linha.strip()]

    def normalizar_busca_local(valor: str) -> str:
        valor = texto_sem_acentos_busca(valor)
        return re.sub(r"\s+", " ", valor).strip()

    def extrair_consumo_comum_do_bloco(bloco: str) -> Optional[Tuple[str, float]]:
        bloco_norm = normalizar_busca_local(bloco)

        # Não aceita as linhas especiais do SCEE como consumo comum.
        if re.search(
            r"CONSUMO\s+SCEE|CONSUMO\s+NAO\s+COMPENSADO|"
            r"HISTORICO\s+DE\s+CONSUMO|MEDIDOR|LEITURA|BANDEIRA|INJECAO|GERACAO",
            bloco_norm,
            re.IGNORECASE,
        ):
            return None

        match = re.search(
            r"(?:^|\s)CONSUMO(?:\s+DE\s+ENERGIA)?\s+KWH\s+"
            r"([0-9]{1,8}(?:[.,][0-9]{1,6})?)",
            bloco_norm,
            re.IGNORECASE,
        )
        if not match:
            return None

        consumo_texto = limpar_numero_texto(match.group(1))
        consumo_valor = numero_br_para_float(consumo_texto)
        if consumo_valor is None:
            return None

        return consumo_texto, consumo_valor

    # Primeiro tenta cada linha isoladamente, reduzindo risco de misturar itens.
    for linha in linhas:
        encontrado = extrair_consumo_comum_do_bloco(linha)
        if encontrado:
            return encontrado

    # Depois junta poucas linhas, pois alguns PDFs quebram o nome e as colunas.
    for indice in range(len(linhas)):
        bloco = " ".join(linhas[indice:indice + 3])
        bloco = re.sub(r"\s+", " ", bloco).strip()
        encontrado = extrair_consumo_comum_do_bloco(bloco)
        if encontrado:
            return encontrado

    # Fallback no texto corrido para fatura comum.
    encontrado = extrair_consumo_comum_do_bloco(texto_unico)
    if encontrado:
        return encontrado

    # Último fallback: tabela do medidor físico.
    for linha in linhas:
        linha_norm = normalizar_busca_local(linha)
        if re.search(r"ENERGIA\s+ATIVA", linha_norm) and re.search(r"KWH", linha_norm):
            numeros = re.findall(r"\b\d{1,8}(?:[.,]\d{1,6})?\b", linha)
            if numeros:
                consumo_texto = limpar_numero_texto(numeros[-1])
                consumo_valor = numero_br_para_float(consumo_texto)
                if consumo_valor is not None:
                    return consumo_texto, consumo_valor

    return None, None


def extrair_datas_leituras_avancado(texto: str, texto_unico: str) -> Dict[str, Any]:
    dados = {
        "referencia": None,
        "vencimento": None,
        "leitura_anterior": None,
        "leitura_atual": None,
        "dias_leitura": None,
        "proxima_leitura": None,
        "valor_total_texto": None,
        "valor_total": None,
    }

    meses = r"(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)"
    padrao_data = r"\d{2}/\d{2}/20\d{2}"
    t = re.sub(r"\s+", " ", texto_unico).strip()

    # Exemplo: 20/04/2026 20/05/2026 30 19/06/2026
    match_principal = re.search(
        rf"({padrao_data})\s+({padrao_data})\s+(\d{{1,2}})\s+({padrao_data})",
        t,
        re.IGNORECASE,
    )
    if match_principal:
        dados["leitura_anterior"] = match_principal.group(1)
        dados["leitura_atual"] = match_principal.group(2)
        dados["dias_leitura"] = match_principal.group(3)
        dados["proxima_leitura"] = match_principal.group(4)

    # Exemplo: 22/05/2026 1234567890123 MAI/2026 09/06/2026 R$**********12,34
    match_rodape = re.search(
        rf"({padrao_data})\s+\d{{10,}}\s+({meses}/20\d{{2}})\s+({padrao_data})\s+R\$\s*\*+",
        t,
        re.IGNORECASE,
    )
    if match_rodape:
        dados["referencia"] = match_rodape.group(2).upper()
        dados["vencimento"] = match_rodape.group(3)

    # Exemplo: MAI/2026 R$**********66,62 09/06/2026
    if not dados["vencimento"]:
        match_vencimento_alt = re.search(
            rf"({meses}/20\d{{2}})\s+R\$\s*\*+\s*[0-9.,]+\s+({padrao_data})",
            t,
            re.IGNORECASE,
        )
        if match_vencimento_alt:
            dados["referencia"] = match_vencimento_alt.group(1).upper()
            dados["vencimento"] = match_vencimento_alt.group(2)

    match_valor = re.search(r"R\$\s*\*+\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})", t, re.IGNORECASE)
    if match_valor:
        dados["valor_total_texto"] = match_valor.group(1)
        dados["valor_total"] = br_para_float(match_valor.group(1))

    if not dados["referencia"]:
        match_ref = re.search(rf"\b({meses}/20\d{{2}})\b", t, re.IGNORECASE)
        if match_ref:
            dados["referencia"] = match_ref.group(1).upper()

    return dados



def extrair_leituras_medidor_fisico(texto: str, texto_unico: str) -> Dict[str, Any]:
    """
    Extrai a tabela de leituras do medidor físico.

    Formatos esperados na fatura:
    Medidor | Grandezas | Postos Horários | Leitura Anterior | Leitura Atual | Constante Medidor | Consumo kWh

    Exemplos:
    1234567-8 ENERGIA ATIVA - KWH ÚNICO 000419 000561 1,000000 142
    1234567-8 ENERGIA GERAÇÃO - KWH ÚNICO 002952 003970 1,000000 1018

    Também aceita:
    - ENERGIA ATIVA - KW
    - ENERGIA GERAÇÃO - KW
    - UNICO / ÚNICO
    - GERAÇÃO / GERACAO
    """

    linhas_pdf = [linha.strip() for linha in texto.splitlines() if linha.strip()]
    itens: List[Dict[str, Any]] = []
    chaves_encontradas = set()

    def normalizar_busca_local(valor: str) -> str:
        if valor is None:
            return ""

        valor = str(valor).upper()
        trocas = {
            "Á": "A", "À": "A", "Â": "A", "Ã": "A",
            "É": "E", "Ê": "E",
            "Í": "I",
            "Ó": "O", "Õ": "O", "Ô": "O",
            "Ú": "U",
            "Ç": "C",
        }

        for antigo, novo in trocas.items():
            valor = valor.replace(antigo, novo)

        valor = re.sub(r"\s+", " ", valor).strip()
        return valor

    def limpar_medidor(valor: Optional[str]) -> Optional[str]:
        if not valor:
            return None
        valor = re.sub(r"\s+", "", str(valor).strip())
        valor = re.sub(r"(\d+)\-?(\d)$", r"\1-\2", valor)
        return valor

    def tipo_exibicao(tipo: str) -> str:
        tipo_normalizado = normalizar_busca_local(tipo)
        if "GERACAO" in tipo_normalizado:
            return "GERAÇÃO"
        return "ATIVA"

    def adicionar_item(medidor, tipo, posto, leitura_anterior, leitura_atual, constante, consumo):
        tipo_fmt = tipo_exibicao(tipo)
        medidor_fmt = limpar_medidor(medidor)
        leitura_anterior = str(leitura_anterior).strip() if leitura_anterior is not None else None
        leitura_atual = str(leitura_atual).strip() if leitura_atual is not None else None
        constante = limpar_numero_texto(constante)
        consumo_texto = limpar_numero_texto(consumo)
        consumo_float = br_para_float(consumo_texto)
        posto = str(posto or "ÚNICO").strip().upper().replace("UNICO", "ÚNICO")

        chave = (tipo_fmt, medidor_fmt, leitura_anterior, leitura_atual, consumo_texto)
        if chave in chaves_encontradas:
            return
        chaves_encontradas.add(chave)

        itens.append({
            "medidor": medidor_fmt,
            "grandeza": f"ENERGIA {tipo_fmt} - KWH",
            "tipo": tipo_fmt,
            "posto_horario": posto,
            "leitura_anterior": leitura_anterior,
            "leitura_atual": leitura_atual,
            "constante_medidor": constante,
            "consumo_kwh_texto": consumo_texto,
            "consumo_kwh": consumo_float,
        })

    padrao_linha = re.compile(
        r"(?P<medidor>\d{5,10}\s*-?\s*\d)\s+"
        r"ENERGIA\s+(?P<tipo>ATIVA|GERA[ÇC][ÃA]O|GERACAO)\s*-\s*KW[H]?\s+"
        r"(?P<posto>[ÚU]NICO|UNICO)\s+"
        # Algumas faturas rurais antigas deixam a coluna "Leitura Anterior" vazia.
        # Exemplo real: 1234567-8 ENERGIA ATIVA - KWH ÚNICO 18562 1,000000 93,65
        # Nesse caso, 18562 é a leitura atual, 1,000000 é a constante e 93,65 é o consumo.
        r"(?:(?P<anterior>\d{1,10})\s+)?"
        r"(?P<atual>\d{1,10})\s+"
        r"(?P<constante>[0-9]+[.,][0-9]+)\s+"
        r"(?P<consumo>[0-9]+(?:[.,][0-9]+)?)",
        re.IGNORECASE,
    )

    padrao_linha_normalizada = re.compile(
        r"(?P<medidor>\d{5,10}\s*-?\s*\d)\s+"
        r"ENERGIA\s+(?P<tipo>ATIVA|GERACAO)\s*-\s*KW[H]?\s+"
        r"(?P<posto>UNICO)\s+"
        # Aceita linha com leitura anterior vazia.
        r"(?:(?P<anterior>\d{1,10})\s+)?"
        r"(?P<atual>\d{1,10})\s+"
        r"(?P<constante>[0-9]+[.,][0-9]+)\s+"
        r"(?P<consumo>[0-9]+(?:[.,][0-9]+)?)",
        re.IGNORECASE,
    )

    # 1) Busca linha a linha e juntando linhas seguintes, pois o PDF pode quebrar a tabela.
    for indice, _linha in enumerate(linhas_pdf):
        bloco = " ".join(linhas_pdf[indice:indice + 5])
        bloco = re.sub(r"\s+", " ", bloco).strip()

        for match in padrao_linha.finditer(bloco):
            adicionar_item(
                match.group("medidor"),
                match.group("tipo"),
                match.group("posto"),
                match.group("anterior"),
                match.group("atual"),
                match.group("constante"),
                match.group("consumo"),
            )

        bloco_normalizado = normalizar_busca_local(bloco)
        for match in padrao_linha_normalizada.finditer(bloco_normalizado):
            adicionar_item(
                match.group("medidor"),
                match.group("tipo"),
                match.group("posto"),
                match.group("anterior"),
                match.group("atual"),
                match.group("constante"),
                match.group("consumo"),
            )

    # 2) Busca no texto inteiro em linha única, para faturas em que a tabela veio toda em sequência.
    texto_busca = re.sub(r"\s+", " ", texto_unico).strip()
    for match in padrao_linha.finditer(texto_busca):
        adicionar_item(
            match.group("medidor"),
            match.group("tipo"),
            match.group("posto"),
            match.group("anterior"),
            match.group("atual"),
            match.group("constante"),
            match.group("consumo"),
        )

    texto_busca_normalizado = normalizar_busca_local(texto_busca)
    for match in padrao_linha_normalizada.finditer(texto_busca_normalizado):
        adicionar_item(
            match.group("medidor"),
            match.group("tipo"),
            match.group("posto"),
            match.group("anterior"),
            match.group("atual"),
            match.group("constante"),
            match.group("consumo"),
        )

    # 3) Fallback para extração vertical, quando o PDF separa as colunas em linhas.
    #    Usa a ordem visual da tabela: ATIVA primeiro e GERAÇÃO depois.
    if not itens and re.search(r"Medidor\s+Grandezas", texto_unico, re.IGNORECASE):
        inicio = re.search(r"Medidor\s+Grandezas", texto_unico, re.IGNORECASE)
        fim = re.search(r"(?:Itens\s+de\s+fatura|FORNECIMENTO|DADOS\s+DA\s+FATURA|TOTAL\s+A\s+PAGAR)", texto_unico[inicio.start():], re.IGNORECASE) if inicio else None

        if inicio:
            bloco_tabela = texto_unico[inicio.start():]
            if fim:
                bloco_tabela = texto_unico[inicio.start():inicio.start() + fim.start()]

            bloco_normalizado = normalizar_busca_local(bloco_tabela)
            medidores = re.findall(r"\b\d{5,10}\s*-\s*\d\b", bloco_tabela)
            tem_ativa = bool(re.search(r"ENERGIA\s+ATIVA\s*-\s*KW[H]?", bloco_normalizado, re.IGNORECASE))
            tem_geracao = bool(re.search(r"ENERGIA\s+GERACAO\s*-\s*KW[H]?", bloco_normalizado, re.IGNORECASE))
            constantes = re.findall(r"[0-9]+[.,][0-9]{4,6}", bloco_tabela)

            bloco_sem_medidores = re.sub(r"\b\d{5,10}\s*-\s*\d\b", " ", bloco_tabela)
            bloco_sem_constantes = bloco_sem_medidores
            for constante in constantes:
                bloco_sem_constantes = bloco_sem_constantes.replace(constante, " ")

            numeros = re.findall(r"\b\d{3,10}\b", bloco_sem_constantes)

            # Tenta dois layouts comuns:
            # A) por linha: anterior, atual, consumo / anterior, atual, consumo
            # B) por coluna: anteriores, atuais, consumos
            tipos = []
            if tem_ativa:
                tipos.append("ATIVA")
            if tem_geracao:
                tipos.append("GERAÇÃO")

            if len(tipos) == 2 and len(medidores) >= 2 and len(constantes) >= 2 and len(numeros) >= 6:
                # Caso mais comum em texto vertical: ant_ativa, ant_geracao, atual_ativa, atual_geracao, consumo_ativa, consumo_geracao
                if len(numeros[0]) >= 4 and len(numeros[1]) >= 4 and len(numeros[2]) >= 4 and len(numeros[3]) >= 4:
                    adicionar_item(medidores[0], "ATIVA", "ÚNICO", numeros[0], numeros[2], constantes[0], numeros[4])
                    adicionar_item(medidores[1], "GERAÇÃO", "ÚNICO", numeros[1], numeros[3], constantes[1], numeros[5])
                else:
                    # Layout por linha.
                    adicionar_item(medidores[0], "ATIVA", "ÚNICO", numeros[0], numeros[1], constantes[0], numeros[2])
                    adicionar_item(medidores[1], "GERAÇÃO", "ÚNICO", numeros[3], numeros[4], constantes[1], numeros[5])

    def item_por_tipo(tipo):
        for item in itens:
            if item.get("tipo") == tipo:
                return item
        return None

    ativa = item_por_tipo("ATIVA")
    geracao = item_por_tipo("GERAÇÃO")

    texto_leituras = None
    if ativa or geracao:
        linhas_texto = []

        # Mostra as leituras somente quando forem encontradas.
        # Formato solicitado:
        # Medidor: número do medidor
        # ENERGIA ATIVA - KWH
        # Leitura anterior: valor
        # Leitura Atual: valor
        # ENERGIA GERAÇÃO - KWH
        # Leitura anterior: valor
        # Leitura Atual: valor

        medidor_principal = None
        if ativa and ativa.get("medidor"):
            medidor_principal = ativa.get("medidor")
        elif geracao and geracao.get("medidor"):
            medidor_principal = geracao.get("medidor")

        if medidor_principal:
            linhas_texto.append(f"Medidor: {medidor_principal}")

        if ativa:
            if medidor_principal and ativa.get("medidor") and ativa.get("medidor") != medidor_principal:
                linhas_texto.append(f"Medidor: {ativa.get('medidor')}")
            linhas_texto.append("ENERGIA ATIVA - KWH")
            linhas_texto.append(f"Leitura anterior: {ativa.get('leitura_anterior') or 'Não informada'}")
            linhas_texto.append(f"Leitura Atual: {ativa.get('leitura_atual')}")

        if geracao:
            if medidor_principal and geracao.get("medidor") and geracao.get("medidor") != medidor_principal:
                linhas_texto.append(f"Medidor: {geracao.get('medidor')}")
            linhas_texto.append("ENERGIA GERAÇÃO - KWH")
            linhas_texto.append(f"Leitura anterior: {geracao.get('leitura_anterior') or 'Não informada'}")
            linhas_texto.append(f"Leitura Atual: {geracao.get('leitura_atual')}")

        texto_leituras = "\n".join(linhas_texto)

    return {
        "itens": itens,
        "ativa": ativa,
        "geracao": geracao,
        "texto": texto_leituras,
    }


def extrair_bloco_scee(texto_unico: str) -> Optional[str]:
    if not texto_unico:
        return None
    match = re.search(
        r"INFORMA[ÇC][ÕO]ES\s+DO\s+SCEE\s*:\s*(.*?)(?:PER[ÍI]ODO\s+DE\s+REFER[ÊE]NCIA|A\s+EQUATORIAL|PIS/PASEP|FORNECIMENTO|TOTAL\s+A\s+PAGAR|Nota\s+fiscal|CFOP|$)",
        texto_unico,
        re.IGNORECASE | re.DOTALL,
    )
    if match:
        bloco = match.group(1).strip()
        return re.sub(r"\s+", " ", bloco)
    return None


def slug_json(valor: Optional[str]) -> str:
    texto = texto_sem_acentos_busca(valor).lower()
    texto = re.sub(r"[^a-z0-9]+", "_", texto)
    texto = re.sub(r"_+", "_", texto).strip("_")
    return texto or "item"


def chave_item_fatura(nome: Optional[str]) -> str:
    """Cria uma chave estável para cada linha da tabela de itens da fatura."""
    nome_norm = texto_sem_acentos_busca(nome)

    regras = [
        (r"^CONSUMO\s+KWH$|^CONSUMO$", "consumo_kwh"),
        (r"ADC\s+BANDEIRA\s+AMARELA", "adc_bandeira_amarela"),
        (r"CONSUMO\s+NAO\s+COMPENSADO", "consumo_nao_compensado"),
        (r"CONSUMO\s+SCEE", "consumo_scee"),
        (r"INJECAO\s+SCEE", "injecao_scee"),
        (r"BENEFICIO\s+TARIFARIO\s+BRUTO\s+SCEE", "beneficio_tarifario_bruto_scee"),
        (r"PARC\s+INJET", "parc_injet_s_desc"),
        (r"CONTRIB.*ILUM.*PUBLICA.*MUNICIPAL", "contrib_ilum_publica_municipal"),
        (r"JUROS\s+MORAT", "juros_moratoria"),
        (r"^MULTA", "multa"),
        (r"BENEFICIO\s+TARIFARIO\s+LIQUIDO\s+SCEE", "beneficio_tarifario_liquido_scee"),
    ]

    for padrao, chave in regras:
        if re.search(padrao, nome_norm, re.IGNORECASE):
            return chave

    return slug_json(nome)


def numero_json_ou_none(valor, casas: Optional[int] = None) -> Optional[float]:
    if valor is None:
        return None

    if isinstance(valor, (int, float)):
        numero = float(valor)
    else:
        numero = br_para_float(valor)

    if numero is None:
        return None
    if casas is None:
        return float(numero)
    return round(float(numero), casas)


def extrair_memoria_calculo_fatura(texto: str, texto_unico: str) -> Dict[str, Any]:
    """
    Monta a memória de cálculo do valor final da fatura.

    Mantém a lógica original do programa e amplia a leitura para faturas em que:
    - PARC INJET S/DESC aparece com o complemento na linha de baixo;
    - a tabela vem completa, com PIS/COFINS, ICMS e tarifa unitária;
    - a tabela vem resumida, apenas com quantidade, preço unitário e valor;
    - existem ADC BANDEIRA AMARELA, CONSUMO NÃO COMPENSADO, JUROS MORATÓRIA e MULTA.
    """

    linhas_pdf = [linha.strip() for linha in texto.splitlines() if linha.strip()]
    itens = []

    def adicionar_item(
        nome,
        valor_texto,
        formula_texto=None,
        detalhes=None,
        quantidade_texto=None,
        preco_unitario_com_tributos_texto=None,
        unidade=None,
    ):
        valor_texto = limpar_numero_texto(valor_texto)
        quantidade_texto = limpar_numero_texto(quantidade_texto)
        preco_unitario_com_tributos_texto = limpar_numero_texto(preco_unitario_com_tributos_texto)

        item = {
            "nome": nome,
            "chave": chave_item_fatura(nome),
            "unidade": unidade,
            "quantidade_texto": quantidade_texto,
            "quantidade": br_para_float(quantidade_texto),
            "preco_unitario_com_tributos_texto": preco_unitario_com_tributos_texto,
            "preco_unitario_com_tributos": br_para_float(preco_unitario_com_tributos_texto),
            "valor_texto": valor_texto,
            "valor": br_para_float(valor_texto),
            "formula": formula_texto,
            "detalhes": detalhes or [],
        }

        itens.append(item)
        return item

    def normalizar_busca(valor: str) -> str:
        if valor is None:
            return ""

        valor = str(valor).upper()
        trocas = {
            "Á": "A", "À": "A", "Â": "A", "Ã": "A",
            "É": "E", "Ê": "E",
            "Í": "I",
            "Ó": "O", "Õ": "O", "Ô": "O",
            "Ú": "U",
            "Ç": "C",
        }

        for antigo, novo in trocas.items():
            valor = valor.replace(antigo, novo)

        valor = re.sub(r"\s+", " ", valor).strip()
        return valor

    def regex_sem_acento(padrao_nome_regex: str) -> str:
        if not padrao_nome_regex:
            return ""

        padrao = padrao_nome_regex
        trocas = {
            "N(?:ÃO|AO)": "NAO",
            "NÃO": "NAO",
            "Á": "A", "À": "A", "Â": "A", "Ã": "A",
            "É": "E", "Ê": "E",
            "Í": "I",
            "Ó": "O", "Õ": "O", "Ô": "O",
            "Ú": "U",
            "Ç": "C",
            "P[ÚU]BLICA": "PUBLICA",
            "PÚBLICA": "PUBLICA",
        }

        for antigo, novo in trocas.items():
            padrao = padrao.replace(antigo, novo)

        return padrao

    def montar_bloco_linha(indice: int, quantidade_linhas: int = 6) -> str:
        # Junta linhas seguintes porque em algumas faturas o item fica quebrado.
        # Exemplo:
        # PARC INJET S/DESC - 28,57% - UC 1234567890 - GD
        # II 2                          kWh 288,00 0,175126 50,44
        bloco = " ".join(linhas_pdf[indice:indice + quantidade_linhas])
        bloco = re.sub(r"\s+", " ", bloco).strip()
        return bloco

    def procurar_linha_regex(padrao_nome_regex, quantidade_linhas: int = 6):
        for indice, _linha in enumerate(linhas_pdf):
            bloco = montar_bloco_linha(indice, quantidade_linhas)

            try:
                if re.search(padrao_nome_regex, bloco, re.IGNORECASE):
                    return bloco
            except re.error:
                pass

            bloco_normalizado = normalizar_busca(bloco)
            padrao_normalizado = regex_sem_acento(padrao_nome_regex)

            try:
                if re.search(padrao_normalizado, bloco_normalizado, re.IGNORECASE):
                    return bloco
            except re.error:
                pass

        return None

    def extrair_item_kwh_regex(padrao_nome_regex, nome_exibicao):
        """
        Extrai itens kWh em dois formatos:

        1) Formato completo:
           ITEM kWh qtd preco valor pis/cofins base_icms aliquota% icms tarifa

        2) Formato resumido:
           ITEM kWh qtd preco valor
        """

        linha_item = procurar_linha_regex(padrao_nome_regex, quantidade_linhas=6)

        if not linha_item:
            return None

        padrao_grupo = rf"(?:{padrao_nome_regex})"

        # Primeiro tenta o formato completo, com PIS/COFINS, ICMS e tarifa.
        match = re.search(
            rf"{padrao_grupo}.*?kWh\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)%\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)",
            linha_item,
            re.IGNORECASE,
        )

        if match:
            quantidade = limpar_numero_texto(match.group(1))
            preco_unitario = limpar_numero_texto(match.group(2))
            valor = limpar_numero_texto(match.group(3))
            pis_cofins = limpar_numero_texto(match.group(4))
            base_icms = limpar_numero_texto(match.group(5))
            aliquota_icms = limpar_numero_texto(match.group(6))
            valor_icms = limpar_numero_texto(match.group(7))
            tarifa_unitaria = limpar_numero_texto(match.group(8))

            return adicionar_item(
                nome_exibicao,
                valor,
                f"{quantidade} kWh x R$ {preco_unitario} = R$ {valor}",
                [
                    f"Quantidade: {quantidade} kWh",
                    f"Preço unitário com tributos: R$ {preco_unitario}",
                    f"PIS/COFINS informado: R$ {pis_cofins}",
                    f"Base ICMS: R$ {base_icms}",
                    f"Alíquota ICMS: {aliquota_icms}%",
                    f"ICMS: R$ {base_icms} x {aliquota_icms}% = R$ {valor_icms}",
                    f"Tarifa unitária sem tributos: R$ {tarifa_unitaria}",
                ],
                quantidade_texto=quantidade,
                preco_unitario_com_tributos_texto=preco_unitario,
                unidade="kWh",
            )

        # Fallback com texto normalizado, útil quando o PDF remove acentos.
        linha_normalizada = normalizar_busca(linha_item)
        padrao_normalizado = rf"(?:{regex_sem_acento(padrao_nome_regex)})"

        match = re.search(
            rf"{padrao_normalizado}.*?KWH\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)%\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)",
            linha_normalizada,
            re.IGNORECASE,
        )

        if match:
            quantidade = limpar_numero_texto(match.group(1))
            preco_unitario = limpar_numero_texto(match.group(2))
            valor = limpar_numero_texto(match.group(3))
            pis_cofins = limpar_numero_texto(match.group(4))
            base_icms = limpar_numero_texto(match.group(5))
            aliquota_icms = limpar_numero_texto(match.group(6))
            valor_icms = limpar_numero_texto(match.group(7))
            tarifa_unitaria = limpar_numero_texto(match.group(8))

            return adicionar_item(
                nome_exibicao,
                valor,
                f"{quantidade} kWh x R$ {preco_unitario} = R$ {valor}",
                [
                    f"Quantidade: {quantidade} kWh",
                    f"Preço unitário com tributos: R$ {preco_unitario}",
                    f"PIS/COFINS informado: R$ {pis_cofins}",
                    f"Base ICMS: R$ {base_icms}",
                    f"Alíquota ICMS: {aliquota_icms}%",
                    f"ICMS: R$ {base_icms} x {aliquota_icms}% = R$ {valor_icms}",
                    f"Tarifa unitária sem tributos: R$ {tarifa_unitaria}",
                ],
                quantidade_texto=quantidade,
                preco_unitario_com_tributos_texto=preco_unitario,
                unidade="kWh",
            )

        # Segundo formato: tabela resumida, apenas quantidade, preço e valor.
        match = re.search(
            rf"{padrao_grupo}.*?kWh\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)",
            linha_item,
            re.IGNORECASE,
        )

        if not match:
            match = re.search(
                rf"{padrao_normalizado}.*?KWH\s+"
                r"([-]?[0-9.,]+)\s+"
                r"([-]?[0-9.,]+)\s+"
                r"([-]?[0-9.,]+)",
                linha_normalizada,
                re.IGNORECASE,
            )

        if not match:
            return None

        quantidade = limpar_numero_texto(match.group(1))
        preco_unitario = limpar_numero_texto(match.group(2))
        valor = limpar_numero_texto(match.group(3))

        return adicionar_item(
            nome_exibicao,
            valor,
            f"{quantidade} kWh x R$ {preco_unitario} = R$ {valor}",
            [
                f"Quantidade: {quantidade} kWh",
                f"Preço unitário com tributos: R$ {preco_unitario}",
                "Tabela resumida: a fatura não trouxe PIS/COFINS, base ICMS, alíquota, ICMS e tarifa unitária nessa linha.",
            ],
            quantidade_texto=quantidade,
            preco_unitario_com_tributos_texto=preco_unitario,
            unidade="kWh",
        )

    def extrair_item_parc_injet():
        """
        Extrai PARC INJET S/DESC quando a descrição e os valores estão na mesma linha
        ou quando os valores aparecem na linha de baixo.

        Formatos aceitos:
        - PARC INJET S/DESC ... kWh 285,00 0,175126 49,91 0,175126
        - PARC INJET S/DESC ...
          II 2 kWh 288,00 0,175126 50,44

        Aqui a busca começa exatamente na linha onde aparece PARC INJET, para evitar
        pegar um bloco anterior que mencione PARC INJET apenas nas linhas seguintes.
        """

        padrao_nome_regex = r"PARC\s+INJET\s+S/DESC|PARC\s+INJET"
        linha_item = None

        for indice, linha in enumerate(linhas_pdf):
            linha_normalizada = normalizar_busca(linha)

            encontrou = False
            try:
                encontrou = bool(re.search(padrao_nome_regex, linha, re.IGNORECASE))
            except re.error:
                encontrou = False

            if not encontrou:
                try:
                    encontrou = bool(re.search(r"PARC\s+INJET\s+S/DESC|PARC\s+INJET", linha_normalizada, re.IGNORECASE))
                except re.error:
                    encontrou = False

            if encontrou:
                linha_item = montar_bloco_linha(indice, 8)
                break

        if not linha_item:
            return None

        padrao_grupo = rf"(?:{padrao_nome_regex})"

        match = re.search(
            rf"{padrao_grupo}.*?kWh\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)\s+"
            r"([-]?[0-9.,]+)"
            r"(?:\s+([-]?[0-9.,]+))?",
            linha_item,
            re.IGNORECASE,
        )

        if not match:
            linha_normalizada = normalizar_busca(linha_item)
            match = re.search(
                r"(?:PARC\s+INJET\s+S/DESC|PARC\s+INJET).*?KWH\s+"
                r"([-]?[0-9.,]+)\s+"
                r"([-]?[0-9.,]+)\s+"
                r"([-]?[0-9.,]+)"
                r"(?:\s+([-]?[0-9.,]+))?",
                linha_normalizada,
                re.IGNORECASE,
            )

        if not match:
            return None

        quantidade = limpar_numero_texto(match.group(1))
        preco_unitario = limpar_numero_texto(match.group(2))
        valor = limpar_numero_texto(match.group(3))
        tarifa_unitaria = limpar_numero_texto(match.group(4)) if match.group(4) else None

        detalhes = [
            f"Quantidade: {quantidade} kWh",
            f"Preço unitário: R$ {preco_unitario}",
            "Esse item representa a parcela da energia injetada sem desconto integral.",
            "O programa junta as linhas seguintes para capturar esse item mesmo quando o 'kWh' aparece na linha de baixo.",
        ]

        if tarifa_unitaria:
            detalhes.append(f"Tarifa unitária: R$ {tarifa_unitaria}")

        return adicionar_item(
            "PARC INJET S/DESC",
            valor,
            f"{quantidade} kWh x R$ {preco_unitario} = R$ {valor}",
            detalhes,
            quantidade_texto=quantidade,
            preco_unitario_com_tributos_texto=preco_unitario,
            unidade="kWh",
        )

    def extrair_item_valor_direto_regex(padrao_nome_regex, nome_exibicao, descricao):
        linha_item = procurar_linha_regex(padrao_nome_regex, quantidade_linhas=4)

        if not linha_item:
            return None

        padrao_grupo = rf"(?:{padrao_nome_regex})"

        match = re.search(
            rf"{padrao_grupo}.*?([-]?[0-9]{{1,3}}(?:\.[0-9]{{3}})*,[0-9]{{2}}|[-]?[0-9]+,[0-9]+|[-]?[0-9]+)",
            linha_item,
            re.IGNORECASE,
        )

        if not match:
            linha_normalizada = normalizar_busca(linha_item)
            padrao_normalizado = rf"(?:{regex_sem_acento(padrao_nome_regex)})"
            try:
                match = re.search(
                    rf"{padrao_normalizado}.*?([-]?[0-9]{{1,3}}(?:\.[0-9]{{3}})*,[0-9]{{2}}|[-]?[0-9]+,[0-9]+|[-]?[0-9]+)",
                    linha_normalizada,
                    re.IGNORECASE,
                )
            except re.error:
                match = None

        if not match:
            return None

        valor = limpar_numero_texto(match.group(1))

        return adicionar_item(
            nome_exibicao,
            valor,
            f"Valor lançado na fatura = R$ {valor}",
            [descricao],
        )

    def extrair_item_financeiro_valor_da_linha(padrao_nome_regex, nome_exibicao, descricao):
        """
        Extrai itens financeiros como JUROS MORATÓRIA e MULTA sem misturar
        valores de outras linhas da fatura.

        Exemplos comuns:
        JUROS MORATÓRIA .                  8,00    0,13
        MULTA - 02/2026.                   3,00    0,84

        Regra aplicada:
        - o primeiro número geralmente é informativo, como quantidade de dias,
          percentual ou base;
        - o segundo número é o valor em R$ que entra no total da fatura;
        - o programa NÃO usa mais o último número de um bloco juntado, pois esse
          último valor pode pertencer a outro item da fatura.
        """

        linha_item = None

        for indice, linha in enumerate(linhas_pdf):
            linha_normalizada = normalizar_busca(linha)
            padrao_normalizado = regex_sem_acento(padrao_nome_regex)

            encontrou = False
            try:
                encontrou = bool(re.search(padrao_nome_regex, linha, re.IGNORECASE))
            except re.error:
                encontrou = False

            if not encontrou:
                try:
                    encontrou = bool(re.search(padrao_normalizado, linha_normalizada, re.IGNORECASE))
                except re.error:
                    encontrou = False

            if encontrou:
                # Usa somente a linha física do item. Isso evita pegar valores de
                # BENEFÍCIO TARIFÁRIO LÍQUIDO SCEE ou outros itens logo abaixo.
                linha_item = linha

                # Só usa a próxima linha se a linha atual não tiver nenhum valor decimal.
                # Mesmo assim, mantém a captura limitada ao primeiro trecho útil.
                numeros_teste = re.findall(
                    r"[-]?[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2,6}|[-]?[0-9]+,[0-9]{2,6}",
                    linha_item,
                )

                if not numeros_teste and indice + 1 < len(linhas_pdf):
                    proxima = linhas_pdf[indice + 1]
                    proxima_normalizada = normalizar_busca(proxima)

                    # Evita juntar com uma próxima linha que claramente já é outro item.
                    proxima_parece_outro_item = bool(re.search(
                        r"^(BENEFICIO|BENEF[ÍI]CIO|CONTRIB|CONSUMO|INJECAO|INJE[ÇC][ÃA]O|PARC|ADC|JUROS|MULTA)",
                        proxima_normalizada,
                        re.IGNORECASE,
                    ))

                    if not proxima_parece_outro_item:
                        linha_item = linha_item + " " + proxima

                break

        if not linha_item:
            return None

        # Pega apenas números com vírgula decimal, para não capturar mês/ano como 02/2026.
        numeros = re.findall(r"[-]?[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2,6}|[-]?[0-9]+,[0-9]{2,6}", linha_item)

        if not numeros:
            linha_normalizada = normalizar_busca(linha_item)
            numeros = re.findall(r"[-]?[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2,6}|[-]?[0-9]+,[0-9]{2,6}", linha_normalizada)

        if not numeros:
            return None

        # Regra principal: quando houver dois números, o segundo é o valor em R$.
        # Exemplo: 8,00 dias e 0,13 valor lançado -> usar 0,13.
        if len(numeros) >= 2:
            numero_informativo = limpar_numero_texto(numeros[0])
            valor = limpar_numero_texto(numeros[1])
        else:
            numero_informativo = None
            valor = limpar_numero_texto(numeros[0])

        detalhes = [descricao]
        if numero_informativo:
            detalhes.append(
                f"Número informativo da linha: {numero_informativo}. "
                f"Valor em R$ considerado para o total: {valor}."
            )
        if len(numeros) > 2:
            detalhes.append(
                "A linha possui outros números depois do valor; eles foram ignorados "
                "para evitar somar valores pertencentes a outros itens."
            )

        return adicionar_item(
            nome_exibicao,
            valor,
            f"Valor lançado na fatura = R$ {valor}",
            detalhes,
            quantidade_texto=numero_informativo,
            preco_unitario_com_tributos_texto=None,
            unidade=None,
        )

    # ------------------------------------------------------------------
    # Itens variáveis que podem ou não existir em algumas faturas
    # ------------------------------------------------------------------

    # CONSUMO kWh comum
    # Faturas comuns trazem o item principal como "CONSUMO kWh".
    # O regex evita pegar CONSUMO SCEE e CONSUMO NÃO COMPENSADO.
    extrair_item_kwh_regex(
        r"^CONSUMO(?!\s+(?:SCEE|N(?:ÃO|AO)\s+COMPENSADO))",
        "CONSUMO kWh"
    )

    # ADC BANDEIRA AMARELA
    extrair_item_kwh_regex(
        r"ADC\s+BANDEIRA\s+AMARELA",
        "ADC BANDEIRA AMARELA"
    )

    # CONSUMO NÃO COMPENSADO / CONSUMO NAO COMPENSADO
    extrair_item_kwh_regex(
        r"CONSUMO\s+N(?:ÃO|AO)\s+COMPENSADO",
        "CONSUMO NÃO COMPENSADO"
    )

    # CONSUMO SCEE
    extrair_item_kwh_regex(
        r"CONSUMO\s+SCEE",
        "CONSUMO SCEE"
    )

    # INJEÇÃO SCEE
    extrair_item_kwh_regex(
        r"INJE[ÇC][ÃA]O\s+SCEE|INJECAO\s+SCEE",
        "INJEÇÃO SCEE"
    )

    # BENEFÍCIO TARIFÁRIO BRUTO SCEE
    extrair_item_valor_direto_regex(
        r"BENEF[ÍI]CIO\s+TARIF[ÁA]RIO\s+BRUTO\s+SCEE|BENEFICIO\s+TARIFARIO\s+BRUTO\s+SCEE",
        "BENEFÍCIO TARIFÁRIO BRUTO SCEE",
        "Esse item vem informado diretamente na fatura."
    )

    # PARC INJET S/DESC
    extrair_item_parc_injet()

    # CONTRIBUIÇÃO DE ILUMINAÇÃO PÚBLICA
    extrair_item_valor_direto_regex(
        r"CONTRIB\.\s+ILUM\.\s+P[ÚU]BLICA\s+-\s+MUNICIPAL|CONTRIB\.\s+ILUM\.\s+PUBLICA\s+-\s+MUNICIPAL|CONTRIB\s+ILUM\s+PUBLICA\s+MUNICIPAL",
        "CONTRIB. ILUM. PÚBLICA MUNICIPAL",
        "Esse item é informado diretamente pela fatura."
    )

    # JUROS MORATÓRIA
    extrair_item_financeiro_valor_da_linha(
        r"JUROS\s+MORAT[ÓO]RIA|JUROS\s+MORATORIA",
        "JUROS MORATÓRIA",
        "Esse item financeiro é informado diretamente na fatura."
    )

    # MULTA
    extrair_item_financeiro_valor_da_linha(
        r"MULTA(?:\s*-\s*\d{2}/\d{4})?",
        "MULTA",
        "Esse item financeiro é informado diretamente na fatura."
    )

    # BENEFÍCIO TARIFÁRIO LÍQUIDO SCEE
    extrair_item_valor_direto_regex(
        r"BENEF[ÍI]CIO\s+TARIF[ÁA]RIO\s+L[ÍI]QUIDO\s+SCEE|BENEFICIO\s+TARIFARIO\s+LIQUIDO\s+SCEE",
        "BENEFÍCIO TARIFÁRIO LÍQUIDO SCEE",
        "Esse item vem informado diretamente na fatura."
    )

    total_calculado = sum(item["valor"] for item in itens if item["valor"] is not None)
    datas = extrair_datas_leituras_avancado(texto, texto_unico)
    total_fatura = datas.get("valor_total")
    diferenca = round(total_calculado - total_fatura, 2) if total_fatura is not None else None

    texto_memoria = []
    texto_memoria.append("MEMÓRIA DE CÁLCULO DA FATURA")
    texto_memoria.append("=" * 90)
    texto_memoria.append("")
    texto_memoria.append("DADOS DA FATURA")
    texto_memoria.append("-" * 90)
    texto_memoria.append(f"Referência: {datas.get('referencia')}")
    texto_memoria.append(f"Vencimento: {datas.get('vencimento')}")
    texto_memoria.append(f"Leitura anterior: {datas.get('leitura_anterior')}")
    texto_memoria.append(f"Leitura atual: {datas.get('leitura_atual')}")
    texto_memoria.append(f"Dias de leitura: {datas.get('dias_leitura')}")
    texto_memoria.append(f"Próxima leitura: {datas.get('proxima_leitura')}")
    texto_memoria.append(f"Valor total da fatura: {datas.get('valor_total_texto')}")
    texto_memoria.append("")

    consumo_texto, consumo_valor = extrair_consumo_kwh(texto, texto_unico)
    consumo_scee = extrair_consumo_scee_kwh(texto_unico)

    texto_memoria.append("CONSUMO DA FATURA")
    texto_memoria.append("-" * 90)
    texto_memoria.append(f"Consumo kWh: {consumo_texto}")
    if consumo_scee.get("valor") is not None:
        texto_memoria.append(f"Consumo SCEE kWh: {consumo_scee.get('texto')}")
    else:
        texto_memoria.append("Consumo SCEE kWh: não consta nesta fatura comum")
    texto_memoria.append("")

    texto_memoria.append("ITENS UTILIZADOS PARA CHEGAR NO TOTAL")
    texto_memoria.append("-" * 90)

    if itens:
        for item in itens:
            texto_memoria.append("")
            texto_memoria.append(f"{item['nome']}: {formatar_moeda_br(item['valor'])}")
            texto_memoria.append(f"Cálculo: {item['formula']}")
            for detalhe in item["detalhes"]:
                texto_memoria.append(f"  - {detalhe}")
    else:
        texto_memoria.append("")
        texto_memoria.append("Nenhum item da tabela de faturamento foi identificado.")

    texto_memoria.append("")
    texto_memoria.append("EXPRESSÃO MATEMÁTICA DO TOTAL")
    texto_memoria.append("-" * 90)

    if itens:
        texto_memoria.append("Expressão matemática resumida:")
        texto_memoria.append("")

        mapa_sobrescrito = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")

        def numero_sobrescrito(numero):
            return str(numero).translate(mapa_sobrescrito)

        expressao = ""
        legenda = []
        contador = 1

        for item in itens:
            valor = item.get("valor")
            nome = item.get("nome")

            if valor is None:
                continue

            indice_sobrescrito = numero_sobrescrito(contador)
            sinal = "+" if valor >= 0 else "-"
            tipo = "cobrança / acréscimo" if valor >= 0 else "desconto / abatimento"
            parcela = f"{formatar_numero_br(abs(valor), 2)}{indice_sobrescrito}"

            if expressao == "":
                expressao += f"- {parcela}" if valor < 0 else parcela
            else:
                expressao += f" {sinal} {parcela}"

            legenda.append(f"{indice_sobrescrito} {nome} — {tipo}")
            contador += 1

        expressao += f" = {formatar_numero_br(total_calculado, 2)}"
        texto_memoria.append(expressao)
        texto_memoria.append("")
        texto_memoria.append("Legenda:")
        texto_memoria.append("-" * 90)

        for linha_legenda in legenda:
            texto_memoria.append(linha_legenda)

    texto_memoria.append("")
    texto_memoria.append(f"Total calculado pelos itens: {formatar_moeda_br(total_calculado)}")

    if total_fatura is not None:
        texto_memoria.append(f"Total informado na fatura: {formatar_moeda_br(total_fatura)}")
        texto_memoria.append(f"Diferença: {formatar_moeda_br(diferenca)}")

    return {
        "datas": datas,
        "consumo_kwh": {"texto": consumo_texto, "valor": consumo_valor},
        "consumo_scee": consumo_scee,
        "itens": itens,
        "total_calculado": total_calculado,
        "total_fatura": total_fatura,
        "diferenca": diferenca,
        "texto_memoria": "\n".join(texto_memoria),
    }


def extrair_tarifas_da_memoria(itens: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Extrai somente a tarifa kWh com tributos da linha principal de consumo.

    Não calcula preço médio da fatura e não exporta tarifa sem tributos, porque
    esses campos confundem quando o objetivo é reproduzir apenas o que aparece
    diretamente na conta.
    """
    resultado = {
        "tarifa_kwh_com_tributos_texto": None,
        "tarifa_kwh_com_tributos": None,
        "tarifa_origem": None,
    }

    def pegar_numero(texto: Optional[str]) -> Tuple[Optional[str], Optional[float]]:
        if not texto:
            return None, None
        match = re.search(
            r"([-]?[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2,6}|[-]?[0-9]+,[0-9]{2,6}|[-]?[0-9]+\.[0-9]{2,6})",
            str(texto),
        )
        if not match:
            return None, None
        valor_texto = limpar_numero_texto(match.group(1))
        return valor_texto, br_para_float(valor_texto)

    def texto_detalhe(item: Dict[str, Any], padrao: str) -> Tuple[Optional[str], Optional[float]]:
        for detalhe in item.get("detalhes") or []:
            if re.search(padrao, str(detalhe), re.IGNORECASE):
                return pegar_numero(detalhe)
        return None, None

    def preco_formula(item: Dict[str, Any]) -> Tuple[Optional[str], Optional[float]]:
        formula = str(item.get("formula") or "")
        match = re.search(
            r"x\s*R\$\s*([-]?[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2,6}|[-]?[0-9]+,[0-9]{2,6}|[-]?[0-9]+\.[0-9]{2,6})",
            formula,
            re.IGNORECASE,
        )
        if not match:
            return None, None
        valor_texto = limpar_numero_texto(match.group(1))
        return valor_texto, br_para_float(valor_texto)

    def prioridade(item: Dict[str, Any]) -> int:
        nome_norm = texto_sem_acentos_busca(item.get("nome"))

        # Usa somente itens de consumo como fonte da tarifa principal.
        # Não usa PARC INJET, ADC BANDEIRA, JUROS, MULTA ou iluminação pública.
        if re.search(r"^CONSUMO\s+KWH$", nome_norm, re.IGNORECASE):
            return 100
        if re.search(r"CONSUMO\s+SCEE", nome_norm, re.IGNORECASE):
            return 90
        if re.search(r"CONSUMO\s+NAO\s+COMPENSADO", nome_norm, re.IGNORECASE):
            return 80
        return 0

    candidatos = []

    for item in itens or []:
        score = prioridade(item)
        if score <= 0:
            continue

        com_texto, com_valor = texto_detalhe(item, r"Preço\s+unit[áa]rio\s+com\s+tributos")
        if com_valor is None:
            com_texto, com_valor = preco_formula(item)

        if com_valor is None:
            continue

        candidatos.append({
            "score": score,
            "nome": item.get("nome"),
            "com_texto": com_texto,
            "com_valor": com_valor,
        })

    if not candidatos:
        return resultado

    candidatos.sort(key=lambda item: item["score"], reverse=True)
    escolhido = candidatos[0]

    resultado["tarifa_kwh_com_tributos_texto"] = escolhido.get("com_texto")
    resultado["tarifa_kwh_com_tributos"] = escolhido.get("com_valor")
    resultado["tarifa_origem"] = escolhido.get("nome")

    return resultado


def itens_fatura_vazios() -> Dict[str, Dict[str, Any]]:
    return {}


def extrair_itens_fatura_para_json(itens: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Monta os itens da fatura relacionando cada linha com as colunas da tabela:
    - quantidade;
    - preço unitário com tributos;
    - valor em R$.

    Exemplo:
      ADC BANDEIRA AMARELA | kWh | 245,00 | 0,001584 | 0,39

    vira:
      "adc_bandeira_amarela": {
        "nome": "ADC BANDEIRA AMARELA",
        "unidade": "kWh",
        "quantidade": 245.0,
        "preco_unitario_com_tributos": 0.001584,
        "valor": 0.39
      }
    """
    resultado: Dict[str, Dict[str, Any]] = {}

    for item in itens or []:
        nome = str(item.get("nome") or "").strip()
        if not nome:
            continue

        chave_base = item.get("chave") or chave_item_fatura(nome)
        chave = chave_base
        contador = 2
        while chave in resultado:
            chave = f"{chave_base}_{contador}"
            contador += 1

        resultado[chave] = {
            "nome": nome,
            "unidade": item.get("unidade"),
            "quantidade": numero_json_ou_none(item.get("quantidade"), 6),
            "preco_unitario_com_tributos": numero_json_ou_none(item.get("preco_unitario_com_tributos"), 6),
            "valor": moeda_ou_none(item.get("valor")),
        }

    return resultado


def mapas_colunas_itens_fatura(itens_fatura: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Optional[float]]]:
    """Cria mapas por coluna, mantendo a relação pelo nome/chave da linha."""
    tarifas: Dict[str, Optional[float]] = {}
    quantidades: Dict[str, Optional[float]] = {}
    valores: Dict[str, Optional[float]] = {}

    for chave, item in (itens_fatura or {}).items():
        if not isinstance(item, dict):
            continue
        tarifas[chave] = item.get("preco_unitario_com_tributos")
        quantidades[chave] = item.get("quantidade")
        valores[chave] = item.get("valor")

    return {
        "tarifas": tarifas,
        "quantidades": quantidades,
        "valores": valores,
    }


def valor_item_fatura(itens_fatura: Dict[str, Dict[str, Any]], chave: str) -> Optional[float]:
    item = (itens_fatura or {}).get(chave)
    if isinstance(item, dict):
        return item.get("valor")
    return None


def calcular_preco_medio_fatura(valor_total: Optional[float], consumo_kwh: Optional[float]) -> Tuple[Optional[str], Optional[float]]:
    """Calcula valor_total / consumo_kwh como referência geral da fatura."""
    try:
        valor = float(valor_total)
        consumo = float(consumo_kwh)
        if consumo <= 0:
            return None, None
        preco = valor / consumo
        return formatar_numero_br(preco, 6), round(preco, 6)
    except Exception:
        return None, None


def extrair_scee(resultado: ResultadoSCEE, texto_unico: str) -> ResultadoSCEE:
    bloco = extrair_bloco_scee(texto_unico)
    if not bloco:
        # Fatura comum não tem bloco SCEE. Não gera alerta nesses casos.
        if texto_tem_scee(texto_unico):
            resultado.alertas.append("Não encontrei o bloco 'INFORMAÇÕES DO SCEE' em Mensagens Importantes.")
        return resultado

    resultado.mensagem_scee = bloco

    match = re.search(r"GERA[ÇC][ÃA]O\s+CICLO\s*\(([^)]+)\)\s*KWH\s*:\s*UC\s*([0-9]{5,20})\s*:\s*([0-9.,]+)", bloco, re.IGNORECASE)
    if match:
        resultado.scee_ciclo = match.group(1).strip()
        resultado.scee_uc_geracao = formatar_uc(match.group(2))
        valor_texto = limpar_numero_texto(match.group(3))
        resultado.scee_geracao_ciclo_kwh_texto = valor_texto
        resultado.scee_geracao_ciclo_kwh = numero_br_para_float(valor_texto)

    match = re.search(r"EXCEDENTE\s+RECEBIDO\s+KWH\s*:\s*UC\s*([0-9]{5,20})\s*:\s*([0-9.,]+)", bloco, re.IGNORECASE)
    if match:
        resultado.scee_uc_excedente_recebido = formatar_uc(match.group(1))
        valor_texto = limpar_numero_texto(match.group(2))
        resultado.scee_excedente_recebido_kwh_texto = valor_texto
        resultado.scee_excedente_recebido_kwh = numero_br_para_float(valor_texto)

    match = re.search(r"CR[ÉE]DITO\s+RECEBIDO\s+KWH\s*[:\-]?\s*([0-9.,]+)", bloco, re.IGNORECASE)
    if match:
        valor_texto = limpar_numero_texto(match.group(1))
        resultado.scee_credito_recebido_kwh_texto = valor_texto
        resultado.scee_credito_recebido_kwh = numero_br_para_float(valor_texto)

    match = re.search(r"(?:^|[,;]\s*)SALDO\s+KWH\s*[:\-]?\s*([0-9.,]+)", bloco, re.IGNORECASE)
    if match:
        valor_texto = limpar_numero_texto(match.group(1))
        resultado.scee_saldo_kwh_texto = valor_texto
        resultado.scee_saldo_kwh = numero_br_para_float(valor_texto)

    match = re.search(r"SALDO\s+A\s+EXPIRAR\s+EM\s+30\s+DIAS\s+KWH\s*[:\-]?\s*([0-9.,]+)", bloco, re.IGNORECASE)
    if match:
        valor_texto = limpar_numero_texto(match.group(1))
        resultado.scee_saldo_expirar_30_dias_kwh_texto = valor_texto
        resultado.scee_saldo_expirar_30_dias_kwh = numero_br_para_float(valor_texto)

    match = re.search(r"SALDO\s+A\s+EXPIRAR\s+EM\s+60\s+DIAS\s+KWH\s*[:\-]?\s*([0-9.,]+)", bloco, re.IGNORECASE)
    if match:
        valor_texto = limpar_numero_texto(match.group(1))
        resultado.scee_saldo_expirar_60_dias_kwh_texto = valor_texto
        resultado.scee_saldo_expirar_60_dias_kwh = numero_br_para_float(valor_texto)

    match = re.search(r"CADASTRO\s+RATEIO\s+GERA[ÇC][ÃA]O\s*:\s*UC\s*([0-9]{5,20})\s*=\s*([0-9.,]+)\s*%", bloco, re.IGNORECASE)
    if match:
        resultado.scee_rateio_uc = formatar_uc(match.group(1))
        valor_texto = limpar_numero_texto(match.group(2))
        resultado.scee_rateio_percentual_texto = valor_texto
        resultado.scee_rateio_percentual = numero_br_para_float(valor_texto)

    return resultado



def texto_tem_scee(texto_unico: Optional[str]) -> bool:
    """Retorna True apenas quando o texto indica que a fatura possui SCEE/solar."""
    if not texto_unico:
        return False
    texto_norm = texto_sem_acentos_busca(texto_unico)
    return bool(re.search(
        r"\bSCEE\b|INFORMACOES\s+DO\s+SCEE|INJECAO\s+SCEE|CONSUMO\s+SCEE|"
        r"GERACAO\s+CICLO|EXCEDENTE\s+RECEBIDO|CREDITO\s+RECEBIDO\s+KWH|"
        r"CADASTRO\s+RATEIO\s+GERACAO",
        texto_norm,
        re.IGNORECASE,
    ))


def resultado_tem_scee(resultado: ResultadoSCEE) -> bool:
    """Retorna True quando algum campo SCEE foi realmente encontrado."""
    return any([
        bool(resultado.mensagem_scee),
        resultado.consumo_scee_kwh is not None,
        resultado.scee_geracao_ciclo_kwh is not None,
        resultado.scee_excedente_recebido_kwh is not None,
        resultado.scee_credito_recebido_kwh is not None,
        resultado.scee_saldo_kwh is not None,
        resultado.scee_rateio_percentual is not None,
    ])



def reconciliar_consumo_total_scee(
    resultado: ResultadoSCEE,
    texto_unico: str,
) -> ResultadoSCEE:
    """
    Confere e corrige o consumo total de faturas SCEE.

    Prioridade das fontes:
    1) quantidades estruturadas dos itens da fatura;
    2) extração direta das linhas CONSUMO NÃO COMPENSADO e CONSUMO SCEE.

    Comportamento:
    - as duas parcelas encontradas: soma e mantém status normal;
    - somente uma parcela encontrada: usa a parcela como total provisório e gera alerta;
    - nenhuma parcela encontrada em uma fatura SCEE: mantém o fallback já extraído e
      gera alerta para revisão manual.
    """

    if not (texto_tem_scee(texto_unico) or resultado_tem_scee(resultado)):
        return resultado

    itens = resultado.itens_fatura or {}
    item_nao_compensado = itens.get("consumo_nao_compensado") or {}
    item_scee = itens.get("consumo_scee") or {}

    quantidade_nao_compensada = numero_json_ou_none(
        item_nao_compensado.get("quantidade"),
        6,
    )
    quantidade_scee = numero_json_ou_none(
        item_scee.get("quantidade"),
        6,
    )

    # Usa extração direta como fallback quando a memória de cálculo não conseguiu
    # estruturar a linha da tabela.
    if quantidade_nao_compensada is None:
        direto_nao_compensado = extrair_consumo_nao_compensado_kwh(texto_unico)
        quantidade_nao_compensada = direto_nao_compensado.get("valor")

    if quantidade_scee is None:
        quantidade_scee = resultado.consumo_scee_kwh
        if quantidade_scee is None:
            direto_scee = extrair_consumo_scee_kwh(texto_unico)
            quantidade_scee = direto_scee.get("valor")

    if quantidade_scee is not None:
        resultado.consumo_scee_kwh = round(float(quantidade_scee), 6)
        resultado.consumo_scee_kwh_texto = formatar_numero_br(
            resultado.consumo_scee_kwh,
            2,
        )

    if quantidade_nao_compensada is not None and quantidade_scee is not None:
        consumo_total = round(
            float(quantidade_nao_compensada) + float(quantidade_scee),
            6,
        )
        resultado.consumo_kwh = consumo_total
        resultado.consumo_kwh_texto = formatar_numero_br(consumo_total, 2)
        return resultado

    if quantidade_scee is not None:
        consumo_total = round(float(quantidade_scee), 6)
        resultado.consumo_kwh = consumo_total
        resultado.consumo_kwh_texto = formatar_numero_br(consumo_total, 2)
        mensagem = (
            "Consumo não compensado não encontrado. "
            "O consumo total foi assumido como igual ao Consumo SCEE; revise a fatura."
        )
        if mensagem not in resultado.alertas:
            resultado.alertas.append(mensagem)
        return resultado

    if quantidade_nao_compensada is not None:
        consumo_total = round(float(quantidade_nao_compensada), 6)
        resultado.consumo_kwh = consumo_total
        resultado.consumo_kwh_texto = formatar_numero_br(consumo_total, 2)
        mensagem = (
            "Consumo SCEE não encontrado. "
            "O consumo total foi assumido como igual ao consumo não compensado; revise a fatura."
        )
        if mensagem not in resultado.alertas:
            resultado.alertas.append(mensagem)
        return resultado

    mensagem = (
        "Fatura com indícios de SCEE, mas as parcelas Consumo SCEE e "
        "Consumo não compensado não foram encontradas. O consumo total veio de fallback."
    )
    if mensagem not in resultado.alertas:
        resultado.alertas.append(mensagem)

    return resultado


def validar_resultado(resultado: ResultadoSCEE) -> ResultadoSCEE:
    # Só valida campos SCEE quando a fatura realmente possui SCEE.
    # Assim, fatura comum não gera alerta por ausência de mensagem/saldo/crédito SCEE.
    if resultado_tem_scee(resultado):
        if not resultado.mensagem_scee:
            resultado.alertas.append("Mensagem SCEE não encontrada.")
        if resultado.scee_saldo_kwh is None:
            resultado.alertas.append("Saldo kWh não encontrado.")
        if resultado.scee_excedente_recebido_kwh is None:
            resultado.alertas.append("Excedente recebido kWh não encontrado.")
        if resultado.scee_credito_recebido_kwh is None:
            resultado.alertas.append("Crédito recebido kWh não encontrado.")

    if resultado.consumo_kwh is None:
        resultado.alertas.append("Consumo kWh não encontrado.")

    if resultado.memoria_calculo_texto is None:
        resultado.alertas.append("Memória de cálculo não gerada.")
    if resultado.alertas:
        resultado.status = "COM ALERTA"
    return resultado


def processar_pdf(caminho_pdf: str) -> ResultadoSCEE:
    resultado = ResultadoSCEE(arquivo=str(caminho_pdf))
    try:
        texto = extrair_texto_pdf(caminho_pdf)
        texto_unico = texto_linha_unica(texto)
        if not texto_unico:
            resultado.status = "ERRO"
            resultado.alertas.append("PDF sem texto extraível. Pode ser PDF escaneado/imagem. Esse programa não usa OCR.")
            return resultado

        resultado.distribuidora = extrair_distribuidora(texto_unico)
        # Dados pessoais não são coletados nesta versão.
        resultado.unidade_consumidora_fatura = extrair_unidade_consumidora_fatura(texto_unico)
        if not resultado.unidade_consumidora_fatura:
            resultado.unidade_consumidora_fatura = extrair_unidade_consumidora_fatura_pdf(caminho_pdf)
        resultado.referencia = extrair_referencia(texto_unico)
        resultado.tipo_faturamento = extrair_tipo_faturamento_pdf(caminho_pdf)
        resultado.vencimento = extrair_vencimento(texto_unico)

        valor_texto, valor_float = extrair_valor_total(texto_unico)
        resultado.valor_total_texto = valor_texto
        resultado.valor_total = valor_float

        consumo_texto, consumo_float = extrair_consumo_kwh(texto, texto_unico)
        resultado.consumo_kwh_texto = consumo_texto
        resultado.consumo_kwh = consumo_float

        datas = extrair_datas_leituras_avancado(texto, texto_unico)
        if datas.get("referencia"):
            resultado.referencia = datas.get("referencia")
        if datas.get("vencimento"):
            resultado.vencimento = datas.get("vencimento")
            resultado.vencimento_corrigido = datas.get("vencimento")
        if datas.get("valor_total_texto"):
            resultado.valor_total_texto = datas.get("valor_total_texto")
            resultado.valor_total = datas.get("valor_total")
        resultado.leitura_anterior = datas.get("leitura_anterior")
        resultado.leitura_atual = datas.get("leitura_atual")
        resultado.dias_leitura = datas.get("dias_leitura")
        resultado.proxima_leitura = datas.get("proxima_leitura")

        consumo_scee = extrair_consumo_scee_kwh(texto_unico)
        resultado.consumo_scee_kwh_texto = consumo_scee.get("texto")
        resultado.consumo_scee_kwh = consumo_scee.get("valor")

        leituras_medidor = extrair_leituras_medidor_fisico(texto, texto_unico)
        resultado.leituras_medidor_texto = leituras_medidor.get("texto")

        leitura_ativa = leituras_medidor.get("ativa")
        if leitura_ativa:
            resultado.medidor_fisico_ativa = leitura_ativa.get("medidor")
            resultado.leitura_medidor_ativa_anterior = leitura_ativa.get("leitura_anterior")
            resultado.leitura_medidor_ativa_atual = leitura_ativa.get("leitura_atual")
            resultado.constante_medidor_ativa = leitura_ativa.get("constante_medidor")
            resultado.consumo_medidor_ativa_kwh_texto = leitura_ativa.get("consumo_kwh_texto")
            resultado.consumo_medidor_ativa_kwh = leitura_ativa.get("consumo_kwh")

        leitura_geracao = leituras_medidor.get("geracao")
        if leitura_geracao:
            resultado.medidor_fisico_geracao = leitura_geracao.get("medidor")
            resultado.leitura_medidor_geracao_anterior = leitura_geracao.get("leitura_anterior")
            resultado.leitura_medidor_geracao_atual = leitura_geracao.get("leitura_atual")
            resultado.constante_medidor_geracao = leitura_geracao.get("constante_medidor")
            resultado.consumo_medidor_geracao_kwh_texto = leitura_geracao.get("consumo_kwh_texto")
            resultado.consumo_medidor_geracao_kwh = leitura_geracao.get("consumo_kwh")

        resultado = extrair_scee(resultado, texto_unico)

        memoria = extrair_memoria_calculo_fatura(texto, texto_unico)
        resultado.memoria_calculo_texto = memoria.get("texto_memoria")
        resultado.total_calculado_itens = memoria.get("total_calculado")
        resultado.diferenca_total_calculado = memoria.get("diferenca")

        itens_memoria = memoria.get("itens") or []
        tarifas = extrair_tarifas_da_memoria(itens_memoria)
        resultado.tarifa_kwh_com_tributos_texto = tarifas.get("tarifa_kwh_com_tributos_texto")
        resultado.tarifa_kwh_com_tributos = tarifas.get("tarifa_kwh_com_tributos")
        resultado.tarifa_origem = tarifas.get("tarifa_origem")
        resultado.itens_fatura = extrair_itens_fatura_para_json(itens_memoria)

        # Corrige/confere o consumo total das faturas SCEE usando as linhas
        # estruturadas da própria fatura.
        resultado = reconciliar_consumo_total_scee(resultado, texto_unico)

        return validar_resultado(resultado)
    except Exception as erro:
        resultado.status = "ERRO"
        resultado.alertas.append(str(erro))
        resultado.alertas.append(traceback.format_exc())
        return resultado


def moeda_ou_none(valor) -> Optional[float]:
    if valor is None:
        return None
    try:
        return round(float(valor), 2)
    except Exception:
        return None
