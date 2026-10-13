// CommonJS & ESM entry point for @laxmi/shared
import backendApi from './services/backendApi.js'
import authServiceModule from './services/authService.js'
import googleSheetsServiceModule from './services/googleSheetsService.js'
import driveCsvServiceModule from './services/driveCsvService.js'
import restEmployeeServiceModule from './services/restEmployeeService.js'
import restVehicleServiceModule from './services/restVehicleService.js'
import restAssignmentServiceModule from './services/restAssignmentService.js'
import restSessionServiceModule from './services/restSessionService.js'
import restTripServiceModule from './services/restTripService.js'
import restAccountingServiceModule from './services/restAccountingService.js'
import clientComputationServiceModule from './services/clientComputationService.js'
import localAIServiceModule from './services/localAIService.js'
import pdfServiceModule from './services/pdfService.js'

import ErrorBoundaryComponent from './components/ErrorBoundary.jsx'
import LoadingSpinnerComponent from './components/LoadingSpinner.jsx'
import ArrivedTimeModalComponent from './components/ArrivedTimeModal.jsx'
import GoogleSheetsSyncModalComponent from './components/GoogleSheetsSyncModal.jsx'
import DriveSyncModalComponent from './components/DriveSyncModal.jsx'
import StatusBadgeComponent from './components/StatusBadge.jsx'
import InstallAppButtonComponent from './components/InstallAppButton.jsx'

// Extract Components
export const ErrorBoundary = ErrorBoundaryComponent.default || ErrorBoundaryComponent
export const LoadingSpinner = LoadingSpinnerComponent.default || LoadingSpinnerComponent
export const ArrivedTimeModal = ArrivedTimeModalComponent.default || ArrivedTimeModalComponent
export const GoogleSheetsSyncModal = GoogleSheetsSyncModalComponent.default || GoogleSheetsSyncModalComponent
export const DriveSyncModal = DriveSyncModalComponent.default || DriveSyncModalComponent
export const StatusBadge = StatusBadgeComponent.default || StatusBadgeComponent
export const InstallAppButton = InstallAppButtonComponent.default || InstallAppButtonComponent

import * as useEmployeesHooks from './hooks/useEmployees.js'
import * as useVehiclesHooks from './hooks/useVehicles.js'
import * as useTripsHooks from './hooks/useTrips.js'
import * as usePerformanceMonitorHooks from './hooks/usePerformanceMonitor.js'
import * as useGoogleSheetsLiveSyncHooks from './hooks/useGoogleSheetsLiveSync.js'

import * as requestIdUtils from './utils/requestId.js'
import * as loggerModule from './utils/logger.js'
import * as performanceMonitorModule from './utils/performanceMonitor.js'
import * as configModule from './utils/config.js'
import * as securityUtils from './utils/security.js'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'

export { QueryClient, QueryClientProvider, useQueryClient }
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
})

// Extract services
export const authService = authServiceModule.authService || authServiceModule.default || authServiceModule
export const AuthService = authServiceModule.AuthService
export const googleSheetsService = googleSheetsServiceModule.googleSheetsService || googleSheetsServiceModule.default || googleSheetsServiceModule
export const GoogleSheetsService = googleSheetsServiceModule.GoogleSheetsService
export const MULTI_SPREADSHEET_DOMAINS = googleSheetsServiceModule.MULTI_SPREADSHEET_DOMAINS
export const getDefaultSpreadsheets = googleSheetsServiceModule.getDefaultSpreadsheets
export const compileMonthlyPayroll = googleSheetsServiceModule.googleSheetsService?.compileMonthlyPayroll
export const setupMonthlyCompilationTrigger = googleSheetsServiceModule.googleSheetsService?.setupMonthlyCompilationTrigger
export const driveCsvService = driveCsvServiceModule.driveCsvService || driveCsvServiceModule.default || driveCsvServiceModule
export const DriveCsvService = driveCsvServiceModule.DriveCsvService
export const DRIVE_DOMAINS = driveCsvServiceModule.DRIVE_DOMAINS
export const getDefaultDriveDomains = driveCsvServiceModule.getDefaultDriveDomains
export const getDriveCsvService = driveCsvServiceModule.getDriveCsvService
export const backendApiClient = backendApi.backendApiClient || backendApi.default?.backendApiClient || backendApi
export const BackendApiClient = backendApi.BackendApiClient
export const APIError = backendApi.APIError
export const NetworkError = backendApi.NetworkError
export const AuthError = backendApi.AuthError
export const ValidationError = backendApi.ValidationError
export const ConflictError = backendApi.ConflictError
export const NotFoundError = backendApi.NotFoundError

