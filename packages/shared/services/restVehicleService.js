const { backendApiClient } = require('./backendApi')

class RestVehicleService {
  async fetchVehicles(filters = {}) {
    const params = new URLSearchParams()
    if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type)
    if (filters.status) params.append('status', filters.status)
    if (filters.active !== undefined) params.append('active', filters.active.toString())

    const url = `/vehicles${params.toString() ? '?' + params.toString() : ''}`
    const vehicles = await backendApiClient.get(url)

    return vehicles.map((vehicle) => this.mapBackendToFrontend(vehicle))
  }

  async fetchVehicle(vehicleNumber) {
    const vehicle = await backendApiClient.get(`/vehicles/${vehicleNumber}`)
    return this.mapBackendToFrontend(vehicle)
  }

  async addVehicle(vehicleData) {
    const backendData = this.mapFrontendToBackend(vehicleData)
    const result = await backendApiClient.post('/vehicles', backendData)
    return this.mapBackendToFrontend(result)
  }

  async updateVehicle(vehicleNumber, vehicleData) {
    const backendData = this.mapFrontendToBackend(vehicleData)
    const result = await backendApiClient.put(`/vehicles/${vehicleNumber}`, backendData)
    return this.mapBackendToFrontend(result)
  }

  async updateVehicleStatus(vehicleNumber, status) {
    const result = await backendApiClient.patch(`/vehicles/${vehicleNumber}/status`, { status })
    return this.mapBackendToFrontend(result)
  }

  async assignDriver(vehicleNumber, driverId) {
    const result = await backendApiClient.post(`/vehicles/${vehicleNumber}/driver/${driverId}`)
    return this.mapBackendToFrontend(result)
  }

  async unassignDriver(vehicleNumber) {
    const result = await backendApiClient.delete(`/vehicles/${vehicleNumber}/driver`)
    return this.mapBackendToFrontend(result)
  }

  async deleteVehicle(vehicleNumber) {
    await backendApiClient.delete(`/vehicles/${vehicleNumber}`)
    return true
  }

  mapBackendToFrontend(vehicle) {
    return {
      id: vehicle.vehicleNumber,
      name: vehicle.vehicleNumber,
      category: 'Vehicles',
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      status: vehicle.status,
      active: vehicle.active,
      perRoleCapacity: vehicle.perRoleCapacity || {},
      assignedDriver: vehicle.assignedDriver || null
    }
  }

  mapFrontendToBackend(vehicle) {
    const backendData = {
      vehicleNumber: vehicle.id || vehicle.name,
      vehicleType: vehicle.category || vehicle.vehicleType || 'Truck',
      capacity: vehicle.capacity !== undefined ? vehicle.capacity : 10,
      status: vehicle.status || 'Available',
      active: vehicle.active !== undefined ? vehicle.active : true,
      perRoleCapacity: vehicle.perRoleCapacity || {},
      assignedDriver: vehicle.assignedDriver || null
    }
    return backendData
  }

  mapUpdateData(vehicle) {
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

  mapFrontendToBackendForUpdate(vehicle) {
    return this.mapUpdateData(vehicle)
  }
}

const restVehicleService = new RestVehicleService()

module.exports = restVehicleService
module.exports.restVehicleService = restVehicleService
module.exports.RestVehicleService = RestVehicleService
