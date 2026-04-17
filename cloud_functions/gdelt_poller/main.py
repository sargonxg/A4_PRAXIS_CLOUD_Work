"""Cloud Function: gdelt_poller

HTTP-triggered function (called by Cloud Scheduler every 15 minutes).
Queries Firestore for all active situations and ingests new GDELT articles
for each situation via the backend pipeline.

# DEPRECATED: This HTTP-triggered Cloud Function is superseded by worker.py
# (Cloud Run Worker Pool). Remove the Cloud Scheduler job and this function
# once the worker pool is confirmed stable.
# See: cloud_functions/gdelt_poller/worker.py
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

import functions_framework
import httpx
from google.cloud import firestore
import google.auth.transport.requests
import google.oauth2.id_token


BACKEND_URL = os.environ.get("PRAXIS_BACKEND_URL", "")
MAX_SITUATIONS = 50   # Process at most 50 situations per poll to stay within timeout


def _get_id_token(audience: str) -> str:
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, audience)


@functions_framework.http
def gdelt_poller(request):
    """Poll GDELT feeds for all active situations and ingest new articles."""
    if not BACKEND_URL:
        return {"error": "PRAXIS_BACKEND_URL not configured"}, 500

    db = firestore.Client()

    # Find all active situations across all users
    # Note: This requires appropriate Firestore security rules to be relaxed for admin/service account
    processed = 0
    errors = 0

    try:
        token = _get_id_token(BACKEND_URL)

        # Query all users — iterate top-level users collection
        # In production, index situations with a collection group query
        users_ref = db.collection("users")
        # Use collection group for situations to avoid iterating all users
        situations_ref = db.collection_group("situations").where("status", "!=", "resolved").limit(MAX_SITUATIONS)

        for sit_doc in situations_ref.stream():
            sit_data = sit_doc.to_dict() or {}
            sit_id = sit_doc.id
            # Extract uid from path: users/{uid}/situations/{sitId}
            path_parts = sit_doc.reference.path.split("/")
            uid = path_parts[1] if len(path_parts) >= 2 else None

            if not uid:
                continue

            region = sit_data.get("region", "")
            name = sit_data.get("name", "")
            if not region and not name:
                continue

            try:
                resp = httpx.post(
                    f"{BACKEND_URL}/api/v1/pipeline/ingest-feeds",
                    json={"situation_id": sit_id},
                    headers={
                        "Authorization": f"Bearer {token}",
                        "X-PRAXIS-UID": uid,
                    },
                    timeout=120.0,
                )
                if resp.status_code == 200:
                    result = resp.json()
                    articles = result.get("gdelt_articles", 0)
                    if articles > 0:
                        print(f"Ingested {articles} GDELT articles for situation {sit_id} ({name})")
                    processed += 1
                else:
                    errors += 1
                    print(f"Feed ingest failed for {sit_id}: HTTP {resp.status_code}")
            except Exception as exc:
                errors += 1
                print(f"Feed ingest error for {sit_id}: {exc}")

    except Exception as exc:
        print(f"GDELT poller error: {exc}")
        return {"error": str(exc)}, 500

    return {
        "polled_at": datetime.now(timezone.utc).isoformat(),
        "situations_processed": processed,
        "errors": errors,
    }, 200
