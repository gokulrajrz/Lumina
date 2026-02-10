"""
JWT Authentication middleware for FastAPI.
Verifies Supabase JWT tokens on protected routes.
"""

import logging
from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from functools import lru_cache

from config import get_settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Represents an authenticated user extracted from JWT."""

    def __init__(self, supabase_id: str, email: Optional[str] = None, role: str = "authenticated"):
        self.supabase_id = supabase_id
        self.email = email
        self.role = role

    def __repr__(self) -> str:
        return f"AuthenticatedUser(supabase_id={self.supabase_id}, email={self.email})"


def _decode_supabase_jwt(token: str) -> dict:
    """Decode and verify a Supabase JWT token."""
    settings = get_settings()

    try:
        # Supabase JWTs use HS256 with the JWT secret
        if settings.supabase_jwt_secret:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # Fallback: decode without verification (development only)
            logger.warning("JWT secret not configured — decoding without verification (UNSAFE)")
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["HS256"],
            )

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthenticatedUser:
    """
    Dependency that extracts and validates the current user from JWT.
    Use this on protected routes.
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide a Bearer token.",
        )

    payload = _decode_supabase_jwt(credentials.credentials)

    supabase_id = payload.get("sub")
    if not supabase_id:
        raise HTTPException(status_code=401, detail="Token missing user ID (sub)")

    return AuthenticatedUser(
        supabase_id=supabase_id,
        email=payload.get("email"),
        role=payload.get("role", "authenticated"),
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[AuthenticatedUser]:
    """
    Dependency that optionally extracts user from JWT.
    Returns None if no token is provided (for public endpoints).
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
