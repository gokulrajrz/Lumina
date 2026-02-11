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
        # Strict verification: Secret MUST be configured
        if not settings.supabase_jwt_secret:
            logger.critical("SUPABASE_JWT_SECRET not configured! Cannot verify tokens.")
            # Fail secure
            raise HTTPException(status_code=500, detail="Server authentication misconfiguration")

        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user(
    request: Request,
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

    user = AuthenticatedUser(
        supabase_id=supabase_id,
        email=payload.get("email"),
        role=payload.get("role", "authenticated"),
    )
    
    # Store in request state for middleware access (logging, etc.)
    request.state.user = user
    return user


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[AuthenticatedUser]:
    """
    Dependency that optionally extracts user from JWT.
    Returns None if no token is provided (for public endpoints).
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None
async def verify_user_ownership(user_id: str, current_user: AuthenticatedUser) -> dict:
    """
    Centralized utility to verify that a requested resource (by user_id)
    belongs to the current authenticated user.
    
    Returns the user document if verified, else raises HTTPException.
    """
    from services import database as db
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("supabase_id") != current_user.supabase_id:
        logger.warning(
            f"Access denied: user {current_user.supabase_id} attempted to access user_id {user_id}"
        )
        raise HTTPException(status_code=403, detail="Access denied")
        
    return user
