import { Component } from 'react'
import { NetworkError, AuthError, ValidationError } from '../services/backendApi'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      
      let errorMessage = 'Something went wrong.'
      let showRetry = true

      if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error instanceof AuthError) {
        errorMessage = 'Authentication error. Please log in again.'
        showRetry = false
      } else if (error instanceof ValidationError) {
        errorMessage = 'Invalid data. Please check your input and try again.'
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              
              {showRetry && (
                <button
                  onClick={this.handleRetry}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              )}
              
              {!showRetry && (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
