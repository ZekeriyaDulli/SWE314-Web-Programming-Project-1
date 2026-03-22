import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'
import PosterImage from '../components/PosterImage'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }

export default function HistoryPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    api.get('/history').then(r => setHistory(r.data)).catch(err => setError(err.response?.data?.detail ?? 'Failed to load history.'))
  }, [isLoggedIn])

  const totalRated = history.filter(h => h.user_rating).length

  return (
    <div className="g-page">
      <div className="container py-4">
        <div className="mb-4">
          <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px' }} className="mb-1">Watch History</h2>
          <p className="g-muted mb-0">{history.length} watched · {totalRated} rated</p>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {history.length === 0 ? (
          <div className="text-center py-5 g-muted">
            No movies watched yet.{' '}
            <Link to="/" style={{ color: '#e07080', textDecoration: 'none' }}>Browse movies</Link> to get started.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {history.map(h => (
              <div key={h.show_id} style={{ ...GLASS, padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flexShrink: 0, width: '56px', height: '76px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PosterImage posterUrl={h.poster_url} alt={h.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {!h.poster_url && <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>🎬</span>}
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <h6 className="mb-1" style={{ color: '#fff', fontWeight: 600 }}>
                    <Link to={`/shows/${h.show_id}`} style={{ color: '#fff', textDecoration: 'none' }}>{h.title}</Link>
                  </h6>
                  <small className="g-muted d-block">
                    {h.release_year} · Watched {new Date(h.watched_at).toLocaleDateString()}
                  </small>
                  {h.review_text && <small className="g-dim d-block mt-1 fst-italic">"{h.review_text}"</small>}
                </div>
                <div className="text-end" style={{ flexShrink: 0 }}>
                  {h.user_rating && (
                    <span className="g-badge-platform d-block mb-1">★ {h.user_rating}/10</span>
                  )}
                  {h.imdb_rating && (
                    <span className="g-badge-imdb">IMDb {h.imdb_rating}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
