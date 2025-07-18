"""
User context management for database sessions
"""

import logging
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.database.session import get_session

logger = logging.getLogger(__name__)


class UserSessionContext:
    """Context manager that attaches user context to database sessions"""

    def __init__(self, user_id: str):
        """Initialize with user ID"""
        self.user_id = user_id

    async def get_session(self) -> AsyncSession:
        """Get a session with user context"""
        session_gen = get_session()
        session = await session_gen.__anext__()

        # Set session info that can be used by query filters
        session.info["user_id"] = self.user_id
        logger.debug(f"Created session with user context: {self.user_id}")

        return session


async def get_user_session(user_id: str) -> AsyncGenerator[AsyncSession, None]:
    """Get a session with user context"""
    session_gen = get_session()
    session = await session_gen.__anext__()

    try:
        # Set session info that can be used by query filters
        session.info["user_id"] = user_id
        logger.debug(f"Created session with user context: {user_id}")

        yield session
    finally:
        await session.close()


def get_user_id_from_session(session: AsyncSession) -> Optional[str]:
    """Get user ID from session context"""
    return session.info.get("user_id")


def user_filter(query, model_class):
    """Add user filter to query based on session context"""
    if hasattr(model_class, "account_id"):
        user_id = query.session.info.get("user_id")
        if user_id:
            query = query.where(model_class.account_id == user_id)
    return query
