"""GDELT poller — Cloud Run Worker Pool variant.

Runs continuously. Polls every 15 minutes. No HTTP endpoint.
"""
import os
import sys
import time
import logging

import httpx
from google.api_core import exceptions as gax_exceptions
from google.cloud import firestore
import google.auth.transport.requests
import google.oauth2.id_token

# Vendored shared spine helpers — copied next to worker.py at deploy time.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from _shared.spine import (
        emit_system_event,
        create_or_get_job,
        complete_job,
        fail_job,
    )
    SPINE_OK = True
except ImportError:
    SPINE_OK = False


REQUIRED_ENV = ("PRAXIS_BACKEND_URL",)

INDEX_HINT = (
    "Required Firestore index missing. Declare it in firestore.indexes.json:\n"
    '  {\n'
    '    "collectionGroup": "situations",\n'
    '    "queryScope": "COLLECTION_GROUP",\n'
    '    "fields": [{"fieldPath": "status", "order": "ASCENDING"}]\n'
    '  }\n'
    "Then deploy: firebase deploy --only firestore:indexes --project=praxisbytacitus"
)


def _load_required_env() -> dict[str, str]:
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        sys.stderr.write(
            "FATAL: gdelt-poller startup failed. Missing required environment "
            f"variables: {', '.join(missing)}.\n"
            "Set them on the Cloud Run worker pool, e.g.:\n"
            "  gcloud beta run worker-pools update gdelt-poller "
            "--region=us-central1 "
            "--update-env-vars=PRAXIS_BACKEND_URL=https://praxis-backend-...run.app\n"
        )
        sys.exit(1)
    return {name: os.getenv(name, "") for name in REQUIRED_ENV}


_env = _load_required_env()
BACKEND_URL = _env["PRAXIS_BACKEND_URL"]
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "900"))  # 15 min default
MAX_SITUATIONS = int(os.getenv("MAX_SITUATIONS", "50"))
INDEX_BACKOFF_SECONDS = int(os.getenv("INDEX_BACKOFF_SECONDS", "300"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("gdelt_poller")


def _get_id_token(audience: str) -> str:
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, audience)


def verify_required_indexes(db: firestore.Client) -> None:
    """Run a cheap probe of the collection_group("situations").where("status",...)
    query at startup. If the composite index is missing or still building,
    Firestore returns FAILED_PRECONDITION and we log an explicit operator
    message instead of crashing later mid-poll.
    """
    try:
        next(
            iter(
                db.collection_group("situations")
                .where("status", "==", "active")
                .limit(1)
                .stream()
            ),
            None,
        )
        log.info("Index probe OK: situations.status COLLECTION_GROUP_ASC available")
    except gax_exceptions.FailedPrecondition as exc:
        log.error("Index probe FAILED at startup: %s", exc)
        log.error("%s", INDEX_HINT)
        # Do not exit — keep the worker alive so Cloud Run does not enter a
        # crash loop while the operator deploys the index. The poll loop
        # below will keep surfacing the same error with backoff.
    except Exception as exc:
        log.warning("Index probe inconclusive (continuing): %s", exc)


def poll_once(db: firestore.Client) -> dict:
    """One pass: list active situations, ingest GDELT for each.

    Returns a result dict. Caller distinguishes operational errors via the
    `index_missing` flag so it can back off rather than spin.
    """
    processed, errors = 0, 0
    try:
        situations = list(
            db.collection_group("situations")
            .where("status", "==", "active")
            .limit(MAX_SITUATIONS)
            .stream()
        )
    except gax_exceptions.FailedPrecondition as exc:
        log.error("FAILED_PRECONDITION on situations.status query: %s", exc)
        log.error("%s", INDEX_HINT)
        return {"processed": 0, "errors": 0, "index_missing": True}

    token = _get_id_token(BACKEND_URL)
    with httpx.Client(timeout=30.0, headers={"Authorization": f"Bearer {token}"}) as client:
        for sit_doc in situations:
            try:
                sit_data = sit_doc.to_dict()
                uid = sit_doc.reference.parent.parent.id
                sit_id = sit_doc.id
                region = sit_data.get("region", "")
                if not region:
                    continue
                resp = client.post(
                    f"{BACKEND_URL}/api/v1/pipeline/ingest-feeds",
                    json={"situation_id": sit_id},
                    headers={
                        "Authorization": f"Bearer {token}",
                        "X-PRAXIS-UID": uid,
                    },
                )
                resp.raise_for_status()
                processed += 1
            except Exception as exc:
                errors += 1
                log.warning("Failed for situation %s: %s", sit_doc.id, exc)
    return {"processed": processed, "errors": errors, "index_missing": False}


def main():
    log.info("GDELT poller worker starting, poll_interval=%ss", POLL_INTERVAL_SECONDS)
    db = firestore.Client()
    verify_required_indexes(db)
    if SPINE_OK:
        emit_system_event(
            db,
            kind="job.queued",
            severity="info",
            message="gdelt-poller worker started",
            source="worker",
            data={"pollIntervalSeconds": POLL_INTERVAL_SECONDS},
        )
    while True:
        try:
            result = poll_once(db)
            log.info("Poll completed: %s", result)
            if SPINE_OK and (result.get("processed", 0) > 0 or result.get("errors", 0) > 0):
                emit_system_event(
                    db,
                    kind="data.ingested" if result.get("errors", 0) == 0 else "tool.failed",
                    severity="info" if result.get("errors", 0) == 0 else "warn",
                    message=f"GDELT poll: processed={result.get('processed')} errors={result.get('errors')}",
                    source="worker",
                    data=result,
                )
            sleep_for = INDEX_BACKOFF_SECONDS if result.get("index_missing") else POLL_INTERVAL_SECONDS
        except Exception as exc:
            log.exception("Poll failed: %s", exc)
            if SPINE_OK:
                emit_system_event(
                    db,
                    kind="tool.failed",
                    severity="error",
                    message=f"gdelt-poller crash in poll loop: {exc}",
                    source="worker",
                )
            sleep_for = POLL_INTERVAL_SECONDS
        time.sleep(sleep_for)


if __name__ == "__main__":
    main()
