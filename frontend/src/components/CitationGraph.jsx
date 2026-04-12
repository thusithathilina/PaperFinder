import { useRef, useCallback, useState, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'

const COLORS = {
  root:     '#4f46e5',
  security: '#e11d48',
  ml:       '#7c3aed',
  expanded: '#0891b2',
  other:    '#94a3b8',
}

function guessGroup(venue = '') {
  const v = venue.toLowerCase()
  if (['ndss','s&p','ieee s&p','usenix security','ccs'].some(k => v.includes(k))) return 'security'
  if (['neurips','nips','icml','iclr','aaai'].some(k => v.includes(k))) return 'ml'
  return null
}

function nodeColor(node) {
  if (node.isRoot) return COLORS.root
  if (node.expanded) return COLORS.expanded
  const group = node.venue_group || guessGroup(node.venue)
  return COLORS[group] ?? COLORS.other
}

function nodeSize(node) {
  if (node.isRoot) return 10
  const total = (node.reference_count || 0) + (node.citation_count || 0)
  return Math.min(4 + Math.sqrt(total) * 0.4, 12)
}

function applyForces(fg) {
  if (!fg) return
  fg.d3Force('charge').strength(-600)
  fg.d3Force('link').distance(180)
  fg.d3Force('collision', null) // clear first
  fg.d3ReheatSimulation()
}

export default function CitationGraph({ rootPaper, onAddToLibrary }) {
  const fgRef = useRef()

  const [nodes, setNodes] = useState(() => [{
    id: rootPaper.ss_id || rootPaper.title,
    ...rootPaper,
    isRoot: true,
    expanded: false,
  }])
  const [links, setLinks] = useState([])
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [error, setError] = useState(null)

  // Tune forces after mount
  useEffect(() => {
    applyForces(fgRef.current)
  }, [])

  // Re-heat simulation when new nodes are added
  useEffect(() => {
    if (nodes.length > 1) applyForces(fgRef.current)
  }, [nodes.length])

  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node)
    if (expandedIds.has(node.id)) return

    setLoading(true)
    setError(null)
    try {
      const { expandNode } = await import('../services/api')
      const data = await expandNode(node.title, node.doi)

      const newNodes = []
      const newLinks = []
      const existingIds = new Set(nodes.map(n => n.id))

      const addConnections = (papers, linkType) => {
        papers.forEach(p => {
          const id = p.ss_id || p.title
          if (!existingIds.has(id)) {
            newNodes.push({
              id,
              ...p,
              isRoot: false,
              expanded: false,
              venue_group: guessGroup(p.venue),
            })
            existingIds.add(id)
          }
          newLinks.push({
            source: linkType === 'reference' ? node.id : id,
            target: linkType === 'reference' ? id : node.id,
            type: linkType,
          })
        })
      }

      addConnections(data.references, 'reference')
      addConnections(data.citations, 'citation')

      setNodes(prev => [
        ...prev.map(n => n.id === node.id ? { ...n, expanded: true } : n),
        ...newNodes,
      ])
      setLinks(prev => [...prev, ...newLinks])
      setExpandedIds(prev => new Set([...prev, node.id]))
    } catch (e) {
      setError(e.message === 'NOT_FOUND'
          ? `"${node.title.slice(0, 50)}…" not found on Semantic Scholar.`
          : 'Failed to load connections. Try again.')
    } finally {
      setLoading(false)
    }
  }, [nodes, expandedIds])

  return (
      <div className="flex gap-4 h-[calc(100vh-12rem)]">

        <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden relative">
          {loading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                Loading connections…
              </div>
          )}
          {error && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                {error}
              </div>
          )}

          <div className="absolute bottom-3 left-3 z-10 bg-slate-800/80 backdrop-blur rounded-lg p-2.5 space-y-1.5">
            {[
              { color: COLORS.root,     label: 'Selected paper' },
              { color: COLORS.security, label: 'Security venue' },
              { color: COLORS.ml,       label: 'ML venue' },
              { color: COLORS.expanded, label: 'Expanded' },
              { color: COLORS.other,    label: 'Other' },
            ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-slate-300">{label}</span>
                </div>
            ))}
            <p className="text-xs text-slate-500 pt-1 border-t border-slate-700">Click node to expand</p>
          </div>

          <ForceGraph2D
              ref={fgRef}
              graphData={{ nodes, links }}
              nodeLabel={n => `${n.title} (${n.year ?? '?'})`}
              nodeColor={nodeColor}
              nodeVal={nodeSize}
              linkColor={l => l.type === 'citation' ? '#6366f1' : '#64748b'}
              linkWidth={1}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              backgroundColor="#0f172a"
              nodeCanvasObject={(node, ctx, globalScale) => {
                const r = nodeSize(node)
                ctx.beginPath()
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
                ctx.fillStyle = nodeColor(node)
                ctx.fill()
                // Only show labels on root or when zoomed in
                if (node.isRoot || globalScale > 2) {
                  const label = node.title.length > 30
                      ? node.title.slice(0, 30) + '…'
                      : node.title
                  ctx.font = `${Math.max(6, 9 / globalScale)}px sans-serif`
                  ctx.fillStyle = '#e2e8f0'
                  ctx.textAlign = 'center'
                  ctx.fillText(label, node.x, node.y + r + 8)
                }
              }}
          />
        </div>

        <div className="w-72 flex-shrink-0 space-y-3 overflow-y-auto">
          {selectedNode ? (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Selected paper</p>
                  <h3 className="text-sm font-semibold text-slate-800 leading-snug">{selectedNode.title}</h3>
                </div>
                {selectedNode.authors?.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {selectedNode.authors.slice(0, 3).join(', ')}
                      {selectedNode.authors.length > 3 && ` +${selectedNode.authors.length - 3} more`}
                    </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {selectedNode.venue && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  {selectedNode.venue}
                </span>
                  )}
                  {selectedNode.year && (
                      <span className="text-xs text-slate-400 font-mono">{selectedNode.year}</span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>📥 {selectedNode.citation_count ?? '?'} citations</span>
                  <span>📤 {selectedNode.reference_count ?? '?'} refs</span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {!expandedIds.has(selectedNode.id) && (
                      <button
                          onClick={() => handleNodeClick(selectedNode)}
                          disabled={loading}
                          className="w-full py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors"
                      >
                        {loading ? 'Loading…' : 'Expand connections'}
                      </button>
                  )}
                  {expandedIds.has(selectedNode.id) && (
                      <p className="text-xs text-center text-cyan-600 font-medium">✓ Already expanded</p>
                  )}
                  <button
                      onClick={() => onAddToLibrary({
                        dblp_key: selectedNode.id,
                        title: selectedNode.title,
                        authors: selectedNode.authors ?? [],
                        year: selectedNode.year ?? 0,
                        venue: selectedNode.venue ?? '',
                        venue_key: '',
                        venue_group: selectedNode.venue_group ?? null,
                        doi: selectedNode.doi ?? null,
                        url: null,
                      })}
                      className="w-full py-1.5 text-xs font-semibold border border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    + Add to Library
                  </button>
                  {selectedNode.doi && (
                      <a
                          href={`https://doi.org/${selectedNode.doi}`}
                          target="_blank" rel="noreferrer"
                          className="w-full py-1.5 text-xs font-semibold text-center border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        Open DOI ↗
                      </a>
                  )}
                </div>
              </div>
          ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-slate-400">
                <p className="text-sm font-medium">Click any node</p>
                <p className="text-xs mt-1">to see paper details and expand connections</p>
              </div>
          )}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Graph stats</p>
            <p className="text-xs text-slate-600">{nodes.length} papers · {links.length} connections</p>
            <p className="text-xs text-slate-600">{expandedIds.size} nodes expanded</p>
          </div>
        </div>

      </div>
  )
}