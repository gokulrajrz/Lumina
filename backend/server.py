from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import swisseph as swe
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gemini API key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Swiss Ephemeris
swe.set_ephe_path(None)  # Use built-in ephemeris

app = FastAPI(title="Lumina API")
api_router = APIRouter(prefix="/api")

# ── Zodiac Constants ──
ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

PLANET_IDS = {
    'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY,
    'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER,
    'Saturn': swe.SATURN, 'Uranus': swe.URANUS, 'Neptune': swe.NEPTUNE,
    'Pluto': swe.PLUTO, 'North Node': swe.TRUE_NODE
}

ASPECT_DEFS = [
    {'type': 'conjunction', 'angle': 0, 'orb': 8},
    {'type': 'opposition', 'angle': 180, 'orb': 8},
    {'type': 'trine', 'angle': 120, 'orb': 8},
    {'type': 'square', 'angle': 90, 'orb': 7},
    {'type': 'sextile', 'angle': 60, 'orb': 6},
]

MOON_PHASES = [
    'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
]


# ── Pydantic Models ──
class BirthDataInput(BaseModel):
    birth_date: str  # YYYY-MM-DD
    birth_time: str  # HH:MM
    latitude: float
    longitude: float
    city: str
    timezone_str: str = "UTC"


class UserProfileCreate(BaseModel):
    supabase_id: Optional[str] = None
    display_name: str
    email: Optional[str] = None
    birth_date: str
    birth_time: str
    latitude: float
    longitude: float
    city: str
    timezone_str: str = "UTC"


class JournalEntryCreate(BaseModel):
    content: str
    mood: int = Field(ge=1, le=5)
    tags: List[str] = []
    prompt: str = ""


class JournalEntryUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[int] = Field(default=None, ge=1, le=5)
    tags: Optional[List[str]] = None


class ChatMessageInput(BaseModel):
    message: str
    conversation_id: Optional[str] = None


# ── Astrology Engine ──
def get_zodiac_sign(longitude: float) -> str:
    return ZODIAC_SIGNS[int(longitude / 30) % 12]


