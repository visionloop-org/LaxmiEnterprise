// @ts-check
// REST API service for employees using FastAPI backend
import { backendApiClient } from './backendApi.js'

/**
 * @typedef {Object} FrontendEmployee
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string | null} photo
 * @property {string | null} attendance
 * @property {string | null} arrivalTime
 * @property {string | null} assignedVehicle
 * @property {string | null} labourRequest
 * @property {string} status
 * @property {string | null} contractor
 * @property {string | null} remarks
 * @property {number | null} [baseRate]
 * @property {number} [extraHours]
 * @property {number} [incentive]
 */

/**
 * @typedef {Object} EmployeeFilters
 * @property {string} [category]
 * @property {string} [status]
 */

class RestEmployeeService {
  /**
   * @param {EmployeeFilters} [filters={}]
   * @returns {Promise<FrontendEmployee[]>}
   */
  async fetchEmployees(filters = {}) {
    const params = new URLSearchParams()
    if (filters.category) params.append('category', filters.category)
    if (filters.status) params.append('status', filters.status)

    const url = `/employees/${params.toString() ? '?' + params.toString() : ''}`
    const employees = await backendApiClient.get(url)

    return employees.map((/** @type {any} */ emp) => this.mapBackendToFrontend(emp))
  }

  /**
   * @param {string} employeeId
   * @returns {Promise<FrontendEmployee>}
   */
  async fetchEmployee(employeeId) {
    const employee = await backendApiClient.get(`/employees/${employeeId}`)
    return this.mapBackendToFrontend(employee)
  }

  /**
   * @param {string} sessionId
   * @param {string} employeeId
   * @param {string} status
   * @param {string | null} [arrivalTime=null]
   * @param {string | null} [remarks=null]
   * @returns {Promise<FrontendEmployee>}
   */
  async updateAttendance(sessionId, employeeId, status, arrivalTime = null, remarks = null) {
    const attendanceData = {
      status: this.mapAttendanceStatus(status),
      arrivalTime: arrivalTime,
      remarks: remarks
    }

    const result = await backendApiClient.put(
      `/attendance/sessions/${sessionId}/employees/${employeeId}`,
      attendanceData
    )

    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {FrontendEmployee} employeeData
   * @returns {Promise<FrontendEmployee>}
   */
  async addEmployee(employeeData) {
    const backendData = this.mapFrontendToBackend(employeeData)
    const result = await backendApiClient.post('/employees/', backendData)
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {string} employeeId
   * @param {Partial<FrontendEmployee>} updateData
   * @returns {Promise<FrontendEmployee>}
   */
  async updateEmployee(employeeId, updateData) {
    const backendData = this.mapFrontendToBackendForUpdate(updateData)
    const result = await backendApiClient.put(`/employees/${employeeId}`, backendData)
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {Array<{employeeId: string, baseRate?: number, extraHours?: number, incentive?: number}>} items
   * @returns {Promise<FrontendEmployee[]>}
   */
  async bulkUpdateCompensation(items) {
    const result = await backendApiClient.put('/employees/bulk/compensation', items)
    return result.map((/** @type {any} */ emp) => this.mapBackendToFrontend(emp))
  }

  /**
   * @param {string} employeeId
   * @returns {Promise<FrontendEmployee>}
   */
  async approveEmployee(employeeId) {
    const result = await backendApiClient.post(`/employees/${employeeId}/approve`, {})
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {string} employeeId
   * @returns {Promise<FrontendEmployee>}
   */
  async rejectEmployee(employeeId) {
    const result = await backendApiClient.post(`/employees/${employeeId}/reject`, {})
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {string} employeeId
   * @returns {Promise<void>}
   */
  async deleteEmployee(employeeId) {
    await backendApiClient.delete(`/employees/${employeeId}`)
  }

  /**
   * @param {any} employee
   * @returns {FrontendEmployee}
   */
  mapBackendToFrontend(employee) {
    return {
      id: employee.employeeId,
      name: employee.name,
      category: employee.category,
      photo: employee.photoPath,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      labourRequest: null,
      status: employee.status,
      contractor: employee.contractor,
      remarks: employee.remarks,
      baseRate: employee.baseRate !== undefined && employee.baseRate !== null ? Number(employee.baseRate) : null,
      extraHours: employee.extraHours !== undefined && employee.extraHours !== null ? Number(employee.extraHours) : 0,
      incentive: employee.incentive !== undefined && employee.incentive !== null ? Number(employee.incentive) : 0
    }
  }

  /**
   * @param {FrontendEmployee} employee
   * @returns {any}
   */
  mapFrontendToBackend(employee) {
    return {
      employeeId: employee.id,
      name: employee.name,
      category: employee.category,
      photoPath: employee.photo,
      status: employee.status || 'active',
      contractor: employee.contractor,
      remarks: employee.remarks,
      baseRate: employee.baseRate !== undefined ? employee.baseRate : null,
      extraHours: employee.extraHours !== undefined ? employee.extraHours : 0,
      incentive: employee.incentive !== undefined ? employee.incentive : 0
    }
  }

  /**
   * @param {Partial<FrontendEmployee>} employee
   * @returns {any}
   */
  mapFrontendToBackendForUpdate(employee) {
    /** @type {Record<string, any>} */
    const updateData = {}
    if (employee.name !== undefined) updateData.name = employee.name
    if (employee.category !== undefined) updateData.category = employee.category
    if (employee.photo !== undefined) updateData.photoPath = employee.photo
    if (employee.status !== undefined) updateData.status = employee.status
    if (employee.contractor !== undefined) updateData.contractor = employee.contractor
    if (employee.remarks !== undefined) updateData.remarks = employee.remarks
    if (employee.baseRate !== undefined) updateData.baseRate = employee.baseRate
    if (employee.extraHours !== undefined) updateData.extraHours = employee.extraHours
    if (employee.incentive !== undefined) updateData.incentive = employee.incentive
    return updateData
  }

  /**
   * @param {string} status
   * @returns {string}
   */
  mapAttendanceStatus(status) {
    const statusMap = {
      'On Time': 'on_time',
      'Arrived': 'arrived',
      'Absent': 'absent',
      'on_time': 'on_time',
      'arrived': 'arrived',
      'absent': 'absent'
    }
    return statusMap[status] || status
  }

  /**
   * @param {string} status
   * @returns {string}
   */
  mapAttendanceStatusFromBackend(status) {
    const statusMap = {
      'on_time': 'On Time',
      'arrived': 'Arrived',
      'absent': 'Absent'
    }
    return statusMap[status] || status
  }
}

export const restEmployeeService = new RestEmployeeService()
