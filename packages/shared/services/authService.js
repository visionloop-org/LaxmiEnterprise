// Authentication service for FastAPI backend
import { backendApiClient, AuthError } from './backendApi.js'

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
    
    // Store token expiry time (assuming 30 minutes from backend config)
    const expiryTime = Date.now() + (30 * 60 * 1000) - (5 * 60 * 1000) // 5 minutes before actual expiry
    localStorage.setItem('auth_token_expiry', expiryTime.toString())
    
    return data
  }

  async getCurrentUser() {
    try {
      return await backendApiClient.get('/auth/me')
    } catch (error) {
      // Token might be expired
      if (error instanceof AuthError) {
        await this.refreshToken()
        return await backendApiClient.get('/auth/me')
      }
      this.logout()
      throw error
    }
  }

  async refreshToken() {
    // Prevent multiple refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        // For now, we'll re-login since the backend doesn't have a refresh endpoint
        // In a production system, you'd have a /auth/refresh endpoint
        const storedCredentials = localStorage.getItem('auth_credentials')
        if (storedCredentials) {
          const { username, password } = JSON.parse(storedCredentials)
          await this.login(username, password)
        } else {
          this.logout()
          throw new AuthError('No stored credentials for refresh')
        }
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async ensureAuthenticated() {
    if (!this.isAuthenticated()) {
      throw new AuthError('Not authenticated')
    }

    // Check if token is about to expire
    const expiryTime = parseInt(localStorage.getItem('auth_token_expiry') || '0')
    if (Date.now() >= expiryTime) {
      await this.refreshToken()
    }
  }

  storeCredentials(username, password) {
    localStorage.setItem('auth_credentials', JSON.stringify({ username, password }))
  }

  clearCredentials() {
    localStorage.removeItem('auth_credentials')
  }

  loginWithCredentials(username, password) {
    this.storeCredentials(username, password)
    return this.login(username, password)
  }

  logout() {
    backendApiClient.setToken(null)
    this.clearCredentials()
    localStorage.removeItem('auth_token_expiry')
  }

  isAuthenticated() {
    return !!backendApiClient.token
  }

  getToken() {
    return backendApiClient.token
  }
}

export const authService = new AuthService()
