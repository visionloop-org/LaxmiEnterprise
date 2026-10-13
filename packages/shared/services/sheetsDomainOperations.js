/**
 * Domain Operations Manager for GoogleSheetsService
 * Handles CRUD operations for employees, vehicles, sessions, attendance, assignments, and trips
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('SheetsDomainOperations')

export class SheetsDomainOperations {
  constructor(service) {
    this.service = service
  }

  // ─── Employee Operations ─────────────────────────────────────────────
  async getEmployees(filters = {}) {
    let employees = this.service.getTable('employees')
    const records = this.service.getTable('attendance_records') || []

    if (records.length > 0) {
      const recordMap = new Map()
      for (const r of records) {
        const empId = r.employeeId || r.empId
        if (!empId) continue
        if (r.sessionId === 'SES-CURRENT' || !recordMap.has(empId)) {
          recordMap.set(empId, r)
        }
      }

      employees = employees.map(emp => {
        const empId = emp.id || emp.employeeId
        const att = recordMap.get(empId)
        if (att) {
          return {
            ...emp,
            attendance: att.status || emp.attendance,
            arrivalTime: att.arrivalTime !== undefined ? att.arrivalTime : emp.arrivalTime,
            remarks: att.remarks !== undefined ? att.remarks : emp.remarks
          }
        }
        return emp
      })
    }

    if (filters.category && filters.category !== 'All') {
      employees = employees.filter(e => e.category === filters.category)
    }
    if (filters.status && filters.status !== 'All') {
      employees = employees.filter(e => e.status === filters.status)
    }
    if (filters.contractor) {
      employees = employees.filter(e => e.contractor === filters.contractor)
    }
    return employees
  }

  async addEmployee(empData) {
    logger.info('Adding employee', { empId: empData.id || empData.employeeId, name: empData.name })
    const employees = this.service.getTable('employees')
    const newEmp = {
      id: empData.id || empData.employeeId || `EMP${String(employees.length + 1).padStart(3, '0')}`,
      employeeId: empData.id || empData.employeeId || `EMP${String(employees.length + 1).padStart(3, '0')}`,
      name: empData.name,
      category: empData.category || 'Workers',
      status: empData.status || 'active',
      phone: empData.phone || '',
      contractor: empData.contractor || null,
      baseRate: empData.baseRate || 500,
      extraHours: empData.extraHours || 0,
      incentive: empData.incentive || 0,
      photo: empData.photo || null,
      displayOrder: empData.displayOrder || employees.length + 1,
      remarks: empData.remarks || null,
      attendance: empData.attendance || null,
      arrivalTime: empData.arrivalTime || null,
      assignedVehicle: empData.assignedVehicle || null
    }

    employees.push(newEmp)
    this.service.setTable('employees', employees)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveEmployee', { employee: newEmp }).catch(() => {})
    }
    logger.info('Employee added successfully', { employeeId: newEmp.employeeId })
    return newEmp
  }

  async updateEmployee(empId, updateData) {
    const employees = this.service.getTable('employees')
    const index = employees.findIndex(e => e.id === empId || e.employeeId === empId)
    if (index === -1) throw new Error(`Employee ${empId} not found`)

    const updated = { ...employees[index], ...updateData }
    employees[index] = updated
    this.service.setTable('employees', employees)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveEmployee', { employee: updated }).catch(() => {})
    }
    return updated
  }

  async deleteEmployee(empId) {
    let employees = this.service.getTable('employees')
    employees = employees.filter(e => e.id !== empId && e.employeeId !== empId)
    this.service.setTable('employees', employees)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('deleteEmployee', { employeeId: empId }).catch(() => {})
    }
    return { success: true }
  }

  async approveEmployee(empId) {
    return this.updateEmployee(empId, { status: 'active' })
  }

  async rejectEmployee(empId) {
    return this.updateEmployee(empId, { status: 'rejected' })
  }

  async bulkUpdateCompensation(updates) {
    const employees = this.service.getTable('employees')
    const updateMap = new Map(updates.map(u => [u.id || u.employeeId, u]))

    const updatedEmployees = employees.map(emp => {
      const match = updateMap.get(emp.id) || updateMap.get(emp.employeeId)
      if (match) {
        return {
          ...emp,
          baseRate: match.baseRate !== undefined ? match.baseRate : emp.baseRate,
          extraHours: match.extraHours !== undefined ? match.extraHours : emp.extraHours,
          incentive: match.incentive !== undefined ? match.incentive : emp.incentive
        }
      }
      return emp
    })

    this.service.setTable('employees', updatedEmployees)
    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('bulkUpdateCompensation', { updates }).catch(() => {})
    }
    return { success: true, count: updates.length }
  }

  // ─── Vehicle Operations ──────────────────────────────────────────────
  async getVehicles(filters = {}) {
    let vehicles = this.service.getTable('vehicles')
    if (filters.type) {
      vehicles = vehicles.filter(v => v.type === filters.type)
    }
    if (filters.status) {
      vehicles = vehicles.filter(v => v.status === filters.status)
    }
    return vehicles
  }

  async addVehicle(vehData) {
    const vehicles = this.service.getTable('vehicles')
    const newVeh = {
      id: vehData.number || vehData.id,
      number: vehData.number || vehData.id,
      type: vehData.type || 'Truck',
      name: vehData.name || vehData.number || vehData.id,
      capacity: vehData.capacity || 8,
      status: vehData.status || 'available',
      active: vehData.active !== false
    }
    vehicles.push(newVeh)
    this.service.setTable('vehicles', vehicles)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveVehicle', { vehicle: newVeh }).catch(() => {})
    }
    return newVeh
  }

  async updateVehicle(vehNumber, updateData) {
    const vehicles = this.service.getTable('vehicles')
    const index = vehicles.findIndex(v => v.number === vehNumber || v.id === vehNumber)
    if (index === -1) throw new Error(`Vehicle ${vehNumber} not found`)

    const updated = { ...vehicles[index], ...updateData }
    vehicles[index] = updated
    this.service.setTable('vehicles', vehicles)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveVehicle', { vehicle: updated }).catch(() => {})
    }
    return updated
  }

  // ─── Attendance & Session Operations ─────────────────────────────────
  async getActiveSession(date, shift = 'Morning') {
    const formattedDate = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    const sessions = this.service.getTable('attendance_sessions')
    const sessionId = `SES-${formattedDate}-${shift}`
    let session = sessions.find(s => s.sessionId === sessionId || (s.sessionDate === formattedDate && s.shift === shift))

    if (!session) {
      session = {
        id: sessionId,
        sessionId: sessionId,
        sessionDate: formattedDate,
        shift: shift,
        supervisorId: 'admin',
        status: 'in_progress',
        version: 1,
        createdAt: new Date().toISOString()
      }
      sessions.push(session)
      this.service.setTable('attendance_sessions', sessions)
    }

    return session
  }

  async finalizeSession(sessionId) {
    const sessions = this.service.getTable('attendance_sessions')
    const session = sessions.find(s => s.sessionId === sessionId || s.id === sessionId)
    if (session) {
      session.status = 'finalized'
      session.finalizedAt = new Date().toISOString()
      this.service.setTable('attendance_sessions', sessions)

      if (this.service.config.scriptUrl && this.service.config.autoSync) {
        this.service.syncToGoogleSheets('saveSession', { session }).catch(() => {})
      }
    }
    return session || { sessionId, status: 'finalized' }
  }

  async unlockSession(sessionId) {
    const sessions = this.getTable('attendance_sessions')
    const session = sessions.find(s => s.sessionId === sessionId || s.id === sessionId)
    if (session) {
      session.status = 'in_progress'
      session.unlockedAt = new Date().toISOString()
      this.service.setTable('attendance_sessions', sessions)

      if (this.service.config.scriptUrl && this.service.config.autoSync) {
        this.service.syncToGoogleSheets('saveSession', { session }).catch(() => {})
      }
    }
    return session || { sessionId, status: 'in_progress' }
  }

  async recordAttendance(sessionId, employeeId, status, arrivalTime = null, remarks = null) {
    logger.info('Recording attendance', { sessionId, employeeId, status, arrivalTime })
    const employees = this.service.getTable('employees')
    const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId)
    if (emp) {
      emp.attendance = status
      if (arrivalTime) emp.arrivalTime = arrivalTime
      if (remarks) emp.remarks = remarks
      this.service.setTable('employees', employees)
    }

    const records = this.service.getTable('attendance_records')
    const recordId = `${sessionId}_${employeeId}`
    const existingIndex = records.findIndex(r => r.id === recordId || (r.sessionId === sessionId && r.employeeId === employeeId))

    const recordData = {
      id: recordId,
      sessionId,
      employeeId,
      status,
      arrivalTime: arrivalTime || (emp ? emp.arrivalTime : null),
      remarks: remarks || (emp ? emp.remarks : null),
      updatedAt: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], ...recordData }
    } else {
      records.push(recordData)
    }
    this.service.setTable('attendance_records', records)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveAttendanceRecord', { record: recordData }).catch(() => {})
    }
    logger.info('Attendance recorded successfully', { recordId, status })
    return recordData
  }

  async recordAttendanceBatch(sessionId, updates = []) {
    logger.info('Recording attendance batch', { sessionId, count: updates.length })
    if (!updates.length) return []

    const employees = this.service.getTable('employees')
    const records = this.service.getTable('attendance_records')
    const updatedRecords = []

    const updateMap = new Map()
    updates.forEach(u => updateMap.set(u.employeeId, u))

    // Update employees in-memory table
    employees.forEach(emp => {
      const u = updateMap.get(emp.id || emp.employeeId)
      if (u) {
        emp.attendance = u.status
        if (u.arrivalTime) emp.arrivalTime = u.arrivalTime
        if (u.remarks) emp.remarks = u.remarks
      }
    })
    this.service.setTable('employees', employees)

    // Update attendance_records in-memory table
    updates.forEach(({ employeeId, status, arrivalTime = null, remarks = null }) => {
      const recordId = `${sessionId}_${employeeId}`
      const existingIndex = records.findIndex(r => r.id === recordId || (r.sessionId === sessionId && r.employeeId === employeeId))
      const recordData = {
        id: recordId,
        sessionId,
        employeeId,
        status,
        arrivalTime,
        remarks,
        updatedAt: new Date().toISOString()
      }
      if (existingIndex >= 0) {
        records[existingIndex] = { ...records[existingIndex], ...recordData }
      } else {
        records.push(recordData)
      }
      updatedRecords.push(recordData)
    })
    this.service.setTable('attendance_records', records)

    // Sync to Google Sheets
    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveAttendanceRecordsBatch', { records: updatedRecords }).catch(() => {})
    }
    logger.info('Batch attendance recorded successfully', { count: updatedRecords.length })
    return updatedRecords
  }

  // ─── Vehicle Assignment Operations ──────────────────────────────────
  async assignVehicle(sessionId, vehicleId, employeeId, role = 'Passenger') {
    const assignments = this.service.getTable('vehicle_assignments')
    const assignId = `${sessionId}_${vehicleId}_${employeeId}`
    const newAssign = {
      id: assignId,
      sessionId,
      vehicleId,
      employeeId,
      role,
      assignedAt: new Date().toISOString()
    }

    const employees = this.service.getTable('employees')
    const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId)
    if (emp) {
      emp.assignedVehicle = vehicleId
      this.service.setTable('employees', employees)
    }

    const filtered = assignments.filter(a => !(a.sessionId === sessionId && a.employeeId === employeeId))
    filtered.push(newAssign)
    this.service.setTable('vehicle_assignments', filtered)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveAssignment', { assignment: newAssign }).catch(() => {})
    }
    return newAssign
  }

  async unassignVehicle(sessionId, vehicleId, employeeId) {
    let assignments = this.service.getTable('vehicle_assignments')
    assignments = assignments.filter(a => !(a.sessionId === sessionId && a.vehicleId === vehicleId && a.employeeId === employeeId))
    this.service.setTable('vehicle_assignments', assignments)

    const employees = this.service.getTable('employees')
    const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId)
    if (emp) {
      emp.assignedVehicle = null
      this.service.setTable('employees', employees)
    }

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('deleteAssignment', { sessionId, vehicleId, employeeId }).catch(() => {})
    }
    return { success: true }
  }

  // ─── Trip Operations ────────────────────────────────────────────────
  async listTrips(sessionId) {
    const trips = this.service.getTable('vehicle_trips')
    if (sessionId) {
      return trips.filter(t => t.sessionId === sessionId)
    }
    return trips
  }

  async createTrip(tripData) {
    logger.info('Creating trip', { tripId: tripData.tripId, vehicleId: tripData.vehicleId, destination: tripData.destination })
    const trips = this.service.getTable('vehicle_trips')
    const newTrip = {
      id: tripData.tripId || `TRIP-${Date.now()}`,
      tripId: tripData.tripId || `TRIP-${Date.now()}`,
      sessionId: tripData.sessionId,
      vehicleId: tripData.vehicleId,
      destination: tripData.destination || '',
      status: tripData.status || 'Dispatched',
      departureTime: tripData.departureTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: tripData.arrivalTime || null,
      notes: tripData.notes || '',
      createdAt: new Date().toISOString()
    }
    trips.push(newTrip)
    this.service.setTable('vehicle_trips', trips)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveTrip', { trip: newTrip }).catch(() => {})
    }
    logger.info('Trip created successfully', { tripId: newTrip.tripId })
    return newTrip
  }

  async updateTripStatus(tripId, updateData) {
    const trips = this.service.getTable('vehicle_trips')
    const index = trips.findIndex(t => t.id === tripId || t.tripId === tripId)
    if (index === -1) throw new Error(`Trip ${tripId} not found`)

    const updated = { ...trips[index], ...updateData }
    trips[index] = updated
    this.service.setTable('vehicle_trips', trips)

    if (this.service.config.scriptUrl && this.service.config.autoSync) {
      this.service.syncToGoogleSheets('saveTrip', { trip: updated }).catch(() => {})
    }
    return updated
  }
}
