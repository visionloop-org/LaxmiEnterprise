// REST API service for employees using FastAPI backend
import { backendApiClient } from './backendApi.js'

class RestEmployeeService {
  async fetchEmployees(filters = {}) {
    const params = new URLSearchParams()
    if (filters.category) params.append('category', filters.category)
    if (filters.status) params.append('status', filters.status)
    
    const url = `/employees${params.toString() ? '?' + params.toString() : ''}`
    const employees = await backendApiClient.get(url)
    
    // Map backend data structure to frontend structure
    return employees.map(emp => this.mapBackendToFrontend(emp))
  }

  async fetchEmployee(employeeId) {
    const employee = await backendApiClient.get(`/employees/${employeeId}`)
    return this.mapBackendToFrontend(employee)
  }

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

  async addEmployee(employeeData) {
    const backendData = this.mapFrontendToBackend(employeeData)
    const result = await backendApiClient.post('/employees', backendData)
    return this.mapBackendToFrontend(result)
  }

  async updateEmployee(employeeId, updateData) {
    const backendData = this.mapFrontendToBackend(updateData)
    const result = await backendApiClient.put(`/employees/${employeeId}`, backendData)
    return this.mapBackendToFrontend(result)
  }

  // Map backend camelCase to frontend structure
  mapBackendToFrontend(employee) {
    return {
      id: employee.employeeId,
      name: employee.name,
      category: employee.category,
      photo: employee.photoPath,
      attendance: null, // Will be loaded separately from attendance records
      arrivalTime: null, // Will be loaded separately from attendance records
      assignedVehicle: null, // Will be loaded separately from vehicle assignments
      labourRequest: null,
      status: employee.status,
      contractor: employee.contractor,
      remarks: employee.remarks
    }
  }

  // Map frontend structure to backend camelCase
  mapFrontendToBackend(employee) {
    return {
      employeeId: employee.id,
      name: employee.name,
      category: employee.category,
      photoPath: employee.photo,
      status: employee.status || 'active',
      contractor: employee.contractor,
      remarks: employee.remarks
    }
  }

  // Map frontend attendance status to backend format
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

  // Map backend attendance status to frontend format
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
