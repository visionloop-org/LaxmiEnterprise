// Shared package exports for Laxmi Enterprise attendance systems

// Services
export { authService } from './services/authService.js'
export { backendApiClient, NetworkError, AuthError, ValidationError } from './services/backendApi.js'
export { restEmployeeService } from './services/restEmployeeService.js'
export { restVehicleService } from './services/restVehicleService.js'
export { restAssignmentService } from './services/restAssignmentService.js'
export { restSessionService } from './services/restSessionService.js'

// Components
export { default as ErrorBoundary } from './components/ErrorBoundary.jsx'
export { default as LoadingSpinner } from './components/LoadingSpinner.jsx'

// Hooks
export { useEmployees } from './hooks/useEmployees.js'
export { useVehicles } from './hooks/useVehicles.js'