def calculate_birth_chart(birth_date: str, birth_time: str, lat: float, lon: float) -> dict:
    """Calculate a complete birth chart using Swiss Ephemeris."""
    try:
        parts = birth_date.split('-')
        year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
        time_parts = birth_time.split(':')
        hours = int(time_parts[0]) + int(time_parts[1]) / 60.0

        jd = swe.julday(year, month, day, hours)

        planets = {}
        planet_longitudes = {}

        for name, pid in PLANET_IDS.items():
            try:
                result = swe.calc_ut(jd, pid)
                lon_val = result[0][0]
                speed = result[0][3] if len(result[0]) > 3 else 0
                planet_longitudes[name] = lon_val
                planets[name] = {
                    'sign': get_zodiac_sign(lon_val),
                    'degree': round(lon_val % 30, 2),
                    'absolute_degree': round(lon_val, 2),
                    'house': 1,
                    'retrograde': speed < 0
                }
            except Exception as e:
                logger.warning(f"Failed to calculate {name}: {e}")
                planets[name] = {
                    'sign': 'Aries', 'degree': 0, 'absolute_degree': 0,
                    'house': 1, 'retrograde': False
                }

        # South Node = opposite of North Node
        if 'North Node' in planet_longitudes:
            sn_lon = (planet_longitudes['North Node'] + 180) % 360
            planets['South Node'] = {
                'sign': get_zodiac_sign(sn_lon),
                'degree': round(sn_lon % 30, 2),
                'absolute_degree': round(sn_lon, 2),
                'house': 1,
                'retrograde': False
            }

        # Calculate houses (Placidus)
        houses_data = []
        ascendant_lon = 0
        mc_lon = 0
        try:
            cusps, ascmc = swe.houses(jd, lat, lon, b'P')
            ascendant_lon = ascmc[0]
            mc_lon = ascmc[1]
            for i, cusp in enumerate(cusps):
                houses_data.append({
                    'house': i + 1,
                    'sign': get_zodiac_sign(cusp),
                    'degree': round(cusp % 30, 2),
                    'absolute_degree': round(cusp, 2)
                })

            # Assign houses to planets
            for name, lon_val in planet_longitudes.items():
                for i in range(12):
                    cur = cusps[i]
                    nxt = cusps[(i + 1) % 12]
                    if cur < nxt:
                        if cur <= lon_val < nxt:
                            planets[name]['house'] = i + 1
                            break
                    else:
                        if lon_val >= cur or lon_val < nxt:
                            planets[name]['house'] = i + 1
                            break
            if 'South Node' in planets:
                sn_abs = planets['South Node']['absolute_degree']
                for i in range(12):
                    cur = cusps[i]
                    nxt = cusps[(i + 1) % 12]
                    if cur < nxt:
                        if cur <= sn_abs < nxt:
                            planets['South Node']['house'] = i + 1
                            break
                    else:
                        if sn_abs >= cur or sn_abs < nxt:
                            planets['South Node']['house'] = i + 1
                            break
        except Exception as e:
            logger.warning(f"House calculation failed: {e}")
            for i in range(12):
                houses_data.append({
                    'house': i + 1, 'sign': ZODIAC_SIGNS[i],
                    'degree': 0, 'absolute_degree': i * 30
                })

        # Calculate aspects
        aspects = []
        planet_names = list(planet_longitudes.keys())
        for i in range(len(planet_names)):
            for j in range(i + 1, len(planet_names)):
                lon1 = planet_longitudes[planet_names[i]]
                lon2 = planet_longitudes[planet_names[j]]
                angle = abs(lon1 - lon2)
                if angle > 180:
                    angle = 360 - angle
                for asp_def in ASPECT_DEFS:
                    diff = abs(angle - asp_def['angle'])
                    if diff <= asp_def['orb']:
                        aspects.append({
                            'planet1': planet_names[i],
                            'planet2': planet_names[j],
                            'type': asp_def['type'],
                            'angle': round(angle, 2),
                            'orb': round(diff, 2)
                        })

        return {
            'planets': planets,
            'ascendant': {
                'sign': get_zodiac_sign(ascendant_lon),
                'degree': round(ascendant_lon % 30, 2)
            },
            'midheaven': {
                'sign': get_zodiac_sign(mc_lon),
                'degree': round(mc_lon % 30, 2)
            },
            'houses': houses_data,
            'aspects': aspects
        }
    except Exception as e:
        logger.error(f"Birth chart calculation error: {e}")
        raise HTTPException(status_code=500, detail=f"Chart calculation failed: {str(e)}")


def calculate_current_transits(birth_chart: dict) -> dict:
    """Calculate current planetary transits relative to birth chart."""
    now = datetime.now(timezone.utc)
    jd = swe.julday(now.year, now.month, now.day, now.hour + now.minute / 60.0)

    # Current Moon
    moon_result = swe.calc_ut(jd, swe.MOON)
    moon_lon = moon_result[0][0]
    moon_sign = get_zodiac_sign(moon_lon)

    # Moon phase
    sun_result = swe.calc_ut(jd, swe.SUN)
    sun_lon = sun_result[0][0]
    phase_angle = (moon_lon - sun_lon) % 360
    phase_idx = int(phase_angle / 45) % 8
    moon_phase = MOON_PHASES[phase_idx]

    # Current planet positions
    current_positions = {}
    transit_planets = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
    for name in transit_planets:
        pid = PLANET_IDS[name]
        result = swe.calc_ut(jd, pid)
        current_positions[name] = result[0][0]

    # Find active transits
    active_transits = []
    natal_planets = birth_chart.get('planets', {})
    for transit_name, transit_lon in current_positions.items():
        for natal_name, natal_data in natal_planets.items():
            if natal_name in ('South Node',):
                continue
            natal_lon = natal_data.get('absolute_degree', 0)
            angle = abs(transit_lon - natal_lon)
            if angle > 180:
                angle = 360 - angle

            for asp_def in ASPECT_DEFS:
                diff = abs(angle - asp_def['angle'])
                if diff <= 3:  # Tighter orb for transits
                    active_transits.append({
                        'planet': transit_name,
                        'type': asp_def['type'],
                        'natal_planet': natal_name,
                        'orb': round(diff, 2)
                    })

    return {
        'date': now.isoformat(),
        'moon_sign': moon_sign,
        'moon_phase': moon_phase,
        'active_transits': active_transits[:10]  # Limit to top 10
    }


