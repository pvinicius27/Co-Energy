"""Pure validation for the CoEnergy runtime configuration."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .const import CONF_FINANCIAL_MODEL_PATH, CONF_MODEL_PATH


class CoEnergyRuntimeConfigError(ValueError):
    """Raised when the CoEnergy runtime configuration is invalid."""


def get_runtime_model_path(config: Mapping[str, Any]) -> str:
    """Return the configured energy-model path without interpreting it."""
    if not isinstance(config, Mapping):
        raise CoEnergyRuntimeConfigError("config must be a mapping")

    model_path = config.get(CONF_MODEL_PATH)
    if not isinstance(model_path, str) or not model_path.strip():
        raise CoEnergyRuntimeConfigError(
            f"{CONF_MODEL_PATH} must be a non-empty string"
        )
    return model_path


def get_optional_runtime_model_path(config: Mapping[str, Any]) -> str | None:
    """Return the configured path, or None when there is none.

    Faltar o caminho deixou de ser erro no dia em que o modelo passou a poder
    vir do storage: uma instalacao configurada pela interface nunca teve
    arquivo, e exigir um so para recusa-la depois nao ajudaria ninguem. Quem
    precisa do caminho de verdade continua usando `get_runtime_model_path`.
    """
    if not isinstance(config, Mapping):
        raise CoEnergyRuntimeConfigError("config must be a mapping")
    model_path = config.get(CONF_MODEL_PATH)
    if model_path is None:
        return None
    if not isinstance(model_path, str) or not model_path.strip():
        raise CoEnergyRuntimeConfigError(
            f"{CONF_MODEL_PATH} must be a non-empty string"
        )
    return model_path


def get_runtime_financial_model_path(config: Mapping[str, Any]) -> str | None:
    """Return the optional financial-model path without inferring a default."""
    if not isinstance(config, Mapping):
        raise CoEnergyRuntimeConfigError("config must be a mapping")
    path = config.get(CONF_FINANCIAL_MODEL_PATH)
    if path is None:
        return None
    if not isinstance(path, str) or not path.strip():
        raise CoEnergyRuntimeConfigError(
            f"{CONF_FINANCIAL_MODEL_PATH} must be a non-empty string"
        )
    return path
