import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import ErrorBanner from '../components/ErrorBanner'
import PosterImage from '../components/PosterImage'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const CARD = { ...GLASS, overflow: 'hidden', height: '100%', transition: 'transform 0.2s, border-color 0.2s' }

export default function WatchlistDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState(null)
  const [error, setError] = useState(null)
  const [removeId, setRemoveId] = useState(null)

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

  if (error) return <div className="container py-5"><ErrorBanner message={error} /></div>
  if (!watchlist) return <div className="text-center py-5 g-muted">Loading...</div>

  return (
    <div className="g-page">
      <div className="container py-4">
        <button className="btn btn-sm g-btn-ghost mb-4" onClick={() => navigate('/watchlists')}>← My Watchlists</button>

        <div style={{ ...GLASS, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '4px' }}>{watchlist.name}</h2>
          {watchlist.description && <p className="g-muted mb-2">{watchlist.description}</p>}
          <small className="g-dim">{watchlist.shows?.length ?? 0} movies · Created {watchlist.created_at}</small>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {watchlist.shows?.length === 0 ? (
          <div className="text-center py-5 g-muted">
            No movies yet. <Link to="/" style={{ color: '#e07080', textDecoration: 'none' }}>Browse movies</Link> to add some.
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-3">
            {watchlist.shows?.map(show => (
              <div key={show.show_id} className="col">
                <div style={CARD}>
                  <div style={{ paddingBottom: '120%', position: 'relative', background: '#0d0810' }}>
                    <PosterImage posterUrl={show.poster_url} alt={show.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {!show.poster_url && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'rgba(255,255,255,0.2)' }}>🎬</div>
                    )}
                  </div>
                  <div style={{ padding: '0.6rem 0.75rem 0.75rem', background: 'rgba(0,0,0,0.2)' }}>
                    <p style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }} className="text-truncate mb-1">{show.title}</p>
                    <small className="g-muted">{show.release_year}</small>
                    <div className="d-flex gap-1 mt-2">
                      <Link to={`/shows/${show.show_id}`} className="btn btn-sm g-btn-ghost flex-grow-1" style={{ fontSize: '0.72rem' }}>View</Link>
                      <button className="btn btn-sm g-btn-danger" style={{ fontSize: '0.72rem' }}
                        onClick={() => setRemoveId(show.show_id)}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {removeId && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: '#fff' }}>Remove from Watchlist?</h5>
                <button className="btn-close btn-close-white" onClick={() => setRemoveId(null)} />
              </div>
              <div className="modal-body g-muted">This will remove the movie from this watchlist.</div>
              <div className="modal-footer">
                <button className="btn btn-sm g-btn-ghost" onClick={() => setRemoveId(null)}>Cancel</button>
                <button className="btn btn-sm g-btn-danger" onClick={handleRemove}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
