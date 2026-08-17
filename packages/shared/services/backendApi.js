const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) || '/api/v1'
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
const { generateRequestId } = require('../utils/requestId')
const logger = require('../utils/logger')
const { config } = require('../utils/config')

// Custom error classes
class APIError extends Error {
  constructor(message, status, code = 'API_ERROR', details = null, requestId = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
    this.userMessage = this.getUserFriendlyMessage()
  }

  getUserFriendlyMessage() {
    switch (this.code) {
      case 'API_ERROR':
        return 'An unexpected error occurred. Please try again.'
      case 'INTERNAL_SERVER_ERROR':
        return 'Server error occurred. Our team has been notified.'
      default:
        return this.message
    }
  }
}

class NetworkError extends APIError {
  constructor(message, status = 503, requestId = null) {
    super(message, status, 'NETWORK_ERROR', null, requestId)
    this.name = 'NetworkError'
  }

  getUserFriendlyMessage() {
    return 'Network connection issue. Please check your internet connection and try again.'
  }
}

class AuthError extends APIError {
  constructor(message, requestId = null) {
    super(message, 401, 'UNAUTHORIZED', null, requestId)
    this.name = 'AuthError'
  }

  getUserFriendlyMessage() {
    return 'Your session has expired. Please log in again to continue.'
  }
}

class ValidationError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 422, 'VALIDATION_ERROR', details, requestId)
    this.name = 'ValidationError'
  }

  getUserFriendlyMessage() {
    if (this.details && Array.isArray(this.details)) {
      const errors = this.details.map(err => 
        typeof err === 'string' ? err : err.msg || JSON.stringify(err)
      ).join(', ')
      return `Please correct the following errors: ${errors}`
    }
    return 'Please check your input and try again.'
  }
}

class ConflictError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 409, 'CONFLICT', details, requestId)
    this.name = 'ConflictError'
  }

  getUserFriendlyMessage() {
    return 'This record was modified by another user. Please refresh and try again.'
  }
}

class NotFoundError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 404, 'NOT_FOUND', details, requestId)
    this.name = 'NotFoundError'
  }

  getUserFriendlyMessage() {
    return 'The requested resource was not found.'
  }
}

class BackendApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = this.getStoredToken()
  }

  getStoredToken() {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(config.auth.storageKey)
  }

  setToken(token) {
    this.token = token
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(config.auth.storageKey, token)
      } else {
        localStorage.removeItem(config.auth.storageKey)
      }
    }
  }

  async request(endpoint, options = {}) {
    const requestId = generateRequestId()
    const startTime = Date.now()
    
    // Log API request
    logger.apiRequest(options.method || 'GET', endpoint, requestId, {
      hasAuth: !!this.token,
      timeout: options.timeout || DEFAULT_TIMEOUT
    })

    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      // Log API response
      logger.apiResponse(options.method || 'GET', endpoint, requestId, response.status, duration)

      if (!response.ok) {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch (e) {
          // If response is not JSON, use text
          errorData = { message: await response.text() }
        }

        const errorMessage = errorData.detail || errorData.message || `HTTP error ${response.status}`
        const errorDetails = errorData.details || null

        // Throw specific error types based on status code
        switch (response.status) {
          case 401:
            this.setToken(null) // Clear invalid token
            const authError = new AuthError(errorMessage, requestId)
            logger.apiError(options.method || 'GET', endpoint, requestId, authError)
            throw authError
          case 404:
            const notFoundError = new NotFoundError(errorMessage, errorDetails, requestId)
            logger.apiError(options.method || 'GET', endpoint, requestId, notFoundError)
            throw notFoundError
          case 409:
            const conflictError = new ConflictError(errorMessage, errorDetails, requestId)
            logger.apiError(options.method || 'GET', endpoint, requestId, conflictError)
            throw conflictError
          case 422:
            const validationError = new ValidationError(errorMessage, errorDetails, requestId)
            logger.apiError(options.method || 'GET', endpoint, requestId, validationError)
            throw validationError
          default:
            const apiError = new APIError(errorMessage, response.status, 'API_ERROR', errorDetails, requestId)
            logger.apiError(options.method || 'GET', endpoint, requestId, apiError)
            throw apiError
        }
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      if (error.name === 'AbortError') {
        const timeoutError = new NetworkError(`Request timeout after ${options.timeout || DEFAULT_TIMEOUT}ms`, 408, requestId)
        logger.apiError(options.method || 'GET', endpoint, requestId, timeoutError, { duration })
        throw timeoutError
      }

      if (error instanceof APIError) {
        throw error
      }

      // Network or other fetch errors
      const networkError = new NetworkError(error.message || 'Network request failed', 503, requestId)
      logger.apiError(options.method || 'GET', endpoint, requestId, networkError, { duration })
      throw networkError
    }
  }

  async retryRequest(endpoint, options = {}, retries = MAX_RETRIES) {
    let lastError

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request(endpoint, options)
      } catch (error) {
        lastError = error

        // Don't retry client errors (4xx except 408/429)
        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
          throw error
        }

        // Don't wait on the last attempt
        if (attempt < retries) {
          const delay = RETRY_DELAY * Math.pow(2, attempt) // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  // Convenience methods
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

const backendApiClient = new BackendApiClient()

module.exports = {
  backendApiClient,
  BackendApiClient,
  APIError,
  NetworkError,
  AuthError,
  ValidationError,
  ConflictError,
  NotFoundError,
}
