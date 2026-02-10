"""
Astrology engine using Swiss Ephemeris.
Encapsulates all birth chart and transit calculations.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Any
import swisseph as swe

logger = logging.getLogger(__name__)

# Initialize Swiss Ephemeris
swe.set_ephe_path(None)  # Use built-in ephemeris

# ── Constants ──

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANET_IDS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY,
    "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN, "Uranus": swe.URANUS, "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO, "North Node": swe.TRUE_NODE,
}

ASPECT_DEFINITIONS = [
    {"type": "conjunction", "angle": 0, "orb": 8},
    {"type": "opposition", "angle": 180, "orb": 8},
    {"type": "trine", "angle": 120, "orb": 8},
    {"type": "square", "angle": 90, "orb": 7},
    {"type": "sextile", "angle": 60, "orb": 6},
]

MOON_PHASES = [
    "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
]

# Tighter orb for transit aspects (more precise)
TRANSIT_ORB = 3


# ── Core Functions ──


def get_zodiac_sign(longitude: float) -> str:
    """Convert ecliptic longitude to zodiac sign name."""
    return ZODIAC_SIGNS[int(longitude / 30) % 12]


def _calculate_planet_position(jd: float, planet_id: int) -> dict:
    """Calculate position for a single planet."""
    result = swe.calc_ut(jd, planet_id)
    lon_val = result[0][0]
    speed = result[0][3] if len(result[0]) > 3 else 0
    return {
        "sign": get_zodiac_sign(lon_val),
        "degree": round(lon_val % 30, 2),
        "absolute_degree": round(lon_val, 2),
        "house": 1,  # Will be assigned later
        "retrograde": speed < 0,
    }


def _assign_house(longitude: float, cusps: list) -> int:
    """Determine which house a planet falls in given house cusps."""
    for i in range(12):
        cur = cusps[i]
        nxt = cusps[(i + 1) % 12]
        if cur < nxt:
            if cur <= longitude < nxt:
                return i + 1
        else:
            if longitude >= cur or longitude < nxt:
                return i + 1
    return 1


def _calculate_aspects(planet_longitudes: Dict[str, float]) -> List[dict]:
    """Calculate all aspects between planets."""
    aspects = []
    planet_names = list(planet_longitudes.keys())

    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            lon1 = planet_longitudes[planet_names[i]]
            lon2 = planet_longitudes[planet_names[j]]
            angle = abs(lon1 - lon2)
            if angle > 180:
                angle = 360 - angle

            for asp_def in ASPECT_DEFINITIONS:
                diff = abs(angle - asp_def["angle"])
                if diff <= asp_def["orb"]:
                    aspects.append({
                        "planet1": planet_names[i],
                        "planet2": planet_names[j],
                        "type": asp_def["type"],
                        "angle": round(angle, 2),
                        "orb": round(diff, 2),
                    })

    return aspects


def calculate_birth_chart(
    birth_date: str, birth_time: str, lat: float, lon: float
) -> dict:
    """
    Calculate a complete birth chart using Swiss Ephemeris.

    Args:
        birth_date: Date in YYYY-MM-DD format
        birth_time: Time in HH:MM format
        lat: Birth latitude
        lon: Birth longitude

    Returns:
        Complete birth chart with planets, houses, and aspects.

    Raises:
        ValueError: If input parameters are invalid.
    """
    try:
        parts = birth_date.split("-")
        year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
        time_parts = birth_time.split(":")
        hours = int(time_parts[0]) + int(time_parts[1]) / 60.0

        jd = swe.julday(year, month, day, hours)

        # Calculate planet positions
        planets = {}
        planet_longitudes = {}

        for name, pid in PLANET_IDS.items():
            try:
                position = _calculate_planet_position(jd, pid)
                planets[name] = position
                planet_longitudes[name] = position["absolute_degree"]
            except Exception as e:
                logger.warning(f"Failed to calculate {name}: {e}")
                planets[name] = {
                    "sign": "Aries", "degree": 0, "absolute_degree": 0,
                    "house": 1, "retrograde": False,
                }

        # South Node (opposite of North Node)
        if "North Node" in planet_longitudes:
            sn_lon = (planet_longitudes["North Node"] + 180) % 360
            planets["South Node"] = {
                "sign": get_zodiac_sign(sn_lon),
                "degree": round(sn_lon % 30, 2),
                "absolute_degree": round(sn_lon, 2),
                "house": 1,
                "retrograde": False,
            }
            planet_longitudes["South Node"] = sn_lon

        # Calculate houses (Placidus system)
        houses_data = []
        ascendant_lon = 0.0
        mc_lon = 0.0

        try:
            cusps, ascmc = swe.houses(jd, lat, lon, b"P")
            ascendant_lon = ascmc[0]
            mc_lon = ascmc[1]

            for i, cusp in enumerate(cusps):
                houses_data.append({
                    "house": i + 1,
                    "sign": get_zodiac_sign(cusp),
                    "degree": round(cusp % 30, 2),
                    "absolute_degree": round(cusp, 2),
                })

            # Assign houses to planets
            for name, lon_val in planet_longitudes.items():
                planets[name]["house"] = _assign_house(lon_val, cusps)

        except Exception as e:
            logger.warning(f"House calculation failed: {e}")
            for i in range(12):
                houses_data.append({
                    "house": i + 1,
                    "sign": ZODIAC_SIGNS[i],
                    "degree": 0,
                    "absolute_degree": i * 30,
                })

        # Calculate aspects
        aspects = _calculate_aspects(planet_longitudes)

        return {
            "planets": planets,
            "ascendant": {
                "sign": get_zodiac_sign(ascendant_lon),
                "degree": round(ascendant_lon % 30, 2),
            },
            "midheaven": {
                "sign": get_zodiac_sign(mc_lon),
                "degree": round(mc_lon % 30, 2),
            },
            "houses": houses_data,
            "aspects": aspects,
        }

    except Exception as e:
        logger.error(f"Birth chart calculation error: {e}")
        raise ValueError(f"Chart calculation failed: {str(e)}")


def calculate_current_transits(birth_chart: dict) -> dict:
    """
    Calculate current planetary transits relative to a birth chart.

    Args:
        birth_chart: The user's birth chart data.

    Returns:
        Current transits including moon sign, phase, and active aspects.
    """
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

    # Current positions of outer/transit planets
    transit_planet_names = ["Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
    current_positions = {}
    for name in transit_planet_names:
        pid = PLANET_IDS[name]
        result = swe.calc_ut(jd, pid)
        current_positions[name] = result[0][0]

    # Find active transits to natal planets
    active_transits = []
    natal_planets = birth_chart.get("planets", {})

    for transit_name, transit_lon in current_positions.items():
        for natal_name, natal_data in natal_planets.items():
            if natal_name == "South Node":
                continue
            natal_lon = natal_data.get("absolute_degree", 0)
            angle = abs(transit_lon - natal_lon)
            if angle > 180:
                angle = 360 - angle

            for asp_def in ASPECT_DEFINITIONS:
                diff = abs(angle - asp_def["angle"])
                if diff <= TRANSIT_ORB:
                    active_transits.append({
                        "planet": transit_name,
                        "type": asp_def["type"],
                        "natal_planet": natal_name,
                        "orb": round(diff, 2),
                    })

    return {
        "date": now.isoformat(),
        "moon_sign": moon_sign,
        "moon_phase": moon_phase,
        "active_transits": active_transits[:10],
    }
