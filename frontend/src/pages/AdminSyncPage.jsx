import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }

export default function AdminSyncPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState({ status: 'idle', current: 0, total: 0, message: '', progress_percentage: 0 })
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const [forceSync, setForceSync] = useState(false)
  const [cleanupResult, setCleanupResult] = useState(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  
  if (!isAdmin) { navigate('/'); return null }

  const stopPolling = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null } }

  const startPolling = () => {
    stopPolling()
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await api.get('/admin/sync/status')
        setStatus(data)
        if (data.status === 'complete' || data.status === 'error') stopPolling()
      } catch { stopPolling() }
    }, 2000)
  }

  const handleCleanup = async () => {
    setError(null); setCleanupResult(null); setCleanupLoading(true)
    try {
      const { data } = await api.post('/admin/cleanup-unaired')
      setCleanupResult(data.detail)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Cleanup failed.')
    } finally { setCleanupLoading(false) }
  }

  const handleStartSync = async (missingOnly = false) => {
    setError(null)
    try {
      const url = missingOnly
        ? '/admin/sync/start-missing'
        : `/admin/sync/start${forceSync ? '?force=true' : ''}`
      await api.post(url)
      setStatus(s => ({ ...s, status: 'running', message: missingOnly ? 'Syncing missing values...' : 'Sync started...' }))
      startPolling()
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to start sync.')
    }
  }

  useEffect(() => () => stopPolling(), [])

  const pct = Math.round(status.progress_percentage || 0)
  const isRunning = status.status === 'running'

  const statusColor = status.status === 'complete' ? '#4ade80'
    : status.status === 'error' ? '#f87171'
    : '#e07080'

  return (
    <div className="g-page">
      <div className="container py-4" style={{ maxWidth: '680px' }}>
        <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px' }} className="mb-4">Admin — Sync & Maintenance</h2>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {/* Sync Operations */}
        <div style={{ ...GLASS, padding: '1.5rem', marginBottom: '1rem' }}>
          <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Sync Operations</h6>
          <p className="g-muted small mb-3">
            Fetches metadata (including seasons & episodes for TV series), posters, and trailers from OMDb / YouTube.
          </p>

          <div className="d-flex gap-3 flex-wrap align-items-start">
            <div>
              <button className="btn btn-sm g-btn-accent px-4" disabled={isRunning} onClick={() => handleStartSync(false)}
                style={{ opacity: isRunning ? 0.6 : 1 }}>
                {isRunning ? 'Syncing...' : 'Full Sync'}
              </button>
              <p className="g-muted mt-1" style={{ fontSize: '0.72rem' }}>
                Syncs un-synced titles (or all if force enabled)
              </p>
            </div>
            <div>
              <button className="btn btn-sm px-4" disabled={isRunning} onClick={() => handleStartSync(true)}
                style={{
                  opacity: isRunning ? 0.6 : 1,
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  color: '#fbbf24',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}>
                {isRunning ? 'Syncing...' : 'Sync Missing Only'}
              </button>
              <p className="g-muted mt-1" style={{ fontSize: '0.72rem' }}>Only titles missing metadata, poster, or trailer</p>
            </div>
          </div>

          <label className="d-flex align-items-center gap-2 mt-2" style={{ cursor: isRunning ? 'default' : 'pointer', opacity: isRunning ? 0.5 : 1 }}>
            <input type="checkbox" checked={forceSync} onChange={e => setForceSync(e.target.checked)} disabled={isRunning}
              style={{ accentColor: '#c94455' }} />
            <span className="g-muted" style={{ fontSize: '0.78rem' }}>Force re-sync all (ignore sync flags, use with Full Sync)</span>
          </label>
        </div>

          {/* Maintenance */}
        <div style={{ ...GLASS, padding: '1.5rem', marginBottom: '1rem' }}>
          <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Maintenance</h6>
          <button className="btn btn-sm g-btn-danger px-4" disabled={cleanupLoading} onClick={handleCleanup}
            style={{ opacity: cleanupLoading ? 0.6 : 1 }}>
            {cleanupLoading ? 'Cleaning...' : 'Cleanup Unaired Episodes'}
          </button>
          <p className="g-muted mt-1" style={{ fontSize: '0.72rem' }}>Removes episodes with no air date or future air dates, and seasons left empty</p>
          {cleanupResult && <p style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600, marginTop: 6 }}>{cleanupResult}</p>}
        </div>

        {/* Progress */}
        {status.status !== 'idle' && (
          <div style={{ ...GLASS, padding: '1.5rem' }}>
            <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Progress</h6>
            <div className="d-flex justify-content-between mb-2">
              <small className="g-muted">{status.message}</small>
              <small className="g-muted">{status.current}/{status.total} · {pct}%</small>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: status.status === 'error'
                  ? '#f87171'
                  : 'linear-gradient(90deg, #c94455, #81262E)',
                borderRadius: '3px',
                transition: 'width 0.5s ease',
                boxShadow: '0 0 8px rgba(201,68,85,0.5)',
              }} />
            </div>
            <div className="mt-2">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.8px', color: statusColor }}>
                {status.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
