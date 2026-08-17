const { backendApiClient } = require('./backendApi')

class RestSessionService {
  async createSession(sessionData) {
    const backendData = this.mapFrontendToBackend(sessionData)
    const result = await backendApiClient.post('/sessions', backendData)
    return this.mapBackendToFrontend(result)
  }

  async fetchSessions(filters = {}) {
    const params = new URLSearchParams()
    if (filters.sessionDate) params.append('session_date', filters.sessionDate)
    if (filters.shift) params.append('shift', filters.shift)
    if (filters.status) params.append('status', filters.status)

    const url = `/sessions${params.toString() ? '?' + params.toString() : ''}`
    const sessions = await backendApiClient.get(url)

    return sessions.map((session) => this.mapBackendToFrontend(session))
  }

  async fetchSession(sessionId) {
    const session = await backendApiClient.get(`/sessions/${sessionId}`)
    return this.mapBackendToFrontend(session)
  }

  async getActiveSession(sessionDate, shift) {
    const session = await backendApiClient.get(`/sessions/active/by-date/${sessionDate}/${shift}`)
    return this.mapBackendToFrontend(session)
  }

  async finalizeSession(sessionId) {
    const result = await backendApiClient.post(`/sessions/${sessionId}/finalize`)
    return this.mapBackendToFrontend(result)
  }

  async unlockSession(sessionId) {
    const result = await backendApiClient.post(`/sessions/${sessionId}/unlock`)
    return this.mapBackendToFrontend(result)
  }

  async getSessionAttendance(sessionId) {
    const attendance = await backendApiClient.get(`/attendance/sessions/${sessionId}`)
    return attendance.map((record) => this.mapAttendanceBackendToFrontend(record))
  }

  async updateAttendance(sessionId, employeeId, attendanceData) {
    const backendData = this.mapAttendanceFrontendToBackend(attendanceData)
    const result = await backendApiClient.put(
      `/attendance/sessions/${sessionId}/employees/${employeeId}`,
      backendData
    )
    return this.mapAttendanceBackendToFrontend(result)
  }

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

  mapFrontendToBackend(session) {
    return {
      sessionDate: session.date,
      shift: session.shift,
      supervisorId: session.supervisorId,
      status: session.status === 'active' ? 'in_progress' : session.status,
      version: 1
    }
  }

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

  mapAttendanceFrontendToBackend(attendance) {
    return {
      status: this.mapAttendanceStatus(attendance.status),
      arrivalTime: attendance.arrivalTime,
      remarks: attendance.remarks
    }
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

const restSessionService = new RestSessionService()

module.exports = restSessionService
module.exports.restSessionService = restSessionService
module.exports.RestSessionService = RestSessionService
