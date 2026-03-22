import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1040,
      background: 'rgba(18, 10, 16, 0.65)',
      backdropFilter: 'blur(20px) saturate(200%)',
      WebkitBackdropFilter: 'blur(20px) saturate(200%)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 4px 30px rgba(0,0,0,0.35)',
    }}>
      <div className="container d-flex align-items-center py-2">
        {/* Brand */}
        <Link to="/" className="g-brand me-auto">🎬 Movie Archive</Link>

        {/* Mobile toggle */}
        <button className="navbar-toggler border-0 d-lg-none me-2" type="button"
          data-bs-toggle="collapse" data-bs-target="#navMenu"
          style={{ color: 'rgba(255,255,255,0.6)', background: 'transparent' }}>
          <span className="navbar-toggler-icon" />
        </button>

        {/* Links */}
        <div className="collapse navbar-collapse d-lg-flex justify-content-end" id="navMenu">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="btn btn-sm g-btn-ghost px-4">Login</Link>
                <Link to="/register" className="btn btn-sm g-btn-accent px-4">Register</Link>
              </>
            ) : (
              <>
                {/* User dropdown */}
                <div className="dropdown">
                  <button className="btn btn-sm g-btn-ghost px-3 dropdown-toggle" data-bs-toggle="dropdown">
                    {user?.first_name} {user?.last_name}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link className="dropdown-item" to="/watchlists">My Watchlists</Link></li>
                    <li><Link className="dropdown-item" to="/history">Watch History</Link></li>
                    <li><hr className="dropdown-divider g-divider" /></li>
                    <li>
                      <button className="dropdown-item" style={{ color: '#f87171' }} onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>

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
                      <li><Link className="dropdown-item" to="/admin/upload">Upload CSV</Link></li>
                      <li><Link className="dropdown-item" to="/admin/sync">Sync OMDb</Link></li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
