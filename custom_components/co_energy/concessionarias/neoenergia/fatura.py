"""Leitor das faturas do grupo Neoenergia (DANFE da NF3e).

Escrito sobre faturas reais da Neoenergia Distribuição Brasília, de consumidor
B1 residencial sem geração, em dois formatos: o de janeiro de 2026, com a
energia numa linha só ("Consumo"), e o de setembro, com TUSD e TE separadas.
A saída é o documento "schema 6" comum a todas as concessionárias, montado em
`concessionarias/comum.py`.

O que é próprio da Neoenergia, e por isso vive aqui:

- colunas do item na ordem quantidade, preço com tributos, valor, PIS/COFINS,
  base do ICMS, alíquota, ICMS e, por último, a tarifa sem tributos;
- o valor da conta vem na linha "TOTAL". O "TOTAL A PAGAR" pode vir zerado
  (débito automático, conta já quitada) e não é o valor da fatura;
- o número da UC e o da nota fiscal ficam numa área em que o PDF sobrepõe
  dois textos, e a extração normal embaralha as letras. Eles são lidos
  recortando a página logo abaixo do rótulo. O rótulo mudou com a nova
  numeração da ANEEL (REN 1095/24): "CÓDIGO DA INSTALAÇÃO" nas faturas antigas,
  "NÚMERO DA UNIDADE CONSUMIDORA" nas novas.

Fatura com geração ou compensação (SCEE) é recusada: não havia nenhuma para
conferir o layout.
"""

from __future__ import annotations

from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Tuple

from ...equatorial_adapter import uc_digits
from .. import comum
from ..comum import NUM, base

VERSAO = "neoenergia-1"

#: CNPJ -> nome curto. Só entra CNPJ conferido numa fatura real.
NOMES_POR_CNPJ = {
    "07522669000192": "Neoenergia Brasília",
}

_ROTULO_UC = r"N\S{0,2}MERO DA UNIDADE CONSUMIDORA|C\S{0,2}DIGO DA INSTALA\S{0,3}O"


class LeitorNeoenergiaError(ValueError):
    """A fatura é da Neoenergia, mas não pode ser lida por este leitor."""


def reconhece(texto: str) -> bool:
    """Se o texto é de uma fatura do grupo Neoenergia."""
    if "NEOENERGIA" in base.sem_acentos(texto):
        return True
    return any(cnpj in re.sub(r"\D", "", texto) for cnpj in NOMES_POR_CNPJ)


def _distribuidora(texto: str) -> str:
    cnpj = re.search(r"CNPJ\s*([0-9./-]{14,18})", texto)
    digitos = re.sub(r"\D", "", cnpj.group(1)) if cnpj else ""
    if digitos in NOMES_POR_CNPJ:
        return NOMES_POR_CNPJ[digitos]
    nome = re.search(r"^(NEOENERGIA [^\n]+?)(?:\s+S\.?A\.?)?$", texto, re.MULTILINE)
    return nome.group(1).strip().title() if nome else "Neoenergia"


def _uc_e_nota(caminho: Path) -> Tuple[Optional[str], Optional[re.Match]]:
    """UC e nota fiscal, lidos só na faixa abaixo do rótulo da UC.

    Recortar a página separa o texto sobreposto: dentro da faixa, as duas
    linhas saem limpas.
    """
    with base._pdfplumber().open(caminho) as pdf:
        pagina = pdf.pages[0]
        achados = pagina.search(_ROTULO_UC, regex=True, case=False)
        if not achados:
            return None, None
        rotulo = achados[0]
        faixa = pagina.crop((
            max(0, rotulo["x0"] - 80), max(0, rotulo["top"] - 2),
            pagina.width, min(pagina.height, rotulo["bottom"] + 30),
        ))
        texto = faixa.extract_text() or ""
    linhas = [linha.strip() for linha in texto.split("\n") if linha.strip()]
    numero = None
    for linha in linhas[1:]:
        m = re.match(r"(\d[\d.\-]{3,})\b", linha)
        if m:
            numero = m.group(1)
            break
    nota = re.search(
        r"NOTA FISCAL N\S{0,2}\s*([0-9]+)\s*-\s*S\S{0,2}RIE\s*([0-9]+)\s*/\s*DATA DE EMISS\S{0,2}O:\s*(\d{2}/\d{2}/\d{2,4})",
        texto,
    )
    return numero, nota


