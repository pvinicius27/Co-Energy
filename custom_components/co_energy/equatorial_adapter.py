"""Structural adapter for the raw official Equatorial JSON document."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
from typing import Any


class EquatorialAdapterError(ValueError):
    """Raised when the Equatorial document cannot be read or validated."""


@dataclass(frozen=True)
class EquatorialDocument:
    """Structurally known root fields with their original values preserved."""

    schema_version: Any
    generated_at: Any
    processing: Any
    unidentified_documents: Any
    units: Mapping[str, Any]


def parse_equatorial_document(raw: Any) -> EquatorialDocument:
    """Validate minimal structure and map known root field names."""
    if not isinstance(raw, Mapping):
        raise EquatorialAdapterError("Equatorial document root must be a mapping")
    if "schema_version" not in raw:
        raise EquatorialAdapterError("missing required field: schema_version")
    if "unidades" not in raw:
        raise EquatorialAdapterError("missing required field: unidades")

    units = raw["unidades"]
    if not isinstance(units, Mapping):
        raise EquatorialAdapterError("unidades must be a mapping")
    for unit_id, unit in units.items():
        if not isinstance(unit, Mapping):
            raise EquatorialAdapterError(f"unit {unit_id!r} must be a mapping")
        if "faturas" not in unit:
            continue
        bills = unit["faturas"]
        if not isinstance(bills, list):
            raise EquatorialAdapterError(f"unit {unit_id!r} faturas must be a list")
        for index, bill in enumerate(bills):
            if not isinstance(bill, Mapping):
                raise EquatorialAdapterError(
                    f"unit {unit_id!r} faturas[{index}] must be a mapping"
                )

    return EquatorialDocument(
        schema_version=raw["schema_version"],
        generated_at=raw.get("gerado_em"),
        processing=raw.get("processamento"),
        unidentified_documents=raw.get("documentos_nao_identificados"),
        units=units,
    )


#: O prefixo que o extrator mistura ao numero antes do hash. Ele e parte do
#: contrato com o extrator, nao um detalhe daqui: mudar um lado sem o outro
#: faz toda fatura deixar de ter dono.
UC_HASH_SALT = "equatorial-v6:"
UC_HASH_PREFIX = "sha256:"
_DIGITOS = frozenset("0123456789")


def uc_digits(value: Any) -> str:
    """Return only the digits of a UC, the way the extractor normalizes it.

    A distribuidora imprime a UC com pontos, tracos e espacos que mudam de
    fatura para fatura; o numero e o mesmo. Quem digita tambem pode copiar
    de qualquer um desses jeitos.
    """
    if value is None or isinstance(value, bool):
        return ""
    return "".join(c for c in str(value) if c in _DIGITOS)


def uc_hash(value: Any) -> str | None:
    """Return the hash the extractor writes in ``identificacao.uc_hash``."""
    digitos = uc_digits(value)
    if not digitos:
        return None
    return UC_HASH_PREFIX + hashlib.sha256(
        (UC_HASH_SALT + digitos).encode()
    ).hexdigest()


_HEX = frozenset("0123456789abcdef")


def is_uc_hash(value: Any) -> bool:
    """Say whether a value has the exact shape the extractor writes."""
    return (
        isinstance(value, str)
        and value.startswith(UC_HASH_PREFIX)
        and len(value) == len(UC_HASH_PREFIX) + 64
        and set(value[len(UC_HASH_PREFIX):]) <= _HEX
    )


def get_bill_uc_hash(bill: Any) -> str | None:
    """Return the UC hash one raw bill declares, or None."""
    if not isinstance(bill, Mapping):
        return None
    identificacao = bill.get("identificacao")
    if not isinstance(identificacao, Mapping):
        return None
    value = identificacao.get("uc_hash")
    return value if isinstance(value, str) and value else None


def load_equatorial_document(path: str | Path) -> EquatorialDocument:
    """Load a UTF-8 JSON file and parse its minimal structure."""
    file_path = Path(path)
    try:
        with file_path.open("r", encoding="utf-8") as file:
            raw = json.load(file)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise EquatorialAdapterError(
            f"could not load Equatorial document from {file_path}"
        ) from error
    return parse_equatorial_document(raw)


def get_unit_definition(
    document: EquatorialDocument, unit_id: str
) -> Mapping[str, Any]:
    """Return one original unit mapping."""
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise EquatorialAdapterError("unit_id must be a non-empty string")
    if unit_id not in document.units:
        raise EquatorialAdapterError(f"unknown Equatorial unit: {unit_id}")
    return document.units[unit_id]


def get_unit_connection_type(
    document: EquatorialDocument, unit_id: str
) -> str | None:
    """Return the connection type the invoice publishes for one unit.

    O tipo de ligacao decide o custo de disponibilidade. Ele vem da fatura, e
    nao da configuracao, porque a distribuidora e quem o define — declara-lo
    tambem no YAML criaria duas versoes da mesma verdade.
    """
    unit = get_unit_definition(document, unit_id)
    profile = unit.get("perfil")
    if not isinstance(profile, Mapping):
        return None
    value = profile.get("tipo_ligacao")
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip().lower()


def get_unit_bills(
    document: EquatorialDocument, unit_id: str
) -> tuple[Mapping[str, Any], ...]:
    """Return original bill mappings in their declared order."""
    unit = get_unit_definition(document, unit_id)
    bills = unit.get("faturas")
    if bills is None:
        return ()
    return tuple(bills)
