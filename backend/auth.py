"""Firebase ID token verification for FastAPI.

Every protected endpoint uses Depends(verify_firebase_token) to authenticate
the caller. The decoded token dict (which includes 'uid') is injected into
the route handler.
"""
import os
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import get_settings

_bearer = HTTPBearer(auto_error=True)


@lru_cache(maxsize=1)
def _init_firebase() -> None:
    """Initialize firebase-admin once. Subsequent calls are no-ops."""
    if firebase_admin._apps:
        return

    settings = get_settings()
    if settings.firebase_credentials_path and os.path.exists(
        settings.firebase_credentials_path
    ):
        cred = credentials.Certificate(settings.firebase_credentials_path)
    else:
        # Use Application Default Credentials (Cloud Run / Workload Identity)
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """FastAPI dependency: verify Firebase ID token, return decoded claims.

    Raises HTTPException(401) on invalid or missing tokens.
    Returns the decoded token dict which always includes 'uid'.
    """
    _init_firebase()

    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please sign in again.",
        )
    except firebase_auth.InvalidIdTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {exc}",
        )
