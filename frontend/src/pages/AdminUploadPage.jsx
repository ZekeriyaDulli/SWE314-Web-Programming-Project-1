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
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="g-page">
      <div className="container py-4" style={{ maxWidth: '600px' }}>
        <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px' }} className="mb-4">Upload Movies CSV</h2>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div style={{ ...GLASS, padding: '1.5rem' }}>
          <p className="g-muted small mb-3">CSV format: one IMDb ID per row (e.g., <code style={{ color: '#e8909a' }}>tt1375666</code>)</p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input type="file" className="form-control" style={INPUT} accept=".csv" required
                onChange={e => setFile(e.target.files[0])} />
            </div>
            <button type="submit" className="btn btn-sm g-btn-accent px-4" disabled={loading}>
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
