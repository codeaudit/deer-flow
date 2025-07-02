# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import logging
import json
import json_repair

logger = logging.getLogger(__name__)


def repair_json_output(content: str) -> str:
    """
    Repair and normalize JSON output.

    Args:
        content (str): String content that may contain JSON

    Returns:
        str: Repaired JSON string, or original content if not JSON
    """
    content = content.strip()

    # Check if content contains JSON (either starts with JSON or has it embedded)
    has_json = (
        content.startswith(("{", "["))
        or "```json" in content
        or "```ts" in content
        or "{" in content
        or "[" in content
    )

    if has_json:
        try:
            # If content is wrapped in ```json code block, extract the JSON part
            if content.startswith("```json"):
                content = content.removeprefix("```json")

            if content.startswith("```ts"):
                content = content.removeprefix("```ts")

            if content.endswith("```"):
                content = content.removesuffix("```")

            # Handle cases where LLM adds prefix text before JSON (e.g., "planner: {...}")
            if not content.strip().startswith(("{", "[")):
                # Find the first occurrence of { or [
                start_idx = -1
                for char in ["{", "["]:
                    idx = content.find(char)
                    if idx != -1 and (start_idx == -1 or idx < start_idx):
                        start_idx = idx

                if start_idx != -1:
                    content = content[start_idx:]

            # Try to repair and parse JSON
            repaired_content = json_repair.loads(content)
            return json.dumps(repaired_content, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"JSON repair failed: {e}")
    return content
