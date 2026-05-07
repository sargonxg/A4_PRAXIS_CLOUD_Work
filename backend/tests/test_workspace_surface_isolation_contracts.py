from pathlib import Path


ROOT = Path(__file__).parents[1]


def test_chapter_queries_scope_work_products_by_owner_and_case():
    source = (ROOT / "routers" / "chapters.py").read_text(encoding="utf-8")
    for table in ["research_threads", "memos", "drafts", "briefings", "dialectica_runs"]:
        assert table in source
    assert source.count("owner_uid = %s") >= 10
    assert source.count("case_id = %s") >= 8
    assert "tenant_session(token[\"uid\"])" in source


def test_tab_queries_scope_substrate_by_owner_and_case():
    source = (ROOT / "routers" / "tabs.py").read_text(encoding="utf-8")
    for table in ["situation_frames", "source_receipts", "aco_cognee_link", "graph_nodes", "graph_edges"]:
        assert table in source
    assert source.count("owner_uid = %s") >= 8
    assert source.count("case_id = %s") >= 8
    assert "tenant_session(token[\"uid\"])" in source


def test_cognee_modes_match_surface_contracts():
    chapters = (ROOT / "routers" / "chapters.py").read_text(encoding="utf-8")
    tabs = (ROOT / "routers" / "tabs.py").read_text(encoding="utf-8")
    memory = (ROOT / "services" / "cognee_memory.py").read_text(encoding="utf-8")
    assert "CogneeSearchMode.GRAPH_COMPLETION" in chapters
    assert "CogneeSearchMode.CHUNKS" in chapters
    assert "CogneeSearchMode.NATURAL_LANGUAGE" in chapters
    assert "node_set=[f\"case_{thread['case_id']}\"]" in chapters
    assert "node_set=[f\"case_{case_id}\"]" in tabs
    assert "save_interaction: bool = True" in memory
    assert "mode=CogneeSearchMode.CHUNKS" in memory


def test_workspace_events_stream_suggestions_and_logs():
    source = (ROOT / "routers" / "workspace.py").read_text(encoding="utf-8")
    assert "FROM workspace_suggestions" in source
    assert "FROM workspace_orchestrator_log" in source
    assert "dismiss_workspace_suggestion" in source
    assert "confirm_workspace_suggestion" in source


def test_research_recall_persists_visible_citation_shaped_turns():
    source = (ROOT / "routers" / "chapters.py").read_text(encoding="utf-8")
    assert "_serialize_memory_hit" in source
    assert "_build_recall_answer" in source
    assert '"citations": citations' in source
    assert "json.dumps([recall_turn])" in source
    assert "Recall turn persisted with Cognee session continuity." in source
