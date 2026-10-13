/**
 * Google Drive CSV Service for Laxmi Enterprise
 * Partitioned Free Tier Architecture (<2GB quota, <50MB active dataset)
 * Uses Google Drive API v3 with Direct OAuth / Session Auth
 */

import { createLogger } from '../utils/logger.js'
import { parseCSV, serializeToCSV, applyTypeCoercion, applyTypeSerialization } from '../utils/csvUtils.js'
import {
  STORAGE_KEY_PREFIX,
  CONFIG_KEY,
  DRIVE_DOMAINS,
  TYPE_SCHEMAS,
  DEFAULT_SEED_DATA,
  getDefaultDriveDomains
} from './driveConstants.js'
import { DriveApiClient } from './driveApiClient.js'
import { DriveDataOperations } from './driveDataOperations.js'

const logger = createLogger('DriveCsvService')

export { DRIVE_DOMAINS, getDefaultDriveDomains }

export class DriveCsvService {
  constructor() {
    this.config = this.loadConfig()
    this.initStore()
    this.listeners = new Set()
    this.autoSyncTimer = null
    this.lastFetchTimestamp = 0
    this._boundOnFocus = null
    this._boundOnVisibility = null
    this._initBroadcastChannel()

    // Sub-modules
    this.apiClient = new DriveApiClient(this)
    this.dataOps = new DriveDataOperations(this)
  }

