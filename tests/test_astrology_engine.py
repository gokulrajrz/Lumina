"""
Unit tests for the Astrology Engine.
Tests birth chart calculations against known results.
"""

import pytest
from services.astrology_engine import (
    calculate_birth_chart,
    calculate_current_transits,
    get_zodiac_sign,
    _calculate_aspects,
    _assign_house,
    ZODIAC_SIGNS,
)


class TestGetZodiacSign:
    """Test zodiac sign determination from longitude."""

    def test_aries_start(self):
        assert get_zodiac_sign(0) == "Aries"

    def test_aries_end(self):
        assert get_zodiac_sign(29.99) == "Aries"

    def test_taurus_start(self):
        assert get_zodiac_sign(30) == "Taurus"

    def test_leo(self):
        assert get_zodiac_sign(130) == "Leo"

    def test_pisces(self):
        assert get_zodiac_sign(350) == "Pisces"

    def test_capricorn(self):
        assert get_zodiac_sign(280) == "Capricorn"

    def test_all_signs_covered(self):
        """Each 30-degree segment should map to a unique sign."""
        signs = []
        for i in range(12):
            signs.append(get_zodiac_sign(i * 30 + 15))
        assert len(set(signs)) == 12
        assert signs == ZODIAC_SIGNS


class TestBirthChartCalculation:
    """Test birth chart calculation end-to-end."""

    # Known birth data: January 15, 1990, 14:30, New York City
    TEST_DATE = "1990-01-15"
    TEST_TIME = "14:30"
    TEST_LAT = 40.7128
    TEST_LON = -74.0060

    def test_chart_returns_all_fields(self):
        """Chart should contain planets, ascendant, midheaven, houses, aspects."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        assert "planets" in chart
        assert "ascendant" in chart
        assert "midheaven" in chart
        assert "houses" in chart
        assert "aspects" in chart

    def test_chart_has_all_planets(self):
        """Chart should have all standard planets plus nodes."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        expected_planets = [
            "Sun", "Moon", "Mercury", "Venus", "Mars",
            "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
            "North Node", "South Node",
        ]
        for planet in expected_planets:
            assert planet in chart["planets"], f"Missing planet: {planet}"

    def test_planet_has_required_fields(self):
        """Each planet position should have sign, degree, house, retrograde."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        for name, data in chart["planets"].items():
            assert "sign" in data, f"{name} missing sign"
            assert "degree" in data, f"{name} missing degree"
            assert "house" in data, f"{name} missing house"
            assert "retrograde" in data, f"{name} missing retrograde"
            assert data["sign"] in ZODIAC_SIGNS, f"{name} has invalid sign: {data['sign']}"
            assert 0 <= data["degree"] < 30, f"{name} degree out of range: {data['degree']}"

    def test_sun_in_capricorn(self):
        """January 15 Sun should be in Capricorn."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        assert chart["planets"]["Sun"]["sign"] == "Capricorn"

    def test_twelve_houses(self):
        """Chart should always have exactly 12 houses."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        assert len(chart["houses"]) == 12

    def test_house_numbers_sequential(self):
        """Houses should be numbered 1-12."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        house_numbers = [h["house"] for h in chart["houses"]]
        assert house_numbers == list(range(1, 13))

    def test_ascendant_has_sign(self):
        """Ascendant should have a valid sign."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        assert chart["ascendant"]["sign"] in ZODIAC_SIGNS

    def test_south_node_opposite_north_node(self):
        """South Node should be ~180° from North Node."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        nn_deg = chart["planets"]["North Node"]["absolute_degree"]
        sn_deg = chart["planets"]["South Node"]["absolute_degree"]
        diff = abs(nn_deg - sn_deg)
        if diff > 180:
            diff = 360 - diff
        assert abs(diff - 180) < 1, f"Nodes not opposite: diff={diff}"

    def test_aspects_have_required_fields(self):
        """Each aspect should have planet1, planet2, type, angle, orb."""
        chart = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, self.TEST_LAT, self.TEST_LON
        )
        for aspect in chart["aspects"]:
            assert "planet1" in aspect
            assert "planet2" in aspect
            assert "type" in aspect
            assert "angle" in aspect
            assert "orb" in aspect

    def test_different_locations_give_different_ascendants(self):
        """Different birth locations should produce different charts."""
        chart_ny = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, 40.7128, -74.0060
        )
        chart_tokyo = calculate_birth_chart(
            self.TEST_DATE, self.TEST_TIME, 35.6762, 139.6503
        )
        # Ascendant depends on location, so should differ
        # (Planets will be the same since swe doesn't account for location)
        assert chart_ny["ascendant"] != chart_tokyo["ascendant"]


class TestInvalidInputs:
    """Test error handling for invalid inputs."""

    def test_invalid_date_format(self):
        with pytest.raises(ValueError):
            calculate_birth_chart("not-a-date", "12:00", 40.0, -74.0)

    def test_empty_date(self):
        with pytest.raises((ValueError, Exception)):
            calculate_birth_chart("", "12:00", 40.0, -74.0)


class TestCalculateAspects:
    """Test aspect calculation logic."""

    def test_conjunction(self):
        """Two planets at same longitude = conjunction."""
        aspects = _calculate_aspects({"Sun": 100.0, "Moon": 103.0})
        assert len(aspects) == 1
        assert aspects[0]["type"] == "conjunction"

    def test_opposition(self):
        """Two planets 180° apart = opposition."""
        aspects = _calculate_aspects({"Sun": 10.0, "Moon": 190.0})
        assert len(aspects) >= 1
        types = [a["type"] for a in aspects]
        assert "opposition" in types

    def test_trine(self):
        """Two planets 120° apart = trine."""
        aspects = _calculate_aspects({"Sun": 0.0, "Moon": 120.0})
        assert len(aspects) >= 1
        types = [a["type"] for a in aspects]
        assert "trine" in types

    def test_square(self):
        """Two planets 90° apart = square."""
        aspects = _calculate_aspects({"Sun": 0.0, "Moon": 90.0})
        assert len(aspects) >= 1
        types = [a["type"] for a in aspects]
        assert "square" in types

    def test_no_aspect(self):
        """Two planets at random angle = no standard aspect."""
        aspects = _calculate_aspects({"Sun": 0.0, "Moon": 45.0})
        assert len(aspects) == 0


class TestCurrentTransits:
    """Test current transit calculations."""

    def test_transits_return_structure(self):
        """Transits should return required fields."""
        fake_chart = {
            "planets": {
                "Sun": {"sign": "Aries", "absolute_degree": 15.0},
                "Moon": {"sign": "Cancer", "absolute_degree": 100.0},
            }
        }
        transits = calculate_current_transits(fake_chart)
        assert "date" in transits
        assert "moon_sign" in transits
        assert "moon_phase" in transits
        assert "active_transits" in transits
        assert transits["moon_sign"] in ZODIAC_SIGNS

    def test_moon_phase_valid(self):
        """Moon phase should be one of 8 standard phases."""
        fake_chart = {"planets": {}}
        transits = calculate_current_transits(fake_chart)
        valid_phases = [
            "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
            "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
        ]
        assert transits["moon_phase"] in valid_phases
