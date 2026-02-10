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

logger = logging.getLogger("lumina.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs all requests with structured data."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        start_time = time.time()

        # Extract user info if available
        user_id = "anonymous"
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                import jwt
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, options={"verify_signature": False})
                user_id = payload.get("sub", "unknown")[:8]
            except Exception:
                user_id = "invalid_token"

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            logger.info(
                f"[{request_id}] {request.method} {request.url.path} "
                f"→ {response.status_code} ({duration_ms}ms) user={user_id}"
            )

            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"[{request_id}] {request.method} {request.url.path} "
                f"→ 500 ({duration_ms}ms) user={user_id} error={str(e)}"
            )
            raise
