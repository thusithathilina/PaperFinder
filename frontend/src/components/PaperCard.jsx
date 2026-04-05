const GROUP_COLORS = {
  security: 'bg-rose-100 text-rose-700 border-rose-200',
  ml: 'bg-violet-100 text-violet-700 border-violet-200',
}

export default function PaperCard({ paper, selected, onToggle, inLibrary, onAddToLibrary, onExploreGraph }) {
  const isTopVenue = !!paper.venue_group
  const badgeColor = GROUP_COLORS[paper.venue_group] ?? 'bg-slate-100 text-slate-400 border-slate-200'

  return (
    <div
      onClick={onToggle}
      className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-150
        ${selected
          ? 'bg-white border-indigo-400 ring-2 ring-indigo-100 shadow-md'
          : isTopVenue
            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-80'
        }`}
    >
      {/* Selection indicator */}
      <div className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
        ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-300'}`}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="pr-8">
        <h3 className={`text-sm font-semibold leading-snug mb-2 ${isTopVenue ? 'text-slate-800' : 'text-slate-500'}`}>
          {paper.title}
        </h3>

        <p className="text-xs text-slate-400 mb-2 truncate">
          {paper.authors.slice(0, 5).join(', ')}
          {paper.authors.length > 5 && ` +${paper.authors.length - 5} more`}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
            {paper.venue}
          </span>
          {!isTopVenue && (
            <span className="text-xs text-slate-400 italic">other venue</span>
          )}
          <span className="text-xs text-slate-400 font-mono">{paper.year}</span>

          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-1.5">
            {/* Explore Graph */}
            <button
              onClick={e => { e.stopPropagation(); onExploreGraph(paper) }}
              className="text-xs font-semibold px-2 py-0.5 rounded-md border border-slate-200 text-slate-400
                         hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Explore citation graph"
            >
              ⬡ Graph
            </button>

            {/* Add to Library */}
            <button
              onClick={e => { e.stopPropagation(); onAddToLibrary(paper) }}
              disabled={inLibrary}
              className={`text-xs font-semibold px-2 py-0.5 rounded-md border transition-colors
                ${inLibrary
                  ? 'border-emerald-300 text-emerald-600 bg-emerald-50 cursor-default'
                  : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              title={inLibrary ? 'Already in library' : 'Add to library'}
            >
              {inLibrary ? '✓ Saved' : '+ Library'}
            </button>
          </div>

          {paper.url && (
            <a href={paper.url} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline">
              DBLP ↗
            </a>
          )}
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline">
              DOI ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
