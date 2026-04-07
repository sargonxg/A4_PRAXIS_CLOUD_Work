"""Conflict entity extractor — reads source text, produces ACO entities via Gemini.

Adapted from Graphify's detect/extract stage but uses LLM-based extraction
instead of tree-sitter AST parsing (since conflict text ≠ code).
"""
import json
import re
from typing import Any

import httpx

from .schemas.extraction import ExtractionEdge, ExtractionNode, ExtractionResult

# ── ACO Extraction Prompt ─────────────────────────────────────────────────────

ACO_EXTRACTION_PROMPT = """You are a conflict intelligence analyst. Read the provided source text and extract ALL conflict-relevant entities using the TACITUS Agentic Conflict Ontology (ACO).

ENTITY TYPES (8 primitives):
1. Actor — Any party, person, organisation, or state involved in the conflict
   Fields: actor_type (state/non-state/individual/institution/armed_group), affiliation, capabilities[], stated_position
2. Claim — A stated position, demand, or assertion made by an actor
   Fields: claim_type (territorial/legal/political/economic/identity), content, legitimacy_basis
3. Interest — An underlying motivation or goal (may differ from stated claim)
   Fields: interest_type (stated/unstated/security/economic/identity/survival), salience (0-1), is_negotiable (bool)
4. Constraint — A factor limiting actor choices or options
   Fields: constraint_type (legal/political/resource/temporal/normative), severity (hard/soft), imposed_by
5. Leverage — A capability, asset, or pressure point one actor holds over another
   Fields: leverage_type (military/economic/diplomatic/informational/moral), holder, target, effectiveness (0-1), sustainability
6. Commitment — An agreement, promise, or obligation (past or current)
   Fields: commitment_type (ceasefire/treaty/verbal/written/binding), status (active/violated/expired/pending), parties[], date_made
7. Event — A specific incident, action, or occurrence with temporal significance
   Fields: event_type (military/diplomatic/humanitarian/political/protest), date, location, casualties (int or null), escalation_impact (-1.0 to +1.0)
8. Narrative — A frame, story, or discourse shaping perceptions of the conflict
   Fields: narrative_type (media/propaganda/historical/identity/victimhood), framing, propagated_by, reach (local/national/international)

RELATIONSHIP TYPES (42 typed edges). Use ONLY these:
Actor→Claim: claims | Actor→Interest: has_interest | Actor→Constraint: faces_constraint
Actor→Leverage: holds_leverage | Actor→Commitment: made_commitment | Actor→Event: participated_in
Actor→Narrative: propagates_narrative | Actor→Actor: allied_with, opposes, mediates_between, sponsors, subordinate_to
Claim→Claim: contradicts, supports_claim | Claim→Interest: based_on_interest
Claim→Narrative: justified_by_narrative | Claim→Constraint: constrained_by
Interest→Interest: conflicts_with, aligns_with | Interest→Claim: underlying_interest_of
Constraint→Leverage: limits_leverage | Constraint→Commitment: blocks_commitment | Constraint→Event: imposed_by_event
Leverage→Actor: targets | Leverage→Event: derived_from_event | Leverage→Constraint: undermined_by
Commitment→Claim: addresses_claim | Commitment→Event: violated_by_event | Commitment→Commitment: supersedes
Event→Event: triggered_by, escalates, de_escalates | Event→Actor: involves_actor
Event→Leverage: affects_leverage | Event→Narrative: validates_narrative, contradicts_narrative
Narrative→Event: frames_event | Narrative→Claim: justifies_claim, undermines_claim
Narrative→Narrative: competes_with, reinforces | Any→Any: semantically_similar_to

CONFIDENCE LEVELS:
- EXTRACTED: directly stated in the source text
- INFERRED: reasonable deduction from the text
- AMBIGUOUS: uncertain, multiple interpretations possible
- ASSESSED: analyst/AI judgment based on pattern recognition

INSTRUCTIONS:
1. Extract ALL conflict-relevant entities — be thorough, not selective
2. Generate stable IDs using snake_case from the entity label (e.g., "Sudan Armed Forces" → "sudan_armed_forces")
3. Identify as many typed relationships as you can find or reasonably infer
4. Tag confidence accurately — only use EXTRACTED if the text explicitly states it
5. Return ONLY valid JSON matching the schema below

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "nodes": [
    {
      "id": "snake_case_stable_id",
      "label": "Human-readable name",
      "primitive_type": "Actor|Claim|Interest|Constraint|Leverage|Commitment|Event|Narrative",
      "confidence": "EXTRACTED|INFERRED|AMBIGUOUS|ASSESSED",
      "metadata": {
        // type-specific fields listed above
      }
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "relation": "relation_name_from_vocabulary_above",
      "confidence": "EXTRACTED|INFERRED|AMBIGUOUS|ASSESSED"
    }
  ]
}"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_id(*parts: str) -> str:
    """Generate a stable snake_case node ID from name parts."""
    combined = "_".join(str(p) for p in parts if p)
    cleaned = re.sub(r"[^a-z0-9_]+", "_", combined.lower())
    return re.sub(r"_+", "_", cleaned).strip("_")


def _strip_html(html: str) -> str:
    """Strip HTML tags and decode basic entities."""
    text = re.sub(r"<(script|style)[^>]*>.*?</(script|style)>", "", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_llm_response(raw: str, source_file: str, tenant_id: str, situation_id: str) -> ExtractionResult:
    """Parse LLM JSON response into ExtractionResult."""
    # Strip markdown code fences if present
    raw = re.sub(r"^```json\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"```\s*$", "", raw.strip())

    try:
        data: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError as exc:
        # Return empty result on parse failure rather than crashing
        return ExtractionResult(source_file=source_file, tenant_id=tenant_id, situation_id=situation_id)

    nodes = [
        ExtractionNode(
            id=n.get("id") or _make_id(n.get("label", "unknown")),
            label=n.get("label", ""),
            primitive_type=n.get("primitive_type", "Actor"),
            source_file=source_file,
            confidence=n.get("confidence", "EXTRACTED"),
            metadata=n.get("metadata", {}),
        )
        for n in data.get("nodes", [])
    ]

    edges = [
        ExtractionEdge(
            source=e.get("source", ""),
            target=e.get("target", ""),
            relation=e.get("relation", "semantically_similar_to"),
            confidence=e.get("confidence", "EXTRACTED"),
            source_file=source_file,
        )
        for e in data.get("edges", [])
        if e.get("source") and e.get("target")
    ]

    return ExtractionResult(
        nodes=nodes,
        edges=edges,
        source_file=source_file,
        tenant_id=tenant_id,
        situation_id=situation_id,
    )


# ── Public extraction functions ───────────────────────────────────────────────

async def extract_conflict_text(
    text: str,
    source_file: str,
    gemini_client: Any,
    tenant_id: str,
    situation_id: str,
) -> ExtractionResult:
    """Extract ACO entities from plain text via Gemini."""
    truncated = text[:30_000]
    prompt = f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{truncated}"

    raw = await gemini_client.generate(prompt)
    return _parse_llm_response(raw, source_file, tenant_id, situation_id)


async def extract_from_url(
    url: str,
    gemini_client: Any,
    tenant_id: str,
    situation_id: str,
) -> ExtractionResult:
    """Fetch URL, strip HTML, extract ACO entities."""
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        resp = await client.get(url, headers={"User-Agent": "PRAXIS/1.0 (+https://praxis.tacitus.me)"})
        resp.raise_for_status()
        text = _strip_html(resp.text)

    return await extract_conflict_text(text, url, gemini_client, tenant_id, situation_id)


async def extract_from_document(
    text: str,
    filename: str,
    gemini_client: Any,
    tenant_id: str,
    situation_id: str,
) -> ExtractionResult:
    """Extract ACO entities from a pre-extracted document text (PDF, DOCX, TXT)."""
    return await extract_conflict_text(text, filename, gemini_client, tenant_id, situation_id)
