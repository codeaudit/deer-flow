# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
from dataclasses import dataclass, field, fields
from typing import Any, Optional, Dict

from src.rag.retriever import Resource
from src.config.report_style import ReportStyle


@dataclass(kw_only=True)
class Configuration:
    """The configurable fields."""

    resources: list[Resource] = field(
        default_factory=list
    )  # Resources to be used for the research
    max_plan_iterations: int = 1  # Maximum number of plan iterations
    max_step_num: int = 3  # Maximum number of steps in a plan
    max_search_results: int = 3  # Maximum number of search results
    mcp_settings: Optional[dict] = None  # MCP settings, including dynamic loaded tools
    report_style: str = ReportStyle.ACADEMIC.value  # Report style
    enable_deep_thinking: bool = False  # Whether to enable deep thinking
    custom_prompts: Optional[Dict[str, str]] = None  # Custom prompts for agents
    selected_models: Optional[Dict[str, str]] = (
        None  # Runtime model selection: {"basic": "model_id", "reasoning": "model_id"}
    )
    model_parameters: Optional[Dict[str, Dict[str, float]]] = (
        None  # Model parameters: {"model_id": {"temperature": 0.7, "max_tokens": 2048}}
    )

    @classmethod
    def from_runnable_config(cls, config: Optional[dict] = None) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        return cls(**{k: v for k, v in values.items() if v})
