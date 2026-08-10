// Direct REST API client for FastAPI backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Custom error classes
class NetworkError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'NetworkError'
    this.status = status
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthError'
  }
}

class ValidationError extends Error {
  constructor(message, details) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

class BackendApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('auth_token')
    this.requestInterceptors = []
    this.responseInterceptors = []
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor)
  }

  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor)
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async requestWithTimeout(url, config, timeout = DEFAULT_TIMEOUT) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout', 408)
      }
      throw error
    }
  }

  async retryRequest(endpoint, options, retryCount = 0) {
    try {
      return await this.request(endpoint, options)
    } catch (error) {
      if (retryCount >= MAX_RETRIES) {
        throw error
      }

      // Retry on 5xx errors or network errors
      if (error instanceof NetworkError && (error.status >= 500 || !error.status)) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.retryRequest(endpoint, options, retryCount + 1)
      }

      throw error
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    // Apply request interceptors
    let config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config) || config
    }

    try {
      const response = await this.requestWithTimeout(url, config)
      
      // Apply response interceptors
      let processedResponse = response
      for (const interceptor of this.responseInterceptors) {
        processedResponse = interceptor(processedResponse) || processedResponse
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }))
        
        // Handle specific error types
        if (response.status === 401) {
          throw new AuthError(error.detail || error.message || 'Authentication failed')
        } else if (response.status === 422) {
          throw new ValidationError(error.detail || error.message || 'Validation failed', error)
        } else if (response.status >= 500) {
          throw new NetworkError(error.detail || error.message || `Server error: ${response.status}`, response.status)
        } else {
          throw new NetworkError(error.detail || error.message || `HTTP ${response.status}`, response.status)
        }
      }

      return await response.json()
    } catch (error) {
      console.error(`Backend API Error [${endpoint}]:`, error)
      throw error
    }
  }

  get(endpoint, options = {}) {
    return this.retryRequest(endpoint, { ...options, method: 'GET' })
  }

  post(endpoint, data, options = {}) {
    return this.retryRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  put(endpoint, data, options = {}) {
    return this.retryRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  patch(endpoint, data, options = {}) {
    return this.retryRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  delete(endpoint, options = {}) {
    return this.retryRequest(endpoint, { ...options, method: 'DELETE' })
  }
}

export const backendApiClient = new BackendApiClient()
export { NetworkError, AuthError, ValidationError }
