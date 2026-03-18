export default function SearchBar({ query, onChange, onSearch, loading }) {
  function handleKey(e) {
    if (e.key === 'Enter') onSearch()
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="e.g. federated learning, side channel attacks…"
        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   font-mono text-sm shadow-sm"
      />
      <button
        onClick={onSearch}
        disabled={loading || !query.trim()}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
                   text-white font-semibold rounded-lg shadow-sm transition-colors duration-150 text-sm"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </div>
  )
}
