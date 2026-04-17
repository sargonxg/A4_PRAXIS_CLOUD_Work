"""GDELT poller — Cloud Run Worker Pool variant.

Runs continuously. Polls every 15 minutes. No HTTP endpoint.
"""
import os
import time
import logging
from datetime import datetime, timezone

import httpx
from google.cloud import firestore
import google.auth.transport.requests
import google.oauth2.id_token

BACKEND_URL = os.environ["PRAXIS_BACKEND_URL"]
POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "900"))  # 15 min default
MAX_SITUATIONS = int(os.environ.get("MAX_SITUATIONS", "50"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("gdelt_poller")


def _get_id_token(audience: str) -> str:
    auth_req = google.auth.transport.requests.Request()
    return google.oauth2.id_token.fetch_id_token(auth_req, audience)


def poll_once(db: firestore.Client) -> dict:
    """One pass: list active situations, ingest GDELT for each."""
    processed, errors = 0, 0
    # Use a collection_group query to find situations across all users
    situations = (
        db.collection_group("situations")
        .where("status", "==", "active")
        .limit(MAX_SITUATIONS)
        .stream()
    )

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
                    f"{BACKEND_URL}/api/v1/pipeline/ingest-gdelt",
                    json={"uid": uid, "situation_id": sit_id, "region": region},
                )
                resp.raise_for_status()
                processed += 1
            except Exception as exc:
                errors += 1
                log.warning("Failed for situation %s: %s", sit_doc.id, exc)
    return {"processed": processed, "errors": errors}


def main():
    log.info("GDELT poller worker starting, poll_interval=%ss", POLL_INTERVAL_SECONDS)
    db = firestore.Client()
    while True:
        try:
            result = poll_once(db)
            log.info("Poll completed: %s", result)
        except Exception as exc:
            log.exception("Poll failed: %s", exc)
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
