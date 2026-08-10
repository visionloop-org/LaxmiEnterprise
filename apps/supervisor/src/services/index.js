// Service exports for server-side agent integration
export { apiClient } from './api.js'
export { agentClient } from './agentClient.js'
export { employeeService } from './employeeService.js'
export { vehicleService } from './vehicleService.js'
export { sessionService } from './sessionService.js'
export { reportService } from './reportService.js'

// REST API services for direct FastAPI backend communication
// Note: backendApiClient and authService are now imported from @laxmi/shared
export { restEmployeeService } from './restEmployeeService.js'
export { restVehicleService } from './restVehicleService.js'
export { restSessionService } from './restSessionService.js'
export { restAssignmentService } from './restAssignmentService.js'

// Default export all services as an object
export default {
  apiClient,
  agentClient,
  employeeService,
  vehicleService,
  sessionService,
  reportService,
  restEmployeeService,
  restVehicleService,
  restSessionService,
  restAssignmentService,
}
