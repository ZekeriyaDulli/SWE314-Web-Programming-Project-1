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

  const handleStartSync = async () => {
    setError(null)
    try {
      await api.post('/admin/sync/start')
      setStatus(s => ({ ...s, status: 'running', message: 'Sync started...' }))
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
      <div className="container py-4" style={{ maxWidth: '600px' }}>
        <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px' }} className="mb-4">Sync with OMDb API</h2>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div style={{ ...GLASS, padding: '1.5rem' }}>
          <p className="g-muted small mb-4">
            Fetches updated metadata (including seasons &amp; episodes for TV series) and posters for all titles from OMDb.
          </p>

          <button className="btn btn-sm g-btn-accent px-4 mb-4" disabled={isRunning} onClick={handleStartSync}
            style={{ opacity: isRunning ? 0.6 : 1 }}>
            {isRunning ? '⟳ Syncing...' : '▶ Start Sync'}
          </button>

          {status.status !== 'idle' && (
            <>
              <div className="mb-3">
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
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.8px', color: statusColor }}>
                ● {status.status.toUpperCase()}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
