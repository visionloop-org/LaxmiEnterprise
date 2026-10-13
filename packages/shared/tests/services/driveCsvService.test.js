import assert from 'assert'
import { DriveCsvService, getDriveCsvService, DRIVE_DOMAINS } from '../../services/driveCsvService.js'

describe('DriveCsvService (Direct Auth & Partitioned Storage Engine)', () => {
  let service

  beforeEach(() => {
    service = new DriveCsvService()
    // Initialize in-memory clean tables
    service.memoryStore = {
      employees: [
        { id: 'EMP001', name: 'Ramesh Kumar', category: 'Drivers', baseRate: 800, bankAccountNo: '1234567890', bankIfsc: 'UTIB0000123' },
        { id: 'EMP002', name: 'Suresh Yadav', category: 'Workers', baseRate: 500, bankAccountNo: '9876543210', bankIfsc: 'SBIN0000456' }
      ],
      attendance_records: [
        // 6 years old record (should be pruned)
        { id: 'REC-OLD', employeeId: 'EMP001', date: '2020-01-15', status: 'present' },
        // 2 years old record (should be kept)
        { id: 'REC-MID', employeeId: 'EMP001', date: '2024-06-20', status: 'present' },
        // Recent record (should be kept)
        { id: 'REC-NEW', employeeId: 'EMP002', date: '2026-10-10', status: 'present' }
      ],
      attendance_sessions: [
        { id: 'SES-OLD', shift_date: '2019-12-01', status: 'finalized' },
        { id: 'SES-NEW', shift_date: '2026-10-10', status: 'active' }
      ],
      vehicle_trips: [
        { id: 'TRIP-OLD', timestamp: '2018-05-10', vehicleId: 'VEH-01' },
        { id: 'TRIP-NEW', timestamp: '2026-10-12', vehicleId: 'VEH-02' }
      ],
      audit_logs: [
        { id: 'AUDIT-OLD', createdAt: '2019-01-01', action: 'session_locked' },
        { id: 'AUDIT-NEW', createdAt: '2026-10-12', action: 'attendance_marked' }
      ],
      daily_payroll: [
        { employeeId: 'EMP001', date: '2026-10-12', grandTotal: 1200 },
        { employeeId: 'EMP002', date: '2026-10-12', grandTotal: 500 }
      ]
    }
  })

  describe('5-Year Rolling Data Retention Engine', () => {
    it('should prune records older than 5 years and retain recent records', () => {
      const result = service.pruneRecordsOlderThan5Years()
      
      // Total pruned: 1 in attendance_records + 1 in attendance_sessions + 1 in vehicle_trips + 1 in audit_logs = 4
      assert.strictEqual(result.prunedCount, 4)
      assert.ok(result.cutoffDate)

      // Verify attendance_records
      const attendance = service.getTable('attendance_records')
      assert.strictEqual(attendance.length, 2)
      assert.ok(attendance.every(r => r.id !== 'REC-OLD'))
      assert.ok(attendance.some(r => r.id === 'REC-MID'))
      assert.ok(attendance.some(r => r.id === 'REC-NEW'))

      // Verify attendance_sessions
      const sessions = service.getTable('attendance_sessions')
      assert.strictEqual(sessions.length, 1)
      assert.strictEqual(sessions[0].id, 'SES-NEW')

      // Verify vehicle_trips
      const trips = service.getTable('vehicle_trips')
      assert.strictEqual(trips.length, 1)
      assert.strictEqual(trips[0].id, 'TRIP-NEW')

      // Verify audit_logs
      const logs = service.getTable('audit_logs')
      assert.strictEqual(logs.length, 1)
      assert.strictEqual(logs[0].id, 'AUDIT-NEW')
    })
  })

  describe('1-Click Bank Bulk Transfer CSV Export', () => {
    it('should generate bank-ready CSV with correct headers and mapping', () => {
      const csvOutput = service.exportBankTransferCSV()

      assert.ok(typeof csvOutput === 'string')
      const lines = csvOutput.trim().split('\n')

      // Header verification
      assert.strictEqual(lines[0], 'Beneficiary_Name,Account_Number,IFSC_Code,Amount,Remarks,Payment_Date')

      // Row 1: Ramesh Kumar (EMP001)
      assert.ok(lines[1].includes('Ramesh Kumar'))
      assert.ok(lines[1].includes('1234567890'))
      assert.ok(lines[1].includes('UTIB0000123'))
      assert.ok(lines[1].includes('1200'))

      // Row 2: Suresh Yadav (EMP002)
      assert.ok(lines[2].includes('Suresh Yadav'))
      assert.ok(lines[2].includes('9876543210'))
      assert.ok(lines[2].includes('SBIN0000456'))
      assert.ok(lines[2].includes('500'))
    })

    it('should auto-deduct mid-month salary advances in bank transfer CSV output', () => {
      // Add advance for EMP001 (₹200 advance against ₹1200 gross)
      service.setTable('salary_advances', [
        { id: 'ADV-01', employeeId: 'EMP001', amount: 200, status: 'pending' }
      ])

      const csvOutput = service.exportBankTransferCSV()
      const lines = csvOutput.trim().split('\n')

      // Ramesh Kumar gross is 1200, minus 200 advance = 1000 net payout
      assert.ok(lines[1].includes('Ramesh Kumar'))
      assert.ok(lines[1].includes('1000'))
      assert.ok(lines[1].includes('AdvDed200'))
    })
  })

  describe('3-Domain Partitioned Architecture', () => {
    it('should define the 3 specialized domain partitions', () => {
      assert.ok(DRIVE_DOMAINS.hr_master)
      assert.ok(DRIVE_DOMAINS.attendance_fleet)
      assert.ok(DRIVE_DOMAINS.payroll_accounting)

      assert.strictEqual(DRIVE_DOMAINS.hr_master.name, '01_Laxmi_HR_Master')
      assert.strictEqual(DRIVE_DOMAINS.attendance_fleet.name, '02_Laxmi_Attendance_Fleet')
      assert.strictEqual(DRIVE_DOMAINS.payroll_accounting.name, '03_Laxmi_Payroll_Accounting')
    })
  })

  describe('1-Click Backup & Restore Engine', () => {
    it('should create a complete JSON snapshot of all tables', () => {
      const backup = service.createSnapshotBackup()
      assert.strictEqual(backup.version, '2.0-direct-auth')
      assert.ok(backup.exportedAt)
      assert.ok(backup.tables)
      assert.strictEqual(backup.tables.employees.length, 2)
      assert.strictEqual(backup.tables.daily_payroll.length, 2)
    })

    it('should restore tables from snapshot accurately', () => {
      const backup = service.createSnapshotBackup()
      // Modify current tables
      service.setTable('employees', [])
      assert.strictEqual(service.getTable('employees').length, 0)

      // Restore from backup
      const res = service.restoreSnapshotBackup(backup)
      assert.strictEqual(res.success, true)
      assert.strictEqual(service.getTable('employees').length, 2)
      assert.strictEqual(service.getTable('employees')[0].id, 'EMP001')
    })
  })
})
