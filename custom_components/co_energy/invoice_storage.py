"""As faturas lidas pela integracao, guardadas no storage do Home Assistant.

Ate aqui as faturas moravam num arquivo em ``/local/``, escrito por um
extrator que rodava no Windows. Agora a propria integracao le o PDF, e o que
ela le fica aqui: no storage, que e privado, e com uma copia JSON numa pasta
que tambem e (``AGENTS.md`` §19).

Tres coisas ficam guardadas, e nenhuma e o PDF:

* as faturas lidas, no formato interno — o que a consolidacao da unidade
  precisa ainda esta nelas;
* os quatro ultimos digitos de cada UC vista, para a tela mostrar qual e
  qual sem guardar o numero inteiro;
* se o operador ja confirmou usar estas faturas no lugar do arquivo. Nao e
  automatico de proposito: primeiro se extrai e se compara, depois se vira a
  chave.

De quem e cada fatura nao fica aqui. Isso e do modelo, pela UC, e e decidido
a cada leitura — corrigir o dono de uma UC move todas as faturas dela sem
reler nada.
"""

from __future__ import annotations

import asyncio
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime
import json
import logging
from pathlib import Path
import tempfile
from typing import Any, Mapping

from .billing import declared_uc_hashes
from .equatorial_adapter import (
    EquatorialAdapterError,
    EquatorialDocument,
    get_bill_uc_hash,
    parse_equatorial_document,
    uc_digits,
)

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = "co_energy.invoices"
STORAGE_VERSION = 1

#: Onde fica a copia JSON, relativa a pasta de configuracao do HA. Fora de
#: ``www``: o que esta la e servido sem login.
COPY_FOLDER = "co_energy/faturas"
COPY_PREFIX = "faturas_energia_v6_"
COPY_KEEP = 12

#: Uma fatura da Equatorial tem por volta de 1 MB. O teto existe para um
#: arquivo errado nao ocupar a memoria do Home Assistant.
MAX_PDF_BYTES = 15 * 1024 * 1024


class InvoiceStorageError(ValueError):
    """Raised when an invoice cannot be read or kept."""


@dataclass(frozen=True)
class StoredInvoices:
    """O que esta guardado. Vazio significa "ainda nao se extraiu nada aqui"."""

    faturas: tuple[Mapping[str, Any], ...] = ()
    ucs_vistas: Mapping[str, str] = field(default_factory=dict)
    em_uso: bool = False
    updated_at: datetime | None = None


def serialize_stored_invoices(stored: StoredInvoices) -> dict[str, Any]:
    return {
        "faturas": [dict(f) for f in stored.faturas],
        "ucs_vistas": dict(stored.ucs_vistas),
        "em_uso": stored.em_uso,
        "updated_at": stored.updated_at.isoformat() if stored.updated_at else None,
    }


def deserialize_stored_invoices(raw: Any) -> StoredInvoices:
    """Read what the Store returned; nothing stored reads as empty."""
    if raw is None:
        return StoredInvoices()
    if not isinstance(raw, Mapping):
        raise InvoiceStorageError("stored invoices must be a mapping")
    faturas = raw.get("faturas")
    if faturas is None:
        faturas = []
    if not isinstance(faturas, list) or not all(isinstance(f, Mapping) for f in faturas):
        raise InvoiceStorageError("stored invoices must be a list of mappings")
    vistas = raw.get("ucs_vistas")
    if vistas is None:
        vistas = {}
    if not isinstance(vistas, Mapping):
        raise InvoiceStorageError("ucs_vistas must be a mapping")
    atualizado = raw.get("updated_at")
    try:
        quando = datetime.fromisoformat(atualizado) if atualizado else None
    except (TypeError, ValueError) as error:
        raise InvoiceStorageError("updated_at is not a datetime") from error
    return StoredInvoices(
        faturas=tuple(_sem_identificador_no_nome(f) for f in faturas),
        ucs_vistas={str(k): str(v) for k, v in vistas.items()},
        em_uso=raw.get("em_uso") is True,
        updated_at=quando,
    )


