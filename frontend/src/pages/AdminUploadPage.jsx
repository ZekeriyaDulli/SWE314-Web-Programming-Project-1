import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }

export default function AdminUploadPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  // CSV upload state
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Single IMDb ID state
  const [imdbId, setImdbId] = useState('')
  const [addResult, setAddResult] = useState(null)
  const [addError, setAddError] = useState(null)
  const [addLoading, setAddLoading] = useState(false)

  if (!isAdmin) { navigate('/'); return null }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await api.post('/admin/upload-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddShow = async (e) => {
    e.preventDefault()
    const id = imdbId.trim()
    if (!id) return
    setAddLoading(true); setAddError(null); setAddResult(null)
    try {
      const { data } = await api.post('/admin/add-show', { imdb_id: id })
      setAddResult(data)
      setImdbId('')
    } catch (err) {
      setAddError(err.response?.data?.detail ?? 'Failed to add show.')
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="g-page">
      <div className="container py-4" style={{ maxWidth: '600px' }}>
        <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px' }} className="mb-4">Add Movies</h2>

        {/* Single IMDb ID */}
        <div style={{ ...GLASS, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p className="g-muted small mb-3">Add a single show by its IMDb ID (e.g., <code style={{ color: '#e8909a' }}>tt1375666</code>)</p>
          <form onSubmit={handleAddShow} className="d-flex gap-2 align-items-start">
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ ...INPUT, flex: 1 }}
              placeholder="tt1375666"
              value={imdbId}
              onChange={e => setImdbId(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-sm g-btn-accent px-4 flex-shrink-0" disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add'}
            </button>
          </form>
          {addError && <p style={{ color: '#f87171', fontSize: '0.82rem', margin: '8px 0 0' }}>{addError}</p>}
          {addResult && (
            <p style={{ color: addResult.inserted ? '#4ade80' : '#fbbf24', fontSize: '0.82rem', margin: '8px 0 0', fontWeight: 600 }}>
              {addResult.inserted ? '✅' : '⏭️'} {addResult.detail}
            </p>
          )}
        </div>

        {/* CSV upload */}
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div style={{ ...GLASS, padding: '1.5rem' }}>
          <p className="g-muted small mb-3">Or upload a CSV with multiple IMDb IDs (one per row)</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3 d-flex align-items-center gap-3">
              <input
                type="file"
                id="csvFile"
                style={{ display: 'none' }}
                accept=".csv"
                required
                onChange={e => setFile(e.target.files[0])}
              />
              <label
                htmlFor="csvFile"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 18px', cursor: 'pointer', fontSize: '0.85rem',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, color: 'rgba(255,255,255,0.7)',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
              >
                📁 {file ? file.name : 'Choose CSV file…'}
              </label>
            </div>
            <button type="submit" className="btn btn-sm g-btn-accent px-4" disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>

        {result && (
          <div style={{ ...GLASS, padding: '1rem', marginTop: '1.5rem', borderColor: 'rgba(40,167,69,0.35)' }}>
            <p style={{ color: '#4ade80', fontWeight: 700 }} className="mb-2">Upload complete!</p>
            <p className="g-muted small mb-0">✅ Inserted: {result.inserted} · ⏭️ Skipped: {result.skipped}</p>
            {result.errors?.length > 0 && (
              <ul className="mt-2 mb-0 small g-muted">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
