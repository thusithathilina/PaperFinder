"""
DBLP search service.

Note: DBLP's stream: venue filter only works in their web UI, not the API.
We fetch a broad result set and post-filter by venue key ourselves.
"""

import httpx
from urllib.parse import quote
from models.paper import Paper
from services.venues import ALL_VENUE_KEYS, get_venue_group, get_short_name

DBLP_SEARCH_URL = "https://dblp.org/search/publ/api"
MAX_RESULTS = 1000
TIMEOUT = 15.0


def _resolve_venue_key(dblp_key: str) -> str | None:
    for vk in ALL_VENUE_KEYS:
        if dblp_key.startswith(vk + "/"):
            return vk
    return None


def _parse_hit(hit: dict) -> "Paper | None":
    info = hit.get("info", {})
    title = info.get("title", "").rstrip(".")
    year_raw = info.get("year")
    dblp_key = info.get("key", "")
    url = info.get("url")
    doi = info.get("doi")

    if not title or not year_raw or not dblp_key:
        return None

    authors_raw = info.get("authors", {}).get("author", [])
    if isinstance(authors_raw, dict):
        authors_raw = [authors_raw]
    authors = [a.get("text", "") for a in authors_raw if a.get("text")]

    venue_key = _resolve_venue_key(dblp_key)
    venue_raw = info.get("venue", "Unknown")
    if isinstance(venue_raw, list):
        venue_raw = venue_raw[0] if venue_raw else "Unknown"
    venue_display = get_short_name(venue_key) if venue_key else venue_raw

    return Paper(
        dblp_key=dblp_key,
        title=title,
        authors=authors,
        year=int(year_raw),
        venue=venue_display,
        venue_key=venue_key or "",
        venue_group=get_venue_group(venue_key) if venue_key else None,
        url=url,
        doi=doi,
    )


async def search_dblp(
        query: str,
        venue_keys: list[str],
        year_from: int | None = None,
        year_to: int | None = None,
        include_others: bool = False,
) -> list[Paper]:
    """
    Search DBLP and return papers.

    If include_others=True, return ALL papers from DBLP regardless of venue.
    Top-8 papers will have venue_group set; others will have venue_group=None.
    venue_keys is still used to determine which venues are "top" for badging.

    If include_others=False, only return papers whose venue_key is in venue_keys.
    """
    url = f"{DBLP_SEARCH_URL}?q={quote(query)}&format=json&h={MAX_RESULTS}&f=0"
    print("DBLP URL:", url)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()

    hits = data.get("result", {}).get("hits", {}).get("hit", [])
    print(f"DBLP returned {len(hits)} raw hits")

    venue_set = set(venue_keys)
    papers: list[Paper] = []

    for hit in hits:
        paper = _parse_hit(hit)
        if paper is None:
            continue
        # If not including others, skip papers outside selected venues
        if not include_others and venue_set and paper.venue_key not in venue_set:
            continue
        # Year filter
        if year_from and paper.year < year_from:
            continue
        if year_to and paper.year > year_to:
            continue
        papers.append(paper)

    print(f"After filtering: {len(papers)} papers")
    return papers