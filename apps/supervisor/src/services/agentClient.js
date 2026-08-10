// Agent communication wrapper for server-side agent integration
import { apiClient } from './api.js'

class AgentClient {
  /**
   * Send action request to server-side agent
   * @param {string} action - Action identifier (e.g., 'update_attendance', 'assign_vehicle')
   * @param {object} params - Action parameters
   * @param {object} context - Additional context (session info, user info, etc.)
   * @returns {Promise<object>} Agent response with result and status
   */
  async sendAction(action, params = {}, context = {}) {
    const payload = {
      action,
      params,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
    }

    try {
      const response = await apiClient.post('/agent/action', payload)
      
      // Handle async operations (long-running tasks)
      if (response.jobId) {
        return this.waitForJobCompletion(response.jobId, response.webhookUrl)
      }

      return response
    } catch (error) {
      console.error(`Agent action failed [${action}]:`, error)
      throw error
    }
  }

  /**
   * Wait for async job completion via polling or webhook
   * @param {string} jobId - Job identifier
   * @param {string} webhookUrl - Optional webhook URL for callbacks
   * @returns {Promise<object>} Final job result
   */
  async waitForJobCompletion(jobId, webhookUrl) {
    // If webhook URL provided, register callback and return immediately
    if (webhookUrl) {
      return { jobId, status: 'pending', webhookUrl }
    }

    // Otherwise poll for completion
    const maxAttempts = 30
    const pollInterval = 1000
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await apiClient.get(`/agent/jobs/${jobId}`)
        
        if (response.status === 'completed') {
          return response.result
        } else if (response.status === 'failed') {
          throw new Error(response.error || 'Job failed')
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval))
        attempts++
      } catch (error) {
        throw error
      }
    }

    throw new Error('Job timeout')
  }

  /**
   * Batch multiple actions to agent
   * @param {Array<{action: string, params: object}>} actions - Array of actions
   * @param {object} context - Shared context for all actions
   * @returns {Promise<Array>} Array of results
   */
  async batchActions(actions, context = {}) {
    const payload = {
      actions,
      context: {
        timestamp: new Date().toISOString(),
        batch: true,
        ...context,
      },
    }

    try {
      const response = await apiClient.post('/agent/batch', payload)
      return response.results || []
    } catch (error) {
      console.error('Agent batch action failed:', error)
      throw error
    }
  }

  /**
   * Query agent state or capabilities
   * @param {string} query - Query type (e.g., 'status', 'capabilities')
   * @returns {Promise<object>} Agent state info
   */
  async queryAgent(query) {
    try {
      return await apiClient.get(`/agent/query/${query}`)
    } catch (error) {
      console.error(`Agent query failed [${query}]:`, error)
      throw error
    }
  }

  /**
   * Sync local state with agent state
   * @param {object} localState - Current local state
   * @returns {Promise<object>} Merged state from agent
   */
  async syncState(localState) {
    try {
      const response = await apiClient.post('/agent/sync', { localState })
      return response.state || localState
    } catch (error) {
      console.error('Agent state sync failed:', error)
      throw error
    }
  }
}

export const agentClient = new AgentClient()
