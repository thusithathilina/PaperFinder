# 📄 Paper Finder

A research paper search tool that queries [DBLP](https://dblp.org) and filters results to top-tier security and ML venues. Select papers and export them as BibTeX in one click.

![Paper Finder](https://img.shields.io/badge/stack-FastAPI%20%2B%20React-blue)
![Docker](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- 🔍 Search DBLP by keyword with real-time results
- 🔒 Filter to **Top Security 4** — NDSS, S&P, USENIX Security, CCS
- 🧠 Filter to **Top ML 4** — NeurIPS, ICML, ICLR, AAAI
- 🌐 Optionally show all other venues (greyed out for context)
- 📅 Filter by year range
- ☑️ Select individual papers or select all
- 📥 Export selected or all results as `.bib` (BibTeX)

---

## 🚀 Quick Start (Docker)

The easiest way to run the app. Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/thusithathilina/paper-finder.git
cd paper-finder
docker compose up --build
```

Then open **http://localhost** in your browser.

- App: http://localhost
- API docs: http://localhost:8000/docs

---

## 🛠️ Local Development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API will be available at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at **http://localhost:5173**

> Both servers must be running simultaneously for the app to work locally.

---

## 🏗️ Architecture

```
Browser
  └── Nginx :80
        ├── /api/*  →  FastAPI backend :8000
        └── /*      →  React static files
```

### Project Structure

```
paper-finder/
├── backend/
│   ├── main.py                 # FastAPI app + CORS
│   ├── routers/
│   │   └── papers.py           # /api/search, /api/venues, /api/export/bibtex
│   ├── services/
│   │   ├── dblp.py             # DBLP API integration
│   │   ├── bibtex.py           # BibTeX generation
│   │   └── venues.py           # Venue registry (keys, groups, display names)
│   ├── models/
│   │   └── paper.py            # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component + state
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── FilterPanel.jsx
│   │   │   ├── PaperList.jsx
│   │   │   └── PaperCard.jsx
│   │   └── services/
│   │       └── api.js          # Backend API calls
│   ├── nginx.conf              # Nginx config + reverse proxy
│   └── Dockerfile              # Multi-stage: Node build → Nginx serve
└── docker-compose.yml
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/venues` | List all supported venues and presets |
| `GET` | `/api/search?q=...` | Search papers (supports `venues`, `year_from`, `year_to`, `include_others`) |
| `POST` | `/api/export/bibtex` | Export a list of papers as `.bib` |

Full interactive docs available at `/docs` when running.

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
| Frontend | React, Vite, Tailwind CSS |
| Serving | Nginx (reverse proxy + static files) |
| Containerisation | Docker, Docker Compose |
| Data source | [DBLP API](https://dblp.org/faq/How+to+use+the+dblp+search+API.html) |

---

## 📝 Notes

- DBLP's `stream:` venue filter does not work via their public API (only in the web UI). This tool fetches broad results and filters by venue key client-side.
- Results are capped at 1000 per query (DBLP's maximum).
- BibTeX cite keys are generated as `authorYEARword` (e.g. `smith2023adversarial`).

---

## 📄 License

MIT
