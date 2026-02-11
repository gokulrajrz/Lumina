"""
Health check route — monitors database and AI service connectivity.
"""

import logging
from fastapi import APIRouter

from services.database import check_db_health
from services.ai_service import check_ai_health
from models.schemas import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check.
    Verifies database and AI service connectivity.
    """
    db_healthy = await check_db_health()
    ai_healthy = await check_ai_health()

    status = "healthy" if (db_healthy and ai_healthy) else "degraded"

    response = {
        "status": status,
        "version": "2.0.0",
        "database": "connected" if db_healthy else "disconnected",
        "ai_service": "connected" if ai_healthy else "disconnected",
    }

    if status == "degraded":
        logger.warning(f"Health check degraded: {response}")

    return response
