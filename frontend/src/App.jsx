import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import ShowDetailPage from './pages/ShowDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WatchlistsPage from './pages/WatchlistsPage'
import WatchlistDetailPage from './pages/WatchlistDetailPage'
import HistoryPage from './pages/HistoryPage'
import AdminUploadPage from './pages/AdminUploadPage'
import AdminSyncPage from './pages/AdminSyncPage'
import ChangePasswordPage from './pages/ChangePasswordPage'

/* Fixed ambient orbs — these sit behind ALL content and give
   the frosted glass something colourful to blur through.      */
const AmbientOrbs = () => (
  <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
    {/* Crimson — top left */}
    <div style={{
      position: 'absolute', top: '-10%', left: '-8%',
      width: '600px', height: '600px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(129,38,46,0.7) 0%, transparent 65%)',
      filter: 'blur(80px)',
      animation: 'orbA 20s ease-in-out infinite alternate',
    }} />
    {/* Deep rose — bottom right */}
    <div style={{
      position: 'absolute', bottom: '-15%', right: '-10%',
      width: '700px', height: '700px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(100,20,40,0.55) 0%, transparent 65%)',
      filter: 'blur(100px)',
      animation: 'orbB 25s ease-in-out infinite alternate',
    }} />
    {/* Dark wine — center */}
    <div style={{
      position: 'absolute', top: '40%', left: '35%',
      width: '500px', height: '500px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(70,15,25,0.3) 0%, transparent 65%)',
      filter: 'blur(120px)',
    }} />
    <style>{`
      @keyframes orbA {
        from { transform: translate(0px, 0px) scale(1); }
        to   { transform: translate(80px, 100px) scale(1.15); }
      }
      @keyframes orbB {
        from { transform: translate(0px, 0px) scale(1); }
        to   { transform: translate(-70px, -80px) scale(1.1); }
      }
    `}</style>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AmbientOrbs />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/shows/:id" element={<ShowDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/watchlists" element={<WatchlistsPage />} />
          <Route path="/watchlists/:id" element={<WatchlistDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/admin/upload" element={<AdminUploadPage />} />
          <Route path="/admin/sync" element={<AdminSyncPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
