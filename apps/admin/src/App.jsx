import { useState, useEffect } from 'react'
import { authService, createLogger, getPerformanceMonitor } from '@laxmi/shared'
import AdminDashboard from './components/AdminDashboard.jsx'
import LoginPage from './components/LoginPage.jsx'
import './App.css'

// Initialize logger and performance monitor
const logger = createLogger('AdminApp')
const performanceMonitor = getPerformanceMonitor()

export default function App() {
  const [authed, setAuthed] = useState(() => authService.isAuthenticated())
  const [currentUser, setCurrentUser] = useState(() => authService.getUser())

  // Initialize performance monitoring on mount
  useEffect(() => {
    logger.info('Admin app initializing')
    performanceMonitor.initialize()
    
    return () => {
      performanceMonitor.cleanup()
    }
  }, [])

  const logout = () => {
    logger.info('User logout', { user: currentUser?.name })
    authService.logout()
    setAuthed(false)
    setCurrentUser(null)
  }

  const handleLoginSuccess = () => {
    logger.info('User login successful', { user: currentUser?.name })
    setAuthed(authService.isAuthenticated())
    setCurrentUser(authService.getUser())
  }

  if (!authed) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  // Enforce Admin RBAC: If logged in as a Supervisor, guide them to the Supervisor app
  if (!authService.isAdmin()) {
    return (
      <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#f8fafc', padding: '24px' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '20px', padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📱</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>Supervisor Access Verified</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
            Welcome, <strong style={{ color: '#38bdf8' }}>{currentUser?.name || 'Supervisor'}</strong>.<br />
            You are authenticated with <span style={{ color: '#34d399', fontWeight: 'bold' }}>Supervisor</span> credentials.
          </p>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '14px', marginBottom: '24px', fontSize: '0.82rem', color: '#93c5fd', textAlign: 'left', lineHeight: '1.4' }}>
            ℹ️ The <strong>Admin &amp; Payroll Portal</strong> requires Administrator privileges. Please open the <strong>Supervisor Tablet App</strong> to mark attendance and manage fleet operations.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href="../supervisor/"
              style={{ display: 'inline-block', width: '100%', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#10b981', color: '#ffffff', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none', textAlign: 'center', transition: 'background 0.2s' }}
            >
              Open Supervisor Tablet App &rarr;
            </a>
            <button
              type="button"
              onClick={logout}
              style={{ width: '100%', padding: '10px 16px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Logout / Switch Account
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <AdminDashboard onLogout={logout} />
}
