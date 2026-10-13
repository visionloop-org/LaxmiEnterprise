/**
 * Google Sheets Service for Laxmi Enterprise
 * Direct Frontend Data Storage, Retrieval, and Sync Engine
 * Refactored to modular architecture (<500 lines)
 */

import { createLogger } from '../utils/logger.js'
import {
  STORAGE_KEY_PREFIX,
  CONFIG_KEY,
  DEFAULT_WEBAPP_URL,
  DEFAULT_SHEET_ID,
  DEFAULT_SEED_DATA,
  MULTI_SPREADSHEET_DOMAINS,
  getDefaultSpreadsheets
} from './sheetsConstants.js'
import { SheetsDomainOperations } from './sheetsDomainOperations.js'

const logger = createLogger('GoogleSheetsService')

export { MULTI_SPREADSHEET_DOMAINS, getDefaultSpreadsheets }

export class GoogleSheetsService {
  constructor() {
    this.config = this.loadConfig()
    this.initStore()
    this.listeners = new Set()
    this.autoSyncTimer = null
    this.lastFetchTimestamp = 0
    this._boundOnFocus = null
    this._boundOnVisibility = null
    this._initBroadcastChannel()

    // Domain data operations delegate
    this.dataOps = new SheetsDomainOperations(this)
  }

