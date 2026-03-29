import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import MovieCard from '../components/MovieCard'
import PosterImage from '../components/PosterImage'

const PILL = (active) => ({
  padding: '5px 18px',
  borderRadius: '20px',
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.4px',
  border: active ? '1px solid rgba(201,68,85,0.7)' : '1px solid rgba(255,255,255,0.12)',
  background: active ? 'rgba(201,68,85,0.25)' : 'rgba(255,255,255,0.05)',
  color: active ? '#e07080' : 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  transition: 'all 0.2s',
})

function SectionHeader({ title, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#fff' }}>{title}</h2>
      {children}
    </div>
  )
}

function ShowGrid({ shows, loading }) {
  if (loading) return <div className="text-center py-4 g-muted">Loading...</div>
  if (!shows.length) return <div className="text-center py-4 g-muted">No titles found.</div>
  return (
    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-3">
      {shows.map(show => <MovieCard key={show.show_id} show={show} />)}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestRef = useRef(null)
  const debounceRef = useRef(null)

  const [trendingType, setTrendingType] = useState('movie')
  const [trendingMovies, setTrendingMovies] = useState([])
  const [trendingSeries, setTrendingSeries] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)

  const [latestMovies, setLatestMovies] = useState([])
  const [latestMoviesLoading, setLatestMoviesLoading] = useState(true)

  const [latestSeries, setLatestSeries] = useState([])
  const [latestSeriesLoading, setLatestSeriesLoading] = useState(true)

  // Fetch trending (both types in one call) on mount
  useEffect(() => {
    api.get('/shows/trending')
      .then(r => { setTrendingMovies(r.data.movies); setTrendingSeries(r.data.series) })
      .catch(() => { setTrendingMovies([]); setTrendingSeries([]) })
      .finally(() => setTrendingLoading(false))
  }, [])

  // Fetch latest movies + series on mount
  useEffect(() => {
    api.get('/shows/latest', { params: { show_type: 'movie' } })
      .then(r => setLatestMovies(r.data))
      .catch(() => setLatestMovies([]))
      .finally(() => setLatestMoviesLoading(false))

    api.get('/shows/latest', { params: { show_type: 'series' } })
      .then(r => setLatestSeries(r.data))
      .catch(() => setLatestSeries([]))
      .finally(() => setLatestSeriesLoading(false))
  }, [])

  // Search suggestions with debounce
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      api.get('/shows/suggestions', { params: { q: query } })
        .then(r => { setSuggestions(r.data); setShowSuggestions(true) })
        .catch(() => setSuggestions([]))
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleViewAll = () => {
    if (query.trim()) navigate(`/browse?search=${encodeURIComponent(query.trim())}`)
    else navigate('/browse')
  }

  const trendingShows = trendingType === 'movie' ? trendingMovies : trendingSeries

  return (
    <div className="g-page">
      <div className="container py-4">

        {/* ── Hero search ──────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '3rem 0 2.5rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, margin: '0 0 0.5rem',
            background: 'linear-gradient(135deg, #e06070, #c94455)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Find Movies, TV Shows and more
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Search your archive by title, actor, or director
          </p>

          <div ref={suggestRef} style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
            <form onSubmit={e => { e.preventDefault(); handleViewAll() }}
              style={{ display: 'flex', gap: '0' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Enter keywords..."
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  fontSize: '1rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRight: 'none',
                  borderRadius: '14px 0 0 14px',
                  color: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <button type="submit" style={{
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #c94455, #81262E)',
                border: 'none',
                borderRadius: '0 14px 14px 0',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}>
                Search
              </button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                marginTop: '4px',
                background: 'rgba(20, 14, 26, 0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              }}>
                {suggestions.map(s => (
                  <Link
                    key={s.show_id}
                    to={`/shows/${s.show_id}`}
                    onClick={() => setShowSuggestions(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 16px',
                      color: '#fff', textDecoration: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <PosterImage posterUrl={s.poster_url} alt={s.title} style={{ width: 50, height: 75, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    {!s.poster_url && (
                      <div style={{ width: 50, height: 75, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <p style={{ margin: '0 0 3px', fontSize: '0.92rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </p>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                        {s.release_year || '—'} &middot; {s.show_type === 'series' ? 'TV Show' : 'Movie'}
                        {s.imdb_rating && <> &middot; IMDb {s.imdb_rating}</>}
                      </span>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={handleViewAll}
                  style={{
                    display: 'block', width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(201,68,85,0.1)',
                    border: 'none',
                    color: '#e07080',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,68,85,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,68,85,0.1)'}
                >
                  View all results
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Trending ─────────────────────────────────────── */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader title="Trending">
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setTrendingType('movie')} style={PILL(trendingType === 'movie')}>Movies</button>
              <button type="button" onClick={() => setTrendingType('series')} style={PILL(trendingType === 'series')}>TV Shows</button>
            </div>
          </SectionHeader>
          <ShowGrid shows={trendingShows} loading={trendingLoading} />
        </section>

        {/* ── Latest Movies ────────────────────────────────── */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader title="Latest Movies" />
          <ShowGrid shows={latestMovies} loading={latestMoviesLoading} />
        </section>

        {/* ── Latest TV Shows ──────────────────────────────── */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionHeader title="Latest TV Shows" />
          <ShowGrid shows={latestSeries} loading={latestSeriesLoading} />
        </section>

      </div>
    </div>
  )
}
