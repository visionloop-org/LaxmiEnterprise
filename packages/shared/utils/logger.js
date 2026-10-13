/**
 * Structured Logger for Laxmi Enterprise
 * Provides consistent logging with context, performance tracking, and monitoring integration
 */

class StructuredLogger {
  constructor(context) {
    this.context = context;
    this.level = this.getLogLevel();
    this.enableMonitoring = this.isMonitoringEnabled();
  }

  getLogLevel() {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.LOG_LEVEL || 'INFO';
    }
    // Browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('log_level') || 'INFO';
    }
    return 'INFO';
  }

  isMonitoringEnabled() {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production';
    }
    return false;
  }

  shouldLog(level) {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  log(level, message, data = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...data
    };

    // Output to console in development
    if (typeof window !== 'undefined' || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')) {
      const consoleMethod = level === 'ERROR' ? console.error : 
                          level === 'WARN' ? console.warn : 
                          level === 'DEBUG' ? console.debug : console.log;
      consoleMethod(JSON.stringify(entry));
    }

    // Send to monitoring service in production
    if (this.enableMonitoring) {
      this.sendToMonitoring(entry);
    }
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  // Performance logging
  logPerformance(operation, duration, data = {}) {
    this.info('Performance metric', {
      operation,
      duration,
      unit: 'ms',
      ...data
    });
  }

  // API call logging
  logApiCall(method, endpoint, duration, status, data = {}) {
    this.info('API call', {
      method,
      endpoint,
      duration,
      status,
      ...data
    });
  }

  // Error logging with stack trace
  logError(error, context = {}) {
    this.error('Error occurred', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    });
  }

  // Send to monitoring service (placeholder for actual implementation)
  sendToMonitoring(entry) {
    // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket, custom endpoint)
    // For now, this is a placeholder that can be extended
    if (typeof window !== 'undefined' && window.navigator) {
      // Browser environment - could send to analytics endpoint
      navigator.sendBeacon('/api/logs', JSON.stringify(entry));
    }
  }
}

// Factory function to create loggers with context
function createLogger(context) {
  return new StructuredLogger(context);
}

const logger = new StructuredLogger('App');

export { StructuredLogger, createLogger, logger };
export default createLogger;