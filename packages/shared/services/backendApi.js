const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) || '/api/v1'
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
import { generateRequestId } from '../utils/requestId.js'
import logger from '../utils/logger.js'
import { config } from '../utils/config.js'

// Custom error classes
export class APIError extends Error {
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

export class NetworkError extends APIError {
  constructor(message, status = 503, requestId = null) {
    super(message, status, 'NETWORK_ERROR', null, requestId)
    this.name = 'NetworkError'
  }

  getUserFriendlyMessage() {
    return 'Network connection issue. Please check your internet connection and try again.'
  }
}

export class AuthError extends APIError {
  constructor(message, requestId = null) {
    super(message, 401, 'UNAUTHORIZED', null, requestId)
    this.name = 'AuthError'
  }

  getUserFriendlyMessage() {
    return 'Your session has expired. Please log in again to continue.'
  }
}

export class ValidationError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 422, 'VALIDATION_ERROR', details, requestId)
    this.name = 'ValidationError'
  }

  getUserFriendlyMessage() {
    return 'Please check your input. Some fields are invalid.'
  }
}

export class ConflictError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 409, 'CONFLICT', details, requestId)
    this.name = 'ConflictError'
  }

  getUserFriendlyMessage() {
    return 'This record was modified by someone else. Please refresh and try again.'
  }
}

export class NotFoundError extends APIError {
  constructor(message, details = null, requestId = null) {
    super(message, 404, 'NOT_FOUND', details, requestId)
    this.name = 'NotFoundError'
  }

  getUserFriendlyMessage() {
    return 'The requested record was not found.'
  }
}

export class BackendApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl
    this.token = null
  }

  setToken(token) {
    this.token = token
  }

  clearToken() {
    this.token = null
  }

  getToken() {
    if (this.token) return this.token
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const requestId = options.requestId || generateRequestId()
    const startTime = Date.now()
    const timeout = options.timeout || DEFAULT_TIMEOUT
    const token = options.token || this.getToken()

    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    logger.apiRequest(options.method || 'GET', endpoint, requestId, !!token, timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      logger.apiResponse(options.method || 'GET', endpoint, requestId, duration)

      if (response.status === 204) {
        return null
      }

      const contentType = response.headers.get('content-type')
      let data = null
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = text ? { message: text } : null
      }

      if (!response.ok) {
        const errorMessage = data?.error?.message || data?.detail || data?.message || `HTTP ${response.status}: ${response.statusText}`
        const errorCode = data?.error?.code || 'API_ERROR'
        const errorDetails = data?.error?.details || null

        switch (response.status) {
          case 401:
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
            const apiError = new APIError(errorMessage, response.status, errorCode, errorDetails, requestId)
            logger.apiError(options.method || 'GET', endpoint, requestId, apiError)
            throw apiError
        }
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      if (error instanceof APIError) {
        throw error
      }

      if (error.name === 'AbortError') {
        const timeoutError = new NetworkError(`Request timeout after ${timeout}ms`, 504, requestId)
        logger.apiError(options.method || 'GET', endpoint, requestId, timeoutError)
        throw timeoutError
      }

      const networkError = new NetworkError(error.message || 'Network error occurred', 503, requestId)
      logger.apiError(options.method || 'GET', endpoint, requestId, networkError)
      throw networkError
    }
  }

  async retryRequest(endpoint, options = {}, retries = MAX_RETRIES) {
    let lastError = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.request(endpoint, options)
      } catch (error) {
        lastError = error

        if (error instanceof ValidationError || error instanceof AuthError || error instanceof NotFoundError) {
          throw error
        }

        if (attempt === retries) {
          throw error
        }

        const delay = RETRY_DELAY * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError
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

export default {
  backendApiClient,
  BackendApiClient,
  APIError,
  NetworkError,
  AuthError,
  ValidationError,
  ConflictError,
  NotFoundError,
}
