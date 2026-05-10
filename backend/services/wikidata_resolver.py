"""Wikidata resolver for canonical actor IDs.

Runtime use should cache results in Firestore. Local tests use deterministic
fixture hits and do not call the network.
"""
from __future__ import annotations

import re
import time
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class WikidataQID:
    qid: str
    label: str
    description: str = ""
    score: float = 1.0


class Cache(Protocol):
    def get(self, normalized_name: str) -> WikidataQID | None: ...
    def set(self, normalized_name: str, value: WikidataQID) -> None: ...


KNOWN_QIDS = {
    "russia": WikidataQID("Q159", "Russia", "country in Eastern Europe and North Asia", 1.0),
    "united nations": WikidataQID("Q1065", "United Nations", "intergovernmental organization", 1.0),
    "hayat tahrir al sham": WikidataQID("Q21731129", "Hay'at Tahrir al-Sham", "Syrian Islamist militant group", 1.0),
}

_last_query_at = 0.0


def resolve_actor(name: str, type_hint: str | None = None, cache: Cache | None = None) -> WikidataQID | None:
    normalized = normalize_name(name)
    if not normalized:
        return None
    if cache:
        cached = cache.get(normalized)
        if cached:
            return cached
    result = KNOWN_QIDS.get(normalized)
    if result is None:
        result = _query_wikidata(normalized, type_hint)
    if result and cache:
        cache.set(normalized, result)
    return result


def normalize_name(name: str) -> str:
    value = name.replace("ʼ", "").replace("'", "")
    value = re.sub(r"[^a-zA-Z0-9]+", " ", value).strip().lower()
    return re.sub(r"\s+", " ", value)


def _query_wikidata(normalized_name: str, type_hint: str | None) -> WikidataQID | None:
    global _last_query_at
    try:
        import requests
    except Exception:
        return None
    elapsed = time.monotonic() - _last_query_at
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_query_at = time.monotonic()
    query = """
    SELECT ?item ?itemLabel ?itemDescription WHERE {
      ?item rdfs:label ?itemLabel.
      FILTER(LANG(?itemLabel) = "en")
      FILTER(CONTAINS(LCASE(?itemLabel), "%s"))
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 5
    """ % normalized_name.replace('"', '\\"')
    response = requests.get(
        "https://query.wikidata.org/sparql",
        params={"query": query, "format": "json"},
        headers={"User-Agent": "PRAXIS-v5-document-pipeline/1.0"},
        timeout=10,
    )
    response.raise_for_status()
    bindings = response.json().get("results", {}).get("bindings", [])
    if not bindings:
        return None
    best = bindings[0]
    qid = str(best["item"]["value"]).rsplit("/", 1)[-1]
    label = str(best.get("itemLabel", {}).get("value", normalized_name))
    description = str(best.get("itemDescription", {}).get("value", type_hint or ""))
    return WikidataQID(qid=qid, label=label, description=description, score=0.74)
