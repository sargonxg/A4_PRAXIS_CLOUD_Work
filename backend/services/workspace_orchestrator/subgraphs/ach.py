from __future__ import annotations

from typing import Any


async def ach_suggest_hypotheses(*, owner_uid: str, case_id: str, frame: dict[str, Any]) -> list[dict[str, Any]]:
    _ = owner_uid
    question = frame.get("policy_question") or "the active case frame"
    return [{"case_id": case_id, "text": f"Alternative explanation for {question}", "confidence": 0.55}]


async def ach_suggest_evidence(*, owner_uid: str, case_id: str, hypothesis: str) -> dict[str, Any]:
    _ = owner_uid
    return {"case_id": case_id, "hypothesis": hypothesis, "mode": "GRAPH_COMPLETION"}