  _initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('laxmi_drive_csv_sync')
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETED') {
            this.notifyListeners('SYNC_COMPLETED', event.data.payload)
          }
        }
      } catch (err) {
        console.warn('[DriveCsvService] BroadcastChannel unavailable:', err.message)
      }
    }
  }

  // Delegate Google Drive API Auth & Folder Methods
  async initializeGoogleAPI() { return this.apiClient.initializeGoogleAPI() }
  async signIn() { return this.apiClient.signIn() }
  async signOut() { return this.apiClient.signOut() }
  isAuthenticated() { return this.apiClient.isAuthenticated() }
  async setupDriveFolders() { return this.apiClient.setupDriveFolders() }
  async createFolder(name, parentId = null) { return this.apiClient.createFolder(name, parentId) }
  async createFile(name, content, parentId = null, mimeType = 'text/csv') { return this.apiClient.createFile(name, content, parentId, mimeType) }
  async getFileContent(fileId) { return this.apiClient.getFileContent(fileId) }
  async updateFileContent(fileId, content) { return this.apiClient.updateFileContent(fileId, content) }
  async listFilesInFolder(folderId) { return this.apiClient.listFilesInFolder(folderId) }
  async findFileByName(folderId, fileName) { return this.apiClient.findFileByName(folderId, fileName) }

  /**
   * Subscribe to Drive CSV sync and data mutation events
   */
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {}
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  notifyListeners(eventType, payload = {}) {
    this.listeners.forEach((listener) => {
      try {
        listener(eventType, payload)
      } catch (err) {
        console.warn('[DriveCsvService] Listener error:', err)
      }
    })
  }

  broadcastSync(payload) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'SYNC_COMPLETED', payload })
      } catch {
        // ignore errors
      }
    }
  }

  /**
   * Fetch all data from Drive
   */
  async fetchFromDrive(force = false) {
    const now = Date.now()
    if (!force && now - this.lastFetchTimestamp < 5000) {
      return { success: true, cached: true }
    }

    if (!this.isAuthenticated()) {
      return { success: false, message: 'Not authenticated with Google Drive' }
    }

    const startTime = performance.now()
    this.notifyListeners('SYNC_STARTED')

    try {
      const allData = {}
      for (const [domainKey, domain] of Object.entries(this.config.domains || {})) {
        if (!domain.folderId) continue

        const files = await this.listFilesInFolder(domain.folderId)
        for (const file of files) {
          if (file.name.endsWith('.csv')) {
            const tableName = file.name.replace('.csv', '')
            const content = await this.getFileContent(file.id)
            const rawRecords = parseCSV(content)
            const parsedRecords = TYPE_SCHEMAS[tableName]
              ? rawRecords.map(r => applyTypeCoercion(r, TYPE_SCHEMAS[tableName]))
              : rawRecords
            this.setTable(tableName, parsedRecords)
            allData[tableName] = parsedRecords
          }
        }
      }

      this.lastFetchTimestamp = now
      const duration = performance.now() - startTime
      const updates = { lastSyncTime: new Date().toISOString() }
      this.saveConfig(updates)

      const syncPayload = {
        timestamp: updates.lastSyncTime,
        tables: Object.keys(allData),
        data: allData
      }
      this.notifyListeners('SYNC_COMPLETED', syncPayload)
      this.broadcastSync(syncPayload)

      logger.logApiCall('GET', 'fetchAll', duration, 200, {
        tables: Object.keys(allData),
        recordCount: Object.values(allData).reduce((sum, records) => sum + records.length, 0)
      })

      return { success: true, message: 'Successfully synced data from Google Drive!', data: allData }
    } catch (err) {
      const duration = performance.now() - startTime
      logger.logError(err, { operation: 'fetchFromDrive', duration })
      this.notifyListeners('SYNC_ERROR', { error: err.message })
      return { success: false, message: err.message }
    }
  }

  /**
   * Sync table data to Google Drive
   */
  async syncTableToDrive(tableName) {
    if (!this.isAuthenticated()) {
      return { success: false, message: 'Not authenticated with Google Drive' }
    }

    const domainKey = this.getDomainForTable(tableName)
    if (!domainKey) {
      return { success: false, message: `Unknown table: ${tableName}` }
    }

    const domain = this.config.domains[domainKey]
    if (!domain || !domain.folderId) {
      return { success: false, message: 'Domain folder not configured' }
    }

    try {
      const fileName = `${tableName}.csv`
      const file = await this.findFileByName(domain.folderId, fileName)

      const records = this.getTable(tableName)
      const serializedRecords = TYPE_SCHEMAS[tableName]
        ? records.map(r => applyTypeSerialization(r, TYPE_SCHEMAS[tableName]))
        : records
      const csvContent = serializeToCSV(serializedRecords)

      if (file) {
        await this.updateFileContent(file.id, csvContent)
      } else {
        await this.createFile(fileName, csvContent, domain.folderId, 'text/csv')
      }

      this.saveConfig({ lastSyncTime: new Date().toISOString() })
      this.notifyListeners('MUTATION_COMPLETED', { tableName })
      logger.info(`Table ${tableName} synced to Drive successfully`)
      return { success: true }
    } catch (err) {
      logger.logError(err, { operation: 'syncTableToDrive', tableName })
      return { success: false, message: err.message }
    }
  }

  getDomainForTable(tableName) {
    for (const [key, domain] of Object.entries(DRIVE_DOMAINS)) {
      if (domain.tables.includes(tableName)) {
        return key
      }
    }
    return null
  }

  loadConfig() {
    if (typeof localStorage === 'undefined') {
      return { clientId: '', autoSync: true, lastSyncTime: null }
    }

    try {
      const envClientId = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID
      const saved = localStorage.getItem(CONFIG_KEY)

      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          clientId: parsed.clientId || envClientId || '',
          autoSync: parsed.autoSync ?? true,
          lastSyncTime: parsed.lastSyncTime || null,
          domains: parsed.domains || getDefaultDriveDomains(),
          rootFolderId: parsed.rootFolderId || ''
        }
      }

      return {
        clientId: envClientId || '',
        autoSync: true,
        lastSyncTime: null,
        domains: getDefaultDriveDomains(),
        rootFolderId: ''
      }
    } catch {
      return {
        clientId: '',
        autoSync: true,
        lastSyncTime: null,
        domains: getDefaultDriveDomains(),
        rootFolderId: ''
      }
    }
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config))
    }
  }

  initStore() {
    this.memoryStore = {}
    for (const [table, defaultRecords] of Object.entries(DEFAULT_SEED_DATA)) {
      this.memoryStore[table] = defaultRecords
      if (typeof localStorage !== 'undefined') {
        const existing = localStorage.getItem(STORAGE_KEY_PREFIX + table)
        if (!existing) {
          localStorage.setItem(STORAGE_KEY_PREFIX + table, JSON.stringify(defaultRecords))
        }
      }
    }
  }

  getTable(tableName) {
    if (typeof localStorage === 'undefined') return this.memoryStore?.[tableName] || DEFAULT_SEED_DATA[tableName] || []
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + tableName)
      return data ? JSON.parse(data) : this.memoryStore?.[tableName] || DEFAULT_SEED_DATA[tableName] || []
    } catch {
      return this.memoryStore?.[tableName] || DEFAULT_SEED_DATA[tableName] || []
    }
  }

  setTable(tableName, records) {
    if (!this.memoryStore) this.memoryStore = {}
    this.memoryStore[tableName] = records
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PREFIX + tableName, JSON.stringify(records))
    }
  }

  startAutoSync(intervalMs = 20000) {
    if (this.autoSyncTimer) return
    this.autoSyncInterval = intervalMs

    if (this.isAuthenticated()) {
      this.fetchFromDrive().catch(() => {})
    }

    this.autoSyncTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      if (this.isAuthenticated()) {
        this.fetchFromDrive().catch(() => {})
      }
    }, intervalMs)

    if (typeof window !== 'undefined') {
      this._boundOnFocus = () => {
        if (this.isAuthenticated()) this.fetchFromDrive().catch(() => {})
      }
      window.addEventListener('focus', this._boundOnFocus)
    }

    if (typeof document !== 'undefined') {
      this._boundOnVisibility = () => {
        if (!document.hidden && this.isAuthenticated()) {
          this.fetchFromDrive().catch(() => {})
        }
      }
      document.addEventListener('visibilitychange', this._boundOnVisibility)
    }
  }

  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer)
      this.autoSyncTimer = null
    }
    if (typeof window !== 'undefined' && this._boundOnFocus) {
      window.removeEventListener('focus', this._boundOnFocus)
      this._boundOnFocus = null
    }
    if (typeof document !== 'undefined' && this._boundOnVisibility) {
      document.removeEventListener('visibilitychange', this._boundOnVisibility)
      this._boundOnVisibility = null
    }
  }

  // Delegate Domain Data Operations
  async getEmployees(filters = {}) { return this.dataOps.getEmployees(filters) }
  async addEmployee(empData) { return this.dataOps.addEmployee(empData) }
  async updateEmployee(empId, updateData) { return this.dataOps.updateEmployee(empId, updateData) }
  async deleteEmployee(empId) { return this.dataOps.deleteEmployee(empId) }
  async approveEmployee(empId) { return this.dataOps.approveEmployee(empId) }
  async rejectEmployee(empId) { return this.dataOps.rejectEmployee(empId) }
  async bulkUpdateCompensation(updates) { return this.dataOps.bulkUpdateCompensation(updates) }

  async getVehicles(filters = {}) { return this.dataOps.getVehicles(filters) }
  async addVehicle(vehData) { return this.dataOps.addVehicle(vehData) }
  async updateVehicle(vehNumber, updateData) { return this.dataOps.updateVehicle(vehNumber, updateData) }

  async getActiveSession(date, shift = 'Morning') { return this.dataOps.getActiveSession(date, shift) }
  async finalizeSession(sessionId) { return this.dataOps.finalizeSession(sessionId) }
  async unlockSession(sessionId) { return this.dataOps.unlockSession(sessionId) }
  async recordAttendance(sessionId, employeeId, status, arrivalTime = null, remarks = null) {
    return this.dataOps.recordAttendance(sessionId, employeeId, status, arrivalTime, remarks)
  }

  async assignVehicle(sessionId, vehicleId, employeeId, role = 'Passenger') {
    return this.dataOps.assignVehicle(sessionId, vehicleId, employeeId, role)
  }
  async unassignVehicle(sessionId, vehicleId, employeeId) {
    return this.dataOps.unassignVehicle(sessionId, vehicleId, employeeId)
  }

  async listTrips(sessionId) { return this.dataOps.listTrips(sessionId) }
  async createTrip(tripData) { return this.dataOps.createTrip(tripData) }
  async updateTripStatus(tripId, updateData) { return this.dataOps.updateTripStatus(tripId, updateData) }

  // ─── Stats & Summary ────────────────────────────────────────────────
  getStats() {
    const employees = this.getTable('employees')
    const vehicles = this.getTable('vehicles')
    const sessions = this.getTable('attendance_sessions')
    const records = this.getTable('attendance_records')
    const trips = this.getTable('vehicle_trips')
    const settlements = this.getTable('contractor_settlements')
    const payroll = this.getTable('daily_payroll')

    const domains = this.config.domains || getDefaultDriveDomains()

    return {
      googleDrive: {
        configured: !!this.config.clientId,
        authenticated: this.isAuthenticated(),
        lastSync: this.config.lastSyncTime || 'Never',
        status: this.isAuthenticated() ? 'connected' : 'local_mode',
        domains: domains
      },
      localStore: {
        total_employees: employees.length,
        active_employees: employees.filter(e => e.status === 'active').length,
        total_vehicles: vehicles.length,
        total_sessions: sessions.length,
        total_records: records.length,
        total_trips: trips.length,
        total_settlements: settlements.length,
        total_payroll_days: payroll.length
      }
    }
  }

  getDomains() {
    return this.config.domains || getDefaultDriveDomains()
  }

  openDomainFolder(domainKey) {
    const domain = this.config.domains && this.config.domains[domainKey]
    if (domain && domain.folderId && typeof window !== 'undefined') {
      window.open(`https://drive.google.com/drive/folders/${domain.folderId}`, '_blank')
      return true
    }
    return false
  }

  /**
   * 5-Year Rolling Retention Engine: Prune records older than 5 years (1,825 days)
   * Enforces <50MB active dataset across all partitioned CSV tables.
   */
  pruneRecordsOlderThan5Years() {
    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 5)
    const cutoffIso = cutoffDate.toISOString().split('T')[0]

    let totalPruned = 0
    const timeBasedTables = ['attendance_records', 'attendance_sessions', 'vehicle_trips', 'audit_logs']

    for (const tableName of timeBasedTables) {
      const records = this.getTable(tableName) || []
      const beforeCount = records.length
      const filtered = records.filter(row => {
        const rowDate = row.date || row.shift_date || row.timestamp || row.createdAt || ''
        if (!rowDate) return true
        return rowDate >= cutoffIso
      })
      if (filtered.length < beforeCount) {
        totalPruned += (beforeCount - filtered.length)
        this.setTable(tableName, filtered)
      }
    }

    logger.info(`[5-Year Retention Engine] Pruned ${totalPruned} records older than ${cutoffIso}`)
    return { prunedCount: totalPruned, cutoffDate: cutoffIso }
  }

  /**
   * 1-Click Bank Bulk Transfer CSV Export (SBI / Axis / HDFC format)
   * Auto-deducts any mid-month salary advances for 100% accurate net payouts.
   */
  exportBankTransferCSV(payrollRecords = []) {
    const records = payrollRecords.length > 0 ? payrollRecords : (this.getTable('daily_payroll') || [])
    const employees = this.getTable('employees') || []
    const advances = this.getTable('salary_advances') || []
    const empMap = new Map(employees.map(e => [e.id, e]))

    // Aggregate pending/unsettled advances per employee
    const advanceMap = new Map()
    advances.filter(a => a.status !== 'deducted').forEach(a => {
      const cur = advanceMap.get(a.employeeId) || 0
      advanceMap.set(a.employeeId, cur + (Number(a.amount) || 0))
    })

    const rows = records.map(p => {
      const emp = empMap.get(p.employeeId) || {}
      const gross = p.grandTotal || p.netPay || p.baseWage || 0
      const advanceDeduction = p.advanceDeducted !== undefined ? p.advanceDeducted : (advanceMap.get(p.employeeId) || 0)
      const netPayable = Math.max(0, gross - advanceDeduction)

      return {
        Beneficiary_Name: emp.name || p.employeeName || 'Unknown',
        Account_Number: emp.bankAccountNo || emp.accountNo || 'N/A',
        IFSC_Code: emp.bankIfsc || emp.ifsc || 'N/A',
        Amount: netPayable,
        Remarks: `Sal-${p.date || new Date().toISOString().split('T')[0]}${advanceDeduction > 0 ? `-AdvDed${advanceDeduction}` : ''}`,
        Payment_Date: new Date().toISOString().split('T')[0]
      }
    })

    return serializeToCSV(rows, {
      headers: ['Beneficiary_Name', 'Account_Number', 'IFSC_Code', 'Amount', 'Remarks', 'Payment_Date'],
      hasHeader: true
    })
  }

  /**
   * 1-Click Backup: Creates a complete JSON snapshot of all tables & configurations
   */
  createSnapshotBackup() {
    const allTables = [
      'employees', 'contractors', 'rates_config', 'users_roles',
      'vehicles', 'attendance_sessions', 'attendance_records', 'vehicle_assignments',
      'vehicle_trips', 'extra_labour_requests', 'vehicle_maintenance',
      'daily_payroll', 'contractor_settlements', 'salary_advances', 'monthly_summary', 'audit_logs'
    ]
    const backupData = {
      version: '2.0-direct-auth',
      exportedAt: new Date().toISOString(),
      config: this.config,
      tables: {}
    }

    for (const table of allTables) {
      backupData.tables[table] = this.getTable(table) || []
    }

    return backupData
  }

  /**
   * 1-Click Restore: Restores database from a valid JSON snapshot
   */
  restoreSnapshotBackup(backupData) {
    if (!backupData || typeof backupData !== 'object' || !backupData.tables) {
      throw new Error('Invalid snapshot file format: missing tables object.')
    }

    let restoredCount = 0
    for (const [table, records] of Object.entries(backupData.tables)) {
      if (Array.isArray(records)) {
        this.setTable(table, records)
        restoredCount += records.length
      }
    }

    if (backupData.config && typeof backupData.config === 'object') {
      this.saveConfig(backupData.config)
    }

    this.notifyListeners('RESTORE_COMPLETED', { restoredCount, exportedAt: backupData.exportedAt })
    logger.info(`[Backup Engine] Restored ${restoredCount} records across tables successfully`)
    return { success: true, restoredCount }
  }
}

// Singleton instance
let driveCsvServiceInstance = null

export function getDriveCsvService() {
  if (!driveCsvServiceInstance) {
    driveCsvServiceInstance = new DriveCsvService()
  }
  return driveCsvServiceInstance
}

export const driveCsvService = getDriveCsvService()
export default driveCsvService
