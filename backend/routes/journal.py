"""
Journal routes — CRUD for journal entries with AI prompts.
"""

import logging
import uuid
import asyncio
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request

from middleware.auth import get_current_user, AuthenticatedUser, verify_user_ownership
from middleware.rate_limit import limiter
from models.schemas import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from config import get_settings
from services import database as db
from services.astrology_engine import calculate_current_transits
from services import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("/{user_id}", response_model=JournalEntryResponse)
@limiter.limit(get_settings().rate_limit_journal)
async def create_journal_entry(
    request: Request,
    user_id: str,
    data: JournalEntryCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new journal entry."""
    user = await verify_user_ownership(user_id, current_user)

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    transits = await asyncio.to_thread(calculate_current_transits, user.get("birth_chart", {}))

    entry = {
        "entry_id": entry_id,
        "user_id": user_id,
        "content": data.content,
        "mood": data.mood,
        "tags": data.tags,
        "prompt": data.prompt,
        "audio_url": data.audio_url,
        "transits_snapshot": transits,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    try:
        result = await db.create_journal_entry(entry)
        return result
    except Exception as e:
        logger.error(f"Failed to create journal entry: {e}")
        raise HTTPException(status_code=500, detail="Failed to save journal entry")


@router.get("/{user_id}", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    user_id: str,
    limit: int = 50,
    skip: int = 0,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get journal entries for a user."""
    await verify_user_ownership(user_id, current_user)
    entries = await db.get_journal_entries(user_id, limit=limit, offset=skip)
    return entries


@router.put("/entry/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    entry_id: str,
    data: JournalEntryUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Update a journal entry."""
    entry = await db.get_journal_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Verify ownership
    await verify_user_ownership(entry.get("user_id", ""), current_user)

    update_data = {}
    if data.content is not None:
        update_data["content"] = data.content
    if data.mood is not None:
        update_data["mood"] = data.mood
    if data.tags is not None:
        update_data["tags"] = data.tags
    if data.audio_url is not None:
        update_data["audio_url"] = data.audio_url
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.update_journal_entry(entry_id, update_data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update entry")
    return result


@router.delete("/entry/{entry_id}")
async def delete_journal_entry(
    entry_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Delete a journal entry."""
    entry = await db.get_journal_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # Verify ownership
    await verify_user_ownership(entry.get("user_id", ""), current_user)

    # Delete audio file from storage if it exists
    audio_url = entry.get("audio_url")
    if audio_url:
        try:
            # Extract path from URL
            # URL format: .../storage/v1/object/public/journal-audio/user_id/timestamp.ext
            # or .../storage/v1/object/journal-audio/user_id/timestamp.ext
            if "/journal-audio/" in audio_url:
                file_path = audio_url.split("/journal-audio/")[-1]
                logger.info(f"Deleting audio file: {file_path}")
                
                # Use Supabase storage client
                if file_path:
                    await asyncio.to_thread(db.get_db().storage.from_("journal-audio").remove, [file_path])
        except Exception as e:
            logger.error(f"Failed to delete audio file from storage: {e}")
            # Continue with DB deletion even if storage cleanup fails

    deleted = await db.delete_journal_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete entry")
    return {"deleted": True}


@router.get("/prompt/{user_id}")
@limiter.limit(get_settings().rate_limit_ai)
async def get_journal_prompt(
    request: Request,
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get an AI-generated journal prompt."""
    user = await verify_user_ownership(user_id, current_user)

    birth_chart = user.get("birth_chart", {})
    transits = await asyncio.to_thread(calculate_current_transits, birth_chart)
    planets = birth_chart.get("planets", {})

    transits_text = ", ".join([
        f"{t['planet']} {t['type']} natal {t['natal_planet']}"
        for t in transits.get("active_transits", [])[:3]
    ]) or "Calm cosmic day"

    prompt = await ai_service.generate_journal_prompt(
        sun_sign=planets.get("Sun", {}).get("sign", "Unknown"),
        moon_sign=planets.get("Moon", {}).get("sign", "Unknown"),
        current_moon=transits["moon_sign"],
        moon_phase=transits["moon_phase"],
        transits_text=transits_text,
    )

    return {"prompt": prompt}
