/**
 * Google Sheets Service for Laxmi Enterprise
 * Direct Frontend Data Storage, Retrieval, and Sync Engine
 */

const STORAGE_KEY_PREFIX = 'laxmi_gsheets_'
const CONFIG_KEY = 'laxmi_gsheets_config'

// Default seed data if no local storage or Google Sheets connection exists
const DEFAULT_SEED_DATA = {
  employees: [
    {
      id: 'EMP001',
      employeeId: 'EMP001',
      name: 'Ramesh Patel',
      category: 'Drivers',
      status: 'active',
      phone: '9876543210',
      contractor: null,
      baseRate: 800,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 1,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP002',
      employeeId: 'EMP002',
      name: 'Suresh Kumar',
      category: 'Workers',
      status: 'active',
      phone: '9876543211',
      contractor: 'Shree Ram Labours',
      baseRate: 500,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 2,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP003',
      employeeId: 'EMP003',
      name: 'Mahesh Shah',
      category: 'Chalan Men',
      status: 'active',
      phone: '9876543212',
      contractor: null,
      baseRate: 650,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 3,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP004',
      employeeId: 'EMP004',
      name: 'Dinesh Varma',
      category: 'Workers',
      status: 'active',
      phone: '9876543213',
      contractor: 'Patel Contractors',
      baseRate: 500,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 4,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP005',
      employeeId: 'EMP005',
      name: 'Kailash Sharma',
      category: 'Office',
      status: 'active',
      phone: '9876543214',
      contractor: null,
      baseRate: 750,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 5,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    }
  ],
  vehicles: [
    {
      id: 'VEH-101',
      number: 'VEH-101',
      type: 'Truck',
      name: 'Dumper 101',
      capacity: 8,
      status: 'available',
      active: true
    },
    {
      id: 'VEH-102',
      number: 'VEH-102',
      type: 'Truck',
      name: 'Tipper 102',
      capacity: 8,
      status: 'available',
      active: true
    },
    {
      id: 'VEH-103',
      number: 'VEH-103',
      type: 'Van',
      name: 'Crew Van 103',
      capacity: 8,
      status: 'available',
      active: true
    }
  ],
  attendance_sessions: [],
  attendance_records: [],
  vehicle_assignments: [],
  vehicle_trips: []
}

export class GoogleSheetsService {
  constructor() {
    this.config = this.loadConfig()
    this.initStore()
  }

