// Vehicle service for server-side agent communication
import { agentClient } from './agentClient.js'

class VehicleService {
  /**
   * Fetch all vehicles
   * @param {object} filters - Optional filters (status, type)
   * @returns {Promise<Array>} Array of vehicles
   */
  async fetchVehicles(filters = {}) {
    return await agentClient.sendAction('fetch_vehicles', { filters })
  }

  /**
   * Fetch single vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<object>} Vehicle object
   */
  async fetchVehicle(vehicleId) {
    return await agentClient.sendAction('fetch_vehicle', { vehicleId })
  }

  /**
   * Update vehicle status
   * @param {string} vehicleId - Vehicle ID
   * @param {string} status - New status ('available', 'in_use', 'maintenance')
   * @returns {Promise<object>} Updated vehicle
   */
  async updateStatus(vehicleId, status) {
    return await agentClient.sendAction('update_vehicle_status', {
      vehicleId,
      status,
    })
  }

  /**
   * Batch update vehicle statuses
   * @param {Array<{vehicleId: string, status: string}>} updates
   * @returns {Promise<Array>} Array of updated vehicles
   */
  async batchUpdateStatus(updates) {
    const actions = updates.map(update => ({
      action: 'update_vehicle_status',
      params: update,
    }))
    return await agentClient.batchActions(actions)
  }

  /**
   * Assign vehicle to employee (updates both vehicle and employee)
   * @param {string} employeeId - Employee ID
   * @param {string} vehicleId - Vehicle ID (null to unassign)
   * @returns {Promise<object>} Result with updated employee and vehicle
   */
  async assignToEmployee(employeeId, vehicleId) {
    return await agentClient.sendAction('assign_vehicle_to_employee', {
      employeeId,
      vehicleId,
    })
  }

  /**
   * Get vehicle status history
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} Array of status history entries
   */
  async getStatusHistory(vehicleId) {
    return await agentClient.sendAction('get_vehicle_history', { vehicleId })
  }

  /**
   * Search vehicles by number or ID
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching vehicles
   */
  async searchVehicles(query) {
    return await agentClient.sendAction('search_vehicles', { query })
  }

  /**
   * Get vehicle statistics
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} Statistics (counts by status, type, etc.)
   */
  async getVehicleStats(filters = {}) {
    return await agentClient.sendAction('get_vehicle_stats', { filters })
  }

  /**
   * Get available vehicles for assignment
   * @param {string} employeeCategory - Optional employee category for filtering
   * @returns {Promise<Array>} Array of available vehicles
   */
  async getAvailableVehicles(employeeCategory = null) {
    return await agentClient.sendAction('get_available_vehicles', {
      employeeCategory,
    })
  }
}

export const vehicleService = new VehicleService()
