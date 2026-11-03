"""As concessionárias que a integração sabe ler, uma pasta por grupo.

Cada grupo tem o próprio leitor, porque o layout da fatura é do grupo:
``equatorial/``, ``cpfl/``, ``neoenergia/``. Todos entregam o mesmo documento
(`docs/contrato-extrator.md`), e é por isso que nada depois daqui sabe de qual
distribuidora a fatura veio. Este módulo decide qual leitor lê cada PDF; a
Equatorial continua sendo o caminho de quem não foi reconhecido por outro.
"""

from __future__ import annotations

import re

from .cpfl import fatura as cpfl
from .equatorial.fatura import sem_acentos
from .neoenergia import fatura as neoenergia

#: Menos que isto de texto e o PDF é uma imagem: foto ou escaneado. Uma
#: fatura digital tem milhares de caracteres (as conferidas: 3.700 a 5.700);
#: uma foto com o cabeçalho em texto chegou a 438.
TEXTO_MINIMO = 1000

#: Leitores no formato novo: cada um tem ``reconhece(texto)`` e
#: ``ler(caminho) -> (fatura, número da UC)``.
LEITORES = {"cpfl": cpfl, "neoenergia": neoenergia}

#: Grupos que imprimem o nome na fatura e ainda não têm leitor. Reconhecê-los
#: é o que deixa a mensagem dizer "ainda não lemos esta distribuidora", em vez
#: de "não parece uma fatura".
SEM_LEITOR = (
    r"\bENEL\b", r"\bCEMIG\b", r"\bCOPEL\b", r"ENERGISA",
    r"\bCELESC\b", r"\bEDP\b", r"LIGHT SERVICOS DE ELETRICIDADE",
)


def identificar(texto: str) -> str:
    """``imagem``, um dos ``LEITORES``, ``sem_leitor`` ou ``equatorial``."""
    if len((texto or "").strip()) < TEXTO_MINIMO:
        return "imagem"
    for nome, leitor in LEITORES.items():
        if leitor.reconhece(texto):
            return nome
    normalizado = sem_acentos(texto)
    if "EQUATORIAL" not in normalizado and any(
        re.search(marca, normalizado) for marca in SEM_LEITOR
    ):
        return "sem_leitor"
    return "equatorial"
