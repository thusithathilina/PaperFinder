# 📄 Paper Finder

A research paper search and Q&A tool. Search top security and ML conference papers via DBLP, build a personal library, and ask questions over your papers using a local LLM.

![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React-blue)
![Docker](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- 🔍 Search DBLP by keyword
- 🔒 Filter to **Top Security 4** — NDSS, S&P, USENIX Security, CCS
- 🧠 Filter to **Top ML 4** — NeurIPS, ICML, ICLR, AAAI
- 🌐 Optionally show all other venues
- 📅 Filter by year range
- 📥 Export selected papers as BibTeX (`.bib`)
- 📚 Personal library with SQLite persistence
- 🔗 Citation graph explorer (references + citations via Semantic Scholar)
- 📄 Fetch open-access PDFs automatically (ArXiv + Semantic Scholar)
- 📎 Upload local PDFs
- 🤖 Ask questions over your papers using Llama 3 (fully local RAG)

---

## 🚀 Quick Start (Docker)

> **First run downloads the Llama 3 model (~4.7GB). Subsequent runs are instant.**

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/thusithathilina/PaperFinder.git
cd PaperFinder
docker compose up --build
```

- **App**: http://localhost
- **API docs**: http://localhost:8000/docs

On first run the `ollama-init` container will pull Llama 3 automatically. You'll see:
```
Llama 3 model ready
```
in the logs when it's done. The model is stored in a named Docker volume and persists across rebuilds.

---

## 🛠️ Local Development

### Prerequisites
- Python 3.12+
- Node.js 22.12+
- [Ollama](https://ollama.com) installed

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ollama (separate terminal)

```bash
ollama serve
ollama pull llama3   # first time only
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| API | http://localhost:8000 |
| Docs | http://localhost:8000/docs |
| Ollama | http://localhost:11434 |

---

## 🏗️ Architecture

```
Browser
  └── Nginx :80
        ├── /api/*  →  FastAPI backend :8000
        └── /*      →  React static files

FastAPI backend
  ├── DBLP API          — paper search
  ├── Semantic Scholar  — citation graph + PDF URLs
  ├── SQLite            — library persistence (data/library.db)
  ├── ChromaDB          — vector store (data/chroma/)
  └── Ollama            — local LLM (llama3)

data/
  ├── library.db        — SQLite database
  ├── pdfs/             — downloaded/uploaded PDFs
  └── chroma/           — ChromaDB vector store
```

### Project Structure

```
PaperFinder/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   │   └── library.py
│   ├── routers/
│   │   ├── papers.py       # DBLP search + BibTeX export
│   │   ├── library.py      # library CRUD
│   │   ├── graph.py        # citation graph
│   │   ├── pdf.py          # PDF fetch/upload/view
│   │   └── rag.py          # RAG ingest + query
│   ├── services/
│   │   ├── dblp.py
│   │   ├── venues.py
│   │   ├── bibtex.py
│   │   ├── semantic_scholar.py
│   │   ├── pdf_fetcher.py
│   │   ├── pdf_parser.py
│   │   ├── vector_store.py
│   │   └── rag.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── FilterPanel.jsx
│   │   │   ├── PaperList.jsx
│   │   │   ├── PaperCard.jsx
│   │   │   ├── LibraryPage.jsx
│   │   │   ├── CitationGraph.jsx
│   │   │   ├── GraphTab.jsx
│   │   │   └── RAGTab.jsx
│   │   └── services/
│   │       └── api.js
│   ├── nginx.conf
│   └── Dockerfile
├── data/               # persisted data (gitignored)
│   ├── library.db
│   ├── pdfs/
│   └── chroma/
├── docker-compose.yml
└── README.md
```

---

## 🤖 RAG Pipeline

1. Add papers to your library via search
2. Click **🔍 Fetch PDF** — auto-fetches open-access PDF (ArXiv, Semantic Scholar)
3. Or **📎 Upload PDF** for paywalled papers
4. PDF is automatically parsed, chunked, and embedded into ChromaDB
5. Switch to **Q&A tab** and ask questions — Llama 3 answers using retrieved context

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/venues` | List supported venues |
| `GET` | `/api/search?q=...` | Search papers |
| `POST` | `/api/export/bibtex` | Export BibTeX |
| `GET` | `/api/library` | Get library |
| `POST` | `/api/library` | Add to library |
| `DELETE` | `/api/library/{key}` | Remove from library |
| `POST` | `/api/pdf/fetch/{key}` | Fetch PDF from open access |
| `POST` | `/api/pdf/upload/{key}` | Upload local PDF |
| `GET` | `/api/pdf/view/{key}` | View PDF in browser |
| `POST` | `/api/graph/expand` | Get citation graph connections |
| `GET` | `/api/rag/status` | RAG ingestion status |
| `POST` | `/api/rag/query` | Ask a question |

---

## 🏛️ Supported Venues

| Group | Venue | DBLP Key |
|-------|-------|----------|
| Security | NDSS | `conf/ndss` |
| Security | IEEE S&P | `conf/sp` |
| Security | USENIX Security | `conf/uss` |
| Security | CCS | `conf/ccs` |
| ML | NeurIPS | `conf/nips` |
| ML | ICML | `conf/icml` |
| ML | ICLR | `conf/iclr` |
| ML | AAAI | `conf/aaai` |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, httpx |
| Database | SQLite via SQLModel |
| Vector store | ChromaDB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Llama 3 via Ollama (local) |
| PDF parsing | PyMuPDF |
| Frontend | React, Vite, Tailwind CSS |
| Serving | Nginx (reverse proxy + static files) |
| Containerisation | Docker, Docker Compose |
| Data sources | DBLP API, Semantic Scholar API |

---

## ⚙️ Configuration

Copy `.env.example` to `.env` to customise:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `data/library.db` | Custom SQLite path |
| `DATA_DIR` | `data` | Root data directory |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |

---

## 📝 Notes

- DBLP's `stream:` venue filter doesn't work via their API — results are post-filtered by venue key
- PDF availability depends on open-access status — ArXiv papers are most reliably fetched
- Llama 3 requires ~8GB RAM; use Mistral 7B for lower memory usage (change `OLLAMA_MODEL` in `rag.py`)
- Citation graph clicks don't work in Brave browser due to a canvas pointer event bug — use Firefox or Chrome

---

## 📄 License

MIT