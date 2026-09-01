import { googleSheetsService } from './googleSheetsService.js'

export class RestTripService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async listTrips(sessionId) {
    return await this.sheets.listTrips(sessionId)
  }

  async createTrip(tripData) {
    return await this.sheets.createTrip(tripData)
  }

  async updateTripStatus(tripId, payload) {
    return await this.sheets.updateTripStatus(tripId, payload)
  }
}

export const restTripService = new RestTripService()
export default restTripService
