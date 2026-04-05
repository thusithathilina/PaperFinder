import { useRef } from 'react'
import { exportBibtex, downloadBibtex, removeFromLibrary, fetchPdf, uploadPdf } from '../services/api'

const PDF_STATUS = {
  none:      { label: 'No PDF',    color: 'text-slate-400 bg-slate-100 border-slate-200' },
  fetching:  { label: 'Fetching…', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  available: { label: 'PDF Ready', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  not_found: { label: 'Not found', color: 'text-red-500 bg-red-50 border-red-200' },
  uploaded:  { label: 'Uploaded',  color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
}

const GROUP_COLORS = {
  security: 'bg-rose-100 text-rose-700 border-rose-200',
  ml: 'bg-violet-100 text-violet-700 border-violet-200',
  default: 'bg-slate-100 text-slate-500 border-slate-200',
}

function LibraryCard({ paper, onRemove, onFetchPdf, onUploadPdf }) {
  const fileInputRef = useRef()
  const badgeColor = GROUP_COLORS[paper.venue_group] ?? GROUP_COLORS.default
  const pdfStatus = PDF_STATUS[paper.pdf_status ?? 'none']
  const hasPdf = ['available', 'uploaded'].includes(paper.pdf_status)
  const isFetching = paper.pdf_status === 'fetching'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-1">
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
            <span className="text-xs text-slate-400 font-mono">{paper.year}</span>
            {paper.url && (
              <a href={paper.url} target="_blank" rel="noreferrer"
                className="text-xs text-indigo-500 hover:underline ml-auto">
                DBLP ↗
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(paper.dblp_key)}
          className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
          title="Remove from library"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* PDF section */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
        {/* Status badge */}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${pdfStatus.color}`}>
          {pdfStatus.label}
        </span>

        {/* Fetch button — show if no PDF yet or not found */}
        {!hasPdf && !isFetching && (
          <button
            onClick={() => onFetchPdf(paper.dblp_key)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            🔍 Fetch PDF
          </button>
        )}

        {/* Upload button — always available */}
        {!hasPdf && !isFetching && (
          <>
            <button
              onClick={() => fileInputRef.current.click()}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              📎 Upload PDF
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files[0]
                if (file) onUploadPdf(paper.dblp_key, file)
                e.target.value = ''
              }}
            />
          </>
        )}

        {/* Replace PDF option when already have one */}
        {hasPdf && (
          <>
            <button
              onClick={() => fileInputRef.current.click()}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Replace
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files[0]
                if (file) onUploadPdf(paper.dblp_key, file)
                e.target.value = ''
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function LibraryPage({ papers, onRefresh }) {
  async function handleExportAll() {
    const bib = await exportBibtex(papers)
    downloadBibtex(bib, 'library.bib')
  }

  async function handleRemove(dblpKey) {
    await removeFromLibrary(dblpKey)
    onRefresh()
  }

  async function handleFetchPdf(dblpKey) {
    const result = await fetchPdf(dblpKey)
    console.log('fetch result:', result)   // ← add this
    onRefresh()
  }

  async function handleUploadPdf(dblpKey, file) {
    await uploadPdf(dblpKey, file)
    onRefresh()
  }

  // Stats
  const withPdf = papers.filter(p => ['available', 'uploaded'].includes(p.pdf_status)).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">My Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {papers.length} paper{papers.length !== 1 ? 's' : ''}
            {withPdf > 0 && ` · ${withPdf} with PDF`}
          </p>
        </div>
        {papers.length > 0 && (
          <button
            onClick={handleExportAll}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
          >
            Export all .bib
          </button>
        )}
      </div>

      {/* Empty state */}
      {papers.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-sm font-medium">Your library is empty</p>
          <p className="text-xs mt-1">Search for papers and add them here</p>
        </div>
      )}

      {/* Paper list */}
      <div className="space-y-2">
        {papers.map(paper => (
          <LibraryCard
            key={paper.dblp_key}
            paper={paper}
            onRemove={handleRemove}
            onFetchPdf={handleFetchPdf}
            onUploadPdf={handleUploadPdf}
          />
        ))}
      </div>
    </div>
  )
}
