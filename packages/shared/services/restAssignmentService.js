const { backendApiClient } = require('./backendApi')

class RestAssignmentService {
  async assignVehicle(sessionId, vehicleId, employeeId) {
    const result = await backendApiClient.post(
      `/assignments/sessions/${sessionId}/vehicles/${vehicleId}/employees/${employeeId}`
    )
    return this.mapBackendToFrontend(result)
  }

  async unassignVehicle(sessionId, employeeId) {
    const result = await backendApiClient.delete(
      `/assignments/sessions/${sessionId}/employees/${employeeId}`
    )
    return this.mapBackendToFrontend(result)
  }

  async getVehicleAssignments(sessionId, vehicleId) {
    const assignments = await backendApiClient.get(
      `/assignments/sessions/${sessionId}/vehicles/${vehicleId}`
    )
    return assignments.map((assignment) => this.mapBackendToFrontend(assignment))
  }

  async getEmployeeAssignment(sessionId, employeeId) {
    const assignment = await backendApiClient.get(
      `/assignments/sessions/${sessionId}/employees/${employeeId}`
    )
    return this.mapBackendToFrontend(assignment)
  }

  mapBackendToFrontend(assignment) {
    return {
      sessionId: assignment.sessionId,
      employeeId: assignment.employeeId,
      vehicleId: assignment.vehicleId,
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy,
      unassignedAt: assignment.unassignedAt,
      unassignedBy: assignment.unassignedBy
    }
  }

  mapFrontendToBackend(assignment) {
    return {
      sessionId: assignment.sessionId,
      vehicleId: assignment.vehicleId,
      employeeId: assignment.employeeId,
      assignedBy: assignment.assignedBy
    }
  }
}

const restAssignmentService = new RestAssignmentService()

module.exports = restAssignmentService
module.exports.restAssignmentService = restAssignmentService
module.exports.RestAssignmentService = RestAssignmentService
