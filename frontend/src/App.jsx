import { useState, useEffect, useCallback, useRef } from 'react'
import SearchBar from './components/SearchBar'
import FilterPanel from './components/FilterPanel'
import PaperList from './components/PaperList'
import LibraryPage from './components/LibraryPage'
import GraphTab from './components/GraphTab'
import RAGTab from './components/RAGTab'
import {
  fetchVenues, searchPapers, exportBibtex, downloadBibtex,
  fetchLibrary, addToLibrary,
} from './services/api'

const TABS = ['Search', 'Graph', 'Library', 'Q&A']

export default function App() {
  const [activeTab, setActiveTab] = useState('Search')
  const graphTabRef = useRef(null)

  // Venues
  const [venues, setVenues] = useState([])
  const [selectedVenues, setSelectedVenues] = useState([])
  const [includeOthers, setIncludeOthers] = useState(false)

  // Search
  const [query, setQuery] = useState('')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Selection
  const [selected, setSelected] = useState(new Set())

  // Library
  const [libraryPapers, setLibraryPapers] = useState([])
  const [libraryKeys, setLibraryKeys] = useState(new Set())
  const [libraryMsg, setLibraryMsg] = useState(null)

  // Graph
  const [graphRootPaper, setGraphRootPaper] = useState(null)

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchVenues().then(data => {
      setVenues(data.venues)
      setSelectedVenues(data.presets.all)
    }).catch(() => setError('Could not load venues — is the backend running?'))
  }, [])

  const refreshLibrary = useCallback(() => {
    fetchLibrary().then(data => {
      setLibraryPapers(data)
      setLibraryKeys(new Set(data.map(p => p.dblp_key)))
    })
  }, [])

  useEffect(() => { refreshLibrary() }, [refreshLibrary])

  // ── Venue handlers ──────────────────────────────────────────────────────────
  function handleToggleVenue(key) {
    setSelectedVenues(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function handlePreset(preset) {
    const secKeys = venues.filter(v => v.group === 'security').map(v => v.key)
    const mlKeys  = venues.filter(v => v.group === 'ml').map(v => v.key)
    if (preset === 'all')      setSelectedVenues(venues.map(v => v.key))
    if (preset === 'security') setSelectedVenues(secKeys)
    if (preset === 'ml')       setSelectedVenues(mlKeys)
    if (preset === 'none')     setSelectedVenues([])
  }

  // ── Search ──────────────────────────────────────────────────────────────────
  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSelected(new Set())
    try {
      const results = await searchPapers({
        query, venues: selectedVenues,
        yearFrom: yearFrom || undefined,
        yearTo: yearTo || undefined,
        includeOthers,
      })
      setPapers(results)
      setHasSearched(true)
    } catch {
      setError('Search failed. Make sure the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  // ── Selection ───────────────────────────────────────────────────────────────
  function handleTogglePaper(paper) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(paper.dblp_key) ? next.delete(paper.dblp_key) : next.add(paper.dblp_key)
      return next
    })
  }

  // ── Library ─────────────────────────────────────────────────────────────────
  function showLibraryMsg(type, text) {
    setLibraryMsg({ type, text })
    setTimeout(() => setLibraryMsg(null), 3500)
  }

  async function handleAddToLibrary(paper) {
    const result = await addToLibrary([paper])
    if (result.duplicates > 0) {
      showLibraryMsg('warn', `"${paper.title.slice(0, 60)}…" is already in your library.`)
    } else {
      showLibraryMsg('success', 'Paper added to library.')
      refreshLibrary()
    }
  }

  async function handleAddSelectedToLibrary() {
    const toAdd = papers.filter(p => selected.has(p.dblp_key))
    const result = await addToLibrary(toAdd)
    const msgs = []
    if (result.added > 0)      msgs.push(`${result.added} paper${result.added !== 1 ? 's' : ''} added`)
    if (result.duplicates > 0) msgs.push(`${result.duplicates} already in library`)
    showLibraryMsg(result.duplicates > 0 ? 'warn' : 'success', msgs.join(', ') + '.')
    refreshLibrary()
  }

  // ── Graph ───────────────────────────────────────────────────────────────────
  function handleExploreGraph(paper) {
    setGraphRootPaper(paper)
    setActiveTab('Graph')
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  async function handleExportSelected() {
    const toExport = papers.filter(p => selected.has(p.dblp_key))
    const bib = await exportBibtex(toExport)
    downloadBibtex(bib, 'selected-papers.bib')
  }

  async function handleExportAll() {
    const bib = await exportBibtex(papers)
    downloadBibtex(bib, 'all-papers.bib')
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">Paper Finder</h1>
              <p className="text-xs text-slate-400 mt-0.5">Search top security & ML venues via DBLP</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 ml-4">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors
                  ${activeTab === tab
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {tab}
                {tab === 'Library' && libraryPapers.length > 0 && (
                  <span className="ml-1.5 text-xs bg-indigo-600 text-white rounded-full px-1.5 py-0.5">
                    {libraryPapers.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Toast */}
      {libraryMsg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
          ${libraryMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
          {libraryMsg.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Library Tab ── */}
        {activeTab === 'Library' && (
          <LibraryPage
            papers={libraryPapers}
            onRemove={() => {}}
            onRefresh={refreshLibrary}
          />
        )}

        {/* ── Graph Tab ── */}
        {activeTab === 'Graph' && (
            <GraphTab
                ref={graphTabRef}
                rootPaper={graphRootPaper}
                onRootPaperChange={setGraphRootPaper}
                onAddToLibrary={handleAddToLibrary}
            />
        )}

        {/* ── Search Tab ── */}
        {activeTab === 'Search' && (
          <div className="flex gap-6">
            <aside className="w-72 flex-shrink-0">
              <FilterPanel
                venues={venues}
                selectedVenues={selectedVenues}
                onToggleVenue={handleToggleVenue}
                onPreset={handlePreset}
                yearFrom={yearFrom}
                yearTo={yearTo}
                onYearFrom={setYearFrom}
                onYearTo={setYearTo}
                includeOthers={includeOthers}
                onToggleIncludeOthers={() => setIncludeOthers(v => !v)}
              />
            </aside>

            <div className="flex-1 min-w-0 space-y-5">
              <SearchBar
                query={query}
                onChange={setQuery}
                onSearch={handleSearch}
                loading={loading}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {loading && (
                <div className="text-center py-16 text-slate-400 text-sm">Searching DBLP…</div>
              )}

              {!loading && hasSearched && papers.length === 0 && (
                <div className="text-center py-16 text-slate-400 text-sm">
                  No papers found. Try different keywords or broaden your venue selection.
                </div>
              )}

              {!loading && (
                <PaperList
                  papers={papers}
                  selected={selected}
                  onToggle={handleTogglePaper}
                  onSelectAll={() => setSelected(new Set(papers.map(p => p.dblp_key)))}
                  onClearAll={() => setSelected(new Set())}
                  onExportSelected={handleExportSelected}
                  onExportAll={handleExportAll}
                  libraryKeys={libraryKeys}
                  onAddToLibrary={handleAddToLibrary}
                  onAddSelectedToLibrary={handleAddSelectedToLibrary}
                  onExploreGraph={handleExploreGraph}
                />
              )}
            </div>
          </div>
        )}
        {activeTab === 'Q&A' && <RAGTab />}

      </main>
    </div>
  )
}