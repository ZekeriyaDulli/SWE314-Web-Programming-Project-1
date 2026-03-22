import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }
const CARD = { ...GLASS, padding: '1rem', height: '100%', transition: 'transform 0.2s, border-color 0.2s' }

export default function WatchlistsPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [watchlists, setWatchlists] = useState([])
  const [error, setError] = useState(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    api.get('/watchlists').then(r => setWatchlists(r.data)).catch(err => setError(err.response?.data?.detail ?? 'Failed to load.'))
  }, [isLoggedIn])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/watchlists', { name: newName, description: newDesc })
      setWatchlists(w => [...w, data]); setNewName(''); setNewDesc(''); setShowForm(false)
    } catch (err) { setError(err.response?.data?.detail ?? 'Failed to create.') }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/watchlists/${deleteId}`)
      setWatchlists(w => w.filter(x => x.watchlist_id !== deleteId)); setDeleteId(null)
    } catch (err) { setError(err.response?.data?.detail ?? 'Failed to delete.') }
  }

  return (
    <div className="g-page">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.4px' }}>My Watchlists</h2>
          <button className="btn btn-sm g-btn-accent px-4" onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : '+ New Watchlist'}
          </button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {showForm && (
          <form onSubmit={handleCreate} style={{ ...GLASS, padding: '1rem', marginBottom: '1.5rem' }}>
            <div className="row g-2">
              <div className="col-md-4">
                <input type="text" className="form-control form-control-sm" style={INPUT}
                  placeholder="Watchlist name *" required value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="col-md-6">
                <input type="text" className="form-control form-control-sm" style={INPUT}
                  placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-sm g-btn-accent w-100">Create</button>
              </div>
            </div>
          </form>
        )}

        {watchlists.length === 0 ? (
          <div className="text-center py-5 g-muted">No watchlists yet. Create one above!</div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
            {watchlists.map(w => (
              <div key={w.watchlist_id} className="col">
                <div style={CARD}>
                  <h6 style={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}>{w.name}</h6>
                  {w.description && (
                    <p className="g-muted small mb-2" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{w.description}</p>
                  )}
                  <small className="g-dim">{w.items_count ?? 0} items · {w.created_at}</small>
                  <div className="d-flex gap-2 mt-3">
                    <Link to={`/watchlists/${w.watchlist_id}`} className="btn btn-sm g-btn-ghost flex-grow-1">View</Link>
                    <button className="btn btn-sm g-btn-danger" onClick={() => setDeleteId(w.watchlist_id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: '#fff' }}>Delete Watchlist?</h5>
                <button className="btn-close btn-close-white" onClick={() => setDeleteId(null)} />
              </div>
              <div className="modal-body g-muted">This action cannot be undone.</div>
              <div className="modal-footer">
                <button className="btn btn-sm g-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-sm g-btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
