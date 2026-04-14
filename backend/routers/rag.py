from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models.library import LibraryPaper
from services.rag import ingest_paper, answer_question
from services.vector_store import get_ingested_keys
from services.pdf_fetcher import get_pdf_path
import json

router = APIRouter(prefix="/api/rag", tags=["rag"])


class QueryRequest(BaseModel):
    question: str
    n_chunks: int = 5


@router.get("/status")
def rag_status(session: Session = Depends(get_session)):
    """Return ingestion status — which papers are in the vector store."""
    ingested_keys = get_ingested_keys()
    papers = session.exec(select(LibraryPaper)).all()

    return {
        "total_library": len(papers),
        "total_ingested": len(ingested_keys),
        "ingested_keys": ingested_keys,
    }


@router.post("/ingest/{dblp_key:path}")
async def ingest(dblp_key: str, session: Session = Depends(get_session)):
    """Manually ingest a paper's PDF into the vector store."""
    paper = session.exec(
        select(LibraryPaper).where(LibraryPaper.dblp_key == dblp_key)
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in library")

    if paper.pdf_status not in ("available", "uploaded"):
        raise HTTPException(status_code=400, detail="No PDF available for this paper")

    pdf_path = get_pdf_path(dblp_key)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    metadata = {
        "dblp_key": paper.dblp_key,
        "title": paper.title,
        "authors": json.loads(paper.authors),
        "year": paper.year,
        "venue": paper.venue,
    }

    result = await ingest_paper(str(pdf_path), metadata)
    return {"dblp_key": dblp_key, **result}


@router.post("/query")
async def query_rag(payload: QueryRequest):
    """Ask a question over ingested papers."""
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    result = await answer_question(
        question=payload.question,
        n_chunks=payload.n_chunks,
    )
    return result