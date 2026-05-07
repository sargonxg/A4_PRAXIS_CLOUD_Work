"""Deterministic safe runner for the Red Team Analyst foundation path."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from backend.types.sats import RedTeamReport

DENY_TERMS = ("attack", "targeting coordinates", "weaponize", "assassinate")
FRAMING_NOTE = "modeling adversary perspective for analysis; not endorsement or advocacy"


def is_safe_framing(text: str) -> bool:
    lowered = text.lower()
    return not any(term in lowered for term in DENY_TERMS)


def run_red_team_analysis(
    *,
    case_id: str,
    owner_uid: str,
    target_actor_id: str,
    framing: str = "",
) -> RedTeamReport:
    """Return a safe synthesized red-team report.

    This is the local deterministic scaffold used by tests and prompt-contract
    runs. The production Agent Engine implementation can replace the internals
    while preserving the output contract and safety posture.
    """

    if not is_safe_framing(framing):
      interests = ["Output sanitized because requested framing approached operational or harmful content."]
      constraints = ["PRAXIS safety policy blocks operational red-team details."]
      likely_moves = []
    else:
      interests = ["Preserve leverage", "Avoid visible concession without reciprocal gain", "Shape external perceptions"]
      constraints = ["Limited legitimacy", "Resource pressure", "Exposure to monitoring and sanctions"]
      likely_moves = [
          {
              "move": "Delay public commitment while testing counterparty discipline",
              "rationale": "Delay preserves optionality without immediately closing channels.",
              "probability": "medium",
          },
          {
              "move": "Seek narrower technical implementation language",
              "rationale": "Technical framing can reduce political cost while keeping a path open.",
              "probability": "medium",
          },
      ]

    return RedTeamReport.model_validate(
        {
            "id": f"rt-{uuid4().hex[:12]}",
            "caseId": case_id,
            "ownerUid": owner_uid,
            "targetActorId": target_actor_id,
            "framingNote": FRAMING_NOTE,
            "analysis": {
                "interests": interests,
                "constraints": constraints,
                "likelyMoves": likely_moves,
                "viewOfOtherActors": [
                    {"actorId": "counterparty", "view": "Potential source of concessions and risk."},
                    {"actorId": "external-monitor", "view": "Constraint on freedom of action."},
                ],
            },
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "subagentRunId": f"red-team-{uuid4().hex[:12]}",
            "synthesized": True,
            "confidence": 0.6,
        }
    )
