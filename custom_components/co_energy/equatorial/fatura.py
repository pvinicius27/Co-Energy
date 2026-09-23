"""Normalizacao v6 das faturas Equatorial Goias.

Veio de ``equatorial_v6.py``, o extrator que rodava no Windows. As regras sao
as mesmas; mudou quem responde "de quem e esta fatura". La, uma lista fixa de
UCs no proprio codigo. Aqui, o modelo de quem instalou: ``montar_documento``
recebe as unidades e o dono de cada UC, e a fatura de UC sem dono vai para
``documentos_nao_identificados`` em vez de ser adivinhada.

Ficou de fora o que era do disco do Windows — gravar o JSON, fazer backup,
varrer pastas. No Home Assistant quem guarda e o storage.
"""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from copy import deepcopy
from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from . import leitura as legado


def _pdfplumber():
    """Importa so quando ha PDF para ler.

    O Home Assistant instala o pdfplumber a partir do manifest, mas o resto da
    integracao nao depende dele: importar aqui dentro faz uma falha de
    instalacao derrubar so a leitura de PDF, e nao a dashboard inteira.
    """
    import pdfplumber

    return pdfplumber


SCHEMA_VERSION = 6
EXTRACTOR_VERSION = "6.0.0"
ResultadoSCEE = legado.ResultadoSCEE

MESES = {
    "JAN": 1, "FEV": 2, "MAR": 3, "ABR": 4, "MAI": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SET": 9, "OUT": 10, "NOV": 11, "DEZ": 12,
}

# Somente estas chaves podem chegar ao JSON público. A validação é recursiva.
ALLOWLIST = {
    "schema_version", "gerado_em", "ultimo_processamento", "resumo_historico",
    "unidades", "nome", "perfil", "faturas", "faturas_nao_identificadas",
    "iniciado_em", "concluido_em", "pdfs_encontrados", "pdfs_processados",
    "faturas_importadas", "ok", "revisar", "invalidas", "alertas", "erros",
    "por_unidade", "por_layout", "documentos_unicos", "duplicados",
    "possui_geracao", "recebe_creditos", "participa_scee", "grupo_tarifario",
    "unidade_id", "competencia", "documento_id", "identificacao", "periodo",
    "fornecimento", "medicoes", "consumo", "itens_faturados", "tributos",
    "bandeiras_tarifarias", "scee", "historico_consumo", "qualidade_fornecimento",
    "avisos_tecnicos", "totais", "extracao", "dados_fatura", "quantidades",
    "tarifas", "valores", "medidor", "referencia", "tipo_faturamento",
    "vencimento", "leitura_anterior", "leitura_atual", "dias_leitura",
    "proxima_leitura", "valor_total", "consumo_kwh", "consumo_scee_kwh",
    "unidade_consumidora", "ativa", "geracao", "numero", "ciclo", "uc_geracao",
    "geracao_ciclo_kwh", "uc_excedente_recebido", "excedente_recebido_kwh",
    "credito_recebido_kwh", "saldo_kwh", "saldo_expirar_30_dias_kwh",
    "saldo_expirar_60_dias_kwh", "rateio_uc", "rateio_percentual", "status",
    "arquivo_origem", "distribuidora", "uc_hash", "numero_instalacao_hash",
    "numero_fatura", "documento_fiscal", "serie", "data_emissao", "hora_emissao",
    "data_apresentacao", "tipo_documento", "revisao", "paginas", "cfop",
    "descricao_cfop", "inicio", "fim", "dias", "proxima_leitura_data",
    "periodo_faturado", "classe", "subclasse", "grupo", "subgrupo", "modalidade",
    "tipo_ligacao", "tensao_nominal_v", "tensao_minima_v", "tensao_maxima_v",
    "perdas_percentual", "area_concessao", "modalidade_compensacao", "tipo",
    "medidor_hash", "posto_tarifario", "constante", "diferenca_leituras",
    "consumo_calculado_kwh", "consumo_informado_kwh", "tipo_leitura", "validacao",
    "aplicavel", "confere", "diferenca_kwh", "tolerancia_kwh", "codigo",
    "descricao_original", "categoria", "unidade", "quantidade", "tarifa_com_tributos",
    "tarifa_sem_tributos", "valor", "natureza", "pagina_origem", "pis_cofins_valor",
    "base_icms", "aliquota_icms_percentual", "valor_icms", "pis", "cofins", "icms",
    "base", "aliquota_percentual", "total_tributos", "beneficios", "isencoes",
    "bandeira", "cor", "periodo_inicio", "periodo_fim", "saldo_anterior_kwh",
    "energia_injetada_ciclo_kwh", "energia_compensada_kwh", "consumo_total_kwh",
    "consumo_faturado_kwh", "consumo_nao_compensado_kwh", "consumo_minimo_kwh",
    "custo_disponibilidade", "credito_gerado_kwh", "credito_utilizado_kwh",
    "credito_transferido_kwh", "saldo_final_kwh", "excedente_kwh", "beneficio_bruto",
    "beneficio_liquido", "relacoes_rateio", "origem_uc_hash", "destino_uc_hash",
    "percentual", "energia_kwh", "validade", "mes_origem", "media_diaria_kwh",
    "tensao", "continuidade", "competencia_apuracao", "vrc", "indicadores",
    "fator_potencia", "energia_reativa", "energia", "distribuicao", "cip_cosip",
    "juros", "multa", "parcelamentos", "devolucoes", "creditos_financeiros",
    "servicos", "outros", "extraido_em", "versao_extrator", "arquivo_nome",
    "arquivo_sha256", "arquivo_tamanho_bytes", "layout_detectado", "validacoes",
    "campos", "origem", "metodo", "pagina", "confianca", "financeira",
    "datas", "medicao", "campos_obrigatorios", "soma_itens", "diferenca_absoluta",
    "diferenca_percentual", "referencia_valida", "ordem_cronologica_valida",
    "campos_ausentes", "motivo", "duplicado_de", "hash", "fatura_normal",
    "segunda_via", "refaturamento", "cancelamento", "calculado", "extraido",
    "inferido", "nao_informado", "nao_encontrado", "inaplicavel",
    "total_kwh", "scee_kwh", "nominal_v", "minima_v", "maxima_v",
    "faturado_total_kwh", "medido_kwh", "compensado_scee_kwh",
    "nao_compensado_kwh", "inicio_informado", "inicio_reconciliado",
    "dias_calendario", "diferenca_dias", "coerencia_duracao",
}


def agora_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def sem_acentos(valor: Any) -> str:
    texto = unicodedata.normalize("NFKD", str(valor or ""))
    return "".join(c for c in texto if not unicodedata.combining(c)).upper()


def decimal_br(valor: Any) -> Optional[Decimal]:
    if valor is None or valor == "":
        return None
    if isinstance(valor, Decimal):
        return valor
    if isinstance(valor, (int, float)):
        return Decimal(str(valor))
    texto = str(valor).strip().replace("R$", "").replace("%", "").replace(" ", "")
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return Decimal(texto)
    except InvalidOperation:
        return None


def decimal_json(valor: Any, casas: Optional[int] = None) -> Optional[str]:
    numero = decimal_br(valor)
    if numero is None:
        return None
    if casas is not None:
        numero = numero.quantize(Decimal(1).scaleb(-casas), rounding=ROUND_HALF_UP)
    return format(numero, "f")


def numero_json(valor: Any, casas: Optional[int] = None) -> Optional[float | int]:
    """Converte Decimal para número JSON, preservando null e escala útil."""
    numero = decimal_br(valor)
    if numero is None:
        return None
    if casas is not None:
        numero = numero.quantize(Decimal(1).scaleb(-casas), rounding=ROUND_HALF_UP)
    if numero == numero.to_integral_value():
        return int(numero)
    return float(numero)


