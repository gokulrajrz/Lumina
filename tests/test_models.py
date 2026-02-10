"""
Unit tests for Pydantic request/response models.
Validates input validation rules.
"""

import pytest
from pydantic import ValidationError
from models.schemas import (
    UserProfileCreate,
    JournalEntryCreate,
    JournalEntryUpdate,
    ChatMessageInput,
    BirthDataInput,
)


class TestUserProfileCreate:
    """Test user profile validation."""

    def test_valid_profile(self):
        profile = UserProfileCreate(
            display_name="Test User",
            email="test@example.com",
            birth_date="1990-01-15",
            birth_time="14:30",
            latitude=40.7128,
            longitude=-74.006,
            city="New York",
        )
        assert profile.display_name == "Test User"

    def test_strips_display_name(self):
        profile = UserProfileCreate(
            display_name="  Test User  ",
            birth_date="1990-01-15",
            birth_time="14:30",
            latitude=40.7128,
            longitude=-74.006,
            city="New York",
        )
        assert profile.display_name == "Test User"

    def test_invalid_date_format(self):
        with pytest.raises(ValidationError):
            UserProfileCreate(
                display_name="Test",
                birth_date="01-15-1990",  # Wrong format
                birth_time="14:30",
                latitude=40.7128,
                longitude=-74.006,
                city="New York",
            )

    def test_invalid_time_format(self):
        with pytest.raises(ValidationError):
            UserProfileCreate(
                display_name="Test",
                birth_date="1990-01-15",
                birth_time="2:30 PM",  # Wrong format
                latitude=40.7128,
                longitude=-74.006,
                city="New York",
            )

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            UserProfileCreate(
                display_name="Test",
                email="not-an-email",
                birth_date="1990-01-15",
                birth_time="14:30",
                latitude=40.7128,
                longitude=-74.006,
                city="New York",
            )

    def test_latitude_out_of_range(self):
        with pytest.raises(ValidationError):
            UserProfileCreate(
                display_name="Test",
                birth_date="1990-01-15",
                birth_time="14:30",
                latitude=100.0,  # > 90
                longitude=-74.006,
                city="New York",
            )

    def test_empty_display_name(self):
        with pytest.raises(ValidationError):
            UserProfileCreate(
                display_name="",
                birth_date="1990-01-15",
                birth_time="14:30",
                latitude=40.7128,
                longitude=-74.006,
                city="New York",
            )

    def test_invalid_date_values(self):
        """February 30 is not a valid date."""
        with pytest.raises(ValidationError):
            UserProfileCreate(
                display_name="Test",
                birth_date="1990-02-30",
                birth_time="14:30",
                latitude=40.7128,
                longitude=-74.006,
                city="New York",
            )

    def test_invalid_time_values(self):
        """25:00 is not a valid time."""
        with pytest.raises(ValidationError):
            UserProfileCreate(
                display_name="Test",
                birth_date="1990-01-15",
                birth_time="25:00",
                latitude=40.7128,
                longitude=-74.006,
                city="New York",
            )


class TestJournalEntryCreate:
    """Test journal entry validation."""

    def test_valid_entry(self):
        entry = JournalEntryCreate(
            content="Today was a good day.",
            mood=4,
            tags=["reflection", "gratitude"],
        )
        assert entry.mood == 4
        assert len(entry.tags) == 2

    def test_mood_out_of_range(self):
        with pytest.raises(ValidationError):
            JournalEntryCreate(content="Test", mood=6)

    def test_mood_below_range(self):
        with pytest.raises(ValidationError):
            JournalEntryCreate(content="Test", mood=0)

    def test_empty_content(self):
        with pytest.raises(ValidationError):
            JournalEntryCreate(content="", mood=3)

    def test_tags_cleaned(self):
        entry = JournalEntryCreate(
            content="Test",
            mood=3,
            tags=["  REFLECTION  ", "Gratitude", ""],
        )
        # Tags should be lowercase and trimmed, empty removed
        assert "reflection" in entry.tags
        assert "gratitude" in entry.tags
        assert "" not in entry.tags


class TestChatMessageInput:
    """Test chat message validation."""

    def test_valid_message(self):
        msg = ChatMessageInput(message="Hello, Lumina!")
        assert msg.message == "Hello, Lumina!"

    def test_empty_message(self):
        with pytest.raises(ValidationError):
            ChatMessageInput(message="")

    def test_too_long_message(self):
        with pytest.raises(ValidationError):
            ChatMessageInput(message="x" * 2001)

    def test_optional_conversation_id(self):
        msg = ChatMessageInput(message="Hello")
        assert msg.conversation_id is None


class TestBirthDataInput:
    """Test birth data validation."""

    def test_valid_birth_data(self):
        data = BirthDataInput(
            birth_date="1990-01-15",
            birth_time="14:30",
            latitude=40.7128,
            longitude=-74.006,
            city="New York",
        )
        assert data.latitude == 40.7128

    def test_zero_latitude_rejected(self):
        with pytest.raises(ValidationError):
            BirthDataInput(
                birth_date="1990-01-15",
                birth_time="14:30",
                latitude=0.0,
                longitude=-74.006,
                city="New York",
            )

    def test_zero_longitude_rejected(self):
        with pytest.raises(ValidationError):
            BirthDataInput(
                birth_date="1990-01-15",
                birth_time="14:30",
                latitude=40.7128,
                longitude=0.0,
                city="New York",
            )
