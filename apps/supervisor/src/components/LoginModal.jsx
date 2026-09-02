import { useState } from 'react'
import { authService, NetworkError, AuthError, ValidationError } from '@laxmi/shared'

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

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showGoogleInput, setShowGoogleInput] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')

  const handleAuth = async (userOrEmail, pass = '') => {
    setError('')
    setIsLoading(true)

    try {
      await authService.loginWithCredentials(userOrEmail, pass)
      onLoginSuccess()
    } catch (err) {
      if (err instanceof NetworkError) {
        setError('Network error. Please check your connection.')
      } else if (err instanceof AuthError) {
        setError('Invalid username or password.')
      } else if (err instanceof ValidationError) {
        setError('Invalid input. Please check your credentials.')
      } else {
        setError(err.message || 'Login failed. Please check Users_Roles in Google Sheets.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleAuth(username, password)
  }

  const handleGoogleSubmit = (e) => {
    e.preventDefault()
    if (!googleEmail.trim()) return
    handleAuth(googleEmail.trim())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl text-slate-100">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">📱</div>
          <h2 className="text-xl font-bold text-white">
            Laxmi Enterprise — Supervisor Tablet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Attendance &amp; Fleet Logistics Portal
          </p>
        </div>

        {/* Google Authentication (100% Free Forever) */}
        {!showGoogleInput ? (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold py-2.5 px-4 rounded-lg shadow transition mb-4 text-sm"
            onClick={() => setShowGoogleInput(true)}
            disabled={isLoading}
          >
            <GoogleLogo />
            <span>Sign in with Google Account</span>
          </button>
        ) : (
          <form onSubmit={handleGoogleSubmit} className="mb-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Enter registered Gmail ID:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="supervisor@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
                className="flex-1 px-3 py-1.5 text-sm bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50"
              >
                Sign In
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleInput(false)}
              className="text-xs text-slate-400 hover:text-slate-200 mt-2 block"
            >
              ← Back to standard login
            </button>
          </form>
        )}

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="px-3 text-xs text-slate-400 uppercase tracking-wider">or credentials</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-300 mb-1">
              Username or Gmail
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="e.g. supervisor or Gmail"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
              Password (Optional for Gmail)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-950/60 border border-red-800 p-2.5 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition shadow disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Fast Shift Supervisor Tap */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 mb-2">Quick 1-Tap Access:</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => handleAuth('supervisor')}
              disabled={isLoading}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1 rounded border border-slate-700"
            >
              📱 Shift Supervisor
            </button>
            <button
              type="button"
              onClick={() => handleAuth('visionloop.in@gmail.com')}
              disabled={isLoading}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1 rounded border border-slate-700"
            >
              👑 Vision Loop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