def data_iso(valor: Optional[str]) -> Optional[str]:
    if not valor:
        return None
    try:
        return datetime.strptime(valor, "%d/%m/%Y").date().isoformat()
    except ValueError:
        return None


def competencia_iso(referencia: Optional[str]) -> Optional[str]:
    match = re.search(r"([A-Z]{3})\s*/\s*(20\d{2})", sem_acentos(referencia))
    if not match or match.group(1) not in MESES:
        return None
    return f"{match.group(2)}-{MESES[match.group(1)]:02d}"


def hash_arquivo(caminho: Path) -> str:
    sha = hashlib.sha256()
    with caminho.open("rb") as arquivo:
        for bloco in iter(lambda: arquivo.read(1024 * 1024), b""):
            sha.update(bloco)
    return sha.hexdigest()


def hash_identificador(valor: Optional[str]) -> Optional[str]:
    if not valor:
        return None
    normalizado = re.sub(r"\D", "", str(valor))
    return "sha256:" + hashlib.sha256(("equatorial-v6:" + normalizado).encode()).hexdigest()


def _match(texto: str, padrao: str, grupo: int = 1) -> Optional[str]:
    encontrado = re.search(padrao, texto, re.IGNORECASE | re.DOTALL)
    return encontrado.group(grupo).strip() if encontrado else None


def _campo(origem: str, metodo: str, pagina: Optional[int] = 1, confianca: str = "alta") -> Dict[str, Any]:
    return {"origem": origem, "metodo": metodo, "pagina": pagina, "confianca": confianca}


def _metadados_campos(fatura: Dict[str, Any]) -> Dict[str, Any]:
    scee_aplicavel = bool(fatura.get("scee", {}).get("aplicavel"))
    definicoes = {
        "identificacao.numero_fatura": (fatura["identificacao"].get("numero_fatura"), True, "regex"),
        "identificacao.data_emissao": (fatura["identificacao"].get("data_emissao"), True, "regex"),
        "fornecimento.classe": (fatura["fornecimento"].get("classe"), True, "texto"),
        "fornecimento.tipo_ligacao": (fatura["fornecimento"].get("tipo_ligacao"), True, "texto"),
        "fornecimento.tensao_nominal_v": (fatura["fornecimento"].get("tensao_nominal_v"), True, "regex"),
        "periodo.inicio": (fatura["periodo"].get("inicio"), False, "tabela"),
        "periodo.fim": (fatura["periodo"].get("fim"), True, "tabela"),
        "periodo.vencimento": (fatura["periodo"].get("vencimento"), True, "regex"),
        "consumo.total_kwh": (fatura["consumo"].get("total_kwh"), True, "calculo"),
        "consumo.faturado_total_kwh": (fatura["consumo"].get("faturado_total_kwh"), True, "calculo"),
        "consumo.medido_kwh": (fatura["consumo"].get("medido_kwh"), False, "tabela"),
        "consumo.compensado_scee_kwh": (fatura["consumo"].get("compensado_scee_kwh"), scee_aplicavel, "tabela"),
        "consumo.nao_compensado_kwh": (fatura["consumo"].get("nao_compensado_kwh"), False, "tabela"),
        "tributos.icms.valor": (fatura["tributos"].get("icms", {}).get("valor"), True, "tabela"),
        "scee.credito_recebido_kwh": (fatura["scee"].get("credito_recebido_kwh"), scee_aplicavel, "texto"),
        "scee.saldo_final_kwh": (fatura["scee"].get("saldo_final_kwh"), scee_aplicavel, "texto"),
    }
    saida = {
        "totais.valor_total": _campo("extraido", "regex"),
        "identificacao.uc_hash": _campo("extraido", "posicao"),
    }
    for caminho, (valor, esperado, metodo) in definicoes.items():
        if valor is not None:
            origem = "calculado" if metodo == "calculo" else "extraido"
            saida[caminho] = _campo(origem, metodo)
        elif caminho.startswith("scee.") and not scee_aplicavel:
            saida[caminho] = _campo("inaplicavel", "correlacao entre paginas", None, "alta")
        elif esperado:
            saida[caminho] = _campo("nao_encontrado", metodo, None, "baixa")
        else:
            saida[caminho] = _campo("nao_informado", metodo, None, "alta")
    if fatura.get("historico_consumo"):
        saida["historico_consumo"] = _campo("inferido", "posicao", 1, "media")
    return saida


def ler_pdf(caminho: Path) -> Tuple[List[str], str]:
    with _pdfplumber().open(caminho) as pdf:
        paginas = [pagina.extract_text() or "" for pagina in pdf.pages]
    return paginas, "\n".join(paginas)


def detectar_layout(texto: str, paginas: int) -> str:
    sinais = []
    if paginas == 1:
        sinais.append("compacto_1p")
    else:
        sinais.append("multipagina")
    if "INFORMA" in sem_acentos(texto) and "SCEE" in sem_acentos(texto):
        sinais.append("scee")
    if re.search(r"\d{1,3}(?:\.\d{3}){2,3}-\d{2}", texto):
        sinais.append("uc_padronizada")
    else:
        sinais.append("uc_legada")
    return "equatorial_goias_2026_" + "_".join(sinais)


def extrair_fornecimento(texto: str) -> Dict[str, Any]:
    classificacao = _match(texto, r"Classifica.{0,3}o:\s*([^\n]+?)(?=\s+Tipo de fornecimento:|\n)")
    classe = subclasse = grupo = modalidade = None
    if classificacao:
        partes = sem_acentos(classificacao).split()
        grupo = partes[0] if partes else None
        subgrupo = partes[1] if len(partes) > 1 else None
        classe = partes[2] if len(partes) > 2 else None
        subclasse = " ".join(partes[3:-1]) or None
        modalidade = partes[-1] if partes else None
    else:
        subgrupo = None
    tipo = _match(texto, r"Tipo de fornecimento:\s*([^\n]+?)(?=\s+Tens|\n)")
    tensoes = re.search(
        r"Tens.{0,3}o Nominal Disp:\s*([0-9.,]+)\s*V\s*Lim Min:\s*([0-9.,]+)\s*V\s*Lim Max:\s*([0-9.,]+)",
        texto, re.IGNORECASE,
    )
    return {
        "classe": classe,
        "subclasse": subclasse,
        "grupo": grupo,
        "subgrupo": subgrupo,
        "modalidade": modalidade,
        "tipo_ligacao": sem_acentos(tipo).lower() if tipo else None,
        "tensao_nominal_v": decimal_json(tensoes.group(1)) if tensoes else None,
        "tensao_minima_v": decimal_json(tensoes.group(2)) if tensoes else None,
        "tensao_maxima_v": decimal_json(tensoes.group(3)) if tensoes else None,
        "perdas_percentual": decimal_json(_match(texto, r"PERDAS DE TRANSFORMA.{0,3}O\s*/\s*RAMAL:\s*([0-9.,]+)%")),
        "area_concessao": "Equatorial Goiás",
        "modalidade_compensacao": "SCEE" if "SCEE" in sem_acentos(texto) else None,
    }


def extrair_identificacao_fatura(texto: str, resultado: ResultadoSCEE, paginas: int) -> Dict[str, Any]:
    nf = re.search(
        r"NOTA FISCAL N.{0,3}\s*([0-9]+)\s*-\s*S.{0,3}RIE\s*([0-9]+)\s*/\s*DATA DE EMISS.{0,3}O:\s*(\d{2}/\d{2}/20\d{2})(?:\s+(\d{2}:\d{2}:\d{2}))?",
        texto, re.IGNORECASE,
    )
    cfop = re.search(r"CFOP\s*(\d{4})\s*:\s*([^\n]+)", texto, re.IGNORECASE)
    return {
        "distribuidora": resultado.distribuidora or "Equatorial Goiás",
        "uc_hash": hash_identificador(resultado.unidade_consumidora_fatura),
        "numero_instalacao_hash": None,
        "numero_fatura": nf.group(1) if nf else None,
        "documento_fiscal": nf.group(1) if nf else None,
        "serie": nf.group(2) if nf else None,
        "data_emissao": data_iso(nf.group(3)) if nf else None,
        "hora_emissao": nf.group(4) if nf and nf.group(4) else None,
        "data_apresentacao": None,
        "tipo_documento": "fatura_normal",
        "revisao": None,
        "paginas": paginas,
        "cfop": cfop.group(1) if cfop else None,
        "descricao_cfop": cfop.group(2).strip() if cfop else None,
    }


