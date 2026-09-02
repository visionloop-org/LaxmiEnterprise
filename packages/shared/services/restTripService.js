import { googleSheetsService } from './googleSheetsService.js'

export class RestTripService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async listTrips(sessionId = null) {
    return await this.sheets.listTrips(sessionId)
  }

  async fetchTrips(filters = {}) {
    const sessionId = filters?.sessionId || filters?.session || null
    let trips = await this.sheets.listTrips(sessionId)
    if (filters?.vehicleId || filters?.vehicle) {
      const vId = filters.vehicleId || filters.vehicle
      trips = trips.filter(t => t.vehicleId === vId)
    }
    if (filters?.status) {
      trips = trips.filter(t => (t.status || '').toLowerCase() === (filters.status || '').toLowerCase())
    }
    return trips
  }

  async fetchTrip(tripId) {
    const trips = await this.sheets.listTrips()
    return trips.find(t => t.id === tripId || t.tripId === tripId) || null
  }

  async createTrip(tripData) {
    return await this.sheets.createTrip(tripData)
  }

  async updateTripStatus(tripId, statusOrPayload, maybePayload = {}) {
    let payload = {}
    if (typeof statusOrPayload === 'string') {
      payload = { status: statusOrPayload, ...maybePayload }
    } else if (typeof statusOrPayload === 'object' && statusOrPayload !== null) {
      payload = statusOrPayload
    }
    return await this.sheets.updateTripStatus(tripId, payload)
  }
}

export const restTripService = new RestTripService()
export default restTripService
