"""Firebase ID token verification for FastAPI.

Every protected endpoint uses Depends(verify_firebase_token) to authenticate
the caller. The decoded token dict (which includes 'uid') is injected into
the route handler.

Token header separation (P6A — service-to-service OIDC):
  Authorization: Bearer <OIDC token>   — Cloud Run network-layer auth (frontend SA)
  X-Firebase-Token: <Firebase ID token> — per-user identity (read by this module)

Cloud Functions use OIDC tokens (not Firebase ID tokens) for service-to-service
auth. When an OIDC token is detected in Authorization, we verify it via
google.oauth2.id_token and extract the uid from the X-PRAXIS-UID header.
"""
import json
import logging
import os
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import get_settings

logger = logging.getLogger("praxis.auth")
_bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _init_firebase() -> None:
    """Initialize firebase-admin once. Subsequent calls are no-ops.

    Credential resolution order:
    1. FIREBASE_SERVICE_ACCOUNT_KEY env var — JSON string (Cloud Run / CI)
    2. firebase_credentials_path — path to a local JSON file (local dev)
    3. Application Default Credentials — Workload Identity / gcloud auth
    """
    if firebase_admin._apps:
        return

    settings = get_settings()

    if settings.firebase_service_account_key:
        sa_info = json.loads(settings.firebase_service_account_key)
        cred = credentials.Certificate(sa_info)
    elif settings.firebase_credentials_path and os.path.exists(
        settings.firebase_credentials_path
    ):
        cred = credentials.Certificate(settings.firebase_credentials_path)
    else:
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)


async def verify_firebase_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """FastAPI dependency: verify Firebase ID token OR Google OIDC token.

    Token reading order (P6A separation):
    1. X-Firebase-Token header — per-user Firebase ID token (frontend clients).
    2. Authorization: Bearer — Cloud Run OIDC token from the frontend service
       account (service-to-service). UID is taken from X-PRAXIS-UID header.

    Raises HTTPException(401) on invalid or missing tokens.
    """
    _init_firebase()

    # ── Path 1: Firebase ID token from X-Firebase-Token ─────────────────────
    firebase_token = request.headers.get("X-Firebase-Token")
    if firebase_token:
        try:
            decoded = firebase_auth.verify_id_token(firebase_token)
            return decoded
        except (firebase_auth.ExpiredIdTokenError, firebase_auth.InvalidIdTokenError) as exc:
            logger.warning("Firebase token invalid: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: invalid Firebase ID token",
            )
        except Exception as exc:
            logger.warning("Firebase token verification error: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: Firebase token error",
            )

    # ── Path 2: Cloud Run OIDC token from Authorization header ──────────────
    # Used by Cloud Functions / server-side API routes acting as service accounts.
    if credentials and credentials.credentials:
        oidc_token = credentials.credentials
        praxis_uid = request.headers.get("X-PRAXIS-UID")
        if praxis_uid:
            try:
                import google.oauth2.id_token
                import google.auth.transport.requests
                auth_req = google.auth.transport.requests.Request()
                claims = google.oauth2.id_token.verify_oauth2_token(oidc_token, auth_req)
                # Verify the OIDC token is from a Google service account
                if claims.get("iss") in (
                    "accounts.google.com",
                    "https://accounts.google.com",
                ):
                    logger.info("Service-to-service auth accepted for uid=%s", praxis_uid)
                    return {"uid": praxis_uid, "service_account": claims.get("email", "")}
            except Exception as exc:
                logger.warning("OIDC token verification failed: %s", exc)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication failed: provide Firebase ID token in X-Firebase-Token header",
    )
