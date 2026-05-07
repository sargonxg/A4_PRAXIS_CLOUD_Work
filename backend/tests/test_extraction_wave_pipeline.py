from backend.services.context_genesis.pipeline import PIPELINE_STAGES, STAGE_CONTRACTS, default_pipeline_plan


def test_pack30_pipeline_order_is_fixed():
    assert PIPELINE_STAGES == [
        "fetch",
        "parse",
        "chunk",
        "recall_ner",
        "precision_extract",
        "firewall_write",
    ]


def test_workers_do_not_own_persistence_contracts():
    for stage in ["parse", "recall_ner"]:
        assert STAGE_CONTRACTS[stage].writes == []
    assert STAGE_CONTRACTS["firewall_write"].writes == ["postgres_graph", "firestore_review_queue"]


def test_default_pipeline_plan_records_case_source_and_ontology():
    plan = default_pipeline_plan("case-1", "gs://bucket/doc.pdf", ["conflict", "legal"])
    assert plan.case_id == "case-1"
    assert plan.source_uri == "gs://bucket/doc.pdf"
    assert plan.ontology_ids == ["conflict", "legal"]
    assert [stage.id for stage in plan.stages] == PIPELINE_STAGES
