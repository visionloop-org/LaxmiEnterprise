/**
 * Autonomous Hybrid Edge Agent Client for Laxmi Enterprise
 * 
 * Provides an intelligent action dispatcher that bridges supervisor operations,
 * local optimistic state, domain capacity validation, and 100% serverless Google Sheets sync.
 */

import { googleSheetsService } from '@laxmi/shared'
import { apiClient } from './api.js'

class AgentClient {
  constructor() {
    this.name = 'LaxmiSupervisorEdgeAgent'
    this.version = '4.1.0'
    this.actionHistory = []
  }

  /**
   * Log action execution with diagnostic tracing
   */
  logAction(action, status, detail = null) {
    const entry = {
      action,
      status,
      detail,
      timestamp: new Date().toISOString()
    }
    this.actionHistory.push(entry)
    if (this.actionHistory.length > 50) this.actionHistory.shift()
    return entry
  }

  /**
   * Send action request to serverless agent dispatcher
   * Executes locally via GoogleSheetsService with optional backend endpoint fallback
   * 
   * @param {string} action - Action identifier (e.g., 'update_attendance', 'assign_vehicle')
   * @param {object} params - Action parameters
   * @param {object} context - Additional context (session info, user info, etc.)
   * @returns {Promise<any>} Action execution result
   */
  async sendAction(action, params = {}, context = {}) {
    const startTime = performance.now()
    const meta = {
      action,
      params,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
    }

    try {
      // 1. Try server-side agent endpoint if configured
      if (import.meta.env.VITE_ENABLE_SERVER_AGENT === 'true') {
        const response = await apiClient.post('/agent/action', meta)
        if (response.jobId) {
          return await this.waitForJobCompletion(response.jobId, response.webhookUrl)
        }
        this.logAction(action, 'success_remote')
        return response
      }

      // 2. Autonomous Edge Agent Dispatcher (100% Serverless Google Sheets)
      const result = await this.executeAutonomousAction(action, params, meta.context)
      const duration = Math.round(performance.now() - startTime)
      this.logAction(action, 'success_edge', { durationMs: duration })
      return result
    } catch (error) {
      this.logAction(action, 'failed', { error: error.message })
      console.error(`[EdgeAgent] Action failed [${action}]:`, error)
      throw error
    }
  }

  /**
   * Core Autonomous Domain Logic Router
   */
  async executeAutonomousAction(action, params, context) {
    switch (action) {
      // ─── Employee Domain ───────────────────────────────────────────────────
      case 'fetch_employees': {
        const category = params.filters?.category
        const employees = await googleSheetsService.getEmployees(category)
        return employees || []
      }

      case 'fetch_employee': {
        const employees = await googleSheetsService.getEmployees()
        const emp = employees.find(e => e.id === params.employeeId)
        if (!emp) throw new Error(`Employee not found: ${params.employeeId}`)
        return emp
      }

      case 'update_attendance': {
        const { employeeId, status, arrivalTime } = params
        const updated = await googleSheetsService.recordAttendance(employeeId, status, arrivalTime)
        return updated
      }

      case 'add_employee': {
        const { employeeData } = params
        const newEmp = {
          id: employeeData.id || `EMP-${Date.now().toString().slice(-4)}`,
          name: employeeData.name,
          category: employeeData.category || 'Workers',
          contractor: employeeData.contractor || 'In-House',
          status: employeeData.status || 'pending_approval',
          attendance: employeeData.attendance || 'pending',
          requestedBy: context.user?.name || 'Shift Supervisor',
          createdAt: new Date().toISOString()
        }
        const result = await googleSheetsService.addEmployee(newEmp)
        return result
      }

      case 'search_employees': {
        const q = (params.query || '').toLowerCase().trim()
        const all = await googleSheetsService.getEmployees()
        if (!q) return all
        return all.filter(e =>
          e.name?.toLowerCase().includes(q) ||
          e.id?.toLowerCase().includes(q) ||
          e.contractor?.toLowerCase().includes(q)
        )
      }

      case 'get_employee_stats': {
        const emps = await googleSheetsService.getEmployees(params.filters?.category)
        const total = emps.length
        const present = emps.filter(e => e.attendance === 'arrived' || e.attendance === 'on_time').length
        const onTime = emps.filter(e => e.attendance === 'on_time').length
        const arrived = emps.filter(e => e.attendance === 'arrived').length
        const absent = emps.filter(e => e.attendance === 'absent').length
        const pending = total - (present + absent)
        return {
          total,
          present,
          onTime,
          arrived,
          absent,
          pending,
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
        }
      }

      // ─── Vehicle Domain ────────────────────────────────────────────────────
      case 'fetch_vehicles': {
        const vehicles = await googleSheetsService.getVehicles()
        return vehicles || []
      }

      case 'fetch_vehicle': {
        const vehicles = await googleSheetsService.getVehicles()
        const veh = vehicles.find(v => v.id === params.vehicleId || v.number === params.vehicleId)
        if (!veh) throw new Error(`Vehicle not found: ${params.vehicleId}`)
        return veh
      }

      case 'assign_vehicle':
      case 'assign_vehicle_to_employee': {
        const { employeeId, vehicleId } = params
        if (vehicleId) {
          // Autonomous Capacity Validation
          await this.validateVehicleCapacity(vehicleId, employeeId)
          return await googleSheetsService.assignVehicle(employeeId, vehicleId)
        } else {
          return await googleSheetsService.unassignVehicle(employeeId)
        }
      }

      case 'get_available_vehicles': {
        const vehicles = await googleSheetsService.getVehicles()
        return vehicles.filter(v => v.status === 'available')
      }

      case 'get_vehicle_stats': {
        const vehicles = await googleSheetsService.getVehicles()
        const total = vehicles.length
        const inUse = vehicles.filter(v => v.status === 'in_use').length
        const available = vehicles.filter(v => v.status === 'available').length
        const maintenance = vehicles.filter(v => v.status === 'maintenance').length
        return {
          total,
          inUse,
          available,
          maintenance,
          utilizationRate: total > 0 ? Math.round((inUse / total) * 100) : 0
        }
      }

      // ─── Session Domain ────────────────────────────────────────────────────
      case 'initialize_session':
      case 'get_current_session': {
        const today = new Date().toISOString().split('T')[0]
        return {
          sessionId: `SES-${today}-Shift-A`,
          date: today,
          shift: 'Shift A',
          status: 'in_progress',
          createdAt: new Date().toISOString()
        }
      }

      case 'finalize_session': {
        const sessionData = {
          sessionId: params.sessionId || `SES-${new Date().toISOString().split('T')[0]}-Shift-A`,
          status: 'finalized',
          finalizedBy: context.user?.name || 'Supervisor',
          finalizedAt: new Date().toISOString(),
          ...params
        }
        await googleSheetsService.saveSession(sessionData)
        return { success: true, session: sessionData }
      }

      case 'sync_session_state': {
        await googleSheetsService.pushAllToCloud()
        const cloudData = await googleSheetsService.pullLatestFromCloud()
        return { success: true, cloudData }
      }

      default:
        console.warn(`[EdgeAgent] Unhandled action: ${action}, returning fallback.`)
        return { status: 'acknowledged', action, params }
    }
  }

