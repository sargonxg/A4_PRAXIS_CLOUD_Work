"""Auth tests — Prompt 5.1.

Tests that verify_firebase_token raises proper HTTP exceptions.
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


@pytest.mark.asyncio
async def test_verify_firebase_token_raises_401_when_no_token():
    """verify_firebase_token should raise HTTPException(401) when credentials are None."""
    from auth import verify_firebase_token

    with pytest.raises(HTTPException) as exc_info:
        await verify_firebase_token(credentials=None)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_firebase_token_raises_401_for_invalid_token():
    """verify_firebase_token should raise HTTPException(401) for an invalid token."""
    from auth import verify_firebase_token

    fake_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="invalid.token.here"
    )

    # Mock firebase_admin.auth.verify_id_token to raise an exception
    with patch("auth.firebase_admin") as mock_fb:
        mock_fb.auth.verify_id_token.side_effect = Exception("Invalid token")

        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(credentials=fake_credentials)

        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_firebase_token_returns_uid_for_valid_token():
    """verify_firebase_token should return dict with uid for a valid token."""
    from auth import verify_firebase_token

    fake_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="valid.test.token"
    )

    # Mock firebase_admin.auth.verify_id_token to return a valid decoded token
    with patch("auth.firebase_admin") as mock_fb:
        mock_fb.auth.verify_id_token.return_value = {
            "uid": "test-user-123",
            "email": "test@example.com",
        }

        result = await verify_firebase_token(credentials=fake_credentials)

        assert result["uid"] == "test-user-123"
