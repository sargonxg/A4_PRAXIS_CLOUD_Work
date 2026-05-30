from backend.ai.capsule_eval import run_capsule_dry_run_eval


def test_capsule_eval_scores_schema_and_citations():
    result = run_capsule_dry_run_eval(
        capsule={
            "id": "c1",
            "eval": {"thresholds": {"faithfulness": 0.5, "citationCoverage": 0.5, "schemaConformance": 1.0}},
            "output": {"responseJsonSchema": {"required": ["summary"]}},
        },
        samples=[
            {
                "output": {"summary": "UN evidence indicates displacement rose."},
                "claims": [{"id": "claim-1", "text": "displacement rose", "sourceIds": ["s1"]}],
            }
        ],
        source_snippets=[{"id": "s1", "text": "UN evidence indicates displacement rose."}],
    )

    assert result["scores"]["citationCoverage"] == 1
    assert result["scores"]["schemaConformance"] == 1
    assert result["passed"] is True
    assert result["ragasFaithfulness"]["mode"] == "proxy"
