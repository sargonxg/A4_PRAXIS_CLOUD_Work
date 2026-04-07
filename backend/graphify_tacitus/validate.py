"""Graph extraction validation — adapted from Graphify's validate.py.

Validates extraction dicts before graph construction.
Warnings are returned as strings; errors raise ValueError.
"""
from .schemas.aco import PrimitiveType

_VALID_PRIMITIVE_TYPES = {p.value for p in PrimitiveType}


def validate_extraction(data: dict) -> list[str]:
    """Validate an extraction dict. Returns list of warning strings.

    Does NOT raise on dangling edges (external references are common in
    conflict text — an actor may reference an entity not yet in the graph).
    """
    warnings: list[str] = []
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    node_ids = set()
    for i, node in enumerate(nodes):
        if "id" not in node:
            warnings.append(f"Node[{i}] missing 'id' field")
        if "label" not in node:
            warnings.append(f"Node[{i}] missing 'label' field")
        if "id" in node:
            node_ids.add(node["id"])

        ptype = node.get("primitive_type")
        if ptype and ptype not in _VALID_PRIMITIVE_TYPES:
            warnings.append(
                f"Node '{node.get('id')}' has unknown primitive_type '{ptype}'"
            )

    for i, edge in enumerate(edges):
        if "source" not in edge:
            warnings.append(f"Edge[{i}] missing 'source' field")
        if "target" not in edge:
            warnings.append(f"Edge[{i}] missing 'target' field")

        src = edge.get("source", "")
        tgt = edge.get("target", "")
        if src and src not in node_ids:
            warnings.append(f"Edge[{i}] source '{src}' not in node set (external reference)")
        if tgt and tgt not in node_ids:
            warnings.append(f"Edge[{i}] target '{tgt}' not in node set (external reference)")

    return warnings
