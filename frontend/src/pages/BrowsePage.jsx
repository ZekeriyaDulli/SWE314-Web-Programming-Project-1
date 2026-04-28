import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
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

/* ── Custom numeric stepper ──────────────────────────────── */
function NumericInput({ label, value, onChange, min, max, step = 1, placeholder }) {
  const num = value === '' ? '' : Number(value)

  const decrement = () => {
    if (num === '') { onChange(String(max)); return }
    const next = num - step
    if (next >= min) onChange(String(next))
  }
  const increment = () => {
    if (num === '') { onChange(String(min)); return }
    const next = num + step
    if (next <= max) onChange(String(next))
  }

  const BTN = {
    width: 28, height: '100%', flexShrink: 0,
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div>
      <label className="g-label">{label}</label>
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        overflow: 'hidden',
        height: 31,
      }}>
        <button type="button" onClick={decrement} style={{ ...BTN, borderRight: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px 0 0 10px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,68,85,0.2)'; e.currentTarget.style.color = '#e07080' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
          −
        </button>
        <input
          type="number"
          value={value}
          placeholder={placeholder}
          min={min} max={max} step={step}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, minWidth: 0,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '0.82rem',
            textAlign: 'center',
            outline: 'none',
            padding: '0 4px',
            MozAppearance: 'textfield',
          }}
        />
        <button type="button" onClick={increment} style={{ ...BTN, borderLeft: '1px solid rgba(255,255,255,0.08)', borderRadius: '0 10px 10px 0' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,68,85,0.2)'; e.currentTarget.style.color = '#e07080' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
          +
        </button>
      </div>
    </div>
  )
}

