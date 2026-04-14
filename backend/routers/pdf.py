import json
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from database import get_session
from models.library import LibraryPaper
from services.pdf_fetcher import fetch_and_save, get_pdf_path
from services.rag import ingest_paper

router = APIRouter(prefix="/api/pdf", tags=["pdf"])


async def _ingest_if_available(paper: LibraryPaper):
    """Auto-ingest into RAG after PDF is saved."""
    pdf_path = get_pdf_path(paper.dblp_key)
    if not pdf_path.exists():
        return
    metadata = {
        "dblp_key": paper.dblp_key,
        "title": paper.title,
        "authors": json.loads(paper.authors),
        "year": paper.year,
        "venue": paper.venue,
    }
    result = await ingest_paper(str(pdf_path), metadata)
    print(f"Auto-ingested {paper.dblp_key}: {result}")


@router.get("/status/{dblp_key:path}")
def get_pdf_status(dblp_key: str, session: Session = Depends(get_session)):
    paper = session.exec(
        select(LibraryPaper).where(LibraryPaper.dblp_key == dblp_key)
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in library")
    return {"dblp_key": dblp_key, "pdf_status": paper.pdf_status}


@router.get("/view/{dblp_key:path}")
def view_pdf(dblp_key: str, session: Session = Depends(get_session)):
    """Serve the PDF file for inline viewing in the browser."""
    paper = session.exec(
        select(LibraryPaper).where(LibraryPaper.dblp_key == dblp_key)
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in library")
    if paper.pdf_status not in ("available", "uploaded"):
        raise HTTPException(status_code=404, detail="No PDF available")

    path = get_pdf_path(dblp_key)
    if not path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={path.name}"}
    )


@router.post("/fetch/{dblp_key:path}")
async def fetch_pdf(dblp_key: str, session: Session = Depends(get_session)):
    paper = session.exec(
        select(LibraryPaper).where(LibraryPaper.dblp_key == dblp_key)
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in library")

    if paper.pdf_status in ("available", "uploaded"):
        return {"dblp_key": dblp_key, "pdf_status": paper.pdf_status}

    paper.pdf_status = "fetching"
    session.add(paper)
    session.commit()

    try:
        result = await fetch_and_save(
            title=paper.title,
            dblp_key=dblp_key,
            doi=paper.doi,
        )
        paper.pdf_status = result["status"]
        paper.pdf_path = result.get("path")
    except Exception as e:
        paper.pdf_status = "not_found"
        print(f"PDF fetch error: {e}")

    session.add(paper)
    session.commit()

    # Auto-ingest into RAG if PDF was obtained
    if paper.pdf_status in ("available", "uploaded"):
        await _ingest_if_available(paper)

    return {"dblp_key": dblp_key, "pdf_status": paper.pdf_status}


@router.post("/upload/{dblp_key:path}")
async def upload_pdf(
        dblp_key: str,
        file: UploadFile = File(...),
        session: Session = Depends(get_session),
):
    paper = session.exec(
        select(LibraryPaper).where(LibraryPaper.dblp_key == dblp_key)
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not in library")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    path = get_pdf_path(dblp_key)
    contents = await file.read()
    async with aiofiles.open(path, "wb") as f:
        await f.write(contents)

    paper.pdf_status = "uploaded"
    paper.pdf_path = str(path)
    session.add(paper)
    session.commit()

    # Auto-ingest into RAG
    await _ingest_if_available(paper)

    return {"dblp_key": dblp_key, "pdf_status": "uploaded", "filename": file.filename}