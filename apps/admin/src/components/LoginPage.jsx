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

export default function LoginPage({ onLoginSuccess }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.target)
    try {
      await authService.loginWithCredentials(fd.get('username'), fd.get('password'))
      onLoginSuccess()
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏢</div>
        <h2>Laxmi Enterprise</h2>
        <p className="login-desc">Admin &amp; Payroll Portal</p>
        <form onSubmit={handleSubmit}>
          <input name="username" placeholder="Gmail ID or Username" required disabled={loading} />
          <input name="password" type="password" placeholder="Password (Optional for Gmail)" disabled={loading} />
          <InlineError message={error} />
          <button type="submit" disabled={loading} className={loading ? 'loading' : ''}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="login-hint">Enter your registered Gmail ID (from Users_Roles) or admin</p>
      </div>
    </div>
  )
}
