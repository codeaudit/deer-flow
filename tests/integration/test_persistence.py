"""
Integration tests for SQLAlchemy persistence
"""

import pytest
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.database.base import Base
from src.backend.database.session import get_session
from tests.utils.db_test_utils import TestMCPConnection as MCPConnection
from tests.utils.db_test_utils import TestModelInfo as ModelInfo

pytestmark = pytest.mark.asyncio


async def test_mcp_connection_persistence(db_session):
    """Test MCP connection persistence with SQLAlchemy"""
    # Arrange
    connection_id = str(uuid.uuid4())
    connection_data = {
        "id": connection_id,
        "qualified_name": "test.integration.connection",
        "name": "Integration Test Connection",
        "config": {"transport": "stdio", "command": "python", "args": ["-m", "mcp"]},
    }

    # Act - Create
    connection = await MCPConnection.create(db_session, connection_data)

    # Get a new session to ensure data was persisted
    new_session = await anext(get_session())

    # Act - Retrieve
    retrieved_connection = await MCPConnection.get_by_id(new_session, connection_id)

    # Assert
    assert retrieved_connection is not None
    assert retrieved_connection.id == connection.id
    assert retrieved_connection.qualified_name == "test.integration.connection"

    # Clean up
    await new_session.close()


async def test_model_info_persistence(db_session):
    """Test model info persistence with SQLAlchemy"""
    # Arrange
    model_id = "test-model-integration"
    model_data = {
        "id": model_id,
        "name": "Test Integration Model",
        "model": "test-model",
        "provider": "test-provider",
        "context_window": 4096,
    }

    # Act - Create
    model_info = await ModelInfo.create(db_session, model_data)

    # Get a new session to ensure data was persisted
    new_session = await anext(get_session())

    # Act - Retrieve
    retrieved_model = await ModelInfo.get_by_id(new_session, model_id)

    # Assert
    assert retrieved_model is not None
    assert retrieved_model.id == model_info.id
    assert retrieved_model.name == "Test Integration Model"
    assert retrieved_model.context_window == 4096

    # Clean up
    await new_session.close()


async def test_transaction_rollback(db_session):
    """Test transaction rollback with SQLAlchemy"""
    # Arrange
    connection_id = str(uuid.uuid4())
    connection_data = {
        "id": connection_id,
        "qualified_name": "test.rollback.connection",
        "name": "Rollback Test Connection",
        "config": {"transport": "stdio"},
    }

    # Create the connection
    await MCPConnection.create(db_session, connection_data)

    # Start a new session and transaction
    new_session = await anext(get_session())

    try:
        # Try to update with invalid data (missing required field)
        await MCPConnection.update(new_session, connection_id, {"qualified_name": None})
        await new_session.commit()
        assert False, "Should have raised an exception"
    except Exception:
        # Rollback the transaction
        await new_session.rollback()

    # Get the connection again to verify it wasn't changed
    retrieved_connection = await MCPConnection.get_by_id(new_session, connection_id)

    # Assert
    assert retrieved_connection is not None
    assert retrieved_connection.qualified_name == "test.rollback.connection"

    # Clean up
    await new_session.close()
