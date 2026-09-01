import { config } from './config.js'

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

class Logger {
  constructor(options = {}) {
    this.level = options.level || config.monitoring?.logLevel || 'INFO'
    this.enabled = options.enabled !== undefined ? options.enabled : (config.monitoring?.enabled !== false)
  }

  log(level, action, data = {}, requestId = null) {
    if (!this.enabled || LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return
    }

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      action,
      ...data,
      environment: typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : 'development'
    }

    if (requestId) {
      logEntry.requestId = requestId
    }

    const message = JSON.stringify(logEntry)

    switch (level) {
      case 'DEBUG':
        console.debug(message)
        break
      case 'INFO':
        console.info(message)
        break
      case 'WARN':
        console.warn(message)
        break
      case 'ERROR':
        console.error(message)
        break
      default:
        console.log(message)
    }
  }

  debug(action, data, requestId) {
    this.log('DEBUG', action, data, requestId)
  }

  info(action, data, requestId) {
    this.log('INFO', action, data, requestId)
  }

  warn(action, data, requestId) {
    this.log('WARN', action, data, requestId)
  }

  error(action, data, requestId) {
    this.log('ERROR', action, data, requestId)
  }

  apiRequest(method, endpoint, requestId, hasAuth = false, timeout = 30000) {
    this.info('API_REQUEST', {
      method,
      endpoint,
      hasAuth,
      timeout
    }, requestId)
  }

  apiResponse(method, endpoint, requestId, duration) {
    this.debug('API_RESPONSE', {
      method,
      endpoint,
      duration
    }, requestId)
  }

  apiError(method, endpoint, requestId, error, attempt = 1) {
    this.error('API_ERROR', {
      method,
      endpoint,
      errorCode: error.code || 'UNKNOWN_ERROR',
      statusCode: error.status || 500,
      errorMessage: error.message,
      attempt,
      details: error.details
    }, requestId)
  }
}

export const logger = new Logger()
export default logger
