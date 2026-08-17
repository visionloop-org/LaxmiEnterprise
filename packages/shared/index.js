// Shared package exports for Laxmi Enterprise attendance systems
const backendApi = require('./services/backendApi')
const authServiceModule = require('./services/authService')
const restEmployeeServiceModule = require('./services/restEmployeeService')
const restVehicleServiceModule = require('./services/restVehicleService')
const restAssignmentServiceModule = require('./services/restAssignmentService')
const restSessionServiceModule = require('./services/restSessionService')
const restTripServiceModule = require('./services/restTripService')

const ErrorBoundary = require('./components/ErrorBoundary.jsx')
const LoadingSpinner = require('./components/LoadingSpinner.jsx')
const ArrivedTimeModal = require('./components/ArrivedTimeModal.jsx')

const useEmployeesHooks = require('./hooks/useEmployees')
const useVehiclesHooks = require('./hooks/useVehicles')
const useTripsHooks = require('./hooks/useTrips')
const usePerformanceMonitorHook = require('./hooks/usePerformanceMonitor')

const requestIdUtils = require('./utils/requestId')
const loggerModule = require('./utils/logger')
const configModule = require('./utils/config')
const securityUtils = require('./utils/security')

module.exports = {
  // Services
  authService: authServiceModule.authService || authServiceModule,
  AuthService: authServiceModule.AuthService,
  backendApiClient: backendApi.backendApiClient,
  BackendApiClient: backendApi.BackendApiClient,
  APIError: backendApi.APIError,
  NetworkError: backendApi.NetworkError,
  AuthError: backendApi.AuthError,
  ValidationError: backendApi.ValidationError,
  ConflictError: backendApi.ConflictError,
  NotFoundError: backendApi.NotFoundError,
  restEmployeeService: restEmployeeServiceModule.restEmployeeService || restEmployeeServiceModule,
  RestEmployeeService: restEmployeeServiceModule.RestEmployeeService,
  restVehicleService: restVehicleServiceModule.restVehicleService || restVehicleServiceModule,
  RestVehicleService: restVehicleServiceModule.RestVehicleService,
  restAssignmentService: restAssignmentServiceModule.restAssignmentService || restAssignmentServiceModule,
  RestAssignmentService: restAssignmentServiceModule.RestAssignmentService,
  restSessionService: restSessionServiceModule.restSessionService || restSessionServiceModule,
  RestSessionService: restSessionServiceModule.RestSessionService,
  restTripService: restTripServiceModule.restTripService || restTripServiceModule,

  // Components
  ErrorBoundary: ErrorBoundary.default || ErrorBoundary,
  LoadingSpinner: LoadingSpinner.default || LoadingSpinner,
  ArrivedTimeModal: ArrivedTimeModal.default || ArrivedTimeModal,

  // Hooks
  ...useEmployeesHooks,
  ...useVehiclesHooks,
  ...useTripsHooks,
  ...usePerformanceMonitorHook,

  // Utils
  ...requestIdUtils,
  logger: loggerModule.default || loggerModule,
  ...configModule,
  ...securityUtils
}
