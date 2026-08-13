// @ts-check
// REST API service for sessions using FastAPI backend
import { backendApiClient } from './backendApi.js'

/**
 * @typedef {Object} FrontendSession
 * @property {string} id
 * @property {string} date
 * @property {string} shift
 * @property {string} status
 * @property {string} supervisorId
 * @property {number} version
 * @property {string | null} finalizedAt
 * @property {string | null} finalizedBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} FrontendAttendanceRecord
 * @property {string} sessionId
 * @property {string} employeeId
 * @property {string} status
 * @property {string | null} arrivalTime
 * @property {string} recordedBy
 * @property {string | null} remarks
 * @property {number} version
 * @property {string} recordedAt
 */

/**
 * @typedef {Object} SessionFilters
 * @property {string} [sessionDate]
 * @property {string} [shift]
 * @property {string} [status]
 */

class RestSessionService {
  /**
   * @param {Partial<FrontendSession>} sessionData
   * @returns {Promise<FrontendSession>}
   */
  async createSession(sessionData) {
    const backendData = this.mapFrontendToBackend(sessionData)
    const result = await backendApiClient.post('/sessions', backendData)
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {SessionFilters} [filters={}]
   * @returns {Promise<FrontendSession[]>}
   */
  async fetchSessions(filters = {}) {
    const params = new URLSearchParams()
    if (filters.sessionDate) params.append('session_date', filters.sessionDate)
    if (filters.shift) params.append('shift', filters.shift)
    if (filters.status) params.append('status', filters.status)

    const url = `/sessions${params.toString() ? '?' + params.toString() : ''}`
    const sessions = await backendApiClient.get(url)

    return sessions.map((/** @type {import('../types/api.js').components['schemas']['AttendanceSessionResponse'] & {_id?: string}} */ session) => this.mapBackendToFrontend(session))
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<FrontendSession>}
   */
  async fetchSession(sessionId) {
    const session = await backendApiClient.get(`/sessions/${sessionId}`)
    return this.mapBackendToFrontend(session)
  }

  /**
   * @param {string} sessionDate
   * @param {string} shift
   * @returns {Promise<FrontendSession>}
   */
  async getActiveSession(sessionDate, shift) {
    const session = await backendApiClient.get(`/sessions/active/by-date/${sessionDate}/${shift}`)
    return this.mapBackendToFrontend(session)
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<FrontendSession>}
   */
  async finalizeSession(sessionId) {
    const result = await backendApiClient.post(`/sessions/${sessionId}/finalize`)
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<FrontendSession>}
   */
  async unlockSession(sessionId) {
    const result = await backendApiClient.post(`/sessions/${sessionId}/unlock`)
    return this.mapBackendToFrontend(result)
  }


  /**
   * @param {string} sessionId
   * @returns {Promise<FrontendAttendanceRecord[]>}
   */
  async getSessionAttendance(sessionId) {
    const attendance = await backendApiClient.get(`/attendance/sessions/${sessionId}`)
    return attendance.map((/** @type {import('../types/api.js').components['schemas']['AttendanceRecordResponse']} */ record) => this.mapAttendanceBackendToFrontend(record))
  }

  /**
   * @param {string} sessionId
   * @param {string} employeeId
   * @param {Partial<FrontendAttendanceRecord>} attendanceData
   * @returns {Promise<FrontendAttendanceRecord>}
   */
  async updateAttendance(sessionId, employeeId, attendanceData) {
    const backendData = this.mapAttendanceFrontendToBackend(attendanceData)
    const result = await backendApiClient.put(
      `/attendance/sessions/${sessionId}/employees/${employeeId}`,
      backendData
    )
    return this.mapAttendanceBackendToFrontend(result)
  }

  // Map backend camelCase to frontend structure
  /**
   * @param {import('../types/api.js').components['schemas']['AttendanceSessionResponse'] & {_id?: string}} session
   * @returns {FrontendSession}
   */
  mapBackendToFrontend(session) {
    return {
      id: session._id || '',
      date: session.sessionDate,
      shift: session.shift,
      status: session.status === 'in_progress' ? 'active' : session.status,
      supervisorId: session.supervisorId,
      version: session.version,
      finalizedAt: session.finalizedAt,
      finalizedBy: session.finalizedBy,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }
  }

  // Map frontend structure to backend camelCase
  /**
   * @param {Partial<FrontendSession>} session
   * @returns {import('../types/api.js').components['schemas']['AttendanceSessionCreate']}
   */
  mapFrontendToBackend(session) {
    return {
      sessionDate: session.date,
      shift: session.shift,
      supervisorId: session.supervisorId,
      status: session.status === 'active' ? 'in_progress' : session.status,
      version: 1
    }
  }

  // Map attendance record from backend to frontend
  /**
   * @param {import('../types/api.js').components['schemas']['AttendanceRecordResponse']} record
   * @returns {FrontendAttendanceRecord}
   */
  mapAttendanceBackendToFrontend(record) {
    return {
      sessionId: record.sessionId,
      employeeId: record.employeeId,
      status: this.mapAttendanceStatusFromBackend(record.status),
      arrivalTime: record.arrivalTime,
      recordedBy: record.recordedBy,
      remarks: record.remarks,
      version: record.version,
      recordedAt: record.recordedAt
    }
  }

  // Map attendance data from frontend to backend
  /**
   * @param {Partial<FrontendAttendanceRecord>} attendance
   * @returns {import('../types/api.js').components['schemas']['AttendanceRecordUpdate']}
   */
  mapAttendanceFrontendToBackend(attendance) {
    return {
      status: this.mapAttendanceStatus(attendance.status),
      arrivalTime: attendance.arrivalTime,
      remarks: attendance.remarks
    }
  }

  // Map frontend attendance status to backend format
  /**
   * @param {string} status
   * @returns {string}
   */
  mapAttendanceStatus(status) {
    /** @type {Record<string, string>} */
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
  /**
   * @param {string} status
   * @returns {string}
   */
  mapAttendanceStatusFromBackend(status) {
    /** @type {Record<string, string>} */
    const statusMap = {
      'on_time': 'On Time',
      'arrived': 'Arrived',
      'absent': 'Absent'
    }
    return statusMap[status] || status
  }
}

export const restSessionService = new RestSessionService()
