from __future__ import annotations

from typing import Any


async def boardroom_compose(*, owner_uid: str, case_id: str, memos: list[dict[str, Any]]) -> dict[str, Any]:
    _ = owner_uid
    return {
        "case_id": case_id,
        "title": "Principal briefing",
        "sections": [{"title": memo.get("title", "Memo"), "source_memo_id": memo.get("id")} for memo in memos[:6]],
    }


async def boardroom_section_synth(*, owner_uid: str, case_id: str, section_topic: str) -> dict[str, Any]:
    _ = owner_uid
    return {"case_id": case_id, "topic": section_topic, "mode": "SUMMARIES", "confidence": 0.55}
