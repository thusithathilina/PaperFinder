const GROUP_LABELS = {
  security: { label: 'Top Security 4', color: 'rose' },
  ml: { label: 'Top ML 4', color: 'violet' },
}

const COLOR = {
  rose: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    check: 'accent-rose-600',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    check: 'accent-violet-600',
  },
}

export default function FilterPanel({
  venues, selectedVenues, onToggleVenue, onPreset,
  yearFrom, yearTo, onYearFrom, onYearTo,
  includeOthers, onToggleIncludeOthers,
}) {
  const groups = {}
  venues.forEach(v => {
    if (!groups[v.group]) groups[v.group] = []
    groups[v.group].push(v)
  })

  const secKeys = venues.filter(v => v.group === 'security').map(v => v.key)
  const mlKeys  = venues.filter(v => v.group === 'ml').map(v => v.key)

  const secActive = secKeys.length > 0 && secKeys.every(k => selectedVenues.includes(k))
  const mlActive  = mlKeys.length > 0 && mlKeys.every(k => selectedVenues.includes(k))

  function handleSecurityClick() {
    if (includeOthers) onToggleIncludeOthers()   // deselect "All other venues"
    onPreset('security')
  }

  function handleMlClick() {
    if (includeOthers) onToggleIncludeOthers()
    onPreset('ml')
  }

  function handleOthersClick() {
    // deselect top-8 presets, enable include_others
    onPreset('none')
    if (!includeOthers) onToggleIncludeOthers()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">

      {/* Preset buttons */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Venue Group</p>
        <div className="flex flex-col gap-2">

          <button
            onClick={handleSecurityClick}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors text-left
              ${secActive && !includeOthers
                ? 'bg-rose-600 border-rose-600 text-white'
                : 'border-rose-300 text-rose-600 hover:bg-rose-50'}`}
          >
            🔒 Top 4 — Security
          </button>

          <button
            onClick={handleMlClick}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors text-left
              ${mlActive && !includeOthers
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'border-violet-300 text-violet-600 hover:bg-violet-50'}`}
          >
            🧠 Top 4 — ML
          </button>

          <button
            onClick={handleOthersClick}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors text-left
              ${includeOthers
                ? 'bg-slate-700 border-slate-700 text-white'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            🌐 All other venues
          </button>

        </div>
      </div>

      {/* Per-venue toggles — hidden when "All other venues" active */}
      {!includeOthers && Object.entries(groups).map(([group, items]) => {
        const { label, color } = GROUP_LABELS[group]
        const c = COLOR[color]
        return (
          <div key={group}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <div className="space-y-1.5">
              {items.map(v => (
                <label key={v.key} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedVenues.includes(v.key)}
                    onChange={() => onToggleVenue(v.key)}
                    className={`w-4 h-4 rounded ${c.check}`}
                  />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${c.badge}`}>
                    {v.short}
                  </span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors leading-tight">
                    {v.full}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )
      })}

      {/* Year range */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Year Range</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={yearFrom}
            onChange={e => onYearFrom(e.target.value)}
            placeholder="From"
            min="1990" max="2100"
            className="w-24 px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-slate-400 text-sm">—</span>
          <input
            type="number"
            value={yearTo}
            onChange={e => onYearTo(e.target.value)}
            placeholder="To"
            min="1990" max="2100"
            className="w-24 px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

    </div>
  )
}
