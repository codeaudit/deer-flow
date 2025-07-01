# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import os
import ssl
import httpx

from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek
from typing import get_args

from src.config import load_yaml_config
from src.config.agents import LLMType

# Cache for LLM instances - now keyed by (llm_type, model_id)
_llm_cache: dict[tuple[LLMType, str, Optional[int]], ChatOpenAI] = {}


# Model metadata structure
class ModelInfo:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id", "")
        self.name = data.get("name", "")
        self.model = data.get("model", "")
        self.base_url = data.get("base_url", "")
        self.api_key = data.get("api_key", "")
        self.provider = data.get("provider", "Unknown")
        self.context_window = data.get("context_window", 4096)
        self.verify_ssl = data.get("verify_ssl", True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "model": self.model,
            "provider": self.provider,
            "context_window": self.context_window,
        }


def _get_config_file_path() -> str:
    """Get the path to the configuration file."""
    return str((Path(__file__).parent.parent.parent / "conf.yaml").resolve())


def _get_llm_type_config_keys() -> dict[str, str]:
    """Get mapping of LLM types to their configuration keys."""
    return {
        "reasoning": "REASONING_MODELS",
        "basic": "BASIC_MODELS",
        "vision": "VISION_MODELS",
    }


def _get_legacy_llm_type_config_keys() -> dict[str, str]:
    """Get mapping of LLM types to their legacy configuration keys."""
    return {
        "reasoning": "REASONING_MODEL",
        "basic": "BASIC_MODEL",
        "vision": "VISION_MODEL",
    }


def _get_env_llm_conf(llm_type: str) -> Dict[str, Any]:
    """
    Get LLM configuration from environment variables.
    Environment variables should follow the format: {LLM_TYPE}__{KEY}
    e.g., BASIC_MODEL__api_key, BASIC_MODEL__base_url
    """
    prefix = f"{llm_type.upper()}_MODEL__"
    conf = {}
    for key, value in os.environ.items():
        if key.startswith(prefix):
            conf_key = key[len(prefix) :].lower()
            conf[conf_key] = value
    return conf


def _convert_legacy_config_to_new_format(
    legacy_conf: Dict[str, Any], llm_type: str
) -> List[Dict[str, Any]]:
    """Convert legacy single-model config to new multi-model format."""
    if not legacy_conf:
        return []

    # Generate an ID based on the model name
    model_name = legacy_conf.get("model", f"{llm_type}_model")
    model_id = model_name.replace("-", "_").replace(".", "_")

    new_config = {"id": model_id, "name": model_name, **legacy_conf}
    return [new_config]


def _get_models_for_type(llm_type: LLMType, conf: Dict[str, Any]) -> List[ModelInfo]:
    """Get all models configured for a specific LLM type."""
    llm_type_config_keys = _get_llm_type_config_keys()
    legacy_config_keys = _get_legacy_llm_type_config_keys()

    # Try new format first
    config_key = llm_type_config_keys.get(llm_type)
    models_conf = conf.get(config_key, []) if config_key else []

    # If no models in new format, try legacy format
    if not models_conf:
        legacy_key = legacy_config_keys.get(llm_type)
        legacy_conf = conf.get(legacy_key, {}) if legacy_key else {}
        if legacy_conf:
            models_conf = _convert_legacy_config_to_new_format(legacy_conf, llm_type)

    # Get environment variable configuration
    env_conf = _get_env_llm_conf(llm_type)

    # If we have env config but no YAML config, create a default model
    if env_conf and not models_conf:
        env_model_id = f"{llm_type}_env"
        env_model_name = env_conf.get("model", f"{llm_type.title()} Environment Model")
        models_conf = [{"id": env_model_id, "name": env_model_name, **env_conf}]

    # Apply environment overrides to each model
    model_infos = []
    for model_conf in models_conf:
        if isinstance(model_conf, dict):
            # Merge with environment config (env takes precedence)
            merged_conf = {**model_conf, **env_conf}
            model_infos.append(ModelInfo(merged_conf))

    return model_infos


