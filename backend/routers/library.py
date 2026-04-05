import json
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_session
from models.library import LibraryPaper, LibraryAddRequest

router = APIRouter(prefix="/api/library", tags=["library"])


def _paper_to_db(p: dict) -> LibraryPaper:
    return LibraryPaper(
        dblp_key=p["dblp_key"],
        title=p["title"],
        authors=json.dumps(p.get("authors", [])),
        year=p["year"],
        venue=p["venue"],
        venue_key=p.get("venue_key", ""),
        venue_group=p.get("venue_group"),
        url=p.get("url"),
        doi=p.get("doi"),
    )


def _db_to_dict(p: LibraryPaper) -> dict:
    return {
        "id": p.id,
        "dblp_key": p.dblp_key,
        "title": p.title,
        "authors": json.loads(p.authors),
        "year": p.year,
        "venue": p.venue,
        "venue_key": p.venue_key,
        "venue_group": p.venue_group,
        "url": p.url,
        "doi": p.doi,
        "added_at": p.added_at.isoformat(),
        "pdf_status": p.pdf_status,
        "pdf_path": p.pdf_path,
    }


@router.get("")
def get_library(session: Session = Depends(get_session)):
    """Return all papers in the library, newest first."""
    papers = session.exec(
        select(LibraryPaper).order_by(LibraryPaper.added_at.desc())
    ).all()
    return [_db_to_dict(p) for p in papers]


@router.post("")
def add_to_library(payload: LibraryAddRequest, session: Session = Depends(get_session)):
    """
    Add one or more papers to the library.
    Returns a summary of added vs duplicate papers.
    """
    added = []
    duplicates = []

    for paper_dict in payload.papers:
        dblp_key = paper_dict.get("dblp_key")
        existing = session.exec(
            select(LibraryPaper).where(LibraryPaper.dblp_key == dblp_key)
        ).first()

        if existing:
            duplicates.append(paper_dict.get("title", dblp_key))
        else:
            db_paper = _paper_to_db(paper_dict)
            session.add(db_paper)
            added.append(paper_dict.get("title", dblp_key))

    session.commit()

    return {
        "added": len(added),
        "duplicates": len(duplicates),
        "duplicate_titles": duplicates,
    }


@router.delete("/{dblp_key:path}")
def remove_from_library(dblp_key: str, session: Session = Depends(get_session)):
    """Remove a paper from the library by its DBLP key."""
    paper = session.exec(
        select(LibraryPaper).where(LibraryPaper.dblp_key == dblp_key)
    ).first()

    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found in library")

    session.delete(paper)
    session.commit()
    return {"deleted": dblp_key}
