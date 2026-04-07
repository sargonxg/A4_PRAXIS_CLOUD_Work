"""Graph export — Neo4j push, HTML visualization, JSON, Cypher, GraphML.

Adapted from Graphify's export.py with ACO-specific node labels, colors,
TACITUS tenant isolation, and conflict-specific visualization styles.
"""
from __future__ import annotations

import json
from pathlib import Path

import networkx as nx

# TACITUS ACO color palette
ACO_COLORS: dict[str, str] = {
    "Actor": "#4E79A7",
    "Claim": "#F28E2B",
    "Interest": "#59A14F",
    "Constraint": "#E15759",
    "Leverage": "#EDC948",
    "Commitment": "#76B7B2",
    "Event": "#B07AA1",
    "Narrative": "#FF9DA7",
}

ACO_SHAPES: dict[str, str] = {
    "Actor": "dot",
    "Claim": "square",
    "Interest": "triangle",
    "Constraint": "diamond",
    "Leverage": "star",
    "Commitment": "ellipse",
    "Event": "diamond",
    "Narrative": "triangleDown",
}


# ── Neo4j Export ──────────────────────────────────────────────────────────────

async def push_to_neo4j(
    G: nx.Graph,
    uri: str,
    user: str,
    password: str,
    communities: dict[str, int],
    tenant_id: str,
    situation_id: str,
) -> dict:
    """Push graph to Neo4j with ACO node labels and tenant isolation.

    Each node gets its primitive_type as the Neo4j label (e.g. :Actor, :Claim).
    MERGE is keyed on (id, tenant_id) to prevent cross-tenant contamination.
    """
    from neo4j import AsyncGraphDatabase

    async with AsyncGraphDatabase.driver(uri, auth=(user, password)) as driver:
        async with driver.session() as session:
            # Ensure constraints
            primitives = ["Actor", "Claim", "Interest", "Constraint",
                          "Leverage", "Commitment", "Event", "Narrative"]
            for p in primitives:
                await session.run(
                    f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{p}) "
                    f"REQUIRE (n.id, n.tenant_id) IS UNIQUE"
                )

            # Push nodes
            node_count = 0
            for node_id, data in G.nodes(data=True):
                ptype = data.get("primitive_type", "Entity")
                props = {
                    k: v for k, v in data.items()
                    if isinstance(v, (str, int, float, bool)) and not k.startswith("_")
                }
                props["id"] = node_id
                props["tenant_id"] = tenant_id
                props["situation_id"] = situation_id
                props["community"] = communities.get(node_id)

                await session.run(
                    f"MERGE (n:{ptype} {{id: $id, tenant_id: $tenant_id}}) SET n += $props",
                    {"id": node_id, "tenant_id": tenant_id, "props": props}
                )
                node_count += 1

            # Push edges
            edge_count = 0
            for u, v, data in G.edges(data=True):
                relation = data.get("relation", "RELATED_TO").upper().replace(" ", "_").replace("-", "_")
                # Use only the first relation if comma-separated
                relation = relation.split(",")[0].strip()
                await session.run(
                    f"MATCH (a {{id: $u, tenant_id: $tid}}), (b {{id: $v, tenant_id: $tid}}) "
                    f"MERGE (a)-[r:{relation}]->(b) "
                    f"SET r.weight = $weight, r.confidence = $confidence, r.situation_id = $sit_id",
                    {
                        "u": u, "v": v, "tid": tenant_id, "sit_id": situation_id,
                        "weight": data.get("weight", 1.0),
                        "confidence": data.get("confidence", "EXTRACTED"),
                    }
                )
                edge_count += 1

    return {"nodes_pushed": node_count, "edges_pushed": edge_count}


# ── JSON Export ───────────────────────────────────────────────────────────────

def to_json(G: nx.Graph, communities: dict[str, int], output_path: str | None = None) -> dict:
    """Export graph as JSON with ACO metadata."""
    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append({
            "id": node_id,
            "community": communities.get(node_id),
            **{k: v for k, v in data.items() if not k.startswith("_")},
        })

    edges = []
    for u, v, data in G.edges(data=True):
        edges.append({
            "source": u,
            "target": v,
            **{k: v for k, v in data.items() if not k.startswith("_")},
        })

    result = {"nodes": nodes, "edges": edges}

    if output_path:
        Path(output_path).write_text(json.dumps(result, indent=2, default=str))

    return result


# ── HTML Visualization ────────────────────────────────────────────────────────

