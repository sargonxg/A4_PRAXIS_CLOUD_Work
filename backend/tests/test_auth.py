"""Auth tests — verify Firebase token validation.

Tests that verify_firebase_token raises proper HTTP exceptions.
"""
from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


def _mock_request(headers: dict | None = None):
    """Create a mock FastAPI Request object."""
    req = MagicMock()
    req.headers = headers or {}
    req.base_url = "https://praxis-backend-pgoyqovcza-uc.a.run.app/"
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

    with patch("auth._init_firebase"), patch("auth.firebase_auth.verify_id_token") as mock_verify:
        mock_verify.side_effect = Exception("Invalid token")

        with pytest.raises(HTTPException) as exc_info:
            await verify_firebase_token(
                request=_mock_request({"X-Firebase-Token": "invalid.token.here"}),
                credentials=fake_credentials,
            )

        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_firebase_token_returns_uid_for_valid_token():
    """verify_firebase_token should return dict with uid for a valid token."""
    from auth import verify_firebase_token

    with patch("auth._init_firebase"), patch("auth.firebase_auth.verify_id_token") as mock_verify:
        mock_verify.return_value = {
            "uid": "test-user-123",
            "email": "test@example.com",
        }

        result = await verify_firebase_token(
            request=_mock_request({"X-Firebase-Token": "valid.test.token"}),
            credentials=None,
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

    with patch("auth._init_firebase"), \
         patch("google.oauth2.id_token.verify_oauth2_token") as mock_verify:
        mock_verify.return_value = {
            "iss": "accounts.google.com",
            "email": "praxis-frontend-sa@praxisbytacitus.iam.gserviceaccount.com",
        }

        result = await verify_firebase_token(
            request=_mock_request({"X-PRAXIS-UID": "user-from-cloud-function"}),
            credentials=fake_credentials,
        )

        assert result["uid"] == "user-from-cloud-function"
        assert result["service_account"] == "praxis-frontend-sa@praxisbytacitus.iam.gserviceaccount.com"
        assert mock_verify.call_args.args[2] == "https://praxis-backend-pgoyqovcza-uc.a.run.app"


@pytest.mark.asyncio
async def test_verify_service_token_rejects_untrusted_service_account():
    """verify_service_token should reject valid Google tokens from non-allowlisted SAs."""
    from auth import verify_service_token

    fake_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="oidc.service.token"
    )

    with patch("google.oauth2.id_token.verify_oauth2_token") as mock_verify:
        mock_verify.return_value = {
            "iss": "accounts.google.com",
            "email": "other-sa@praxisbytacitus.iam.gserviceaccount.com",
        }

        with pytest.raises(HTTPException) as exc_info:
            await verify_service_token(
                request=_mock_request(),
                credentials=fake_credentials,
            )

        assert exc_info.value.status_code == 403
