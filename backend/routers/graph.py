from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from services.semantic_scholar import find_paper_id, get_connections

router = APIRouter(prefix="/api/graph", tags=["graph"])


class GraphRequest(BaseModel):
    title: str
    doi: str | None = None


@router.post("/expand")
async def expand_node(payload: GraphRequest):
    """
    Given a paper title (and optionally DOI), find it on Semantic Scholar
    and return its references and citations for graph expansion.
    """
    ss_id = await find_paper_id(title=payload.title, doi=payload.doi)

    if not ss_id:
        raise HTTPException(
            status_code=404,
            detail="Paper not found on Semantic Scholar. Try a different paper."
        )

    connections = await get_connections(ss_id)
    return {
        "ss_id": ss_id,
        **connections,
    }
