// Session service for server-side agent communication
import { agentClient } from './agentClient.js'

class SessionService {
  /**
   * Initialize new attendance session
   * @param {object} sessionData - Session data (date, shift, supervisor, etc.)
   * @returns {Promise<object>} Created session
   */
  async initializeSession(sessionData) {
    return await agentClient.sendAction('initialize_session', {
      sessionData,
    })
  }

  /**
   * Load existing session
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Session data with employees and vehicles
   */
  async loadSession(sessionId) {
    return await agentClient.sendAction('load_session', { sessionId })
  }

  /**
   * Get current session state
   * @returns {Promise<object>} Current session state
   */
  async getCurrentSession() {
    return await agentClient.sendAction('get_current_session')
  }

  /**
   * Finalize attendance session
   * @param {string} sessionId - Session ID
   * @param {object} finalizationData - Additional data (supervisor signature, notes, etc.)
   * @returns {Promise<object>} Finalized session
   */
  async finalizeSession(sessionId, finalizationData = {}) {
    return await agentClient.sendAction('finalize_session', {
      sessionId,
      finalizationData,
    })
  }

  /**
   * Lock/unlock attendance for session
   * @param {string} sessionId - Session ID
   * @param {boolean} locked - Lock state
   * @returns {Promise<object>} Updated session
   */
  async setAttendanceLock(sessionId, locked) {
    return await agentClient.sendAction('set_attendance_lock', {
      sessionId,
      locked,
    })
  }

  /**
   * Save session state (for persistence)
   * @param {string} sessionId - Session ID
   * @param {object} state - Current state (employees, vehicles, etc.)
   * @returns {Promise<object>} Saved state
   */
  async saveState(sessionId, state) {
    return await agentClient.sendAction('save_state', {
      sessionId,
      state,
    })
  }

  /**
   * Load saved state
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Saved state
   */
  async loadState(sessionId) {
    return await agentClient.sendAction('load_state', { sessionId })
  }

  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Session statistics
   */
  async getSessionStats(sessionId) {
    return await agentClient.sendAction('get_session_stats', { sessionId })
  }

  /**
   * List all sessions
   * @param {object} filters - Optional filters (date range, status, etc.)
   * @returns {Promise<Array>} Array of sessions
   */
  async listSessions(filters = {}) {
    return await agentClient.sendAction('list_sessions', { filters })
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Deletion confirmation
   */
  async deleteSession(sessionId) {
    return await agentClient.sendAction('delete_session', { sessionId })
  }

  /**
   * Sync local state with server session state
   * @param {string} sessionId - Session ID
   * @param {object} localState - Current local state
   * @returns {Promise<object>} Merged state from server
   */
  async syncSessionState(sessionId, localState) {
    return await agentClient.sendAction('sync_session_state', {
      sessionId,
      localState,
    })
  }
}

export const sessionService = new SessionService()
