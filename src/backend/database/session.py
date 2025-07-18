"""
SQLAlchemy session management for deer-flow
"""

import os
import logging
from typing import AsyncGenerator

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


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get SQLAlchemy session for database operations"""
    session = async_session_factory()
    try:
        yield session
    finally:
        await session.close()
