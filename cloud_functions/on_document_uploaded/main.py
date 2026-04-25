"""Cloud Function: on_document_uploaded

Triggered by Firestore document creation on
users/{uid}/situations/{sitId}/documents/{docId}.
Extracts text + runs through pipeline. Wired to operational spine
(idempotent + observable + user-notified).
"""
from __future__ import annotations

import os
import sys
import traceback

import functions_framework
import httpx
from google.cloud import firestore
import google.auth.transport.requests
import google.oauth2.id_token

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from _shared.spine import (
        build_idempotency_key,
        create_or_get_job,
        complete_job,
        fail_job,
        emit_system_event,
        emit_notification,
    )
    SPINE_OK = True
except ImportError:
    SPINE_OK = False


BACKEND_URL = os.environ.get("PRAXIS_BACKEND_URL", "")


def _get_id_token(audience: str) -> str:
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, audience)


@functions_framework.cloud_event
def on_document_uploaded(cloud_event):
    data = cloud_event.data
    if not data or not data.get("value"):
        return

    doc_path = data["value"]["name"]
    parts = doc_path.split("/")
    if len(parts) < 10:
        print(f"Unexpected path format: {doc_path}")
        return

    uid = parts[6]
    sit_id = parts[8]
    doc_id = parts[10]
    fields = data["value"].get("fields", {})
    extracted_text = fields.get("extractedText", {}).get("stringValue", "")
    filename = fields.get("name", {}).get("stringValue", "uploaded-document")

    if not extracted_text:
        print(f"Document {doc_path} has no extractedText — skipping")
        return
    if not BACKEND_URL:
        print("PRAXIS_BACKEND_URL not set — cannot trigger pipeline")
        return

    db = firestore.Client()
    job_id: str | None = None

    if SPINE_OK:
        idem = build_idempotency_key(
            uid=uid,
            situation_id=sit_id,
            tool_id="document.extract",
            trigger="on_document_uploaded",
            payload={"docId": doc_id, "filename": filename},
        )
        job, created = create_or_get_job(
            db,
            uid=uid,
            kind="document.extract",
            payload={"situationId": sit_id, "documentId": doc_id, "filename": filename},
            idempotency_key=idem,
        )
        job_id = job["jobId"]
        if not created:
            print(f"Duplicate trigger for doc {doc_id} (job {job_id}) — skipping")
            return
        emit_system_event(
            db,
            kind="data.ingested",
            severity="info",
            message=f"Document extraction queued for {filename}",
            source="function",
            uid=uid,
            situation_id=sit_id,
            job_id=job_id,
            data={"documentId": doc_id, "filename": filename},
        )

    try:
        token = _get_id_token(BACKEND_URL)
        resp = httpx.post(
            f"{BACKEND_URL}/api/v1/pipeline/run",
            json={
                "situation_id": sit_id,
                "sources": [{
                    "type": "text",
                    "content": extracted_text[:60_000],
                    "filename": filename,
                }],
                "jobId": job_id,
            },
            headers={
                "Authorization": f"Bearer {token}",
                "X-PRAXIS-UID": uid,
                "X-PRAXIS-JOB-ID": job_id or "",
            },
            timeout=300.0,
        )
        resp.raise_for_status()
        result = resp.json()
        nodes = result.get("stats", {}).get("nodes")
        print(f"Extraction complete for doc in {sit_id}: nodes={nodes}")

        if SPINE_OK and job_id:
            complete_job(db, job_id, {"nodes": nodes, "filename": filename})
            emit_system_event(
                db,
                kind="tool.completed",
                severity="info",
                message=f"Document extraction completed: {filename}",
                source="function",
                uid=uid,
                situation_id=sit_id,
                job_id=job_id,
                data={"nodes": nodes},
            )
            emit_notification(
                db,
                uid=uid,
                kind="data.found",
                semaphore="green",
                title="Document analyzed",
                body=f"PRAXIS extracted {nodes or 0} entities from {filename}.",
                situation_id=sit_id,
                job_id=job_id,
                action_url=f"/app/situations/{sit_id}",
            )
    except Exception as exc:  # noqa: BLE001
        print(f"Pipeline trigger failed for document in {sit_id}: {exc}")
        traceback.print_exc()
        if SPINE_OK and job_id:
            fail_job(db, job_id, error_code="extraction_failed", error_message=str(exc))
            emit_system_event(
                db,
                kind="tool.failed",
                severity="error",
                message=f"Document extraction failed for {filename}: {exc}",
                source="function",
                uid=uid,
                situation_id=sit_id,
                job_id=job_id,
            )
            emit_notification(
                db,
                uid=uid,
                kind="data.ingest_failed",
                semaphore="red",
                title="Document analysis failed",
                body=f"PRAXIS could not extract from {filename}. Re-upload or contact support.",
                situation_id=sit_id,
                job_id=job_id,
                action_url=f"/app/situations/{sit_id}",
            )
        raise
