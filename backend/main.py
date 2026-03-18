from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.papers import router as papers_router


@asynccontextmanager
async def lifespan(app: FastAPI):
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

# ── CORS ──────────────────────────────────────────────────────────────────────
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

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(papers_router)


@app.get("/health")
async def health():
    return {"status": "ok"}