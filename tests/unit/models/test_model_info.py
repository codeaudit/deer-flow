"""
Tests for the ModelInfo SQLAlchemy model
"""

import pytest
from datetime import datetime

from tests.utils.db_test_utils import TestModelInfo as ModelInfo

pytestmark = pytest.mark.asyncio


async def test_model_info_create(db_session):
    """Test creating a model info"""
    # Arrange
    model_data = {
        "id": "gpt-4",
        "name": "GPT-4",
        "model": "gpt-4",
        "provider": "openai",
        "context_window": 8192,
        "base_url": "https://api.openai.com/v1",
        "verify_ssl": True,
    }

    # Act
    model_info = await ModelInfo.create(db_session, model_data)

    # Assert
    assert model_info.id == "gpt-4"
    assert model_info.name == "GPT-4"
    assert model_info.model == "gpt-4"
    assert model_info.provider == "openai"
    assert model_info.context_window == 8192
    assert model_info.created_at is not None


async def test_model_info_get_by_id(db_session):
    """Test getting a model info by ID"""
    # Arrange
    model_data = {"id": "gpt-4", "name": "GPT-4", "model": "gpt-4"}
    await ModelInfo.create(db_session, model_data)

    # Act
    model_info = await ModelInfo.get_by_id(db_session, "gpt-4")

    # Assert
    assert model_info is not None
    assert model_info.id == "gpt-4"
    assert model_info.name == "GPT-4"


async def test_model_info_update(db_session):
    """Test updating a model info"""
    # Arrange
    model_data = {
        "id": "gpt-4",
        "name": "GPT-4",
        "model": "gpt-4",
        "provider": "openai",
    }
    await ModelInfo.create(db_session, model_data)

    # Act
    update_data = {"context_window": 16384}
    model_info = await ModelInfo.update(db_session, "gpt-4", update_data)

    # Assert
    assert model_info is not None
    assert model_info.context_window == 16384
    assert model_info.provider == "openai"


async def test_model_info_delete(db_session):
    """Test deleting a model info"""
    # Arrange
    model_data = {"id": "gpt-4", "name": "GPT-4", "model": "gpt-4"}
    await ModelInfo.create(db_session, model_data)

    # Act
    result = await ModelInfo.delete(db_session, "gpt-4")

    # Assert
    assert result is True
    model_info = await ModelInfo.get_by_id(db_session, "gpt-4")
    assert model_info is None


async def test_model_info_get_or_create_existing(db_session):
    """Test getting an existing model info"""
    # Arrange
    model_data = {"id": "gpt-4", "name": "GPT-4", "model": "gpt-4"}
    await ModelInfo.create(db_session, model_data)

    # Act
    model_info = await ModelInfo.get_or_create(db_session, model_data)

    # Assert
    assert model_info is not None
    assert model_info.id == "gpt-4"
    assert model_info.name == "GPT-4"


async def test_model_info_get_or_create_new(db_session):
    """Test creating a new model info if it doesn't exist"""
    # Arrange
    model_data = {"id": "gpt-5", "name": "GPT-5", "model": "gpt-5"}

    # Act
    model_info = await ModelInfo.get_or_create(db_session, model_data)

    # Assert
    assert model_info is not None
    assert model_info.id == "gpt-5"
    assert model_info.name == "GPT-5"

    # Verify it was actually created in the database
    model_info_db = await ModelInfo.get_by_id(db_session, "gpt-5")
    assert model_info_db is not None
