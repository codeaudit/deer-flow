"""
Tests for the MCPConnection SQLAlchemy model
"""

import uuid
import pytest
from datetime import datetime

from tests.utils.db_test_utils import TestMCPConnection as MCPConnection
from src.server.mcp_request import MCPServerMetadataRequest

pytestmark = pytest.mark.asyncio


async def test_mcp_connection_create(db_session):
    """Test creating an MCP connection"""
    async for session in db_session():
        # Arrange
        connection_data = {
            "qualified_name": "test.connection",
            "name": "Test Connection",
            "config": {
                "transport": "stdio",
                "command": "python",
                "args": ["-m", "mcp"],
                "env": {"TEST_ENV": "test_value"},
            },
            "enabled_tools": ["tool1", "tool2"],
        }

        # Act
        connection = await MCPConnection.create(session, connection_data)

    # Assert
    assert connection.id is not None
    assert connection.qualified_name == "test.connection"
    assert connection.name == "Test Connection"
    assert connection.config.get("transport") == "stdio"
    assert connection.created_at is not None
    assert connection.updated_at is not None


async def test_mcp_connection_get_by_id(db_session):
    """Test getting an MCP connection by ID"""
    # Arrange
    connection_id = str(uuid.uuid4())
    connection_data = {
        "id": connection_id,
        "qualified_name": "test.connection",
        "name": "Test Connection",
        "config": {"transport": "stdio"},
    }
    await MCPConnection.create(db_session, connection_data)

    # Act
    connection = await MCPConnection.get_by_id(db_session, connection_id)

    # Assert
    assert connection is not None
    assert str(connection.id) == connection_id
    assert connection.qualified_name == "test.connection"


async def test_mcp_connection_update(db_session):
    """Test updating an MCP connection"""
    # Arrange
    connection_id = str(uuid.uuid4())
    connection_data = {
        "id": connection_id,
        "qualified_name": "test.connection",
        "name": "Test Connection",
        "config": {"transport": "stdio"},
    }
    await MCPConnection.create(db_session, connection_data)

    # Act
    update_data = {"name": "Updated Connection"}
    connection = await MCPConnection.update(db_session, connection_id, update_data)

    # Assert
    assert connection is not None
    assert connection.name == "Updated Connection"
    assert connection.qualified_name == "test.connection"


async def test_mcp_connection_delete(db_session):
    """Test deleting an MCP connection"""
    # Arrange
    connection_id = str(uuid.uuid4())
    connection_data = {
        "id": connection_id,
        "qualified_name": "test.connection",
        "name": "Test Connection",
        "config": {"transport": "stdio"},
    }
    await MCPConnection.create(db_session, connection_data)

    # Act
    result = await MCPConnection.delete(db_session, connection_id)

    # Assert
    assert result is True
    connection = await MCPConnection.get_by_id(db_session, connection_id)
    assert connection is None


async def test_mcp_connection_to_metadata_request(db_session):
    """Test converting an MCP connection to a metadata request"""
    # Arrange
    connection_data = {
        "qualified_name": "test.connection",
        "name": "Test Connection",
        "config": {
            "transport": "stdio",
            "command": "python",
            "args": ["-m", "mcp"],
            "env": {"TEST_ENV": "test_value"},
            "timeout_seconds": 60,
        },
    }
    connection = await MCPConnection.create(db_session, connection_data)

    # Act
    request = connection.to_metadata_request()

    # Assert
    assert isinstance(request, MCPServerMetadataRequest)
    assert request.transport == "stdio"
    assert request.command == "python"
    assert request.args == ["-m", "mcp"]
    assert request.env == {"TEST_ENV": "test_value"}
    assert request.timeout_seconds == 60
