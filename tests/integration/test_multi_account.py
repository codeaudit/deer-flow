"""
Integration tests for multi-account functionality
"""

import pytest
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.database.user_context import get_user_session
from tests.utils.db_test_utils import TestMCPConnection as MCPConnection
from tests.utils.db_test_utils import TestModelInfo as ModelInfo

pytestmark = pytest.mark.asyncio


async def test_account_isolation():
    """Test that accounts are properly isolated"""
    # Create two user IDs
    user1_id = str(uuid.uuid4())
    user2_id = str(uuid.uuid4())

    # Get sessions for both users
    async for user1_session in get_user_session(user1_id):
        async for user2_session in get_user_session(user2_id):
            # Create MCP connection for user 1
            connection1_data = {
                "qualified_name": "test.user1.connection",
                "name": "User 1 Connection",
                "config": {"transport": "stdio"},
                "account_id": user1_id,
            }
            connection1 = await MCPConnection.create(user1_session, connection1_data)

            # Create MCP connection for user 2
            connection2_data = {
                "qualified_name": "test.user2.connection",
                "name": "User 2 Connection",
                "config": {"transport": "stdio"},
                "account_id": user2_id,
            }
            connection2 = await MCPConnection.create(user2_session, connection2_data)

            # User 1 should only see their own connections
            user1_connections = await MCPConnection.get_for_account(
                user1_session, user1_id
            )
            assert len(user1_connections) == 1
            assert user1_connections[0].name == "User 1 Connection"

            # User 2 should only see their own connections
            user2_connections = await MCPConnection.get_for_account(
                user2_session, user2_id
            )
            assert len(user2_connections) == 1
            assert user2_connections[0].name == "User 2 Connection"

            # Clean up
            await MCPConnection.delete(user1_session, str(connection1.id))
            await MCPConnection.delete(user2_session, str(connection2.id))


async def test_model_account_isolation():
    """Test that model configurations are properly isolated by account"""
    # Create two user IDs
    user1_id = str(uuid.uuid4())
    user2_id = str(uuid.uuid4())

    # Get sessions for both users
    async for user1_session in get_user_session(user1_id):
        async for user2_session in get_user_session(user2_id):
            # Create model for user 1
            model1_data = {
                "id": "gpt-4-user1",
                "name": "GPT-4 User 1",
                "model": "gpt-4",
                "provider": "openai",
                "account_id": user1_id,
            }
            model1 = await ModelInfo.create(user1_session, model1_data)

            # Create model for user 2
            model2_data = {
                "id": "gpt-4-user2",
                "name": "GPT-4 User 2",
                "model": "gpt-4",
                "provider": "anthropic",
                "account_id": user2_id,
            }
            model2 = await ModelInfo.create(user2_session, model2_data)

            # User 1 should only see their own models
            user1_models = await ModelInfo.get_for_account(user1_session, user1_id)
            assert len(user1_models) == 1
            assert user1_models[0].provider == "openai"

            # User 2 should only see their own models
            user2_models = await ModelInfo.get_for_account(user2_session, user2_id)
            assert len(user2_models) == 1
            assert user2_models[0].provider == "anthropic"

            # Clean up
            await ModelInfo.delete(user1_session, model1.id)
            await ModelInfo.delete(user2_session, model2.id)
