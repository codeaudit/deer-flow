# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
import dataclasses
from datetime import datetime
from typing import Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape, Template
from src.config.configuration import Configuration

# Initialize Jinja2 environment
env = Environment(
    loader=FileSystemLoader(os.path.dirname(__file__)),
    autoescape=select_autoescape(),
    trim_blocks=True,
    lstrip_blocks=True,
)


def get_prompt_template(prompt_name: str) -> str:
    """
    Load and return a prompt template using Jinja2.

    Args:
        prompt_name: Name of the prompt template file (without .md extension)

    Returns:
        The template string with proper variable substitution syntax
    """
    try:
        template = env.get_template(f"{prompt_name}.md")
        return template.render()
    except Exception as e:
        raise ValueError(f"Error loading template {prompt_name}: {e}")


def apply_prompt_template(
    prompt_name: str, state: dict, configurable: Optional[Configuration] = None
) -> list:
    """
    Apply template variables to a prompt template and return formatted messages.

    Args:
        prompt_name: Name of the prompt template to use
        state: Current agent state containing variables to substitute
        configurable: Configuration object with custom prompts (optional)

    Returns:
        List of messages with the system prompt as the first message
    """
    # Convert state to dict for template rendering
    state_vars = {
        "CURRENT_TIME": datetime.now().strftime("%a %b %d %Y %H:%M:%S %z"),
        **state,
    }

    # Add configurable variables
    if configurable:
        state_vars.update(dataclasses.asdict(configurable))

    # Context window management for messages
    messages = state.get("messages", [])
    max_messages = 20  # Limit conversation history
    if len(messages) > max_messages:
        # Keep first few messages (important context) and recent messages
        important_messages = messages[:3]  # Keep initial context
        recent_messages = messages[-(max_messages - 3) :]  # Keep recent conversation
        truncated_messages = important_messages + recent_messages
        print(
            f"Context management: Truncated messages from {len(messages)} to {len(truncated_messages)}"
        )
        messages = truncated_messages

    try:
        # Check if we have custom prompts from configuration
        custom_prompts = (
            getattr(configurable, "custom_prompts", None) if configurable else None
        )

        if custom_prompts and prompt_name in custom_prompts:
            # Use custom prompt from settings
            custom_prompt_content = custom_prompts[prompt_name]
            if custom_prompt_content and custom_prompt_content.strip():
                template = Template(custom_prompt_content)
                system_prompt = template.render(**state_vars)
                return [{"role": "system", "content": system_prompt}] + messages

        # Fall back to default template file
        template = env.get_template(f"{prompt_name}.md")
        system_prompt = template.render(**state_vars)
        return [{"role": "system", "content": system_prompt}] + messages
    except Exception as e:
        raise ValueError(f"Error applying template {prompt_name}: {e}")
