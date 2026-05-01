import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1040,
        background: 'rgba(18, 10, 16, 0.85)',
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.35)',
      }}
    >
      <div className="container">
        {/* Brand */}
        <Link to="/" className="g-brand navbar-brand mb-0">🎥 Movie Archive</Link>

        {/* Mobile hamburger */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-controls="navMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ color: 'rgba(255,255,255,0.7)', boxShadow: 'none' }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Collapsible menu */}
        <div className="collapse navbar-collapse" id="navMenu">
          <div className="d-flex align-items-center gap-3 py-2 py-lg-0">
            <Link to="/browse" className="btn btn-sm g-btn-ghost px-3" style={{ fontWeight: 600 }}>Browse</Link>
          </div>
          <div className="ms-auto d-flex align-items-center gap-2 flex-wrap py-2 py-lg-0">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="btn btn-sm g-btn-ghost px-4">Login</Link>
                <Link to="/register" className="btn btn-sm g-btn-accent px-4">Register</Link>
              </>
            ) : (
              <>
                {/* Admin dropdown */}
                {isAdmin && (
                  <div className="dropdown">
                    <button className="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown"
                      style={{
                        background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        color: '#f59e0b',
                        borderRadius: '10px',
                        fontWeight: 600,
                      }}>
                      Admin
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><Link className="dropdown-item" to="/admin/upload">Add Movies</Link></li>
                      <li><Link className="dropdown-item" to="/admin/sync">Sync OMDb</Link></li>
                    </ul>
                  </div>
                )}

                {/* User dropdown */}
                <div className="dropdown">
                  <button className="btn btn-sm g-btn-ghost px-3 dropdown-toggle" data-bs-toggle="dropdown">
                    {user?.first_name} {user?.last_name}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link className="dropdown-item" to="/watchlists">My Watchlists</Link></li>
                    <li><Link className="dropdown-item" to="/history">Watch History</Link></li>
                    <li><Link className="dropdown-item" to="/downloads">My Downloads</Link></li>
                    <li><Link className="dropdown-item" to="/change-password">Change Password</Link></li>
                    <li><hr className="dropdown-divider g-divider" /></li>
                    <li>
                      <button className="dropdown-item" style={{ color: '#f87171' }} onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
