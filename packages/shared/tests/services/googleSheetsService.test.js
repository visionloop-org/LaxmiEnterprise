import { expect } from 'chai'
import { GoogleSheetsService } from '../../services/googleSheetsService.js'

describe('GoogleSheetsService', () => {
  let service

  beforeEach(() => {
    service = new GoogleSheetsService()
  })

  it('should initialize with default seed employees and vehicles', async () => {
    const employees = await service.getEmployees()
    const vehicles = await service.getVehicles()

    expect(employees).to.be.an('array')
    expect(employees.length).to.be.at.least(5)
    expect(vehicles).to.be.an('array')
    expect(vehicles.length).to.be.at.least(3)
  })

  it('should add a new employee and query by category', async () => {
    const newEmp = await service.addEmployee({
      name: 'Test Worker',
      category: 'Workers',
      baseRate: 550
    })

    expect(newEmp).to.have.property('id')
    expect(newEmp.name).to.equal('Test Worker')

    const workers = await service.getEmployees({ category: 'Workers' })
    const found = workers.find(w => w.name === 'Test Worker')
    expect(found).to.not.be.undefined
  })

  it('should update employee attendance', async () => {
    const emp = (await service.getEmployees())[0]
    await service.recordAttendance('SES-TEST', emp.id, 'arrived', '08:30 AM', 'Came early')

    const records = service.getTable('attendance_records')
    const rec = records.find(r => r.employeeId === emp.id && r.sessionId === 'SES-TEST')
    expect(rec).to.not.be.undefined
    expect(rec.status).to.equal('arrived')
    expect(rec.arrivalTime).to.equal('08:30 AM')
  })

  it('should assign and unassign vehicle to an employee', async () => {
    const emp = (await service.getEmployees())[0]
    await service.assignVehicle('SES-TEST', 'VEH-101', emp.id, 'Driver')

    let assignments = service.getTable('vehicle_assignments')
    let assign = assignments.find(a => a.sessionId === 'SES-TEST' && a.employeeId === emp.id)
    expect(assign).to.not.be.undefined
    expect(assign.vehicleId).to.equal('VEH-101')

    await service.unassignVehicle('SES-TEST', 'VEH-101', emp.id)
    assignments = service.getTable('vehicle_assignments')
    assign = assignments.find(a => a.sessionId === 'SES-TEST' && a.employeeId === emp.id)
    expect(assign).to.be.undefined
  })

  it('should create and list vehicle trips', async () => {
    const trip = await service.createTrip({
      sessionId: 'SES-TEST',
      vehicleId: 'VEH-101',
      destination: 'Site North',
      status: 'Dispatched'
    })

    expect(trip).to.have.property('tripId')
    const trips = await service.listTrips('SES-TEST')
    expect(trips.some(t => t.tripId === trip.tripId)).to.be.true
  })
})
