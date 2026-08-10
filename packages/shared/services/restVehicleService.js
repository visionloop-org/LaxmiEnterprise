// REST API service for vehicles using FastAPI backend
import { backendApiClient } from './backendApi.js'

class RestVehicleService {
  async fetchVehicles(filters = {}) {
    const params = new URLSearchParams()
    if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type)
    if (filters.status) params.append('status', filters.status)
    if (filters.active !== undefined) params.append('active', filters.active)
    
    const url = `/vehicles${params.toString() ? '?' + params.toString() : ''}`
    const vehicles = await backendApiClient.get(url)
    
    return vehicles.map(vehicle => this.mapBackendToFrontend(vehicle))
  }

  async fetchVehicle(vehicleNumber) {
    const vehicle = await backendApiClient.get(`/vehicles/${vehicleNumber}`)
    return this.mapBackendToFrontend(vehicle)
  }

  async updateStatus(vehicleNumber, status) {
    const updateData = { status }
    const result = await backendApiClient.patch(`/vehicles/${vehicleNumber}`, updateData)
    return this.mapBackendToFrontend(result)
  }

  async createVehicle(vehicleData) {
    const backendData = this.mapFrontendToBackend(vehicleData)
    const result = await backendApiClient.post('/vehicles', backendData)
    return this.mapBackendToFrontend(result)
  }

  async updateVehicle(vehicleNumber, updateData) {
    const backendData = this.mapFrontendToBackend(updateData)
    const result = await backendApiClient.patch(`/vehicles/${vehicleNumber}`, backendData)
    return this.mapBackendToFrontend(result)
  }

  // Map backend camelCase to frontend structure
  mapBackendToFrontend(vehicle) {
    return {
      id: vehicle.vehicleNumber,
      number: vehicle.vehicleNumber,
      type: vehicle.vehicleType,
      status: vehicle.status,
      locked: !vehicle.active,
      statusHistory: [
        {
          status: vehicle.status,
          timestamp: vehicle.createdAt || new Date().toISOString()
        }
      ]
    }
  }

  // Map frontend structure to backend camelCase
  mapFrontendToBackend(vehicle) {
    return {
      vehicleNumber: vehicle.number || vehicle.id,
      vehicleType: vehicle.type,
      status: vehicle.status || 'available',
      active: !vehicle.locked
    }
  }

  // Map frontend status to backend format
  mapVehicleStatus(status) {
    const statusMap = {
      'available': 'available',
      'in_use': 'in_use',
      'maintenance': 'maintenance'
    }
    return statusMap[status] || status
  }

  // Map backend status to frontend format
  mapVehicleStatusFromBackend(status) {
    const statusMap = {
      'available': 'available',
      'in_use': 'in_use',
      'maintenance': 'maintenance'
    }
    return statusMap[status] || status
  }
}

export const restVehicleService = new RestVehicleService()
