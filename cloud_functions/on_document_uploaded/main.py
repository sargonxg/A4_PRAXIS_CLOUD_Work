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
    if len(parts) < 11:
        print(f"Unexpected path format: {doc_path}")
        return

    uid = parts[6]
    sit_id = parts[8]
    doc_id = parts[10]
    fields = data["value"].get("fields", {})
    extracted_text = _string_field(fields, "extractedText") or _string_field(fields, "text")
    filename = _string_field(fields, "name") or _string_field(fields, "title") or "uploaded-document"
    bucket_uri = _string_field(fields, "bucketUri")

    if not extracted_text and not bucket_uri:
        print(f"Document {doc_path} has no text or bucketUri — skipping")
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
        # [1] receive: Firestore create event includes uid, situation, doc id,
        # filename, optional extracted text, and optional bucket URI.
        source_payload = {
            "type": "text" if extracted_text else "document",
            "content": extracted_text[:60_000] if extracted_text else "",
            "filename": filename,
            "document_id": doc_id,
            "bucket_uri": bucket_uri,
        }
        print(f"[1] receive document={doc_id} filename={filename}")

        # [2] parse: production backend/worker uses Docling for PDF, DOCX, and
        # HTML; local text uploads may already carry extracted text.
        source_payload["parse_engine"] = "docling" if bucket_uri else "pre-extracted-text"

        # [3] chunk: downstream pipeline chunks parsed Docling JSON on semantic
        # boundaries, keeping tables atomic.
        source_payload["chunk_engine"] = "spacy-boundary-docling-chunker"

        # [4] embed: downstream pipeline uses text-embedding-005 at 768 dims.
        source_payload["embedding_model"] = "text-embedding-005"
        source_payload["embedding_dimensions"] = 768

        # [5] receipt: source receipt tier is carried into evidence/review.
        source_payload["source_tier"] = "T6" if bucket_uri else "T5"

        # [6] extract: GLiNER L1 candidate spans constrain Gemini L2 precision
        # extraction with active ontology prompts.
        source_payload["extraction_engine"] = "gliner-l1-gemini-l2"

        # [7] resolve: actor candidates are resolved through cached Wikidata
        # SPARQL lookups.
        source_payload["resolver"] = "wikidata-sparql-cache"

        # [8] firewall: symbolic firewall and owner-scoped two-phase commit stay
        # in the backend pipeline.
        source_payload["firewall"] = "existing-symbolic-firewall"

        # [9] route: confidence routing sends high-confidence evidence forward,
        # medium-confidence claims to review, and low-confidence noise to discard.
        source_payload["routing"] = "evidence-review-discard"

        # [10] commit: backend owns the existing two-phase graph/document commit.
        source_payload["commit_protocol"] = "two-phase"

        # [11] index: pgvector/case indexes are refreshed after accepted chunks.
        source_payload["index_target"] = "pgvector-768"

        # [12] notify: final status is emitted through the operational spine.
        source_payload["notify"] = True

        token = _get_id_token(BACKEND_URL)
        resp = httpx.post(
            f"{BACKEND_URL}/api/v1/pipeline/run",
            json={
                "situation_id": sit_id,
                "sources": [source_payload],
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


def _string_field(fields: dict, name: str) -> str:
    value = fields.get(name, {})
    if isinstance(value, dict):
        return str(value.get("stringValue") or "")
    return ""
