"""GLiNER L1 entity pre-pass with deterministic local fallback."""
from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class EntitySpan:
    text: str
    primitive: str
    start: int
    end: int
    confidence: float


PRIMITIVE_LABELS = {
    "Actor": ["person", "organization", "state", "armed group", "institution"],
    "Claim": ["claim", "allegation", "position"],
    "Interest": ["interest", "objective", "priority"],
    "Constraint": ["constraint", "limitation", "risk"],
    "Leverage": ["leverage", "sanction", "incentive"],
    "Commitment": ["commitment", "agreement", "pledge"],
    "Event": ["event", "attack", "meeting", "deadline"],
    "Narrative": ["narrative", "frame", "message"],
}


def detect_entities(text: str, primitives: list[str]) -> list[EntitySpan]:
    """Return GLiNER spans when installed, otherwise a conservative regex pass."""
    labels = _labels_for(primitives)
    model = _load_model()
    if model is not None:
        raw = model.predict_entities(text, labels, threshold=0.45)
        return [
            EntitySpan(
                text=str(item["text"]),
                primitive=_primitive_for_label(str(item["label"]), primitives),
                start=int(item["start"]),
                end=int(item["end"]),
                confidence=float(item.get("score", 0.0)),
            )
            for item in raw
        ]
    return _fallback_detect(text, primitives)


@lru_cache(maxsize=1)
def _load_model():
    try:
        from gliner import GLiNER  # type: ignore
    except Exception:
        return None
    return GLiNER.from_pretrained("urchade/gliner_base")


def _labels_for(primitives: list[str]) -> list[str]:
    labels: list[str] = []
    for primitive in primitives:
        labels.extend(PRIMITIVE_LABELS.get(primitive, [primitive.lower()]))
    return sorted(set(labels))


def _primitive_for_label(label: str, primitives: list[str]) -> str:
    for primitive in primitives:
        if label in PRIMITIVE_LABELS.get(primitive, []):
            return primitive
    return primitives[0] if primitives else "Actor"


def _fallback_detect(text: str, primitives: list[str]) -> list[EntitySpan]:
    spans: list[EntitySpan] = []
    wanted_actor = not primitives or "Actor" in primitives
    if wanted_actor:
        for match in re.finditer(r"\b(?:[A-Z][\wʼ'-]+)(?:\s+(?:[A-Z][\wʼ'-]+|of|and|the|for)){0,5}", text):
            value = match.group(0).strip()
            if len(value) < 3 or value.lower() in {"the", "and"}:
                continue
            spans.append(EntitySpan(text=value, primitive="Actor", start=match.start(), end=match.end(), confidence=0.52))
    if "Event" in primitives:
        for match in re.finditer(r"\b\d{4}(?:-\d{2}-\d{2})?\b", text):
            spans.append(EntitySpan(text=match.group(0), primitive="Event", start=match.start(), end=match.end(), confidence=0.48))
    return _dedupe(spans)[:100]


def _dedupe(spans: list[EntitySpan]) -> list[EntitySpan]:
    seen: set[tuple[int, int, str]] = set()
    deduped: list[EntitySpan] = []
    for span in spans:
        key = (span.start, span.end, span.primitive)
        if key not in seen:
            seen.add(key)
            deduped.append(span)
    return deduped
