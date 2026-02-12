"""
Database service — Clean, async-compatible interface for Supabase (PostgreSQL).
"""

import logging
import asyncio
import threading
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

from config import get_settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None
_db_lock = threading.Lock()


def get_db() -> Client:
    """Get or create Supabase client singleton."""
    global _client
    if _client is None:
        with _db_lock:
            if _client is None:
                settings = get_settings()
                _client = create_client(settings.supabase_url, settings.supabase_service_key)
                logger.info(f"Supabase client initialized for {settings.supabase_url}")
    return _client


async def execute_async(query_builder):
    """
    Execute Supabase query in a thread pool to avoid blocking the event loop.
    Required because supabase-py client is synchronous.
    """
    return await asyncio.to_thread(query_builder.execute)


# ── User Operations ──


async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user profile (Async)."""
    db = get_db()
    query = db.table("users").insert(user_data)
    result = await execute_async(query)
    if not result.data:
        raise Exception("Failed to create user")
    return result.data[0]


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Find a user by their internal user_id (Async)."""
    db = get_db()
    query = db.table("users").select("*").eq("user_id", user_id).limit(1)
    result = await execute_async(query)
    return result.data[0] if result.data else None


async def get_user_by_supabase_id(supabase_id: str) -> Optional[Dict[str, Any]]:
    """Find a user by their Supabase auth ID (Async)."""
    db = get_db()
    query = db.table("users").select("*").eq("supabase_id", supabase_id).limit(1)
    result = await execute_async(query)
    return result.data[0] if result.data else None


async def update_user(user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a user profile (Async)."""
    db = get_db()
    query = db.table("users").update(update_data).eq("user_id", user_id)
    result = await execute_async(query)
    return result.data[0] if result.data else None


# ── Journal Operations ──


async def create_journal_entry(entry_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new journal entry (Async)."""
    db = get_db()
    query = db.table("journal_entries").insert(entry_data)
    result = await execute_async(query)
    if not result.data:
        raise Exception("Failed to create journal entry")
    return result.data[0]


async def get_journal_entries(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """Get journal entries for a user with pagination (Async)."""
    db = get_db()
    query = (
        db.table("journal_entries")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    result = await execute_async(query)
    return result.data or []


async def get_journal_entry(entry_id: str) -> Optional[Dict[str, Any]]:
    """Get a single journal entry (Async)."""
    db = get_db()
    query = db.table("journal_entries").select("*").eq("entry_id", entry_id).limit(1)
    result = await execute_async(query)
    return result.data[0] if result.data else None


async def update_journal_entry(entry_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a journal entry (Async)."""
    db = get_db()
    query = (
        db.table("journal_entries")
        .update(update_data)
        .eq("entry_id", entry_id)
    )
    result = await execute_async(query)
    return result.data[0] if result.data else None


async def delete_journal_entry(entry_id: str) -> bool:
    """Delete a journal entry (Async). Returns True if deleted."""
    db = get_db()
    query = db.table("journal_entries").delete().eq("entry_id", entry_id)
    result = await execute_async(query)
    return len(result.data) > 0 if result.data else False


# ── Chat Operations ──


async def create_chat_message(message_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new chat message (Async)."""
    db = get_db()
    query = db.table("chat_messages").insert(message_data)
    result = await execute_async(query)
    if not result.data:
        raise Exception("Failed to create chat message")
    return result.data[0]


async def get_chat_messages(
    conversation_id: str,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """Get chat messages for a conversation (Async)."""
    db = get_db()
    query = (
        db.table("chat_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .limit(limit)
    )
    result = await execute_async(query)
    return result.data or []


async def get_user_conversations(user_id: str) -> List[Dict[str, Any]]:
    """Get user's conversations using RPC function (Async)."""
    db = get_db()
    query = db.rpc("get_user_conversations", {"p_user_id": user_id})
    result = await execute_async(query)
    return result.data or []


# ── Health Check ──


async def check_db_health() -> bool:
    """Check if database is accessible (Async)."""
    try:
        db = get_db()
        query = db.table("users").select("user_id").limit(1)
        await execute_async(query)
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# ── Daily Insights ──


async def get_daily_insight(user_id: str, date: str) -> Optional[Dict[str, Any]]:
    """Get daily insight for a user on a specific date (Async)."""
    db = get_db()
    
    query = (
        db.table("daily_insights")
        .select("content")
        .eq("user_id", user_id)
        .eq("date", date)
        .limit(1)
    )
    
    result = await execute_async(query)
    return result.data[0]["content"] if result.data else None


async def create_daily_insight(user_id: str, date: str, content: Dict[str, Any]) -> Dict[str, Any]:
    """Store a daily insight (Async)."""
    db = get_db()
    data = {"user_id": user_id, "date": date, "content": content}
    
    query = db.table("daily_insights").insert(data)
    result = await execute_async(query)
    
    if not result.data:
        raise Exception("Failed to store daily insight")
    return result.data[0]