/* ── Genre dropdown (multi-column, glassmorphic) ──────────── */
function GenreDropdown({ genres, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = genres.find(g => String(g.genre_id) === String(value))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="g-label">Genre</label>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        ...INPUT,
        width: '100%',
        padding: '6px 12px',
        fontSize: '0.85rem',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ color: selected ? '#fff' : 'rgba(255,255,255,0.35)' }}>
          {selected ? selected.name : 'All Genres'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginLeft: 8 }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 60,
          marginTop: 4,
          minWidth: 'min(420px, calc(100vw - 2rem))',
          background: 'rgba(20, 14, 26, 0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '2px 12px',
        }}>
          <button type="button" onClick={() => { onChange(''); setOpen(false) }}
            style={{
              background: 'transparent', border: 'none', padding: '6px 8px', borderRadius: 8,
              color: !value ? '#e07080' : 'rgba(255,255,255,0.6)',
              fontWeight: !value ? 700 : 400,
              fontSize: '0.82rem', textAlign: 'left', cursor: 'pointer',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = !value ? '#e07080' : 'rgba(255,255,255,0.6)' }}
          >All Genres</button>
          {genres.map(g => (
            <button key={g.genre_id} type="button"
              onClick={() => { onChange(String(g.genre_id)); setOpen(false) }}
              style={{
                background: 'transparent', border: 'none', padding: '6px 8px', borderRadius: 8,
                color: String(g.genre_id) === String(value) ? '#e07080' : 'rgba(255,255,255,0.6)',
                fontWeight: String(g.genre_id) === String(value) ? 700 : 400,
                fontSize: '0.82rem', textAlign: 'left', cursor: 'pointer',
                transition: 'color 0.15s, background 0.15s',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = String(g.genre_id) === String(value) ? '#e07080' : 'rgba(255,255,255,0.6)' }}
            >{g.name}</button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BrowsePage() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [shows, setShows] = useState([])
  const [genres, setGenres] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ genre_id: '', min_year: '', max_year: '', min_rating: '', search: initialSearch, show_type: '' })
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    api.get('/shows/genres').then(r => setGenres(r.data)).catch(() => {})
    fetchShows({ search: initialSearch || undefined })
  }, [])

  const fetchShows = (f) => {
    setLoading(true); setError(null)
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    api.get('/shows', { params })
      .then(r => setShows(r.data))
      .catch(err => setError(err.response?.data?.detail ?? 'Failed to load movies.'))
      .finally(() => setLoading(false))
  }

  const handleApply = () => fetchShows({ ...filters })

  const handleReset = () => {
    const empty = { genre_id: '', min_year: '', max_year: '', min_rating: '', search: '', show_type: '' }
    setFilters(empty); fetchShows({})
  }

  const handleTypeChange = (val) => {
    const updated = { ...filters, show_type: val }
    setFilters(updated)
    fetchShows(updated)
  }

  return (
    <div className="g-page">
      <div className="container py-4">
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {/* Filter bar */}
        <div style={{ ...GLASS, padding: '1rem', marginBottom: '1.5rem', position: 'relative', zIndex: 10 }}>
          <form onSubmit={e => { e.preventDefault(); handleApply() }}>

            {/* Mobile: top row — type pills + filter toggle */}
            <div className="d-flex d-md-none align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[['', 'All'], ['movie', 'Movies'], ['series', 'Series']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => handleTypeChange(val)} style={{
                    padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem',
                    fontWeight: 700, letterSpacing: '0.4px',
                    border: filters.show_type === val ? '1px solid rgba(201,68,85,0.7)' : '1px solid rgba(255,255,255,0.12)',
                    background: filters.show_type === val ? 'rgba(201,68,85,0.25)' : 'rgba(255,255,255,0.05)',
                    color: filters.show_type === val ? '#e07080' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>{label}</button>
                ))}
              </div>
              <button type="button" onClick={() => setFiltersOpen(o => !o)} style={{
                padding: '4px 14px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.18)',
                background: filtersOpen ? 'rgba(201,68,85,0.18)' : 'rgba(255,255,255,0.07)',
                color: filtersOpen ? '#e07080' : 'rgba(255,255,255,0.65)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {filtersOpen ? '\u2715 Hide Filters' : '\u2699 Filters'}
              </button>
            </div>

            {/* Filter fields — always visible on md+, collapsible on mobile */}
            <div className={`row g-2 align-items-end${filtersOpen ? '' : ' d-none d-md-flex'}`}>
              {/* 1. Search */}
              <div className="col-md-3 col-12">
                <label className="g-label">Search</label>
                <input type="text" className="form-control form-control-sm" style={INPUT}
                  placeholder="Title, actor, director..." value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              </div>
              {/* 2. Genre */}
              <div className="col-md-3 col-12">
                <GenreDropdown genres={genres} value={filters.genre_id}
                  onChange={val => setFilters(f => ({ ...f, genre_id: val }))} />
              </div>
              {/* 3. Min Rating */}
              <div className="col-md-2 col-6">
                <NumericInput label="Min Rating" value={filters.min_rating} min={1} max={10} step={1}
                  placeholder="0–10" onChange={val => setFilters(f => ({ ...f, min_rating: val }))} />
              </div>
              {/* 4. Min Year */}
              <div className="col-md-2 col-6">
                <NumericInput label="Min Year" value={filters.min_year} min={1900} max={2026} step={1}
                  placeholder="2010" onChange={val => setFilters(f => ({ ...f, min_year: val }))} />
              </div>
              {/* 5. Max Year */}
              <div className="col-md-2 col-6">
                <NumericInput label="Max Year" value={filters.max_year} min={1900} max={2026} step={1}
                  placeholder="2026" onChange={val => setFilters(f => ({ ...f, max_year: val }))} />
              </div>
            </div>

            {/* Apply/Reset + type pills (desktop) */}
            <div className="d-flex gap-2 mt-3 align-items-center flex-wrap">
              <button type="submit" className="btn btn-sm g-btn-accent px-4">Apply Filters</button>
              <button type="button" className="btn btn-sm g-btn-ghost px-3" onClick={handleReset}>Reset</button>
              {/* Type pills — desktop only (mobile version is above) */}
              <div className="d-none d-md-flex" style={{ marginLeft: 'auto', gap: '6px' }}>
                {[['', 'All'], ['movie', 'Movies'], ['series', 'Series']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => handleTypeChange(val)} style={{
                    padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem',
                    fontWeight: 700, letterSpacing: '0.4px',
                    border: filters.show_type === val ? '1px solid rgba(201,68,85,0.7)' : '1px solid rgba(255,255,255,0.12)',
                    background: filters.show_type === val ? 'rgba(201,68,85,0.25)' : 'rgba(255,255,255,0.05)',
                    color: filters.show_type === val ? '#e07080' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-5 g-muted">Loading titles...</div>
        ) : shows.length === 0 ? (
          <div className="text-center py-5 g-muted">No titles found matching your filters.</div>
        ) : (
          <>
            <p className="g-muted small mb-3">{shows.length} title{shows.length !== 1 ? 's' : ''} found</p>
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
              {shows.map(show => <MovieCard key={show.show_id} show={show} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
