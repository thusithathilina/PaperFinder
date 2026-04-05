"""
PDF fetching service.

Strategy:
1. Check Semantic Scholar for openAccessPdf URL
2. If empty, check if paper has an ArXiv ID → fetch from arxiv.org directly
3. Fall back to not_found
"""

import os
import re
import httpx
import aiofiles
from pathlib import Path

SS_BASE = "https://api.semanticscholar.org/graph/v1"
TIMEOUT = 30.0

PDF_DIR = Path(os.getenv("DATA_DIR", "data")) / "pdfs"


def get_pdf_dir() -> Path:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    return PDF_DIR


def sanitise_key(dblp_key: str) -> str:
    return re.sub(r'[^\w\-]', '_', dblp_key)


def get_pdf_path(dblp_key: str) -> Path:
    return get_pdf_dir() / f"{sanitise_key(dblp_key)}.pdf"


def pdf_exists(dblp_key: str) -> bool:
    return get_pdf_path(dblp_key).exists()


def arxiv_pdf_url(arxiv_id: str) -> str:
    """Convert an ArXiv ID to a direct PDF URL."""
    return f"https://arxiv.org/pdf/{arxiv_id}.pdf"


async def fetch_pdf_url(title: str, doi: str | None = None) -> str | None:
    """
    Find an open-access PDF URL for a paper.
    1. Try Semantic Scholar via DOI → check openAccessPdf + ArXiv fallback
    2. Try Semantic Scholar via title search as last resort
    """
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        if doi:
            res = await client.get(
                f"{SS_BASE}/paper/DOI:{doi}",
                params={"fields": "openAccessPdf,externalIds"}
            )
            if res.status_code == 200:
                data = res.json()

                # Check openAccessPdf URL
                pdf = data.get("openAccessPdf") or {}
                if pdf.get("url"):
                    print(f"Found PDF via Semantic Scholar openAccessPdf: {pdf['url']}")
                    return pdf["url"]

                # Fall back to ArXiv if we have an ArXiv ID
                arxiv_id = (data.get("externalIds") or {}).get("ArXiv")
                if arxiv_id:
                    url = arxiv_pdf_url(arxiv_id)
                    print(f"Found ArXiv ID {arxiv_id}, using: {url}")
                    return url

        # Title search fallback (only if no DOI or DOI lookup failed)
        if not doi:
            res = await client.get(
                f"{SS_BASE}/paper/search",
                params={"query": title, "fields": "openAccessPdf,externalIds", "limit": 1}
            )
            if res.status_code == 200:
                results = res.json().get("data", [])
                if results:
                    paper = results[0]
                    pdf = paper.get("openAccessPdf") or {}
                    if pdf.get("url"):
                        return pdf["url"]
                    arxiv_id = (paper.get("externalIds") or {}).get("ArXiv")
                    if arxiv_id:
                        return arxiv_pdf_url(arxiv_id)

    return None


async def download_pdf(url: str, dblp_key: str) -> Path:
    path = get_pdf_path(dblp_key)
    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
        res = await client.get(url)
        res.raise_for_status()
        # Verify it's actually a PDF
        content_type = res.headers.get("content-type", "")
        if "pdf" not in content_type and not res.content[:4] == b'%PDF':
            raise ValueError(f"Response is not a PDF (content-type: {content_type})")
        async with aiofiles.open(path, 'wb') as f:
            await f.write(res.content)
    return path


async def fetch_and_save(title: str, dblp_key: str, doi: str | None = None) -> dict:
    url = await fetch_pdf_url(title=title, doi=doi)
    if not url:
        print(f"No PDF URL found for: {title}")
        return {"status": "not_found", "path": None}

    try:
        path = await download_pdf(url, dblp_key)
        print(f"PDF saved to: {path}")
        return {"status": "available", "path": str(path)}
    except Exception as e:
        print(f"PDF download failed: {e}")
        return {"status": "not_found", "path": None}