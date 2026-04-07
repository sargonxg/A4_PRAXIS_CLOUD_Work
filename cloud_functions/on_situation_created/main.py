"""Cloud Function: on_situation_created

Triggered by Firestore document creation on users/{uid}/situations/{sitId}.
If the new situation has sourceUrls, kicks off the Python backend pipeline.
"""
from __future__ import annotations

import json
import os

import functions_framework
import httpx
from google.auth import default
from google.auth.transport.requests import Request as GoogleAuthRequest


BACKEND_URL = os.environ.get("PRAXIS_BACKEND_URL", "")


def _get_id_token(audience: str) -> str:
    """Get a service-to-service OIDC token for Cloud Run authentication."""
    import google.auth.transport.requests
    import google.oauth2.id_token
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, audience)


@functions_framework.cloud_event
def on_situation_created(cloud_event):
    """Trigger pipeline when a new situation is created with source URLs."""
    data = cloud_event.data

    # Extract from Firestore event
    if not data or not data.get("value"):
        return

    doc_fields = data["value"].get("fields", {})

    # Parse situation fields
    uid = data["value"]["name"].split("/")[6]   # users/{uid}/situations/{sitId}
    sit_id = data["value"]["name"].split("/")[8]

    source_urls = []
    if "sourceUrls" in doc_fields:
        array_val = doc_fields["sourceUrls"].get("arrayValue", {})
        for item in array_val.get("values", []):
            url = item.get("stringValue", "").strip()
            if url:
                source_urls.append(url)

    context_notes = doc_fields.get("contextNotes", {}).get("stringValue", "")

    if not source_urls and not context_notes:
        print(f"Situation {sit_id} has no sources — skipping pipeline trigger")
        return

    if not BACKEND_URL:
        print("PRAXIS_BACKEND_URL not set — cannot trigger pipeline")
        return

    # Build pipeline sources
    sources = [{"type": "url", "content": url} for url in source_urls]
    if context_notes:
        sources.append({"type": "text", "content": context_notes, "filename": "situation-notes"})

    # Call backend pipeline with service-to-service auth
    try:
        token = _get_id_token(BACKEND_URL)
        resp = httpx.post(
            f"{BACKEND_URL}/api/v1/pipeline/run",
            json={"situation_id": sit_id, "sources": sources},
            headers={
                "Authorization": f"Bearer {token}",
                "X-PRAXIS-UID": uid,
            },
            timeout=300.0,
        )
        resp.raise_for_status()
        result = resp.json()
        print(f"Pipeline complete for {sit_id}: nodes={result.get('stats', {}).get('nodes')}")
    except Exception as exc:
        print(f"Pipeline trigger failed for {sit_id}: {exc}")
