"""Situation brief renderer — produces markdown and JSON intelligence briefs."""
from __future__ import annotations

import json

import networkx as nx

from .schemas.aco import PrimitiveType


def render_situation_brief(
    G: nx.Graph,
    analysis: dict,
    situation_metadata: dict,
) -> str:
    """Render a markdown SITUATION BRIEF from graph + analysis data."""
    name = situation_metadata.get("name", "Unknown Situation")
    region = situation_metadata.get("region", "")
    description = situation_metadata.get("description", "")

    # Counts
    node_count = G.number_of_nodes()
    edge_count = G.number_of_edges()
    community_count = len(set(
        data.get("community") for _, data in G.nodes(data=True)
        if data.get("community") is not None
    ))

    # Confidence breakdown
    confidence_counts: dict[str, int] = {}
    for _, data in G.nodes(data=True):
        c = data.get("confidence", "EXTRACTED")
        confidence_counts[c] = confidence_counts.get(c, 0) + 1

    # Entity breakdown
    type_counts: dict[str, int] = {}
    for _, data in G.nodes(data=True):
        pt = data.get("primitive_type", "Unknown")
        type_counts[pt] = type_counts.get(pt, 0) + 1

    escalation = analysis.get("escalationAssessment", {})
    glasl_stage = escalation.get("glaslStage", "?")
    trajectory = escalation.get("trajectory", "stable")

    neg_space = analysis.get("negotiationSpace", {})
    zopa_count = len(neg_space.get("zopa", []))
    hard_constraint_count = len(neg_space.get("hardConstraints", []))

    lines: list[str] = []
    lines.append(f"# PRAXIS SITUATION BRIEF: {name}")
    if region:
        lines.append(f"**Region**: {region}")
    if description:
        lines.append(f"\n{description}\n")
    lines.append("---")

    # Executive Summary
    lines.append("\n## EXECUTIVE SUMMARY\n")
    lines.append(f"- **Graph**: {node_count} entities · {edge_count} relationships · {community_count} factions")
    lines.append(f"- **Escalation**: Glasl Stage {glasl_stage}/9 — {trajectory.capitalize()}")
    lines.append(f"- **Negotiation**: {zopa_count} potential ZOPA overlaps · {hard_constraint_count} hard constraints")
    conf_str = ", ".join(f"{k}: {v}" for k, v in confidence_counts.items())
    lines.append(f"- **Data Quality**: {conf_str}")
    entity_str = ", ".join(f"{k}: {v}" for k, v in type_counts.items())
    lines.append(f"- **Entity Types**: {entity_str}")

    # Pivot Actors
    pivot = analysis.get("pivotActors", [])
    if pivot:
        lines.append("\n## KEY ACTORS (Pivot)\n")
        for a in pivot[:10]:
            lines.append(f"- **{a['label']}** ({a.get('actor_type', 'unknown')}) — {a['edges']} connections · Faction {a.get('community', '?')}")

    # Faction Analysis
    factions = analysis.get("factionMap", {})
    if factions:
        lines.append("\n## FACTION ANALYSIS\n")
        for cid, f in factions.items():
            actor_names = ", ".join(a["label"] for a in f.get("actors", [])[:3])
            lines.append(f"### Faction {cid}: {f['name']}")
            lines.append(f"- **Actors**: {actor_names}")
            if f.get("interests"):
                lines.append(f"- **Key Interests**: {', '.join(f['interests'][:3])}")
            if f.get("leverage"):
                lines.append(f"- **Leverage**: {', '.join(f['leverage'][:3])}")

    # Escalation Assessment
    lines.append("\n## ESCALATION ASSESSMENT\n")
    lines.append(f"**Glasl Stage**: {glasl_stage}/9 ({trajectory})")
    chains = escalation.get("escalation_chains", [])
    if chains:
        lines.append("\n**Escalation Chains**:")
        for c in chains[:3]:
            lines.append(f"- {c.get('trigger')} → {c.get('result')} ({c.get('relation')})")

    # Hidden Linkages
    linkages = analysis.get("hiddenLinkages", [])
    if linkages:
        lines.append("\n## HIDDEN LINKAGES\n")
        for link in linkages[:5]:
            lines.append(f"- **{link['source_label']} ↔ {link['target_label']}** [{link.get('relation')}]: {link.get('why')}")

    # Negotiation Space
    lines.append("\n## NEGOTIATION SPACE\n")
    if neg_space.get("zopa"):
        lines.append("**Potential ZOPA** (shared interests across factions):")
        for z in neg_space["zopa"][:3]:
            lines.append(f"- {z['interest']} (salience: {z.get('salience', 0.5):.1f})")
    if neg_space.get("hardConstraints"):
        lines.append("\n**Hard Constraints**:")
        for c in neg_space["hardConstraints"][:3]:
            lines.append(f"- {c['label']} ({c.get('constraint_type', '')})")

    # Intelligence Gaps
    gaps = analysis.get("intelligenceGaps", [])
    if gaps:
        lines.append("\n## INTELLIGENCE GAPS\n")
        for gap in gaps[:7]:
            lines.append(f"- **[{gap['type']}]** {gap['description']} (priority: {gap.get('priority', 0)})")

    # Recommended Actions
    lines.append("\n## RECOMMENDED ACTIONS\n")
    actions = analysis.get("recommendedActions", [])
    if not actions:
        # Auto-generate basic recommendations
        if glasl_stage and int(str(glasl_stage)) >= 7:
            actions = [
                "Immediate ceasefire monitoring and verification mechanism required",
                "Engage IGAD/AU mediation framework — escalation at Lose-Lose zone",
                "Humanitarian access corridors must be negotiated as confidence-building measure",
            ]
        elif glasl_stage and int(str(glasl_stage)) >= 4:
            actions = [
                "Structured dialogue recommended — explore ZOPA overlaps identified above",
                "Track commitment violations — monitor Commitment entities with 'violated' status",
                "Engage gatekeeper actors to facilitate faction-to-faction communication",
            ]
        else:
            actions = [
                "Continue monitoring — escalation stage remains manageable",
                "Invest in early warning indicator tracking",
                "Document commitments and leverage positions for future negotiation",
            ]
    for i, action in enumerate(actions[:5], 1):
        lines.append(f"{i}. {action}")

    return "\n".join(lines)