  loadConfig() {
    if (typeof localStorage === 'undefined') {
      return { scriptUrl: '', sheetId: '', autoSync: true, lastSyncTime: null }
    }
    try {
      // 1. Auto-detect from URL query parameters (e.g. ?scriptUrl=... or ?apiUrl=...)
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search)
        const urlParam = params.get('scriptUrl') || params.get('apiUrl')
        const sheetParam = params.get('sheetId')
        if (urlParam || sheetParam) {
          const current = this.loadConfigFromStorage()
          const updated = {
            ...current,
            ...(urlParam ? { scriptUrl: urlParam.trim() } : {}),
            ...(sheetParam ? { sheetId: sheetParam.trim() } : {})
          }
          localStorage.setItem(CONFIG_KEY, JSON.stringify(updated))
          return updated
        }
      }
      return this.loadConfigFromStorage()
    } catch {
      return { scriptUrl: '', sheetId: '', autoSync: true, lastSyncTime: null }
    }
  }

  loadConfigFromStorage() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY)
      return saved ? JSON.parse(saved) : { scriptUrl: '', sheetId: '', autoSync: true, lastSyncTime: null }
    } catch {
      return { scriptUrl: '', sheetId: '', autoSync: true, lastSyncTime: null }
    }
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config))
    }
  }

  initStore() {
    if (typeof localStorage === 'undefined') return
    for (const [table, defaultRecords] of Object.entries(DEFAULT_SEED_DATA)) {
      const existing = localStorage.getItem(STORAGE_KEY_PREFIX + table)
      if (!existing) {
        localStorage.setItem(STORAGE_KEY_PREFIX + table, JSON.stringify(defaultRecords))
      }
    }
  }

  getTable(tableName) {
    if (typeof localStorage === 'undefined') return DEFAULT_SEED_DATA[tableName] || []
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + tableName)
      return data ? JSON.parse(data) : DEFAULT_SEED_DATA[tableName] || []
    } catch {
      return DEFAULT_SEED_DATA[tableName] || []
    }
  }

  setTable(tableName, records) {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY_PREFIX + tableName, JSON.stringify(records))
  }

  // ─── API / Google Apps Script Communication ─────────────────────────
  async fetchFromGoogleSheets() {
    if (!this.config.scriptUrl) {
      return { success: false, message: 'Google Apps Script Web App URL not configured.' }
    }

    try {
      const response = await fetch(`${this.config.scriptUrl}?action=getAll`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      if (data && data.status === 'success' && data.data) {
        for (const [table, records] of Object.entries(data.data)) {
          if (Array.isArray(records)) {
            this.setTable(table, records)
          }
        }
        this.saveConfig({ lastSyncTime: new Date().toISOString() })
        return { success: true, message: 'Successfully synced data from Google Sheets!', data: data.data }
      }
      throw new Error(data.message || 'Invalid format returned by Google Sheets')
    } catch (err) {
      console.warn('[GoogleSheetsService] fetchFromGoogleSheets note:', err.message)
      return { success: false, message: err.message }
    }
  }

  async syncToGoogleSheets(action, payload = {}) {
    if (!this.config.scriptUrl) {
      return { success: false, message: 'Google Apps Script Web App URL not configured.' }
    }

    try {
      const response = await fetch(this.config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script CORS friendly
        body: JSON.stringify({ action, ...payload })
      })
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }
      const res = await response.json()
      if (res && res.status === 'success') {
        this.saveConfig({ lastSyncTime: new Date().toISOString() })
      }
      return res
    } catch (err) {
      console.warn(`[GoogleSheetsService] syncToGoogleSheets (${action}) warning:`, err.message)
      return { success: false, message: err.message }
    }
  }

  // ─── Employee Operations ─────────────────────────────────────────────
  async getEmployees(filters = {}) {
    let employees = this.getTable('employees')
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
    const employees = this.getTable('employees')
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
    this.setTable('employees', employees)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveEmployee', { employee: newEmp }).catch(() => {})
    }
    return newEmp
  }

  async updateEmployee(empId, updateData) {
    const employees = this.getTable('employees')
    const index = employees.findIndex(e => e.id === empId || e.employeeId === empId)
    if (index === -1) throw new Error(`Employee ${empId} not found`)

    const updated = { ...employees[index], ...updateData }
    employees[index] = updated
    this.setTable('employees', employees)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveEmployee', { employee: updated }).catch(() => {})
    }
    return updated
  }

  async deleteEmployee(empId) {
    let employees = this.getTable('employees')
    employees = employees.filter(e => e.id !== empId && e.employeeId !== empId)
    this.setTable('employees', employees)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('deleteEmployee', { employeeId: empId }).catch(() => {})
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
    const employees = this.getTable('employees')
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

    this.setTable('employees', updatedEmployees)
    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('bulkSaveEmployees', { employees: updatedEmployees }).catch(() => {})
    }
    return { success: true, count: updates.length }
  }

  // ─── Vehicle Operations ──────────────────────────────────────────────
  async getVehicles(filters = {}) {
    let vehicles = this.getTable('vehicles')
    if (filters.type) {
      vehicles = vehicles.filter(v => v.type === filters.type)
    }
    if (filters.status) {
      vehicles = vehicles.filter(v => v.status === filters.status)
    }
    return vehicles
  }

  async addVehicle(vehData) {
    const vehicles = this.getTable('vehicles')
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
    this.setTable('vehicles', vehicles)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveVehicle', { vehicle: newVeh }).catch(() => {})
    }
    return newVeh
  }

  async updateVehicle(vehNumber, updateData) {
    const vehicles = this.getTable('vehicles')
    const index = vehicles.findIndex(v => v.number === vehNumber || v.id === vehNumber)
    if (index === -1) throw new Error(`Vehicle ${vehNumber} not found`)

    const updated = { ...vehicles[index], ...updateData }
    vehicles[index] = updated
    this.setTable('vehicles', vehicles)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveVehicle', { vehicle: updated }).catch(() => {})
    }
    return updated
  }

  // ─── Attendance & Session Operations ─────────────────────────────────
  async getActiveSession(date, shift = 'Morning') {
    const formattedDate = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    const sessions = this.getTable('attendance_sessions')
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
      this.setTable('attendance_sessions', sessions)
    }

    return session
  }

  async finalizeSession(sessionId) {
    const sessions = this.getTable('attendance_sessions')
    const session = sessions.find(s => s.sessionId === sessionId || s.id === sessionId)
    if (session) {
      session.status = 'finalized'
      session.finalizedAt = new Date().toISOString()
      this.setTable('attendance_sessions', sessions)

      if (this.config.scriptUrl && this.config.autoSync) {
        this.syncToGoogleSheets('saveSession', { session }).catch(() => {})
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
      this.setTable('attendance_sessions', sessions)

      if (this.config.scriptUrl && this.config.autoSync) {
        this.syncToGoogleSheets('saveSession', { session }).catch(() => {})
      }
    }
    return session || { sessionId, status: 'in_progress' }
  }

  async recordAttendance(sessionId, employeeId, status, arrivalTime = null, remarks = null) {
    const employees = this.getTable('employees')
    const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId)
    if (emp) {
      emp.attendance = status
      if (arrivalTime) emp.arrivalTime = arrivalTime
      if (remarks) emp.remarks = remarks
      this.setTable('employees', employees)
    }

    const records = this.getTable('attendance_records')
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
    this.setTable('attendance_records', records)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveAttendanceRecord', { record: recordData }).catch(() => {})
    }
    return recordData
  }

  // ─── Vehicle Assignment Operations ──────────────────────────────────
  async assignVehicle(sessionId, vehicleId, employeeId, role = 'Passenger') {
    const assignments = this.getTable('vehicle_assignments')
    const assignId = `${sessionId}_${vehicleId}_${employeeId}`
    const newAssign = {
      id: assignId,
      sessionId,
      vehicleId,
      employeeId,
      role,
      assignedAt: new Date().toISOString()
    }

    // Update employee assignedVehicle
    const employees = this.getTable('employees')
    const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId)
    if (emp) {
      emp.assignedVehicle = vehicleId
      this.setTable('employees', employees)
    }

    const filtered = assignments.filter(a => !(a.sessionId === sessionId && a.employeeId === employeeId))
    filtered.push(newAssign)
    this.setTable('vehicle_assignments', filtered)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveAssignment', { assignment: newAssign }).catch(() => {})
    }
    return newAssign
  }

  async unassignVehicle(sessionId, vehicleId, employeeId) {
    let assignments = this.getTable('vehicle_assignments')
    assignments = assignments.filter(a => !(a.sessionId === sessionId && a.vehicleId === vehicleId && a.employeeId === employeeId))
    this.setTable('vehicle_assignments', assignments)

    const employees = this.getTable('employees')
    const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId)
    if (emp) {
      emp.assignedVehicle = null
      this.setTable('employees', employees)
    }

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('deleteAssignment', { sessionId, vehicleId, employeeId }).catch(() => {})
    }
    return { success: true }
  }

  // ─── Trip Operations ────────────────────────────────────────────────
  async listTrips(sessionId) {
    const trips = this.getTable('vehicle_trips')
    if (sessionId) {
      return trips.filter(t => t.sessionId === sessionId)
    }
    return trips
  }

  async createTrip(tripData) {
    const trips = this.getTable('vehicle_trips')
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
    this.setTable('vehicle_trips', trips)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveTrip', { trip: newTrip }).catch(() => {})
    }
    return newTrip
  }

  async updateTripStatus(tripId, updateData) {
    const trips = this.getTable('vehicle_trips')
    const index = trips.findIndex(t => t.id === tripId || t.tripId === tripId)
    if (index === -1) throw new Error(`Trip ${tripId} not found`)

    const updated = { ...trips[index], ...updateData }
    trips[index] = updated
    this.setTable('vehicle_trips', trips)

    if (this.config.scriptUrl && this.config.autoSync) {
      this.syncToGoogleSheets('saveTrip', { trip: updated }).catch(() => {})
    }
    return updated
  }

  // ─── Stats & Summary ────────────────────────────────────────────────
  getStats() {
    const employees = this.getTable('employees')
    const vehicles = this.getTable('vehicles')
    const sessions = this.getTable('attendance_sessions')
    const records = this.getTable('attendance_records')
    const trips = this.getTable('vehicle_trips')

    return {
      googleSheets: {
        configured: !!this.config.scriptUrl,
        sheetUrl: this.config.scriptUrl,
        sheetId: this.config.sheetId,
        lastSync: this.config.lastSyncTime || 'Never',
        status: this.config.scriptUrl ? 'connected' : 'local_mode'
      },
      localStore: {
        total_employees: employees.length,
        active_employees: employees.filter(e => e.status === 'active').length,
        total_vehicles: vehicles.length,
        total_sessions: sessions.length,
        total_records: records.length,
        total_trips: trips.length
      }
    }
  }

  async pushAllToGoogleSheets() {
    const allData = {
      employees: this.getTable('employees'),
      vehicles: this.getTable('vehicles'),
      attendance_sessions: this.getTable('attendance_sessions'),
      attendance_records: this.getTable('attendance_records'),
      vehicle_assignments: this.getTable('vehicle_assignments'),
      vehicle_trips: this.getTable('vehicle_trips')
    }
    return await this.syncToGoogleSheets('bulkUploadAll', { data: allData })
  }
}

export const googleSheetsService = new GoogleSheetsService()
export default googleSheetsService
