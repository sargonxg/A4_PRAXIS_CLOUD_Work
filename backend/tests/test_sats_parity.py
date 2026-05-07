from backend.types.sats import ACHMatrix, RedTeamReport


def test_ach_matrix_accepts_pack_15_shape() -> None:
    matrix = ACHMatrix.model_validate(
        {
            "id": "ach-1",
            "caseId": "case-1",
            "ownerUid": "user-1",
            "title": "ACH",
            "status": "in_progress",
            "hypotheses": [{"id": "h1", "text": "Explanation", "proposedBy": "user"}],
            "evidence": [{"id": "e1", "text": "Evidence", "sourceKind": "free_text", "weight": 1}],
            "scores": [{"hypothesisId": "h1", "evidenceId": "e1", "rating": "consistent"}],
            "ranking": [
                {
                    "hypothesisId": "h1",
                    "inconsistencyCount": 0,
                    "weightedInconsistency": 0,
                    "rank": 1,
                    "conclusion": "most_likely",
                }
            ],
            "createdAt": "2026-05-06T00:00:00.000Z",
            "updatedAt": "2026-05-06T00:00:00.000Z",
        }
    )

    assert matrix.case_id == "case-1"
    assert matrix.hypotheses[0].proposed_by == "user"


def test_red_team_report_caps_synthesized_confidence() -> None:
    report = RedTeamReport.model_validate(
        {
            "id": "rt-1",
            "caseId": "case-1",
            "ownerUid": "user-1",
            "targetActorId": "actor-1",
            "framingNote": "modeling adversary perspective for analysis",
            "analysis": {
                "interests": ["Preserve leverage"],
                "constraints": ["Limited legitimacy"],
                "likelyMoves": [{"move": "Delay", "rationale": "Preserves options", "probability": "medium"}],
                "viewOfOtherActors": [{"actorId": "actor-2", "view": "Potential spoiler"}],
            },
            "generatedAt": "2026-05-06T00:00:00.000Z",
            "subagentRunId": "run-1",
            "synthesized": True,
            "confidence": 0.6,
        }
    )

    assert report.synthesized is True
    assert report.confidence <= 0.6
