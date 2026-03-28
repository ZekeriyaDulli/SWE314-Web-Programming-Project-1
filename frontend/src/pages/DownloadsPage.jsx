import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_META = {
  queued:      { color: '#94a3b8', label: 'Queued' },
  searching:   { color: '#fbbf24', label: 'Searching…' },
  collecting:  { color: '#fbbf24', label: 'Preparing…' },
  downloading: { color: '#60a5fa', label: 'Downloading' },
  done:        { color: '#4ade80', label: 'Complete' },
  error:       { color: '#f87171', label: 'Error' },
}

function StatusBadge({ status }) {
  const { color, label } = STATUS_META[status] || { color: '#fff', label: status }
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
      color, background: `${color}18`, border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>
      ● {label}
    </span>
  )
}

// ── Byte / time formatters ─────────────────────────────────────────────────────
function fmtBytes(b) {
  if (!b || b === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, n = b
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(1)} ${units[i]}`
}

function fmtEta(s) {
  if (!s || s <= 0) return null
  s = Math.round(s)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}m ${sec}s`
}

// ── Mini progress bar ──────────────────────────────────────────────────────────
function MiniBar({ pct }) {
  return (
    <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', minWidth: 80 }}>
      <div style={{
        height: '100%', borderRadius: 4,
        background: 'linear-gradient(90deg, #c94455, #e07080)',
        width: `${Math.min(pct, 100)}%`,
        transition: 'width 0.5s ease',
        boxShadow: '0 0 6px rgba(201,68,85,0.5)',
      }} />
    </div>
  )
}

// ── Movie job card ─────────────────────────────────────────────────────────────
function MovieJobCard({ job, onCancel, onPause, onResume, onRetryMovie, onClear }) {
  const prog  = job.movie_progress || {}
  const total = prog.total || 0
  const dl    = prog.downloaded || 0
  const pct   = total > 0 ? Math.round((dl / total) * 100) : 0
  const isDone = job.status === 'done' || job.status === 'error'

  return (
    <div style={CARD_STYLE}>
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span style={{ color: '#fff', fontWeight: 700 }}>{job.show_title}</span>
          <span className="g-dim" style={{ fontSize: '0.78rem' }}>Movie</span>
          <StatusBadge status={job.status} />
        </div>
        <JobActions job={job} onCancel={onCancel} onPause={onPause} onResume={onResume} onClear={onClear} />
      </div>

      {job.status === 'downloading' && (
        <>
          <div className="mb-1 d-flex justify-content-between" style={{ fontSize: '0.8rem' }}>
            <span className="g-muted">{fmtBytes(dl)} / {total > 0 ? fmtBytes(total) : '?'}</span>
            <span className="g-muted">{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              height: '100%', borderRadius: 6,
              background: 'linear-gradient(90deg, #c94455, #81262E)',
              width: `${pct}%`, transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(201,68,85,0.5)',
            }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            {[
              prog.speed  ? `${fmtBytes(prog.speed)}/s` : null,
              fmtEta(prog.eta),
              prog.fragment || null,
            ].filter(Boolean).join(' · ')}
          </div>
        </>
      )}

      {isDone && prog.success !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: prog.success ? '#4ade80' : '#f87171' }}>
            {prog.success ? '✅ Downloaded successfully' : '❌ Download failed'}
          </p>
          {prog.success === false && (
            <button
              onClick={() => onRetryMovie(job.job_id)}
              style={{ ...BTN_BASE, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.72rem', padding: '2px 10px' }}
            >
              ↻ Retry
            </button>
          )}
        </div>
      )}

      {job.status === 'error' && job.error_msg && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#f87171' }}>{job.error_msg}</p>
      )}

      {['queued', 'searching', 'collecting'].includes(job.status) && (
        <p className="g-dim small mb-0">
          {job.status === 'queued'     && 'Waiting to start…'}
          {job.status === 'searching'  && 'Searching…'}
          {job.status === 'collecting' && 'Preparing download…'}
        </p>
      )}
    </div>
  )
}