# ── AI Service ──
async def generate_ai_response(system_msg: str, user_msg: str, session_id: str = None) -> str:
    """Generate AI response using Gemini 3 Pro via emergentintegrations."""
    try:
        if not session_id:
            session_id = str(uuid.uuid4())

        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=session_id,
            system_message=system_msg
        )
        chat.with_model("gemini", "gemini-3-pro-preview")

        message = UserMessage(text=user_msg)
        response = await chat.send_message(message)
        return response
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ── API Routes ──

@api_router.get("/")
async def root():
    return {"message": "Lumina API is running", "version": "1.0.0"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


# ── User Profile ──

@api_router.post("/users")
async def create_user(data: UserProfileCreate):
    birth_chart = calculate_birth_chart(
        data.birth_date, data.birth_time,
        data.latitude, data.longitude
    )
    user_id = str(uuid.uuid4())
    user_doc = {
        'user_id': user_id,
        'supabase_id': data.supabase_id,
        'display_name': data.display_name,
        'email': data.email,
        'birth_date': data.birth_date,
        'birth_time': data.birth_time,
        'latitude': data.latitude,
        'longitude': data.longitude,
        'city': data.city,
        'timezone_str': data.timezone_str,
        'birth_chart': birth_chart,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'preferences': {
            'notifications': {
                'daily_briefing': True,
                'transit_alerts': True,
                'preferred_time': '08:00'
            },
            'theme': 'dark'
        }
    }
    await db.users.insert_one(user_doc)
    user_doc.pop('_id', None)
    return user_doc


@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@api_router.get("/users/by-supabase/{supabase_id}")
async def get_user_by_supabase(supabase_id: str):
    user = await db.users.find_one({'supabase_id': supabase_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Birth Chart ──

@api_router.post("/astrology/birth-chart")
async def compute_birth_chart(data: BirthDataInput):
    chart = calculate_birth_chart(
        data.birth_date, data.birth_time,
        data.latitude, data.longitude
    )
    return chart


@api_router.get("/astrology/transits/{user_id}")
async def get_transits(user_id: str):
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    transits = calculate_current_transits(user.get('birth_chart', {}))
    return transits


# ── Daily Briefing ──

@api_router.get("/briefing/{user_id}")
async def get_daily_briefing(user_id: str):
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    birth_chart = user.get('birth_chart', {})
    transits = calculate_current_transits(birth_chart)
    planets = birth_chart.get('planets', {})
    sun_sign = planets.get('Sun', {}).get('sign', 'Unknown')
    moon_sign = planets.get('Moon', {}).get('sign', 'Unknown')
    asc_sign = birth_chart.get('ascendant', {}).get('sign', 'Unknown')

    transits_summary = ', '.join([
        f"{t['planet']} {t['type']} natal {t['natal_planet']}"
        for t in transits.get('active_transits', [])[:5]
    ]) or 'No major transits'

    system_msg = "You are Lumina, a modern astrology advisor. You provide warm, grounded, actionable cosmic guidance. Always respond with valid JSON only, no markdown."

    user_msg = f"""Generate a personalized daily briefing for today.

USER CHART: Sun: {sun_sign}, Moon: {moon_sign}, Rising: {asc_sign}
TODAY: Moon in {transits['moon_sign']} ({transits['moon_phase']})
Active Transits: {transits_summary}

Respond with ONLY this JSON structure (no markdown, no code blocks):
{{"energyRating": 4, "theme": "Brief inspiring theme for today", "energyForecast": {{"morning": "High - good for creative work", "afternoon": "Medium - focus on routine tasks", "evening": "Calm - ideal for reflection"}}, "favors": ["First favored activity", "Second favored activity", "Third favored activity"], "mindful": ["First thing to watch", "Second thing to watch"], "luckyColor": "Soft Blue", "luckyNumber": 7, "journalPrompt": "A reflective question for today?"}}"""

    try:
        response = await generate_ai_response(system_msg, user_msg, f"briefing-{user_id}-{datetime.now(timezone.utc).strftime('%Y%m%d')}")

        # Try to parse JSON from response
        text = response.strip()
        # Remove markdown code blocks if present
        if text.startswith('```'):
            text = text.split('\n', 1)[1] if '\n' in text else text[3:]
            if text.endswith('```'):
                text = text[:-3]
            if text.startswith('json'):
                text = text[4:]
            text = text.strip()

        briefing = json.loads(text)
        briefing['transits'] = transits
        return briefing
    except json.JSONDecodeError:
        # Return a fallback briefing
        return {
            'energyRating': 3,
            'theme': f'A day of {transits["moon_phase"]} energy with Moon in {transits["moon_sign"]}',
            'energyForecast': {
                'morning': 'Good energy for planning',
                'afternoon': 'Steady focus time',
                'evening': 'Wind down and reflect'
            },
            'favors': ['Creative projects', 'Deep conversations', 'Self-care'],
            'mindful': ['Avoid impulsive decisions', 'Take breaks when needed'],
            'luckyColor': 'Violet',
            'luckyNumber': 7,
            'journalPrompt': 'What patterns are you noticing in your life right now?',
            'transits': transits
        }


# ── Journal ──

@api_router.post("/journal/{user_id}")
async def create_journal_entry(user_id: str, data: JournalEntryCreate):
    user = await db.users.find_one({'user_id': user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Get current transits snapshot
    transits = calculate_current_transits(user.get('birth_chart', {}))

    entry = {
        'entry_id': entry_id,
        'user_id': user_id,
        'content': data.content,
        'mood': data.mood,
        'tags': data.tags,
        'prompt': data.prompt,
        'transits_snapshot': transits,
        'created_at': now.isoformat(),
        'updated_at': now.isoformat()
    }
    await db.journal_entries.insert_one(entry)
    entry.pop('_id', None)
    return entry


@api_router.get("/journal/{user_id}")
async def get_journal_entries(user_id: str, limit: int = 50, skip: int = 0):
    entries = await db.journal_entries.find(
        {'user_id': user_id}, {'_id': 0}
    ).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    return entries


@api_router.put("/journal/entry/{entry_id}")
async def update_journal_entry(entry_id: str, data: JournalEntryUpdate):
    update_data = {}
    if data.content is not None:
        update_data['content'] = data.content
    if data.mood is not None:
        update_data['mood'] = data.mood
    if data.tags is not None:
        update_data['tags'] = data.tags
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()

    result = await db.journal_entries.update_one(
        {'entry_id': entry_id}, {'$set': update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")

    entry = await db.journal_entries.find_one({'entry_id': entry_id}, {'_id': 0})
    return entry


@api_router.delete("/journal/entry/{entry_id}")
async def delete_journal_entry(entry_id: str):
    result = await db.journal_entries.delete_one({'entry_id': entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"deleted": True}


# ── AI Journal Prompt ──

@api_router.get("/journal/prompt/{user_id}")
async def get_journal_prompt(user_id: str):
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    birth_chart = user.get('birth_chart', {})
    transits = calculate_current_transits(birth_chart)
    planets = birth_chart.get('planets', {})

    system_msg = "You are Lumina, a thoughtful astrology advisor. Generate a single reflective journal prompt. Return ONLY the question, nothing else."

    transits_text = ', '.join([
        f"{t['planet']} {t['type']} natal {t['natal_planet']}"
        for t in transits.get('active_transits', [])[:3]
    ]) or 'Calm cosmic day'

    user_msg = f"""Generate ONE journal prompt for today.
User: {planets.get('Sun', {}).get('sign', 'Unknown')} Sun, {planets.get('Moon', {}).get('sign', 'Unknown')} Moon
Moon today: {transits['moon_sign']} ({transits['moon_phase']})
Transits: {transits_text}
Return ONLY the question."""

    try:
        prompt = await generate_ai_response(system_msg, user_msg, f"prompt-{user_id}-{datetime.now(timezone.utc).strftime('%Y%m%d')}")
        return {"prompt": prompt.strip().strip('"').strip("'")}
    except Exception:
        return {"prompt": "What patterns are you noticing in your life right now?"}


# ── AI Chat ──

@api_router.post("/chat/{user_id}")
async def chat_with_ai(user_id: str, data: ChatMessageInput):
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    conv_id = data.conversation_id or str(uuid.uuid4())
    birth_chart = user.get('birth_chart', {})
    transits = calculate_current_transits(birth_chart)
    planets = birth_chart.get('planets', {})

    # Get recent conversation history
    history = await db.chat_messages.find(
        {'conversation_id': conv_id}, {'_id': 0}
    ).sort('created_at', 1).limit(10).to_list(10)

    history_text = '\n'.join([
        f"{m['role']}: {m['content']}" for m in history[-6:]
    ])

    transits_text = ', '.join([
        f"{t['planet']} {t['type']} natal {t['natal_planet']}"
        for t in transits.get('active_transits', [])[:5]
    ]) or 'No major transits'

    system_msg = f"""You are Lumina, a wise and warm astrology advisor. You help users with life decisions using astrological wisdom.

USER'S CHART:
Sun: {planets.get('Sun', {}).get('sign', 'Unknown')}, Moon: {planets.get('Moon', {}).get('sign', 'Unknown')}, Rising: {birth_chart.get('ascendant', {}).get('sign', 'Unknown')}

CURRENT COSMIC WEATHER:
Moon: {transits['moon_sign']} ({transits['moon_phase']})
Active Transits: {transits_text}

Guidelines:
- Address questions directly with astrological reasoning
- Offer practical, actionable advice
- Keep responses 150-250 words
- Maintain a warm, grounded, modern tone"""

    conv_context = f"Previous conversation:\n{history_text}\n\n" if history_text else ""
    user_msg = f"{conv_context}User: {data.message}"

    # Save user message
    user_msg_doc = {
        'message_id': str(uuid.uuid4()),
        'conversation_id': conv_id,
        'user_id': user_id,
        'role': 'user',
        'content': data.message,
        'saved': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_msg_doc)
    user_msg_doc.pop('_id', None)

    # Generate AI response
    ai_response = await generate_ai_response(system_msg, user_msg, f"chat-{conv_id}")

    # Save AI message
    ai_msg_doc = {
        'message_id': str(uuid.uuid4()),
        'conversation_id': conv_id,
        'user_id': user_id,
        'role': 'assistant',
        'content': ai_response,
        'saved': False,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(ai_msg_doc)
    ai_msg_doc.pop('_id', None)

    return {
        'conversation_id': conv_id,
        'user_message': user_msg_doc,
        'ai_message': ai_msg_doc
    }


@api_router.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: str):
    messages = await db.chat_messages.find(
        {'conversation_id': conversation_id}, {'_id': 0}
    ).sort('created_at', 1).to_list(100)
    return messages


@api_router.get("/chat/conversations/{user_id}")
async def get_conversations(user_id: str):
    pipeline = [
        {'$match': {'user_id': user_id}},
        {'$sort': {'created_at': -1}},
        {'$group': {
            '_id': '$conversation_id',
            'last_message': {'$first': '$content'},
            'last_at': {'$first': '$created_at'},
            'count': {'$sum': 1}
        }},
        {'$sort': {'last_at': -1}},
        {'$limit': 20}
    ]
    convos = await db.chat_messages.aggregate(pipeline).to_list(20)
    return [{'conversation_id': c['_id'], 'last_message': c['last_message'],
             'last_at': c['last_at'], 'message_count': c['count']} for c in convos]


# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
