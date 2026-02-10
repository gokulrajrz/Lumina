"""
Astrology routes — birth chart and transits.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, Request

from middleware.auth import get_current_user, AuthenticatedUser
from middleware.rate_limit import limiter
from models.schemas import BirthDataInput
from services import database as db
from services.astrology_engine import calculate_birth_chart, calculate_current_transits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/astrology", tags=["astrology"])


@router.post("/birth-chart")
@limiter.limit("10/minute")
async def compute_birth_chart(
    request: Request,
    data: BirthDataInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Calculate a birth chart from birth data."""
    try:
        chart = calculate_birth_chart(
            data.birth_date, data.birth_time,
            data.latitude, data.longitude,
        )
        return chart
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transits/{user_id}")
async def get_transits(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get current transits relative to a user's birth chart."""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization check
    if user.get("supabase_id") != current_user.supabase_id:
        raise HTTPException(status_code=403, detail="Access denied")

    transits = calculate_current_transits(user.get("birth_chart", {}))
    return transits
