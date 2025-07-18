"""
Database connection utilities for deer-flow Supabase integration
"""

import os
from supabase import create_async_client, AsyncClient
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_client: Optional[AsyncClient] = None


async def get_supabase_client() -> AsyncClient:
    """Get or create the Supabase client."""
    global _client

    if _client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
            "SUPABASE_ANON_KEY"
        )

        if not supabase_url or not supabase_key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
            )

        _client = await create_async_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized")

    return _client