def _pagina_do_trecho(paginas: List[str], trecho: str) -> Optional[int]:
    alvo = sem_acentos(trecho)
    for indice, texto in enumerate(paginas, 1):
        if alvo and alvo in sem_acentos(texto):
            return indice
    return None


# Itens da seção ITENS FINANCEIROS do PDF. Não têm quantidade nem tarifa, então
# não entram pela tabela de itens da fatura — ficam de fora da soma e derrubam a
# conferência financeira.
#
# Foi o que aconteceu numa fatura real: uma devolução de ICMS cobrado a maior
# mais os juros dessa devolução zeraram a conta. O total impresso era R$ 0,00
# e estava certo; a soma dos itens acusava o valor cheio, porque estes dois
# nunca eram lidos.
#
# Cada padrão exige o próprio rótulo do item entre a âncora e o número. Estas
# linhas quebram no meio e o PDF intercala a tabela de histórico de consumo
# entre a descrição e o valor, então casar só pela âncora capturaria o número
# errado.
ITENS_FINANCEIROS_SEM_TARIFA = (
    (
        "bonus_itaipu",
        "BONUS ITAIPU ART.21 LEI 10438/02(-)",
        "credito_financeiro",
        r"BONUS\s+ITAIPU[^\n]*?\(-\)\s*(-?[0-9.,]+)",
    ),
    (
        "dev_icms_cobrado_a_maior",
        "DEV. ICMS COB. A MAIOR (-) - CREDITO DE CONSUMO",
        "credito_financeiro",
        r"DEV\.?\s*ICMS\s+COB\.?\s*A\s+MAIOR[^\n]*CREDITO\s+DE\s+CONSUMO"
        r".{0,90}?\d{2}/\d{4}\s+(-?[0-9.,]+)",
    ),
    (
        "juros_dev_faturado_a_maior",
        "JUROS DEV. FAT. A MAIOR - CREDITO DE CONSUMO",
        "credito_financeiro",
        r"JUROS\s+DEV\.?\s*FAT\.?\s*A\s+MAIOR[^\n]*CREDITO\s+DE\s+CONSUMO"
        r".{0,90}?\d{2}/\d{4}\s+(-?[0-9.,]+)",
    ),
)


def categoria_item(codigo: str, descricao: str) -> str:
    base = sem_acentos(codigo + " " + descricao)
    regras = [
        ("BANDEIRA", "bandeira_tarifaria"), ("ILUM", "cip_cosip"),
        ("MULTA", "multa"), ("JUROS", "juros"), ("INJECAO", "energia_injetada"),
        ("SCEE", "consumo_scee"), ("BENEFICIO", "beneficio_tarifario"),
        ("BONUS", "credito_financeiro"), ("CONSUMO", "consumo"),
        ("DEMANDA", "demanda"), ("REATIVA", "energia_reativa"),
    ]
    for termo, categoria in regras:
        if termo in base:
            return categoria
    return "outros"


def extrair_itens(resultado: ResultadoSCEE, paginas: List[str]) -> List[Dict[str, Any]]:
    itens: List[Dict[str, Any]] = []
    padrao_completo = re.compile(
        r"KWH\s+([-]?[0-9.,]+)\s+([-]?[0-9.,]+)\s+([-]?[0-9.,]+)\s+"
        r"([-]?[0-9.,]+)\s+([-]?[0-9.,]+)\s+([-]?[0-9.,]+)%\s+"
        r"([-]?[0-9.,]+)\s+([-]?[0-9.,]+)", re.IGNORECASE,
    )
    usados: set = set()
    for codigo, item in (resultado.itens_fatura or {}).items():
        quantidade = decimal_br(item.get("quantidade"))
        tarifa = decimal_br(item.get("preco_unitario_com_tributos"))
        valor = decimal_br(item.get("valor"))
        detalhes = None
        pagina_origem = _pagina_do_trecho(paginas, item.get("nome") or "")
        if quantidade is not None and tarifa is not None and pagina_origem:
            texto_pagina = paginas[pagina_origem - 1]
            for indice, candidato in enumerate(padrao_completo.finditer(texto_pagina)):
                if indice in usados:
                    continue
                nums = [decimal_br(candidato.group(i)) for i in range(1, 9)]
                if nums[0] == quantidade and nums[1] == tarifa and nums[2] == valor:
                    detalhes = nums
                    usados.add(indice)
                    break
        descricao = item.get("nome") or codigo
        registro = {
            "codigo": codigo,
            "descricao_original": descricao,
            "categoria": categoria_item(codigo, descricao),
            "unidade": item.get("unidade"),
            "quantidade": numero_json(quantidade, 6),
            "tarifa_com_tributos": numero_json(tarifa, 6),
            "tarifa_sem_tributos": numero_json(detalhes[7], 6) if detalhes else None,
            "valor": numero_json(valor, 2),
            "natureza": "credito" if valor is not None and valor < 0 else "cobranca",
            "pagina_origem": pagina_origem,
            "pis_cofins": numero_json(detalhes[3], 2) if detalhes else None,
            "base_icms": numero_json(detalhes[4], 2) if detalhes else None,
            "aliquota_icms_percentual": numero_json(detalhes[5], 6) if detalhes else None,
            "valor_icms": numero_json(detalhes[6], 2) if detalhes else None,
        }
        itens.append(registro)
    texto_total = sem_acentos("\n".join(paginas))
    codigos = {item["codigo"] for item in itens}
    for codigo, descricao, categoria, padrao in ITENS_FINANCEIROS_SEM_TARIFA:
        if codigo in codigos:
            continue
        achado = re.search(padrao, texto_total, re.IGNORECASE | re.DOTALL)
        if not achado:
            continue
        valor = decimal_br(achado.group(1))
        if valor is None:
            continue
        # São todos créditos: o PDF ora imprime o sinal no número, ora o deixa
        # no rótulo, como em "(-)". Normalizar aqui evita que a mesma linha
        # entre somando em uma fatura e subtraindo em outra.
        if valor > 0:
            valor = -valor
        itens.append({
            "codigo": codigo, "descricao_original": descricao,
            "categoria": categoria, "unidade": None, "quantidade": None,
            "tarifa_com_tributos": None, "tarifa_sem_tributos": None,
            "valor": numero_json(valor, 2), "natureza": "credito",
            "pagina_origem": _pagina_do_trecho(paginas, descricao) or 1,
            "pis_cofins": None, "base_icms": None,
            "aliquota_icms_percentual": None, "valor_icms": None,
        })
    return itens


def extrair_tributos(texto: str, itens: List[Dict[str, Any]]) -> Dict[str, Any]:
    def tributo(nome: str) -> Dict[str, Any]:
        padrao = rf"(?:FORNECIMENTO\s+)?{nome}\s+([0-9.,]+)\s+([0-9.,]+)%\s+([0-9.,]+)"
        m = re.search(padrao, texto, re.IGNORECASE)
        if not m:
            return {"base": None, "aliquota_percentual": None, "valor": None}
        return {"base": numero_json(m.group(1), 2), "aliquota_percentual": numero_json(m.group(2), 6), "valor": numero_json(m.group(3), 2)}
    pis, cofins, icms = tributo(r"PIS/PASEP"), tributo("COFINS"), tributo("ICMS")
    total = sum((decimal_br(x.get("valor")) or Decimal("0")) for x in (pis, cofins, icms))
    beneficios = [x for x in itens if "beneficio" in x["categoria"]]
    return {
        "pis": pis, "cofins": cofins, "icms": icms,
        "total": numero_json(total, 2),
    }