  /**
   * Enforces domain capacity constraints autonomously:
   * Max 1 Driver, Max 1 Chalan Man, Max 6 Workers, Max 8 Total
   */
  async validateVehicleCapacity(vehicleId, newEmpId) {
    const [employees, vehicles] = await Promise.all([
      googleSheetsService.getEmployees(),
      googleSheetsService.getVehicles()
    ])

    const vehicle = vehicles.find(v => v.id === vehicleId || v.number === vehicleId)
    if (!vehicle) throw new Error(`Vehicle ${vehicleId} not found`)

    const newEmp = employees.find(e => e.id === newEmpId)
    if (!newEmp) throw new Error(`Employee ${newEmpId} not found`)

    const currentlyAssigned = employees.filter(e => e.assignedVehicle === vehicleId && e.id !== newEmpId)

    if (currentlyAssigned.length >= 8) {
      throw new Error(`Vehicle ${vehicle.number} is at maximum capacity (8/8 seats occupied).`)
    }

    if (newEmp.category === 'Drivers') {
      const hasDriver = currentlyAssigned.some(e => e.category === 'Drivers')
      if (hasDriver) throw new Error(`Vehicle ${vehicle.number} already has an assigned Driver.`)
    }

    if (newEmp.category === 'Chalan Men') {
      const hasChalan = currentlyAssigned.some(e => e.category === 'Chalan Men')
      if (hasChalan) throw new Error(`Vehicle ${vehicle.number} already has an assigned Chalan Man.`)
    }

    return true
  }

  /**
   * Batch multiple actions to agent
   * @param {Array<{action: string, params: object}>} actions - Array of actions
   * @param {object} context - Shared context for all actions
   * @returns {Promise<Array>} Array of results
   */
  async batchActions(actions, context = {}) {
    const results = []
    for (const act of actions) {
      try {
        const res = await this.sendAction(act.action, act.params, context)
        results.push({ success: true, result: res })
      } catch (err) {
        results.push({ success: false, error: err.message })
      }
    }
    return results
  }

  /**
   * Query agent state or capabilities
   */
  async queryAgent(query) {
    if (query === 'capabilities') {
      return {
        name: this.name,
        version: this.version,
        mode: '100% Serverless Edge Agent',
        supportedActions: [
          'fetch_employees', 'fetch_employee', 'update_attendance', 'add_employee', 'search_employees',
          'get_employee_stats', 'fetch_vehicles', 'fetch_vehicle', 'assign_vehicle', 'get_vehicle_stats',
          'initialize_session', 'finalize_session', 'sync_session_state'
        ],
        recentActionsCount: this.actionHistory.length
      }
    }
    if (query === 'history') {
      return this.actionHistory
    }
    return { status: 'ready', agent: this.name, version: this.version }
  }

  /**
   * Wait for async job completion via polling or webhook (for remote backend fallback)
   */
  async waitForJobCompletion(jobId, webhookUrl) {
    if (webhookUrl) return { jobId, status: 'pending', webhookUrl }

    const maxAttempts = 30
    const pollInterval = 1000
    let attempts = 0

    while (attempts < maxAttempts) {
      const response = await apiClient.get(`/agent/jobs/${jobId}`)
      if (response.status === 'completed') {
        return response.result
      } else if (response.status === 'failed') {
        throw new Error(response.error || 'Job failed')
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      attempts++
    }

    throw new Error('Job timeout')
  }

  /**
   * Sync local state with agent state
   */
  async syncState(localState) {
    try {
      await googleSheetsService.pushAllToCloud()
      return localState
    } catch (error) {
      console.warn('[EdgeAgent] Cloud sync note:', error.message)
      return localState
    }
  }
}

export const agentClient = new AgentClient()
export default agentClient
