"""Graph extraction validation — adapted from Graphify's validate.py.

Validates extraction dicts before graph construction.
Warnings are returned as strings; errors raise ValueError.

Validates both node schemas (8 ACO primitives) and relationship types
(42 typed edges) with automatic normalization of LLM output inconsistencies.
"""
from .schemas.aco import PrimitiveType
from .schemas.relationships import ACO_RELATIONSHIPS, normalize_relation

_VALID_PRIMITIVE_TYPES = {p.value for p in PrimitiveType}


def validate_extraction(data: dict, *, normalize: bool = True) -> list[str]:
    """Validate an extraction dict. Returns list of warning strings.

    Does NOT raise on dangling edges (external references are common in
    conflict text — an actor may reference an entity not yet in the graph).

    If normalize=True (default), automatically fixes common LLM extraction issues:
    - Normalizes relationship types to canonical snake_case
    - Normalizes primitive_type capitalization
    """
    warnings: list[str] = []
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    node_ids: set[str] = set()
    node_types: dict[str, str] = {}  # id → primitive_type

    for i, node in enumerate(nodes):
        if "id" not in node:
            warnings.append(f"Node[{i}] missing 'id' field")
        if "label" not in node:
            warnings.append(f"Node[{i}] missing 'label' field")
        if "id" in node:
            node_ids.add(node["id"])

        ptype = node.get("primitive_type", "")

        # Normalize primitive_type capitalization (e.g., "actor" → "Actor")
        if normalize and ptype and ptype not in _VALID_PRIMITIVE_TYPES:
            capitalized = ptype.capitalize()
            if capitalized in _VALID_PRIMITIVE_TYPES:
                node["primitive_type"] = capitalized
                ptype = capitalized
            else:
                warnings.append(
                    f"Node '{node.get('id')}' has unknown primitive_type '{ptype}'"
                )
        elif ptype and ptype not in _VALID_PRIMITIVE_TYPES:
            warnings.append(
                f"Node '{node.get('id')}' has unknown primitive_type '{ptype}'"
            )

        if "id" in node and ptype:
            node_types[node["id"]] = ptype

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

        # Validate and normalize relationship types
        relation = edge.get("relation", "")
        if relation:
            normalized = normalize_relation(relation)
            if normalized != relation:
                if normalize:
                    edge["relation"] = normalized
                else:
                    warnings.append(
                        f"Edge[{i}] relation '{relation}' not in canonical form (expected '{normalized}')"
                    )

            if normalized not in ACO_RELATIONSHIPS:
                warnings.append(
                    f"Edge[{i}] unknown relation type '{normalized}'"
                )
            else:
                # Check source/target type compatibility
                rel_def = ACO_RELATIONSHIPS[normalized]
                expected_src = rel_def["source_types"]
                expected_tgt = rel_def["target_types"]
                src_type = node_types.get(src, "")
                tgt_type = node_types.get(tgt, "")
                if "*" not in expected_src and src_type and src_type not in expected_src:
                    warnings.append(
                        f"Edge[{i}] '{normalized}' expects source type '{expected_src}' but got '{src_type}'"
                    )
                if "*" not in expected_tgt and tgt_type and tgt_type not in expected_tgt:
                    warnings.append(
                        f"Edge[{i}] '{normalized}' expects target type '{expected_tgt}' but got '{tgt_type}'"
                    )

    return warnings
