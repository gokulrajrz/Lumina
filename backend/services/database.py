"""
Database service using Supabase client directly.
Clean, async-compatible interface — no MongoDB wrapper.
"""

import logging
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

from config import get_settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_db() -> Client:
    """Get or create Supabase client singleton."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
        logger.info(f"Supabase client initialized for {settings.supabase_url}")
    return _client


# ── User Operations ──


def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user profile."""
    db = get_db()
    result = db.table("users").insert(user_data).execute()
    if not result.data:
        raise Exception("Failed to create user")
    return result.data[0]


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Find a user by their internal user_id."""
    db = get_db()
    result = db.table("users").select("*").eq("user_id", user_id).limit(1).execute()
    return result.data[0] if result.data else None


def get_user_by_supabase_id(supabase_id: str) -> Optional[Dict[str, Any]]:
    """Find a user by their Supabase auth ID."""
    db = get_db()
    result = db.table("users").select("*").eq("supabase_id", supabase_id).limit(1).execute()
    return result.data[0] if result.data else None


def update_user(user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a user profile."""
    db = get_db()
    result = db.table("users").update(update_data).eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


# ── Journal Operations ──


def create_journal_entry(entry_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new journal entry."""
    db = get_db()
    result = db.table("journal_entries").insert(entry_data).execute()
    if not result.data:
        raise Exception("Failed to create journal entry")
    return result.data[0]


def get_journal_entries(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """Get journal entries for a user with pagination."""
    db = get_db()
    result = (
        db.table("journal_entries")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


def get_journal_entry(entry_id: str) -> Optional[Dict[str, Any]]:
    """Get a single journal entry."""
    db = get_db()
    result = db.table("journal_entries").select("*").eq("entry_id", entry_id).limit(1).execute()
    return result.data[0] if result.data else None


def update_journal_entry(entry_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a journal entry."""
    db = get_db()
    result = (
        db.table("journal_entries")
        .update(update_data)
        .eq("entry_id", entry_id)
        .execute()
    )
    return result.data[0] if result.data else None


def delete_journal_entry(entry_id: str) -> bool:
    """Delete a journal entry. Returns True if deleted."""
    db = get_db()
    result = db.table("journal_entries").delete().eq("entry_id", entry_id).execute()
    return len(result.data) > 0 if result.data else False


# ── Chat Operations ──


def create_chat_message(message_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new chat message."""
    db = get_db()
    result = db.table("chat_messages").insert(message_data).execute()
    if not result.data:
        raise Exception("Failed to create chat message")
    return result.data[0]


def get_chat_messages(
    conversation_id: str,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """Get chat messages for a conversation."""
    db = get_db()
    result = (
        db.table("chat_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return result.data or []


def get_user_conversations(user_id: str) -> List[Dict[str, Any]]:
    """Get user's conversations using RPC function."""
    db = get_db()
    result = db.rpc("get_user_conversations", {"p_user_id": user_id}).execute()
    return result.data or []


# ── Health Check ──


def check_db_health() -> bool:
    """Check if database is accessible."""
    try:
        db = get_db()
        db.table("users").select("user_id").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# ── Daily Insights ──


def get_daily_insight(user_id: str, date: str) -> Optional[Dict[str, Any]]:
    """Get daily insight for a user on a specific date."""
    db = get_db()
    result = (
        db.table("daily_insights")
        .select("content")
        .eq("user_id", user_id)
        .eq("date", date)
        .limit(1)
        .execute()
    )
    return result.data[0]["content"] if result.data else None


def create_daily_insight(user_id: str, date: str, content: Dict[str, Any]) -> Dict[str, Any]:
    """Store a daily insight."""
    db = get_db()
    data = {"user_id": user_id, "date": date, "content": content}
    result = db.table("daily_insights").insert(data).execute()
    if not result.data:
        raise Exception("Failed to store daily insight")
    return result.data[0]
