// Shared package exports for Laxmi Enterprise attendance systems

// Services
export { authService } from './services/authService.js'
export {
  backendApiClient,
  APIError,
  NetworkError,
  AuthError,
  ValidationError,
  ConflictError,
  NotFoundError
} from './services/backendApi.js'
export { restEmployeeService } from './services/restEmployeeService.js'
export { restVehicleService } from './services/restVehicleService.js'
export { restAssignmentService } from './services/restAssignmentService.js'
export { restSessionService } from './services/restSessionService.js'
export { restTripService } from './services/restTripService.js'

// Components
export { default as ErrorBoundary } from './components/ErrorBoundary.jsx'
export { default as LoadingSpinner } from './components/LoadingSpinner.jsx'
export { default as ArrivedTimeModal } from './components/ArrivedTimeModal.jsx'

// Hooks
export {
  useEmployees,
  useEmployee,
  useUpdateAttendance,
  useAddEmployee,
  useUpdateEmployee,
  useBulkUpdateCompensation,
  useApproveEmployee,
  useRejectEmployee,
  useDeleteEmployee
} from './hooks/useEmployees.js'
export { useVehicles } from './hooks/useVehicles.js'
export {
  useTrips,
  useTrip,
  useCreateTrip,
  useUpdateTripStatus
} from './hooks/useTrips.js'
