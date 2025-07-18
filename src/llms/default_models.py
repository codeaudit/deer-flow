from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.llms.model_info import ModelInfo
from src.llms.llm import get_configured_llm_models

# List of default model IDs to assign to new accounts
DEFAULT_MODEL_IDS = [
    "gemini-2-flash",
    "openrouter-gpt-4o",
    "openrouter-claude-3-5-sonnet",
]


def get_model_config_by_id(model_id: str) -> Optional[dict]:
    """
    Look up the model config from the configured LLM models by model_id.
    Returns the model config dict, or None if not found.
    """
    all_models = get_configured_llm_models()
    for models in all_models.values():
        for model in models:
            if model["id"] == model_id:
                return model
    return None


async def initialize_default_models_for_account(
    account_id: str, session: AsyncSession
) -> List[str]:
    """
    Ensure that the default models are associated with the given account.
    For each required model, if it does not exist for the account, create it.
    Args:
        account_id (str): The account/user ID to associate models with.
        session (AsyncSession): SQLAlchemy async session.
    Returns:
        List[str]: List of model IDs that were created (empty if all already existed).
    """
    created_model_ids = []
    for model_id in DEFAULT_MODEL_IDS:
        # Check if model already exists for this account
        existing = await ModelInfo.get_by_id(session, model_id)
        if existing and getattr(existing, "account_id", None) == account_id:
            continue  # Already exists for this account
        # Get the model config from the global config
        model_config = get_model_config_by_id(model_id)
        if not model_config:
            continue  # Model not found in config, skip
        # Prepare model data for this account
        model_data = dict(model_config)
        model_data["account_id"] = account_id
        # Use get_or_create to avoid duplicates
        await ModelInfo.get_or_create(session, model_data)
        created_model_ids.append(model_id)
    return created_model_ids


# Usage example (in an async context):
# from src.backend.database.user_context import get_user_session
# async for session in get_user_session(account_id):
#     await initialize_default_models_for_account(account_id, session)
