import assert from 'assert'
import {
  ClientComputationService,
  clientComputationService,
  DEFAULT_CATEGORY_RATES,
  MAX_VEHICLE_CAPACITY
} from '../../services/clientComputationService.js'

describe('ClientComputationService (100% Client-Side Computation)', () => {
  let service

  beforeEach(() => {
    service = new ClientComputationService()
  })

  describe('Payroll Calculation Engine', () => {
    it('should use default category rate when baseRate is missing', () => {
      const driver = { id: 'EMP-01', name: 'Ramesh', category: 'Drivers', attendance: 'on_time' }
      const worker = { id: 'EMP-02', name: 'Suresh', category: 'Workers', attendance: 'on_time' }

      const driverPay = service.calculateWorkerPayroll(driver)
      const workerPay = service.calculateWorkerPayroll(worker)

      assert.strictEqual(driverPay.baseRate, 800)
      assert.strictEqual(driverPay.earnedBase, 800)
      assert.strictEqual(driverPay.netPay, 800)

      assert.strictEqual(workerPay.baseRate, 500)
      assert.strictEqual(workerPay.earnedBase, 500)
      assert.strictEqual(workerPay.netPay, 500)
    })

    it('should accurately calculate 1.5x overtime pay', () => {
      // Driver base 800, hourly 100, 2 extra hours => 2 * 100 * 1.5 = 300 overtime
      const driver = {
        id: 'EMP-01',
        name: 'Ramesh',
        category: 'Drivers',
        attendance: 'on_time',
        extraHours: 2,
        incentive: 50
      }

      const pay = service.calculateWorkerPayroll(driver)
      assert.strictEqual(pay.baseRate, 800)
      assert.strictEqual(pay.hourlyRate, 100)
      assert.strictEqual(pay.overtimePay, 300)
      assert.strictEqual(pay.incentive, 50)
      assert.strictEqual(pay.grossPay, 1150)
      assert.strictEqual(pay.netPay, 1150)
    })

    it('should accurately deduct mid-month salary advances (Peshgi / Khata) from net pay', () => {
      const workerWithAdvance = {
        id: 'EMP-02',
        name: 'Suresh',
        category: 'Workers',
        attendance: 'on_time',
        baseRate: 500,
        advanceDeducted: 150
      }

      const pay = service.calculateWorkerPayroll(workerWithAdvance)
      assert.strictEqual(pay.earnedBase, 500)
      assert.strictEqual(pay.advanceDeducted, 150)
      assert.strictEqual(pay.grossPay, 500)
      assert.strictEqual(pay.netPay, 350) // 500 - 150 = 350
    })

    it('should award Full Day Pay + incentive for Entry at Correct Time', () => {
      const onTimeDriver = {
        id: 'EMP-01',
        name: 'Ramesh',
        category: 'Drivers',
        attendance: 'on_time',
        baseRate: 800,
        incentive: 100
      }

      const pay = service.calculateWorkerPayroll(onTimeDriver)
      assert.strictEqual(pay.earnedBase, 800)
      assert.strictEqual(pay.incentive, 100)
      assert.strictEqual(pay.netPay, 900)
      assert.strictEqual(pay.attendanceLabel, 'Entry at Correct Time')
    })

    it('should award Full Day Pay without incentive for Entry after Time', () => {
      const lateDriver = {
        id: 'EMP-01',
        name: 'Ramesh',
        category: 'Drivers',
        attendance: 'arrived', // Entry after Time
        baseRate: 800,
        incentive: 100
      }

      const pay = service.calculateWorkerPayroll(lateDriver)
      assert.strictEqual(pay.earnedBase, 800) // Full Day Pay preserved!
      assert.strictEqual(pay.incentive, 0)   // Incentive forfeited
      assert.strictEqual(pay.netPay, 800)
      assert.strictEqual(pay.attendanceLabel, 'Entry after Time')
    })

    it('should return 0 pay for absent workers', () => {
      const absentWorker = {
        id: 'EMP-03',
        name: 'Mahesh',
        category: 'Workers',
        attendance: 'absent',
        extraHours: 4,
        incentive: 100
      }

      const pay = service.calculateWorkerPayroll(absentWorker)
      assert.strictEqual(pay.earnedBase, 0)
      assert.strictEqual(pay.overtimePay, 0)
      assert.strictEqual(pay.incentive, 0)
      assert.strictEqual(pay.netPay, 0)
    })

    it('should compute complete shift payroll aggregation for Google Sheets Daily_Payroll', () => {
      const employees = [
        { id: 'EMP-1', name: 'Driver 1', category: 'Drivers', attendance: 'on_time', extraHours: 2 },
        { id: 'EMP-2', name: 'Chalan 1', category: 'Chalan Men', attendance: 'arrived', extraHours: 0 },
        { id: 'EMP-3', name: 'Worker 1', category: 'Workers', attendance: 'on_time', extraHours: 1 },
        { id: 'EMP-4', name: 'Worker 2', category: 'Workers', attendance: 'absent' }
      ]

      const result = service.calculateDailyShiftPayroll(employees, { sessionDate: '2026-09-06' })
      assert.strictEqual(result.summary.totalWorkers, 4)
      assert.strictEqual(result.summary.presentWorkers, 3)
      assert.strictEqual(result.summary.absentCount, 1)
      assert.strictEqual(result.summary.onTimeCount, 2)
      assert.strictEqual(result.summary.arrivedLateCount, 1)

      // Driver: 800 + 300 = 1100
      // Chalan: 650
      // Worker 1: 500 + (1 * 62.5 * 1.5 = 94) = 594
      // Total Base Pay = 800 + 650 + 500 = 1950
      assert.strictEqual(result.summary.totalBasePay, 1950)
      assert.strictEqual(result.summary.totalOvertimeHours, 3)
      assert.strictEqual(result.summary.totalOvertimePay, 394)
      assert.strictEqual(result.summary.totalNetPayroll, 2344)
    })
  })

  describe('Contractor Settlements Engine', () => {
    it('should calculate contractor agency commission and net payable', () => {
      const contractors = [
        { name: 'Sharma Labour Agency', commissionRate: 5, contact: '9876543210' }
      ]
      const employees = [
        { id: 'EMP-10', name: 'Worker A', category: 'Workers', contractor: 'Sharma Labour Agency', attendance: 'on_time' },
        { id: 'EMP-11', name: 'Worker B', category: 'Workers', contractor: 'Sharma Labour Agency', attendance: 'on_time' },
        { id: 'EMP-12', name: 'Worker C', category: 'Workers', contractor: 'Sharma Labour Agency', attendance: 'absent' }
      ]

      const settlements = service.calculateContractorSettlements(employees, contractors, { sessionDate: '2026-09-06' })
      assert.strictEqual(settlements.length, 1)
      const settl = settlements[0]
      assert.strictEqual(settl.contractorName, 'Sharma Labour Agency')
      assert.strictEqual(settl.rosterCount, 3)
      assert.strictEqual(settl.presentCount, 2)
      assert.strictEqual(settl.workerWages, 1000) // 2 * 500
      assert.strictEqual(settl.commissionRate, 5)
      assert.strictEqual(settl.commissionAmount, 50) // 5% of 1000
      assert.strictEqual(settl.totalPayable, 1050)
    })
  })

  describe('Fleet Allocation & Optimization Engine', () => {
    it('should optimize allocation ensuring max 8 passengers per vehicle', () => {
      const presentWorkers = [
        { id: 'D1', name: 'Driver 1', category: 'Drivers' },
        { id: 'D2', name: 'Driver 2', category: 'Drivers' },
        { id: 'C1', name: 'Chalan 1', category: 'Chalan Men' },
        { id: 'C2', name: 'Chalan 2', category: 'Chalan Men' },
        ...Array.from({ length: 14 }, (_, i) => ({ id: `W${i + 1}`, name: `Worker ${i + 1}`, category: 'Workers' }))
      ]

      const vehicles = [
        { id: 'VEH-01', number: 'UP-53-T-1001', name: 'Tipper 1', capacity: 8, active: true },
        { id: 'VEH-02', number: 'UP-53-T-1002', name: 'Tipper 2', capacity: 8, active: true },
        { id: 'VEH-03', number: 'UP-53-T-1003', name: 'Tipper 3', capacity: 8, active: true }
      ]

      const result = service.optimizeFleetAllocation(presentWorkers, vehicles)
      assert.strictEqual(result.vehiclesDeployed, 3)

      // Vehicle 1 should have 8 (1 Driver, 1 Chalan, 6 Workers)
      assert.strictEqual(result.proposedAssignments[0].assignedCount, 8)
      // Vehicle 2 should have 8 (1 Driver, 1 Chalan, 6 Workers)
      assert.strictEqual(result.proposedAssignments[1].assignedCount, 8)
      // Vehicle 3 should have remaining 2 Workers
      assert.strictEqual(result.proposedAssignments[2].assignedCount, 2)

      assert.strictEqual(result.totalAssignedWorkers, 18)
      assert.strictEqual(result.unassignedWorkersCount, 0)
    })

    it('should detect over-capacity violations in real time', () => {
      const employees = Array.from({ length: 9 }, (_, i) => ({ id: `E${i}`, name: `Worker ${i}`, assignedVehicle: 'VEH-01' }))
      const vehicles = [{ id: 'VEH-01', number: 'UP-53-T-1001', capacity: 8 }]

      const conflicts = service.detectFleetConflicts(employees, vehicles)
      assert.strictEqual(conflicts.length, 1)
      assert.strictEqual(conflicts[0].type, 'OVER_CAPACITY')
      assert.strictEqual(conflicts[0].vehicleId, 'VEH-01')
    })
  })

  describe('High-Speed In-Memory Filtering', () => {
    const roster = [
      { id: 'EMP-01', name: 'Amit Kumar', category: 'Drivers', attendance: 'on_time', contractor: 'Direct' },
      { id: 'EMP-02', name: 'Birendra Yadav', category: 'Chalan Men', attendance: 'arrived', contractor: 'Sharma Labour' },
      { id: 'EMP-03', name: 'Chandra Prakash', category: 'Workers', attendance: 'absent', contractor: 'Direct' },
      { id: 'EMP-04', name: 'Deepak Verma', category: 'Workers', attendance: 'on_time', contractor: 'Sharma Labour' }
    ]

    it('should filter by category and query on device CPU', () => {
      const filtered = service.filterWorkforce(roster, { categoryFilter: 'Workers' })
      assert.strictEqual(filtered.length, 2)

      const searchResult = service.filterWorkforce(roster, { searchQuery: 'Amit' })
      assert.strictEqual(searchResult.length, 1)
      assert.strictEqual(searchResult[0].name, 'Amit Kumar')
    })

    it('should filter by alphabet range on device CPU', () => {
      const resultAD = service.filterWorkforce(roster, { alphabetFilter: 'A-D' })
      assert.strictEqual(resultAD.length, 4)

      const resultEH = service.filterWorkforce(roster, { alphabetFilter: 'E-H' })
      assert.strictEqual(resultEH.length, 0)
    })
  })
})
