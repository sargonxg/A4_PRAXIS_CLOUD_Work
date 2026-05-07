from pathlib import Path


def test_cognee_firewall_migration_blocks_verdict_and_high_confidence():
    source = (Path(__file__).parents[1] / "migrations/versions/0014_cognee_provenance_firewall.py").read_text()
    assert "reject_unsafe_cognee_graph_node" in source
    assert "NEW.layer = 'Verdict'" in source
    assert "NEW.confidence > 0.600" in source
    assert "prov->>'kind' = 'cognee'" in source
