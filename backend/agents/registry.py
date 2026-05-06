"""Registry of Phase 2 agent graph builders."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable


GraphBuilder = Callable[[Any], Any]


@dataclass(frozen=True)
class FlowRegistration:
    name: str
    builder: GraphBuilder
    description: str

    def build(self, checkpointer: Any) -> Any:
        return self.builder(checkpointer)


def _placeholder_flow(name: str) -> GraphBuilder:
    return lambda checkpointer: {
        "name": name,
        "checkpointer": checkpointer,
        "status": "registered",
    }


FLOW_REGISTRY: dict[str, FlowRegistration] = {
    "document_extraction": FlowRegistration(
        "document_extraction",
        _placeholder_flow("document_extraction"),
        "Durable document parsing, extraction, and graph proposal staging.",
    ),
    "boardroom": FlowRegistration(
        "boardroom",
        _placeholder_flow("boardroom"),
        "Multi-advisor deliberation with human-in-the-loop resume points.",
    ),
    "deep_research": FlowRegistration(
        "deep_research",
        _placeholder_flow("deep_research"),
        "Planner-driven research with checkpointed retrieval and synthesis.",
    ),
    "symbolic_firewall": FlowRegistration(
        "symbolic_firewall",
        _placeholder_flow("symbolic_firewall"),
        "Claim verification and trust scoring before user-visible rendering.",
    ),
    "gdelt_monitor": FlowRegistration(
        "gdelt_monitor",
        _placeholder_flow("gdelt_monitor"),
        "Durable monitoring flow for GDELT-derived situation signals.",
    ),
}


def build_registry(checkpointer: Any) -> dict[str, Any]:
    return {name: registration.build(checkpointer) for name, registration in FLOW_REGISTRY.items()}