def mask_long_numbers(texto: str) -> str:
    """Hide every long number but its last four digits.

    Quem salva a fatura costuma por a UC no nome do arquivo — "01-26 <UC>.pdf"
    —, e o nome vai para dentro da fatura. Guardar a UC so como hash nao
    adiantaria se ela viajasse inteira no nome. Seis digitos ou mais sao
    tratados como identificador; datas e contadores curtos ficam como estao.
    """
    saida, corrida = [], []

    def fecha():
        if len(corrida) >= 6:
            saida.append("•" * (len(corrida) - 4) + "".join(corrida[-4:]))
        else:
            saida.append("".join(corrida))
        corrida.clear()

    for caractere in str(texto):
        if caractere in "0123456789":
            corrida.append(caractere)
        else:
            fecha()
            saida.append(caractere)
    fecha()
    return "".join(saida)


def _sem_identificador_no_nome(fatura: Mapping[str, Any]) -> dict[str, Any]:
    """The same bill, with the file name masked. The original is not changed."""
    copia = dict(fatura)
    extracao = copia.get("extracao")
    arquivo = extracao.get("arquivo") if isinstance(extracao, Mapping) else None
    if isinstance(arquivo, Mapping) and isinstance(arquivo.get("nome"), str):
        copia["extracao"] = {
            **extracao, "arquivo": {**arquivo, "nome": mask_long_numbers(arquivo["nome"])},
        }
    return copia


def digest_of(fatura: Mapping[str, Any]) -> str | None:
    """The sha256 of the PDF the bill came from: the same PDF is the same bill."""
    arquivo = (fatura.get("extracao") or {}).get("arquivo") or {}
    valor = arquivo.get("sha256")
    return valor if isinstance(valor, str) and valor else None


def _nome_seguro(nome: Any) -> str:
    """Only the file name, never a path, and always ending in .pdf.

    O nome vai para dentro da fatura (``extracao.arquivo.nome``), como no
    extrator de antes. Um caminho ali levaria o disco de quem enviou para o
    documento, e e exatamente o que a validacao do documento recusa.
    """
    texto = str(nome or "fatura.pdf").replace("\\", "/").rsplit("/", 1)[-1].strip()
    if not texto.lower().endswith(".pdf"):
        raise InvoiceStorageError("only PDF files are accepted")
    limpo = "".join(c for c in texto if c.isprintable() and c not in '<>:"|?*')
    return mask_long_numbers(limpo) if limpo else "fatura.pdf"


