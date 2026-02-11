"""
AI service using Google Gemini API.
Handles all AI generation with proper error handling and fallbacks.
"""

import logging
import json
import asyncio
from typing import Optional
from google import genai
from google.genai import types

from config import get_settings

logger = logging.getLogger(__name__)

_genai_client = None


def _get_client():
    """Get or create Gemini client."""
    global _genai_client
    if _genai_client is None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY not configured")
        _genai_client = genai.Client(api_key=settings.gemini_api_key)
    return _genai_client


async def generate_response(
    system_msg: str, user_msg: str, temperature: float = 0.7
) -> str:
    """
    Generate AI response using Gemini.

    Args:
        system_msg: System instruction for the AI.
        user_msg: User message/prompt.
        temperature: Response creativity (0.0 - 1.0).

    Returns:
        Generated text response.

    Raises:
        RuntimeError: If AI generation fails.
    """
    try:
        settings = get_settings()
        client = _get_client()

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.gemini_model,
            contents=user_msg,
            config=types.GenerateContentConfig(
                system_instruction=system_msg,
                temperature=temperature,
            ),
        )

        return response.text

    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise RuntimeError(f"AI generation failed: {str(e)}")


def _parse_json_response(text: str) -> dict:
    """
    Parse JSON from AI response, handling markdown code blocks.

    Args:
        text: Raw AI response text.

    Returns:
        Parsed JSON dictionary.

    Raises:
        json.JSONDecodeError: If text is not valid JSON.
    """
    cleaned = text.strip()

    # Remove markdown code blocks
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first line (```json or ```)
        lines = lines[1:]
        # Remove last line (```)
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    return json.loads(cleaned)


async def generate_daily_briefing(
    sun_sign: str,
    moon_sign: str,
    asc_sign: str,
    current_moon: str,
    moon_phase: str,
    transits_summary: str,
) -> dict:
    """Generate a personalized daily briefing."""

    system_msg = (
        "You are Lumina, a modern astrology advisor. You provide warm, grounded, "
        "actionable cosmic guidance. Always respond with valid JSON only, no markdown."
    )

    user_msg = f"""Generate a personalized daily briefing for today.

USER CHART: Sun: {sun_sign}, Moon: {moon_sign}, Rising: {asc_sign}
TODAY: Moon in {current_moon} ({moon_phase})
Active Transits: {transits_summary}

Respond with ONLY this JSON structure (no markdown, no code blocks):
{{"energyRating": 4, "theme": "Brief inspiring theme for today", "energyForecast": {{"morning": "High - good for creative work", "afternoon": "Medium - focus on routine tasks", "evening": "Calm - ideal for reflection"}}, "favors": ["First favored activity", "Second favored activity", "Third favored activity"], "mindful": ["First thing to watch", "Second thing to watch"], "luckyColor": "Soft Blue", "luckyNumber": 7, "journalPrompt": "A reflective question for today?"}}"""

    response = await generate_response(system_msg, user_msg)
    return _parse_json_response(response)


async def generate_journal_prompt(
    sun_sign: str, moon_sign: str, current_moon: str, moon_phase: str, transits_text: str
) -> str:
    """Generate a personalized journal prompt."""

    system_msg = (
        "You are Lumina, a thoughtful astrology advisor. Generate a single reflective "
        "journal prompt. Return ONLY the question, nothing else."
    )

    user_msg = f"""Generate ONE journal prompt for today.
User: {sun_sign} Sun, {moon_sign} Moon
Moon today: {current_moon} ({moon_phase})
Transits: {transits_text}
Return ONLY the question."""

    prompt = await generate_response(system_msg, user_msg)
    return prompt.strip().strip('"').strip("'")


async def generate_chat_response(
    sun_sign: str,
    moon_sign: str,
    asc_sign: str,
    current_moon: str,
    moon_phase: str,
    transits_text: str,
    history_text: str,
    user_message: str,
) -> str:
    """Generate AI chat response with astrological context."""

    system_msg = f"""You are Lumina, a wise and warm astrology advisor. You help users with life decisions using astrological wisdom.

USER'S CHART:
Sun: {sun_sign}, Moon: {moon_sign}, Rising: {asc_sign}

CURRENT COSMIC WEATHER:
Moon: {current_moon} ({moon_phase})
Active Transits: {transits_text}

Guidelines:
- Address questions directly with astrological reasoning
- Offer practical, actionable advice
- Keep responses 150-250 words
- Maintain a warm, grounded, modern tone"""

    conv_context = f"Previous conversation:\n{history_text}\n\n" if history_text else ""
    user_msg = f"{conv_context}User: {user_message}"

    return await generate_response(system_msg, user_msg)


def check_ai_health() -> bool:
    """Check if AI service is accessible."""
    try:
        _get_client()
        return True
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        return False
