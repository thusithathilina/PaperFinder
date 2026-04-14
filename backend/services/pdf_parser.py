"""
PDF text extraction and chunking using PyMuPDF.

Strategy:
- Extract text page by page
- Clean up hyphenation, headers/footers
- Split into ~500 token chunks with 50 token overlap
"""

import re
import fitz  # PyMuPDF
from pathlib import Path

CHUNK_SIZE = 500      # tokens (approx words)
CHUNK_OVERLAP = 50    # overlap between chunks


def extract_text(pdf_path: str) -> str:
    """Extract full text from a PDF file."""
    doc = fitz.open(pdf_path)
    pages = []
    for page in doc:
        text = page.get_text("text")
        pages.append(text)
    doc.close()
    return "\n\n".join(pages)


def clean_text(text: str) -> str:
    """Clean extracted PDF text."""
    # Fix hyphenated line breaks (e.g. "connec-\ntion" → "connection")
    text = re.sub(r'-\n(\w)', r'\1', text)
    # Collapse multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Split text into overlapping chunks by word count.
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end == len(words):
            break
        start += chunk_size - overlap
    return chunks


def parse_pdf(pdf_path: str, metadata: dict) -> list[dict]:
    """
    Full pipeline: extract → clean → chunk → attach metadata.
    Returns list of chunk dicts ready for embedding.
    """
    raw = extract_text(pdf_path)
    cleaned = clean_text(raw)
    chunks = chunk_text(cleaned)

    return [
        {
            "text": chunk,
            "chunk_index": i,
            "total_chunks": len(chunks),
            **metadata,
        }
        for i, chunk in enumerate(chunks)
    ]