def read_invoice_pdf(dados: bytes, nome: Any) -> tuple[dict[str, Any], str | None]:
    """Read one PDF received from the browser; return the bill and its UC ending.

    O PDF e escrito numa pasta temporaria com o nome original — o motor tira o
    nome do arquivo que le, e o nome e parte do documento — e apagado assim que
    a leitura termina, com ou sem erro. Ele carrega nome, CPF e endereco, e o
    Home Assistant nao tem por que guarda-lo.

    Bloqueia: chame no executor.
    """
    from .concessionarias.equatorial import fatura as motor

    if not isinstance(dados, (bytes, bytearray)) or not dados:
        raise InvoiceStorageError("the file is empty")
    if len(dados) > MAX_PDF_BYTES:
        raise InvoiceStorageError("the file is too large for an invoice")
    if not bytes(dados[:5]) == b"%PDF-":
        raise InvoiceStorageError("the file is not a PDF")
    nome_arquivo = _nome_seguro(nome)

    with tempfile.TemporaryDirectory(prefix="co_energy_") as pasta:
        caminho = Path(pasta) / nome_arquivo
        caminho.write_bytes(bytes(dados))
        # Cada grupo de distribuidoras tem o proprio leitor. O texto decide
        # qual — e diz tambem quando nao ha texto (foto) ou leitor.
        from . import concessionarias
        from .concessionarias.cpfl import fatura as cpfl

        try:
            _paginas, texto = motor.ler_pdf(caminho)
        except Exception as error:  # noqa: BLE001 - PDF que nem abre
            raise InvoiceStorageError(
                f"could not read the invoice: {type(error).__name__}"
            ) from error
        tipo = concessionarias.identificar(texto)
        if tipo == "imagem":
            raise InvoiceStorageError("the PDF has no text")
        if tipo == "sem_leitor":
            raise InvoiceStorageError("no reader for this distributor")
        if tipo == "cpfl":
            try:
                fatura, digitos = cpfl.ler(caminho)
            except cpfl.LeitorCpflError as error:
                raise InvoiceStorageError(str(error)) from error
            except Exception as error:  # noqa: BLE001 - o leitor pode falhar de mil jeitos
                raise InvoiceStorageError(
                    f"could not read the invoice: {type(error).__name__}"
                ) from error
            if not (fatura.get("identificacao") or {}).get("competencia"):
                raise InvoiceStorageError("the invoice reference could not be read")
            return fatura, (digitos or "")[-4:] or None
        try:
            resultado = motor.processar_pdf(str(caminho))
            # O motor nao levanta: marca ERRO e anexa o rastro do erro aos
            # alertas — rastro que traz o caminho da pasta temporaria. Uma
            # fatura assim nao e guardada; o extrator de antes tambem a
            # deixava de fora.
            if resultado.status == "ERRO":
                raise InvoiceStorageError("could not read the invoice")
            fatura = motor.resultado_para_v6(resultado)
        except InvoiceStorageError:
            raise
        except Exception as error:  # noqa: BLE001 - o motor pode falhar de mil jeitos
            raise InvoiceStorageError(
                f"could not read the invoice: {type(error).__name__}"
            ) from error

    if not (fatura.get("identificacao") or {}).get("competencia"):
        raise InvoiceStorageError("the invoice reference could not be read")
    final = uc_digits(resultado.unidade_consumidora_fatura)[-4:] or None
    return fatura, final


def build_invoice_document(
    faturas: Any, model: Mapping[str, Any], iniciado_em: str | None = None
) -> dict[str, Any]:
    """The schema 6 document of the stored bills, filed by the model's UCs.

    As unidades entram pelo ``billing_key``, que e a chave que o resto da
    integracao usa para achar a fatura de cada uma.
    """
    from .concessionarias.equatorial import fatura as motor

    unidades: dict[str, str] = {}
    for unit_id, unit in (model.get("units") or {}).items():
        if not isinstance(unit, Mapping):
            continue
        chave = unit.get("billing_key") or unit_id
        unidades[chave] = unit.get("name") or unit_id
    dono = {
        valor: chave
        for chave, hashes in declared_uc_hashes(model).items()
        for valor in hashes
    }
    return motor.montar_documento(
        [_sem_identificador_no_nome(f) for f in faturas], unidades, dono, iniciado_em
    )


def _bill_summary(fatura: Mapping[str, Any]) -> dict[str, Any]:
    """O que a tela mostra de uma fatura: mês, consumo, valor e como apagá-la."""
    identificacao = fatura.get("identificacao") or {}
    consumo = fatura.get("consumo") or {}
    faturamento = fatura.get("faturamento") or {}
    return {
        "digest": digest_of(fatura),
        "reference": identificacao.get("referencia"),
        "consumption_kwh": consumo.get("total_kwh"),
        "total_amount": faturamento.get("valor_total"),
    }


