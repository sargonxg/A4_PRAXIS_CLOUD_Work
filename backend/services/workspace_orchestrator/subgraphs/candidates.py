from __future__ import annotations

from typing import Any


async def on_candidates_accumulated(*, owner_uid: str, case_id: str, candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    _ = owner_uid
    if len(candidates) < 3:
        return []
    return [{
        "case_id": case_id,
        "target_tab": "ontology",
        "surface_key": "tab.ontology",
        "kind": "dedup_group",
        "title": "Review possible duplicate ontology candidates",
        "body": f"{len(candidates)} recent candidates may contain overlapping actors or claims.",
        "confidence": 0.55,
        "payload": {"candidate_ids": [item.get("id") for item in candidates[:10]]},
    }]
