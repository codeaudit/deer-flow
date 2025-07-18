#!/usr/bin/env python3
"""
Script to show the modifications needed for src/workflow.py
This shows the changes needed to integrate billing into deer-flow's workflow system
"""

print(
    """
========================================
deer-flow Workflow Integration Guide
========================================

The following changes need to be made to src/workflow.py:

1. Add imports:
"""
)

print(
    """
# Add these imports at the top of src/workflow.py
import time
import uuid
from src.auth.billing import (
    check_billing_status, 
    create_workflow_execution, 
    update_workflow_execution
)
"""
)

print(
    """
2. Modify the run_agent_workflow_async function:
"""
)

print(
    """
# Replace the existing function signature with:
async def run_agent_workflow_async(
    user_input: str,
    account_id: str,  # Change from user_id to account_id
    debug: bool = False,
    max_plan_iterations: int = 1,
    max_step_num: int = 3,
    enable_background_investigation: bool = False,
    locale: str = "en",
) -> State:
    \"\"\"Run the agent workflow asynchronously with billing integration.\"\"\"
    try:
        # 1. Check billing status BEFORE starting workflow
        can_run, message = await check_billing_status(account_id)
        if not can_run:
            raise ValueError(f"Billing limit reached: {message}")
        
        # 2. Create workflow execution record
        thread_id = str(uuid.uuid4())
        execution_id = await create_workflow_execution(
            account_id, 
            thread_id, 
            'research'  # or determine workflow type from user_input
        )
        
        # 3. Track start time for billing
        start_time = time.time()
        total_tokens = 0
        
        # 4. Create initial state (existing code)
        state = State({
            "messages": [HumanMessage(content=user_input)],
            "plan_iterations": 0,
            "final_report": "",
            "current_plan": "",
            "observations": [],
            "auto_accepted_plan": True,
            "enable_background_investigation": enable_background_investigation,
            "research_topic": user_input,
            "locale": locale,
            "max_plan_iterations": max_plan_iterations,
            "max_step_num": max_step_num,
            "thread_id": thread_id,
            "execution_id": execution_id,
            "account_id": account_id  # Add account_id to state
        })
        
        # 5. Create config (existing code with additions)
        config = RunnableConfig(
            configurable={
                "max_plan_iterations": max_plan_iterations,
                "max_step_num": max_step_num,
                "enable_background_investigation": enable_background_investigation,
                "locale": locale,
                "thread_id": thread_id,
                "execution_id": execution_id,
                "account_id": account_id  # Add account_id to config
            }
        )
        
        # 6. Enable debug logging if requested (existing code)
        if debug:
            enable_debug_logging()
        
        # 7. Run the graph with billing tracking
        try:
            final_state = await graph.astream(state, config=config).__anext__()
            
            # 8. Calculate usage metrics
            duration = time.time() - start_time
            
            # TODO: Extract token count from final_state
            # You'll need to implement token counting based on your LLM usage
            # For example:
            # total_tokens = sum(response.get('total_tokens', 0) for response in final_state.get('agent_responses', []))
            
            # 9. Update workflow execution with success
            await update_workflow_execution(
                execution_id, 
                "completed", 
                total_tokens=total_tokens,
                duration_seconds=duration
            )
            
            return final_state
            
        except Exception as e:
            # 10. Update workflow execution with failure
            duration = time.time() - start_time
            await update_workflow_execution(
                execution_id, 
                "failed", 
                error=str(e),
                duration_seconds=duration
            )
            raise
            
    except Exception as e:
        logger.error(f"Error running workflow: {str(e)}")
        raise
"""
)

print(
    """
3. Update the State class in src/graph/types.py:
"""
)

print(
    """
# Add these fields to the State class:
class State(MessagesState):
    # ... existing fields ...
    
    # Add these new fields for billing integration
    account_id: str = None
    execution_id: str = None
    thread_id: str = None
"""
)

print(
    """
4. Optional: Add token counting (if not already implemented):
"""
)

print(
    """
# Add this helper function to track token usage
def extract_total_tokens(final_state: State) -> int:
    \"\"\"Extract total token count from workflow execution.\"\"\"
    total_tokens = 0
    
    # Count tokens from messages
    for message in final_state.get('messages', []):
        if hasattr(message, 'response_metadata'):
            usage = message.response_metadata.get('token_usage', {})
            total_tokens += usage.get('total_tokens', 0)
    
    # Add any other token counting logic specific to your implementation
    
    return total_tokens
"""
)

print(
    """
========================================
Summary of Changes:
========================================

1. Import billing functions
2. Change user_id parameter to account_id
3. Add billing check before workflow execution
4. Create workflow execution record
5. Track execution time and tokens
6. Update execution record on completion/failure
7. Add billing-related fields to State class

These changes will integrate Suna's billing system with deer-flow's 
workflow execution, tracking usage for each workflow run.
"""
)
