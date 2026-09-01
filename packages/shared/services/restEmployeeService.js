import { googleSheetsService } from './googleSheetsService.js'

export class RestEmployeeService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async fetchEmployees(filters = {}) {
    const raw = await this.sheets.getEmployees(filters)
    return raw.map(e => this.mapBackendToFrontend(e))
  }

  async fetchEmployee(employeeId) {
    const raw = await this.sheets.getEmployees()
    const found = raw.find(e => e.id === employeeId || e.employeeId === employeeId)
    return found ? this.mapBackendToFrontend(found) : null
  }

  async syncEmployeesFromOdoo() {
    return await this.sheets.fetchFromGoogleSheets()
  }

  async syncWithGoogleSheets() {
    return await this.sheets.fetchFromGoogleSheets()
  }

  async addEmployee(employeeData) {
    const toSave = this.mapFrontendToBackend(employeeData)
    const res = await this.sheets.addEmployee(toSave)
    return this.mapBackendToFrontend(res)
  }

  async updateEmployee(employeeId, updateData) {
    const toSave = this.mapFrontendToBackendForUpdate(updateData)
    const res = await this.sheets.updateEmployee(employeeId, toSave)
    return this.mapBackendToFrontend(res)
  }

  async deleteEmployee(employeeId) {
    return await this.sheets.deleteEmployee(employeeId)
  }

  async approveEmployee(employeeId) {
    const res = await this.sheets.approveEmployee(employeeId)
    return this.mapBackendToFrontend(res)
  }

  async rejectEmployee(employeeId) {
    const res = await this.sheets.rejectEmployee(employeeId)
    return this.mapBackendToFrontend(res)
  }

  async updateAttendance(sessionId, employeeId, status, arrivalTime = null, remarks = null) {
    const mappedStatus = this.mapAttendanceStatus(status)
    const res = await this.sheets.recordAttendance(sessionId, employeeId, mappedStatus, arrivalTime, remarks)
    return {
      ...res,
      id: employeeId,
      employeeId: employeeId
    }
  }

  async bulkUpdateCompensation(payload) {
    const updates = Array.isArray(payload) ? payload : (payload.updates || [])
    return await this.sheets.bulkUpdateCompensation(updates)
  }

  mapBackendToFrontend(backendEmp) {
    if (!backendEmp) return null
    return {
      id: backendEmp.employeeId || backendEmp.id || backendEmp._id,
      name: backendEmp.name,
      category: backendEmp.category,
      status: backendEmp.status || 'active',
      phone: backendEmp.phone || '',
      contractor: backendEmp.contractor || null,
      baseRate: backendEmp.baseRate,
      extraHours: backendEmp.extraHours || 0,
      incentive: backendEmp.incentive || 0,
      photo: backendEmp.photoPath || backendEmp.photo || null,
      displayOrder: backendEmp.displayOrder || 999,
      attendance: backendEmp.attendance || null,
      arrivalTime: backendEmp.arrivalTime || null,
      assignedVehicle: backendEmp.assignedVehicle || null,
      labourRequest: backendEmp.labourRequest || null,
      remarks: backendEmp.remarks || null,
      requestedBy: backendEmp.requestedBy || null,
      approvedBy: backendEmp.approvedBy || null
    }
  }

  mapFrontendToBackend(frontendEmp) {
    if (!frontendEmp) return null
    return {
      employeeId: frontendEmp.id || frontendEmp.employeeId,
      name: frontendEmp.name,
      category: frontendEmp.category,
      status: frontendEmp.status || 'active',
      phone: frontendEmp.phone,
      contractor: frontendEmp.contractor || null,
      baseRate: frontendEmp.baseRate,
      extraHours: frontendEmp.extraHours,
      incentive: frontendEmp.incentive,
      photoPath: frontendEmp.photo,
      displayOrder: frontendEmp.displayOrder,
      remarks: frontendEmp.remarks
    }
  }

  mapFrontendToBackendForUpdate(frontendEmp) {
    if (!frontendEmp) return {}
    const update = {}
    if (frontendEmp.name !== undefined) update.name = frontendEmp.name
    if (frontendEmp.category !== undefined) update.category = frontendEmp.category
    if (frontendEmp.status !== undefined) update.status = frontendEmp.status
    if (frontendEmp.phone !== undefined) update.phone = frontendEmp.phone
    if (frontendEmp.contractor !== undefined) update.contractor = frontendEmp.contractor
    if (frontendEmp.baseRate !== undefined) update.baseRate = frontendEmp.baseRate
    if (frontendEmp.extraHours !== undefined) update.extraHours = frontendEmp.extraHours
    if (frontendEmp.incentive !== undefined) update.incentive = frontendEmp.incentive
    if (frontendEmp.photo !== undefined) update.photoPath = frontendEmp.photo
    if (frontendEmp.remarks !== undefined) update.remarks = frontendEmp.remarks
    return update
  }

  mapAttendanceStatus(status) {
    const map = {
      'On Time': 'on_time',
      'Arrived': 'arrived',
      'Absent': 'absent'
    }
    return map[status] || status
  }

  mapAttendanceStatusFromBackend(status) {
    const map = {
      'on_time': 'On Time',
      'arrived': 'Arrived',
      'absent': 'Absent'
    }
    return map[status] || status
  }
}

export const restEmployeeService = new RestEmployeeService()
export default restEmployeeService
