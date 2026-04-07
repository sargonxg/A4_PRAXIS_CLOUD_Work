"""Cloud Function: on_document_uploaded

Triggered by Firestore document creation on users/{uid}/situations/{sitId}/documents/{docId}.
Extracts text from the document and runs it through the pipeline.
"""
from __future__ import annotations

import os

import functions_framework
import httpx
import google.auth.transport.requests
import google.oauth2.id_token


BACKEND_URL = os.environ.get("PRAXIS_BACKEND_URL", "")


def _get_id_token(audience: str) -> str:
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, audience)


@functions_framework.cloud_event
def on_document_uploaded(cloud_event):
    """When a document is added to a situation, run it through the extraction pipeline."""
    data = cloud_event.data
    if not data or not data.get("value"):
        return

    doc_path = data["value"]["name"]
    # Path: users/{uid}/situations/{sitId}/documents/{docId}
    parts = doc_path.split("/")
    if len(parts) < 10:
        print(f"Unexpected path format: {doc_path}")
        return

    uid = parts[6]
    sit_id = parts[8]

    doc_fields = data["value"].get("fields", {})
    extracted_text = doc_fields.get("extractedText", {}).get("stringValue", "")
    filename = doc_fields.get("name", {}).get("stringValue", "uploaded-document")

    if not extracted_text:
        print(f"Document {doc_path} has no extractedText — skipping")
        return

    if not BACKEND_URL:
        print("PRAXIS_BACKEND_URL not set — cannot trigger pipeline")
        return

    try:
        token = _get_id_token(BACKEND_URL)
        resp = httpx.post(
            f"{BACKEND_URL}/api/v1/pipeline/run",
            json={
                "situation_id": sit_id,
                "sources": [{"type": "text", "content": extracted_text[:60_000], "filename": filename}],
            },
            headers={
                "Authorization": f"Bearer {token}",
                "X-PRAXIS-UID": uid,
            },
            timeout=300.0,
        )
        resp.raise_for_status()
        result = resp.json()
        print(f"Extraction complete for doc in {sit_id}: nodes={result.get('stats', {}).get('nodes')}")
    except Exception as exc:
        print(f"Pipeline trigger failed for document in {sit_id}: {exc}")
