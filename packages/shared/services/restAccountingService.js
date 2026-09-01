import { googleSheetsService } from './googleSheetsService.js'

export class RestAccountingService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async getStatus() {
    const stats = this.sheets.getStats()
    return {
      status: stats.googleSheets.configured ? 'connected' : 'local_mode',
      ...stats.googleSheets
    }
  }

  async getStats() {
    return this.sheets.getStats()
  }

  async syncEmployees() {
    return await this.sheets.fetchFromGoogleSheets()
  }

  async syncTimesheets(sessionId) {
    return await this.sheets.pushAllToGoogleSheets()
  }

  async syncPayroll(sessionDate) {
    return await this.sheets.pushAllToGoogleSheets()
  }
}

export const restAccountingService = new RestAccountingService()
export default restAccountingService