export const restEmployeeService = restEmployeeServiceModule.restEmployeeService || restEmployeeServiceModule.default || restEmployeeServiceModule
export const RestEmployeeService = restEmployeeServiceModule.RestEmployeeService
export const restVehicleService = restVehicleServiceModule.restVehicleService || restVehicleServiceModule.default || restVehicleServiceModule
export const RestVehicleService = restVehicleServiceModule.RestVehicleService
export const restAssignmentService = restAssignmentServiceModule.restAssignmentService || restAssignmentServiceModule.default || restAssignmentServiceModule
export const RestAssignmentService = restAssignmentServiceModule.RestAssignmentService
export const restSessionService = restSessionServiceModule.restSessionService || restSessionServiceModule.default || restSessionServiceModule
export const RestSessionService = restSessionServiceModule.RestSessionService
export const restTripService = restTripServiceModule.restTripService || restTripServiceModule.default || restTripServiceModule
export const restAccountingService = restAccountingServiceModule.restAccountingService || restAccountingServiceModule.default || restAccountingServiceModule
export const clientComputationService = clientComputationServiceModule.clientComputationService || clientComputationServiceModule.default || clientComputationServiceModule
export const ClientComputationService = clientComputationServiceModule.ClientComputationService || clientComputationServiceModule.default?.ClientComputationService
export const localAIService = localAIServiceModule.localAIService || localAIServiceModule.default || localAIServiceModule
export const LocalAIService = localAIServiceModule.LocalAIService || localAIServiceModule.default?.LocalAIService
export const pdfService = pdfServiceModule.PDFService || pdfServiceModule.default?.PDFService
export const PDFService = pdfServiceModule.PDFService || pdfServiceModule.default?.PDFService

// Extract Hooks
export const {
  useEmployees,
  useAddEmployee,
  useUpdateAttendance,
  useApproveEmployee,
  useRejectEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useBulkUpdateCompensation,
  useSyncEmployeesFromOdoo
} = useEmployeesHooks

export const {
  useVehicles,
  useAddVehicle,
  useUpdateVehicle
} = useVehiclesHooks

export const {
  useTrips,
  useCreateTrip,
  useUpdateTripStatus
} = useTripsHooks

export const {
  usePerformanceMonitor
} = usePerformanceMonitorHooks

export const {
  useGoogleSheetsLiveSync
} = useGoogleSheetsLiveSyncHooks

// Extract Utils
export const {
  generateRequestId,
  getRequestId,
  setRequestId,
  clearRequestId,
  withRequestId
} = requestIdUtils

export const logger = loggerModule.logger || loggerModule.default
export const createLogger = loggerModule.createLogger || loggerModule.default
export const performanceMonitor = performanceMonitorModule.performanceMonitor || performanceMonitorModule.default
export const getPerformanceMonitor = performanceMonitorModule.getPerformanceMonitor || performanceMonitorModule.default
export const { config } = configModule
export const { sanitizeInput, validatePhoneNumber, validateEmployeeId } = securityUtils

export default {
  authService,
  AuthService,
  googleSheetsService,
  GoogleSheetsService,
  driveCsvService,
  DriveCsvService,
  backendApiClient,
  BackendApiClient,
  APIError,
  NetworkError,
  AuthError,
  ValidationError,
  ConflictError,
  NotFoundError,
  restEmployeeService,
  RestEmployeeService,
  restVehicleService,
  RestVehicleService,
  restAssignmentService,
  RestAssignmentService,
  restSessionService,
  RestSessionService,
  restTripService,
  restAccountingService,
  clientComputationService,
  ClientComputationService,
  localAIService,
  LocalAIService,
  pdfService,
  PDFService,
  ErrorBoundary,
  LoadingSpinner,
  ArrivedTimeModal,
  GoogleSheetsSyncModal,
  DriveSyncModal,
  StatusBadge,
  InstallAppButton,
  useEmployees,
  useAddEmployee,
  useUpdateAttendance,
  useApproveEmployee,
  useRejectEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useBulkUpdateCompensation,
  useVehicles,
  useAddVehicle,
  useUpdateVehicle,
  useTrips,
  useCreateTrip,
  useUpdateTripStatus,
  usePerformanceMonitor,
  useGoogleSheetsLiveSync,
  generateRequestId,
  getRequestId,
  setRequestId,
  clearRequestId,
  withRequestId,
  logger,
  createLogger,
  performanceMonitor,
  getPerformanceMonitor,
  config,
  sanitizeInput,
  validatePhoneNumber,
  validateEmployeeId
}
