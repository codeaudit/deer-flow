# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from src.graph import build_graph
from src.auth.billing import (
    check_billing_status,
    create_workflow_execution,
    update_workflow_execution,
)
from src.graph.types import State
from langchain_core.runnables import RunnableConfig
from src.config.configuration import Configuration
from langchain_core.messages import HumanMessage, AIMessage
from src.prompts.planner_model import Plan

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Default level is INFO
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


def enable_debug_logging():
    """Enable debug level logging for more detailed execution information."""
    logging.getLogger("src").setLevel(logging.DEBUG)


logger = logging.getLogger(__name__)

# Create the graph
graph = build_graph()


async def run_agent_workflow_async(
    user_input: str,
    user_id: str,  # Add user_id parameter
    debug: bool = False,
    max_plan_iterations: int = 1,
    max_step_num: int = 3,
    enable_background_investigation: bool = False,
    locale: str = "en",
) -> State:
    """Run the agent workflow asynchronously."""
    try:
        # Check billing status
        can_run, message = await check_billing_status(user_id)
        if not can_run:
            raise ValueError(message)

        # Create workflow execution record
        thread_id = str(uuid.uuid4())
        execution_id = await create_workflow_execution(user_id, thread_id)

        # Create initial state
        state = State(
            {
                "messages": [HumanMessage(content=user_input)],
                "plan_iterations": 0,
                "final_report": "",
                "current_plan": "",  # Empty string as initial value
                "observations": [],
                "auto_accepted_plan": True,
                "enable_background_investigation": enable_background_investigation,
                "research_topic": user_input,
                "locale": locale,
                "max_plan_iterations": max_plan_iterations,
                "max_step_num": max_step_num,
                "thread_id": thread_id,
                "execution_id": execution_id,
                "user_id": user_id,
            }
        )

        # Create config
        config = RunnableConfig(
            configurable={
                "max_plan_iterations": max_plan_iterations,
                "max_step_num": max_step_num,
                "enable_background_investigation": enable_background_investigation,
                "locale": locale,
                "thread_id": thread_id,
                "execution_id": execution_id,
                "user_id": user_id,
            }
        )

        # Enable debug logging if requested
        if debug:
            enable_debug_logging()

        # Run the graph
        try:
            final_state = await graph.astream(state, config=config).__anext__()
            await update_workflow_execution(execution_id, "completed")
            return final_state
        except Exception as e:
            await update_workflow_execution(execution_id, "failed", str(e))
            raise

    except Exception as e:
        logger.error(f"Error running workflow: {str(e)}")
        raise


if __name__ == "__main__":
    print(graph.get_graph(xray=True).draw_mermaid())
