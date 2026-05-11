from backend.services.semantica_context_store import semantica_graph_to_records


def test_semantica_graph_to_postgres_records_is_owner_scoped_and_deterministic():
    graph = {
        "entities": [
            {
                "id": "context-core:test",
                "type": "context_core",
                "label": "Test context",
                "properties": {"ontologyId": "conflict"},
                "provenance": {"confidence": 1},
            },
            {
                "id": "domain-ontology:conflict",
                "type": "domain_ontology",
                "label": "Conflict",
                "properties": {"domainId": "armed-conflict-security"},
            },
            {
                "id": "work-ontology:policy",
                "type": "work_ontology",
                "label": "Policy",
                "properties": {"workflowPath": "political-officer"},
            },
        ],
        "relationships": [
            {
                "id": "edge-1",
                "sourceId": "context-core:test",
                "targetId": "domain-ontology:conflict",
                "type": "has_domain_ontology",
            },
            {
                "id": "bad-edge",
                "sourceId": "context-core:test",
                "targetId": "missing",
                "type": "orphan",
            },
        ],
    }

    nodes, edges = semantica_graph_to_records(owner_uid="user-1", case_id="case-1", graph=graph)
    nodes_again, edges_again = semantica_graph_to_records(owner_uid="user-1", case_id="case-1", graph=graph)

    assert len(nodes) == 3
    assert len(edges) == 1
    assert [node.id for node in nodes] == [node.id for node in nodes_again]
    assert [edge.id for edge in edges] == [edge.id for edge in edges_again]
    assert all(node.owner_uid == "user-1" and node.case_id == "case-1" for node in nodes)
    assert edges[0].relation_type == "has_domain_ontology"
    assert edges[0].source_id == nodes[0].id
    assert edges[0].target_id == nodes[1].id
