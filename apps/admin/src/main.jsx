import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider, queryClient, ErrorBoundary } from '@laxmi/shared'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
