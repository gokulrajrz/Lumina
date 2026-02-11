"""
Application configuration with validation using pydantic-settings.
All environment variables are validated at startup.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Validated application settings loaded from environment."""

    # Supabase
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_service_key: str = Field(..., description="Supabase service role key")
    supabase_jwt_secret: str = Field(
        default="",
        description="Supabase JWT secret for token verification"
    )

    # Gemini AI
    gemini_api_key: str = Field(..., description="Google Gemini API key")
    gemini_model: str = Field(
        default="gemini-1.5-flash",
        description="Gemini model to use"
    )

    # Server
    app_name: str = Field(default="Lumina API", description="Application name")
    debug: bool = Field(default=False, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    # CORS
    cors_origins: str | list[str] = Field(
        default="http://localhost:8081,http://localhost:19006",
        description="Comma-separated allowed CORS origins"
    )

    # Rate limiting
    rate_limit_ai: str = Field(
        default="10/minute",
        description="Rate limit for AI generation"
    )
    rate_limit_journal: str = Field(
        default="30/minute",
        description="Rate limit for journal creation"
    )
    rate_limit_user: str = Field(
        default="5/minute",
        description="Rate limit for user profile creation"
    )
    rate_limit_default: str = Field(
        default="60/minute",
        description="Default rate limit"
    )

    @field_validator("cors_origins")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, list):
            return v
        if not v or not v.strip():
            return ["http://localhost:8081", "http://localhost:19006"]
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    def get_cors_origins(self) -> list[str]:
        """Return the pre-parsed CORS origins."""
        return self.cors_origins

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