def to_html(
    G: nx.Graph,
    communities: dict[str, int],
    community_labels: dict[int, str],
    analysis: dict,
) -> str:
    """Generate an interactive HTML visualization using vis.js Network.

    Uses TACITUS ACO color palette. Nodes shaped by primitive type.
    """
    nodes_data = []
    for node_id, data in G.nodes(data=True):
        ptype = data.get("primitive_type", "Entity")
        color = ACO_COLORS.get(ptype, "#999999")
        shape = ACO_SHAPES.get(ptype, "dot")
        community = communities.get(node_id, 0)
        label = data.get("label", node_id)
        nodes_data.append({
            "id": node_id,
            "label": label[:30] + ("…" if len(label) > 30 else ""),
            "title": f"<b>{label}</b><br>Type: {ptype}<br>Faction: {community_labels.get(community, f'Faction {community}')}",
            "color": {"background": color, "border": "#0F172A"},
            "shape": shape,
            "size": min(10 + G.degree(node_id) * 2, 40),
            "font": {"color": "#ffffff", "size": 12},
        })

    edges_data = []
    for u, v, data in G.edges(data=True):
        edges_data.append({
            "from": u,
            "to": v,
            "label": data.get("relation", ""),
            "width": min(1 + data.get("weight", 1.0), 5),
            "color": {"color": "#64748b"},
            "font": {"size": 10, "color": "#94a3b8"},
        })

    glasl_stage = analysis.get("escalationAssessment", {}).get("glaslStage", "?")
    node_count = G.number_of_nodes()
    edge_count = G.number_of_edges()

    legend_html = "".join(
        f'<div style="display:flex;align-items:center;gap:6px;margin:4px 0">'
        f'<div style="width:14px;height:14px;border-radius:3px;background:{color}"></div>'
        f'<span style="font-size:12px;color:#e2e8f0">{ptype}</span></div>'
        for ptype, color in ACO_COLORS.items()
    )

    return f"""<!DOCTYPE html>
<html>
<head>
  <title>PRAXIS Conflict Graph</title>
  <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    body {{ margin:0; background:#0F172A; color:#e2e8f0; font-family:'Inter',sans-serif; }}
    #graph {{ width:100vw; height:100vh; }}
    #info {{ position:fixed; top:16px; left:16px; background:rgba(15,23,42,0.9);
             padding:16px; border-radius:8px; border:1px solid #1e293b; min-width:200px; }}
    h1 {{ color:#10B981; font-size:16px; margin:0 0 8px 0; }}
    .stat {{ font-size:12px; color:#94a3b8; margin:2px 0; }}
    .badge {{ display:inline-block; padding:2px 8px; border-radius:12px;
              font-size:11px; background:#E8B931; color:#0F172A; font-weight:600; }}
  </style>
</head>
<body>
  <div id="info">
    <h1>PRAXIS Conflict Graph</h1>
    <div class="stat">{node_count} entities · {edge_count} relationships</div>
    <div class="stat">Glasl Stage: <span class="badge">{glasl_stage}/9</span></div>
    <div style="margin-top:12px">{legend_html}</div>
  </div>
  <div id="graph"></div>
  <script>
    var nodes = new vis.DataSet({json.dumps(nodes_data)});
    var edges = new vis.DataSet({json.dumps(edges_data)});
    var network = new vis.Network(
      document.getElementById('graph'),
      {{ nodes: nodes, edges: edges }},
      {{
        physics: {{ stabilization: {{ iterations: 200 }}, barnesHut: {{ gravitationalConstant: -8000 }} }},
        edges: {{ arrows: {{ to: {{ enabled: true, scaleFactor: 0.5 }} }}, smooth: {{ type: 'curvedCW' }} }},
        interaction: {{ hover: true, tooltipDelay: 200 }},
      }}
    );
  </script>
</body>
</html>"""


# ── Cypher Export ─────────────────────────────────────────────────────────────

def to_cypher(G: nx.Graph, communities: dict[str, int], tenant_id: str = "") -> str:
    """Export graph as Cypher CREATE statements."""
    lines = []
    for node_id, data in G.nodes(data=True):
        ptype = data.get("primitive_type", "Entity")
        label = data.get("label", node_id).replace("'", "\\'")
        lines.append(
            f"MERGE (n:{ptype} {{id: '{node_id}', tenant_id: '{tenant_id}'}}) "
            f"SET n.label = '{label}', n.community = {communities.get(node_id, 0)};"
        )
    for u, v, data in G.edges(data=True):
        relation = data.get("relation", "RELATED_TO").upper()
        lines.append(
            f"MATCH (a {{id: '{u}', tenant_id: '{tenant_id}'}}), (b {{id: '{v}', tenant_id: '{tenant_id}'}}) "
            f"MERGE (a)-[:{relation}]->(b);"
        )
    return "\n".join(lines)


# ── GraphML Export ────────────────────────────────────────────────────────────

def to_graphml(G: nx.Graph, output_path: str | None = None) -> str:
    """Export graph as GraphML XML string."""
    import io
    buf = io.BytesIO()
    nx.write_graphml(G, buf)
    xml = buf.getvalue().decode("utf-8")
    if output_path:
        Path(output_path).write_text(xml)
    return xml
