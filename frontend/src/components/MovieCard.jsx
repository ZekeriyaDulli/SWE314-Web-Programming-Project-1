import { useState } from 'react'
import { Link } from 'react-router-dom'
import PosterImage from './PosterImage'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const GLASS_CARD = {
  position: 'relative',
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '16px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
  overflow: 'hidden',
  height: '100%',
  transition: 'transform 0.28s cubic-bezier(.25,.46,.45,.94), box-shadow 0.28s ease, border-color 0.28s ease',
}

const GLASS_CARD_HOVER = {
  ...GLASS_CARD,
  transform: 'translateY(-8px) scale(1.015)',
  borderColor: 'rgba(201, 68, 85, 0.5)',
  boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 40px rgba(201,68,85,0.2)',
}

export default function MovieCard({ show }) {
  const { isLoggedIn } = useAuth()
  const [hovered, setHovered]       = useState(false)
  const [mode, setMode]             = useState('default') // 'default' | 'watchlist' | 'success' | 'error'
  const [watchlists, setWatchlists] = useState([])
  const [wlLoading, setWlLoading]   = useState(false)

  const resetMode = () => setMode('default')

  const handleOpenWatchlist = async (e) => {
    e.preventDefault()
    setWlLoading(true)
    try {
      const r = await api.get('/watchlists')
      setWatchlists(r.data)
      setMode('watchlist')
    } catch {
      setMode('error')
      setTimeout(resetMode, 1500)
    } finally {
      setWlLoading(false)
    }
  }

  const handleSelect = async (e, watchlistId) => {
    e.preventDefault()
    try {
      await api.post(`/watchlists/${watchlistId}/shows`, { show_id: show.show_id })
      setMode('success')
      setTimeout(resetMode, 1400)
    } catch {
      setMode('error')
      setTimeout(resetMode, 1400)
    }
  }

  return (
    <div className="col">
      <div
        style={hovered ? GLASS_CARD_HOVER : GLASS_CARD}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); resetMode() }}
      >
        {/* Poster */}
        <div style={{ position: 'relative', aspectRatio: '2/3', background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          <PosterImage
            posterUrl={show.poster_url}
            alt={show.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {!show.poster_url && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'rgba(255,255,255,0.2)', zIndex: -1 }}>
              🎬
            </div>
          )}

          {/* Type badge */}
          {show.show_type === 'series'
            ? <span className="g-badge-series" style={{ position: 'absolute', top: '8px', left: '8px' }}>Series</span>
            : <span className="g-badge-movie"  style={{ position: 'absolute', top: '8px', left: '8px' }}>Movie</span>
          }

          {/* Hover overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(20,10,18,0.95) 0%, rgba(20,10,18,0.5) 50%, transparent 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            padding: '12px',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}>

            {/* Default mode */}
            {mode === 'default' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <Link to={`/shows/${show.show_id}`}
                  style={{
                    background: 'linear-gradient(135deg, #c94455, #81262E)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '6px 0',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(201,68,85,0.45)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  View Details
                </Link>
                {isLoggedIn && (
                  <button onClick={handleOpenWatchlist} style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    padding: '6px 0',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                  }}>
                    {wlLoading ? '...' : '＋ Watchlist'}
                  </button>
                )}
              </div>
            )}

            {/* Watchlist picker */}
            {mode === 'watchlist' && (
              <div style={{ width: '100%' }}>
                <div style={{
                  maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px',
                  marginBottom: '6px',
                }}>
                  {watchlists.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textAlign: 'center', margin: '8px 0' }}>
                      No watchlists yet
                    </p>
                  ) : watchlists.map(wl => (
                    <button key={wl.watchlist_id} onClick={e => handleSelect(e, wl.watchlist_id)} style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {wl.name}
                    </button>
                  ))}
                </div>
                <button onClick={e => { e.preventDefault(); resetMode() }} style={{
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  border: 'none', fontSize: '0.72rem', cursor: 'pointer', padding: 0,
                }}>
                  ← Back
                </button>
              </div>
            )}

            {/* Success */}
            {mode === 'success' && (
              <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>✓ Added!</p>
            )}

            {/* Error */}
            {mode === 'error' && (
              <p style={{ color: '#ff4b5c', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>Already in list</p>
            )}

          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px', background: 'rgba(0,0,0,0.15)' }}>
          <p style={{ color: '#fff', fontSize: '0.83rem', fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={show.title}>
            {show.title || 'Unknown Title'}
          </p>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>
            {show.release_year || '—'}
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {show.imdb_rating && <span className="g-badge-imdb">IMDb {show.imdb_rating}</span>}
            {show.platform_avg && <span className="g-badge-platform">★ {Number(show.platform_avg).toFixed(1)}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
