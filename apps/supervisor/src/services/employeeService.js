// Employee service for server-side agent communication
import { agentClient } from './agentClient.js'

class EmployeeService {
  /**
   * Fetch all employees
   * @param {object} filters - Optional filters (category, attendance, alphabet)
   * @returns {Promise<Array>} Array of employees
   */
  async fetchEmployees(filters = {}) {
    return await agentClient.sendAction('fetch_employees', { filters })
  }

  /**
   * Fetch single employee by ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise<object>} Employee object
   */
  async fetchEmployee(employeeId) {
    return await agentClient.sendAction('fetch_employee', { employeeId })
  }

  /**
   * Update employee attendance status
   * @param {string} employeeId - Employee ID
   * @param {string} status - Attendance status ('on_time', 'arrived', 'absent')
   * @param {string} arrivalTime - Optional arrival time
   * @returns {Promise<object>} Updated employee
   */
  async updateAttendance(employeeId, status, arrivalTime = null) {
    return await agentClient.sendAction('update_attendance', {
      employeeId,
      status,
      arrivalTime,
    })
  }

  /**
   * Batch update attendance for multiple employees
   * @param {Array<{employeeId: string, status: string, arrivalTime?: string}>} updates
   * @returns {Promise<Array>} Array of updated employees
   */
  async batchUpdateAttendance(updates) {
    const actions = updates.map(update => ({
      action: 'update_attendance',
      params: update,
    }))
    return await agentClient.batchActions(actions)
  }

  /**
   * Add new employee (for Extra Labour)
   * @param {object} employeeData - Employee data
   * @returns {Promise<object>} Created employee
   */
  async addEmployee(employeeData) {
    return await agentClient.sendAction('add_employee', {
      employeeData,
    })
  }

  /**
   * Update employee labour request (Chalan Men)
   * @param {string} employeeId - Employee ID
   * @param {string} requestType - Request type ('minimum', 'more', null)
   * @returns {Promise<object>} Updated employee
   */
  async updateLabourRequest(employeeId, requestType) {
    return await agentClient.sendAction('update_labour_request', {
      employeeId,
      requestType,
    })
  }

  /**
   * Assign vehicle to employee
   * @param {string} employeeId - Employee ID
   * @param {string} vehicleId - Vehicle ID (null to unassign)
   * @returns {Promise<object>} Updated employee
   */
  async assignVehicle(employeeId, vehicleId) {
    return await agentClient.sendAction('assign_vehicle', {
      employeeId,
      vehicleId,
    })
  }

  /**
   * Search employees by name or ID
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching employees
   */
  async searchEmployees(query) {
    return await agentClient.sendAction('search_employees', { query })
  }

  /**
   * Get employee statistics
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} Statistics (counts by status, category, etc.)
   */
  async getEmployeeStats(filters = {}) {
    return await agentClient.sendAction('get_employee_stats', { filters })
  }
}

export const employeeService = new EmployeeService()
