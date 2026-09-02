import { useState } from 'react'
import { authService } from '@laxmi/shared'

function InlineError({ message }) {
  if (!message) return null
  return (
    <div className="login-error" role="alert">
      <svg className="login-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}

export default function LoginPage({ onLoginSuccess }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGoogleInput, setShowGoogleInput] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')

  const handleLogin = async (usernameOrEmail, password = '') => {
    setError('')
    setLoading(true)
    try {
      await authService.loginWithCredentials(usernameOrEmail, password)
      onLoginSuccess()
    } catch (err) {
      setError(err.message || 'Authentication failed. Check credentials or Users_Roles sheet.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    handleLogin(fd.get('username'), fd.get('password'))
  }

  const handleGoogleSubmit = (e) => {
    e.preventDefault()
    if (!googleEmail.trim()) return
    handleLogin(googleEmail.trim())
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏢</div>
        <h2>Laxmi Enterprise</h2>
        <p className="login-desc">Admin &amp; Payroll Portal</p>

        {/* Google Authentication (100% Free Forever) */}
        {!showGoogleInput ? (
          <button
            type="button"
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              fontWeight: '600',
              padding: '10px 16px',
              borderRadius: '8px',
              width: '100%',
              marginBottom: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onClick={() => setShowGoogleInput(true)}
            disabled={loading}
          >
            <GoogleLogo />
            <span>Sign in with Google</span>
          </button>
        ) : (
          <form onSubmit={handleGoogleSubmit} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
                style={{ flex: 1, margin: 0 }}
              />
              <button
                type="submit"
                className="btn btn-blue"
                disabled={loading}
                style={{ whiteSpace: 'nowrap' }}
              >
                Verify ➔
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleInput(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </form>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '11px',
          margin: '12px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#334155' }} />
          <span style={{ padding: '0 8px' }}>OR CREDENTIALS</span>
          <div style={{ flex: 1, height: '1px', background: '#334155' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <input name="username" placeholder="Gmail ID or Username" required disabled={loading} />
          <input name="password" type="password" placeholder="Password (Optional for Gmail)" disabled={loading} />
          <InlineError message={error} />
          <button type="submit" disabled={loading} className={loading ? 'loading' : ''}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Access Pills */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '10px' }}>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px 0' }}>Quick Access (Demo / Offline):</p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ fontSize: '11px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #0284c7' }}
              onClick={() => handleLogin('visionloop.in@gmail.com')}
              disabled={loading}
            >
              👑 Vision Loop
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ fontSize: '11px', backgroundColor: '#1e293b', color: '#a78bfa', border: '1px solid #7c3aed' }}
              onClick={() => handleLogin('admin', 'password123')}
              disabled={loading}
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
