"""
tests/test_dependencies.py
──────────────────────────
Tests for resume dependency providers.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch


class TestGeminiClient:
    def test_uses_google_api_key_when_gemini_key_missing(self):
        from app.resume import dependencies as deps

        deps._gemini_client = None

        fake_client = MagicMock()

        with (
            patch.dict(
                "os.environ",
                {"GOOGLE_API_KEY": "x-test"},
                clear=True,
            ),
            patch(
                "google.genai.Client",
                return_value=fake_client,
            ) as mock_client,
        ):
            client = deps.get_gemini_client()

        assert client is fake_client
        mock_client.assert_called_once_with(api_key="x-test")

    def test_uses_gemini_api_key_when_available(self):
        from app.resume import dependencies as deps

        deps._gemini_client = None

        fake_client = MagicMock()

        with (
            patch.dict(
                "os.environ",
                {"GEMINI_API_KEY": "x-test"},
                clear=True,
            ),
            patch(
                "google.genai.Client",
                return_value=fake_client,
            ) as mock_client,
        ):
            client = deps.get_gemini_client()

        assert client is fake_client
        mock_client.assert_called_once_with(api_key="x-test")

    def test_gemini_key_has_priority_over_google_api_key(self):
        from app.resume import dependencies as deps

        deps._gemini_client = None

        fake_client = MagicMock()

        with (
            patch.dict(
                "os.environ",
                {
                    "GEMINI_API_KEY": "gemini-test",
                    "GOOGLE_API_KEY": "google-test",
                },
                clear=True,
            ),
            patch(
                "google.genai.Client",
                return_value=fake_client,
            ) as mock_client,
        ):
            client = deps.get_gemini_client()

        assert client is fake_client
        mock_client.assert_called_once_with(api_key="gemini-test")

    def test_raises_error_when_no_api_key_is_configured(self):
        from app.resume import dependencies as deps
        from fastapi import HTTPException

        deps._gemini_client = None

        with patch.dict("os.environ", {}, clear=True):
            try:
                deps.get_gemini_client()
                assert False, "Expected HTTPException"
            except HTTPException as exc:
                assert exc.status_code == 503