// ── Series job card ────────────────────────────────────────────────────────────
function SeriesJobCard({ job, onCancel, onPause, onResume, onRetryEpisode, onClear, onCancelEpisode, onPauseEpisode, onResumeEpisode }) {
  const episodes = job.episodes || {}
  const total    = job.episodes_total || 0
  const done     = job.episodes_done  || 0
  const failed   = job.episodes_failed || 0

  // Byte-based overall progress (smooth, real-time)
  const allEpsList = Object.values(episodes)
  const totalBytes = allEpsList.reduce((s, e) => s + (e.total || 0), 0)
  const dlBytes    = allEpsList.reduce((s, e) => s + (e.downloaded || 0), 0)
  const overallPct = totalBytes > 0
    ? Math.round((dlBytes / totalBytes) * 100)
    : total > 0 ? Math.round((done / total) * 100) : 0

  // Group episodes by season
  const bySeasonMap = {}
  Object.entries(episodes).forEach(([id, ep]) => {
    const s = ep.season
    if (!bySeasonMap[s]) bySeasonMap[s] = []
    bySeasonMap[s].push({ id, ...ep })
  })
  const seasonNums = Object.keys(bySeasonMap).map(Number).sort((a, b) => a - b)

  return (
    <div style={CARD_STYLE}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span style={{ color: '#fff', fontWeight: 700 }}>{job.show_title}</span>
          <span className="g-dim" style={{ fontSize: '0.78rem' }}>TV Series</span>
          {total > 0 && (
            <span className="g-dim" style={{ fontSize: '0.78rem' }}>
              {done}/{total} episodes
              {failed > 0 && <span style={{ color: '#f87171' }}> · {failed} failed</span>}
            </span>
          )}
          <StatusBadge status={job.status} />
        </div>
        <JobActions job={job} onCancel={onCancel} onPause={onPause} onResume={onResume} onClear={onClear} />
      </div>

      {/* Overall progress bar (only when downloading or done) */}
      {['downloading', 'done'].includes(job.status) && total > 0 && (
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.78rem' }}>
            <span className="g-muted">Overall progress</span>
            <span className="g-muted">{overallPct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              background: 'linear-gradient(90deg, #c94455, #81262E)',
              width: `${overallPct}%`, transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(201,68,85,0.5)',
            }} />
          </div>
        </div>
      )}

      {/* Status messages for early phases */}
      {['queued', 'searching', 'collecting'].includes(job.status) && (
        <p className="g-dim small mb-0">
          {job.status === 'queued'     && 'Waiting to start…'}
          {job.status === 'searching'  && 'Searching…'}
          {job.status === 'collecting' && 'Preparing… (this may take a while)'}
        </p>
      )}

      {job.status === 'error' && job.error_msg && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#f87171' }}>{job.error_msg}</p>
      )}

      {/* Specials / pilot notification */}
      {job.specials?.length > 0 && (
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: '0.82rem',
        }}>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
            Found {job.specials.length} special/pilot episode{job.specials.length > 1 ? 's' : ''}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
            {job.specials.map(s => s.title).join(' · ')}
          </span>
        </div>
      )}

      {/* Season accordion — only shown when episodes are known */}
      {seasonNums.length > 0 && (
        <div className="accordion" id={`dl-acc-${job.job_id}`}>
          {seasonNums.map(sNum => {
            const eps   = bySeasonMap[sNum] || []
            const sDone = eps.filter(e => e.success === true).length
            const sFail = eps.filter(e => e.success === false).length
            const sTotal = eps.length
            const collapseId = `dl-${job.job_id}-s${sNum}`

            return (
              <div
                key={sNum}
                className="accordion-item"
                style={{ marginBottom: 6, borderRadius: 10, overflow: 'hidden' }}
              >
                <h6 className="accordion-header">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${collapseId}`}
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', boxShadow: 'none', borderRadius: 10 }}
                  >
                    <span style={{ fontWeight: 600 }}>Season {sNum}</span>
                    <span className="g-muted ms-3 fw-normal" style={{ fontSize: '0.82rem' }}>
                      {sDone}/{sTotal} done
                      {sFail > 0 && <span style={{ color: '#f87171' }}> · {sFail} failed</span>}
                    </span>
                  </button>
                </h6>

                <div id={collapseId} className="accordion-collapse collapse">
                  <div className="accordion-body" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[...eps].sort((a, b) => a.episode - b.episode).map((ep) => {
                        const epTotal  = ep.total || 0
                        const epDl     = ep.downloaded || 0
                        const epPct    = epTotal > 0 ? Math.round((epDl / epTotal) * 100) : 0
                        const isActive = ep.success === null && ep.downloaded > 0
                        const epIds = job._grouped ? job._jobs.map(j => j.job_id) : [job.job_id]
                        return (
                          <div
                            key={ep.id}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 8,
                              padding: '8px 10px',
                              display: 'flex', flexDirection: 'column', gap: 4,
                            }}
                          >
                            {/* Crimson episode label */}
                            <span style={{ color: '#c94455', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.03em' }}>
                              S{ep.season} E{String(ep.episode).padStart(2, '0')}
                            </span>

                            {/* Title — 2-line clamp */}
                            <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.82rem', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                              {ep.title || `Episode ${ep.episode}`}
                            </span>

                            {/* Progress / status */}
                            <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                              {ep.success === true  && <span style={{ fontSize: '0.82rem' }}>✅</span>}
                              {ep.success === false && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: '0.82rem' }}>❌</span>
                                  <button
                                    onClick={() => onRetryEpisode(job._grouped ? job._jobs.map(j => j.job_id) : [job.job_id], ep.id)}
                                    style={{ ...BTN_BASE, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.62rem', padding: '2px 7px' }}
                                  >
                                    ↻ Retry
                                  </button>
                                </div>
                              )}
                              {ep.success === null && isActive && (
                                <>
                                  <MiniBar pct={epPct} />
                                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginTop: 2 }}>
                                    {[ep.speed ? `${fmtBytes(ep.speed)}/s` : null, fmtEta(ep.eta)].filter(Boolean).join(' · ')} · {epPct}%
                                  </span>
                                  {/* Per-episode pause/cancel */}
                                  <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                                    {ep.is_paused
                                      ? <button style={{ ...BTN_RESUME, fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => onResumeEpisode(epIds, ep.id)}>▶</button>
                                      : <button style={{ ...BTN_PAUSE,  fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => onPauseEpisode(epIds, ep.id)}>⏸</button>
                                    }
                                    <button style={{ ...BTN_CANCEL, fontSize: '0.72rem', padding: '4px 10px' }} onClick={() => onCancelEpisode(epIds, ep.id)}>✕</button>
                                  </div>
                                </>
                              )}
                              {ep.success === null && !isActive && (
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Pending</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Job action buttons ─────────────────────────────────────────────────────────
const BTN_BASE   = { border: 'none', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', cursor: 'pointer' }
const BTN_PAUSE  = { ...BTN_BASE, background: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
const BTN_RESUME = { ...BTN_BASE, background: 'rgba(74,222,128,0.12)',  color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }
const BTN_CANCEL = { ...BTN_BASE, background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }

function JobActions({ job, onCancel, onPause, onResume, onClear }) {
  // For grouped jobs, operate on all underlying job IDs
  const ids = job._grouped ? job._jobs.map(j => j.job_id) : [job.job_id]

  if (['done', 'error'].includes(job.status)) {
    return (
      <div className="d-flex gap-1 flex-shrink-0">
        <button
          style={{ ...BTN_BASE, background: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' }}
          onClick={() => onClear(ids)}
        >
          ✕ Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="d-flex gap-1 flex-shrink-0">
      {job.is_paused
        ? <button style={BTN_RESUME} onClick={() => onResume(ids)}>▶ Resume</button>
        : <button style={BTN_PAUSE}  onClick={() => onPause(ids)}>⏸ Pause</button>
      }
      <button style={BTN_CANCEL} onClick={() => onCancel(ids)}>✕ Cancel</button>
    </div>
  )
}

// ── Group series jobs by show_id ───────────────────────────────────────────────
const STATUS_ORDER = ['done', 'error', 'queued', 'searching', 'collecting', 'downloading']

function mergeSeriesJobs(jobs) {
  const movieJobs   = jobs.filter(j => j.show_type !== 'series')
  const seriesJobs  = jobs.filter(j => j.show_type === 'series')

  const byShow = {}
  for (const job of seriesJobs) {
    if (!byShow[job.show_id]) byShow[job.show_id] = []
    byShow[job.show_id].push(job)
  }

  const mergedSeries = Object.values(byShow).map(group => {
    if (group.length === 1) return group[0]

    const merged = {
      _grouped:        true,
      _jobs:           group,
      job_id:          group[0].job_id,
      show_id:         group[0].show_id,
      show_title:      group[0].show_title,
      show_type:       'series',
      started_at:      Math.min(...group.map(j => j.started_at)),
      episodes:        {},
      episodes_total:  0,
      episodes_done:   0,
      episodes_failed: 0,
      status:          'done',
      is_paused:       false,
      error_msg:       null,
    }

    for (const job of group) {
      Object.assign(merged.episodes, job.episodes || {})
      merged.episodes_total  += job.episodes_total  || 0
      merged.episodes_done   += job.episodes_done   || 0
      merged.episodes_failed += job.episodes_failed || 0
      if (STATUS_ORDER.indexOf(job.status) > STATUS_ORDER.indexOf(merged.status)) {
        merged.status    = job.status
        merged.error_msg = job.error_msg
      }
      if (job.is_paused) merged.is_paused = true
    }
    return merged
  })

  return [...movieJobs, ...mergedSeries].sort((a, b) => b.started_at - a.started_at)
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const CARD_STYLE = {
  background:          'rgba(255,255,255,0.05)',
  backdropFilter:      'blur(16px) saturate(180%)',
  WebkitBackdropFilter:'blur(16px) saturate(180%)',
  border:              '1px solid rgba(255,255,255,0.10)',
  borderRadius:        16,
  boxShadow:           '0 4px 30px rgba(0,0,0,0.3)',
  padding:             '1.25rem',
  marginBottom:        16,
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DownloadsPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [jobs,        setJobs]        = useState([])
  const [error,       setError]       = useState(null)
  const [downloadDir, setDownloadDir] = useState('')
  const [dirLoading,  setDirLoading]  = useState(false)
  const intervalRef = useRef(null)

  const handleBrowse = async () => {
    setDirLoading(true)
    try {
      const r = await api.get('/downloads/pick-directory')
      if (!r.data.cancelled) setDownloadDir(r.data.directory)
    } catch {}
    setDirLoading(false)
  }

  const stopPolling  = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }
  const startPolling = () => {
    stopPolling()
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/downloads/my')
        setJobs(data)
        const anyActive = data.some(j => !['done', 'error'].includes(j.status))
        if (!anyActive) stopPolling()
      } catch { stopPolling() }
    }, 2000)
  }

  const handleCancel = async (ids) => {
    const list = Array.isArray(ids) ? ids : [ids]
    await Promise.all(list.map(id => api.post(`/downloads/cancel/${id}`).catch(() => {})))
  }
  const handlePause = async (ids) => {
    const list = Array.isArray(ids) ? ids : [ids]
    await Promise.all(list.map(id => api.post(`/downloads/pause/${id}`).catch(() => {})))
  }
  const handleResume = async (ids) => {
    const list = Array.isArray(ids) ? ids : [ids]
    await Promise.all(list.map(id => api.post(`/downloads/resume/${id}`).catch(() => {})))
    startPolling()
  }

  // Optimistically update a specific episode's fields in local state
  const _updateEpLocal = (identifier, patch) => {
    setJobs(prev => prev.map(j => {
      const eps = j.episodes
      if (!eps || !(identifier in eps)) return j
      return { ...j, episodes: { ...eps, [identifier]: { ...eps[identifier], ...patch } } }
    }))
  }

  const _refreshJobs = async () => {
    try { const { data } = await api.get('/downloads/my'); setJobs(data) } catch {}
  }

  const handleCancelEpisode = async (jobIds, identifier) => {
    const list = Array.isArray(jobIds) ? jobIds : [jobIds]
    await Promise.all(list.map(jid => api.post('/downloads/cancel-episode', { job_id: jid, identifier }).catch(() => {})))
    _updateEpLocal(identifier, { success: false })
    _refreshJobs()
  }
  const handlePauseEpisode = async (jobIds, identifier) => {
    const list = Array.isArray(jobIds) ? jobIds : [jobIds]
    await Promise.all(list.map(jid => api.post('/downloads/pause-episode', { job_id: jid, identifier }).catch(() => {})))
    _updateEpLocal(identifier, { is_paused: true })
    _refreshJobs()
  }
  const handleResumeEpisode = async (jobIds, identifier) => {
    const list = Array.isArray(jobIds) ? jobIds : [jobIds]
    await Promise.all(list.map(jid => api.post('/downloads/resume-episode', { job_id: jid, identifier }).catch(() => {})))
    _updateEpLocal(identifier, { is_paused: false })
    _refreshJobs()
  }

  const handleRetryEpisode = async (jobIds, identifier) => {
    const list = Array.isArray(jobIds) ? jobIds : [jobIds]
    for (const jid of list) {
      try {
        await api.post('/downloads/retry-episode', { job_id: jid, identifier })
        startPolling()
        break  // only retry in the job that owns this episode
      } catch {}
    }
  }

  const handleRetryMovie = async (jobId) => {
    try {
      await api.post('/downloads/retry-movie', { job_id: jobId })
      startPolling()
    } catch {}
  }

  const handleClear = async (ids) => {
    const list = Array.isArray(ids) ? ids : [ids]
    await Promise.all(list.map(id => api.delete(`/downloads/clear/${id}`).catch(() => {})))
    setJobs(prev => prev.filter(j => !list.includes(j.job_id)))
  }

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }

    api.get('/downloads/directory')
      .then(r => setDownloadDir(r.data.directory))
      .catch(() => {})

    api.get('/downloads/my')
      .then(r => {
        setJobs(r.data)
        const anyActive = r.data.some(j => !['done', 'error'].includes(j.status))
        if (anyActive) startPolling()
      })
      .catch(err => setError(err.response?.data?.detail ?? 'Failed to load downloads.'))

    return () => stopPolling()
  }, [isLoggedIn])

  return (
    <div className="g-page">
      <div className="container py-5" style={{ maxWidth: 780 }}>

        <div className="mb-4">
          <h4 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>My Downloads</h4>
          <p className="g-muted small mb-0">Downloads run in the background on the server.</p>
        </div>

        {/* Download directory */}
        <div style={{ ...CARD_STYLE, marginBottom: 20, padding: '1rem 1.25rem' }}>
          <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Download Directory
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', color: 'rgba(255,255,255,0.7)', padding: '8px 12px',
              fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              {downloadDir || 'Loading…'}
            </span>
            <button
              onClick={handleBrowse}
              disabled={dirLoading}
              style={{
                flexShrink: 0,
                background: 'rgba(96,165,250,0.13)', border: '1px solid rgba(96,165,250,0.35)',
                borderRadius: '10px', color: '#60a5fa', padding: '8px 16px',
                fontSize: '0.85rem', fontWeight: 700,
                cursor: dirLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {dirLoading ? '…' : '📁 Browse'}
            </button>
          </div>
          <p className="g-dim" style={{ fontSize: '0.72rem', margin: '5px 0 0' }}>
            Opens a folder picker on the server. Applied to all new downloads.
          </p>
        </div>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {jobs.length === 0 && !error && (
          <div style={{ ...CARD_STYLE, textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0 }}>No downloads yet.</p>
            <p className="g-dim small mt-1 mb-0">
              Go to any show and click <strong style={{ color: 'rgba(255,255,255,0.5)' }}>↓ Download</strong>.
            </p>
          </div>
        )}

        {mergeSeriesJobs(jobs).map(job =>
          job.show_type === 'series'
            ? <SeriesJobCard key={job.job_id} job={job} onCancel={handleCancel} onPause={handlePause} onResume={handleResume} onRetryEpisode={handleRetryEpisode} onClear={handleClear} onCancelEpisode={handleCancelEpisode} onPauseEpisode={handlePauseEpisode} onResumeEpisode={handleResumeEpisode} />
            : <MovieJobCard  key={job.job_id} job={job} onCancel={handleCancel} onPause={handlePause} onResume={handleResume} onRetryMovie={handleRetryMovie} onClear={handleClear} />
        )}

      </div>
    </div>
  )
}