def _itens(texto: str, alertas: List[str]) -> List[Dict[str, Any]]:
    energia = re.compile(
        rf"^(Consumo(?:-TUSD|-TE)?)\s+kWh\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+"
        rf"({NUM})\s+({NUM})\s+({NUM})\s+({NUM})",
        re.MULTILINE,
    )
    partes = []
    nomes = []
    for m in energia.finditer(texto):
        nome, qtd, com, valor, pis_cofins, base_icms, aliq, icms, sem = m.groups()
        nomes.append(nome)
        partes.append({
            "quantidade": comum.decimal(qtd), "sem": comum.decimal(sem),
            "com": comum.decimal(com), "valor": comum.decimal(valor),
            "base_icms": comum.decimal(base_icms), "aliq": comum.decimal(aliq),
            "icms": comum.decimal(icms), "pis_cofins": comum.decimal(pis_cofins),
        })
    itens: List[Dict[str, Any]] = []
    if nomes in (["Consumo"], ["Consumo-TUSD", "Consumo-TE"], ["Consumo-TE", "Consumo-TUSD"]):
        itens.append(comum.item_consumo(partes, alertas))
    elif partes:
        alertas.append("Linhas de consumo em formato não reconhecido.")

    bandeira = re.compile(
        rf"^Acr\S*s\.\s*Band\.\s*([A-Za-zÇÃÉçãé]+(?:\s+P\d)?)\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})",
        re.MULTILINE,
    )
    for m in bandeira.finditer(texto):
        cor, valor, pis_cofins, base_icms, aliq, icms = m.groups()
        cor = base.sem_acentos(cor).strip()
        itens.append(comum.item_sem_tarifa(
            f"adc_bandeira_{cor.lower().replace(' ', '_')}",
            f"ADICIONAL DE BANDEIRA {cor.upper()}", "bandeira_tarifaria", valor,
            pis_cofins=pis_cofins, base_icms=base_icms, aliq=aliq, icms=icms,
        ))

    ilum = re.search(
        rf"^(?:Ilum\S*\s+P\S*b\S*[^\d\n]*|Contrib\S*\s*I\.?\s*P\S*blica[^\d\n]*)\s({NUM})\b",
        texto, re.MULTILINE | re.IGNORECASE,
    )
    if ilum:
        itens.append(comum.item_sem_tarifa(
            "contrib_ilum_publica_municipal", "CONTRIB. ILUMINACAO PUBLICA",
            "cip_cosip", ilum.group(1),
        ))
    return itens


def ler(caminho: Path) -> Tuple[Dict[str, Any], Optional[str]]:
    """Lê uma fatura da Neoenergia; devolve a fatura schema 6 e o número da UC."""
    paginas_texto, texto = base.ler_pdf(caminho)
    if comum.tem_compensacao(texto):
        raise LeitorNeoenergiaError("neoenergia compensation not supported")

    ref = re.search(
        rf"REF:M\S{{1,3}}S/ANO[^\n]*\n\s*(\d{{2}})/(\d{{4}})\s+({NUM})\s+(\d{{2}}/\d{{2}}/\d{{4}})",
        texto,
    )
    datas = re.search(
        r"LEITURA ANTERIOR\s+(\d{2}/\d{2}/\d{4})\s+LEITURA ATUAL\s+(\d{2}/\d{2}/\d{4})\s+"
        r"N\S{1,2} DE DIAS\s+(\d{1,3})\s+PR\S{1,3}XIMA LEITURA\s+(\d{2}/\d{2}/\d{4})",
        texto,
    )
    total = re.search(rf"^TOTAL\s+({NUM})\b", texto, re.MULTILINE)
    numero_uc, nota = _uc_e_nota(caminho)
    competencia = comum.competencia(ref.group(1), ref.group(2)) if ref else None

    alertas: List[str] = []
    if numero_uc is None:
        alertas.append("Número da UC não encontrado.")
    itens = _itens(texto, alertas)

    medicoes = []
    medido = re.search(
        rf"^(\d{{5,15}})\s+Energia Ativa\s+\S+\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})",
        texto, re.MULTILINE,
    )
    if medido:
        medicoes.append(comum.medicao(*medido.groups()))

    classificacao = re.search(
        r"CLASSIFICA\S{1,4}O:\s*(\S+)\s+([^\n]+?)\s+TIPO DE FORNECIMENTO:\s*([^\n]+)", texto,
    )
    ligacao = None
    if classificacao:
        tipo = base.sem_acentos(classificacao.group(3)).lower()
        ligacao = next((t for t in ("trifasico", "bifasico", "monofasico") if t in tipo), None)
    fornecimento = {
        "classe": classificacao.group(2).split("-")[0].strip().title() if classificacao else None,
        "subclasse": None,
        "grupo": classificacao.group(1)[:1] if classificacao else None,
        "subgrupo": classificacao.group(1) if classificacao else None,
        "modalidade": "Convencional" if classificacao and "CONV" in classificacao.group(3).upper() else None,
        "tipo_ligacao": ligacao,
        "tensao_nominal_v": None, "tensao_minima_v": None, "tensao_maxima_v": None,
        "perdas_percentual": None,
        "area_concessao": _distribuidora(texto),
        "modalidade_compensacao": None,
    }

    meses = [
        (comum.competencia(mes, ano), kwh, dias)
        for mes, ano, kwh, dias in re.findall(
            r"\b(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)(\d{2})\s+(\d{1,5})\s+(\d{1,2})\b",
            texto,
        )
    ]

    fatura = comum.montar_fatura(
        caminho, len(paginas_texto), texto,
        competencia_iso=competencia,
        numero_fatura=nota.group(1) if nota else None,
        serie=nota.group(2) if nota else None,
        data_emissao=nota.group(3) if nota and len(nota.group(3)) == 10 else None,
        distribuidora=_distribuidora(texto),
        numero_uc=numero_uc,
        inicio=datas.group(1) if datas else None,
        fim=datas.group(2) if datas else None,
        dias=int(datas.group(3)) if datas else None,
        proxima_leitura=datas.group(4) if datas else None,
        vencimento=ref.group(4) if ref else None,
        total=comum.decimal(total.group(1)) if total else None,
        itens=itens,
        tributos_fatura=comum.tributos(texto),
        medicoes=medicoes,
        fornecimento=fornecimento,
        historico_consumo=comum.historico(meses, competencia),
        alertas=alertas,
        layout="neoenergia_danfe",
        versao=VERSAO,
    )
    return fatura, uc_digits(numero_uc) if numero_uc else None
