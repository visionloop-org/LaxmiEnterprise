const { config } = require('./config')

function isValidTokenFormat(token) {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const base64UrlRegex = /^[A-Za-z0-9_-]+=*$/
  return parts.every(part => base64UrlRegex.test(part))
}

function isTokenExpired(token) {
  if (!isValidTokenFormat(token)) return true
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < now) {
      return true
    }
    return false
  } catch (error) {
    return true
  }
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' }
  }
  if (password.length < config.validation.minPasswordLength) {
    return { 
      isValid: false, 
      message: `Password must be at least ${config.validation.minPasswordLength} characters` 
    }
  }
  return { isValid: true, message: 'Password is valid' }
}

function validateEmployeeId(employeeId) {
  if (!employeeId || typeof employeeId !== 'string') {
    return { isValid: false, message: 'Employee ID is required' }
  }
  if (!config.validation.employeeIdPattern.test(employeeId.toUpperCase())) {
    return { 
      isValid: false, 
      message: 'Employee ID must be 3-10 alphanumeric characters' 
    }
  }
  return { isValid: true, message: 'Employee ID is valid' }
}

function validateVehicleNumber(vehicleNumber) {
  if (!vehicleNumber || typeof vehicleNumber !== 'string') {
    return { isValid: false, message: 'Vehicle number is required' }
  }
  if (!config.validation.vehicleNumberPattern.test(vehicleNumber.toUpperCase())) {
    return { 
      isValid: false, 
      message: 'Vehicle number must be 2-10 alphanumeric characters' 
    }
  }
  return { isValid: true, message: 'Vehicle number is valid' }
}

function isSuspiciousInput(input) {
  if (typeof input !== 'string') return false
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /onerror=/gi,
    /onload=/gi,
    /eval\(/gi,
    /union\s+select/gi,
    /exec\s*\(/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /update\s+.*\s+set/gi
  ]
  return suspiciousPatterns.some(pattern => pattern.test(input))
}

function sanitizeForLogging(data) {
  if (!data || typeof data !== 'object') return data
  const sanitized = { ...data }
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'key']
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }
  return sanitized
}

function generateCSRFToken() {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function isAllowedOrigin(origin) {
  if (!origin) return false
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8000',
    'http://localhost:3000',
    'http://192.168.1.8:5173',
    'http://192.168.1.8:5174',
    'http://192.168.1.8:3000'
  ]
  return allowedOrigins.includes(origin)
}

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  isAllowed(identifier) {
    const now = Date.now()
    const windowStart = now - this.windowMs
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }
    const requests = this.requests.get(identifier)
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)
    if (recentRequests.length >= this.maxRequests) {
      return false
    }
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    return true
  }

  reset(identifier) {
    this.requests.delete(identifier)
  }
}

module.exports = {
  isValidTokenFormat,
  isTokenExpired,
  sanitizeInput,
  validatePassword,
  validateEmployeeId,
  validateVehicleNumber,
  isSuspiciousInput,
  sanitizeForLogging,
  generateCSRFToken,
  isAllowedOrigin,
  RateLimiter
}