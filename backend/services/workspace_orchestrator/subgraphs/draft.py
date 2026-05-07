from __future__ import annotations

from typing import Any


async def draft_assist(*, owner_uid: str, case_id: str, selection: str) -> dict[str, Any]:
    _ = owner_uid
    return {
        "case_id": case_id,
        "surface_key": "chapter.draft",
        "query": selection,
        "mode": "CHUNKS",
        "token_budget": 300,
    }
