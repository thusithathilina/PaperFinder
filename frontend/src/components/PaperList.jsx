import PaperCard from './PaperCard'

export default function PaperList({
  papers, selected, onToggle, onSelectAll, onClearAll,
  onExportSelected, onExportAll,
  libraryKeys, onAddToLibrary, onAddSelectedToLibrary,
  onExploreGraph,
}) {
  const allSelected = papers.length > 0 && papers.every(p => selected.has(p.dblp_key))
  const noneSelected = selected.size === 0

  if (papers.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 font-medium">
            {papers.length} result{papers.length !== 1 ? 's' : ''}
            {selected.size > 0 && (
              <span className="ml-1.5 text-indigo-600 font-semibold">
                · {selected.size} selected
              </span>
            )}
          </span>
          <button
            onClick={allSelected ? onClearAll : onSelectAll}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onAddSelectedToLibrary}
            disabled={noneSelected}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 text-emerald-600
                       hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + Add selected to Library
          </button>
          <button
            onClick={onExportSelected}
            disabled={noneSelected}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-300 text-indigo-600
                       hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export selected .bib
          </button>
          <button
            onClick={onExportAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700
                       text-white transition-colors shadow-sm"
          >
            Export all .bib
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {papers.map(paper => (
          <PaperCard
            key={paper.dblp_key}
            paper={paper}
            selected={selected.has(paper.dblp_key)}
            onToggle={() => onToggle(paper)}
            inLibrary={libraryKeys.has(paper.dblp_key)}
            onAddToLibrary={onAddToLibrary}
            onExploreGraph={onExploreGraph}
          />
        ))}
      </div>
    </div>
  )
}
