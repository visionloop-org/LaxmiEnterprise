import { googleSheetsService } from './googleSheetsService.js'

export class RestVehicleService {
  constructor(sheetsService = googleSheetsService) {
    this.sheets = sheetsService
  }

  async fetchVehicles(filters = {}) {
    const raw = await this.sheets.getVehicles(filters)
    return raw.map(v => this.mapBackendToFrontend(v))
  }

  async fetchVehicle(vehicleNumber) {
    const raw = await this.sheets.getVehicles()
    const found = raw.find(v => v.number === vehicleNumber || v.id === vehicleNumber || v.vehicleNumber === vehicleNumber)
    return found ? this.mapBackendToFrontend(found) : null
  }

  async addVehicle(vehicleData) {
    const toSave = this.mapFrontendToBackend(vehicleData)
    const res = await this.sheets.addVehicle(toSave)
    return this.mapBackendToFrontend(res)
  }

  async updateVehicle(vehicleNumber, updateData) {
    const toSave = this.mapFrontendToBackendForUpdate(updateData)
    const res = await this.sheets.updateVehicle(vehicleNumber, toSave)
    return this.mapBackendToFrontend(res)
  }

  mapBackendToFrontend(backendVeh) {
    if (!backendVeh) return null
    return {
      id: backendVeh.vehicleNumber || backendVeh.number || backendVeh.id || backendVeh._id,
      number: backendVeh.vehicleNumber || backendVeh.number || backendVeh.id,
      name: backendVeh.name || backendVeh.vehicleNumber || backendVeh.number || backendVeh.id,
      category: 'Vehicles',
      type: backendVeh.vehicleType || backendVeh.type || 'Truck',
      capacity: backendVeh.capacity !== undefined ? backendVeh.capacity : 8,
      status: backendVeh.status || 'available',
      active: backendVeh.active !== false,
      perRoleCapacity: backendVeh.perRoleCapacity || {},
      assignedDriver: backendVeh.assignedDriver || null
    }
  }

  mapFrontendToBackend(frontendVeh) {
    if (!frontendVeh) return null
    return {
      vehicleNumber: frontendVeh.id || frontendVeh.number || frontendVeh.name,
      vehicleType: frontendVeh.category || frontendVeh.type || 'Truck',
      name: frontendVeh.name || frontendVeh.id || frontendVeh.number,
      capacity: frontendVeh.capacity !== undefined ? frontendVeh.capacity : 8,
      status: frontendVeh.status || 'available',
      active: frontendVeh.active !== false,
      perRoleCapacity: frontendVeh.perRoleCapacity || {},
      assignedDriver: frontendVeh.assignedDriver || null
    }
  }

  mapFrontendToBackendForUpdate(frontendVeh) {
    if (!frontendVeh) return {}
    const update = {}
    if (frontendVeh.id !== undefined) update.vehicleNumber = frontendVeh.id
    if (frontendVeh.number !== undefined) update.vehicleNumber = frontendVeh.number
    if (frontendVeh.category !== undefined) update.vehicleType = frontendVeh.category
    if (frontendVeh.type !== undefined) update.vehicleType = frontendVeh.type
    if (frontendVeh.name !== undefined) update.name = frontendVeh.name
    if (frontendVeh.capacity !== undefined) update.capacity = frontendVeh.capacity
    if (frontendVeh.status !== undefined) update.status = frontendVeh.status
    if (frontendVeh.active !== undefined) update.active = frontendVeh.active
    if (frontendVeh.perRoleCapacity !== undefined) update.perRoleCapacity = frontendVeh.perRoleCapacity
    if (frontendVeh.assignedDriver !== undefined) update.assignedDriver = frontendVeh.assignedDriver
    return update
  }
}

export const restVehicleService = new RestVehicleService()
export default restVehicleService
