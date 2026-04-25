"""Shared lifecycle helpers for Cloud Functions and Cloud Run worker pools.

Mirrors src/lib/jobs/job-service.ts and src/lib/events/event-service.ts so
Python triggers and TypeScript AI routes write the same shape into the same
collections.

Vendored into each function's source dir at deploy time (see
infrastructure/setup-gcp.sh — copy this directory next to main.py).
"""
from __future__ import annotations

import hashlib
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

from google.cloud import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP


Severity = str  # 'info' | 'warn' | 'error' | 'critical'
Semaphore = str  # 'grey' | 'blue' | 'purple' | 'yellow' | 'green' | 'red'

# Retention policies — paired with infrastructure/setup-ttl.sh.
TTL_DAYS = {
    "system_events": 365,
    "notifications": 180,
    "background_jobs": 90,
    "tool_runs": 365,
}


def _ttl(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


def build_idempotency_key(
    *,
    uid: str,
    situation_id: str | None,
    tool_id: str,
    trigger: str,
    payload: Any | None = None,
) -> str:
    payload_blob = json.dumps(payload or None, sort_keys=True, default=str).encode()
    payload_hash = hashlib.sha256(payload_blob).hexdigest()[:16]
    return ":".join([uid, situation_id or "_", tool_id, trigger, payload_hash])


def _semaphore_for_job(status: str, message: str | None = None) -> Semaphore:
    if status == "queued":
        return "blue"
    if status == "running":
        if message and "reasoning" in message.lower():
            return "purple"
        return "yellow"
    if status == "completed":
        return "green"
    if status in ("failed", "dead_letter"):
        return "red"
    return "grey"


def create_or_get_job(
    db: firestore.Client,
    *,
    uid: str | None,
    kind: str,
    payload: dict[str, Any],
    idempotency_key: str,
    max_attempts: int = 5,
    parent_event_id: str | None = None,
) -> tuple[dict[str, Any], bool]:
    """Returns (job_doc, created)."""
    col = db.collection("background_jobs")
    existing = list(col.where("idempotencyKey", "==", idempotency_key).limit(1).stream())
    if existing:
        return existing[0].to_dict(), False

    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {
        "jobId": job_id,
        "uid": uid,
        "kind": kind,
        "status": "queued",
        "semaphore": "blue",
        "payload": payload,
        "idempotencyKey": idempotency_key,
        "attempt": 0,
        "maxAttempts": max_attempts,
        "nextRunAt": now,
        "lockedBy": None,
        "lockedUntil": None,
        "progress": None,
        "result": None,
        "error": None,
        "createdAt": now,
        "updatedAt": now,
        "completedAt": None,
        "parentEventId": parent_event_id,
        "expiresAt": _ttl(TTL_DAYS["background_jobs"]),
    }
    col.document(job_id).set(doc)
    return doc, True


def update_job_progress(
    db: firestore.Client, job_id: str, percent: int, message: str
) -> None:
    db.collection("background_jobs").document(job_id).update({
        "status": "running",
        "semaphore": _semaphore_for_job("running", message),
        "progress": {"percent": percent, "message": message},
        "updatedAt": SERVER_TIMESTAMP,
    })


def complete_job(db: firestore.Client, job_id: str, result: dict[str, Any]) -> None:
    db.collection("background_jobs").document(job_id).update({
        "status": "completed",
        "semaphore": "green",
        "result": result,
        "completedAt": SERVER_TIMESTAMP,
        "updatedAt": SERVER_TIMESTAMP,
    })


def fail_job(
    db: firestore.Client,
    job_id: str,
    error_code: str,
    error_message: str,
    retry_delay_seconds: int = 60,
) -> None:
    ref = db.collection("background_jobs").document(job_id)
    snap = ref.get()
    if not snap.exists:
        return
    job = snap.to_dict() or {}
    attempt = (job.get("attempt") or 0) + 1
    exhausted = attempt >= (job.get("maxAttempts") or 5)
    next_run = (
        None if exhausted
        else datetime.now(timezone.utc).timestamp() + retry_delay_seconds
    )
    ref.update({
        "status": "dead_letter" if exhausted else "queued",
        "semaphore": "red" if exhausted else "yellow",
        "error": {"code": error_code, "message": error_message},
        "attempt": attempt,
        "nextRunAt": (
            datetime.fromtimestamp(next_run, tz=timezone.utc) if next_run else None
        ),
        "updatedAt": SERVER_TIMESTAMP,
    })


def emit_system_event(
    db: firestore.Client,
    *,
    kind: str,
    severity: Severity,
    message: str,
    source: str,
    uid: str | None = None,
    situation_id: str | None = None,
    job_id: str | None = None,
    tool_run_id: str | None = None,
    data: dict[str, Any] | None = None,
) -> str:
    event_id = str(uuid.uuid4())
    db.collection("system_events").document(event_id).set({
        "eventId": event_id,
        "kind": kind,
        "severity": severity,
        "uid": uid,
        "situationId": situation_id,
        "jobId": job_id,
        "toolRunId": tool_run_id,
        "message": message,
        "data": data or {},
        "source": source,
        "serviceAccount": os.getenv("K_SERVICE", "unknown"),
        "createdAt": SERVER_TIMESTAMP,
        "expiresAt": _ttl(TTL_DAYS["system_events"]),
    })
    return event_id


def emit_notification(
    db: firestore.Client,
    *,
    uid: str,
    kind: str,
    semaphore: Semaphore,
    title: str,
    body: str,
    situation_id: str | None = None,
    tool_run_id: str | None = None,
    job_id: str | None = None,
    action_url: str | None = None,
    actions: Iterable[dict[str, str]] | None = None,
) -> str:
    notification_id = str(uuid.uuid4())
    (
        db.collection("users").document(uid)
        .collection("notifications").document(notification_id)
        .set({
            "notificationId": notification_id,
            "kind": kind,
            "semaphore": semaphore,
            "title": title,
            "body": body,
            "situationId": situation_id,
            "toolRunId": tool_run_id,
            "jobId": job_id,
            "actionUrl": action_url,
            "actions": list(actions or []),
            "read": False,
            "archived": False,
            "createdAt": SERVER_TIMESTAMP,
            "readAt": None,
            "expiresAt": _ttl(TTL_DAYS["notifications"]),
        })
    )
    return notification_id
