"""
Lumina API — Main Application Entry Point

Modular FastAPI application with:
- JWT authentication
- Rate limiting
- Structured logging
- Input validation
- Proper CORS configuration
"""

import logging
import sys

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from config import get_settings
from middleware.rate_limit import limiter, rate_limit_exceeded_handler
from middleware.logging_middleware import RequestLoggingMiddleware
from routes import users, astrology, briefing, journal, chat, health

# ── Logging Setup ──

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
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

    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # Doesn't even have to be reachable
            s.connect(('8.8.8.8', 1))
            local_ip = s.getsockname()[0]
        except Exception:
            local_ip = '127.0.0.1'
        finally:
            s.close()
        logger.info(f"Network URL: http://{local_ip}:8001")
    except Exception:
        logger.warning("Could not determine local network IP")
    
    yield
    
    # Shutdown logic (if any) goes here
    logger.info("Lumina API shutting down")


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

    # ── Middleware ──

    # CORS — restricted to configured origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    # Request logging
    app.add_middleware(RequestLoggingMiddleware)

    # Rate limiting
    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
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
