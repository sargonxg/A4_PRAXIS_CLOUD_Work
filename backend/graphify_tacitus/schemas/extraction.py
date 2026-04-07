"""Extraction result schemas — intermediate format between LLM output and ACONode models."""
from pydantic import BaseModel, Field


class ExtractionNode(BaseModel):
    id: str
    label: str
    primitive_type: str
    source_file: str = ""
    source_location: str = ""
    confidence: str = "EXTRACTED"
    metadata: dict = Field(default_factory=dict)


class ExtractionEdge(BaseModel):
    source: str
    target: str
    relation: str
    confidence: str = "EXTRACTED"
    source_file: str = ""
    source_location: str = ""
    weight: float = 1.0


class ExtractionResult(BaseModel):
    nodes: list[ExtractionNode] = Field(default_factory=list)
    edges: list[ExtractionEdge] = Field(default_factory=list)
    hyperedges: list[dict] = Field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0
    source_file: str = ""
    tenant_id: str = ""
    situation_id: str = ""
