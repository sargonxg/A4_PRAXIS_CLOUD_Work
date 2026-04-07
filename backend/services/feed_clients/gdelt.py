"""GDELT DOC API client — queries for news articles by keyword."""
from __future__ import annotations

import httpx

GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"


async def query_gdelt(
    keywords: list[str],
    days_back: int = 7,
) -> list[dict]:
    """Query GDELT DOC API for articles matching keywords.

    Returns list of {url, title, source, tone, date} dicts.
    """
    query = " ".join(keywords)
    params = {
        "query": query,
        "mode": "artlist",
        "maxrecords": 50,
        "timespan": f"{days_back}d",
        "format": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(GDELT_DOC_API, params=params)
            resp.raise_for_status()
            data = resp.json()
            articles = data.get("articles", [])
            return [
                {
                    "url": a.get("url", ""),
                    "title": a.get("title", ""),
                    "source": a.get("domain", ""),
                    "tone": a.get("tone", 0),
                    "date": a.get("seendate", ""),
                }
                for a in articles
            ]
    except Exception:
        return []
