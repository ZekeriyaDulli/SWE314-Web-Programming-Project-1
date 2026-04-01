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

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
    setLoading(true); setError(null)
    try {
      const { data } = await api.post('/auth/register', form)
      const { data: user } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
      login(data.access_token, user); navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  const f = (field) => ({ value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) })

  return (
    <div className="g-page d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 1rem' }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '2.8rem' }}>🎬</div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.5px' }} className="mt-2 mb-1">Create Account</h2>
          <p className="g-muted small">Join Movie Archive today</p>
        </div>

        <div style={GLASS}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col">
                <label className="g-label">First Name</label>
                <input type="text" className="form-control" style={INPUT} required minLength={2} {...f('first_name')} />
              </div>
              <div className="col">
                <label className="g-label">Last Name</label>
                <input type="text" className="form-control" style={INPUT} required minLength={2} {...f('last_name')} />
              </div>
            </div>
            <div className="mb-3">
              <label className="g-label">Email</label>
              <input type="email" className="form-control" style={INPUT} required {...f('email')} />
            </div>
            <div className="mb-3">
              <label className="g-label">Password <span className="g-dim">(min 6 chars)</span></label>
              <input type="password" className="form-control" style={INPUT} required minLength={6} {...f('password')} />
            </div>
            <div className="mb-4">
              <label className="g-label">Confirm Password</label>
              <input type="password" className="form-control" style={INPUT} required minLength={6} {...f('confirm_password')} />
            </div>
            <button type="submit" className="btn w-100 g-btn-accent py-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          <p className="text-center g-muted mt-3 mb-0 small">
            Have an account?{' '}
            <Link to="/login" style={{ color: '#e07080', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
