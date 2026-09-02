import { googleSheetsService } from './googleSheetsService.js'

export class RestAssignmentService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async assign(sessionId, vehicleId, employeeId, role = 'Passenger') {
    return await this.sheets.assignVehicle(sessionId, vehicleId, employeeId, role)
  }

  async unassign(sessionId, vehicleId, employeeId) {
    return await this.sheets.unassignVehicle(sessionId, vehicleId, employeeId)
  }

  async assignVehicle(sessionId, vehicleId, employeeId, role = 'Passenger') {
    const result = await this.sheets.assignVehicle(sessionId, vehicleId, employeeId, role)
    return this.mapBackendToFrontend(result)
  }

  async unassignVehicle(sessionId, vehicleId, employeeId) {
    const result = await this.sheets.unassignVehicle(sessionId, vehicleId, employeeId)
    return this.mapBackendToFrontend(result)
  }

  async getVehicleAssignments(sessionId, vehicleId) {
    const assignments = this.sheets.getTable ? this.sheets.getTable('vehicle_assignments') : []
    return assignments
      .filter(a => a.sessionId === sessionId && a.vehicleId === vehicleId)
      .map(a => this.mapBackendToFrontend(a))
  }

  async getEmployeeAssignment(sessionId, employeeId) {
    const assignments = this.sheets.getTable ? this.sheets.getTable('vehicle_assignments') : []
    const match = assignments.find(a => a.sessionId === sessionId && a.employeeId === employeeId)
    return match ? this.mapBackendToFrontend(match) : null
  }

  mapBackendToFrontend(backendAssignment) {
    if (!backendAssignment) return null
    return {
      sessionId: backendAssignment.sessionId,
      employeeId: backendAssignment.employeeId,
      vehicleId: backendAssignment.vehicleId,
      role: backendAssignment.role || 'Passenger',
      assignedAt: backendAssignment.assignedAt || null,
      assignedBy: backendAssignment.assignedBy || null,
      unassignedAt: backendAssignment.unassignedAt !== undefined ? backendAssignment.unassignedAt : null,
      unassignedBy: backendAssignment.unassignedBy !== undefined ? backendAssignment.unassignedBy : null
    }
  }

  mapFrontendToBackend(frontendAssignment) {
    if (!frontendAssignment) return null
    const backend = {
      sessionId: frontendAssignment.sessionId,
      employeeId: frontendAssignment.employeeId,
      vehicleId: frontendAssignment.vehicleId
    }
    if (frontendAssignment.assignedBy !== undefined) {
      backend.assignedBy = frontendAssignment.assignedBy
    }
    if (frontendAssignment.role !== undefined) {
      backend.role = frontendAssignment.role
    }
    return backend
  }
}

export const restAssignmentService = new RestAssignmentService()
export default restAssignmentService