def extrair_medicoes(resultado: ResultadoSCEE) -> List[Dict[str, Any]]:
    saida = []
    conjuntos = [
        ("consumo", resultado.medidor_fisico_ativa, resultado.leitura_medidor_ativa_anterior,
         resultado.leitura_medidor_ativa_atual, resultado.constante_medidor_ativa,
         resultado.consumo_medidor_ativa_kwh),
        ("geracao", resultado.medidor_fisico_geracao, resultado.leitura_medidor_geracao_anterior,
         resultado.leitura_medidor_geracao_atual, resultado.constante_medidor_geracao,
         resultado.consumo_medidor_geracao_kwh),
    ]
    for tipo, medidor, anterior, atual, constante, informado in conjuntos:
        if not any(x is not None for x in (medidor, anterior, atual, constante, informado)):
            continue
        ant, atu, cons, info = map(decimal_br, (anterior, atual, constante, informado))
        diferenca = atu - ant if ant is not None and atu is not None else None
        calculado = diferenca * cons if diferenca is not None and cons is not None else None
        delta = abs(calculado - info) if calculado is not None and info is not None else None
        # A coluna de consumo pode ser impressa com uma casa decimal enquanto as
        # leituras são inteiras. Meio kWh é, portanto, arredondamento aceitável.
        tolerancia = max(Decimal("0.51"), abs(info or 0) * Decimal("0.005"))
        saida.append({
            "grandeza": "energia_ativa_kwh" if tipo == "consumo" else "energia_geracao_kwh",
            "medidor_hash": hash_identificador(medidor),
            "posto_tarifario": "unico", "leitura_anterior": numero_json(ant),
            "leitura_atual": numero_json(atu), "constante": numero_json(cons, 6),
            "diferenca_leituras": numero_json(diferenca),
            "consumo_calculado_kwh": numero_json(calculado, 6),
            "consumo_informado_kwh": numero_json(info, 6),
            "tipo_leitura": (resultado.tipo_faturamento or "nao_informado").lower(),
            "validacao": {"aplicavel": delta is not None, "confere": delta <= tolerancia if delta is not None else None,
                          "diferenca_kwh": numero_json(delta, 6), "tolerancia_kwh": numero_json(tolerancia, 6)},
        })
    return saida


def extrair_qualidade(texto: str, fornecimento: Dict[str, Any]) -> Dict[str, Any]:
    continuidade = re.search(
        r"PER.{0,3}ODO DE REFER.{0,3}NCIA DA APURA.{0,3}O DOS INDICADORES DE CONTINUIDADE\s*=\s*([0-9]{1,2}/20\d{2}).*?VRC\s*=\s*R\$\s*([0-9.,]+)",
        texto, re.IGNORECASE,
    )
    return {
        "tensao": {"nominal_v": numero_json(fornecimento.get("tensao_nominal_v")), "minima_v": numero_json(fornecimento.get("tensao_minima_v")), "maxima_v": numero_json(fornecimento.get("tensao_maxima_v"))},
        "continuidade": {"competencia_apuracao": continuidade.group(1) if continuidade else None,
                         "vrc": numero_json(continuidade.group(2), 5) if continuidade else None,
                         "indicadores": []},
        "fator_potencia": None, "energia_reativa": None,
    }


def _mes_anterior(competencia: str, deslocamento: int) -> str:
    ano, mes = map(int, competencia.split("-"))
    indice = ano * 12 + mes - 1 - deslocamento
    return f"{indice // 12:04d}-{indice % 12 + 1:02d}"


def extrair_historico(caminho: Path, competencia_atual: Optional[str]) -> List[Dict[str, Any]]:
    """Lê a tabela gráfica por coordenadas; os rótulos de mês são vetoriais.

    Nos 30 documentos analisados, consumo/dias/tipo possuem texto selecionável,
    mas os rótulos mensais não. A competência é correlacionada pela ordem
    decrescente da tabela e marcada explicitamente como inferida.
    """
    if not competencia_atual:
        return []
    try:
        with _pdfplumber().open(caminho) as pdf:
            palavras = pdf.pages[0].extract_words(use_text_flow=False) or []
        cabecalho = next((p for p in palavras if "S/ANO" in sem_acentos(p.get("text"))), None)
        if not cabecalho:
            return []
        topo = float(cabecalho["top"])
        tipos = {"LIDA": "lida", "MEDIA": "media", "MINIMO": "minimo", "AUTOLEITURA": "autoleitura", "ESTIMADA": "estimada"}
        linhas = []
        for palavra in palavras:
            tipo = tipos.get(sem_acentos(palavra.get("text")))
            y = float(palavra.get("top", 0))
            if not tipo or not (topo < y < topo + 210):
                continue
            candidatos = []
            for numero in palavras:
                ny, nx = float(numero.get("top", 0)), float(numero.get("x0", 0))
                if abs(ny - y) <= 3.0 and nx < float(palavra.get("x0", 0)) and re.fullmatch(r"[0-9]+(?:[.,][0-9]+)?", numero.get("text", "")):
                    candidatos.append((nx, numero.get("text")))
            if len(candidatos) < 2:
                continue
            candidatos.sort()
            consumo = decimal_br(candidatos[-2][1])
            dias = decimal_br(candidatos[-1][1])
            if consumo is None or dias is None or not (1 <= dias <= 40):
                continue
            linhas.append((y, consumo, int(dias), tipo))
        linhas.sort(key=lambda x: x[0])
        saida = []
        for indice, (_, consumo, dias, tipo) in enumerate(linhas[:13]):
            saida.append({"competencia": _mes_anterior(competencia_atual, indice),
                          "total_kwh": numero_json(consumo, 6), "dias": dias,
                          "media_diaria_kwh": numero_json(consumo / Decimal(dias), 6),
                          "tipo_leitura": tipo, "origem": "inferido", "metodo": "posicao"})
        return saida
    except Exception:
        return []


def extrair_avisos_tecnicos(texto: str) -> List[str]:
    normalizado = sem_acentos(texto)
    avisos = []
    regras = [
        ("REN 1095", "ren_1095_padronizacao_uc"),
        ("LEI FEDERAL 14.300", "lei_14300_transicao_scee"),
        ("PORTARIA MME N", "portaria_mme_137_2026_flexibilizacao_rural"),
        ("EMITIDO EM CONTINGENCIA", "nf3e_emitida_em_contingencia"),
    ]
    for sinal, codigo in regras:
        if sinal in normalizado:
            avisos.append(codigo)
    return avisos


