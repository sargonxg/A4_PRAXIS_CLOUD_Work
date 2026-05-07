"""OpenSanctions yente client with owner-scoped persistence discipline."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

import httpx

try:
    from rigour.names import normalize_name as rigour_normalize_name
except Exception:  # pragma: no cover - optional dependency fallback
    rigour_normalize_name = None

try:
    from rigour.langs.countries import normalize_country as rigour_normalize_country
except Exception:  # pragma: no cover - optional dependency fallback
    rigour_normalize_country = None


@dataclass(frozen=True)
class ActorNode:
    id: str
    label: str
    subtype: str = "organization"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class SanctionsMatch:
    entity_id: str
    schema: str
    score: float
    matched_labels: list[str]
    datasets: list[str]
    opensanctions_url: str


def normalize_actor(actor: ActorNode) -> dict[str, Any]:
    schema = "Person" if "person" in actor.subtype.lower() else "Organization"
    country = actor.metadata.get("country")
    normalized_name = rigour_normalize_name(actor.label) if rigour_normalize_name else actor.label.strip()
    normalized_country = rigour_normalize_country(country) if country and rigour_normalize_country else country
    return {
        "schema": schema,
        "properties": {
            "name": [normalized_name],
            "country": [normalized_country] if normalized_country else [],
        },
    }


async def match_actor(actor: ActorNode, *, yente_url: str | None = None, threshold: float = 0.7, timeout_s: float = 10.0) -> list[SanctionsMatch]:
    base_url = (yente_url or os.getenv("YENTE_URL") or "").rstrip("/")
    if not base_url:
        raise RuntimeError("YENTE_URL is required for sanctions matching")
    payload = {"queries": {actor.id: normalize_actor(actor)}}
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        response = await client.post(f"{base_url}/match/sanctions", json=payload)
        response.raise_for_status()
        data = response.json()
    results = data.get("responses", {}).get(actor.id, {}).get("results", [])
    matches: list[SanctionsMatch] = []
    for result in results:
        score = float(result.get("score", 0.0) or 0.0)
        if score < threshold:
            continue
        entity_id = str(result.get("id"))
        properties = result.get("properties", {}) or {}
        matches.append(
            SanctionsMatch(
                entity_id=entity_id,
                schema=str(result.get("schema", "")),
                score=score,
                matched_labels=list(properties.get("topics", []) or []),
                datasets=list(result.get("datasets", []) or []),
                opensanctions_url=f"https://www.opensanctions.org/entities/{entity_id}/",
            )
        )
    return matches

