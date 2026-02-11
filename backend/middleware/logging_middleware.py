"""
Structured JSON logging middleware.
Logs every request with request ID, timing, and user context.
"""

import logging
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
import jwt

logger = logging.getLogger("lumina.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs all requests with structured data."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        from observability import request_id_ctx
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        # Set context for all logs in this thread/task
        token_ctx = request_id_ctx.set(request_id)

        start_time = time.time()
        user_id = "anonymous"
        auth_header = request.headers.get("authorization", "")

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Try to get verified user from state (populated by auth dependency)
            user = getattr(request.state, "user", None)
            if user:
                user_id = user.supabase_id[:8]
            elif auth_header.startswith("Bearer "):
                # Fallback to unverified extraction for early correlation if auth failed/skipped
                try:
                    token = auth_header.split(" ")[1]
                    payload = jwt.decode(token, options={"verify_signature": False})
                    user_id = payload.get("sub", "unknown")[:8]
                except Exception:
                    user_id = "invalid_token"

            # Log with enhanced context: Method, Path, Status, Duration, IP, User-Agent
            client_host = request.client.host if request.client else "unknown"
            user_agent = request.headers.get("user-agent", "unknown")
            
            logger.info(
                f"{request.method} {request.url.path} {response.status_code} "
                f"({duration_ms:.2f}ms) | IP: {client_host} | UA: {user_agent} | user={user_id}"
            )

            response.headers["X-Request-ID"] = request_id
            request_id_ctx.reset(token_ctx)
            return response

        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"{request.method} {request.url.path} "
                f"→ 500 ({duration_ms}ms) user={user_id} error={str(e)}"
            )
            request_id_ctx.reset(token_ctx)
            raise
