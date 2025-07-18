"""
Database connection utilities that integrate SQLAlchemy with existing Supabase client
"""

import os
import logging
from typing import Optional, cast

from sqlalchemy.ext.asyncio import AsyncSession
from supabase import AsyncClient

from src.auth.database import get_supabase_client

# Import session directly to avoid circular imports
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

logger = logging.getLogger(__name__)

# Get database URL from environment or use default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    os.getenv(
        "SUPABASE_DB_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres",
    ),
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
)

# Create async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_sqlalchemy_session() -> AsyncSession:
    """Get a new SQLAlchemy session"""
    return async_session_factory()


class DBConnection:
    """
    Database connection class that provides access to both
    Supabase client and SQLAlchemy session
    """

    def __init__(self):
        """Initialize the database connection"""
        self._supabase_client: Optional[AsyncClient] = None
        self._session: Optional[AsyncSession] = None

    async def get_supabase(self) -> AsyncClient:
        """Get the Supabase client"""
        if self._supabase_client is None:
            self._supabase_client = await get_supabase_client()
        return self._supabase_client

    async def get_session(self) -> AsyncSession:
        """Get the SQLAlchemy session"""
        if self._session is None:
            self._session = await get_sqlalchemy_session()
        return cast(AsyncSession, self._session)

    async def close(self):
        """Close all connections"""
        if self._session:
            await self._session.close()
            self._session = None
