"""Explicit public serializer for the live measurements contract.

O mesmo formato de medicao que o overview ja publica, sozinho. Existe para a
interface poder reler so as grandezas instantaneas quando um sensor muda, sem
arrastar ciclo, previsao e fatura junto — o overview inteiro para atualizar
tres numeros.

O valor viaja ja convertido para a unidade que o modelo declara, porque quem
converte e o `logical_state`. A interface nunca le a entidade direto: ate a
troca de 12/09/2026 a corrente da geradora vinha em mA e era publicada em A,
e uma segunda copia dessa regra no frontend seria a chance de as duas
discordarem na proxima entidade que precisar de conversao.
"""

from __future__ import annotations

from datetime import datetime
import math
from typing import Any

from .logical_state import LogicalStateResult
from .quality_evidence import build_measurement_evidence
from .unit_overview_serializer import serialize_measurement_evidence


class MeasurementsSerializationError(ValueError):
    """Raised when live measurements cannot be serialized safely."""


def _optional_string(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise MeasurementsSerializationError(
            f"{field} must be a non-empty string or None"
        )
    return value


def _optional_number(value: Any, field: str) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise MeasurementsSerializationError(f"{field} must be numeric or None")
    numeric = float(value)
    if not math.isfinite(numeric):
        raise MeasurementsSerializationError(f"{field} must be finite")
    return numeric


def _optional_instant(value: Any, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, datetime) or value.tzinfo is None:
        raise MeasurementsSerializationError(f"{field} must be an aware datetime")
    return value.isoformat()


def _required_bool(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        raise MeasurementsSerializationError(f"{field} must be a boolean")
    return value


def serialize_measurement(value: Any, field: str) -> dict[str, Any]:
    """Serialize one logical state through an explicit allowlist.

    O `entity_id` fica de fora de proposito: a interface identifica a medicao
    pelo `logical_id`, e expor a entidade abriria a porta para o card ler o
    estado cru, sem a conversao de unidade que o backend aplica.
    """
    if not isinstance(value, LogicalStateResult):
        raise MeasurementsSerializationError(f"{field} must be a LogicalStateResult")
    return {
        "logical_id": value.logical_id,
        "label": value.label,
        "quantity": value.quantity,
        "unit": value.unit,
        "state_unit": value.state_unit,
        "value": _optional_number(value.value, f"{field}.value"),
        "available": _required_bool(value.available, f"{field}.available"),
        "last_changed": _optional_instant(value.last_changed, f"{field}.last_changed"),
        "last_updated": _optional_instant(value.last_updated, f"{field}.last_updated"),
        "validation_required": _required_bool(
            value.validation_required, f"{field}.validation_required"
        ),
        "validation_note": _optional_string(
            value.validation_note, f"{field}.validation_note"
        ),
        "unit_mismatch": _required_bool(
            value.unit_mismatch, f"{field}.unit_mismatch"
        ),
    }


def serialize_measurements(unit_id: str, measurements: Any) -> dict[str, Any]:
    """Serialize the live measurements of one unit."""
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise MeasurementsSerializationError("unit_id must be a non-empty string")
    if isinstance(measurements, (str, bytes)) or not isinstance(
        measurements, (list, tuple)
    ):
        raise MeasurementsSerializationError("measurements must be a sequence")
    return {
        "unit_id": unit_id,
        "measurements": [
            serialize_measurement(item, f"measurements[{index}]")
            for index, item in enumerate(measurements)
        ],
        # A mesma evidencia que o overview publica em quality_evidence, para a
        # interface poder trocar as duas coisas juntas. Sem isso o alerta de
        # "sensor sem leitura" continuava vivo depois de o sensor voltar: ele
        # le a evidencia, que so era relida no overview inteiro, e esse tem
        # cache. Derivar de novo no frontend produziria uma segunda versao
        # desta regra, capaz de discordar desta.
        "measurement_evidence": [
            serialize_measurement_evidence(
                build_measurement_evidence(item),
                f"measurement_evidence[{index}]",
            )
            for index, item in enumerate(measurements)
        ],
    }
