"""Firebase ID token verification for FastAPI.

Every protected endpoint uses Depends(verify_firebase_token) to authenticate
the caller. The decoded token dict (which includes 'uid') is injected into
the route handler.

Cloud Functions use OIDC tokens (not Firebase ID tokens) for service-to-service
auth. When an OIDC token is detected, we verify it via Google's tokeninfo
endpoint and extract the uid from the X-PRAXIS-UID header.
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
_bearer = HTTPBearer(auto_error=True)


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
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """FastAPI dependency: verify Firebase ID token OR Google OIDC token.

    For user requests: verifies Firebase ID token, returns decoded claims with 'uid'.
    For service-to-service (Cloud Functions): verifies OIDC token, reads uid from
    the X-PRAXIS-UID header.

    Raises HTTPException(401) on invalid or missing tokens.
    """
    _init_firebase()

    token = credentials.credentials

    # Try Firebase ID token first (user requests)
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except (firebase_auth.ExpiredIdTokenError, firebase_auth.InvalidIdTokenError):
        pass
    except Exception:
        pass

    # Fallback: Google OIDC token (service-to-service from Cloud Functions)
    praxis_uid = request.headers.get("X-PRAXIS-UID")
    if praxis_uid:
        try:
            import google.oauth2.id_token
            import google.auth.transport.requests
            auth_req = google.auth.transport.requests.Request()
            claims = google.oauth2.id_token.verify_oauth2_token(token, auth_req)
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
        detail="Authentication failed: invalid Firebase or OIDC token",
    )
