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


# ── App Factory ──

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="AI-powered astrology API with personalized daily briefings, journal prompts, and chat.",
        version="2.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
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
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # ── Routes ──

    app.include_router(health.router)
    app.include_router(users.router)
    app.include_router(astrology.router)
    app.include_router(briefing.router)
    app.include_router(journal.router)
    app.include_router(chat.router)

    @app.on_event("startup")
    async def startup():
        logger.info(f"Lumina API v2.0.0 starting up")
        logger.info(f"CORS origins: {settings.get_cors_origins()}")
        logger.info(f"Rate limit (AI): {settings.rate_limit_ai}")
        logger.info(f"Debug mode: {settings.debug}")

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
