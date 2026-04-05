"""
Semantic Scholar API service.
Docs: https://api.semanticscholar.org/api-docs/

Used for fetching references and citations for the citation graph.
No API key required for basic usage (rate limit: 100 req/5min).
"""

import httpx

SS_BASE = "https://api.semanticscholar.org/graph/v1"
TIMEOUT = 15.0
MAX_CONNECTIONS = 50  # max references + citations per node

FIELDS = "paperId,title,year,venue,authors,externalIds,referenceCount,citationCount"


async def find_paper_id(title: str, doi: str | None = None) -> str | None:
    """
    Resolve a Semantic Scholar paperId from a DOI or title search.
    Returns None if not found.
    """
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # Try DOI first — most reliable
        if doi:
            res = await client.get(
                f"{SS_BASE}/paper/DOI:{doi}",
                params={"fields": "paperId"}
            )
            if res.status_code == 200:
                return res.json().get("paperId")

        # Fall back to title search
        res = await client.get(
            f"{SS_BASE}/paper/search",
            params={"query": title, "fields": "paperId,title", "limit": 1}
        )
        if res.status_code == 200:
            data = res.json().get("data", [])
            if data:
                return data[0].get("paperId")

    return None


def _format_paper(raw: dict) -> dict | None:
    """Convert a Semantic Scholar paper dict to our graph node format."""
    paper_id = raw.get("paperId")
    title = raw.get("title", "")
    if not paper_id or not title:
        return None

    authors_raw = raw.get("authors", [])
    authors = [a.get("name", "") for a in authors_raw]

    external = raw.get("externalIds", {}) or {}
    doi = external.get("DOI")

    venue = raw.get("venue", "") or ""
    year = raw.get("year")

    return {
        "ss_id": paper_id,
        "title": title,
        "authors": authors,
        "year": year,
        "venue": venue,
        "doi": doi,
        "reference_count": raw.get("referenceCount", 0),
        "citation_count": raw.get("citationCount", 0),
    }


async def get_connections(ss_id: str) -> dict:
    """
    Fetch references and citations for a given Semantic Scholar paper ID.
    Returns { references: [...], citations: [...] }
    """
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # Fetch references (papers this paper cites)
        ref_res = await client.get(
            f"{SS_BASE}/paper/{ss_id}/references",
            params={"fields": FIELDS, "limit": MAX_CONNECTIONS}
        )

        # Fetch citations (papers that cite this paper)
        cit_res = await client.get(
            f"{SS_BASE}/paper/{ss_id}/citations",
            params={"fields": FIELDS, "limit": MAX_CONNECTIONS}
        )

    references, citations = [], []

    if ref_res.status_code == 200:
        for item in ref_res.json().get("data", []):
            paper = _format_paper(item.get("citedPaper", {}))
            if paper:
                references.append(paper)

    if cit_res.status_code == 200:
        for item in cit_res.json().get("data", []):
            paper = _format_paper(item.get("citingPaper", {}))
            if paper:
                citations.append(paper)

    return {"references": references, "citations": citations}
