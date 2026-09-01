import { Component } from 'react'
import { NetworkError, AuthError, ValidationError, ConflictError, APIError } from '../services/backendApi.js'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      const { error, showDetails } = this.state
      
      let errorMessage = error?.message || 'An unexpected error occurred.'
      let showRetry = true

      if (error instanceof NetworkError) {
        errorMessage = 'Network connection or backend service unavailable. Please check your connection.'
      } else if (error instanceof AuthError) {
        errorMessage = 'Session expired or unauthorized. Please log in again.'
        showRetry = false
      } else if (error instanceof ValidationError) {
        errorMessage = 'Validation error. Please verify the submitted data.'
      } else if (error instanceof ConflictError) {
        errorMessage = 'Data conflict detected. The record was modified by another user.'
      }

      const requestId = error?.requestId || null

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full text-center border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Application Error</h2>
            <p className="text-sm text-slate-600 mb-4">{errorMessage}</p>
            
            {requestId && (
              <div className="text-xs text-slate-400 font-mono mb-4 bg-slate-100 p-1.5 rounded select-all">
                Request ID: {requestId}
              </div>
            )}
            
            <div className="flex items-center justify-center gap-3">
              {showRetry ? (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Retry Action
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Reload Application
                </button>
              )}
              
              <button
                onClick={this.toggleDetails}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 underline"
              >
                {showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 text-left bg-slate-900 text-slate-200 p-3 rounded text-xs font-mono overflow-x-auto max-h-48">
                <div>Error: {error?.name || 'Error'}</div>
                <div>Message: {error?.message}</div>
                {error?.code && <div>Code: {error.code}</div>}
                {error?.status && <div>Status: {error.status}</div>}
                {error?.details && <div>Details: {JSON.stringify(error.details, null, 2)}</div>}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
