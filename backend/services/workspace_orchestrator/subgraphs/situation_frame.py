from __future__ import annotations

from typing import Any


async def on_situation_frame_saved(*, owner_uid: str, case_id: str, frame: dict[str, Any]) -> list[dict[str, Any]]:
    """Create advisory next-step suggestions after the frame changes."""
    _ = owner_uid
    missing = [
        key
        for key in ("what_happening", "why_matters", "what_would_change", "policy_question")
        if not str(frame.get(key, "")).strip()
    ]
    if not missing:
        return []
    return [{
        "case_id": case_id,
        "target_chapter": "desk",
        "surface_key": "context.situation_frame",
        "kind": "frame_gap",
        "title": "Complete the situation frame",
        "body": f"Missing fields: {', '.join(missing)}",
        "confidence": 0.55,
    }]
