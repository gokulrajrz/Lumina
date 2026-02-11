"""
Rate limiting middleware using slowapi.
Protects AI endpoints from abuse.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
import jwt

from config import get_settings


def _get_key(request: Request) -> str:
    """Extract rate limit key from request (Verified user ID or IP)."""
    # 1. Check for verified user from auth dependency (stored in state)
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.supabase_id}"
    
    # 2. Early JWT extraction for rate-limiting before dependency runs
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            # Speed over security here: token is fully verified in Depends(get_current_user)
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass
            
    # 3. Fallback to IP address
    return get_remote_address(request)


limiter = Limiter(key_func=_get_key)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded errors."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": str(exc.detail),
        },
    )
