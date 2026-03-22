from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class LibraryPaper(SQLModel, table=True):
    """Represents a paper saved to the user's library."""
    id: Optional[int] = Field(default=None, primary_key=True)
    dblp_key: str = Field(index=True, unique=True)
    title: str
    authors: str           # JSON-encoded list
    year: int
    venue: str
    venue_key: str
    venue_group: Optional[str] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)


class LibraryAddRequest(SQLModel):
    """Request body for adding one or more papers to the library."""
    papers: list[dict]
