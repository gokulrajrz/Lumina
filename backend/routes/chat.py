"""
Chat routes — AI-powered astrology chat with conversation history.
"""

import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request

from middleware.auth import get_current_user, AuthenticatedUser
from middleware.rate_limit import limiter
from models.schemas import ChatMessageInput
from services import database as db
from services.astrology_engine import calculate_current_transits
from services import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/{user_id}")
@limiter.limit("10/minute")
async def chat_with_ai(
    request: Request,
    user_id: str,
    data: ChatMessageInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Send a message to Lumina AI and get a response."""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("supabase_id") != current_user.supabase_id:
        raise HTTPException(status_code=403, detail="Access denied")

    conv_id = data.conversation_id or str(uuid.uuid4())
    birth_chart = user.get("birth_chart", {})
    transits = calculate_current_transits(birth_chart)
    planets = birth_chart.get("planets", {})

    # Get recent conversation history
    history = db.get_chat_messages(conv_id, limit=10)
    history_text = "\n".join([
        f"{m['role']}: {m['content']}" for m in history[-6:]
    ])

    transits_text = ", ".join([
        f"{t['planet']} {t['type']} natal {t['natal_planet']}"
        for t in transits.get("active_transits", [])[:5]
    ]) or "No major transits"

    # Save user message
    user_msg_doc = {
        "message_id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "user_id": user_id,
        "role": "user",
        "content": data.message,
        "saved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.create_chat_message(user_msg_doc)

    # Generate AI response
    try:
        ai_response = await ai_service.generate_chat_response(
            sun_sign=planets.get("Sun", {}).get("sign", "Unknown"),
            moon_sign=planets.get("Moon", {}).get("sign", "Unknown"),
            asc_sign=birth_chart.get("ascendant", {}).get("sign", "Unknown"),
            current_moon=transits["moon_sign"],
            moon_phase=transits["moon_phase"],
            transits_text=transits_text,
            history_text=history_text,
            user_message=data.message,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # Save AI message
    ai_msg_doc = {
        "message_id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "user_id": user_id,
        "role": "assistant",
        "content": ai_response,
        "saved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.create_chat_message(ai_msg_doc)

    return {
        "conversation_id": conv_id,
        "user_message": user_msg_doc,
        "ai_message": ai_msg_doc,
    }


@router.get("/history/{conversation_id}")
async def get_chat_history(
    conversation_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get chat message history for a conversation."""
    messages = db.get_chat_messages(conversation_id, limit=100)

    # Verify the requesting user owns these messages
    if messages:
        user_id = messages[0].get("user_id")
        user = db.get_user_by_id(user_id)
        if not user or user.get("supabase_id") != current_user.supabase_id:
            raise HTTPException(status_code=403, detail="Access denied")

    return messages


@router.get("/conversations/{user_id}")
async def get_conversations(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get all conversations for a user."""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("supabase_id") != current_user.supabase_id:
        raise HTTPException(status_code=403, detail="Access denied")

    convos = db.get_user_conversations(user_id)
    return [
        {
            "conversation_id": c.get("conversation_id"),
            "last_message": c.get("last_message"),
            "last_at": c.get("last_at"),
            "message_count": c.get("message_count"),
        }
        for c in convos
    ]
