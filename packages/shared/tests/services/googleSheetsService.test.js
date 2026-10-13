import { expect } from 'chai'
import { GoogleSheetsService, MULTI_SPREADSHEET_DOMAINS, getDefaultSpreadsheets } from '../../services/googleSheetsService.js'
import { authService } from '../../services/authService.js'

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

  describe('Multi-Spreadsheet Architecture', () => {
    it('should define the 3 domain spreadsheets with correct table mappings', () => {
      expect(MULTI_SPREADSHEET_DOMAINS).to.have.all.keys('hr_master', 'attendance_fleet', 'payroll_accounting')

      expect(MULTI_SPREADSHEET_DOMAINS.hr_master.name).to.equal('01_Laxmi_HR_Master')
      expect(MULTI_SPREADSHEET_DOMAINS.hr_master.tables).to.include('employees')
      expect(MULTI_SPREADSHEET_DOMAINS.hr_master.tables).to.include('contractors')

      expect(MULTI_SPREADSHEET_DOMAINS.attendance_fleet.name).to.equal('02_Laxmi_Attendance_Fleet')
      expect(MULTI_SPREADSHEET_DOMAINS.attendance_fleet.tables).to.include('vehicles')
      expect(MULTI_SPREADSHEET_DOMAINS.attendance_fleet.tables).to.include('attendance_sessions')

      expect(MULTI_SPREADSHEET_DOMAINS.payroll_accounting.name).to.equal('03_Laxmi_Payroll_Accounting')
      expect(MULTI_SPREADSHEET_DOMAINS.payroll_accounting.tables).to.include('daily_payroll')
      expect(MULTI_SPREADSHEET_DOMAINS.payroll_accounting.tables).to.include('audit_logs')
    })

    it('should initialize and return default spreadsheets configuration', () => {
      const defaults = getDefaultSpreadsheets()
      expect(defaults).to.have.property('hr_master')
      expect(defaults).to.have.property('attendance_fleet')
      expect(defaults).to.have.property('payroll_accounting')

      const sps = service.getSpreadsheets()
      expect(sps).to.have.property('hr_master')
      expect(sps).to.have.property('attendance_fleet')
      expect(sps).to.have.property('payroll_accounting')
    })

    it('should include multi-spreadsheet details in getStats()', () => {
      const stats = service.getStats()
      expect(stats.googleSheets).to.have.property('multiSheet')
      expect(stats.googleSheets).to.have.property('spreadsheets')
      expect(stats.googleSheets.spreadsheets).to.have.property('hr_master')
      expect(stats.localStore).to.have.property('total_employees')
      expect(stats.localStore).to.have.property('total_vehicles')
    })

    it('should safely handle openSpreadsheet in non-browser environment', () => {
      const res = service.openSpreadsheet('hr_master')
      expect(res).to.be.false
    })

    it('should correctly configure default user roles in seed data', () => {
      const roles = service.getTable('users_roles')
      const gaurav = roles.find(r => r.email.toLowerCase() === 'gauravjaiswal0304@gmail.com')
      const godown = roles.find(r => r.email.toLowerCase() === 'maalaxmi.godown@gmail.com')

      expect(gaurav).to.not.be.undefined
      expect(gaurav.role).to.equal('Admin')

      expect(godown).to.not.be.undefined
      expect(godown.role).to.equal('Supervisor')
    })

    it('should authenticate Gaurav as Admin and Maalaxmi Godown as Supervisor via authService', async () => {
      const gauravLogin = await authService.login('Gauravjaiswal0304@gmail.com')
      expect(gauravLogin.user.role).to.equal('admin')
      expect(gauravLogin.user.access).to.equal('admin')

      const godownLogin = await authService.login('Maalaxmi.godown@gmail.com')
      expect(godownLogin.user.role).to.equal('supervisor')
      expect(godownLogin.user.access).to.equal('supervisor')
    })

    it('should authenticate Ruhil Jaiswal as Supervisor and deny unauthorized users', async () => {
      // 1. Ruhil Jaiswal username login
      const ruhilLogin = await authService.login('ruhiljaiswal')
      expect(ruhilLogin.user.role).to.equal('supervisor')
      expect(ruhilLogin.user.access).to.equal('supervisor')
      expect(authService.isAuthenticated()).to.be.true
      expect(authService.isSupervisor()).to.be.true
      expect(authService.isAdmin()).to.be.false

      // 2. Ruhil Jaiswal gmail login
      const ruhilEmailLogin = await authService.login('ruhiljaiswal@gmail.com')
      expect(ruhilEmailLogin.user.role).to.equal('supervisor')
      expect(ruhilEmailLogin.user.name).to.include('Ruhil Jaiswal')

      // 3. Logout
      authService.logout()
      expect(authService.isAuthenticated()).to.be.false
      expect(authService.isSupervisor()).to.be.false

      // 4. Reject unauthorized user
      try {
        await authService.login('random_unauthorized_user')
        expect.fail('Should have rejected unauthorized user')
      } catch (err) {
        expect(err.message).to.include('Access Denied')
      }
    })
  })

  describe('Live Sync & Real-Time Event Notification', () => {
    it('should allow components to subscribe and receive SYNC_COMPLETED events', (done) => {
      const unsubscribe = service.subscribe((eventType, payload) => {
        if (eventType === 'SYNC_COMPLETED') {
          expect(payload).to.have.property('timestamp')
          expect(payload).to.have.property('tables')
          unsubscribe()
          done()
        }
      })

      service.notifyListeners('SYNC_COMPLETED', {
        timestamp: new Date().toISOString(),
        tables: ['employees', 'vehicles']
      })
    })

    it('should correctly unsubscribe from events', () => {
      let callCount = 0
      const unsubscribe = service.subscribe(() => {
        callCount++
      })

      service.notifyListeners('TEST_EVENT', {})
      expect(callCount).to.equal(1)

      unsubscribe()
      service.notifyListeners('TEST_EVENT', {})
      expect(callCount).to.equal(1) // not incremented
    })

    it('should start and cleanly stop auto-sync background timer', () => {
      expect(service.autoSyncTimer).to.be.null

      service.startAutoSync(50000)
      expect(service.autoSyncTimer).to.not.be.null

      service.stopAutoSync()
      expect(service.autoSyncTimer).to.be.null
    })
  })
})