def summarize_ucs(
    faturas: Any, ucs_vistas: Mapping[str, str], model: Mapping[str, Any]
) -> list[dict[str, Any]]:
    """Every UC seen in the stored bills, with who owns it and what it covers.

    E a lista que a tela mostra. Uma UC sem dono aparece com ``unit_id``
    vazio — e a pergunta "de qual unidade e esta?".
    """
    dono: dict[str, str] = {}
    for unit_id, unit in (model.get("units") or {}).items():
        for item in (unit.get("ucs") or ()) if isinstance(unit, Mapping) else ():
            if isinstance(item, Mapping) and isinstance(item.get("hash"), str):
                dono[item["hash"]] = unit_id

    por_uc: dict[str, list[Mapping[str, Any]]] = {}
    for fatura in faturas:
        valor = get_bill_uc_hash(fatura)
        if valor:
            por_uc.setdefault(valor, []).append(fatura)

    resumo = []
    for valor, lista in por_uc.items():
        ordenadas = sorted(
            lista, key=lambda f: (f.get("identificacao") or {}).get("competencia") or ""
        )
        primeira = (ordenadas[0].get("identificacao") or {}).get("referencia")
        ultima = (ordenadas[-1].get("identificacao") or {}).get("referencia")
        unit_id = dono.get(valor)
        resumo.append({
            "hash": valor,
            "suffix": ucs_vistas.get(valor),
            "bills": len(lista),
            "first_reference": primeira,
            "last_reference": ultima,
            "unit_id": unit_id,
            # Uma a uma, da mais recente para a mais antiga: é a lista de onde
            # se apaga a fatura que entrou errada.
            "invoices": [_bill_summary(f) for f in reversed(ordenadas)],
        })
    # Sem dono primeiro: e o que pede resposta.
    resumo.sort(key=lambda item: (item["unit_id"] is not None, item["first_reference"] or ""))
    return resumo


_VOLATEIS = frozenset({"gerado_em", "iniciado_em", "concluido_em", "extraido_em"})


def _neutro(valor: Any) -> Any:
    if isinstance(valor, Mapping):
        return {k: ("<t>" if k in _VOLATEIS else _neutro(v)) for k, v in valor.items()}
    if isinstance(valor, list):
        return [_neutro(v) for v in valor]
    return valor


def _comparavel(fatura: Any) -> Any:
    """A bill without what says nothing about the invoice itself.

    O nome do arquivo de origem nao e dado da fatura: e de onde o PDF estava
    no computador de quem enviou, e aqui ele ainda chega mascarado. Compara-lo
    faria toda fatura aparecer como diferente por causa da mascara — um alarme
    sobre nada, no lugar exato onde se decide trocar a fonte.
    """
    if not isinstance(fatura, Mapping):
        return _neutro(fatura)
    extracao = fatura.get("extracao")
    arquivo = extracao.get("arquivo") if isinstance(extracao, Mapping) else None
    if not isinstance(arquivo, Mapping):
        return _neutro(fatura)
    return _neutro({
        **fatura,
        "extracao": {**extracao, "arquivo": {**arquivo, "nome": "<nome>"}},
    })


def _faturas_por_id(documento: EquatorialDocument) -> dict[str, tuple[str, Any]]:
    """documento_id -> (unidade, fatura), across units and unidentified ones."""
    saida: dict[str, tuple[str, Any]] = {}
    for chave, unit in documento.units.items():
        for fatura in (unit.get("faturas") or []) if isinstance(unit, Mapping) else ():
            saida[str(fatura.get("documento_id"))] = (chave, fatura)
    for fatura in documento.unidentified_documents or []:
        if isinstance(fatura, Mapping):
            saida[str(fatura.get("documento_id"))] = ("", fatura)
    return saida


def compare_documents(
    atual: EquatorialDocument, novo: EquatorialDocument
) -> dict[str, Any]:
    """What would change if the stored bills replaced the current file.

    Compara fatura a fatura, pelo ``documento_id`` — o sha256 do PDF —, e nao
    o documento inteiro: o que importa e se cada fatura continua igual e na
    mesma unidade. So a referencia e a unidade saem daqui; o conteudo da
    fatura nunca.
    """
    antes = _faturas_por_id(atual)
    depois = _faturas_por_id(novo)

    def descreve(chave, fatura):
        return {
            "unit": chave or None,
            "reference": (fatura.get("identificacao") or {}).get("referencia"),
        }

    so_no_arquivo = [descreve(*antes[i]) for i in sorted(set(antes) - set(depois))]
    so_no_storage = [descreve(*depois[i]) for i in sorted(set(depois) - set(antes))]
    diferentes = []
    for documento_id in sorted(set(antes) & set(depois)):
        (unidade_a, fatura_a), (unidade_b, fatura_b) = antes[documento_id], depois[documento_id]
        if unidade_a != unidade_b or _comparavel(fatura_a) != _comparavel(fatura_b):
            diferentes.append({
                **descreve(unidade_b, fatura_b),
                "unit_before": unidade_a or None,
            })
    return {
        "equal": not (so_no_arquivo or so_no_storage or diferentes),
        "only_in_file": so_no_arquivo,
        "only_in_storage": so_no_storage,
        "different": diferentes,
        "bills_in_both": len(set(antes) & set(depois)),
    }


