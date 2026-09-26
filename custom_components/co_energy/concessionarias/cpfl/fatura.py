"""Leitor das faturas do grupo CPFL (DANF3E).

Escrito sobre faturas reais da CPFL Piratininga, de consumidor B1 residencial
sem geração. A saída é o mesmo documento "schema 6" do leitor da Equatorial
(`docs/contrato-extrator.md`): o resto da integração não sabe de qual
distribuidora a fatura veio.

O que difere da Equatorial, e por isso vive aqui:

- a energia vem em DUAS linhas, TUSD e TE, cada uma com a própria tarifa. O
  contrato conhece uma linha de consumo com a tarifa cheia (`consumo_kwh`); o
  leitor soma as duas — é a mesma tarifa TE + TUSD que a Equatorial imprime
  numa linha só;
- PIS e COFINS vêm como alíquotas soltas ao lado do número da UC, e em valor
  por item, na mesma linha do item.

Fatura com geração ou compensação (SCEE) é recusada: não havia nenhuma para
conferir o layout, e ler errado um crédito é pior que não ler.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path
import re
from typing import Any, Dict, List, Optional, Tuple

from ..equatorial import fatura as base
from ...equatorial_adapter import uc_digits, uc_hash

VERSAO = "cpfl-1"

#: CNPJ -> nome curto. Só entra CNPJ conferido numa fatura real; as outras
#: distribuidoras do grupo usam o nome impresso no cabeçalho.
NOMES_POR_CNPJ = {
    "04172213000151": "CPFL Piratininga",
}

MESES = ("JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ")
_NUM = r"-?[0-9.]*[0-9],[0-9]+|-?[0-9]+"


class LeitorCpflError(ValueError):
    """A fatura é da CPFL, mas não pode ser lida por este leitor."""


def reconhece(texto: str) -> bool:
    """Se o texto é de uma fatura do grupo CPFL."""
    normalizado = base.sem_acentos(texto)
    if "CPFL" in normalizado:
        return True
    return any(cnpj in re.sub(r"\D", "", texto) for cnpj in NOMES_POR_CNPJ)


def _decimal(valor: Any) -> Optional[Decimal]:
    return base.decimal_br(valor)


def _competencia(mes: str, ano: str) -> Optional[str]:
    mes = mes.upper()
    if mes not in MESES:
        return None
    ano = ano if len(ano) == 4 else f"20{ano}"
    return f"{ano}-{MESES.index(mes) + 1:02d}"


def _distribuidora(texto: str) -> Optional[str]:
    cnpj = re.search(r"CNPJ:\s*([0-9./-]+)", texto)
    digitos = re.sub(r"\D", "", cnpj.group(1)) if cnpj else ""
    if digitos in NOMES_POR_CNPJ:
        return NOMES_POR_CNPJ[digitos]
    nome = re.search(r"^(COMPANHIA [^\n]+|CPFL [^\n]+|RGE [^\n]+)$", texto, re.MULTILINE)
    return nome.group(1).strip().title() if nome else "CPFL"


def _itens(texto: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any], List[str]]:
    """Os itens faturados, já no vocabulário do contrato, e o que sobrou."""
    alertas: List[str] = []
    energia = re.compile(
        rf"^(Consumo Uso Sistema \[KWh\]-TUSD|Consumo - TE)\s+[A-Z]{{3}}/\d{{2}}\s+kWh\s+"
        rf"({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})",
        re.MULTILINE,
    )
    partes = []
    for m in energia.finditer(texto):
        (nome, qtd, sem, com, valor, base_icms, aliq, icms, pis, cofins) = m.groups()
        partes.append({
            "nome": nome, "quantidade": _decimal(qtd), "sem": _decimal(sem),
            "com": _decimal(com), "valor": _decimal(valor),
            "base_icms": _decimal(base_icms), "aliq": _decimal(aliq),
            "icms": _decimal(icms), "pis_cofins": (_decimal(pis) or 0) + (_decimal(cofins) or 0),
        })
    itens: List[Dict[str, Any]] = []
    nomes = {p["nome"] for p in partes}
    if len(partes) == 2 and len(nomes) == 2:
        quantidades = {p["quantidade"] for p in partes}
        if len(quantidades) != 1:
            alertas.append("TUSD e TE com quantidades diferentes.")
        quantidade = partes[0]["quantidade"]
        soma = lambda chave: sum((p[chave] or Decimal("0")) for p in partes)  # noqa: E731
        itens.append({
            "codigo": "consumo_kwh",
            "descricao_original": "CONSUMO (TUSD + TE)",
            "categoria": "consumo",
            "unidade": "kWh",
            "quantidade": base.numero_json(quantidade, 6),
            "tarifa_com_tributos": base.numero_json(soma("com"), 8),
            "tarifa_sem_tributos": base.numero_json(soma("sem"), 8),
            "valor": base.numero_json(soma("valor"), 2),
            "natureza": "cobranca",
            "pagina_origem": 1,
            "pis_cofins": base.numero_json(soma("pis_cofins"), 2),
            "base_icms": base.numero_json(soma("base_icms"), 2),
            "aliquota_icms_percentual": base.numero_json(partes[0]["aliq"], 6),
            "valor_icms": base.numero_json(soma("icms"), 2),
        })
    elif partes:
        alertas.append("Linhas de TUSD e TE incompletas.")

    bandeira = re.compile(
        rf"^Adicional de Bandeira ([A-Za-zçãé]+(?: P\d)?)\s+[A-Z]{{3}}/\d{{2}}\s+kWh\s+"
        rf"({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})",
        re.MULTILINE,
    )
    for m in bandeira.finditer(texto):
        cor, valor, base_icms, aliq, icms, pis, cofins = m.groups()
        cor_norm = base.sem_acentos(cor).lower().replace(" ", "_")
        itens.append({
            "codigo": f"adc_bandeira_{cor_norm}",
            "descricao_original": f"ADICIONAL DE BANDEIRA {base.sem_acentos(cor).upper()}",
            "categoria": "bandeira_tarifaria",
            "unidade": "kWh",
            "quantidade": None,
            "tarifa_com_tributos": None,
            "tarifa_sem_tributos": None,
            "valor": base.numero_json(_decimal(valor), 2),
            "natureza": "cobranca",
            "pagina_origem": 1,
            "pis_cofins": base.numero_json((_decimal(pis) or 0) + (_decimal(cofins) or 0), 2),
            "base_icms": base.numero_json(_decimal(base_icms), 2),
            "aliquota_icms_percentual": base.numero_json(_decimal(aliq), 6),
            "valor_icms": base.numero_json(_decimal(icms), 2),
        })

    ilum = re.search(rf"^(?:Contrib\S* )?Custeio (?:de )?Ilum\S* P\S*blica[^\n]*?\s({_NUM})\s*$",
                     texto, re.MULTILINE | re.IGNORECASE)
    if ilum:
        itens.append({
            "codigo": "contrib_ilum_publica_municipal",
            "descricao_original": "CONTRIB. CUSTEIO ILUMINACAO PUBLICA",
            "categoria": "cip_cosip", "unidade": None, "quantidade": None,
            "tarifa_com_tributos": None, "tarifa_sem_tributos": None,
            "valor": base.numero_json(_decimal(ilum.group(1)), 2),
            "natureza": "cobranca", "pagina_origem": 1, "pis_cofins": None,
            "base_icms": None, "aliquota_icms_percentual": None, "valor_icms": None,
        })

    def tributo(nome: str) -> Dict[str, Any]:
        m = re.search(rf"{nome}\s+({_NUM})\s+({_NUM})\s+({_NUM})\s*$", texto, re.MULTILINE)
        if not m:
            return {"base": None, "aliquota_percentual": None, "valor": None}
        return {
            "base": base.numero_json(_decimal(m.group(1)), 2),
            "aliquota_percentual": base.numero_json(_decimal(m.group(2)), 6),
            "valor": base.numero_json(_decimal(m.group(3)), 2),
        }

    pis, cofins, icms = tributo("PIS/PASEP"), tributo("COFINS"), tributo("ICMS")
    total = sum((_decimal(t["valor"]) or Decimal("0")) for t in (pis, cofins, icms))
    tributos = {"pis": pis, "cofins": cofins, "icms": icms, "total": base.numero_json(total, 2)}
    return itens, tributos, alertas


def _historico(texto: str, competencia_atual: Optional[str]) -> List[Dict[str, Any]]:
    """O gráfico de consumo dos últimos meses, só as linhas legíveis.

    Parte dos rótulos sai na vertical, letra por letra, e não dá para casar
    com segurança: esses meses ficam de fora em vez de adivinhados.
    """
    saida = []
    for mes, ano, kwh, dias in re.findall(
        r"^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ) (\d{2}) l+ (\d+) (\d+)\s*$",
        texto, re.MULTILINE,
    ):
        competencia = _competencia(mes, ano)
        if not competencia or competencia == competencia_atual:
            continue
        consumo, n_dias = Decimal(kwh), int(dias)
        if not 1 <= n_dias <= 40:
            continue
        saida.append({
            "competencia": competencia,
            "total_kwh": base.numero_json(consumo, 6),
            "dias": n_dias,
            "media_diaria_kwh": base.numero_json(consumo / Decimal(n_dias), 6),
            "tipo_leitura": None,
            "origem": "informado",
            "metodo": "texto",
        })
    return saida


def ler(caminho: Path) -> Tuple[Dict[str, Any], Optional[str]]:
    """Lê uma fatura da CPFL; devolve a fatura schema 6 e o número da UC."""
    paginas_texto, texto = base.ler_pdf(caminho)
    normalizado = base.sem_acentos(texto)
    if re.search(r"INJETAD|SCEE|COMPENSAD|GERACAO DISTRIBUIDA|MICROGERA", normalizado):
        raise LeitorCpflError("cpfl compensation not supported")

    ref = re.search(
        r"\b(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)/(\d{4})\s+(\d{2}/\d{2}/\d{4})\s+R\$\s*([0-9.]+,\d{2})",
        texto,
    )
    referencia = f"{ref.group(1)}/{ref.group(2)}" if ref else None
    competencia = _competencia(ref.group(1), ref.group(2)) if ref else None
    leitura = re.search(r"(\d{2}/\d{2}/\d{4})\s+(\d{2}/\d{2}/\d{4})\s+(\d{1,3})\s*$", texto, re.MULTILINE)
    proxima = re.search(r"Pr\S{1,3}xima leitura\s+(\d{2}/\d{2}/\d{4})", texto)
    uc = re.search(r"^(\d{8,15})\s+[0-9,]+%\s+[0-9,]+%\s*$", texto, re.MULTILINE)
    nf = re.search(
        r"NOTA FISCAL N.{0,3}\s*([0-9]+)\s*-\s*S.{0,3}RIE\s*([0-9]+)\s*/\s*DATA DE EMISS.{0,3}O:\s*(\d{2}/\d{2}/20\d{2})",
        texto, re.IGNORECASE,
    )
    numero_uc = uc.group(1) if uc else None

    itens, tributos, alertas = _itens(texto)

    medicao = re.search(
        rf"^(\d{{5,12}})\s+Energia Ativa-kWh\s+\S+\s+({_NUM})\s+({_NUM})\s+({_NUM})\s+({_NUM})",
        texto, re.MULTILINE,
    )
    medicoes = []
    if medicao:
        medidor, ant, atu, cons, info = medicao.groups()
        ant_d, atu_d, cons_d, info_d = map(_decimal, (ant, atu, cons, info))
        diferenca = atu_d - ant_d if ant_d is not None and atu_d is not None else None
        calculado = diferenca * cons_d if diferenca is not None and cons_d is not None else None
        delta = abs(calculado - info_d) if calculado is not None and info_d is not None else None
        tolerancia = max(Decimal("0.51"), abs(info_d or 0) * Decimal("0.005"))
        medicoes.append({
            "grandeza": "energia_ativa_kwh",
            "medidor_hash": base.hash_identificador(medidor),
            "posto_tarifario": "unico",
            "leitura_anterior": base.numero_json(ant_d),
            "leitura_atual": base.numero_json(atu_d),
            "constante": base.numero_json(cons_d, 6),
            "diferenca_leituras": base.numero_json(diferenca),
            "consumo_calculado_kwh": base.numero_json(calculado, 6),
            "consumo_informado_kwh": base.numero_json(info_d, 6),
            "tipo_leitura": "nao_informado",
            "validacao": {
                "aplicavel": delta is not None,
                "confere": delta <= tolerancia if delta is not None else None,
                "diferenca_kwh": base.numero_json(delta, 6),
                "tolerancia_kwh": base.numero_json(tolerancia, 6),
            },
        })
    consumo_total = next((i["quantidade"] for i in itens if i["codigo"] == "consumo_kwh"), None)

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

    arquivo_hash = base.hash_arquivo(caminho)
    total = _decimal(ref.group(4)) if ref else None
    fatura: Dict[str, Any] = {
        "documento_id": f"sha256:{arquivo_hash}",
        "identificacao": {
            "referencia": referencia,
            "competencia": competencia,
            "numero_fatura": nf.group(1) if nf else None,
            "serie": nf.group(2) if nf else None,
            "data_emissao": base.data_iso(nf.group(3)) if nf else None,
            "hora_emissao": None,
            "tipo_documento": "fatura_normal",
            "cfop": None,
            "distribuidora": _distribuidora(texto),
            "uc_hash": uc_hash(numero_uc),
            "medidor_hash": medicoes[0]["medidor_hash"] if medicoes else None,
        },
        "periodo": {
            "inicio": base.data_iso(leitura.group(2)) if leitura else None,
            "inicio_informado": base.data_iso(leitura.group(2)) if leitura else None,
            "inicio_reconciliado": None,
            "fim": base.data_iso(leitura.group(1)) if leitura else None,
            "dias": int(leitura.group(3)) if leitura else None,
            "proxima_leitura": base.data_iso(proxima.group(1)) if proxima else None,
            "vencimento": base.data_iso(ref.group(3)) if ref else None,
            "motivo_reconciliacao": None,
        },
        "faturamento": {"tipo": None, "valor_total": base.numero_json(total, 2), "moeda": "BRL"},
        "consumo": {
            "total_kwh": consumo_total,
            "scee_kwh": None,
            "origem": "informado_fatura" if consumo_total is not None else None,
        },
        "medicoes": medicoes,
        "itens_faturados": itens,
        "tributos": tributos,
        "totais": {
            "energia": base.numero_json(sum(
                (_decimal(x["valor"]) or Decimal("0")) for x in itens
                if x["categoria"] in {"consumo", "bandeira_tarifaria"}
            ), 2),
            "distribuicao": None,
            "tributos": tributos.get("total"),
            "cip_cosip": next((x["valor"] for x in itens if x["categoria"] == "cip_cosip"), None),
            "juros": None, "multa": None, "parcelamentos": None, "devolucoes": None,
            "creditos_financeiros": None, "servicos": None, "outros": None,
        },
        "scee": {
            "aplicavel": False, "ciclo": None, "geracao_ciclo_kwh": None,
            "energia_injetada_ciclo_kwh": None, "energia_compensada_kwh": None,
            "consumo_total_kwh": consumo_total, "consumo_faturado_kwh": consumo_total,
            "consumo_nao_compensado_kwh": None, "saldo_anterior_kwh": None,
            "credito_gerado_kwh": None, "credito_utilizado_kwh": None,
            "credito_recebido_kwh": None, "credito_transferido_kwh": None,
            "excedente_recebido_kwh": None, "saldo_final_kwh": None,
            "beneficio_bruto": None, "beneficio_liquido": None,
            "saldo_expirar_30_dias_kwh": None, "saldo_expirar_60_dias_kwh": None,
            "relacoes_rateio_informadas": [],
        },
        "qualidade_fornecimento": base.extrair_qualidade(texto, fornecimento),
        "extracao": {
            "status": None,
            "alertas": alertas,
            "avisos_tecnicos": [],
            "arquivo": {
                "nome": caminho.name, "sha256": arquivo_hash,
                "tamanho_bytes": caminho.stat().st_size, "paginas": len(paginas_texto),
                "layout_detectado": "cpfl_danf3e",
            },
            "extraido_em": base.agora_iso(),
            "versao_extrator": VERSAO,
            "validacoes": {},
            "evidencias_excepcionais": [],
        },
        "_historico_consumo": _historico(texto, competencia),
        "_fornecimento": fornecimento,
    }
    status, validacoes, novos = base.validar_fatura(fatura)
    fatura["extracao"]["status"] = status
    fatura["extracao"]["validacoes"] = validacoes
    fatura["extracao"]["alertas"].extend(x for x in novos if x not in fatura["extracao"]["alertas"])
    return fatura, uc_digits(numero_uc) if numero_uc else None
