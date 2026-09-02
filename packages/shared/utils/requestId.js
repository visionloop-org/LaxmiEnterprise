let currentRequestId = null

export const generateRequestId = () => {
  return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

export const getRequestId = () => {
  return currentRequestId
}

export const setRequestId = (requestId) => {
  currentRequestId = requestId
}

export const clearRequestId = () => {
  currentRequestId = null
}

export const withRequestId = (fn, requestId = null) => {
  const previousId = currentRequestId
  try {
    currentRequestId = requestId || generateRequestId()
    return fn(currentRequestId)
  } finally {
    currentRequestId = previousId
  }
}

export const extractRequestId = (headers) => {
  if (!headers) return null
  if (typeof headers.get === 'function') {
    return headers.get('X-Request-ID') || headers.get('x-request-id') || null
  }
  if (typeof headers === 'object') {
    return headers['X-Request-ID'] || headers['x-request-id'] || null
  }
  return null
}

export const createRequestTracker = (requestId = null) => {
  const reqId = requestId || generateRequestId()
  const startTime = Date.now()
  return {
    requestId: reqId,
    startTime,
    duration: null,
    success: null,
    error: null,
    markSuccess() {
      this.success = true
      this.duration = Date.now() - this.startTime
      return this
    },
    markError(err) {
      this.success = false
      this.error = err
      this.duration = Date.now() - this.startTime
      return this
    }
  }
}

export default {
  generateRequestId,
  getRequestId,
  setRequestId,
  clearRequestId,
  withRequestId,
  extractRequestId,
  createRequestTracker
}
