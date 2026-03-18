from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from typing import Optional

from models.paper import Paper, ExportRequest
from services.dblp import search_dblp
from services.bibtex import papers_to_bibtex
from services.venues import ALL_VENUE_KEYS, VENUES, SECURITY_VENUES, ML_VENUES

router = APIRouter(prefix="/api", tags=["papers"])


@router.get("/venues")
async def get_venues():
    return {
        "venues": [
            {
                "key": k,
                "short": v["short"],
                "full": v["full"],
                "group": v["group"],
            }
            for k, v in VENUES.items()
        ],
        "presets": {
            "security": SECURITY_VENUES,
            "ml": ML_VENUES,
            "all": ALL_VENUE_KEYS,
        },
    }


@router.get("/search", response_model=list[Paper])
async def search_papers(
        q: str = Query(..., min_length=2, description="Search query"),
        venues: Optional[str] = Query(
            None,
            description="Comma-separated venue keys to filter by. Omit for all supported venues.",
        ),
        year_from: Optional[int] = Query(None, ge=1990, le=2100),
        year_to: Optional[int] = Query(None, ge=1990, le=2100),
        include_others: bool = Query(
            False,
            description="If true, return all DBLP results. Top-8 papers are badged; others shown greyed out.",
        ),
):
    if year_from and year_to and year_from > year_to:
        raise HTTPException(status_code=400, detail="year_from must be <= year_to")

    if venues:
        venue_keys = [v.strip() for v in venues.split(",") if v.strip() in ALL_VENUE_KEYS]
        if not venue_keys:
            raise HTTPException(status_code=400, detail="No valid venue keys provided")
    else:
        venue_keys = ALL_VENUE_KEYS

    try:
        papers = await search_dblp(
            query=q,
            venue_keys=venue_keys,
            year_from=year_from,
            year_to=year_to,
            include_others=include_others,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DBLP request failed: {str(e)}")

    return papers


@router.post("/export/bibtex", response_class=PlainTextResponse)
async def export_bibtex(payload: ExportRequest):
    if not payload.papers:
        raise HTTPException(status_code=400, detail="No papers provided for export")

    bib_content = papers_to_bibtex(payload.papers)

    return PlainTextResponse(
        content=bib_content,
        media_type="text/plain",
        headers={"Content-Disposition": 'attachment; filename="papers.bib"'},
    )