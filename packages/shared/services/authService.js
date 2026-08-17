const { backendApiClient, AuthError } = require('./backendApi')
const { config } = require('../utils/config')

class AuthService {
  constructor() {
    this.refreshPromise = null
  }

  async login(username, password) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${backendApiClient.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Login failed')
    }

    const data = await response.json()
    backendApiClient.setToken(data.access_token)
    
    // Store token expiry
    const expiryTime = Date.now() + (data.expires_in || 1800) * 1000
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(config.auth.expiryKey, expiryTime.toString())
    }
    
    return data
  }

  async loginWithCredentials(username, password) {
    const result = await this.login(username, password)
    // Store credentials for auto-refresh in development
    if (typeof localStorage !== 'undefined' && config.isDevelopment) {
      localStorage.setItem(config.auth.credentialsKey, JSON.stringify({ username, password }))
    }
    return result
  }

  async refreshToken() {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        const storedCredentials = typeof localStorage !== 'undefined' ? localStorage.getItem(config.auth.credentialsKey) : null
        if (!storedCredentials) {
          throw new AuthError('No stored credentials for token refresh')
        }

        const { username, password } = JSON.parse(storedCredentials)
        const result = await this.login(username, password)
        return result.access_token
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async checkAndRefreshToken() {
    if (typeof localStorage === 'undefined') return
    const expiryTime = localStorage.getItem(config.auth.expiryKey)
    if (!expiryTime) return

    const timeUntilExpiry = parseInt(expiryTime) - Date.now()
    
    // If token expires in less than threshold, refresh it
    if (timeUntilExpiry < config.auth.tokenRefreshThreshold && timeUntilExpiry > 0) {
      try {
        await this.refreshToken()
      } catch (error) {
        console.warn('Background token refresh failed:', error)
      }
    }
  }

  logout() {
    backendApiClient.setToken(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(config.auth.credentialsKey)
      localStorage.removeItem(config.auth.expiryKey)
    }
  }

  isAuthenticated() {
    return !!backendApiClient.token
  }

  getToken() {
    return backendApiClient.token
  }
}

const authService = new AuthService()

module.exports = authService
module.exports.authService = authService
module.exports.AuthService = AuthService
