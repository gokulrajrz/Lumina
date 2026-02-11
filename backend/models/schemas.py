"""
Pydantic models for request/response validation.
Provides strong input validation for all API endpoints.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any
import re
from datetime import date


# ── Common Models ──

class PlanetPlacement(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    sign: str
    degree: float
    absolute_degree: float
    house: int
    retrograde: bool


class ZodiacPosition(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    sign: str
    degree: float


class HouseCusp(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    house: int
    sign: str
    degree: float
    absolute_degree: float


class Aspect(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    planet1: str
    planet2: str
    type: str
    angle: float
    orb: float


class BirthChartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    planets: Dict[str, PlanetPlacement]
    ascendant: ZodiacPosition
    midheaven: ZodiacPosition
    houses: List[HouseCusp]
    aspects: List[Aspect]


class TransitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    date: str
    moon_sign: str
    moon_phase: str
    active_transits: List[Dict[str, Any]]


class EnergyForecast(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    morning: str
    afternoon: str
    evening: str


# ── Request Models ──

class BirthDataInput(BaseModel):
    """Validated birth data for chart calculation."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    birth_date: str = Field(..., description="Birth date in YYYY-MM-DD format")
    birth_time: str = Field(..., description="Birth time in HH:MM format")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")
    city: str = Field(..., min_length=1, max_length=100, description="Birth city")
    timezone_str: str = Field(default="UTC", description="Timezone string")

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Birth date must be in YYYY-MM-DD format")
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError(f"Invalid date: {v}")
        return v

    @field_validator("birth_time")
    @classmethod
    def validate_birth_time(cls, v: str) -> str:
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Birth time must be in HH:MM format")
        parts = v.split(":")
        hours, minutes = int(parts[0]), int(parts[1])
        if not (0 <= hours <= 23 and 0 <= minutes <= 59):
            raise ValueError("Invalid time: hours must be 0-23, minutes 0-59")
        return v


class UserProfileCreate(BaseModel):
    """Validated user profile creation request."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    display_name: str = Field(..., min_length=1, max_length=50, description="Display name")
    email: Optional[str] = Field(default=None, description="Email address")
    birth_date: str = Field(..., description="Birth date in YYYY-MM-DD format")
    birth_time: str = Field(..., description="Birth time in HH:MM format")
    latitude: float = Field(default=0.0, ge=-90, le=90)
    longitude: float = Field(default=0.0, ge=-180, le=180)
    city: str = Field(..., min_length=1, max_length=100)
    timezone_str: str = Field(default="UTC")

    @field_validator("city", "timezone_str")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v: str) -> str:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
            raise ValueError("Birth date must be in YYYY-MM-DD format")
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError(f"Invalid date: {v}")
        return v

    @field_validator("birth_time")
    @classmethod
    def validate_birth_time(cls, v: str) -> str:
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Birth time must be in HH:MM format")
        parts = v.split(":")
        hours, minutes = int(parts[0]), int(parts[1])
        if not (0 <= hours <= 23 and 0 <= minutes <= 59):
            raise ValueError("Invalid time: hours must be 0-23, minutes 0-59")
        return v

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        return v.strip()


class JournalEntryCreate(BaseModel):
    """Validated journal entry creation."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    content: str = Field(default="", min_length=0, max_length=10000)
    mood: int = Field(..., ge=1, le=5)
    tags: List[str] = Field(default=[], max_length=20)
    prompt: str = Field(default="", max_length=1000)
    audio_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        cleaned = []
        for tag in v:
            tag = tag.strip().lower()
            if tag and len(tag) <= 30:
                cleaned.append(tag)
        return cleaned


class JournalEntryUpdate(BaseModel):
    """Validated journal entry update."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    content: Optional[str] = Field(default=None, min_length=0, max_length=10000)
    mood: Optional[int] = Field(default=None, ge=1, le=5)
    tags: Optional[List[str]] = Field(default=None, max_length=20)
    audio_url: Optional[str] = Field(default=None, max_length=500)


class ChatMessageInput(BaseModel):
    """Validated chat message input."""
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = Field(default=None, max_length=36)


# ── Response Models ──

class UserResponse(BaseModel):
    """Normalized user profile response."""
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    user_id: str
    supabase_id: str
    display_name: str
    email: Optional[str] = None
    birth_date: str
    birth_time: str
    city: str
    timezone_str: str
    birth_chart: BirthChartResponse
    preferences: Optional[Dict[str, Any]] = None
    created_at: str


class JournalEntryResponse(BaseModel):
    """Normalized journal entry response."""
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    entry_id: str
    user_id: str
    content: str
    mood: int
    tags: List[str]
    prompt: str
    audio_url: Optional[str] = None
    transits_snapshot: Dict[str, Any]
    created_at: str
    updated_at: str


class ChatMessageResponse(BaseModel):
    """Normalized chat message response."""
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    message_id: str
    conversation_id: str
    user_id: str
    role: str
    content: str
    created_at: str


class ConversationResponse(BaseModel):
    """Normalized conversation summary response."""
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    conversation_id: str
    last_message: str
    last_at: str
    message_count: int


class ChatInteractionResponse(BaseModel):
    """Response containing both user message and AI response."""
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    conversation_id: str
    user_message: ChatMessageResponse
    ai_message: ChatMessageResponse


class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    status: str
    version: str
    database: str
    ai_service: str


class DailyBriefingResponse(BaseModel):
    """Normalized daily briefing response matching AI output."""
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    energyRating: int
    theme: str
    energyForecast: EnergyForecast
    favors: List[str]
    mindful: List[str]
    luckyColor: str
    luckyNumber: int
    journalPrompt: str
    transits: Optional[TransitResponse] = None
