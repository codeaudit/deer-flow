"""
Authentication middleware for extracting user context from requests
"""

import logging
import os
from typing import Optional, Callable, Awaitable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from supabase import create_async_client, AsyncClient

logger = logging.getLogger(__name__)

# Cache for Supabase client
_supabase_client: Optional[AsyncClient] = None


async def get_auth_client() -> AsyncClient:
    """Get or create the Supabase auth client"""
    global _supabase_client

    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
            "SUPABASE_ANON_KEY"
        )

        if not supabase_url or not supabase_key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set"
            )

        _supabase_client = await create_async_client(supabase_url, supabase_key)
        logger.info("Supabase auth client initialized")

    return _supabase_client


async def extract_token(request: Request) -> Optional[str]:
    """Extract authentication token from request"""
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


async def verify_token(token: str) -> Optional[str]:
    """Verify token and return user ID if valid"""
    try:
        client = await get_auth_client()
        # Verify JWT token
        user = await client.auth.get_user(token)
        return user.user.id if user and user.user else None
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        print(f"[DEBUG] Token verification error: {str(e)}")  # Debug print
        return None


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware for extracting user context from requests"""

    async def dispatch(self, request: Request, call_next):
        """Process the request and extract user context"""
        # Extract token from request
        token = await extract_token(request)

        if token:
            # Verify token and get user ID
            user_id = await verify_token(token)
            if user_id:
                # Attach user ID to request state
                request.state.user_id = user_id
                logger.debug(f"Authenticated user: {user_id}")

        # Continue with request processing
        return await call_next(request)


def get_user_id_from_request(request: Request) -> Optional[str]:
    """Get user ID from request state"""
    return getattr(request.state, "user_id", None)
