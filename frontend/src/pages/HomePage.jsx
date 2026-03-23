import { useEffect, useState } from 'react'
import api from '../api/client'
import MovieCard from '../components/MovieCard'
import ErrorBanner from '../components/ErrorBanner'

const GLASS = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
}

const INPUT = {
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  color: '#fff',
}

export default function HomePage() {
  const [shows, setShows] = useState([])
  const [genres, setGenres] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ genre_id: '', min_year: '', max_year: '', min_rating: '', search: '' })
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    api.get('/shows/genres').then(r => setGenres(r.data)).catch(() => {})
    fetchShows({})
  }, [])

  const fetchShows = (f) => {
    setLoading(true); setError(null)
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== null))
    api.get('/shows', { params })
      .then(r => setShows(r.data))
      .catch(err => setError(err.response?.data?.detail ?? 'Failed to load movies.'))
      .finally(() => setLoading(false))
  }

  const handleReset = () => {
    const empty = { genre_id: '', min_year: '', max_year: '', min_rating: '', search: '' }
    setFilters(empty); setTypeFilter(''); fetchShows({})
  }

  const visibleShows = typeFilter ? shows.filter(s => s.show_type === typeFilter) : shows

  return (
    <div className="g-page">
      <div className="container py-4">
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {/* Filter bar */}
        <div style={{ ...GLASS, padding: '1rem', marginBottom: '1.5rem' }}>
          <form onSubmit={e => { e.preventDefault(); fetchShows(filters) }}>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="g-label">Genre</label>
                <select className="form-select form-select-sm" style={INPUT}
                  value={filters.genre_id} onChange={e => setFilters(f => ({ ...f, genre_id: e.target.value }))}>
                  <option value="">All Genres</option>
                  {genres.map(g => <option key={g.genre_id} value={g.genre_id}>{g.name}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="g-label">Min Year</label>
                <input type="number" className="form-control form-control-sm" style={INPUT}
                  placeholder="1900" min="1900" max="2026" value={filters.min_year}
                  onChange={e => setFilters(f => ({ ...f, min_year: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <label className="g-label">Max Year</label>
                <input type="number" className="form-control form-control-sm" style={INPUT}
                  placeholder="2026" min="1900" max="2026" value={filters.max_year}
                  onChange={e => setFilters(f => ({ ...f, max_year: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <label className="g-label">Min Rating</label>
                <input type="number" className="form-control form-control-sm" style={INPUT}
                  placeholder="0–10" min="0" max="10" step="1" value={filters.min_rating}
                  onChange={e => setFilters(f => ({ ...f, min_rating: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="g-label">Search</label>
                <input type="text" className="form-control form-control-sm" style={INPUT}
                  placeholder="Title, actor, director..." value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3 align-items-center flex-wrap">
              <button type="submit" className="btn btn-sm g-btn-accent px-4">Apply Filters</button>
              <button type="button" className="btn btn-sm g-btn-ghost px-3" onClick={handleReset}>Reset</button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                {[['', 'All'], ['movie', 'Movies'], ['series', 'Series']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setTypeFilter(val)} style={{
                    padding: '4px 14px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    border: typeFilter === val ? '1px solid rgba(201,68,85,0.7)' : '1px solid rgba(255,255,255,0.12)',
                    background: typeFilter === val ? 'rgba(201,68,85,0.25)' : 'rgba(255,255,255,0.05)',
                    color: typeFilter === val ? '#e07080' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-5 g-muted">Loading titles...</div>
        ) : visibleShows.length === 0 ? (
          <div className="text-center py-5 g-muted">No titles found matching your filters.</div>
        ) : (
          <>
            <p className="g-muted small mb-3">{visibleShows.length} title{visibleShows.length !== 1 ? 's' : ''} found</p>
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
              {visibleShows.map(show => <MovieCard key={show.show_id} show={show} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
