import { useState } from 'react'
import { Link } from 'react-router-dom'
import PosterImage from './PosterImage'

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
  const [hovered, setHovered] = useState(false)

  return (
    <div className="col">
      <div
        style={hovered ? GLASS_CARD_HOVER : GLASS_CARD}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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
            background: 'linear-gradient(to top, rgba(20,10,18,0.92) 0%, rgba(20,10,18,0.4) 45%, transparent 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}>
            <Link to={`/shows/${show.show_id}`}
              style={{
                background: 'linear-gradient(135deg, #c94455, #81262E)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 18px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(201,68,85,0.45)',
              }}
              onClick={e => e.stopPropagation()}
            >
              View Details
            </Link>
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
