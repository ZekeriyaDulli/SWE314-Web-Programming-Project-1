import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }

export default function ChangePasswordPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_new_password: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isLoggedIn) { navigate('/login'); return null }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_new_password) {
      setError('New passwords do not match.')
      return
    }
    setLoading(true); setError(null); setSuccess(null)
    try {
      const { data } = await api.post('/auth/change-password', form)
      setSuccess(data.detail)
      setForm({ current_password: '', new_password: '', confirm_new_password: '' })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="g-page">
      <div className="container py-4" style={{ maxWidth: '480px' }}>
        <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px' }} className="mb-4">Change Password</h2>

        <div style={{ ...GLASS, padding: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small g-muted">Current Password</label>
              <input
                type="password"
                name="current_password"
                className="form-control form-control-sm"
                style={INPUT}
                value={form.current_password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small g-muted">New Password</label>
              <input
                type="password"
                name="new_password"
                className="form-control form-control-sm"
                style={INPUT}
                value={form.new_password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small g-muted">Confirm New Password</label>
              <input
                type="password"
                name="confirm_new_password"
                className="form-control form-control-sm"
                style={INPUT}
                value={form.confirm_new_password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-sm g-btn-accent px-4" disabled={loading}>
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </form>

          {error && <p style={{ color: '#f87171', fontSize: '0.82rem', margin: '12px 0 0', fontWeight: 600 }}>{error}</p>}
          {success && <p style={{ color: '#4ade80', fontSize: '0.82rem', margin: '12px 0 0', fontWeight: 600 }}>{success}</p>}
        </div>
      </div>
    </div>
  )
}
