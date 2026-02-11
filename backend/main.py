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
from observability import request_id_ctx, ContextFilter

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded

from config import get_settings
from middleware.rate_limit import limiter, rate_limit_exceeded_handler
from middleware.logging_middleware import RequestLoggingMiddleware
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

    # ── Environment Validation ──
    critical_vars = {
        "SUPABASE_URL": settings.supabase_url,
        "SUPABASE_SERVICE_KEY": settings.supabase_service_key,
        "SUPABASE_JWT_SECRET": settings.supabase_jwt_secret,
        "GEMINI_API_KEY": settings.gemini_api_key,
    }
    missing = [name for name, val in critical_vars.items() if not val]
    if missing:
        logger.critical(f"Missing critical environment variables: {', '.join(missing)}")
        # Fail-fast on startup if critical config is missing
        if not settings.debug:  # Allow partial config in debug mode for development flexibility
             raise RuntimeError(f"Startup failed: Missing {', '.join(missing)}")
        else:
            logger.warning("PROCEEDING IN DEBUG MODE WITH MISSING SECRETS")

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


# ── Custom Security Middleware ──

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds standard security headers to every response."""
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


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

    # ── Middleware (Order: Last Added = Outermost for Request) ──

    # 1. Rate limiting exception handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # 2. Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 3. GZip compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # 4. Request logging
    app.add_middleware(RequestLoggingMiddleware)

    # 5. CORS — ALWAYS ADD LAST to be the outermost for requests
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
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
