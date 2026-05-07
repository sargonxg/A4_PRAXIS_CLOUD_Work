from __future__ import annotations


def build_graph(checkpointer: object | None = None) -> dict[str, object]:
    return {
        "name": "moderator",
        "checkpointer": checkpointer,
        "nodes": [
            "open",
            "schedule_initial_takes",
            "detect_disagreements",
            "schedule_disagreement_rounds",
            "schedule_deepening",
            "call_synthesis",
            "close",
            "cost_guard",
        ],
        "status": "foundation-scaffold",
    }