def _create_llm_from_model_info(
    model_info: ModelInfo,
    llm_type: LLMType,
    model_parameters: Optional[Dict[str, Any]] = None,
) -> ChatOpenAI | ChatDeepSeek:
    """Create LLM instance from model info with optional parameter overrides."""
    llm_conf = {
        "model": model_info.model,
        "api_key": model_info.api_key,
    }

    if model_info.base_url:
        if llm_type == "reasoning":
            llm_conf["api_base"] = model_info.base_url
        else:
            llm_conf["base_url"] = model_info.base_url

    # Apply model parameters if provided
    if model_parameters:
        # Apply supported parameters
        if "temperature" in model_parameters:
            llm_conf["temperature"] = model_parameters["temperature"]
        if "max_tokens" in model_parameters:
            llm_conf["max_tokens"] = int(model_parameters["max_tokens"])
        if "top_p" in model_parameters:
            llm_conf["top_p"] = model_parameters["top_p"]
        if "frequency_penalty" in model_parameters:
            llm_conf["frequency_penalty"] = model_parameters["frequency_penalty"]

    # Handle SSL verification settings
    if not model_info.verify_ssl:
        http_client = httpx.Client(verify=False)
        http_async_client = httpx.AsyncClient(verify=False)
        llm_conf["http_client"] = http_client
        llm_conf["http_async_client"] = http_async_client

    return (
        ChatOpenAI(**llm_conf) if llm_type != "reasoning" else ChatDeepSeek(**llm_conf)
    )


def get_available_models_for_type(llm_type: LLMType) -> List[ModelInfo]:
    """Get all available models for a specific LLM type."""
    try:
        conf = load_yaml_config(_get_config_file_path())
        return _get_models_for_type(llm_type, conf)
    except Exception as e:
        print(f"Warning: Failed to load models for {llm_type}: {e}")
        return []


def get_llm_by_type(
    llm_type: LLMType,
    model_id: Optional[str] = None,
    model_parameters: Optional[Dict[str, Any]] = None,
) -> ChatOpenAI:
    """
    Get LLM instance by type, optional model ID, and optional parameters.
    If no model_id is provided, uses the first available model for the type.
    """
    models = get_available_models_for_type(llm_type)
    if not models:
        raise ValueError(f"No models configured for LLM type: {llm_type}")

    # If no specific model requested, use the first one
    if model_id is None:
        model_info = models[0]
        selected_model_id = model_info.id
    else:
        # Find the requested model
        model_info = None
        for model in models:
            if model.id == model_id:
                model_info = model
                break

        if model_info is None:
            # Fallback to first model if requested model not found
            print(f"Warning: Model {model_id} not found for {llm_type}, using default")
            model_info = models[0]
            selected_model_id = model_info.id
        else:
            selected_model_id = model_id

    # Check cache first (include parameters in cache key)
    params_hash = (
        hash(str(sorted(model_parameters.items()))) if model_parameters else None
    )
    cache_key = (llm_type, selected_model_id, params_hash)
    if cache_key in _llm_cache:
        return _llm_cache[cache_key]

    # Create and cache the LLM
    llm = _create_llm_from_model_info(model_info, llm_type, model_parameters)
    _llm_cache[cache_key] = llm
    return llm


def get_llm_by_model_id(model_id: str, llm_type: LLMType) -> ChatOpenAI:
    """Get LLM instance by specific model ID and type."""
    return get_llm_by_type(llm_type, model_id)


def get_configured_llm_models() -> dict[str, list[dict[str, Any]]]:
    """
    Get all configured LLM models grouped by type with their metadata.

    Returns:
        Dictionary mapping LLM type to list of model information.
    """
    try:
        configured_models: dict[str, list[dict[str, Any]]] = {}

        for llm_type in get_args(LLMType):
            models = get_available_models_for_type(llm_type)
            if models:
                configured_models[llm_type] = [model.to_dict() for model in models]

        return configured_models

    except Exception as e:
        # Log error and return empty dict to avoid breaking the application
        print(f"Warning: Failed to load LLM configuration: {e}")
        return {}


def get_default_model_id_for_type(llm_type: LLMType) -> Optional[str]:
    """Get the default model ID for a given LLM type (first in the list)."""
    models = get_available_models_for_type(llm_type)
    return models[0].id if models else None


def clear_llm_cache():
    """Clear the LLM cache. Useful for testing or config reloads."""
    global _llm_cache
    _llm_cache.clear()


# Legacy compatibility - keep the original function signature
def _create_llm_use_conf(
    llm_type: LLMType, conf: Dict[str, Any]
) -> ChatOpenAI | ChatDeepSeek:
    """Legacy function for backward compatibility."""
    models = _get_models_for_type(llm_type, conf)
    if not models:
        raise ValueError(f"No configuration found for LLM type: {llm_type}")

    return _create_llm_from_model_info(models[0], llm_type)


# In the future, we will use reasoning_llm and vl_llm for different purposes
# reasoning_llm = get_llm_by_type("reasoning")
# vl_llm = get_llm_by_type("vision")
