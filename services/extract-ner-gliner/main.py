from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

try:
    from gliner import GLiNER
except Exception:  # pragma: no cover - dependency is present only in worker image
    GLiNER = None  # type: ignore[assignment]


app = FastAPI(title="PRAXIS GLiNER Extractor", version="1.0.0")


class ExtractRequest(BaseModel):
    text: str = Field(..., min_length=1)
    ontology_ids: list[str] = Field(default_factory=lambda: ["conflict"])
    threshold: float = 0.5


class ExtractedEntity(BaseModel):
    text: str
    label: str
    start: int
    end: int
    confidence: float


class ExtractResponse(BaseModel):
    entities: list[ExtractedEntity]
    labels_used: list[str]


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "worker": "extract-ner-gliner"}


@app.post("/extract")
async def extract(req: ExtractRequest) -> ExtractResponse:
    labels = sorted({label for ontology_id in req.ontology_ids for label in load_labels(ontology_id)})
    raw_entities = get_model().predict_entities(req.text, labels, threshold=req.threshold)
    return ExtractResponse(
        labels_used=labels,
        entities=[
            ExtractedEntity(
                text=str(entity["text"]),
                label=str(entity["label"]),
                start=int(entity["start"]),
                end=int(entity["end"]),
                confidence=float(entity["score"]),
            )
            for entity in raw_entities
        ],
    )


@lru_cache(maxsize=1)
def get_model():
    if GLiNER is None:
        raise RuntimeError("gliner is not installed in this environment")
    return GLiNER.from_pretrained("urchade/gliner_base")


@lru_cache(maxsize=16)
def load_labels(ontology_id: str) -> list[str]:
    path = Path(__file__).parent / "labels" / f"{ontology_id}.json"
    if not path.exists():
        path = Path(__file__).parent / "labels" / "conflict.json"
    return json.loads(path.read_text(encoding="utf-8"))
