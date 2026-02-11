"""
User profile routes — authenticated.
"""

import logging
import uuid
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request

from middleware.auth import get_current_user, AuthenticatedUser, verify_user_ownership
from middleware.rate_limit import limiter
from models.schemas import UserProfileCreate, UserResponse
from config import get_settings
from services import database as db
from services.astrology_engine import calculate_birth_chart

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserResponse)
@limiter.limit(get_settings().rate_limit_user)
async def create_user(
    request: Request,
    data: UserProfileCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new user profile. Requires authentication."""
    # Check if user already exists
    existing = await db.get_user_by_supabase_id(current_user.supabase_id)
    if existing:
        return existing

    # Calculate birth chart
    try:
        birth_chart = await asyncio.to_thread(
            calculate_birth_chart,
            data.birth_date, data.birth_time,
            data.latitude, data.longitude,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "supabase_id": current_user.supabase_id,
        "display_name": data.display_name,
        "email": data.email or current_user.email,
        "birth_date": data.birth_date,
        "birth_time": data.birth_time,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "city": data.city,
        "timezone_str": data.timezone_str,
        "birth_chart": birth_chart,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "preferences": {
            "notifications": {
                "daily_briefing": True,
                "transit_alerts": True,
                "preferred_time": "08:00",
            },
            "theme": "dark",
        },
    }

    try:
        result = await db.create_user(user_doc)
        return result
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user profile")


@router.get("/me", response_model=UserResponse)
async def get_current_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get the current authenticated user's profile."""
    user = await db.get_user_by_supabase_id(current_user.supabase_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a user profile by ID. Only accessible to the profile owner."""
    user = await verify_user_ownership(user_id, current_user)
    return user


@router.get("/by-supabase/{supabase_id}", response_model=UserResponse)
async def get_user_by_supabase(
    supabase_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get a user profile by Supabase ID. Only accessible to the profile owner."""
    if supabase_id != current_user.supabase_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user = await db.get_user_by_supabase_id(supabase_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
