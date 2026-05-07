"""External notification delivery planning.

This module intentionally does not send provider traffic. It owns the durable
dispatch contract for channels that need email, push, or webhook credentials,
and records provider-unconfigured status instead of pretending delivery worked.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
from datetime import UTC, datetime
from typing import Any, Mapping

from services.postgres import TenantConnection


EXTERNAL_CHANNELS = {"email-digest", "email-immediate", "browser-push", "webhook"}
DELIVERY_STATUS_QUEUED = "queued"
DELIVERY_STATUS_PROVIDER_UNCONFIGURED = "provider_unconfigured"
MAX_DELIVERY_ATTEMPTS = 3


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def sign_webhook_payload(payload: Mapping[str, Any], secret: str) -> str:
    """Return a GitHub-style HMAC_SHA256 signature for webhook consumers."""
    body = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def provider_configured(channel: str, env: Mapping[str, str] | None = None) -> bool:
    env = env or os.environ
    if channel in {"email-digest", "email-immediate"}:
        return bool(env.get("RESEND_API_KEY") or env.get("NOTIFICATION_EMAIL_PROVIDER"))
    if channel == "browser-push":
        return bool(env.get("WEB_PUSH_PUBLIC_KEY") and env.get("WEB_PUSH_PRIVATE_KEY"))
    if channel == "webhook":
        return bool(env.get("NOTIFICATION_WEBHOOK_SECRET"))
    return True


def initial_channel_status(channel: str, *, muted: bool, quiet: bool) -> str:
    if muted:
        return "muted"
    if quiet:
        return DELIVERY_STATUS_QUEUED
    if channel in EXTERNAL_CHANNELS:
        return DELIVERY_STATUS_QUEUED
    return "delivered"


def plan_external_deliveries(
    channels: list[dict[str, Any]],
    *,
    env: Mapping[str, str] | None = None,
    now_iso: str | None = None,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Plan one dispatch pass and return updated channel receipts plus counts."""
    now_iso = now_iso or _now_iso()
    counts = {"queued": 0, "provider_unconfigured": 0, "skipped": 0, "exhausted": 0}
    updated: list[dict[str, Any]] = []
    for receipt in channels:
        next_receipt = dict(receipt)
        channel = str(next_receipt.get("channel") or "")
        if channel not in EXTERNAL_CHANNELS:
            counts["skipped"] += 1
            updated.append(next_receipt)
            continue

        status = str(next_receipt.get("status") or DELIVERY_STATUS_QUEUED)
        attempts = int(next_receipt.get("attempts") or 0)
        if status in {"delivered", "muted"}:
            counts["skipped"] += 1
            updated.append(next_receipt)
            continue
        if attempts >= MAX_DELIVERY_ATTEMPTS:
            next_receipt["status"] = "exhausted"
            next_receipt["lastAttemptAt"] = now_iso
            counts["exhausted"] += 1
            updated.append(next_receipt)
            continue

        next_receipt["attempts"] = attempts + 1
        next_receipt["lastAttemptAt"] = now_iso
        if provider_configured(channel, env):
            next_receipt["status"] = DELIVERY_STATUS_QUEUED
            next_receipt["providerReady"] = True
            counts["queued"] += 1
        else:
            next_receipt["status"] = DELIVERY_STATUS_PROVIDER_UNCONFIGURED
            next_receipt["providerReady"] = False
            counts["provider_unconfigured"] += 1
        updated.append(next_receipt)
    return updated, counts


async def dispatch_pending_deliveries(
    conn: TenantConnection,
    *,
    recipient_uid: str,
    limit: int = 100,
    env: Mapping[str, str] | None = None,
) -> dict[str, Any]:
    """Advance pending external-channel receipts for one tenant-scoped user."""
    rows = await conn.fetch(
        """
        SELECT id, case_id, channels
        FROM notifications
        WHERE owner_uid = %s
          AND recipient_uid = %s
          AND state IN ('pending','delivered','read')
          AND channels::text SIMILAR TO %s
        ORDER BY created_at ASC
        LIMIT %s
        """,
        recipient_uid,
        recipient_uid,
        "%(email-digest|email-immediate|browser-push|webhook)%",
        limit,
    )
    totals = {"queued": 0, "provider_unconfigured": 0, "skipped": 0, "exhausted": 0}
    touched = 0
    for row in rows:
        planned, counts = plan_external_deliveries(row.get("channels") or [], env=env)
        if planned != (row.get("channels") or []):
            await conn.execute(
                """
                UPDATE notifications
                SET channels = %s::jsonb
                WHERE owner_uid = %s AND id = %s::uuid
                """,
                json.dumps(planned, default=str),
                recipient_uid,
                str(row["id"]),
            )
            await conn.execute(
                """
                INSERT INTO workspace_orchestrator_log (
                  owner_uid, case_id, surface_key, event_type, status, payload
                )
                VALUES (%s, %s, 'notifications', 'external_dispatch', %s, %s::jsonb)
                """,
                recipient_uid,
                row.get("case_id") or "global",
                "blocked" if counts["provider_unconfigured"] else "queued",
                {
                    "notificationId": str(row["id"]),
                    "counts": counts,
                    "providerBacked": counts["provider_unconfigured"] == 0,
                },
            )
            touched += 1
        for key, value in counts.items():
            totals[key] += value
    return {"notificationsScanned": len(rows), "notificationsTouched": touched, "counts": totals}
