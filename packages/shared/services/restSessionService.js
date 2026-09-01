import { googleSheetsService } from './googleSheetsService.js'

export class RestSessionService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async getActiveSession(date, shift = 'Morning') {
    return await this.sheets.getActiveSession(date, shift)
  }

  async finalizeSession(sessionId) {
    return await this.sheets.finalizeSession(sessionId)
  }

  async unlockSession(sessionId) {
    return await this.sheets.unlockSession(sessionId)
  }
}

export const restSessionService = new RestSessionService()
export default restSessionService
