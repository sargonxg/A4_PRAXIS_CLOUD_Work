from backend.agents.source_augmenter.state_machine import run_research_state_machine


def test_research_pipeline_13_steps_and_report_shape():
    state = run_research_state_machine(
        "What's the current US federal stance on AI transparency in 2026?",
        "ai-regulation-2026",
        "domestic-policy-analyst",
    )

    assert state.steps == [
        "R1:decompose",
        "R2:source_pick",
        "R3:fan_out",
        "R4:fetch_parse",
        "R5:relevance_score",
        "R6:cross_verify",
        "R7:receipts",
        "R8:extract",
        "R9:resolve",
        "R10:firewall",
        "R11:route",
        "R12:commit",
        "R13:respond",
    ]
    assert "executive_summary" in state.report
    assert "source_matrix" in state.report
    assert state.report["cost_estimate_usd"] <= 0.40
