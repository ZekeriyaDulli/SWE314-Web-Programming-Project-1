import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'
import PosterImage from '../components/PosterImage'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }

export default function ShowDetailPage() {
  const { id } = useParams()
  const { isLoggedIn, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(null)
  const [watchlists, setWatchlists] = useState([])
  const [allTags, setAllTags] = useState([])
  const [error, setError] = useState(null)
  const [ratingForm, setRatingForm] = useState({ rating: '', review_text: '' })
  const [actionMsg, setActionMsg] = useState(null)
  const [selectedWl, setSelectedWl] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [showTrailer, setShowTrailer] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [showWlPicker, setShowWlPicker] = useState(false)
  const [watchedHovered, setWatchedHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get(`/shows/${id}`)
      .then(r => setShow(r.data))
      .catch(err => setError(err.response?.data?.detail ?? 'Failed to load movie.'))

    if (isAdmin) api.get('/tags').then(r => setAllTags(r.data)).catch(() => {})
  }, [id, isLoggedIn, isAdmin])


  const reloadShow = () => api.get(`/shows/${id}`).then(r => setShow(r.data))

  const handleRate = async (e) => {
    e.preventDefault()
    setActionMsg(null)
    try {
      await api.post('/ratings', { show_id: parseInt(id), rating: parseInt(ratingForm.rating), review_text: ratingForm.review_text || null })
      setActionMsg({ type: 'success', text: 'Rating submitted! Movie marked as watched.' })
      reloadShow()
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.detail ?? 'Failed to submit rating.' })
    }
  }

  const handleMarkWatched = async () => {
    try {
      await api.post(`/history/${id}`)
      setShow(s => ({ ...s, is_watched: true }))
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to mark as watched.')
    }
  }

  const handleUnwatch = async () => {
    try {
      await api.delete(`/history/${id}`)
      setShow(s => ({ ...s, is_watched: false }))
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.detail ?? 'Failed to remove from watch history.' })
      setTimeout(() => setActionMsg(null), 4000)
    }
  }

  const handleAddToWatchlistDirect = async (watchlistId) => {
    try {
      await api.post(`/watchlists/${watchlistId}/shows`, { show_id: parseInt(id) })
      setActionMsg({ type: 'success', text: 'Added to watchlist!' })
      setTimeout(() => setActionMsg(null), 2000)
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.detail ?? 'Failed to add to watchlist.' })
      setTimeout(() => setActionMsg(null), 2000)
    }
  }

  const handleApplyTag = async () => {
    if (!selectedTag) return
    try {
      await api.post(`/shows/${id}/tags`, { tag_id: parseInt(selectedTag) })
      setSelectedTag('')
      reloadShow()
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.detail ?? 'Failed to apply tag.' })
    }
  }

  if (error) return <div className="container py-5"><ErrorBanner message={error} /></div>
  if (!show) return <div className="text-center py-5 g-muted">Loading...</div>

  return (
    <div className="g-page">

      {/* Trailer Modal */}
      {showTrailer && show.trailer_url && (
        <div
          onClick={() => setShowTrailer(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: '960px' }}
          >
            <button
              onClick={() => setShowTrailer(false)}
              style={{
                position: 'absolute', top: '-40px', right: 0,
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                fontSize: '1rem', cursor: 'pointer', fontWeight: 600, letterSpacing: '1px',
              }}
            >
              ✕ Close
            </button>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 0 80px rgba(201,68,85,0.3)' }}>
              <iframe
                src={`https://www.youtube.com/embed/${show.trailer_url}?autoplay=1&rel=0`}
                title={`${show.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Watchlist Modal */}
      {showWlPicker && (
        <div
          onClick={() => setShowWlPicker(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(15,10,22,0.98)', backdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
              padding: '1.5rem', minWidth: 300, maxWidth: 420, width: '100%',
              maxHeight: '70vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 32px 100px rgba(0,0,0,0.9), 0 0 60px rgba(201,68,85,0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
              <p style={{ color: '#fff', fontWeight: 700, margin: 0, fontSize: '1rem' }}>Add to Watchlist</p>
              <button
                onClick={() => setShowWlPicker(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px', lineHeight: 1 }}
              >✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {watchlists.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', margin: '16px 0' }}>
                  No watchlists yet. <a href="/watchlists" style={{ color: '#e07080', textDecoration: 'none' }}>Create one →</a>
                </p>
              ) : watchlists.map(w => (
                <button key={w.watchlist_id}
                  onClick={() => { handleAddToWatchlistDirect(w.watchlist_id); setShowWlPicker(false) }}
                  style={{
                    display: 'block', width: '100%', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.88)',
                    padding: '11px 14px', borderRadius: 10, fontSize: '0.88rem', fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.14s, border-color 0.14s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,68,85,0.18)'; e.currentTarget.style.borderColor = 'rgba(201,68,85,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                >
                  + {w.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container py-5">
        <button className="btn btn-sm g-btn-ghost mb-4" onClick={() => navigate(-1)}>← Back</button>

        <div className="row g-4">
          {/* Poster */}
          <div className="col-md-3">
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
              <PosterImage
                posterUrl={show.poster_url}
                alt={show.title}
                className="img-fluid"
                style={{ width: '100%', display: 'block' }}
              />
              {!show.poster_url && (
                <div className="d-flex align-items-center justify-content-center" style={{ height: '350px', background: 'rgba(255,255,255,0.04)', fontSize: '4rem', color: 'rgba(255,255,255,0.2)' }}>🎬</div>
              )}
              {show.is_watched && (
                <span className="g-badge-watched position-absolute top-0 end-0 m-2">✓ Watched</span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="col-md-9">
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.5px' }} className="mb-2">{show.title}</h2>

            {/* Meta row: type → IMDb → year → seasons/duration → platform */}
            <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
              {show.show_type === 'series'
                ? <span className="g-badge-series">TV Series</span>
                : <span className="g-badge-movie">Movie</span>
              }
              {show.imdb_rating && <span className="g-badge-imdb">IMDb: {show.imdb_rating}</span>}
              {show.platform_avg && <span className="g-badge-platform">★ {Number(show.platform_avg).toFixed(1)} platform</span>}
              {show.release_year && <span className="g-muted">{show.release_year} | </span>}
              {show.show_type === 'series' && show.total_seasons
                ? <span className="g-muted">{show.total_seasons} season{show.total_seasons !== 1 ? 's' : ''}</span>
                : show.duration_minutes > 0 && <span className="g-muted">{show.duration_minutes} min</span>
              }
            </div>

            {/* Action buttons */}
            {(show.trailer_url || isLoggedIn) && (
              <div className="mb-3">
                {/* Row 1: Primary actions */}
                <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                  {show.trailer_url && (
                    <button
                      onClick={() => setShowTrailer(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #c94455, #81262E)',
                        color: '#fff', border: 'none', borderRadius: '10px',
                        padding: '9px 20px', fontSize: '0.88rem', fontWeight: 700,
                        cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,68,85,0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(201,68,85,0.55)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,68,85,0.4)' }}
                    >
                      ▶ Watch Trailer
                    </button>
                  )}
                  
                  {isLoggedIn && show.show_type === 'series' && show.seasons?.length > 0 && (
                    <button
                      onClick={() => {
                        const acc = document.getElementById('seasonsAccordion')
                        if (acc) {
                          acc.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          setTimeout(() => {
                            const firstBtn = acc.querySelector('.accordion-button.collapsed')
                            if (firstBtn) firstBtn.click()
                          }, 450)
                        }
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: '#fff', border: 'none', borderRadius: '10px',
                        padding: '9px 20px', fontSize: '0.88rem', fontWeight: 700,
                        cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(59,130,246,0.55)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.4)' }}
                    >
                      Browse Episodes
                    </button>
                  )}
                </div>

                {/* Row 2: Watchlist + Mark Watched */}
                {isLoggedIn && (
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <button
                      onClick={() => setShowWlPicker(p => !p)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(255,255,255,0.08)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '10px', padding: '9px 20px', fontSize: '0.88rem', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
                    >
                      ♥ Add to Watchlist
                    </button>
                    {!show.is_watched ? (
                      <button
                        onClick={handleMarkWatched}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                          border: '1px solid rgba(74,222,128,0.28)', borderRadius: '10px',
                          padding: '9px 20px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.18)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.28)' }}
                      >
                        ✓ Mark Watched
                      </button>
                    ) : (() => {
                      const hasRating = show.ratings?.some(r => r.user_id === user?.user_id)
                      return (
                        <button
                          onClick={!hasRating ? handleUnwatch : undefined}
                          onMouseEnter={() => !hasRating && setWatchedHovered(true)}
                          onMouseLeave={() => setWatchedHovered(false)}
                          disabled={hasRating}
                          title={hasRating ? 'Delete your rating first to unwatch' : 'Click to remove from watched'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: hasRating
                              ? 'rgba(74,222,128,0.08)'
                              : watchedHovered ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                            color: hasRating
                              ? 'rgba(74,222,128,0.5)'
                              : watchedHovered ? '#f87171' : '#4ade80',
                            border: `1px solid ${hasRating
                              ? 'rgba(74,222,128,0.2)'
                              : watchedHovered ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.35)'}`,
                            borderRadius: '10px', padding: '9px 20px', fontSize: '0.88rem', fontWeight: 700,
                            cursor: hasRating ? 'not-allowed' : 'pointer', transition: 'all 0.18s',
                          }}
                        >
                          {watchedHovered && !hasRating ? '✕ Unwatch' : '✓ Watched'}
                        </button>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Inline action message */}
            {actionMsg && (
              <div style={{
                padding: '9px 14px', borderRadius: 10, marginBottom: 12, fontSize: '0.85rem',
                background: actionMsg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${actionMsg.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                color: actionMsg.type === 'success' ? '#4ade80' : '#f87171',
              }}>
                {actionMsg.text}
              </div>
            )}

            {/* Genres */}
            {show.genres?.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {show.genres.map(g => <span key={g.genre_id} className="g-badge-genre">{g.name}</span>)}
              </div>
            )}

            {show.plot && <p className="mb-3" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{show.plot}</p>}

            {show.directors?.length > 0 && (
              <p className="small mb-1">
                <strong style={{ color: '#fff' }}>Director: </strong>
                <span className="g-muted">{show.directors.map(d => d.full_name).join(', ')}</span>
              </p>
            )}
            {show.actors?.length > 0 && (
              <p className="small mb-3">
                <strong style={{ color: '#fff' }}>Cast: </strong>
                <span className="g-muted">{show.actors.map(a => a.full_name).join(', ')}</span>
              </p>
            )}

            {/* Tags */}
            <div className="mb-4">
              <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
                <span className="g-dim small">Tags:</span>
                {show.tags?.length > 0
                  ? show.tags.map(t => <span key={t.tag_id} className="g-badge-tag">{t.name}</span>)
                  : <span className="g-dim small">None yet</span>
                }
              </div>
              {isAdmin && allTags.length > 0 && (
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm" style={{ ...INPUT, maxWidth: '200px' }}
                    value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
                    <option value="">Apply a tag...</option>
                    {allTags.map(t => <option key={t.tag_id} value={t.tag_id}>{t.name}</option>)}
                  </select>
                  <button className="btn btn-sm g-btn-ghost" onClick={handleApplyTag}>Apply</button>
                </div>
              )}
            </div>

            {/* Admin: Remove show */}
            {isAdmin && (
              <div className="mt-3">
                <button
                  className="btn btn-sm g-btn-danger px-3"
                  disabled={deleting}
                  onClick={async () => {
                    if (!window.confirm('Are you sure? This will permanently delete this show and all its data (seasons, episodes, ratings, etc).')) return
                    setDeleting(true)
                    try {
                      await api.delete(`/admin/shows/${id}`)
                      navigate('/')
                    } catch (err) {
                      setActionMsg({ type: 'danger', text: err.response?.data?.detail ?? 'Failed to delete show.' })
                      setDeleting(false)
                    }
                  }}
                >
                  {deleting ? 'Removing…' : '🗑 Remove Show'}
                </button>
              </div>
            )}

            {/* Not logged in */}
            {!isLoggedIn && (
              <p className="g-muted small">
                <a href="/login" style={{ color: '#e07080', textDecoration: 'none' }}>Log in</a> to rate, track, or add to watchlist.
              </p>
            )}

          </div>
        </div>

        {/* Movie: Rating + Reviews side by side */}
        {show.show_type !== 'series' && (isLoggedIn || show.ratings?.length > 0) && (
          <div className="mt-5 row g-4 align-items-start">
            {isLoggedIn && (
              <div className="col-md-4">
                <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Rate This Movie</h5>
                <div style={{ ...GLASS, padding: '1.25rem' }}>
                  <form onSubmit={handleRate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 6, flexWrap: 'wrap' }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => {
                          const active = n <= (hoveredStar || parseInt(ratingForm.rating) || 0)
                          const confirmed = !hoveredStar && n <= parseInt(ratingForm.rating || 0)
                          return (
                            <button key={n} type="button"
                              onMouseEnter={() => setHoveredStar(n)}
                              onMouseLeave={() => setHoveredStar(0)}
                              onClick={() => setRatingForm(f => ({ ...f, rating: String(n) }))}
                              style={{
                                background: 'none', border: 'none', padding: '2px 3px',
                                fontSize: '1.55rem', lineHeight: 1, cursor: 'pointer',
                                color: active ? (confirmed ? '#f59e0b' : '#fcd34d') : 'rgba(255,255,255,0.15)',
                                transform: active ? 'scale(1.18)' : 'scale(1)',
                                transition: 'color 0.1s, transform 0.12s',
                                display: 'inline-block',
                              }}
                            >★</button>
                          )
                        })}
                        {ratingForm.rating && (
                          <span style={{ marginLeft: 10, color: '#f59e0b', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                            {ratingForm.rating}<span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: '0.82rem' }}> /10</span>
                          </span>
                        )}
                      </div>
                      <p className="g-dim" style={{ fontSize: '0.72rem', margin: 0 }}>Hover to preview · Click to select</p>
                    </div>
                    <textarea className="form-control" style={{ ...INPUT, resize: 'none', lineHeight: 1.6 }}
                      placeholder="Write your review… (optional)" rows={3}
                      value={ratingForm.review_text} onChange={e => setRatingForm(f => ({ ...f, review_text: e.target.value }))} />
                    <button type="submit" className="btn btn-sm g-btn-accent w-100" disabled={!ratingForm.rating}>Submit Rating</button>
                  </form>
                </div>
              </div>
            )}
            {show.ratings?.length > 0 && (
              <div className={isLoggedIn ? 'col-md-8' : 'col-12'}>
                <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>User Reviews</h5>
                <div className="row g-3">
                  {show.ratings.map(r => (
                    <div key={r.rating_id} className="col-md-6">
                      <div style={{ ...GLASS, padding: '1rem' }}>
                        <div className="d-flex justify-content-between mb-2">
                          <strong style={{ color: '#fff' }}>{r.first_name} {r.last_name}</strong>
                          <span className="g-badge-platform">★ {r.rating}/10</span>
                        </div>
                        {r.review_text && <p className="g-muted small mb-0 fst-italic">"{r.review_text}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seasons & Episodes + TV Rating — side by side */}
        {show.show_type === 'series' && (
          <div className="mt-5 row g-4 align-items-start">

        {/* Left: Seasons & Episodes */}
        {show.seasons?.length > 0 && (
          <div className="col-xl-7 col-lg-7">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <h5 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>
                Seasons &amp; Episodes
                <span className="g-muted fw-normal ms-2" style={{ fontSize: '0.9rem' }}>({show.seasons.length} season{show.seasons.length !== 1 ? 's' : ''})</span>
              </h5>
            </div>
            <div className="accordion" id="seasonsAccordion">
              {show.seasons.map(season => (
                <div key={season.season_id} className="accordion-item"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', marginBottom: '6px', borderRadius: '12px', overflow: 'hidden' }}>
                  <h6 className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#season-${season.season_id}`}
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', boxShadow: 'none', borderRadius: '12px' }}
                    >
                      <span style={{ fontWeight: 600 }}>Season {season.season_number}</span>
                      <span className="g-muted ms-3 fw-normal" style={{ fontSize: '0.85rem' }}>{season.episode_count} episode{season.episode_count !== 1 ? 's' : ''}</span>
                    </button>
                  </h6>
                  <div id={`season-${season.season_id}`} className="accordion-collapse collapse">
                    <div className="accordion-body" style={{ background: 'rgba(0,0,0,0.2)', padding: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {season.episodes.map((ep) => {
                          return (
                            <div
                              key={ep.episode_id}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 10,
                                padding: '10px 12px',
                                display: 'flex', flexDirection: 'column', gap: 5,
                              }}
                            >
                              {/* Crimson episode label */}
                              <span style={{ color: '#c94455', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.03em' }}>
                                S{season.season_number} E{String(ep.episode_number).padStart(2, '0')}
                              </span>

                              {/* Title — 2-line clamp */}
                              {ep.imdb_id
                                ? <a
                                    href={`https://www.imdb.com/title/${ep.imdb_id}/`}
                                    target="_blank" rel="noreferrer"
                                    style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                                  >{ep.title}</a>
                                : <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>{ep.title}</span>
                              }

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4, gap: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 }}>
                                  {ep.air_date && (
                                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                                      {new Date(ep.air_date).toLocaleDateString()}
                                    </span>
                                  )}
                                  {ep.imdb_rating && (
                                    <span className="g-badge-imdb" style={{ fontSize: '0.68rem', padding: '1px 6px', whiteSpace: 'nowrap' }}>★ {ep.imdb_rating}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right col: Rating */}
        {isLoggedIn && (
          <div className="col-xl-5 col-lg-5">
            <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Rate This Series</h5>
            <div style={{ ...GLASS, padding: '1.25rem' }}>
              <form onSubmit={handleRate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 6, flexWrap: 'wrap' }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => {
                      const active = n <= (hoveredStar || parseInt(ratingForm.rating) || 0)
                      const confirmed = !hoveredStar && n <= parseInt(ratingForm.rating || 0)
                      return (
                        <button key={n} type="button"
                          onMouseEnter={() => setHoveredStar(n)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setRatingForm(f => ({ ...f, rating: String(n) }))}
                          style={{
                            background: 'none', border: 'none', padding: '2px 3px',
                            fontSize: '1.55rem', lineHeight: 1, cursor: 'pointer',
                            color: active ? (confirmed ? '#f59e0b' : '#fcd34d') : 'rgba(255,255,255,0.15)',
                            transform: active ? 'scale(1.18)' : 'scale(1)',
                            transition: 'color 0.1s, transform 0.12s',
                            display: 'inline-block',
                          }}
                        >★</button>
                      )
                    })}
                    {ratingForm.rating && (
                      <span style={{ marginLeft: 10, color: '#f59e0b', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                        {ratingForm.rating}<span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: '0.82rem' }}> /10</span>
                      </span>
                    )}
                  </div>
                  <p className="g-dim" style={{ fontSize: '0.72rem', margin: 0 }}>Hover to preview · Click to select</p>
                </div>
                <textarea className="form-control" style={{ ...INPUT, resize: 'none', lineHeight: 1.6 }}
                  placeholder="Write your review… (optional)" rows={3}
                  value={ratingForm.review_text} onChange={e => setRatingForm(f => ({ ...f, review_text: e.target.value }))} />
                <button type="submit" className="btn btn-sm g-btn-accent w-100" disabled={!ratingForm.rating}>Submit Rating</button>
              </form>
            </div>
          </div>
        )}

          </div>
        )}

        {/* User Reviews — TV series only (movies get reviews in the side-by-side block above) */}
        {show.show_type === 'series' && show.ratings?.length > 0 && (
          <div className="mt-5">
            <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>User Reviews</h5>
            <div className="row g-3">
              {show.ratings.map(r => (
                <div key={r.rating_id} className="col-md-6">
                  <div style={{ ...GLASS, padding: '1rem' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <strong style={{ color: '#fff' }}>{r.first_name} {r.last_name}</strong>
                      <span className="g-badge-platform">★ {r.rating}/10</span>
                    </div>
                    {r.review_text && <p className="g-muted small mb-0 fst-italic">"{r.review_text}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
