"""ACO v1 extraction result schemas — intermediate format between LLM output and ACONode models.

Supports the 8 primitive types and 42 relationship types with temporal metadata and provenance.
"""
from pydantic import BaseModel, Field


class ExtractionNode(BaseModel):
    id: str
    label: str
    primitive_type: str
    confidence: str = "EXTRACTED"  # EXTRACTED | INFERRED | AMBIGUOUS | ASSESSED
    description: str = ""
    subtype: str = ""
    date: str = ""
    location: str = ""
    status: str = ""
    valid_from: str = ""
    valid_until: str = ""
    source_file: str = ""
    source_location: str = ""
    source_url: str = ""
    source_name: str = ""
    metadata: dict = Field(default_factory=dict)


class ExtractionEdge(BaseModel):
    source: str
    target: str
    relation: str
    confidence: str = "EXTRACTED"
    description: str = ""
    valid_from: str = ""
    valid_until: str = ""
    source_file: str = ""
    source_location: str = ""
    weight: float = 1.0


class TimelineEntry(BaseModel):
    date: str
    event: str
    significance: str = "medium"  # critical | high | medium | low
    node_ids: list[str] = Field(default_factory=list)


class ExtractionResult(BaseModel):
    nodes: list[ExtractionNode] = Field(default_factory=list)
    edges: list[ExtractionEdge] = Field(default_factory=list)
    timeline: list[TimelineEntry] = Field(default_factory=list)
    summary: str = ""
    hyperedges: list[dict] = Field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0
    source_file: str = ""
    source_url: str = ""
    source_name: str = ""
    tenant_id: str = ""
    situation_id: str = ""
    extracted_at: str = ""