  _initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('laxmi_gsheets_sync')
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETED') {
            this.notifyListeners('SYNC_COMPLETED', event.data.payload)
          }
        }
      } catch (err) {
        console.warn('[GoogleSheetsService] BroadcastChannel unavailable:', err.message)
      }
    }
  }

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
        console.warn('[GoogleSheetsService] Listener error:', err)
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

  loadConfig() {
    if (typeof localStorage === 'undefined') {
      return { scriptUrl: DEFAULT_WEBAPP_URL, sheetId: DEFAULT_SHEET_ID, autoSync: true, lastSyncTime: null }
    }
    try {
      const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_SCRIPT_URL
      const saved = localStorage.getItem(CONFIG_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          scriptUrl: parsed.scriptUrl || envUrl || DEFAULT_WEBAPP_URL,
          sheetId: parsed.sheetId || DEFAULT_SHEET_ID,
          autoSync: parsed.autoSync ?? true,
          lastSyncTime: parsed.lastSyncTime || null,
          spreadsheets: parsed.spreadsheets || getDefaultSpreadsheets(),
          multiSheet: parsed.multiSheet ?? true
        }
      }
      return {
        scriptUrl: envUrl || DEFAULT_WEBAPP_URL,
        sheetId: DEFAULT_SHEET_ID,
        autoSync: true,
        lastSyncTime: null,
        spreadsheets: getDefaultSpreadsheets(),
        multiSheet: true
      }
    } catch {
      return {
        scriptUrl: DEFAULT_WEBAPP_URL,
        sheetId: DEFAULT_SHEET_ID,
        autoSync: true,
        lastSyncTime: null,
        spreadsheets: getDefaultSpreadsheets(),
        multiSheet: true
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

  async fetchWithRetry(url, options = {}, retries = 2, backoffMs = 800) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options)
        return response
      } catch (err) {
        if (attempt === retries) throw err
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)))
      }
    }
  }

  startAutoSync(intervalMs = 20000) {
    if (this.autoSyncTimer) return
    this.autoSyncInterval = intervalMs

    if (this.config.scriptUrl) {
      this.fetchFromGoogleSheets().catch(() => {})
    }

    this.autoSyncTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      if (this.config.scriptUrl) {
        this.fetchFromGoogleSheets().catch(() => {})
      }
    }, intervalMs)

    if (typeof window !== 'undefined') {
      this._boundOnFocus = () => {
        if (this.config.scriptUrl) this.fetchFromGoogleSheets().catch(() => {})
      }
      window.addEventListener('focus', this._boundOnFocus)
    }

    if (typeof document !== 'undefined') {
      this._boundOnVisibility = () => {
        if (!document.hidden && this.config.scriptUrl) {
          this.fetchFromGoogleSheets().catch(() => {})
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

  enqueueOfflineMutation(action, payload) {
    if (typeof localStorage === 'undefined') return
    try {
      const queueKey = `${STORAGE_KEY_PREFIX}offline_queue`
      const queue = JSON.parse(localStorage.getItem(queueKey) || '[]')
      queue.push({ id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, action, payload, timestamp: new Date().toISOString() })
      localStorage.setItem(queueKey, JSON.stringify(queue))
      this.notifyListeners('OFFLINE_QUEUE_UPDATED', { queueLength: queue.length })
    } catch (err) {
      console.warn('[GoogleSheetsService] Error enqueueing offline mutation:', err.message)
    }
  }

  async flushOfflineQueue() {
    if (typeof localStorage === 'undefined' || !this.config.scriptUrl) return
    const queueKey = `${STORAGE_KEY_PREFIX}offline_queue`
    try {
      const queue = JSON.parse(localStorage.getItem(queueKey) || '[]')
      if (!queue.length) return

      const remaining = []
      for (const item of queue) {
        try {
          await this.syncToGoogleSheets(item.action, item.payload)
        } catch {
          remaining.push(item)
        }
      }
      localStorage.setItem(queueKey, JSON.stringify(remaining))
    } catch (err) {
      console.warn('[GoogleSheetsService] Error flushing offline queue:', err.message)
    }
  }

  async fetchFromGoogleSheets() {
    if (!this.config.scriptUrl) {
      logger.warn('Google Apps Script Web App URL not configured')
      return { success: false, message: 'Google Apps Script Web App URL not configured.' }
    }

    const startTime = performance.now()
    logger.info('Fetching data from Google Sheets', { scriptUrl: this.config.scriptUrl })

    try {
      const response = await this.fetchWithRetry(`${this.config.scriptUrl}?action=getAll`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      if (!response.ok) throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
      const data = await response.json()
      const duration = performance.now() - startTime

      if (data && data.status === 'success' && data.data) {
        for (const [table, records] of Object.entries(data.data)) {
          if (Array.isArray(records)) {
            this.setTable(table, records)
          }
        }
        const updates = { lastSyncTime: new Date().toISOString() }
        if (data.spreadsheets) {
          updates.spreadsheets = data.spreadsheets
          updates.multiSheet = data.multiSheet ?? true
        }
        this.saveConfig(updates)
        this.lastFetchTimestamp = Date.now()

        const syncPayload = {
          timestamp: updates.lastSyncTime,
          tables: Object.keys(data.data),
          data: data.data
        }
        this.notifyListeners('SYNC_COMPLETED', syncPayload)
        this.broadcastSync(syncPayload)

        logger.logApiCall('GET', 'fetchAll', duration, response.status, {
          tables: Object.keys(data.data),
          recordCount: Object.values(data.data).reduce((sum, records) => sum + records.length, 0)
        })

        this.flushOfflineQueue().catch(() => {})
        return { success: true, message: 'Successfully synced data from Google Sheets!', data: data.data }
      }
      throw new Error(data.message || 'Invalid format returned by Google Sheets')
    } catch (err) {
      const duration = performance.now() - startTime
      logger.logError(err, { operation: 'fetchFromGoogleSheets', duration })
      this.notifyListeners('SYNC_ERROR', { error: err.message })
      return { success: false, message: err.message }
    }
  }

  async syncToGoogleSheets(action, payload = {}) {
    if (!this.config.scriptUrl) {
      logger.warn('Google Apps Script Web App URL not configured', { action })
      return { success: false, message: 'Google Apps Script Web App URL not configured.' }
    }

    const startTime = performance.now()
    logger.info('Syncing to Google Sheets', { action, payloadKeys: Object.keys(payload) })

    try {
      const response = await this.fetchWithRetry(this.config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      }, 2)

      if (!response.ok) throw new Error(`HTTP error ${response.status}`)
      const res = await response.json()
      const duration = performance.now() - startTime

      if (res && res.status === 'success') {
        this.saveConfig({ lastSyncTime: new Date().toISOString() })
        this.notifyListeners('MUTATION_COMPLETED', { action, payload, response: res })
        logger.logApiCall('POST', action, duration, response.status, { payloadKeys: Object.keys(payload) })
      }
      return res
    } catch (err) {
      const duration = performance.now() - startTime
      logger.logError(err, { operation: 'syncToGoogleSheets', action, duration })
      this.enqueueOfflineMutation(action, payload)
      return { success: false, queuedOffline: true, message: err.message }
    }
  }

  // Delegate CRUD operations to dataOps
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
  async recordAttendanceBatch(sessionId, updates = []) {
    return this.dataOps.recordAttendanceBatch(sessionId, updates)
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

  // ─── Multi-Spreadsheet & Meta Operations ────────────────────────────
  async fetchMultiSpreadsheetMeta() {
    if (!this.config.scriptUrl) return { success: false }
    try {
      const res = await this.fetchWithRetry(`${this.config.scriptUrl}?action=getMultiSpreadsheetMeta`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data && data.status === 'success' && data.spreadsheets) {
        this.saveConfig({ spreadsheets: data.spreadsheets, multiSheet: true })
        return { success: true, spreadsheets: data.spreadsheets }
      }
      return { success: false }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  getSpreadsheets() {
    return this.config.spreadsheets || getDefaultSpreadsheets()
  }

  openSpreadsheet(domainKey) {
    const sp = this.config.spreadsheets && this.config.spreadsheets[domainKey]
    if (sp && sp.url && typeof window !== 'undefined') {
      window.open(sp.url, '_blank')
      return true
    }
    return false
  }

  getStats() {
    const employees = this.getTable('employees')
    const vehicles = this.getTable('vehicles')
    const sessions = this.getTable('attendance_sessions')
    const records = this.getTable('attendance_records')
    const trips = this.getTable('vehicle_trips')
    const settlements = this.getTable('contractor_settlements')
    const payroll = this.getTable('daily_payroll')

    const spreadsheets = this.config.spreadsheets || getDefaultSpreadsheets()
    const sheetsConnected = Object.values(spreadsheets).some(s => s.configured || s.id)

    return {
      googleSheets: {
        configured: !!this.config.scriptUrl,
        multiSheet: this.config.multiSheet ?? true,
        lastSync: this.config.lastSyncTime || 'Never',
        status: sheetsConnected ? 'connected' : (this.config.scriptUrl ? 'configured' : 'local_mode'),
        spreadsheets: spreadsheets
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

  async compileMonthlyPayroll(year, month) {
    if (!this.config.scriptUrl) return { success: false, message: 'Apps Script not configured' }
    try {
      const url = `${this.config.scriptUrl}?action=compileMonthlyPayroll&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
      const res = await this.fetchWithRetry(url)
      return res.json()
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  async setupMonthlyCompilationTrigger() {
    if (!this.config.scriptUrl) return { success: false, message: 'Apps Script not configured' }
    try {
      const res = await this.fetchWithRetry(`${this.config.scriptUrl}?action=setupMonthlyCompilationTrigger`)
      return res.json()
    } catch (err) {
      return { success: false, message: err.message }
    }
  }
}

export const googleSheetsService = new GoogleSheetsService()
export default googleSheetsService
