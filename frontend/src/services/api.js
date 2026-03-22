const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export async function fetchVenues() {
  const res = await fetch(`${BASE_URL}/venues`)
  if (!res.ok) throw new Error('Failed to fetch venues')
  return res.json()
}

export async function searchPapers({ query, venues, yearFrom, yearTo, includeOthers }) {
  const params = new URLSearchParams({ q: query })
  if (venues && venues.length > 0) params.set('venues', venues.join(','))
  if (yearFrom) params.set('year_from', yearFrom)
  if (yearTo) params.set('year_to', yearTo)
  if (includeOthers) params.set('include_others', 'true')

  const res = await fetch(`${BASE_URL}/search?${params}`)
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

export async function exportBibtex(papers) {
  const res = await fetch(`${BASE_URL}/export/bibtex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ papers }),
  })
  if (!res.ok) throw new Error('Export failed')
  return res.text()
}

export function downloadBibtex(content, filename = 'papers.bib') {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Library ──────────────────────────────────────────────────────────────────

export async function fetchLibrary() {
  const res = await fetch(`${BASE_URL}/library`)
  if (!res.ok) throw new Error('Failed to fetch library')
  return res.json()
}

export async function addToLibrary(papers) {
  const res = await fetch(`${BASE_URL}/library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ papers }),
  })
  if (!res.ok) throw new Error('Failed to add to library')
  return res.json()
}

export async function removeFromLibrary(dblpKey) {
  const res = await fetch(`${BASE_URL}/library/${encodeURIComponent(dblpKey)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to remove from library')
  return res.json()
}
