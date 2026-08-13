// @ts-check
// REST API service for vehicles using FastAPI backend
import { backendApiClient } from './backendApi.js'

/**
 * @typedef {Object} FrontendVehicle
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} capacity
 * @property {string} status
 * @property {boolean} active
 * @property {Object.<string, number>} [perRoleCapacity]
 * @property {string | null} [assignedDriver]
 */

/**
 * @typedef {Object} VehicleFilters
 * @property {string} [vehicle_type]
 * @property {string} [status]
 * @property {boolean} [active]
 */

class RestVehicleService {
  /**
   * @param {VehicleFilters} [filters={}]
   * @returns {Promise<FrontendVehicle[]>}
   */
  async fetchVehicles(filters = {}) {
    const params = new URLSearchParams()
    if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type)
    if (filters.status) params.append('status', filters.status)
    if (filters.active !== undefined) params.append('active', String(filters.active))

    const url = `/vehicles/${params.toString() ? '?' + params.toString() : ''}`
    const vehicles = await backendApiClient.get(url)

    return vehicles.map((/** @type {import('../types/api.js').components['schemas']['VehicleResponse']} */ vehicle) => this.mapBackendToFrontend(vehicle))
  }

  /**
   * @param {string} vehicleNumber
   * @returns {Promise<FrontendVehicle>}
   */
  async fetchVehicle(vehicleNumber) {
    const vehicle = await backendApiClient.get(`/vehicles/${vehicleNumber}`)
    return this.mapBackendToFrontend(vehicle)
  }

  /**
   * @param {FrontendVehicle} vehicleData
   * @returns {Promise<FrontendVehicle>}
   */
  async addVehicle(vehicleData) {
    const backendData = this.mapFrontendToBackend(vehicleData)
    const result = await backendApiClient.post('/vehicles/', backendData)
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {string} vehicleNumber
   * @param {Partial<FrontendVehicle>} updateData
   * @returns {Promise<FrontendVehicle>}
   */
  async updateVehicle(vehicleNumber, updateData) {
    const backendData = this.mapFrontendToBackendForUpdate(updateData)
    const result = await backendApiClient.patch(`/vehicles/${vehicleNumber}`, backendData)
    return this.mapBackendToFrontend(result)
  }

  /**
   * @param {import('../types/api.js').components['schemas']['VehicleResponse']} vehicle
   * @returns {FrontendVehicle}
   */
  mapBackendToFrontend(vehicle) {
    return {
      id: vehicle.vehicleNumber,
      name: vehicle.vehicleNumber,
      category: 'Vehicles',
      capacity: vehicle.capacity || 0,
      status: vehicle.status,
      active: vehicle.active,
      perRoleCapacity: vehicle.perRoleCapacity || {},
      assignedDriver: vehicle.assignedDriver || null
    }
  }

  /**
   * @param {FrontendVehicle} vehicle
   * @returns {import('../types/api.js').components['schemas']['VehicleCreate']}
   */
  mapFrontendToBackend(vehicle) {
    return {
      vehicleNumber: vehicle.id || vehicle.name,
      vehicleType: vehicle.category || 'Truck',
      status: vehicle.status || 'Available',
      active: vehicle.active !== undefined ? vehicle.active : true,
      capacity: vehicle.capacity,
      perRoleCapacity: vehicle.perRoleCapacity,
      assignedDriver: vehicle.assignedDriver
    }
  }

  /**
   * @param {Partial<FrontendVehicle>} vehicle
   * @returns {import('../types/api.js').components['schemas']['VehicleUpdate']}
   */
  mapFrontendToBackendForUpdate(vehicle) {
    const updateData = {}
    if (vehicle.id !== undefined) updateData.vehicleNumber = vehicle.id
    if (vehicle.category !== undefined) updateData.vehicleType = vehicle.category
    if (vehicle.status !== undefined) updateData.status = vehicle.status
    if (vehicle.active !== undefined) updateData.active = vehicle.active
    if (vehicle.capacity !== undefined) updateData.capacity = vehicle.capacity
    if (vehicle.perRoleCapacity !== undefined) updateData.perRoleCapacity = vehicle.perRoleCapacity
    if (vehicle.assignedDriver !== undefined) updateData.assignedDriver = vehicle.assignedDriver
    return updateData
  }
}

export const restVehicleService = new RestVehicleService()
