"""
JWT Authentication middleware for FastAPI.
Verifies Supabase JWT tokens on protected routes.
"""

import logging
from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import json
from functools import wraps, lru_cache

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


@lru_cache()
def _get_verification_key(secret: str, alg: str):
    """
    Intelligently loads the verification key based on format and algorithm.
    Supports: Symmetric (HS), PEM Public Key, and JWK (ES/RS).
    """
    if not secret:
        return None

    clean_secret = secret.strip()
    
    # Handle potential wrapping quotes from .env
    if (clean_secret.startswith("'") and clean_secret.endswith("'")) or \
       (clean_secret.startswith('"') and clean_secret.endswith('"')):
        clean_secret = clean_secret[1:-1].strip()

    # Handle JWK (JSON Web Key)
    if clean_secret.startswith("{") and clean_secret.endswith("}"):
        try:
            jwk_dict = json.loads(clean_secret)
            from jwt import PyJWK
            key = PyJWK.from_dict(jwk_dict).key
            logger.debug(f"Successfully loaded {alg} key from JWK format")
            return key
        except Exception as e:
            logger.error(f"Failed to parse SUPABASE_JWT_SECRET as JWK: {e}")
            # Fall back to raw secret if it looks like JSON but fails to parse
            pass

    # Symmetric algorithms use the secret directly
    if alg and alg.startswith("HS"):
        return secret

    # Asymmetric algorithms (ES, RS) require PEM or JWK
    # If not a JWK, it must be a PEM (handled by PyJWT)
    return clean_secret


def _decode_supabase_jwt(token: str) -> dict:
    """Decode and verify a Supabase JWT token."""
    settings = get_settings()

    try:
        # Pre-verify: Secret MUST be configured
        if not settings.supabase_jwt_secret:
            logger.critical("SUPABASE_JWT_SECRET not configured! Cannot verify tokens.")
            raise HTTPException(
                status_code=500, 
                detail="Authentication misconfiguration: SUPABASE_JWT_SECRET is missing"
            )

        # Inspect header for diagnostic logging
        try:
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get("alg")
        except Exception:
            alg = "unknown"

        # Dynamically load the correct key for this algorithm
        verification_key = _get_verification_key(settings.supabase_jwt_secret, alg)

        if not verification_key:
            raise jwt.InvalidTokenError("No verification key available")

        try:
            payload = jwt.decode(
                token,
                verification_key,
                algorithms=["HS256", "HS384", "HS512", "ES256", "RS256"],
                audience="authenticated",
            )
            return payload
        except (ValueError, TypeError, jwt.InvalidKeyError) as e:
            # Handle key-format mismatches for asymmetric algorithms
            if alg in ["ES256", "RS256"]:
                logger.error(
                    f"JWT Verification Failed: Algorithm '{alg}' requires a valid public key (PEM or JWK). "
                    f"Current secret format failed to load. Error: {e}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Server misconfiguration: {alg} requires a valid PEM or JWK public key"
                )
            raise e

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidAlgorithmError as e:
        header = jwt.get_unverified_header(token)
        logger.error(f"JWT Algorithm Mismatch: token uses {header.get('alg')}. Error: {e}")
        raise HTTPException(status_code=401, detail="Token uses an unsupported signing algorithm")
    except jwt.InvalidTokenError as e:
        # Log basic header info to help diagnose
        try:
            header = jwt.get_unverified_header(token)
            logger.error(f"JWT Invalid: {str(e)} | Header: {header}")
        except Exception:
            logger.error(f"JWT Invalid: {str(e)} | Could not parse header")
            
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
