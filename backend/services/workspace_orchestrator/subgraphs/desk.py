from __future__ import annotations

from typing import Any


async def desk_synthesis(*, owner_uid: str, case_id: str, signals: dict[str, Any]) -> list[dict[str, Any]]:
    _ = owner_uid
    return [{
        "case_id": case_id,
        "target_chapter": "desk",
        "surface_key": "chapter.desk",
        "kind": "next_action",
        "title": "Review the highest-impact workspace gap",
        "body": signals.get("summary", "Open Context, Library, or Research based on the current case gap."),
        "confidence": 0.55,
    }]
