const env = (typeof process !== 'undefined' && process.env) ? process.env : {}

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
}

const currentLogLevel = env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG

function formatLogEntry(level, action, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    action,
    ...data,
    requestId: data.requestId || 'N/A',
    environment: env.NODE_ENV || 'development',
  }
}

function log(level, action, data = {}) {
  if (LOG_LEVELS[level] < currentLogLevel) return

  const logEntry = formatLogEntry(level, action, data)
  
  switch (level) {
    case 'DEBUG':
      console.debug(JSON.stringify(logEntry))
      break
    case 'INFO':
      console.info(JSON.stringify(logEntry))
      break
    case 'WARN':
      console.warn(JSON.stringify(logEntry))
      break
    case 'ERROR':
      console.error(JSON.stringify(logEntry))
      break
    default:
      console.log(JSON.stringify(logEntry))
  }
}

const logger = {
  debug(action, data) {
    log('DEBUG', action, data)
  },
  
  info(action, data) {
    log('INFO', action, data)
  },
  
  warn(action, data) {
    log('WARN', action, data)
  },
  
  error(action, data) {
    log('ERROR', action, data)
  },
  
  apiRequest(method, endpoint, requestId, data = {}) {
    this.info('API_REQUEST', {
      method,
      endpoint,
      requestId,
      ...data
    })
  },
  
  apiResponse(method, endpoint, requestId, status, duration, data = {}) {
    const logLevel = status >= 400 ? 'warn' : 'debug'
    this[logLevel]('API_RESPONSE', {
      method,
      endpoint,
      requestId,
      status,
      duration,
      ...data
    })
  },
  
  apiError(method, endpoint, requestId, error, data = {}) {
    this.error('API_ERROR', {
      method,
      endpoint,
      requestId,
      error: error.message,
      stack: error.stack,
      ...data
    })
  },
  
  userAction(action, data = {}) {
    this.info('USER_ACTION', {
      action,
      ...data
    })
  },
  
  authEvent(event, data = {}) {
    this.info('AUTH_EVENT', {
      event,
      ...data
    })
  },
  
  performance(metric, value, data = {}) {
    this.debug('PERFORMANCE', {
      metric,
      value,
      unit: data.unit || 'ms',
      ...data
    })
  }
}

module.exports = logger
module.exports.logger = logger
module.exports.default = logger