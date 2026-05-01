import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import ErrorBanner from '../components/ErrorBanner'

const GLASS = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }
const INPUT = { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff' }
const CARD = { ...GLASS, padding: '1rem', height: '100%', transition: 'transform 0.2s, border-color 0.2s' }
const MODAL_BACKDROP = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const MODAL_BOX = { ...GLASS, padding: '1.5rem', width: '100%', maxWidth: '440px', margin: '1rem' }

export default function WatchlistsPage() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [watchlists, setWatchlists] = useState([])
  const [error, setError] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  
  // Edit modal state
  const [editWl, setEditWl] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return }
    api.get('/watchlists').then(r => setWatchlists(r.data)).catch(err => setError(err.response?.data?.detail ?? 'Failed to load.'))
  }, [isLoggedIn])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/watchlists', { name: newName, description: newDesc || null })
      setWatchlists(w => [...w, data])
      setNewName(''); setNewDesc(''); setShowCreateModal(false)
    } catch (err) { setError(err.response?.data?.detail ?? 'Failed to create.') }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put(`/watchlists/${editWl.watchlist_id}`, {
        name: editWl.name, description: editWl.description || null
      })
      setWatchlists(w => w.map(x => x.watchlist_id === data.watchlist_id ? data : x))
      setEditWl(null)
    } catch (err) { setError(err.response?.data?.detail ?? 'Failed to update.') }
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
          <button className="btn g-btn-accent px-4 py-2" style={{ fontSize: '0.9rem', fontWeight: 700 }}
            onClick={() => setShowCreateModal(true)}>
            + New Watchlist
          </button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

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
                    <button className="btn btn-sm g-btn-ghost" onClick={() => setEditWl({ watchlist_id: w.watchlist_id, name: w.name, description: w.description || '' })}>Edit</button>
                    <button className="btn btn-sm g-btn-danger" onClick={() => setDeleteId(w.watchlist_id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

            {/* Create Modal */}
      {showCreateModal && (
        <div style={MODAL_BACKDROP} onClick={() => setShowCreateModal(false)}>
          <div style={MODAL_BOX} onClick={e => e.stopPropagation()}>
            <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Create Watchlist</h5>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="form-label g-muted small">Name *</label>
                <input type="text" className="form-control" style={INPUT} required
                  value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Weekend Binge" autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label g-muted small">Description</label>
                <textarea className="form-control" style={{ ...INPUT, resize: 'vertical' }} rows={3}
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Optional description..." />
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-sm g-btn-ghost px-4" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm g-btn-accent px-4">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editWl && (
        <div style={MODAL_BACKDROP} onClick={() => setEditWl(null)}>
          <div style={MODAL_BOX} onClick={e => e.stopPropagation()}>
            <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>Edit Watchlist</h5>
            <form onSubmit={handleEdit}>
              <div className="mb-3">
                <label className="form-label g-muted small">Name *</label>
                <input type="text" className="form-control" style={INPUT} required
                  value={editWl.name} onChange={e => setEditWl(w => ({ ...w, name: e.target.value }))}
                  autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label g-muted small">Description</label>
                <textarea className="form-control" style={{ ...INPUT, resize: 'vertical' }} rows={3}
                  value={editWl.description} onChange={e => setEditWl(w => ({ ...w, description: e.target.value }))} />
              </div>  
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-sm g-btn-ghost px-4" onClick={() => setEditWl(null)}>Cancel</button>
                <button type="submit" className="btn btn-sm g-btn-accent px-4">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div style={MODAL_BACKDROP} onClick={() => setDeleteId(null)}>
          <div style={MODAL_BOX} onClick={e => e.stopPropagation()}>
            <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Delete Watchlist?</h5>
            <p className="g-muted mb-3">This action cannot be undone.</p>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-sm g-btn-ghost px-4" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-sm g-btn-danger px-4" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
