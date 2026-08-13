// @ts-check
// REST API service for vehicle assignments using FastAPI backend
import { backendApiClient } from './backendApi.js'

/**
 * @typedef {Object} FrontendAssignment
 * @property {string} sessionId
 * @property {string} employeeId
 * @property {string} vehicleId
 * @property {string} assignedAt
 * @property {string} assignedBy
 * @property {string | null} unassignedAt
 * @property {string | null} unassignedBy
 */

class RestAssignmentService {
  /**
   * @param {string} sessionId
   * @param {string} vehicleId
   * @param {string} employeeId
   * @returns {Promise<FrontendAssignment>}
   */
  async assignVehicle(sessionId, vehicleId, employeeId) {
    const result = await backendApiClient.post(
      `/assignments/sessions/${sessionId}/vehicles/${vehicleId}/employees/${employeeId}`
    )
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {string} sessionId
   * @param {string} employeeId
   * @returns {Promise<FrontendAssignment>}
   */
  async unassignVehicle(sessionId, employeeId) {
    const result = await backendApiClient.delete(
      `/assignments/sessions/${sessionId}/employees/${employeeId}`
    )
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {string} sessionId
   * @param {string} vehicleId
   * @returns {Promise<FrontendAssignment[]>}
   */
  async getVehicleAssignments(sessionId, vehicleId) {
    const assignments = await backendApiClient.get(
      `/assignments/sessions/${sessionId}/vehicles/${vehicleId}`
    )
    return assignments.map((/** @type {import('../types/api.js').components['schemas']['VehicleAssignmentResponse']} */ assignment) => this.mapBackendToFrontend(assignment))
  }

  /**
   * @param {string} sessionId
   * @param {string} employeeId
   * @returns {Promise<FrontendAssignment>}
   */
  async getEmployeeAssignment(sessionId, employeeId) {
    const assignment = await backendApiClient.get(
      `/assignments/sessions/${sessionId}/employees/${employeeId}`
    )
    return this.mapBackendToFrontend(assignment)
  }

  // Map backend camelCase to frontend structure
  /**
   * @param {import('../types/api.js').components['schemas']['VehicleAssignmentResponse']} assignment
   * @returns {FrontendAssignment}
   */
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

  // Map frontend structure to backend camelCase
  /**
   * @param {Partial<FrontendAssignment>} assignment
   * @returns {{sessionId: string, vehicleId: string, employeeId: string, assignedBy: string}}
   */
  mapFrontendToBackend(assignment) {
    return {
      sessionId: assignment.sessionId,
      vehicleId: assignment.vehicleId,
      employeeId: assignment.employeeId,
      assignedBy: assignment.assignedBy
    }
  }
}

export const restAssignmentService = new RestAssignmentService()
