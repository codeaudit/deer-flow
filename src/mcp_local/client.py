"""
MCP Connection class with SQLAlchemy integration
"""

import uuid
import json
from datetime import datetime
from typing import Dict, List, Optional, Any

from sqlalchemy import Column, String, JSON, DateTime, Boolean, UUID, ForeignKey, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.backend.database.base import Base
from src.server.mcp_request import MCPServerMetadataRequest


class MCPConnection(Base):
    """Extends existing MCPConnection with SQLAlchemy persistence"""

    __tablename__ = "mcp_connections"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    qualified_name = Column(String, nullable=False)
    name = Column(String, nullable=False)
    config = Column(JSON)  # Store non-sensitive config
    enabled_tools = Column(JSON)
    account_id = Column(String, ForeignKey("auth.users.id"), nullable=False, index=True)
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
    ) -> "MCPConnection":
        """Create a new MCP connection"""
        connection = cls(**connection_data)
        session.add(connection)
        await session.commit()
        return connection

    @classmethod
    async def get_by_id(
        cls, session: AsyncSession, connection_id: str
    ) -> Optional["MCPConnection"]:
        """Get an MCP connection by ID"""
        result = await session.execute(select(cls).where(cls.id == connection_id))
        return result.scalars().first()

    @classmethod
    async def get_all(cls, session: AsyncSession) -> List["MCPConnection"]:
        """Get all MCP connections"""
        result = await session.execute(select(cls))
        return list(result.scalars().all())

    @classmethod
    async def get_for_account(
        cls, session: AsyncSession, account_id: str
    ) -> List["MCPConnection"]:
        """Get all MCP connections for a specific account"""
        result = await session.execute(select(cls).where(cls.account_id == account_id))
        return list(result.scalars().all())

    @classmethod
    async def update(
        cls, session: AsyncSession, connection_id: str, connection_data: Dict[str, Any]
    ) -> Optional["MCPConnection"]:
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

    def to_metadata_request(self) -> MCPServerMetadataRequest:
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

        return MCPServerMetadataRequest(**request_data)
