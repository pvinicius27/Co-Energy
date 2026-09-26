"""Qual leitor lê esta fatura.

Cada grupo de distribuidoras tem o próprio leitor, porque o layout da fatura é
do grupo. Todos entregam o mesmo documento (`docs/contrato-extrator.md`), e é
por isso que nada depois daqui sabe de qual distribuidora a fatura veio.

O leitor da Equatorial ainda mora em `equatorial/`, onde nasceu: é o caminho
de sempre, e continua sendo o de quem não foi reconhecido por outro.
"""

from __future__ import annotations

import re

from ..equatorial.fatura import sem_acentos
from . import cpfl

#: Menos que isto de texto e o PDF é uma imagem: foto ou escaneado.
TEXTO_MINIMO = 200

#: Grupos que imprimem o nome na fatura e ainda não têm leitor. Reconhecê-los
#: é o que deixa a mensagem dizer "ainda não lemos esta distribuidora", em vez
#: de "não parece uma fatura".
SEM_LEITOR = (
    r"NEOENERGIA", r"\bENEL\b", r"\bCEMIG\b", r"\bCOPEL\b", r"ENERGISA",
    r"\bCELESC\b", r"\bEDP\b", r"LIGHT SERVICOS DE ELETRICIDADE",
)


def identificar(texto: str) -> str:
    """``imagem``, ``cpfl``, ``sem_leitor`` ou ``equatorial``."""
    if len((texto or "").strip()) < TEXTO_MINIMO:
        return "imagem"
    if cpfl.reconhece(texto):
        return "cpfl"
    normalizado = sem_acentos(texto)
    if "EQUATORIAL" not in normalizado and any(
        re.search(marca, normalizado) for marca in SEM_LEITOR
    ):
        return "sem_leitor"
    return "equatorial"
