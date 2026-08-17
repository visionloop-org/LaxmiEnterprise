const env = (typeof process !== 'undefined' && process.env) ? process.env : {}

const config = {
  // API Configuration
  api: {
    baseUrl: env.VITE_API_BASE_URL || '/api/v1',
    timeout: parseInt(env.VITE_API_TIMEOUT) || 30000,
    maxRetries: parseInt(env.VITE_API_MAX_RETRIES) || 3,
    retryDelay: parseInt(env.VITE_API_RETRY_DELAY) || 1000,
  },

  // Authentication Configuration
  auth: {
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    defaultSessionDuration: 30 * 60 * 1000, // 30 minutes
    storageKey: 'auth_token',
    credentialsKey: 'auth_credentials',
    expiryKey: 'auth_token_expiry',
  },

  // Performance Configuration
  performance: {
    cacheTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute for polling
  },

  // Feature Flags
  features: {
    enableRequestLogging: env.VITE_ENABLE_REQUEST_LOGGING === 'true',
    enablePerformanceMonitoring: env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    enableStrictMode: env.VITE_STRICT_MODE === 'true',
  },

  // Environment
  environment: env.NODE_ENV || 'development',
  isDevelopment: env.NODE_ENV !== 'production',
  isProduction: env.NODE_ENV === 'production',

  // Logging Configuration
  logging: {
    level: env.VITE_LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
    maxLogEntries: 1000,
  },

  // Pagination Configuration
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Timeouts
  timeouts: {
    network: 30000,
    animation: 300,
    debounce: 300,
    throttle: 1000,
  },

  // Validation Rules
  validation: {
    minPasswordLength: 8,
    maxUsernameLength: 50,
    employeeIdPattern: /^[A-Z0-9]{3,10}$/,
    vehicleNumberPattern: /^[A-Z0-9]{2,10}$/,
  },

  // Default Rates
  defaultRates: {
    Drivers: 800,
    'Chalan Men': 650,
    Workers: 500,
    Office: 750,
    'Extra Labour': 450,
  },

  // Categories
  categories: ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour'],

  // Status Values
  status: {
    employee: ['active', 'pending_approval', 'rejected', 'inactive'],
    vehicle: ['available', 'in_use', 'maintenance', 'out_of_service'],
    attendance: ['on_time', 'arrived', 'absent'],
  },
}

function validateConfig() {
  if (!config.api.baseUrl) {
    throw new Error('API_BASE_URL is required')
  }

  if (config.api.timeout < 1000) {
    console.warn('API timeout seems too low, minimum 1000ms recommended')
  }

  if (config.api.maxRetries < 0 || config.api.maxRetries > 10) {
    console.warn('MAX_RETRIES should be between 0 and 10')
  }

  if (config.performance.cacheTime < config.performance.staleTime) {
    console.warn('cacheTime should be greater than or equal to staleTime')
  }
}

function getConfigValue(path, fallback = null) {
  const keys = path.split('.')
  let value = config
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return fallback
    }
  }
  
  return value
}

function updateConfig(path, value) {
  const keys = path.split('.')
  let obj = config
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!obj[key] || typeof obj[key] !== 'object') {
      obj[key] = {}
    }
    obj = obj[key]
  }
  
  obj[keys[keys.length - 1]] = value
}

module.exports = {
  config,
  validateConfig,
  getConfigValue,
  updateConfig,
}