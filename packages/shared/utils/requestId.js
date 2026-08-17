function generateRequestId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `REQ-${timestamp}-${random}`
}

function extractRequestId(headers) {
  if (!headers) return null
  const requestId = headers.get ? (headers.get('X-Request-ID') || headers.get('x-request-id') || headers.get('request-id')) : null
  return requestId || null
}

function createRequestTracker(requestId) {
  return {
    requestId,
    startTime: Date.now(),
    duration: null,
    success: null,
    error: null,
    complete() {
      this.duration = Date.now() - this.startTime
      return this
    },
    markSuccess() {
      this.success = true
      this.complete()
      return this
    },
    markError(error) {
      this.success = false
      this.error = error
      this.complete()
      return this
    }
  }
}

module.exports = {
  generateRequestId,
  extractRequestId,
  createRequestTracker
}