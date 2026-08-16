import { backendApiClient } from './backendApi.js'

export const restTripService = {
  async fetchTrips(filters = {}) {
    const params = new URLSearchParams()
    if (filters.sessionId) params.append('session_id', filters.sessionId)
    if (filters.vehicleId) params.append('vehicle_id', filters.vehicleId)
    if (filters.status) params.append('status', filters.status)

    const queryStr = params.toString() ? `?${params.toString()}` : ''
    return backendApiClient.request(`/trips/${queryStr}`)
  },

  async fetchTrip(tripId) {
    return backendApiClient.request(`/trips/${tripId}`)
  },

  async createTrip(tripData) {
    return backendApiClient.request('/trips/', {
      method: 'POST',
      body: JSON.stringify(tripData)
    })
  },

  async updateTripStatus(tripId, { status, locationName, receiverName, remarks }) {
    return backendApiClient.request(`/trips/${tripId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, locationName, receiverName, remarks })
    })
  }
}
