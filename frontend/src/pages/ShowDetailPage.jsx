import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'
import PosterImage from '../components/PosterImage'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }

export default function ShowDetailPage() {
  const { id } = useParams()
  const { isLoggedIn, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(null)
  const [watchlists, setWatchlists] = useState([])
  const [allTags, setAllTags] = useState([])
  const [error, setError] = useState(null)
  const [ratingForm, setRatingForm] = useState({ rating: '', review_text: '' })
  const [actionMsg, setActionMsg] = useState(null)
  const [selectedWl, setSelectedWl] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  useEffect(() => {
    api.get(`/shows/${id}`)
      .then(r => setShow(r.data))
      .catch(err => setError(err.response?.data?.detail ?? 'Failed to load movie.'))

    if (isAdmin) api.get('/tags').then(r => setAllTags(r.data)).catch(() => {})
    if (isLoggedIn) api.get('/watchlists').then(r => setWatchlists(r.data)).catch(() => {})
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

            {/* Meta row */}
            <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
              {show.show_type === 'series' && <span className="g-badge-series">TV Series</span>}
              {show.release_year && <span className="g-muted">{show.release_year}</span>}
              {show.show_type === 'series' && show.total_seasons
                ? <span className="g-muted">{show.total_seasons} season{show.total_seasons !== 1 ? 's' : ''}</span>
                : show.duration_minutes > 0 && <span className="g-muted">{show.duration_minutes} min</span>
              }
              {show.imdb_rating && <span className="g-badge-imdb">IMDb {show.imdb_rating}</span>}
              {show.platform_avg && <span className="g-badge-platform">★ {Number(show.platform_avg).toFixed(1)} platform</span>}
            </div>

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

            {/* Not logged in */}
            {!isLoggedIn && (
              <p className="g-muted small">
                <a href="/login" style={{ color: '#e07080', textDecoration: 'none' }}>Log in</a> to rate, track, or add to watchlist.
              </p>
            )}

            {/* Rate + Watchlist — side by side */}
            {isLoggedIn && (
              <div className="row g-3">

                {/* Left: Rate */}
                <div className="col-lg-7">
                  <div style={{ ...GLASS, padding: '1.25rem', height: '100%' }}>
                    <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>
                      Rate This {show.show_type === 'series' ? 'Series' : 'Movie'}
                    </h6>
                    {actionMsg && (
                      <div style={{
                        padding: '8px 12px', borderRadius: '10px', marginBottom: '12px', fontSize: '0.85rem',
                        background: actionMsg.type === 'success' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                        border: `1px solid ${actionMsg.type === 'success' ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
                        color: actionMsg.type === 'success' ? '#4ade80' : '#f87171',
                      }}>{actionMsg.text}</div>
                    )}
                    <form onSubmit={handleRate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input type="number" className="form-control form-control-sm" style={INPUT}
                        placeholder="Rating 1–10" min="1" max="10" required
                        value={ratingForm.rating} onChange={e => setRatingForm(f => ({ ...f, rating: e.target.value }))} />
                      <textarea className="form-control" style={{ ...INPUT, resize: 'none', lineHeight: 1.6 }}
                        placeholder="Write your review... (optional)" rows={4}
                        value={ratingForm.review_text} onChange={e => setRatingForm(f => ({ ...f, review_text: e.target.value }))} />
                      <button type="submit" className="btn btn-sm g-btn-accent w-100">Submit Rating</button>
                    </form>
                  </div>
                </div>

                {/* Right: Watchlist + Mark Watched */}
                <div className="col-lg-5">
                  <div style={{ ...GLASS, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
                    <h6 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Add to Watchlist</h6>
                    {watchlists.length === 0 ? (
                      <p className="g-dim small mb-0">No watchlists yet. <a href="/watchlists" style={{ color: '#e07080', textDecoration: 'none' }}>Create one</a>.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                        {watchlists.map(w => (
                          <button key={w.watchlist_id}
                            onClick={() => { setSelectedWl(w.watchlist_id.toString()); handleAddToWatchlistDirect(w.watchlist_id) }}
                            style={{
                              background: selectedWl === w.watchlist_id.toString() ? 'rgba(201,68,85,0.2)' : 'rgba(255,255,255,0.05)',
                              border: selectedWl === w.watchlist_id.toString() ? '1px solid rgba(201,68,85,0.5)' : '1px solid rgba(255,255,255,0.10)',
                              borderRadius: '10px', color: '#fff', padding: '7px 12px',
                              fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
                              textAlign: 'left', transition: 'all 0.18s',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,68,85,0.15)'; e.currentTarget.style.borderColor = 'rgba(201,68,85,0.4)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = selectedWl === w.watchlist_id.toString() ? 'rgba(201,68,85,0.2)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = selectedWl === w.watchlist_id.toString() ? 'rgba(201,68,85,0.5)' : 'rgba(255,255,255,0.10)' }}
                          >
                            + {w.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {!show.is_watched && (
                      <button className="btn btn-sm mt-auto" style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', borderRadius: '10px', fontWeight: 600 }}
                        onClick={handleMarkWatched}>✓ Mark as Watched</button>
                    )}
                    {show.is_watched && (
                      <span className="g-badge-watched text-center mt-auto">✓ Already Watched</span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Seasons & Episodes */}
        {show.show_type === 'series' && show.seasons?.length > 0 && (
          <div className="mt-5">
            <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>
              Seasons &amp; Episodes
              <span className="g-muted fw-normal ms-2" style={{ fontSize: '0.9rem' }}>({show.seasons.length} season{show.seasons.length !== 1 ? 's' : ''})</span>
            </h5>
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
                    <div className="accordion-body" style={{ background: 'rgba(0,0,0,0.25)', padding: 0 }}>
                      <table className="table table-sm mb-0"
                        style={{ '--bs-table-bg': 'transparent', '--bs-table-color': 'rgba(255,255,255,0.85)', '--bs-table-border-color': 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '48px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: '0.78rem', background: 'transparent', textTransform: 'uppercase' }}>#</th>
                            <th style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: '0.78rem', background: 'transparent', textTransform: 'uppercase' }}>Title</th>
                            <th style={{ width: '110px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: '0.78rem', background: 'transparent', textTransform: 'uppercase' }}>Air Date</th>
                            <th style={{ width: '80px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: '0.78rem', textAlign: 'right', background: 'transparent', textTransform: 'uppercase' }}>IMDb</th>
                          </tr>
                        </thead>
                        <tbody>
                          {season.episodes.map(ep => (
                            <tr key={ep.episode_id} style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                              <td className="g-muted" style={{ background: 'transparent' }}>{ep.episode_number}</td>
                              <td style={{ background: 'transparent' }}>
                                {ep.imdb_id
                                  ? <a href={`https://www.imdb.com/title/${ep.imdb_id}/`} target="_blank" rel="noreferrer"
                                      style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}
                                      onMouseEnter={e => e.target.style.color = '#fff'}
                                      onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.85)'}
                                    >{ep.title}</a>
                                  : <span>{ep.title}</span>
                                }
                              </td>
                              <td className="g-muted" style={{ fontSize: '0.82rem', background: 'transparent' }}>
                                {ep.air_date ? new Date(ep.air_date).toLocaleDateString() : '—'}
                              </td>
                              <td style={{ textAlign: 'right', background: 'transparent' }}>
                                {ep.imdb_rating
                                  ? <span className="g-badge-imdb">★ {ep.imdb_rating}</span>
                                  : <span className="g-dim">—</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Reviews */}
        {show.ratings?.length > 0 && (
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
