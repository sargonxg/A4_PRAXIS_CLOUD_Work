"""ACO v2.0 — Agentic Conflict Ontology schema package.

14 entity types (8 core + 6 extended), 72 typed relationships, and extraction schemas
with temporal metadata, provenance tracking, and confidence levels.

Theoretical grounding: Fisher-Ury, Glasl, Burton, Zartman, Stedman, Lederach,
Galtung, CAMEO, INFORM Risk Index, Putnam.
"""

from .aco import (
    ACONode,
    ACO_TYPE_MAP,
    Actor,
    Claim,
    Commitment,
    ConfidenceLevel,
    Constraint,
    Event,
    Grievance,
    Institution,
    Interest,
    Leverage,
    Narrative,
    Norm,
    Policy,
    PrimitiveType,
    Resource,
    Risk,
    CORE_PRIMITIVES,
    EXTENDED_PRIMITIVES,
    make_aco_node,
)

from .relationships import (
    ACOEdge,
    ACO_RELATIONSHIPS,
    RELATIONSHIP_CATEGORIES,
)

from .extraction import (
    ExtractionEdge,
    ExtractionNode,
    ExtractionResult,
    TimelineEntry,
)

__all__ = [
    # ACO nodes
    "ACONode", "ACO_TYPE_MAP", "Actor", "Claim", "Commitment", "ConfidenceLevel",
    "Constraint", "Event", "Grievance", "Institution", "Interest", "Leverage",
    "Narrative", "Norm", "Policy", "PrimitiveType", "Resource", "Risk",
    "CORE_PRIMITIVES", "EXTENDED_PRIMITIVES", "make_aco_node",
    # Relationships
    "ACOEdge", "ACO_RELATIONSHIPS", "RELATIONSHIP_CATEGORIES",
    # Extraction
    "ExtractionEdge", "ExtractionNode", "ExtractionResult", "TimelineEntry",
]
