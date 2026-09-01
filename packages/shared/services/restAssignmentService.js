import { googleSheetsService } from './googleSheetsService.js'

export class RestAssignmentService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async assign(sessionId, vehicleId, employeeId, role = 'Passenger') {
    return await this.sheets.assignVehicle(sessionId, vehicleId, employeeId, role)
  }

  async unassign(sessionId, vehicleId, employeeId) {
    return await this.sheets.unassignVehicle(sessionId, vehicleId, employeeId)
  }
}

export const restAssignmentService = new RestAssignmentService()
export default restAssignmentService
