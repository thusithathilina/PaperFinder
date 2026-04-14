"""
RAG orchestration service.

Ties together: PDF parsing → vector store ingestion → LLM querying.
"""

import ollama
from services.pdf_parser import parse_pdf
from services.vector_store import ingest_chunks, query as vector_query

OLLAMA_MODEL = "llama3"

SYSTEM_PROMPT = """You are a research assistant helping a researcher understand academic papers.
Answer questions based ONLY on the provided context from the papers.
If the answer is not in the context, say so clearly.
Be concise and precise. Cite the paper title when referring to specific findings."""


def build_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for the LLM."""
    parts = []
    seen_papers = set()

    for chunk in chunks:
        meta = chunk["metadata"]
        title = meta.get("title", "Unknown")
        year = meta.get("year", "")
        text = chunk["text"]

        if title not in seen_papers:
            seen_papers.add(title)
            parts.append(f"--- From: {title} ({year}) ---")

        parts.append(text)

    return "\n\n".join(parts)


async def ingest_paper(pdf_path: str, metadata: dict) -> dict:
    """
    Parse a PDF and ingest it into the vector store.
    Returns { chunks_added, status }
    """
    try:
        chunks = parse_pdf(pdf_path, metadata)
        count = ingest_chunks(chunks)
        return {"status": "ingested", "chunks_added": count}
    except Exception as e:
        print(f"Ingest error: {e}")
        return {"status": "error", "error": str(e)}


async def answer_question(question: str, n_chunks: int = 5) -> dict:
    """
    Full RAG pipeline:
    1. Retrieve relevant chunks from vector store
    2. Build context
    3. Ask LLM
    Returns { answer, sources, chunks_used }
    """
    # Retrieve
    chunks = vector_query(question, n_results=n_chunks)
    if not chunks:
        return {
            "answer": "No papers have been ingested yet. Please fetch or upload PDFs for papers in your library first.",
            "sources": [],
            "chunks_used": 0,
        }

    # Build context
    context = build_context(chunks)

    # Query Ollama
    prompt = f"""Context from research papers:

{context}

Question: {question}

Answer based on the context above:"""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ]
        )
        answer = response["message"]["content"]
    except Exception as e:
        return {
            "answer": f"LLM error: {str(e)}. Make sure Ollama is running with `ollama serve` and llama3 is pulled.",
            "sources": [],
            "chunks_used": 0,
        }

    # Deduplicate sources
    sources = []
    seen = set()
    for chunk in chunks:
        meta = chunk["metadata"]
        key = meta.get("dblp_key", "")
        if key not in seen:
            seen.add(key)
            sources.append({
                "title": meta.get("title", ""),
                "year": meta.get("year", ""),
                "venue": meta.get("venue", ""),
                "dblp_key": key,
                "score": chunk["score"],
            })

    return {
        "answer": answer,
        "sources": sources,
        "chunks_used": len(chunks),
    }