from __future__ import annotations


def build_graph(checkpointer: object | None = None) -> dict[str, object]:
    return {
        "name": "analyst_persona",
        "checkpointer": checkpointer,
        "nodes": ["load_persona", "prepare_context", "retrieve_corpus", "maybe_invoke_tool", "compose_contribution", "structure_output"],
        "status": "foundation-scaffold",
    }