def extrair_scee_v6(resultado: ResultadoSCEE, itens: List[Dict[str, Any]]) -> Dict[str, Any]:
    def valor_item(codigo: str) -> Optional[str]:
        for item in itens:
            if item["codigo"] == codigo:
                return item["valor"]
        return None
    def qtd_item(codigo: str) -> Optional[str]:
        for item in itens:
            if item["codigo"] == codigo:
                return item["quantidade"]
        return None
    origem = hash_identificador(resultado.scee_uc_geracao or resultado.scee_uc_excedente_recebido)
    destino = hash_identificador(resultado.unidade_consumidora_fatura)
    relacoes = []
    if resultado.scee_rateio_percentual is not None or origem:
        relacoes.append({"origem_uc_hash": origem, "destino_uc_hash": destino,
                         "percentual": numero_json(resultado.scee_rateio_percentual, 6),
                         # O demonstrativo informa a relação e o percentual, mas
                         # não atribui energia individual à relação.
                         "energia_kwh": None,
                         "competencia": competencia_iso(resultado.referencia), "validade": None})
    aplica = legado.resultado_tem_scee(resultado)
    return {
        "aplicavel": aplica,
        "ciclo": resultado.scee_ciclo,
        "geracao_ciclo_kwh": numero_json(resultado.scee_geracao_ciclo_kwh, 6),
        "energia_injetada_ciclo_kwh": None,
        "energia_compensada_kwh": qtd_item("injecao_scee"),
        "consumo_total_kwh": numero_json(resultado.consumo_kwh, 6),
        "consumo_faturado_kwh": numero_json(resultado.consumo_kwh, 6),
        "consumo_nao_compensado_kwh": qtd_item("consumo_nao_compensado"),
        "saldo_anterior_kwh": None, "credito_gerado_kwh": None,
        "credito_utilizado_kwh": None,
        "credito_recebido_kwh": numero_json(resultado.scee_credito_recebido_kwh, 6),
        "credito_transferido_kwh": None,
        "excedente_recebido_kwh": numero_json(resultado.scee_excedente_recebido_kwh, 6),
        "saldo_final_kwh": numero_json(resultado.scee_saldo_kwh, 6),
        "beneficio_bruto": valor_item("beneficio_tarifario_bruto_scee"),
        "beneficio_liquido": valor_item("beneficio_tarifario_liquido_scee"),
        "saldo_expirar_30_dias_kwh": numero_json(resultado.scee_saldo_expirar_30_dias_kwh, 6),
        "saldo_expirar_60_dias_kwh": numero_json(resultado.scee_saldo_expirar_60_dias_kwh, 6),
        "relacoes_rateio_informadas": relacoes,
    }


