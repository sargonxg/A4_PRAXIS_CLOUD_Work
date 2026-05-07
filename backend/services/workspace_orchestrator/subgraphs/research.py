from __future__ import annotations

from typing import Any


async def research_thread_run(*, owner_uid: str, case_id: str, question: str, turns: list[dict[str, Any]]) -> dict[str, Any]:
    """Return the advisory metadata a LangGraph research run should log."""
    _ = owner_uid
    return {
        "case_id": case_id,
        "surface_key": "chapter.research",
        "question": question,
        "turn_count": len(turns),
        "memory_coverage": min(1.0, max(0.0, len(turns) / 6)),
    }
