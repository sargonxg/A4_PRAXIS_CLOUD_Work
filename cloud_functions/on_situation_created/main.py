"""Cloud Function: on_situation_created

Triggered by Firestore document creation on users/{uid}/situations/{sitId}.
If the new situation has sourceUrls, kicks off the Python backend pipeline.

Wired to the operational spine:
  - Idempotency: same situation create event will not run the pipeline twice
  - Job tracking: writes background_jobs row before invoking backend
  - System events: emits situation.created and tool.completed/tool.failed
  - User notification: emits a per-user notification on completion or failure
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

# Vendored helper. Copy cloud_functions/_shared/ next to main.py during deploy
# (handled by infrastructure/setup-gcp.sh — see _vendor_shared step).
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
except ImportError:
    # Allow function to run even if vendoring failed; degrade to no-spine mode.
    build_idempotency_key = None  # type: ignore[assignment]


BACKEND_URL = os.environ.get("PRAXIS_BACKEND_URL", "")


def _get_id_token(audience: str) -> str:
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, audience)


def _extract_situation(cloud_event) -> tuple[str, str, list[str], str] | None:
    data = cloud_event.data
    if not data or not data.get("value"):
        return None
    parts = data["value"]["name"].split("/")
    if len(parts) < 9:
        return None
    uid = parts[6]
    sit_id = parts[8]
    fields = data["value"].get("fields", {})
    source_urls: list[str] = []
    if "sourceUrls" in fields:
        for item in fields["sourceUrls"].get("arrayValue", {}).get("values", []):
            url = item.get("stringValue", "").strip()
            if url:
                source_urls.append(url)
    context_notes = fields.get("contextNotes", {}).get("stringValue", "")
    return uid, sit_id, source_urls, context_notes


@functions_framework.cloud_event
def on_situation_created(cloud_event):
    parsed = _extract_situation(cloud_event)
    if not parsed:
        return
    uid, sit_id, source_urls, context_notes = parsed

    if not source_urls and not context_notes:
        print(f"Situation {sit_id} has no sources — skipping pipeline trigger")
        return
    if not BACKEND_URL:
        print("PRAXIS_BACKEND_URL not set — cannot trigger pipeline")
        return

    db = firestore.Client()
    job_id: str | None = None
    spine_ok = build_idempotency_key is not None

    if spine_ok:
        idem = build_idempotency_key(
            uid=uid,
            situation_id=sit_id,
            tool_id="pipeline.run",
            trigger="on_situation_created",
            payload={"sources": source_urls, "notes_len": len(context_notes)},
        )
        job, created = create_or_get_job(
            db,
            uid=uid,
            kind="pipeline.run",
            payload={"situationId": sit_id, "sourceUrls": source_urls},
            idempotency_key=idem,
        )
        job_id = job["jobId"]
        if not created:
            print(f"Duplicate trigger for situation {sit_id} (job {job_id}) — skipping")
            return

        emit_system_event(
            db,
            kind="situation.created",
            severity="info",
            message=f"Pipeline run queued for situation {sit_id}",
            source="function",
            uid=uid,
            situation_id=sit_id,
            job_id=job_id,
        )

    sources = [{"type": "url", "content": u} for u in source_urls]
    if context_notes:
        sources.append({
            "type": "text",
            "content": context_notes,
            "filename": "situation-notes",
        })

    try:
        token = _get_id_token(BACKEND_URL)
        resp = httpx.post(
            f"{BACKEND_URL}/api/v1/pipeline/run",
            json={"situation_id": sit_id, "sources": sources, "jobId": job_id},
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
        print(f"Pipeline complete for {sit_id}: nodes={nodes}")

        if spine_ok and job_id:
            complete_job(db, job_id, {"nodes": nodes, "stats": result.get("stats", {})})
            emit_system_event(
                db,
                kind="tool.completed",
                severity="info",
                message=f"Pipeline completed for situation {sit_id}",
                source="function",
                uid=uid,
                situation_id=sit_id,
                job_id=job_id,
                data={"nodes": nodes},
            )
            emit_notification(
                db,
                uid=uid,
                kind="analysis.completed",
                semaphore="green",
                title="Initial analysis ready",
                body=f"PRAXIS extracted {nodes or 0} entities from your situation sources.",
                situation_id=sit_id,
                job_id=job_id,
                action_url=f"/app/situations/{sit_id}",
            )
    except Exception as exc:  # noqa: BLE001
        print(f"Pipeline trigger failed for {sit_id}: {exc}")
        traceback.print_exc()
        if spine_ok and job_id:
            fail_job(db, job_id, error_code="pipeline_call_failed", error_message=str(exc))
            emit_system_event(
                db,
                kind="tool.failed",
                severity="error",
                message=f"Pipeline failed for situation {sit_id}: {exc}",
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
                title="Initial analysis failed",
                body="PRAXIS could not analyze the situation sources. Open the situation to retry.",
                situation_id=sit_id,
                job_id=job_id,
                action_url=f"/app/situations/{sit_id}",
            )
        # Re-raise so Eventarc records the delivery failure and can retry
        raise
