import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'

const GLASS = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '20px',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)',
  padding: '2rem',
}
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.access_token, data.user); navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Login failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="g-page d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 1rem' }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '2.8rem' }}>🎬</div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.5px' }} className="mt-2 mb-1">Welcome back</h2>
          <p className="g-muted small">Sign in to continue</p>
        </div>

        <div style={GLASS}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="g-label">Email</label>
              <input type="email" className="form-control" style={INPUT} required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="mb-4">
              <label className="g-label">Password</label>
              <div style={{ display: 'flex' }}>
                <input type={showPw ? 'text' : 'password'} className="form-control" required
                  style={{ ...INPUT, borderRadius: '10px 0 0 10px', borderRight: 'none', flex: 1 }}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderLeft: 'none', borderRadius: '0 10px 10px 0', color: 'rgba(255,255,255,0.5)', padding: '0 12px', cursor: 'pointer' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn w-100 g-btn-accent py-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
          <p className="text-center g-muted mt-3 mb-0 small">
            No account?{' '}
            <Link to="/register" style={{ color: '#e07080', textDecoration: 'none', fontWeight: 600 }}>Register now</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
