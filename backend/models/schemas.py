"""
Pydantic models for request/response validation.
Provides strong input validation for all API endpoints.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import re
from datetime import date, time


# ── Request Models ──


class BirthDataInput(BaseModel):
    """Validated birth data for chart calculation."""
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
    display_name: str = Field(..., min_length=1, max_length=50, description="Display name")
    email: Optional[str] = Field(default=None, description="Email address")
    birth_date: str = Field(..., description="Birth date in YYYY-MM-DD format")
    birth_time: str = Field(..., description="Birth time in HH:MM format")
    latitude: float = Field(default=0.0, ge=-90, le=90)
    longitude: float = Field(default=0.0, ge=-180, le=180)
    city: str = Field(..., min_length=1, max_length=100)
    timezone_str: str = Field(default="UTC")

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

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
                raise ValueError("Invalid email format")
        return v

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        return v.strip()


class JournalEntryCreate(BaseModel):
    """Validated journal entry creation."""
    content: str = Field(..., min_length=1, max_length=10000, description="Journal content")
    mood: int = Field(..., ge=1, le=5, description="Mood rating 1-5")
    tags: List[str] = Field(default=[], max_length=20, description="Tags")
    prompt: str = Field(default="", max_length=500, description="AI prompt used")

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        # Clean and validate each tag
        cleaned = []
        for tag in v:
            tag = tag.strip().lower()
            if tag and len(tag) <= 30:
                cleaned.append(tag)
        return cleaned


class JournalEntryUpdate(BaseModel):
    """Validated journal entry update."""
    content: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    mood: Optional[int] = Field(default=None, ge=1, le=5)
    tags: Optional[List[str]] = Field(default=None, max_length=20)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        cleaned = []
        for tag in v:
            tag = tag.strip().lower()
            if tag and len(tag) <= 30:
                cleaned.append(tag)
        return cleaned


class ChatMessageInput(BaseModel):
    """Validated chat message input."""
    message: str = Field(..., min_length=1, max_length=2000, description="Chat message")
    conversation_id: Optional[str] = Field(default=None, max_length=36)


# ── Response Models ──


class PlanetPlacement(BaseModel):
    sign: str
    degree: float
    absolute_degree: float
    house: int
    retrograde: bool


class ZodiacPosition(BaseModel):
    sign: str
    degree: float


class HouseCusp(BaseModel):
    house: int
    sign: str
    degree: float
    absolute_degree: float


class Aspect(BaseModel):
    planet1: str
    planet2: str
    type: str
    angle: float
    orb: float


class BirthChartResponse(BaseModel):
    planets: Dict[str, PlanetPlacement]
    ascendant: ZodiacPosition
    midheaven: ZodiacPosition
    houses: List[HouseCusp]
    aspects: List[Aspect]


class TransitResponse(BaseModel):
    date: str
    moon_sign: str
    moon_phase: str
    active_transits: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    ai_service: str
