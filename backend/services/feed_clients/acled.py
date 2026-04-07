"""ACLED API client — queries conflict events for a country."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx

ACLED_API = "https://api.acleddata.com/acled/read"

# Escalation impact estimates by ACLED event type
_IMPACT_BY_TYPE: dict[str, float] = {
    "Battles": 0.8,
    "Explosions/Remote violence": 0.7,
    "Violence against civilians": 0.9,
    "Protests": 0.1,
    "Riots": 0.3,
    "Strategic developments": 0.2,
}


async def query_acled(
    country: str,
    days_back: int = 30,
    api_key: str = "",
) -> list[dict]:
    """Query ACLED API for conflict events in a country.

    Returns list of dicts in ACO Event format.
    """
    date_from = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime("%Y-%m-%d")
    params = {
        "key": api_key or "DEMO",
        "email": "praxis@tacitus.me",
        "country": country,
        "event_date": date_from,
        "event_date_where": ">=",
        "limit": 500,
        "fields": "event_id_cnty|event_date|event_type|actor1|actor2|location|fatalities|notes|data_id",
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(ACLED_API, params=params)
            resp.raise_for_status()
            data = resp.json()
            events = data.get("data", [])
            return [
                {
                    "id": f"acled_{e.get('data_id', e.get('event_id_cnty', ''))}",
                    "label": f"{e.get('event_type', 'Event')} — {e.get('location', '')} ({e.get('event_date', '')})",
                    "primitive_type": "Event",
                    "event_type": _map_event_type(e.get("event_type", "")),
                    "date": e.get("event_date", ""),
                    "location": e.get("location", ""),
                    "casualties": int(e.get("fatalities", 0) or 0),
                    "escalation_impact": _IMPACT_BY_TYPE.get(e.get("event_type", ""), 0.3),
                    "metadata": {
                        "actor1": e.get("actor1", ""),
                        "actor2": e.get("actor2", ""),
                        "notes": e.get("notes", "")[:500],
                        "source": "acled",
                    },
                }
                for e in events
            ]
    except Exception:
        return []


def _map_event_type(acled_type: str) -> str:
    """Map ACLED event type to ACO event_type vocabulary."""
    mapping = {
        "Battles": "military",
        "Explosions/Remote violence": "military",
        "Violence against civilians": "humanitarian",
        "Protests": "protest",
        "Riots": "protest",
        "Strategic developments": "political",
    }
    return mapping.get(acled_type, "political")
