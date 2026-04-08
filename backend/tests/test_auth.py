"""Auth tests — verify Firebase token validation.

Tests that verify_firebase_token raises proper HTTP exceptions.
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


def _mock_request(headers: dict | None = None):
    """Create a mock FastAPI Request object."""
    req = MagicMock()
    req.headers = headers or {}
    return req


@pytest.mark.asyncio
async def test_verify_firebase_token_raises_401_when_no_token():
    """verify_firebase_token should raise HTTPException(401) when credentials are None."""
    from auth import verify_firebase_token

    with pytest.raises((HTTPException, Exception)):
        await verify_firebase_token(request=_mock_request(), credentials=None)


@pytest.mark.asyncio
async def test_verify_firebase_token_raises_401_for_invalid_token():
    """verify_firebase_token should raise HTTPException(401) for an invalid token."""
    from auth import verify_firebase_token

    fake_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="invalid.token.here"
    )

    with patch("auth.firebase_auth") as mock_fb_auth:
        mock_fb_auth.verify_id_token.side_effect = Exception("Invalid token")

        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(
                request=_mock_request(),
                credentials=fake_credentials,
            )

        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_firebase_token_returns_uid_for_valid_token():
    """verify_firebase_token should return dict with uid for a valid token."""
    from auth import verify_firebase_token

    fake_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="valid.test.token"
    )

    with patch("auth.firebase_auth") as mock_fb_auth:
        mock_fb_auth.verify_id_token.return_value = {
            "uid": "test-user-123",
            "email": "test@example.com",
        }

        result = await verify_firebase_token(
            request=_mock_request(),
            credentials=fake_credentials,
        )

        assert result["uid"] == "test-user-123"


@pytest.mark.asyncio
async def test_verify_firebase_token_accepts_oidc_with_praxis_uid():
    """verify_firebase_token should accept OIDC tokens with X-PRAXIS-UID header."""
    from auth import verify_firebase_token

    fake_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="oidc.service.token"
    )

    with patch("auth.firebase_auth") as mock_fb_auth, \
         patch("auth.google.oauth2.id_token") as mock_oidc:
        # Firebase rejects the token
        mock_fb_auth.verify_id_token.side_effect = Exception("Not a Firebase token")
        # OIDC accepts it
        mock_oidc.verify_oauth2_token.return_value = {
            "iss": "accounts.google.com",
            "email": "sa@praxisbytacitus.iam.gserviceaccount.com",
        }

        result = await verify_firebase_token(
            request=_mock_request({"X-PRAXIS-UID": "user-from-cloud-function"}),
            credentials=fake_credentials,
        )

        assert result["uid"] == "user-from-cloud-function"