def write_invoice_copy(pasta_config: str | Path, documento: Mapping[str, Any], agora: datetime) -> Path:
    """Write the dated JSON copy and keep only the most recent ones.

    Uma copia por dia, sobrescrita a cada gravacao do mesmo dia: uma extracao
    de 34 PDFs grava o storage 34 vezes, e uma copia por gravacao encheria as
    doze vagas com o mesmo lote, apagando justamente as de dias anteriores —
    que sao as que servem para voltar atras.

    Bloqueia: chame no executor.
    """
    pasta = Path(pasta_config) / COPY_FOLDER
    pasta.mkdir(parents=True, exist_ok=True)
    destino = pasta / f"{COPY_PREFIX}{agora.date().isoformat()}.json"
    temporario = destino.with_suffix(".json.tmp")
    temporario.write_text(
        json.dumps(documento, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    temporario.replace(destino)
    copias = sorted(pasta.glob(f"{COPY_PREFIX}*.json"))
    for antiga in copias[:-COPY_KEEP]:
        antiga.unlink(missing_ok=True)
    return destino


async def async_import_invoice(
    hass: Any,
    manager: "InvoiceStorageManager",
    model: Mapping[str, Any],
    nome: Any,
    dados: bytes,
    now: datetime,
) -> dict[str, Any]:
    """Read one PDF, keep the bill, refresh the copy; say what was found.

    A resposta e o que a tela mostra enquanto a pasta vai sendo lida: de que
    mes e a fatura, de que UC, e se essa UC ja tem dono — sem dono, a tela
    pergunta.
    """
    fatura, final = await hass.async_add_executor_job(read_invoice_pdf, dados, nome)
    nova = await manager.async_add(fatura, final, now=now)
    await async_write_copy(hass, manager, model, now)

    valor = get_bill_uc_hash(fatura)
    dono = None
    for unit_id, unit in (model.get("units") or {}).items():
        itens = (unit.get("ucs") or ()) if isinstance(unit, Mapping) else ()
        if any(isinstance(i, Mapping) and i.get("hash") == valor for i in itens):
            dono = unit_id
            break
    extracao = fatura.get("extracao") or {}
    return {
        "new": nova,
        "reference": (fatura.get("identificacao") or {}).get("referencia"),
        "uc_hash": valor,
        "suffix": final,
        "unit_id": dono,
        "status": extracao.get("status"),
        "alerts": len(extracao.get("alertas") or []),
    }


async def async_write_copy(
    hass: Any, manager: "InvoiceStorageManager", model: Mapping[str, Any], now: datetime
) -> str | None:
    """Write today's JSON copy of the stored bills; never fail the caller.

    A copia e uma rede de seguranca. Se ela falhar, a fatura ja esta guardada
    no storage, e recusar a gravacao por causa da copia seria perder o que
    importa por causa do que e reserva.
    """
    faturas = manager.stored.faturas
    if not faturas:
        return None

    def gravar() -> str:
        documento = build_invoice_document(faturas, model)
        return write_invoice_copy(hass.config.path(), documento, now).name

    try:
        return await hass.async_add_executor_job(gravar)
    except Exception:  # noqa: BLE001
        _LOGGER.warning("Could not write the JSON copy of the invoices", exc_info=True)
        return None


class InvoiceStorageManager:
    """Owns the Store and the bills kept in it."""

    def __init__(self, store: Any, stored: StoredInvoices) -> None:
        self._store = store
        self._stored = stored
        # Um PDF de cada vez: duas gravacoes simultaneas perderiam uma fatura.
        self._lock = asyncio.Lock()

    @property
    def stored(self) -> StoredInvoices:
        return self._stored

    def known_digests(self) -> list[str]:
        """What was already read, so the browser only sends what is new."""
        return sorted(d for d in (digest_of(f) for f in self._stored.faturas) if d)

    def document(self, model: Mapping[str, Any]) -> EquatorialDocument:
        """The stored bills as the document the rest of the integration reads.

        Falha como o arquivo falharia — ``EquatorialAdapterError`` —, para
        cada tela continuar tratando a falta do mesmo jeito que ja trata.
        """
        if not self._stored.faturas:
            raise EquatorialAdapterError("no invoice has been read yet")
        try:
            return parse_equatorial_document(
                build_invoice_document(self._stored.faturas, model)
            )
        except EquatorialAdapterError:
            raise
        except Exception as error:  # noqa: BLE001 - qualquer falha e "indisponivel"
            raise EquatorialAdapterError(
                f"stored invoices could not be assembled: {type(error).__name__}"
            ) from error

    async def async_add(
        self, fatura: Mapping[str, Any], final: str | None, *, now: datetime
    ) -> bool:
        """Keep one bill; the same PDF again replaces it. Return True if new."""
        digest = digest_of(fatura)
        if not digest:
            raise InvoiceStorageError("the bill has no file digest")
        async with self._lock:
            atuais = [f for f in self._stored.faturas if digest_of(f) != digest]
            nova = len(atuais) == len(self._stored.faturas)
            vistas = dict(self._stored.ucs_vistas)
            valor = get_bill_uc_hash(fatura)
            if valor and final:
                vistas[valor] = final
            await self._async_save(StoredInvoices(
                faturas=tuple(atuais) + (deepcopy(dict(fatura)),),
                ucs_vistas=vistas,
                em_uso=self._stored.em_uso,
                updated_at=now,
            ))
        return nova

    async def async_remove(self, digest: str, *, now: datetime) -> bool:
        """Apaga a fatura que veio deste PDF. Return True if one was removed.

        Para a fatura que entrou errada — PDF de outra pessoa, leitura ruim.
        Reenviar o mesmo PDF a traz de volta igual: nada aqui é irreversível
        para quem ainda tem o arquivo.
        """
        if not isinstance(digest, str) or not digest:
            raise InvoiceStorageError("the bill to remove is not identified")
        async with self._lock:
            restantes = tuple(
                f for f in self._stored.faturas if digest_of(f) != digest
            )
            if len(restantes) == len(self._stored.faturas):
                return False
            await self._async_save(StoredInvoices(
                faturas=restantes,
                ucs_vistas=self._stored.ucs_vistas,
                # Sem fatura nenhuma, o storage não pode seguir como fonte
                # oficial: a tela ficaria sem dado e sem dizer por quê.
                em_uso=self._stored.em_uso and bool(restantes),
                updated_at=now,
            ))
        return True

    async def async_set_in_use(self, em_uso: bool, *, now: datetime) -> None:
        """Turn the stored bills into the official source, or back to the file."""
        if em_uso and not self._stored.faturas:
            raise InvoiceStorageError("there are no stored invoices to use")
        async with self._lock:
            await self._async_save(StoredInvoices(
                faturas=self._stored.faturas,
                ucs_vistas=self._stored.ucs_vistas,
                em_uso=bool(em_uso),
                updated_at=now,
            ))

    async def _async_save(self, proximo: StoredInvoices) -> None:
        await self._store.async_save(serialize_stored_invoices(proximo))
        self._stored = proximo


async def async_build_invoice_manager(hass: Any) -> InvoiceStorageManager | None:
    """Load the Store; an unreadable one reads as empty, never as a crash.

    Fora do Home Assistant — nos testes, em ferramentas — nao ha Store, e a
    integracao segue lendo o arquivo, como antes.
    """
    try:
        from homeassistant.helpers.storage import Store
    except ImportError:
        return None

    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    try:
        stored = deserialize_stored_invoices(await store.async_load())
    except Exception:  # noqa: BLE001
        # Alto de proposito: aqui se perdem faturas lidas. O arquivo antigo
        # continua valendo, e a proxima extracao as reconstroi.
        _LOGGER.error("Stored invoices could not be read; starting empty", exc_info=True)
        stored = StoredInvoices()
    return InvoiceStorageManager(store, stored)
