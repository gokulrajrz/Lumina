"""
Integration tests for API routes.
Tests route-level behavior with mocked dependencies.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Mock settings before importing app
with patch("config.get_settings") as mock_settings:
    mock_settings.return_value = MagicMock(
        supabase_url="https://mock.supabase.co",
        supabase_service_key="mock-key",
        supabase_jwt_secret="",
        gemini_api_key="mock-gemini-key",
        gemini_model="gemini-3-pro-preview",
        app_name="Lumina Test",
        debug=True,
        log_level="WARNING",
        cors_origins="http://localhost:8081",
        rate_limit_ai="100/minute",
        rate_limit_default="100/minute",
        get_cors_origins=lambda: ["http://localhost:8081"],
    )
    from main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    @patch("routes.health.check_db_health", return_value=True)
    @patch("routes.health.check_ai_health", return_value=True)
    def test_health_healthy(self, mock_ai, mock_db):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        assert data["ai_service"] == "connected"

    @patch("routes.health.check_db_health", return_value=False)
    @patch("routes.health.check_ai_health", return_value=True)
    def test_health_degraded_db(self, mock_ai, mock_db):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"

    @patch("routes.health.check_db_health", return_value=True)
    @patch("routes.health.check_ai_health", return_value=False)
    def test_health_degraded_ai(self, mock_ai, mock_db):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["ai_service"] == "disconnected"


class TestProtectedEndpoints:
    """Test that protected endpoints require authentication."""

    def test_users_requires_auth(self):
        response = client.get("/api/users/me")
        assert response.status_code in [401, 403]

    def test_journal_requires_auth(self):
        response = client.get("/api/journal/some-user-id")
        assert response.status_code in [401, 403]

    def test_chat_requires_auth(self):
        response = client.post(
            "/api/chat/some-user-id",
            json={"message": "hello"},
        )
        assert response.status_code in [401, 403]

    def test_briefing_requires_auth(self):
        response = client.get("/api/briefing/some-user-id")
        assert response.status_code in [401, 403]

    def test_astrology_requires_auth(self):
        response = client.post(
            "/api/astrology/birth-chart",
            json={
                "birth_date": "1990-01-15",
                "birth_time": "14:30",
                "latitude": 40.7128,
                "longitude": -74.006,
                "city": "New York",
            },
        )
        assert response.status_code in [401, 403]
