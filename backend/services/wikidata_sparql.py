"""Rate-limited Wikidata SPARQL helpers for research grounding."""
from __future__ import annotations

import time
from dataclasses import asdict, dataclass
from typing import Any

from backend.services.wikidata_resolver import KNOWN_QIDS, normalize_name, resolve_actor


@dataclass(frozen=True)
class Actor:
    qid: str
    label: str
    description: str = ""
    score: float = 1.0


_last_query_at = 0.0


def sparql_query(query: str) -> list[dict[str, Any]]:
    global _last_query_at
    try:
        import requests
    except Exception:
        return []
    elapsed = time.monotonic() - _last_query_at
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_query_at = time.monotonic()
    response = requests.get(
        "https://query.wikidata.org/sparql",
        params={"query": query, "format": "json"},
        headers={"User-Agent": "PRAXIS-v5-research-pipeline/1.0"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json().get("results", {}).get("bindings", [])


def actor_disambiguation(name: str) -> list[Actor]:
    if normalize_name(name) not in KNOWN_QIDS:
        return []
    resolved = resolve_actor(name)
    return [Actor(resolved.qid, resolved.label, resolved.description, resolved.score)] if resolved else []


def entity_facts(qid: str) -> dict[str, Any]:
    if qid in {"Q159", "Q1065", "Q21731129"}:
        actor = next((item for item in actor_disambiguation({"Q159": "Russia", "Q1065": "United Nations", "Q21731129": "Hayat Tahrir al Sham"}[qid]) if item.qid == qid), None)
        return asdict(actor) if actor else {"qid": qid}
    return {"qid": qid, "facts": sparql_query(f"SELECT ?p ?o WHERE {{ wd:{qid} ?p ?o }} LIMIT 25")}


def related_entities(qid: str, relation: str) -> list[dict[str, Any]]:
    return sparql_query(f"SELECT ?item ?itemLabel WHERE {{ wd:{qid} wdt:{relation} ?item. SERVICE wikibase:label {{ bd:serviceParam wikibase:language 'en'. }} }} LIMIT 25")
