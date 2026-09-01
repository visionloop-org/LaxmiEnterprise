export const config = {
  api: {
    baseUrl: (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) || '/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  monitoring: {
    logLevel: 'INFO',
    enabled: true
  }
}

export default config
