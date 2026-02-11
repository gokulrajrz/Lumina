"""
Astrology routes — birth chart and transits.
"""

import logging
import asyncio
from fastapi import APIRouter, HTTPException, Depends, Request

from middleware.auth import get_current_user, AuthenticatedUser, verify_user_ownership
from middleware.rate_limit import limiter
from models.schemas import BirthDataInput, BirthChartResponse, TransitResponse
from config import get_settings
from services import database as db
from services.astrology_engine import calculate_birth_chart, calculate_current_transits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/astrology", tags=["astrology"])


@router.post("/birth-chart", response_model=BirthChartResponse)
@limiter.limit(get_settings().rate_limit_ai)
async def compute_birth_chart(
    request: Request,
    data: BirthDataInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Calculate a birth chart from birth data."""
    try:
        chart = await asyncio.to_thread(
            calculate_birth_chart,
            data.birth_date, data.birth_time,
            data.latitude, data.longitude,
        )
        return chart
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transits/{user_id}", response_model=TransitResponse)
async def get_transits(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get current transits relative to a user's birth chart."""
    user = await verify_user_ownership(user_id, current_user)

    transits = await asyncio.to_thread(calculate_current_transits, user.get("birth_chart", {}))
    return transits
