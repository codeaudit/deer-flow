"""
Test utilities for SQLAlchemy database operations
"""

import os
import pytest
import logging
import uuid
from datetime import datetime
from typing import AsyncGenerator, Dict, List, Optional, Any

from sqlalchemy import (
    Column,
    String,
    Integer,
    JSON,
    DateTime,
    Boolean,
    UUID,
    ForeignKey,
    select,
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from sqlalchemy.orm import DeclarativeBase


# Create a separate base for tests to avoid conflicts
class TestBase(DeclarativeBase):
    pass


logger = logging.getLogger(__name__)

# Use in-memory SQLite for tests
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")

# Create async engine for tests
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,  # Disable connection pooling for tests
)

# Create async session factory for tests
test_async_session_factory = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class MockAuthUser(TestBase):
    """Mock auth.users table for testing"""

    __tablename__ = "auth_users"

    id = Column(String, primary_key=True)
    email = Column(String)
    name = Column(String)


class TestMCPConnection(TestBase):
    """Test version of MCPConnection with mock auth table reference"""

    __tablename__ = "mcp_connections"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    qualified_name = Column(String, nullable=False)
    name = Column(String, nullable=False)
    config = Column(JSON)  # Store non-sensitive config
    enabled_tools = Column(JSON)
    account_id = Column(String, ForeignKey("auth_users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, **kwargs):
        """Initialize the MCP connection"""
        # Generate ID if not provided
        if "id" not in kwargs:
            kwargs["id"] = uuid.uuid4()

        # Set defaults for dates if not provided
        if "created_at" not in kwargs:
            kwargs["created_at"] = datetime.utcnow()
        if "updated_at" not in kwargs:
            kwargs["updated_at"] = datetime.utcnow()

        super().__init__(**kwargs)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the connection to a dictionary"""
        return {
            "id": str(self.id),
            "qualified_name": self.qualified_name,
            "name": self.name,
            "config": self.config,
            "enabled_tools": self.enabled_tools,
            "account_id": self.account_id,
            "created_at": (
                self.created_at.isoformat()
                if hasattr(self.created_at, "isoformat")
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if hasattr(self.updated_at, "isoformat")
                else None
            ),
        }

    @classmethod
    async def create(
        cls, session: AsyncSession, connection_data: Dict[str, Any]
    ) -> "TestMCPConnection":
        """Create a new MCP connection"""
        connection = cls(**connection_data)
        session.add(connection)
        await session.commit()
        return connection

    @classmethod
    async def get_by_id(
        cls, session: AsyncSession, connection_id: str
    ) -> Optional["TestMCPConnection"]:
        """Get an MCP connection by ID"""
        result = await session.execute(select(cls).where(cls.id == connection_id))
        return result.scalars().first()

    @classmethod
    async def get_all(cls, session: AsyncSession) -> List["TestMCPConnection"]:
        """Get all MCP connections"""
        result = await session.execute(select(cls))
        return list(result.scalars().all())

    @classmethod
    async def get_for_account(
        cls, session: AsyncSession, account_id: str
    ) -> List["TestMCPConnection"]:
        """Get all MCP connections for a specific account"""
        result = await session.execute(select(cls).where(cls.account_id == account_id))
        return list(result.scalars().all())

    @classmethod
    async def update(
        cls, session: AsyncSession, connection_id: str, connection_data: Dict[str, Any]
    ) -> Optional["TestMCPConnection"]:
        """Update an MCP connection"""
        connection = await cls.get_by_id(session, connection_id)
        if connection:
            for key, value in connection_data.items():
                if hasattr(connection, key):
                    setattr(connection, key, value)
            connection.updated_at = datetime.utcnow()
            await session.commit()
        return connection

    @classmethod
    async def delete(cls, session: AsyncSession, connection_id: str) -> bool:
        """Delete an MCP connection"""
        connection = await cls.get_by_id(session, connection_id)
        if connection:
            await session.delete(connection)
            await session.commit()
            return True
        return False

    def to_metadata_request(self):
        """Convert to MCPServerMetadataRequest"""
        if self.config is None:
            raise ValueError("Connection config is missing")

        transport = self.config.get("transport")
        if transport is None:
            raise ValueError("Connection transport is missing")

        request_data = {"transport": transport}

        if transport == "stdio":
            request_data["command"] = self.config.get("command")
            request_data["args"] = self.config.get("args")
        elif transport == "sse":
            request_data["url"] = self.config.get("url")

        request_data["env"] = self.config.get("env")
        request_data["timeout_seconds"] = self.config.get("timeout_seconds")

        # Import here to avoid circular imports
        from src.server.mcp_request import MCPServerMetadataRequest

        return MCPServerMetadataRequest(**request_data)


class TestModelInfo(TestBase):
    """Test version of ModelInfo with mock auth table reference"""

    __tablename__ = "llm_models"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    model = Column(String, nullable=False)
    provider = Column(String)
    context_window = Column(Integer)
    base_url = Column(String)
    verify_ssl = Column(Boolean, default=True)
    account_id = Column(String, ForeignKey("auth_users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, data: Optional[Dict[str, Any]] = None, **kwargs):
        """Initialize the model info"""
        if data is not None:
            kwargs.update(data)

        # Set defaults for dates if not provided
        if "created_at" not in kwargs:
            kwargs["created_at"] = datetime.utcnow()
        if "updated_at" not in kwargs:
            kwargs["updated_at"] = datetime.utcnow()

        super().__init__(**kwargs)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the model info to a dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "model": self.model,
            "provider": self.provider,
            "context_window": self.context_window,
            "base_url": self.base_url,
            "verify_ssl": self.verify_ssl,
            "account_id": self.account_id,
            "created_at": (
                self.created_at.isoformat()
                if hasattr(self.created_at, "isoformat")
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if hasattr(self.updated_at, "isoformat")
                else None
            ),
        }

    @classmethod
    async def create(
        cls, session: AsyncSession, model_data: Dict[str, Any]
    ) -> "TestModelInfo":
        """Create a new model info"""
        model_info = cls(model_data)
        session.add(model_info)
        await session.commit()
        return model_info

    @classmethod
    async def get_by_id(
        cls, session: AsyncSession, model_id: str
    ) -> Optional["TestModelInfo"]:
        """Get a model info by ID"""
        result = await session.execute(select(cls).where(cls.id == model_id))
        return result.scalars().first()

    @classmethod
    async def get_all(cls, session: AsyncSession) -> List["TestModelInfo"]:
        """Get all model infos"""
        result = await session.execute(select(cls))
        return list(result.scalars().all())

    @classmethod
    async def get_for_account(
        cls, session: AsyncSession, account_id: str
    ) -> List["TestModelInfo"]:
        """Get all model infos for a specific account"""
        result = await session.execute(select(cls).where(cls.account_id == account_id))
        return list(result.scalars().all())

    @classmethod
    async def update(
        cls, session: AsyncSession, model_id: str, model_data: Dict[str, Any]
    ) -> Optional["TestModelInfo"]:
        """Update a model info"""
        model_info = await cls.get_by_id(session, model_id)
        if model_info:
            for key, value in model_data.items():
                if hasattr(model_info, key):
                    setattr(model_info, key, value)
            model_info.updated_at = datetime.utcnow()
            await session.commit()
        return model_info

    @classmethod
    async def delete(cls, session: AsyncSession, model_id: str) -> bool:
        """Delete a model info"""
        model_info = await cls.get_by_id(session, model_id)
        if model_info:
            await session.delete(model_info)
            await session.commit()
            return True
        return False

    @classmethod
    async def get_or_create(
        cls, session: AsyncSession, model_data: Dict[str, Any]
    ) -> "TestModelInfo":
        """Get or create a model info"""
        model_id = model_data.get("id")
        if not model_id:
            raise ValueError("Model ID is required")

        model_info = await cls.get_by_id(session, model_id)
        if not model_info:
            model_info = await cls.create(session, model_data)
        return model_info


async def get_test_session() -> AsyncGenerator[AsyncSession, None]:
    """Get SQLAlchemy session for test database operations"""
    session = test_async_session_factory()
    try:
        yield session
    finally:
        await session.close()


@pytest.fixture
def db_session():
    """Fixture that provides a SQLAlchemy session for tests"""

    async def _get_session():
        # Create all tables including the mock auth table
        async with test_engine.begin() as conn:
            await conn.run_sync(TestBase.metadata.create_all)

        # Get session
        session = test_async_session_factory()

        try:
            yield session
        finally:
            await session.close()

            # Drop all tables after tests
            async with test_engine.begin() as conn:
                await conn.run_sync(TestBase.metadata.drop_all)

    return _get_session
