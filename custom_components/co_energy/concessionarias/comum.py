"""O que os leitores escritos no formato novo têm em comum.

CPFL e Neoenergia leem o PDF de jeitos diferentes, mas montam o mesmo
documento (`docs/contrato-extrator.md`). A montagem, a soma de TUSD + TE numa
linha de consumo, os tributos e a medição ficam aqui, num lugar só. As funções
de número, data e validação vêm do leitor da Equatorial, onde nasceram.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path
import re
from typing import Any, Dict, Iterable, List, Optional

from ..equatorial_adapter import uc_hash
from .equatorial import fatura as base

MESES = ("JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ")
NUM = r"-?[0-9.]*[0-9],[0-9]+|-?[0-9]+"

#: Marcas de geração ou compensação no texto. Os leitores novos ainda não
#: foram conferidos com uma fatura assim, e recusam: ler errado um crédito é
#: pior que não ler.
#: "Compensado" sozinho não serve: a fatura comum fala em "compensação do
#: pagamento" e em cliente "compensado" por interrupção.
MARCAS_SCEE = (
    r"INJETAD|\bSCEE\b|GERACAO DISTRIBUIDA|MICROGERA|MINIGERA"
    r"|ENERGIA COMPENSADA|CONSUMO COMPENSADO|KWH COMPENSAD|CREDITOS? DE ENERGIA"
)

decimal = base.decimal_br
numero = base.numero_json


def competencia(mes: str, ano: str) -> Optional[str]:
    """``("SET", "26")`` ou ``("09", "2026")`` -> ``"2026-09"``."""
    ano = ano if len(ano) == 4 else f"20{ano}"
    mes = mes.upper()
    if mes.isdigit():
        indice = int(mes)
    elif mes in MESES:
        indice = MESES.index(mes) + 1
    else:
        return None
    return f"{ano}-{indice:02d}" if 1 <= indice <= 12 else None


def referencia(competencia_iso: Optional[str]) -> Optional[str]:
    if not competencia_iso:
        return None
    ano, mes = competencia_iso.split("-")
    return f"{MESES[int(mes) - 1]}/{ano}"


def tem_compensacao(texto: str) -> bool:
    return bool(re.search(MARCAS_SCEE, base.sem_acentos(texto)))


def item_consumo(partes: List[Dict[str, Any]], alertas: List[str]) -> Optional[Dict[str, Any]]:
    """A linha de consumo do contrato, com a tarifa cheia.

    ``partes`` traz uma linha (a fatura já junta TE e TUSD) ou duas (TUSD e TE
    separadas). Somadas, dão a tarifa cheia que o contrato espera numa linha.
    Cada parte: quantidade, sem, com, valor, base_icms, aliq, icms, pis_cofins.
    """
    if not partes:
        return None
    if len({p["quantidade"] for p in partes}) != 1:
        alertas.append("Linhas de consumo com quantidades diferentes.")

    def soma(chave: str) -> Decimal:
        return sum((p[chave] or Decimal("0")) for p in partes)

    return {
        "codigo": "consumo_kwh",
        "descricao_original": "CONSUMO (TUSD + TE)" if len(partes) > 1 else "CONSUMO",
        "categoria": "consumo",
        "unidade": "kWh",
        "quantidade": numero(partes[0]["quantidade"], 6),
        "tarifa_com_tributos": numero(soma("com"), 8),
        "tarifa_sem_tributos": numero(soma("sem"), 8),
        "valor": numero(soma("valor"), 2),
        "natureza": "cobranca",
        "pagina_origem": 1,
        "pis_cofins": numero(soma("pis_cofins"), 2),
        "base_icms": numero(soma("base_icms"), 2),
        "aliquota_icms_percentual": numero(partes[0]["aliq"], 6),
        "valor_icms": numero(soma("icms"), 2),
    }


def item_sem_tarifa(
    codigo: str, descricao: str, categoria: str, valor: Any, *,
    pis_cofins: Any = None, base_icms: Any = None, aliq: Any = None, icms: Any = None,
) -> Dict[str, Any]:
    """Bandeira, iluminação pública: valor sem quantidade nem tarifa."""
    return {
        "codigo": codigo, "descricao_original": descricao, "categoria": categoria,
        "unidade": "kWh" if categoria == "bandeira_tarifaria" else None,
        "quantidade": None, "tarifa_com_tributos": None, "tarifa_sem_tributos": None,
        "valor": numero(decimal(valor), 2), "natureza": "cobranca", "pagina_origem": 1,
        "pis_cofins": numero(decimal(pis_cofins), 2) if pis_cofins is not None else None,
        "base_icms": numero(decimal(base_icms), 2) if base_icms is not None else None,
        "aliquota_icms_percentual": numero(decimal(aliq), 6) if aliq is not None else None,
        "valor_icms": numero(decimal(icms), 2) if icms is not None else None,
    }


def tributos(texto: str) -> Dict[str, Any]:
    """PIS, COFINS e ICMS: base, alíquota e valor, no fim de uma linha."""
    def um(nome: str) -> Dict[str, Any]:
        m = re.search(rf"\b{nome}\s+({NUM})\s+({NUM})\s+({NUM})\s*$", texto, re.MULTILINE)
        if not m:
            return {"base": None, "aliquota_percentual": None, "valor": None}
        return {
            "base": numero(decimal(m.group(1)), 2),
            "aliquota_percentual": numero(decimal(m.group(2)), 6),
            "valor": numero(decimal(m.group(3)), 2),
        }

    pis, cofins, icms = um(r"PIS(?:/PASEP)?"), um("COFINS"), um("ICMS")
    total = sum((decimal(t["valor"]) or Decimal("0")) for t in (pis, cofins, icms))
    return {"pis": pis, "cofins": cofins, "icms": icms, "total": numero(total, 2)}


def medicao(medidor: str, anterior: Any, atual: Any, constante: Any, informado: Any) -> Dict[str, Any]:
    ant, atu, cons, info = map(decimal, (anterior, atual, constante, informado))
    diferenca = atu - ant if ant is not None and atu is not None else None
    calculado = diferenca * cons if diferenca is not None and cons is not None else None
    delta = abs(calculado - info) if calculado is not None and info is not None else None
    tolerancia = max(Decimal("0.51"), abs(info or 0) * Decimal("0.005"))
    return {
        "grandeza": "energia_ativa_kwh",
        "medidor_hash": base.hash_identificador(medidor),
        "posto_tarifario": "unico",
        "leitura_anterior": numero(ant), "leitura_atual": numero(atu),
        "constante": numero(cons, 6), "diferenca_leituras": numero(diferenca),
        "consumo_calculado_kwh": numero(calculado, 6),
        "consumo_informado_kwh": numero(info, 6),
        "tipo_leitura": "nao_informado",
        "validacao": {
            "aplicavel": delta is not None,
            "confere": delta <= tolerancia if delta is not None else None,
            "diferenca_kwh": numero(delta, 6),
            "tolerancia_kwh": numero(tolerancia, 6),
        },
    }


def historico(meses: Iterable[tuple], competencia_atual: Optional[str]) -> List[Dict[str, Any]]:
    """``(competência, kWh, dias)`` -> histórico no formato do contrato."""
    saida = []
    for comp, kwh, dias in meses:
        if not comp or comp == competencia_atual:
            continue
        consumo, n_dias = Decimal(str(kwh)), int(dias)
        if not 1 <= n_dias <= 40:
            continue
        saida.append({
            "competencia": comp, "total_kwh": numero(consumo, 6), "dias": n_dias,
            "media_diaria_kwh": numero(consumo / Decimal(n_dias), 6),
            "tipo_leitura": None, "origem": "informado", "metodo": "texto",
        })
    return saida


def montar_fatura(
    caminho: Path,
    paginas: int,
    texto: str,
    *,
    competencia_iso: Optional[str],
    numero_fatura: Optional[str],
    serie: Optional[str],
    data_emissao: Optional[str],
    distribuidora: Optional[str],
    numero_uc: Optional[str],
    inicio: Optional[str],
    fim: Optional[str],
    dias: Optional[int],
    proxima_leitura: Optional[str],
    vencimento: Optional[str],
    total: Optional[Decimal],
    itens: List[Dict[str, Any]],
    tributos_fatura: Dict[str, Any],
    medicoes: List[Dict[str, Any]],
    fornecimento: Dict[str, Any],
    historico_consumo: List[Dict[str, Any]],
    alertas: List[str],
    layout: str,
    versao: str,
) -> Dict[str, Any]:
    """O documento schema 6 de uma fatura sem compensação, já validado.

    Datas chegam como ``dd/mm/aaaa``, como a fatura imprime.
    """
    arquivo_hash = base.hash_arquivo(caminho)
    consumo_total = next((i["quantidade"] for i in itens if i["codigo"] == "consumo_kwh"), None)
    fatura: Dict[str, Any] = {
        "documento_id": f"sha256:{arquivo_hash}",
        "identificacao": {
            "referencia": referencia(competencia_iso),
            "competencia": competencia_iso,
            "numero_fatura": numero_fatura,
            "serie": serie,
            "data_emissao": base.data_iso(data_emissao) if data_emissao else None,
            "hora_emissao": None,
            "tipo_documento": "fatura_normal",
            "cfop": None,
            "distribuidora": distribuidora,
            "uc_hash": uc_hash(numero_uc),
            "medidor_hash": medicoes[0]["medidor_hash"] if medicoes else None,
        },
        "periodo": {
            "inicio": base.data_iso(inicio) if inicio else None,
            "inicio_informado": base.data_iso(inicio) if inicio else None,
            "inicio_reconciliado": None,
            "fim": base.data_iso(fim) if fim else None,
            "dias": dias,
            "proxima_leitura": base.data_iso(proxima_leitura) if proxima_leitura else None,
            "vencimento": base.data_iso(vencimento) if vencimento else None,
            "motivo_reconciliacao": None,
        },
        "faturamento": {"tipo": None, "valor_total": numero(total, 2), "moeda": "BRL"},
        "consumo": {
            "total_kwh": consumo_total,
            "scee_kwh": None,
            "origem": "informado_fatura" if consumo_total is not None else None,
        },
        "medicoes": medicoes,
        "itens_faturados": itens,
        "tributos": tributos_fatura,
        "totais": {
            "energia": numero(sum(
                (decimal(x["valor"]) or Decimal("0")) for x in itens
                if x["categoria"] in {"consumo", "bandeira_tarifaria"}
            ), 2),
            "distribuicao": None,
            "tributos": tributos_fatura.get("total"),
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
            "alertas": list(alertas),
            "avisos_tecnicos": [],
            "arquivo": {
                "nome": caminho.name, "sha256": arquivo_hash,
                "tamanho_bytes": caminho.stat().st_size, "paginas": paginas,
                "layout_detectado": layout,
            },
            "extraido_em": base.agora_iso(),
            "versao_extrator": versao,
            "validacoes": {},
            "evidencias_excepcionais": [],
        },
        "_historico_consumo": historico_consumo,
        "_fornecimento": fornecimento,
    }
    status, validacoes, novos = base.validar_fatura(fatura)
    fatura["extracao"]["status"] = status
    fatura["extracao"]["validacoes"] = validacoes
    fatura["extracao"]["alertas"].extend(x for x in novos if x not in fatura["extracao"]["alertas"])
    return fatura
