"""
Daily briefing routes — AI-generated cosmic guidance.
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request

from middleware.auth import get_current_user, AuthenticatedUser
from middleware.rate_limit import limiter
from services import database as db
from services.astrology_engine import calculate_current_transits
from services import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/briefing", tags=["briefing"])


@router.get("/{user_id}")
@limiter.limit("10/minute")
async def get_daily_briefing(
    request: Request,
    user_id: str,
    date: str = None,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get personalized daily briefing for a user."""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization check
    if user.get("supabase_id") != current_user.supabase_id:
        raise HTTPException(status_code=403, detail="Access denied")

    target_date = datetime.now(timezone.utc)
    target_date_str = target_date.strftime("%Y-%m-%d")

    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            target_date_str = date
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Check cache first
    cached_insight = db.get_daily_insight(user_id, target_date_str)
    
    birth_chart = user.get("birth_chart", {})
    transits = calculate_current_transits(birth_chart, target_date=target_date)

    if cached_insight:
        cached_insight["transits"] = transits
        return cached_insight

    planets = birth_chart.get("planets", {})
    sun_sign = planets.get("Sun", {}).get("sign", "Unknown")
    moon_sign = planets.get("Moon", {}).get("sign", "Unknown")
    asc_sign = birth_chart.get("ascendant", {}).get("sign", "Unknown")

    transits_summary = ", ".join([
        f"{t['planet']} {t['type']} natal {t['natal_planet']}"
        for t in transits.get("active_transits", [])[:5]
    ]) or "No major transits"

    briefing = await ai_service.generate_daily_briefing(
        sun_sign=sun_sign,
        moon_sign=moon_sign,
        asc_sign=asc_sign,
        current_moon=transits["moon_sign"],
        moon_phase=transits["moon_phase"],
        transits_summary=transits_summary,
    )

    # Store for future use
    try:
        db.create_daily_insight(user_id, target_date_str, briefing)
    except Exception as e:
        logger.error(f"Failed to cache daily insight: {e}")
        # Continue even if caching fails

    briefing["transits"] = transits
    return briefing
