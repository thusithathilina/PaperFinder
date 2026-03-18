from pydantic import BaseModel
from typing import Optional


class Paper(BaseModel):
    dblp_key: str
    title: str
    authors: list[str]
    year: int
    venue: str
    venue_key: str          # e.g. "conf/ndss"
    venue_group: Optional[str] = None   # "security" | "ml" | None
    url: Optional[str] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None      # DBLP rarely returns this, reserved


class SearchRequest(BaseModel):
    query: str
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    venues: Optional[list[str]] = None  # list of venue_keys to include; None = all


class ExportRequest(BaseModel):
    papers: list[Paper]