def render_situation_brief_json(
    G: nx.Graph,
    analysis: dict,
    situation_metadata: dict,
) -> dict:
    """Return the situation brief as a structured dict."""
    node_count = G.number_of_nodes()
    edge_count = G.number_of_edges()
    communities = set(
        data.get("community") for _, data in G.nodes(data=True)
        if data.get("community") is not None
    )

    type_counts: dict[str, int] = {}
    for _, data in G.nodes(data=True):
        pt = data.get("primitive_type", "Unknown")
        type_counts[pt] = type_counts.get(pt, 0) + 1

    escalation = analysis.get("escalationAssessment", {})
    negotiation = analysis.get("negotiationSpace", {})
    situation_name = situation_metadata.get("name", "Unknown Situation")

    return {
        "situationName": situation_name,
        "situation": situation_metadata,
        "executive_summary": {
            "graph": {
                "nodes": node_count,
                "edges": edge_count,
                "communities": len(communities),
            },
            "escalation": {
                "glaslStage": escalation.get("glaslStage"),
                "trajectory": escalation.get("trajectory"),
            },
            "negotiation": {
                "zopa_count": len(negotiation.get("zopa", [])),
                "hard_constraint_count": len(negotiation.get("hardConstraints", [])),
            },
        },
        "stats": {
            "node_count": node_count,
            "edge_count": edge_count,
            "community_count": len(communities),
            "entity_types": type_counts,
        },
        "pivotActors": analysis.get("pivotActors", []),
        "factionMap": analysis.get("factionMap", {}),
        "hiddenLinkages": analysis.get("hiddenLinkages", []),
        "escalationAssessment": analysis.get("escalationAssessment", {}),
        "negotiationSpace": analysis.get("negotiationSpace", {}),
        "intelligenceGaps": analysis.get("intelligenceGaps", []),
        "keyConcepts": analysis.get("keyConcepts", []),
        "markdownBrief": render_situation_brief(G, analysis, situation_metadata),
    }
