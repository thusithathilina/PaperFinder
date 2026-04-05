import CitationGraph from './CitationGraph'

export default function GraphTab({ rootPaper, onRootPaperChange, onAddToLibrary }) {
  if (!rootPaper) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm font-medium">No paper selected</p>
        <p className="text-xs text-center max-w-xs">
          Go to the <span className="font-semibold text-slate-500">Search</span> tab, find a paper,
          and click <span className="font-semibold text-slate-500">⬡ Graph</span> to visualise its citation network.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Citation Graph</h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl truncate">Root: {rootPaper.title}</p>
        </div>
        <button
          onClick={() => onRootPaperChange(null)}
          className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          ← Change paper
        </button>
      </div>
      <CitationGraph rootPaper={rootPaper} onAddToLibrary={onAddToLibrary} />
    </div>
  )
}
