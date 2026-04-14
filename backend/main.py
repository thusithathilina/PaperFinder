from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers.papers import router as papers_router
from routers.library import router as library_router
from routers.graph import router as graph_router
from routers.pdf import router as pdf_router
from routers.rag import router as rag_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("\n" + "=" * 50)
    print("  Paper Finder backend ready")
    print("  API:    http://localhost:8000")
    print("  Docs:   http://localhost:8000/docs")
    print("=" * 50 + "\n")
    yield


app = FastAPI(
    title="Paper Finder",
    description="Search top security and ML conference papers via DBLP and export BibTeX.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers_router)
app.include_router(library_router)
app.include_router(graph_router)
app.include_router(pdf_router)
app.include_router(rag_router)


@app.get("/health")
async def health():
    return {"status": "ok"}