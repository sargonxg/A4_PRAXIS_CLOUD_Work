"""Cypher export helper — converts a NetworkX graph to idempotent Neo4j Cypher."""
from __future__ import annotations

import json as json_lib
from datetime import datetime, timezone

import networkx as nx


def to_cypher(G: nx.Graph, tenant_id: str, situation_id: str) -> str:
    """Generate an idempotent Cypher script (MERGE) suitable for Neo4j import.

    Each node and edge uses MERGE so the script is safe to re-run.
    """
    lines = [
        f"// PRAXIS graph export — situation {situation_id}",
        f"// Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
    ]
    for node_id, data in G.nodes(data=True):
        ptype = data.get("primitive_type", "Entity")
        label = str(data.get("label", node_id)).replace("'", "\\'")
        props = ", ".join(
            f"{k}: {json_lib.dumps(v)}"
            for k, v in data.items()
            if isinstance(v, (str, int, float, bool)) and k not in ("label",)
        )
        lines.append(
            f"MERGE (:{ptype} {{id: '{node_id}', tenant_id: '{tenant_id}', "
            f"situation_id: '{situation_id}', label: '{label}'"
            + (f", {props}" if props else "")
            + "});"
        )
    for u, v, data in G.edges(data=True):
        relation = str(data.get("relation", "RELATED_TO")).upper().split(",")[0].strip()
        weight = data.get("weight", 1.0)
        lines.append(
            f"MATCH (a {{id: '{u}', tenant_id: '{tenant_id}'}}), "
            f"(b {{id: '{v}', tenant_id: '{tenant_id}'}}) "
            f"MERGE (a)-[:{relation} {{weight: {weight}}}]->(b);"
        )
    return "\n".join(lines)
