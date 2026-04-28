import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import ErrorBanner from '../components/ErrorBanner'
import MovieCard from '../components/MovieCard'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }
const PILL = (active) => ({
  background: active ? 'rgba(201,68,85,0.25)' : 'rgba(255,255,255,0.06)',
  border: active ? '1px solid rgba(201,68,85,0.5)' : '1px solid rgba(255,255,255,0.1)',
  color: active ? '#e07080' : 'rgba(255,255,255,0.6)',
  borderRadius: '20px', padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.2s ease',
})
const MODAL_BACKDROP = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const MODAL_BOX = { ...GLASS, padding: '1.5rem', width: '100%', maxWidth: '440px', margin: '1rem' }

export default function WatchlistDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState(null)
  const [error, setError] = useState(null)
  const [removeId, setRemoveId] = useState(null)

    // Filters
  const [filterType, setFilterType] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [sortBy, setSortBy] = useState('added_at')

  useEffect(() => {
    api.get(`/watchlists/${id}`)
      .then(r => setWatchlist(r.data))
      .catch(err => setError(err.response?.data?.detail ?? 'Failed to load watchlist.'))
  }, [id])

  const handleRemove = async () => {
    try {
      await api.delete(`/watchlists/${id}/shows/${removeId}`)
      setWatchlist(w => ({ ...w, shows: w.shows.filter(s => s.show_id !== removeId) }))
      setRemoveId(null)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to remove movie.')
    }
  }

    // Build genre list from shows
  const allGenres = useMemo(() => {
    const set = new Set()
    watchlist?.shows?.forEach(s => {
      (s.genre_names || '').split(',').filter(Boolean).forEach(g => set.add(g))
    })
    return [...set].sort()
  }, [watchlist])

  // Filter + sort
  const filteredShows = useMemo(() => {
    let items = watchlist?.shows || []
    if (filterType) items = items.filter(s => s.show_type === filterType)
    if (filterGenre) items = items.filter(s => (s.genre_names || '').includes(filterGenre))
    items = [...items].sort((a, b) => {
      if (sortBy === 'added_at') return new Date(b.watchlist_added_at || 0) - new Date(a.watchlist_added_at || 0)
      if (sortBy === 'rating') return (Number(b.imdb_rating) || 0) - (Number(a.imdb_rating) || 0)
      if (sortBy === 'year') return (b.release_year || 0) - (a.release_year || 0)
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
      return 0
    })
    return items
  }, [watchlist, filterType, filterGenre, sortBy])

  if (error && !watchlist) return <div className="container py-5"><ErrorBanner message={error} /></div>
  if (!watchlist) return <div className="text-center py-5 g-muted">Loading...</div>

    const showCount = filteredShows.length
  const totalCount = watchlist.shows?.length ?? 0

  return (
    <div className="g-page">
      <div className="container py-4">
        <button className="btn btn-sm g-btn-ghost mb-4" onClick={() => navigate('/watchlists')}>← My Watchlists</button>

        <div style={{ ...GLASS, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '4px' }}>{watchlist.name}</h2>
          {watchlist.description && <p className="g-muted mb-2">{watchlist.description}</p>}
          <small className="g-dim">{totalCount} items · Created {watchlist.created_at}</small>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {totalCount === 0 ? (
          <div className="text-center py-5 g-muted">
            No movies yet. <Link to="/browse" style={{ color: '#e07080', textDecoration: 'none' }}>Browse movies</Link> to add some.
          </div>
        ) : (
                    <>
            {/* Filter bar */}
            <div style={{ ...GLASS, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* Sort */}
                <div className="d-flex align-items-center gap-2">
                  <span className="g-dim" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Sort:</span>
                  <select className="form-select form-select-sm" style={{ ...INPUT, maxWidth: '150px', fontSize: '0.78rem' }}
                    value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="added_at">Date Added</option>
                    <option value="rating">Rating</option>
                    <option value="year">Year</option>
                    <option value="title">Title</option>
                  </select>
                </div>
                
                {/* Type pills */}
                <div className="d-flex gap-1">
                  {[['', 'All'], ['movie', 'Movies'], ['series', 'Series']].map(([val, label]) => (
                    <button key={val} style={PILL(filterType === val)} onClick={() => setFilterType(val)}>{label}</button>
                  ))}
                </div>

                {/* Genre */}
                {allGenres.length > 0 && (
                  <select className="form-select form-select-sm" style={{ ...INPUT, maxWidth: '160px', fontSize: '0.78rem' }}
                    value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
                    <option value="">All Genres</option>
                    {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}

                {/* Count */}
                <span className="g-dim ms-auto" style={{ fontSize: '0.75rem' }}>
                  {showCount !== totalCount ? `${showCount} of ${totalCount}` : `${totalCount} items`}
                </span>
              </div>
            </div>

            {/* Grid */}
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-3">
              {filteredShows.map(show => (
                <MovieCard key={show.show_id} show={show} watchlistMode onRemove={(showId) => setRemoveId(showId)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Remove confirmation modal */}
      {removeId && (
                <div style={MODAL_BACKDROP} onClick={() => setRemoveId(null)}>
          <div style={MODAL_BOX} onClick={e => e.stopPropagation()}>
            <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Remove from Watchlist?</h5>
            <p className="g-muted mb-3">This will remove the show from this watchlist.</p>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-sm g-btn-ghost px-4" onClick={() => setRemoveId(null)}>Cancel</button>
              <button className="btn btn-sm g-btn-danger px-4" onClick={handleRemove}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
