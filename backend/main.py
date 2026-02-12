"""
Lumina API — Main Application Entry Point

Modular FastAPI application with:
- JWT authentication
- Rate limiting
- Structured logging
- Input validation
- Proper CORS configuration
"""

import asyncio
import logging
import sys
from observability import ContextFilter

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from services.ai_service import AIServiceError
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded

from config import get_settings
from middleware.rate_limit import limiter, rate_limit_exceeded_handler
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Scope, Receive, Send
from routes import users, astrology, briefing, journal, chat, health

# Config logging with context filter
_temp_settings = get_settings()
_log_format = "%(asctime)s [%(levelname)s] [%(request_id)s] %(name)s: %(message)s"
logging.basicConfig(
    level=getattr(logging, _temp_settings.log_level.upper(), logging.INFO),
    format=_log_format,
    handlers=[logging.StreamHandler(sys.stdout)],
)

# Apply context filter to the root logger and all children
for handler in logging.root.handlers:
    handler.addFilter(ContextFilter())

logger = logging.getLogger("lumina")


from contextlib import asynccontextmanager

# ── App Factory ──

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    settings = get_settings()
    logger.info(f"Lumina API v2.0.0 starting up")
    logger.info(f"CORS origins: {settings.get_cors_origins()}")
    logger.info(f"Rate limit (AI): {settings.rate_limit_ai}")
    if settings.debug:
        logger.info("Debug mode: True")

    # ── Environment Persistence ──
    missing = []
    if not settings.supabase_url:
        missing.append("SUPABASE_URL")
    if not settings.supabase_service_key:
        missing.append("SUPABASE_SERVICE_KEY")
    if not settings.gemini_api_key:
        missing.append("GEMINI_API_KEY")

    if missing:
        logger.critical(f"Missing critical environment variables: {', '.join(missing)}")
        raise RuntimeError(f"Startup failed: Missing {', '.join(missing)}")

    # Auth secret is critical for auth but don't hard-crash startup to allow health checks
    if not settings.supabase_jwt_secret:
        logger.critical("SUPABASE_JWT_SECRET is not configured! Authentication will fail.")
        if not settings.debug:  # Allow partial config in debug mode for development flexibility
             logger.warning("PROCEEDING IN DEBUG MODE WITH MISSING SECRETS")
        else:
            raise RuntimeError(f"Startup failed: Missing SUPABASE_JWT_SECRET")

    def _get_local_ip():
        import socket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                # Doesn't even have to be reachable
                s.connect(('8.8.8.8', 1))
                return s.getsockname()[0]
            finally:
                s.close()
        except Exception:
            return '127.0.0.1'

    try:
        local_ip = await asyncio.to_thread(_get_local_ip)
        logger.info(f"Network URL: http://{local_ip}:8001")
    except Exception:
        logger.warning("Could not determine local network IP")
    
    yield
    
    # ── Shutdown Cleanup ──
    logger.info("Lumina API shutting down...")
    
    # Shutdown Cleanup: Correctly reset global service clients
    import services.ai_service as ai_service
    import services.database as database
    
    # 1. AI Service Cleanup
    if ai_service._genai_client:
        try:
            logger.info("Closing AI service sessions")
            if hasattr(ai_service._genai_client, "close") and callable(ai_service._genai_client.close):
                ai_service._genai_client.close()
            ai_service._genai_client = None
        except Exception as e:
            logger.debug(f"AI service cleanup warning: {e}")

    # 2. Database Service Cleanup (Supabase)
    if database._client:
        try:
            logger.info("Closing Database service sessions")
            # Supabase client uses httpx internally for postgrest, auth, storage
            # We try to close the internal session if it exists
            # This is a best-effort cleanup for the sync client
            database._client = None
        except Exception as e:
            logger.debug(f"Database service cleanup warning: {e}")

    logger.info("Shutdown complete")


# ── Pure ASGI Middlewares ──
# We use pure ASGI classes instead of BaseHTTPMiddleware to avoid
# TaskGroup/ExceptionGroup tracebacks that clutter the terminal.

class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["X-XSS-Protection"] = "1; mode=block"
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            await send(message)

        await self.app(scope, receive, send_wrapper)


class RequestLoggingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        from observability import request_id_ctx
        import uuid
        import time
        import jwt
        import json

        request_id = str(uuid.uuid4())[:8]
        # Propagate request_id to Starlette's Request.state
        scope.setdefault("state", {})["request_id"] = request_id
        
        token_ctx = request_id_ctx.set(request_id)
        start_time = time.time()
        
        # Extract user info for logging
        user_id = "anonymous"
        headers_dict = dict(scope["headers"])
        auth_header = headers_dict.get(b"authorization", b"").decode()
        
        if auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, options={"verify_signature": False})
                user_id = payload.get("sub", "unknown")[:8]
            except Exception:
                user_id = "invalid_token"

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration_ms = round((time.time() - start_time) * 1000, 2)
                status = message["status"]
                
                client_host = scope["client"][0] if scope.get("client") else "unknown"
                user_agent = ""
                for k, v in scope["headers"]:
                    if k == b"user-agent":
                        user_agent = v.decode()
                        break
                
                access_logger = logging.getLogger("lumina.access")
                access_logger.info(
                    f"{scope['method']} {scope['path']} {status} "
                    f"({duration_ms:.2f}ms) | IP: {client_host} | UA: {user_agent} | user={user_id}"
                )
                
                headers = MutableHeaders(scope=message)
                headers["X-Request-ID"] = request_id
            
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except AIServiceError as e:
            # SILENT CATCH: Handle 429 quota errors without terminal tracebacks
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logging.getLogger("lumina.access").warning(
                f"{scope['method']} {scope['path']} 429 ({duration_ms}ms) | AI Quota Exceeded"
            )
            
            # Construct 429 response manually
            response_body = json.dumps({"detail": str(e)}).encode()
            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(response_body)).encode()),
                    (b"x-request-id", request_id.encode()),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": response_body,
            })
        except Exception as e:
            # Log other errors but still prevent the huge ExceptionGroup tracebacks if possible
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logging.getLogger("lumina.access").error(
                f"{scope['method']} {scope['path']} 500 ({duration_ms}ms) | user={user_id} error={str(e)}"
            )
            # Re-raise to let FastAPI handle it if it wasn't a quota issue
            raise e
        finally:
            request_id_ctx.reset(token_ctx)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="AI-powered astrology API with personalized daily briefings, journal prompts, and chat.",
        version="2.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── Middleware Stack (Pure ASGI) ──

    # 0. Rate limiting exception handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # 1. GZip compression (Outer)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # 2. Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 3. Request logging (Inner)
    app.add_middleware(RequestLoggingMiddleware)

    # 5. CORS — ALWAYS ADD LAST to be the outermost for requests
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Professional AI Error Handler
    @app.exception_handler(AIServiceError)
    async def ai_service_error_handler(request: Request, exc: AIServiceError):
        logger.warning(f"AI Service error on {request.method} {request.url.path}: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # Don't mask standard HTTP errors
        if isinstance(exc, (HTTPException, StarletteHTTPException)):
            return await http_exception_handler(request, exc)
        
        # Don't mask validation errors (422)
        if isinstance(exc, RequestValidationError):
            # Log the validation error details for debugging
            logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
            return await request_validation_exception_handler(request, exc)
        
        # Specific handling for common errors
        if isinstance(exc, AIServiceError):
            logger.warning(f"AI Service error on {request.method} {request.url.path}: {exc.message}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.message},
            )

        import json
        if isinstance(exc, json.JSONDecodeError):
            logger.error(f"AI response formatting error on {request.method} {request.url.path}: {exc}")
            return JSONResponse(
                status_code=500,
                content={"detail": "AI response was malformed and could not be parsed"},
            )

        if isinstance(exc, ValueError):
            logger.info(f"Bad request on {request.method} {request.url.path}: {exc}")
            return JSONResponse(
                status_code=400,
                content={"detail": str(exc)},
            )

        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
        )

    # Custom 404 Handler for undefined routes
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: Exception):
        logger.info(f"404 Not Found: {request.method} {request.url.path}")
        return JSONResponse(
            status_code=404,
            content={"detail": "The requested resource was not found"},
        )

    # ── Routes ──

    app.include_router(health.router)
    app.include_router(users.router)
    app.include_router(astrology.router)
    app.include_router(briefing.router)
    app.include_router(journal.router)
    app.include_router(chat.router)

    return app


# Create application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
