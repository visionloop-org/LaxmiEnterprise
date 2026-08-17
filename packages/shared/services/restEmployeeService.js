const { backendApiClient } = require('./backendApi')

class RestEmployeeService {
  async fetchEmployees(filters = {}) {
    const params = new URLSearchParams()
    if (filters.category) params.append('category', filters.category)
    if (filters.status) params.append('status', filters.status)
    if (filters.contractor) params.append('contractor', filters.contractor)
    if (filters.active !== undefined) params.append('active', filters.active.toString())

    const url = `/employees${params.toString() ? '?' + params.toString() : ''}`
    const employees = await backendApiClient.get(url)

    return employees.map((employee) => this.mapBackendToFrontend(employee))
  }

  async fetchEmployee(employeeId) {
    const employee = await backendApiClient.get(`/employees/${employeeId}`)
    return this.mapBackendToFrontend(employee)
  }

  async addEmployee(employeeData) {
    const backendData = this.mapFrontendToBackend(employeeData)
    const result = await backendApiClient.post('/employees', backendData)
    return this.mapBackendToFrontend(result)
  }

  async updateEmployee(employeeId, employeeData) {
    const backendData = this.mapFrontendToBackend(employeeData)
    const result = await backendApiClient.put(`/employees/${employeeId}`, backendData)
    return this.mapBackendToFrontend(result)
  }

  async bulkUpdateCompensation(items) {
    const payload = items.map(item => ({
      id: item.id,
      baseRate: item.baseRate !== undefined ? item.baseRate : null,
      extraHours: item.extraHours || 0,
      incentive: item.incentive || 0,
    }))
    const result = await backendApiClient.post('/employees/bulk-compensation', payload)
    return result
  }

  async approveEmployee(employeeId) {
    const result = await backendApiClient.post(`/employees/${employeeId}/approve`)
    return this.mapBackendToFrontend(result)
  }

  async rejectEmployee(employeeId) {
    const result = await backendApiClient.post(`/employees/${employeeId}/reject`)
    return this.mapBackendToFrontend(result)
  }

  async deleteEmployee(employeeId) {
    await backendApiClient.delete(`/employees/${employeeId}`)
    return true
  }

  mapBackendToFrontend(employee) {
    return {
      id: employee.employeeId,
      name: employee.name,
      category: employee.category,
      photo: employee.photoUrl || null,
      attendance: this.mapAttendanceStatusFromBackend(employee.attendanceStatus),
      arrivalTime: employee.arrivalTime || null,
      assignedVehicle: employee.assignedVehicleId || null,
      labourRequest: null,
      status: employee.status,
      contractor: employee.contractor || null,
      remarks: employee.remarks || null,
      baseRate: employee.baseRate !== undefined ? employee.baseRate : null,
      extraHours: employee.extraHours || 0,
      incentive: employee.incentive || 0,
    }
  }

  mapFrontendToBackend(employee) {
    const backendData = {}
    if (employee.id !== undefined) backendData.employeeId = employee.id
    if (employee.name !== undefined) backendData.name = employee.name
    if (employee.category !== undefined) backendData.category = employee.category
    if (employee.photo !== undefined) backendData.photoUrl = employee.photo
    if (employee.attendance !== undefined) {
      backendData.attendanceStatus = this.mapAttendanceStatus(employee.attendance)
    }
    if (employee.arrivalTime !== undefined) backendData.arrivalTime = employee.arrivalTime
    if (employee.assignedVehicle !== undefined) backendData.assignedVehicleId = employee.assignedVehicle
    if (employee.status !== undefined) backendData.status = employee.status
    if (employee.contractor !== undefined) backendData.contractor = employee.contractor
    if (employee.remarks !== undefined) backendData.remarks = employee.remarks
    if (employee.baseRate !== undefined) backendData.baseRate = employee.baseRate
    if (employee.extraHours !== undefined) backendData.extraHours = employee.extraHours
    if (employee.incentive !== undefined) backendData.incentive = employee.incentive
    return backendData
  }

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

  mapAttendanceStatusFromBackend(status) {
    const statusMap = {
      'on_time': 'On Time',
      'arrived': 'Arrived',
      'absent': 'Absent'
    }
    return statusMap[status] || status
  }
}
const restEmployeeService = new RestEmployeeService()

module.exports = restEmployeeService
module.exports.restEmployeeService = restEmployeeService
module.exports.RestEmployeeService = RestEmployeeService
