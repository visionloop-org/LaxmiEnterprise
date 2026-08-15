// @ts-nocheck
// Direct REST API client for FastAPI backend communication
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Custom error classes
class APIError extends Error {
  constructor(message, status, code = 'API_ERROR', details = null, requestId = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

class NetworkError extends APIError {
  constructor(message, status = 503, requestId = null) {
    super(message, status, 'NETWORK_ERROR', null, requestId)
    this.name = 'NetworkError'
  }
}

class AuthError extends APIError {
  constructor(message, requestId = null) {
    super(message, 401, 'UNAUTHORIZED', null, requestId)
    this.name = 'AuthError'
  }
}

class ValidationError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 422, 'VALIDATION_ERROR', details, requestId)
    this.name = 'ValidationError'
  }
}

class ConflictError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 409, 'CONFLICT', details, requestId)
    this.name = 'ConflictError'
  }
}

class NotFoundError extends APIError {
  constructor(message, requestId = null) {
    super(message, 404, 'NOT_FOUND', null, requestId)
    this.name = 'NotFoundError'
  }
}

class BackendApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
    this.requestInterceptors = []
    this.responseInterceptors = []
  }

  setToken(token) {
    this.token = token
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
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

  buildUrl(endpoint) {
    let base = (this.baseURL || '/api/v1').replace(/\/+$/, '')
    let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    
    // Guard against duplicate /api/v1 or /api prefixes
    if (base.endsWith('/api/v1') && path.startsWith('/api/v1')) {
      path = path.substring(7) // remove '/api/v1'
      if (!path.startsWith('/')) path = `/${path}`
    } else if (base.endsWith('/api') && path.startsWith('/api/')) {
      path = path.substring(4) // remove '/api'
      if (!path.startsWith('/')) path = `/${path}`
    }
    
    return `${base}${path}`
  }

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint)
    
    let config = {
      method: options.method || 'GET',
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
      const requestId = response.headers.get('X-Request-ID') || null
      
      let processedResponse = response
      for (const interceptor of this.responseInterceptors) {
        processedResponse = interceptor(processedResponse) || processedResponse
      }
      
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Network or Proxy Error' }))
        
        // Standardized backend error extraction
        const errorInfo = body.error || {}
        const message = errorInfo.message || body.detail || body.message || `HTTP ${response.status}`
        const code = errorInfo.code || (response.status === 401 ? 'UNAUTHORIZED' : response.status === 404 ? 'NOT_FOUND' : response.status === 409 ? 'CONFLICT' : response.status === 422 ? 'VALIDATION_ERROR' : 'API_ERROR')
        const details = errorInfo.details || body.detail || null

        if (response.status === 401) {
          throw new AuthError(message, requestId)
        } else if (response.status === 404) {
          throw new NotFoundError(message, requestId)
        } else if (response.status === 409) {
          throw new ConflictError(message, details, requestId)
        } else if (response.status === 422) {
          throw new ValidationError(message, details, requestId)
        } else if (response.status >= 500) {
          throw new NetworkError(message, response.status, requestId)
        } else {
          throw new APIError(message, response.status, code, details, requestId)
        }
      }

      return await response.json()
    } catch (error) {
      if (!(error instanceof APIError)) {
        console.error(`Backend API Error [${endpoint}]:`, error)
      }
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
export {
  APIError,
  NetworkError,
  AuthError,
  ValidationError,
  ConflictError,
  NotFoundError
}
