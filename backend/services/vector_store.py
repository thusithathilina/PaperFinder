"""
ChromaDB vector store service.

Stores paper chunks with embeddings for semantic search.
Uses persistent storage in data/chroma/.
"""

import os
from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions

# Storage location — same data/ volume as SQLite and PDFs
CHROMA_DIR = str(Path(os.getenv("DATA_DIR", "data")) / "chroma")

# Embedding model — fast, good quality, runs locally
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

_client = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection

    Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)

    _client = chromadb.PersistentClient(path=CHROMA_DIR)

    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=EMBEDDING_MODEL
    )

    _collection = _client.get_or_create_collection(
        name="papers",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def ingest_chunks(chunks: list[dict]) -> int:
    """
    Add chunks to the vector store.
    Returns number of chunks added.
    """
    collection = get_collection()

    # Remove existing chunks for this paper first (re-ingest)
    if chunks:
        dblp_key = chunks[0].get("dblp_key", "")
        try:
            existing = collection.get(where={"dblp_key": dblp_key})
            if existing["ids"]:
                collection.delete(ids=existing["ids"])
        except Exception:
            pass

    ids = [f"{c['dblp_key']}__chunk_{c['chunk_index']}" for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas = [
        {
            "dblp_key": c.get("dblp_key", ""),
            "title": c.get("title", ""),
            "authors": ", ".join(c.get("authors", [])) if isinstance(c.get("authors"), list) else c.get("authors", ""),
            "year": str(c.get("year", "")),
            "venue": c.get("venue", ""),
            "chunk_index": c.get("chunk_index", 0),
            "total_chunks": c.get("total_chunks", 1),
        }
        for c in chunks
    ]

    collection.add(ids=ids, documents=documents, metadatas=metadatas)
    return len(chunks)


def query(question: str, n_results: int = 5) -> list[dict]:
    """
    Semantic search — returns top n_results chunks matching the question.
    """
    collection = get_collection()

    if collection.count() == 0:
        return []

    results = collection.query(
        query_texts=[question],
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
    ):
        chunks.append({
            "text": doc,
            "metadata": meta,
            "score": round(1 - dist, 3),  # cosine similarity
        })

    return chunks


def get_ingested_keys() -> list[str]:
    """Return list of dblp_keys that have been ingested."""
    collection = get_collection()
    if collection.count() == 0:
        return []
    results = collection.get(include=["metadatas"])
    keys = list({m["dblp_key"] for m in results["metadatas"]})
    return keys


def delete_paper(dblp_key: str) -> int:
    """Remove all chunks for a paper from the vector store."""
    collection = get_collection()
    existing = collection.get(where={"dblp_key": dblp_key})
    if existing["ids"]:
        collection.delete(ids=existing["ids"])
        return len(existing["ids"])
    return 0