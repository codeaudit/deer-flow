# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from typing import Optional, Dict
from langgraph.prebuilt import create_react_agent

from src.prompts import apply_prompt_template
from src.llms.llm import get_llm_by_type
from src.config.agents import AGENT_LLM_MAP


# Create agents using configured LLM types
def create_agent(
    agent_name: str,
    agent_type: str,
    tools: list,
    prompt_template: str,
    configurable=None,
    selected_models: Optional[Dict[str, str]] = None,
):
    """Factory function to create agents with consistent configuration."""

    # Get the LLM type for this agent
    llm_type = AGENT_LLM_MAP.get(agent_type)
    if not llm_type:
        raise ValueError(f"Unknown agent type: {agent_type}")

    # Get the specific model ID if provided
    model_id = None
    if selected_models and llm_type in selected_models:
        model_id = selected_models[llm_type]

    # Get the LLM instance with optional model selection
    model = get_llm_by_type(llm_type, model_id)

    return create_react_agent(
        name=agent_name,
        model=model,
        tools=tools,
        prompt=lambda state: apply_prompt_template(
            prompt_template, state, configurable
        ),
    )