def extrair_bandeiras(itens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    saida = []
    for item in itens:
        if item["categoria"] != "bandeira_tarifaria":
            continue
        cor = _match(sem_acentos(item["descricao_original"]), r"BANDEIRA\s+(VERDE|AMARELA|VERMELHA)")
        saida.append({"bandeira": cor.lower() if cor else "nao_identificada", "cor": cor.lower() if cor else None,
                      "periodo_inicio": None, "periodo_fim": None, "quantidade": item["quantidade"],
                      "tarifa_com_tributos": item["tarifa_com_tributos"], "valor": item["valor"]})
    return saida


def validar_fatura(fatura: Dict[str, Any]) -> Tuple[str, Dict[str, Any], List[str]]:
    alertas: List[str] = []
    evidencias = fatura.get("extracao", {}).setdefault("evidencias_excepcionais", [])
    total = decimal_br(fatura["faturamento"].get("valor_total"))
    soma = sum((decimal_br(x.get("valor")) or Decimal("0")) for x in fatura["itens_faturados"])
    diferenca = abs(soma - total) if total is not None else None
    percentual = diferenca / abs(total) * 100 if diferenca is not None and total else None
    financeira_ok = diferenca is not None and diferenca <= Decimal("0.01")
    if not financeira_ok:
        alertas.append("Soma dos itens faturados não confere com o valor total.")
        evidencias.append({"campo": "faturamento.valor_total", "valor_informado": numero_json(total, 2),
                           "valor_canonico": numero_json(soma, 2), "origem": "validacao", "pagina": 1,
                           "metodo": "soma_itens", "confianca": "alta", "motivo": "divergencia_financeira"})
    inicio, fim = fatura["periodo"].get("inicio"), fatura["periodo"].get("fim")
    datas_ok = bool(inicio and fim and inicio <= fim)
    if not datas_ok:
        alertas.append("Período de leitura ausente ou cronologicamente inconsistente.")
    dias_calendario = None
    if datas_ok:
        dias_calendario = (datetime.fromisoformat(fim).date() - datetime.fromisoformat(inicio).date()).days
    dias_faturados = fatura["periodo"].get("dias")
    diferenca_dias = abs(dias_calendario - dias_faturados) if dias_calendario is not None and dias_faturados is not None else None
    duracao_ok = diferenca_dias is not None and diferenca_dias <= 1
    if datas_ok and not duracao_ok:
        alertas.append("Datas impressas não correspondem à quantidade de dias faturados.")
        evidencias.append({"campo": "periodo.inicio", "valor_informado": inicio,
                           "valor_canonico": inicio, "origem": "extraido", "pagina": 1,
                           "metodo": "tabela", "confianca": "baixa", "motivo": "duracao_incoerente"})
    medicoes_invalidas = [m for m in fatura["medicoes"] if m["validacao"].get("aplicavel") and not m["validacao"].get("confere")]
    if medicoes_invalidas:
        alertas.append("Uma ou mais medições não fecham com leituras e constante.")
    obrigatorios = {
        "competencia": fatura["identificacao"].get("competencia"),
        "vencimento": fatura["periodo"].get("vencimento"),
        "valor_total": fatura["faturamento"].get("valor_total"),
        "itens_faturados": fatura.get("itens_faturados"),
        "uc_hash": fatura["identificacao"].get("uc_hash"),
    }
    ausentes = [k for k, v in obrigatorios.items() if v is None or v == []]
    if ausentes:
        alertas.append("Campos obrigatórios ausentes: " + ", ".join(ausentes))
    validacoes = {
        "campos_obrigatorios": {"confere": not ausentes, "campos_ausentes": ausentes},
        "datas": {"referencia_valida": bool(fatura["identificacao"].get("competencia")),
                  "ordem_cronologica_valida": datas_ok, "coerencia_duracao": duracao_ok,
                  "dias_calendario": dias_calendario, "diferenca_dias": diferenca_dias},
        "medicao": {"confere": not medicoes_invalidas, "erros": len(medicoes_invalidas)},
        "financeira": {"confere": financeira_ok, "soma_itens": numero_json(soma, 2),
                       "diferenca_absoluta": numero_json(diferenca, 2),
                       "diferenca_percentual": numero_json(percentual, 4)},
        "scee": {"aplicavel": fatura["scee"].get("aplicavel"), "confere": None,
                 "motivo": "Saldo anterior não é informado nos layouts analisados; fechamento integral indisponível."},
    }
    if not fatura["identificacao"].get("competencia") or total is None:
        status = "invalido"
    elif alertas or fatura["extracao"].get("alertas"):
        status = "revisar"
    else:
        status = "ok"
    return status, validacoes, alertas


def resultado_para_v6(resultado: ResultadoSCEE) -> Dict[str, Any]:
    caminho = Path(resultado.arquivo).resolve()
    paginas_texto, texto = ler_pdf(caminho)
    paginas = len(paginas_texto)
    arquivo_hash = hash_arquivo(caminho)
    competencia = competencia_iso(resultado.referencia)
    fornecimento = extrair_fornecimento(texto)
    identificacao_extraida = extrair_identificacao_fatura(texto, resultado, paginas)
    itens = extrair_itens(resultado, paginas_texto)
    medicoes = extrair_medicoes(resultado)
    medidor_hash = next((m.get("medidor_hash") for m in medicoes if m.get("medidor_hash")), None)
    tipo_norm = sem_acentos(resultado.tipo_faturamento)
    tipos = {"LIDA": "LIDA", "MEDIA": "MÉDIA", "AUTOLEITURA": "AUTOLEITURA", "MINIMO": "MÍNIMO"}
    tipo_faturamento = tipos.get(tipo_norm)
    consumo_scee_item = next((x["quantidade"] for x in itens if x["codigo"] == "consumo_scee"), None)
    possui_consumo_literal = any(x["codigo"] in {"consumo", "consumo_scee", "consumo_nao_compensado"} for x in itens)
    periodo = {
        "inicio": data_iso(resultado.leitura_anterior),
        "inicio_informado": data_iso(resultado.leitura_anterior),
        "inicio_reconciliado": None,
        "fim": data_iso(resultado.leitura_atual),
        "dias": int(resultado.dias_leitura) if str(resultado.dias_leitura or "").isdigit() else None,
        "proxima_leitura": data_iso(resultado.proxima_leitura),
        "vencimento": data_iso(resultado.vencimento_corrigido or resultado.vencimento),
        "motivo_reconciliacao": None,
    }
    fatura: Dict[str, Any] = {
        "documento_id": f"sha256:{arquivo_hash}",
        "identificacao": {
            "referencia": resultado.referencia,
            "competencia": competencia,
            "numero_fatura": identificacao_extraida.get("numero_fatura"),
            "serie": identificacao_extraida.get("serie"),
            "data_emissao": identificacao_extraida.get("data_emissao"),
            "hora_emissao": identificacao_extraida.get("hora_emissao"),
            "tipo_documento": identificacao_extraida.get("tipo_documento"),
            "cfop": identificacao_extraida.get("cfop"),
            "distribuidora": identificacao_extraida.get("distribuidora"),
            "uc_hash": identificacao_extraida.get("uc_hash"),
            "medidor_hash": medidor_hash,
        },
        "periodo": periodo,
        "faturamento": {"tipo": tipo_faturamento, "valor_total": numero_json(resultado.valor_total, 2), "moeda": "BRL"},
        "consumo": {
                    "total_kwh": numero_json(resultado.consumo_kwh, 6),
                    "scee_kwh": numero_json(consumo_scee_item if consumo_scee_item is not None else resultado.consumo_scee_kwh, 6),
                    "origem": "informado_fatura" if possui_consumo_literal else ("calculado_medidor" if resultado.consumo_medidor_ativa_kwh is not None else None)},
        "medicoes": medicoes,
        "itens_faturados": itens,
        "tributos": extrair_tributos(texto, itens),
        "totais": {
            "energia": numero_json(sum((decimal_br(x["valor"]) or Decimal("0")) for x in itens if x["categoria"] in {"consumo", "consumo_scee", "energia_injetada", "bandeira_tarifaria"}), 2),
            "distribuicao": None,
            "tributos": extrair_tributos(texto, itens).get("total"),
            "cip_cosip": next((x["valor"] for x in itens if x["categoria"] == "cip_cosip"), None),
            "juros": next((x["valor"] for x in itens if x["categoria"] == "juros"), None),
            "multa": next((x["valor"] for x in itens if x["categoria"] == "multa"), None),
            "parcelamentos": None,
            "devolucoes": numero_json(sum(
                (decimal_br(x["valor"]) or Decimal("0")) for x in itens
                if x["codigo"] in {"dev_icms_cobrado_a_maior", "juros_dev_faturado_a_maior"}
            ), 2) or None,
            "creditos_financeiros": numero_json(sum((decimal_br(x["valor"]) or Decimal("0")) for x in itens if x["categoria"] == "credito_financeiro"), 2) or None,
            "servicos": None, "outros": None,
        },
        "scee": extrair_scee_v6(resultado, itens),
        "qualidade_fornecimento": extrair_qualidade(texto, fornecimento),
        "extracao": {
            "status": None, "alertas": list(resultado.alertas or []),
            "avisos_tecnicos": extrair_avisos_tecnicos(texto),
            "arquivo": {"nome": caminho.name, "sha256": arquivo_hash,
                        "tamanho_bytes": caminho.stat().st_size, "paginas": paginas,
                        "layout_detectado": detectar_layout(texto, paginas)},
            "extraido_em": agora_iso(), "versao_extrator": EXTRACTOR_VERSION,
            "validacoes": {}, "evidencias_excepcionais": [],
        },
        # Dados internos usados para consolidar a unidade; nunca publicados.
        "_historico_consumo": extrair_historico(caminho, competencia),
        "_fornecimento": fornecimento,
    }
    status, validacoes, alertas = validar_fatura(fatura)
    fatura["extracao"]["status"] = status
    fatura["extracao"]["validacoes"] = validacoes
    fatura["extracao"]["alertas"].extend(x for x in alertas if x not in fatura["extracao"]["alertas"])
    return fatura


def fatura_publica(fatura: Dict[str, Any]) -> Dict[str, Any]:
    publica = deepcopy(fatura)
    publica.pop("_historico_consumo", None)
    publica.pop("_fornecimento", None)
    return publica


def processar_pdf(caminho_pdf: str) -> ResultadoSCEE:
    resultado = legado.processar_pdf(caminho_pdf)
    try:
        _, texto = ler_pdf(Path(caminho_pdf))
        normalizado = sem_acentos(texto)
        # Alguns layouts informam valores SCEE zerados sem a partícula "UC".
        # O parser v5 exigia UC e confundia zero explícito com campo ausente.
        campos = (
            ("scee_geracao_ciclo_kwh", r"GERACAO CICLO\s*\([^)]+\)\s*KWH\s*:(?:\s*UC\s*[0-9. -]+\s*:)?\s*([0-9]+(?:[.,][0-9]+)?)"),
            ("scee_excedente_recebido_kwh", r"EXCEDENTE RECEBIDO KWH\s*:(?:\s*UC\s*[0-9. -]+\s*:)?\s*([0-9]+(?:[.,][0-9]+)?)"),
            ("scee_credito_recebido_kwh", r"CREDITO RECEBIDO KWH\s*:?\s*([0-9]+(?:[.,][0-9]+)?)"),
            ("scee_saldo_kwh", r"SALDO KWH\s*:\s*([0-9]+(?:[.,][0-9]+)?)"),
        )
        for atributo, padrao in campos:
            if getattr(resultado, atributo, None) is None:
                valor = _match(normalizado, padrao)
                if valor is not None:
                    setattr(resultado, atributo, float(decimal_br(valor)))
        # Em faturas beneficiárias que possuem somente a linha CONSUMO SCEE,
        # ausência de CONSUMO NÃO COMPENSADO não é falha de extração.
        if "CONSUMO SCEE KWH" in normalizado and "CONSUMO NAO COMPENSADO KWH" not in normalizado:
            resultado.alertas = [a for a in resultado.alertas if "Consumo não compensado não encontrado" not in a]
        # Remove alertas v5 contraditos por zeros explicitamente recuperados.
        if resultado.scee_excedente_recebido_kwh is not None:
            resultado.alertas = [a for a in resultado.alertas if "Excedente recebido kWh não encontrado" not in a]
        if resultado.scee_credito_recebido_kwh is not None and "CONSUMO SCEE KWH" not in normalizado:
            resultado.alertas = [a for a in resultado.alertas if "Consumo SCEE não encontrado" not in a]
        if not resultado.alertas and resultado.status == "COM ALERTA":
            resultado.status = "OK"
    except Exception as erro:
        resultado.alertas.append(f"Enriquecimento v6 incompleto: {type(erro).__name__}")
        if resultado.status == "OK":
            resultado.status = "COM ALERTA"
    return resultado


def sanitizar_allowlist(obj: Any, caminho: str = "raiz") -> Any:
    if isinstance(obj, dict):
        saida = {}
        for chave, valor in obj.items():
            mapa_dinamico = caminho.endswith(("unidades", "quantidades", "tarifas", "valores", "por_unidade", "por_layout", "campos"))
            if chave not in ALLOWLIST and not mapa_dinamico:
                continue
            saida[chave] = sanitizar_allowlist(valor, f"{caminho}.{chave}")
        return saida
    if isinstance(obj, list):
        return [sanitizar_allowlist(x, caminho) for x in obj]
    if isinstance(obj, Decimal):
        return decimal_json(obj)
    return obj


def perfil_unidade(faturas: List[Dict[str, Any]]) -> Dict[str, Any]:
    fornecimentos = [f.get("_fornecimento", {}) for f in faturas if f.get("_fornecimento")]
    ultimo = fornecimentos[-1] if fornecimentos else {}
    return {
        "possui_geracao": any(any(m.get("grandeza") == "energia_geracao_kwh" for m in f.get("medicoes", [])) for f in faturas),
        "recebe_creditos": any(decimal_br(f.get("scee", {}).get("credito_recebido_kwh")) not in (None, Decimal("0")) for f in faturas),
        "participa_scee": any(f.get("scee", {}).get("aplicavel") for f in faturas),
        "classe": ultimo.get("classe"), "subclasse": ultimo.get("subclasse"),
        "grupo": ultimo.get("grupo"), "subgrupo": ultimo.get("subgrupo"),
        "modalidade": ultimo.get("modalidade"), "tipo_ligacao": ultimo.get("tipo_ligacao"),
        "tensao_nominal_v": numero_json(ultimo.get("tensao_nominal_v")),
    }


def consolidar_historico_unidade(faturas: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    por_competencia: Dict[str, Dict[str, Any]] = {}
    # Autoridade primária: a própria fatura da competência.
    for fatura in faturas:
        competencia = fatura.get("identificacao", {}).get("competencia")
        if not competencia:
            continue
        por_competencia[competencia] = {
            "competencia": competencia,
            "total_kwh": fatura.get("consumo", {}).get("total_kwh"),
            "dias": fatura.get("periodo", {}).get("dias"),
            "tipo_leitura": fatura.get("faturamento", {}).get("tipo"),
            "origem": "fatura_individual",
            "documentos_origem": [fatura.get("documento_id")],
            "conflitos": [],
        }
    # Autoridade secundária: gráfico/tabela histórica de fatura posterior.
    for fonte in faturas:
        for candidato in fonte.get("_historico_consumo", []):
            competencia = candidato.get("competencia")
            if not competencia:
                continue
            existente = por_competencia.get(competencia)
            if existente is None:
                por_competencia[competencia] = {
                    "competencia": competencia, "total_kwh": candidato.get("total_kwh"),
                    "dias": candidato.get("dias"), "tipo_leitura": str(candidato.get("tipo_leitura") or "").upper() or None,
                    "origem": "historico_visual_inferido",
                    "documentos_origem": [fonte.get("documento_id")], "conflitos": [],
                }
                continue
            if fonte.get("documento_id") not in existente["documentos_origem"]:
                existente["documentos_origem"].append(fonte.get("documento_id"))
            valor_a, valor_b = decimal_br(existente.get("total_kwh")), decimal_br(candidato.get("total_kwh"))
            # Nos layouts com dois gráficos sobrepostos (consumo e geração),
            # zero pode ser capturado da série vizinha. Como a fonte é inferida
            # e existe fatura individual não-zero, isso é ausência de evidência,
            # não um conflito nem um zero real.
            if existente.get("origem") == "fatura_individual" and valor_a not in (None, Decimal("0")) and valor_b == Decimal("0"):
                continue
            conflito_valor = valor_a is not None and valor_b is not None and abs(valor_a - valor_b) > Decimal("0.01")
            conflito_dias = existente.get("dias") is not None and candidato.get("dias") is not None and existente["dias"] != candidato["dias"]
            if conflito_valor or conflito_dias:
                conflito = {
                    "documento_id": fonte.get("documento_id"),
                    "total_kwh_informado": candidato.get("total_kwh"),
                    "dias_informados": candidato.get("dias"),
                    "motivo": "divergencia_com_fatura_individual_prioritaria",
                }
                if conflito not in existente["conflitos"]:
                    existente["conflitos"].append(conflito)
                aviso = f"Conflito no histórico informado para {competencia}; mantida a fatura individual."
                if aviso not in fonte["extracao"]["alertas"]:
                    fonte["extracao"]["alertas"].append(aviso)
                fonte["extracao"]["status"] = "revisar"
                fonte["extracao"]["evidencias_excepcionais"].append({
                    "campo": f"historico_consumo_informado.{competencia}",
                    "valor_informado": candidato.get("total_kwh"),
                    "valor_canonico": existente.get("total_kwh"), "origem": "conflito",
                    "pagina": 1, "metodo": "comparacao_documental", "confianca": "alta",
                    "motivo": "fatura_individual_tem_prioridade_sobre_historico_visual",
                })
    return [por_competencia[chave] for chave in sorted(por_competencia)]


def reconciliar_periodos_unidade(faturas: List[Dict[str, Any]]) -> None:
    """Reconcilia continuidade sem apagar a data originalmente impressa."""
    for indice in range(1, len(faturas)):
        anterior, atual = faturas[indice - 1], faturas[indice]
        fim_anterior = anterior.get("periodo", {}).get("fim")
        periodo = atual.get("periodo", {})
        inicio_impresso = periodo.get("inicio_informado")
        fim_atual = periodo.get("fim")
        dias = periodo.get("dias")
        if not fim_anterior or not fim_atual or dias is None or inicio_impresso == fim_anterior:
            continue
        dias_continuidade = (datetime.fromisoformat(fim_atual).date() - datetime.fromisoformat(fim_anterior).date()).days
        dias_impressos = None
        if inicio_impresso:
            dias_impressos = (datetime.fromisoformat(fim_atual).date() - datetime.fromisoformat(inicio_impresso).date()).days
        # Só reconcilia quando a continuidade entre faturas explica os dias e a
        # data impressa não explica. Caso contrário preserva a ambiguidade.
        if abs(dias_continuidade - int(dias)) > 1 or (dias_impressos is not None and abs(dias_impressos - int(dias)) <= 1):
            continue
        periodo["inicio_reconciliado"] = fim_anterior
        periodo["inicio"] = fim_anterior
        periodo["motivo_reconciliacao"] = "continuidade_com_leitura_final_da_fatura_anterior"
        aviso = (
            f"Data inicial impressa ({inicio_impresso}) inconsistente; "
            f"reconciliada pela leitura final da fatura anterior ({fim_anterior})."
        )
        alertas_existentes = [
            a for a in atual["extracao"].get("alertas", [])
            if a != "Datas impressas não correspondem à quantidade de dias faturados."
        ]
        if aviso not in alertas_existentes:
            alertas_existentes.append(aviso)
        atual["extracao"]["alertas"] = alertas_existentes
        atual["extracao"]["evidencias_excepcionais"] = [
            e for e in atual["extracao"].get("evidencias_excepcionais", [])
            if not (e.get("campo") == "periodo.inicio" and e.get("motivo") == "duracao_incoerente")
        ]
        atual["extracao"]["evidencias_excepcionais"].append({
            "campo": "periodo.inicio", "valor_informado": inicio_impresso,
            "valor_canonico": fim_anterior, "origem": "reconciliado", "pagina": 1,
            "metodo": "continuidade_entre_faturas", "confianca": "alta",
            "motivo": "dias_informados_so_fecham_com_leitura_final_da_fatura_anterior",
        })
        status, validacoes, novos_alertas = validar_fatura(atual)
        atual["extracao"]["status"] = status
        atual["extracao"]["validacoes"] = validacoes
        for alerta in novos_alertas:
            if alerta not in atual["extracao"]["alertas"]:
                atual["extracao"]["alertas"].append(alerta)


def ler_fatura(caminho_pdf: str) -> Dict[str, Any]:
    """Le um PDF e devolve a fatura v6 interna, sem dono.

    "Interna" porque ainda carrega o que a consolidacao da unidade usa — o
    historico impresso e o fornecimento. ``montar_documento`` tira esses
    campos antes de publicar.
    """
    return resultado_para_v6(processar_pdf(caminho_pdf))


def montar_documento(
    faturas: List[Dict[str, Any]],
    unidades: Dict[str, str],
    dono_por_uc: Dict[str, str],
    iniciado_em: Optional[str] = None,
) -> Dict[str, Any]:
    """Monta o documento v6 a partir das faturas lidas e de quem e cada UC.

    Era ``montar_json_faturas``, que perguntava a uma lista fixa de quem era
    cada fatura. Agora ``unidades`` traz o id e o nome de cada unidade do
    modelo, e ``dono_por_uc`` o hash de cada UC declarada e a unidade dona.
    Fatura cuja UC ninguem declarou vai para ``documentos_nao_identificados``.

    O mesmo PDF duas vezes vale uma: fica a leitura mais recente, como no
    extrator de antes.
    """
    inicio = iniciado_em or agora_iso()
    blocos: Dict[str, Dict[str, Any]] = {
        unidade: {"nome": nome, "perfil": {}, "historico_consumo_informado": [], "faturas": []}
        for unidade, nome in unidades.items()
    }
    por_digest: Dict[str, Dict[str, Any]] = {}
    duplicados = 0
    for original in faturas:
        digest = original.get("extracao", {}).get("arquivo", {}).get("sha256")
        if digest in por_digest:
            duplicados += 1
            del por_digest[digest]
        por_digest[digest] = deepcopy(original)

    nao_identificadas = []
    for fatura in por_digest.values():
        dono = dono_por_uc.get(fatura.get("identificacao", {}).get("uc_hash"))
        if dono in blocos:
            blocos[dono]["faturas"].append(fatura)
        else:
            nao_identificadas.append(fatura)

    for bloco in blocos.values():
        bloco["faturas"].sort(key=lambda f: (f.get("identificacao", {}).get("competencia") or "", f.get("documento_id") or ""))
        reconciliar_periodos_unidade(bloco["faturas"])
        perfil_novo = perfil_unidade(bloco["faturas"])
        bloco["perfil"] = {k: v for k, v in perfil_novo.items() if v is not None}
        bloco["historico_consumo_informado"] = consolidar_historico_unidade(bloco["faturas"])
        bloco["faturas"] = [fatura_publica(f) for f in bloco["faturas"]]
    nao_identificadas = [fatura_publica(f) for f in nao_identificadas]

    todas = [f for b in blocos.values() for f in b["faturas"]] + nao_identificadas
    contagem = {s: sum(f["extracao"]["status"] == s for f in todas) for s in ("ok", "revisar", "invalido")}
    por_layout: Dict[str, int] = {}
    for f in todas:
        layout = f["extracao"]["arquivo"]["layout_detectado"]
        por_layout[layout] = por_layout.get(layout, 0) + 1
    dados = {
        "schema_version": SCHEMA_VERSION, "gerado_em": agora_iso(),
        "processamento": {"iniciado_em": inicio, "concluido_em": agora_iso(),
            "pdfs_encontrados": len(faturas), "pdfs_processados": len(faturas),
            "faturas_importadas": len(faturas),
            "documentos_unicos": len(por_digest), "duplicados": duplicados,
            "por_unidade": {u: len(b["faturas"]) for u, b in blocos.items()},
            "por_layout": por_layout,
            "ok": contagem["ok"], "revisar": contagem["revisar"],
            "invalidas": contagem["invalido"],
            "alertas": sum(bool(f["extracao"]["alertas"]) for f in todas),
            "erros": contagem["invalido"]},
        "unidades": blocos, "documentos_nao_identificados": nao_identificadas,
    }
    validar_json_publico(dados)
    return dados


def validar_json_publico(dados: Dict[str, Any]) -> None:
    if dados.get("schema_version") != SCHEMA_VERSION:
        raise ValueError("schema_version inválida")
    chaves_raiz = {"schema_version", "gerado_em", "processamento", "unidades", "documentos_nao_identificados"}
    if set(dados) != chaves_raiz:
        raise ValueError(f"Estrutura superior inválida: {sorted(set(dados) ^ chaves_raiz)}")
    try:
        datetime.fromisoformat(dados["gerado_em"])
    except Exception as erro:
        raise ValueError("gerado_em deve ser ISO 8601 com offset") from erro
    if datetime.fromisoformat(dados["gerado_em"]).tzinfo is None:
        raise ValueError("gerado_em deve possuir offset")
    serializado = json.dumps(dados, ensure_ascii=False)
    proibidos = [r"CNPJ/CPF", r"ENDERE.C?O DE ENTREGA", r"CODIGO PIX", r"LINHA DIGITAVEL",
                 r"[A-Z]:[\\/]", r"\\\\[^\\]+\\"]
    for padrao in proibidos:
        if re.search(padrao, sem_acentos(serializado)):
            raise ValueError(f"Conteúdo proibido detectado no JSON: {padrao}")
    legados = {"dados_fatura", "quantidades", "tarifas", "valores", "medidor", "historico_consumo"}
    chaves_fatura = {"documento_id", "identificacao", "periodo", "faturamento", "consumo", "medicoes",
                     "itens_faturados", "tributos", "totais", "scee", "qualidade_fornecimento", "extracao"}
    ids, unidades_vistas = set(), set()

    def validar_numero(valor: Any, caminho: str) -> None:
        if isinstance(valor, bool) or valor is None:
            return
        if isinstance(valor, (int, float)):
            if isinstance(valor, float) and not __import__("math").isfinite(valor):
                raise ValueError(f"Número não finito em {caminho}")
        elif isinstance(valor, dict):
            for k, v in valor.items():
                validar_numero(v, f"{caminho}.{k}")
        elif isinstance(valor, list):
            for i, v in enumerate(valor):
                validar_numero(v, f"{caminho}[{i}]")

    for unidade_id, unidade in dados.get("unidades", {}).items():
        if unidade_id in unidades_vistas:
            raise ValueError(f"Unidade duplicada: {unidade_id}")
        unidades_vistas.add(unidade_id)
        if set(unidade) != {"nome", "perfil", "historico_consumo_informado", "faturas"}:
            raise ValueError(f"Estrutura inválida da unidade {unidade_id}")
        competencias_hist = [h.get("competencia") for h in unidade["historico_consumo_informado"]]
        if len(competencias_hist) != len(set(competencias_hist)):
            raise ValueError(f"Histórico duplicado na unidade {unidade_id}")
        for fatura in unidade.get("faturas", []):
            if set(fatura) != chaves_fatura or legados & set(fatura):
                raise ValueError(f"Fatura fora do contrato final: {fatura.get('documento_id')}")
            documento_id = fatura.get("documento_id")
            if not re.fullmatch(r"sha256:[0-9a-f]{64}", str(documento_id or "")) or documento_id in ids:
                raise ValueError(f"documento_id inválido ou duplicado: {documento_id}")
            ids.add(documento_id)
            competencia = fatura["identificacao"].get("competencia")
            if not re.fullmatch(r"20\d{2}-(0[1-9]|1[0-2])", str(competencia or "")):
                raise ValueError(f"Competência inválida: {competencia}")
            for campo in ("inicio", "fim", "proxima_leitura", "vencimento", "inicio_informado", "inicio_reconciliado"):
                valor = fatura["periodo"].get(campo)
                if valor:
                    try:
                        datetime.fromisoformat(valor).date()
                    except ValueError as erro:
                        raise ValueError(f"Data inválida em periodo.{campo}: {valor}") from erro
            if not fatura["extracao"]["validacoes"]["financeira"].get("confere"):
                # Divergência pode ser publicada somente como revisar/inválido.
                if fatura["extracao"].get("status") == "ok":
                    raise ValueError("Fatura financeiramente divergente marcada como ok")
            for relacao in fatura["scee"].get("relacoes_rateio_informadas", []):
                percentual = relacao.get("percentual")
                if percentual is not None and not 0 <= percentual <= 100:
                    raise ValueError(f"Percentual fora de 0..100: {percentual}")
            validar_numero(fatura, documento_id)
    validar_numero(dados, "raiz")
