"""Leitor das faturas do grupo CPFL (DANF3E).

Escrito sobre faturas reais da CPFL Piratininga, de consumidor B1 residencial
sem geração. A saída é o documento "schema 6" comum a todas as concessionárias
(`docs/contrato-extrator.md`), montado em `concessionarias/comum.py`.

O que é próprio da CPFL, e por isso vive aqui:

- a energia vem em DUAS linhas, TUSD e TE, com as colunas na ordem quantidade,
  tarifa sem tributos, tarifa com tributos, valor;
- PIS e COFINS vêm como alíquotas soltas ao lado do número da UC;
- parte do gráfico de histórico sai com o rótulo na vertical, e esses meses
  ficam de fora em vez de adivinhados.

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

VERSAO = "cpfl-1"

#: CNPJ -> nome curto. Só entra CNPJ conferido numa fatura real; as outras
#: distribuidoras do grupo usam o nome impresso no cabeçalho.
NOMES_POR_CNPJ = {
    "04172213000151": "CPFL Piratininga",
}


class LeitorCpflError(ValueError):
    """A fatura é da CPFL, mas não pode ser lida por este leitor."""


def reconhece(texto: str) -> bool:
    """Se o texto é de uma fatura do grupo CPFL."""
    if "CPFL" in base.sem_acentos(texto):
        return True
    return any(cnpj in re.sub(r"\D", "", texto) for cnpj in NOMES_POR_CNPJ)


def _distribuidora(texto: str) -> Optional[str]:
    cnpj = re.search(r"CNPJ:\s*([0-9./-]+)", texto)
    digitos = re.sub(r"\D", "", cnpj.group(1)) if cnpj else ""
    if digitos in NOMES_POR_CNPJ:
        return NOMES_POR_CNPJ[digitos]
    nome = re.search(r"^(COMPANHIA [^\n]+|CPFL [^\n]+|RGE [^\n]+)$", texto, re.MULTILINE)
    return nome.group(1).strip().title() if nome else "CPFL"


def _itens(texto: str, alertas: List[str]) -> List[Dict[str, Any]]:
    energia = re.compile(
        rf"^(Consumo Uso Sistema \[KWh\]-TUSD|Consumo - TE)\s+[A-Z]{{3}}/\d{{2}}\s+kWh\s+"
        rf"({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})",
        re.MULTILINE,
    )
    partes = []
    for m in energia.finditer(texto):
        _nome, qtd, sem, com, valor, base_icms, aliq, icms, pis, cofins = m.groups()
        partes.append({
            "quantidade": comum.decimal(qtd), "sem": comum.decimal(sem),
            "com": comum.decimal(com), "valor": comum.decimal(valor),
            "base_icms": comum.decimal(base_icms), "aliq": comum.decimal(aliq),
            "icms": comum.decimal(icms),
            "pis_cofins": (comum.decimal(pis) or 0) + (comum.decimal(cofins) or 0),
        })
    itens: List[Dict[str, Any]] = []
    if len(partes) == 2:
        itens.append(comum.item_consumo(partes, alertas))
    elif partes:
        alertas.append("Linhas de TUSD e TE incompletas.")

    bandeira = re.compile(
        rf"^Adicional de Bandeira ([A-Za-zçãé]+(?: P\d)?)\s+[A-Z]{{3}}/\d{{2}}\s+kWh\s+"
        rf"({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})",
        re.MULTILINE,
    )
    for m in bandeira.finditer(texto):
        cor, valor, base_icms, aliq, icms, pis, cofins = m.groups()
        cor = base.sem_acentos(cor)
        itens.append(comum.item_sem_tarifa(
            f"adc_bandeira_{cor.lower().replace(' ', '_')}",
            f"ADICIONAL DE BANDEIRA {cor.upper()}", "bandeira_tarifaria", valor,
            pis_cofins=(comum.decimal(pis) or 0) + (comum.decimal(cofins) or 0),
            base_icms=base_icms, aliq=aliq, icms=icms,
        ))

    ilum = re.search(rf"^(?:Contrib\S* )?Custeio (?:de )?Ilum\S* P\S*blica[^\n]*?\s({NUM})\s*$",
                     texto, re.MULTILINE | re.IGNORECASE)
    if ilum:
        itens.append(comum.item_sem_tarifa(
            "contrib_ilum_publica_municipal", "CONTRIB. CUSTEIO ILUMINACAO PUBLICA",
            "cip_cosip", ilum.group(1),
        ))
    return itens


def ler(caminho: Path) -> Tuple[Dict[str, Any], Optional[str]]:
    """Lê uma fatura da CPFL; devolve a fatura schema 6 e o número da UC."""
    paginas_texto, texto = base.ler_pdf(caminho)
    if comum.tem_compensacao(texto):
        raise LeitorCpflError("cpfl compensation not supported")

    ref = re.search(
        r"\b(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/(\d{4})\s+(\d{2}/\d{2}/\d{4})\s+R\$\s*([0-9.]+,\d{2})",
        texto,
    )
    leitura = re.search(r"(\d{2}/\d{2}/\d{4})\s+(\d{2}/\d{2}/\d{4})\s+(\d{1,3})\s*$", texto, re.MULTILINE)
    proxima = re.search(r"Pr\S{1,3}xima leitura\s+(\d{2}/\d{2}/\d{4})", texto)
    uc = re.search(r"^(\d{8,15})\s+[0-9,]+%\s+[0-9,]+%\s*$", texto, re.MULTILINE)
    nf = re.search(
        r"NOTA FISCAL N.{0,3}\s*([0-9]+)\s*-\s*S.{0,3}RIE\s*([0-9]+)\s*/\s*DATA DE EMISS.{0,3}O:\s*(\d{2}/\d{2}/20\d{2})",
        texto, re.IGNORECASE,
    )
    numero_uc = uc.group(1) if uc else None
    competencia = comum.competencia(ref.group(1), ref.group(2)) if ref else None

    alertas: List[str] = []
    itens = _itens(texto, alertas)

    medicoes = []
    medido = re.search(
        rf"^(\d{{5,12}})\s+Energia Ativa-kWh\s+\S+\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})",
        texto, re.MULTILINE,
    )
    if medido:
        medicoes.append(comum.medicao(*medido.groups()))

    classificacao = re.search(r"Classifica\S{1,3}o:\s*(\S+)\s+(\S+)\s+([^\n]+?)\s+Tipo de Fornecimento", texto)
    tipo = re.search(r"Tipo de Fornecimento:\s*\n?\s*(\S+)", texto)
    tensoes = re.search(r"Disp\.:\s*(\d+)\s+Lim\. m\S{1,3}n\.:\s*(\d+)\s+Lim\. m\S{1,3}x\.:\s*(\d+)", texto)
    fornecimento = {
        "classe": classificacao.group(3).strip() if classificacao else None,
        "subclasse": None,
        "grupo": classificacao.group(2)[:1] if classificacao else None,
        "subgrupo": classificacao.group(2) if classificacao else None,
        "modalidade": classificacao.group(1) if classificacao else None,
        "tipo_ligacao": base.sem_acentos(tipo.group(1)).lower() if tipo else None,
        "tensao_nominal_v": base.decimal_json(tensoes.group(1)) if tensoes else None,
        "tensao_minima_v": base.decimal_json(tensoes.group(2)) if tensoes else None,
        "tensao_maxima_v": base.decimal_json(tensoes.group(3)) if tensoes else None,
        "perdas_percentual": None,
        "area_concessao": _distribuidora(texto),
        "modalidade_compensacao": None,
    }

    meses = [
        (comum.competencia(mes, ano), kwh, dias)
        for mes, ano, kwh, dias in re.findall(
            r"^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ) (\d{2}) l+ (\d+) (\d+)\s*$",
            texto, re.MULTILINE,
        )
    ]

    fatura = comum.montar_fatura(
        caminho, len(paginas_texto), texto,
        competencia_iso=competencia,
        numero_fatura=nf.group(1) if nf else None,
        serie=nf.group(2) if nf else None,
        data_emissao=nf.group(3) if nf else None,
        distribuidora=_distribuidora(texto),
        numero_uc=numero_uc,
        inicio=leitura.group(2) if leitura else None,
        fim=leitura.group(1) if leitura else None,
        dias=int(leitura.group(3)) if leitura else None,
        proxima_leitura=proxima.group(1) if proxima else None,
        vencimento=ref.group(3) if ref else None,
        total=comum.decimal(ref.group(4)) if ref else None,
        itens=itens,
        tributos_fatura=comum.tributos(texto),
        medicoes=medicoes,
        fornecimento=fornecimento,
        historico_consumo=comum.historico(meses, competencia),
        alertas=alertas,
        layout="cpfl_danf3e",
        versao=VERSAO,
    )
    return fatura, uc_digits(numero_uc) if numero_uc else None
