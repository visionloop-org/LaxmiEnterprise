/**
 * Client-Side Computation Engine for Laxmi Enterprise
 * 
 * Executes heavy business logic, payroll calculations, overtime formulas,
 * contractor settlements, fleet allocation optimization, and statistical aggregations
 * 100% on the client device (Android tablet, phone, or laptop browser).
 * 
 * Google Sheets and Google Apps Script serve as the lightweight cloud persistence layer,
 * receiving pre-calculated, finalized rows to avoid Apps Script timeout and cell rate limits.
 */

export const DEFAULT_CATEGORY_RATES = {
  Drivers: 800,
  'Chalan Men': 650,
  Workers: 500,
  Office: 750,
  'Extra Labour': 450
}

export const STANDARD_SHIFT_HOURS = 8
export const DEFAULT_OVERTIME_MULTIPLIER = 1.5
export const MAX_VEHICLE_CAPACITY = 8

export class ClientComputationService {
  constructor(categoryRates = DEFAULT_CATEGORY_RATES) {
    this.categoryRates = { ...DEFAULT_CATEGORY_RATES, ...categoryRates }
  }

  /**
   * Get the effective daily base rate for an employee
   */
  getEffectiveBaseRate(employee) {
    if (!employee) return 500
    if (employee.baseRate !== null && employee.baseRate !== undefined && !isNaN(Number(employee.baseRate))) {
      return Number(employee.baseRate)
    }
    return this.categoryRates[employee.category] || 500
  }

  /**
   * Calculate payroll for a single employee for a shift
   */
  /**
   * Calculate payroll for a single employee for a shift
   * Operational Policy:
   * 1. Entry at Correct Time ('on_time'): Full Day Base Pay + Incentive (+ Overtime)
   * 2. Entry after Time ('arrived'): Full Day Base Pay (+ Overtime, No Incentive)
   * 3. Absent ('absent'): 0 Pay
   */
  calculateWorkerPayroll(employee, options = {}) {
    const {
      overtimeMultiplier = DEFAULT_OVERTIME_MULTIPLIER,
      shiftHours = STANDARD_SHIFT_HOURS,
      defaultPunctualityIncentive = 0
    } = options

    const baseRate = this.getEffectiveBaseRate(employee)
    const hourlyRate = baseRate / shiftHours

    const attendance = employee.attendance || employee.status || 'absent'
    const isOnTime = attendance === 'on_time'
    const isAfterTime = attendance === 'arrived' || attendance === 'late'
    const isPresent = isOnTime || isAfterTime || attendance === 'present'

    if (!isPresent) {
      return {
        employeeId: employee.id || employee.employeeId,
        name: employee.name,
        category: employee.category,
        contractor: employee.contractor || 'Direct',
        attendance: 'absent',
        attendanceLabel: 'Absent',
        baseRate,
        hourlyRate: Number(hourlyRate.toFixed(2)),
        earnedBase: 0,
        extraHours: 0,
        overtimePay: 0,
        incentive: 0,
        deductions: 0,
        grossPay: 0,
        netPay: 0
      }
    }

    // Both "Entry at Correct Time" and "Entry after Time" receive Full Day Base Pay
    const earnedBase = baseRate

    // Overtime pay (extra hours worked beyond standard shift)
    const extraHours = Math.max(0, Number(employee.extraHours || 0))
    const overtimePay = Math.round(extraHours * hourlyRate * overtimeMultiplier)

    // Punctuality Incentive:
    // Only earned if worker entered at correct time!
    // Workers entering after time receive full base pay, but forfeit the punctuality incentive.
    const rawIncentive = employee.incentive !== null && employee.incentive !== undefined
      ? Number(employee.incentive)
      : defaultPunctualityIncentive
    const incentive = isOnTime ? Math.max(0, rawIncentive) : 0

    const advanceDeducted = Math.max(0, Number(employee.advanceDeducted || employee.advance || 0))
    const deductions = Math.max(0, Number(employee.deductions || 0)) + advanceDeducted
    const grossPay = earnedBase + overtimePay + incentive
    const netPay = Math.max(0, grossPay - deductions)

    return {
      employeeId: employee.id || employee.employeeId,
      name: employee.name,
      category: employee.category,
      contractor: employee.contractor || 'Direct',
      attendance,
      attendanceLabel: isOnTime ? 'Entry at Correct Time' : 'Entry after Time',
      arrivalTime: employee.arrivalTime || null,
      baseRate,
      hourlyRate: Number(hourlyRate.toFixed(2)),
      earnedBase,
      extraHours,
      overtimePay,
      incentive,
      lateDeduction: 0,
      advanceDeducted,
      deductions,
      grossPay,
      netPay
    }
  }

  /**
   * Heavy Shift Payroll Rollup (100% Client-Side)
   * Computes complete shift statistics, category totals, contractor totals,
   * and prepares finalized records for Google Sheets Daily_Payroll.
   */
  calculateDailyShiftPayroll(employees = [], options = {}) {
    const { sessionDate = new Date().toISOString().split('T')[0], sessionId } = options

    let totalWorkers = 0
    let totalPresent = 0
    let totalOnTime = 0
    let totalArrivedLate = 0
    let totalAbsent = 0

    let totalBasePay = 0
    let totalOvertimeHours = 0
    let totalOvertimePay = 0
    let totalIncentives = 0
    let totalDeductions = 0
    let totalGrossPayroll = 0
    let totalNetPayroll = 0

    const categoryBreakdown = {}
    const contractorBreakdown = {}
    const workerPayrolls = []

    for (const emp of employees) {
      totalWorkers++
      const payroll = this.calculateWorkerPayroll(emp, options)
      workerPayrolls.push(payroll)

      const cat = emp.category || 'Workers'
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, present: 0, absent: 0, basePay: 0, overtimePay: 0, netPay: 0 }
      }
      categoryBreakdown[cat].total++

      const contractor = emp.contractor || 'Direct'
      if (!contractorBreakdown[contractor]) {
        contractorBreakdown[contractor] = { totalWorkers: 0, presentWorkers: 0, totalWages: 0, commission: 0 }
      }
      contractorBreakdown[contractor].totalWorkers++

      if (payroll.attendance === 'on_time' || payroll.attendance === 'arrived' || payroll.attendance === 'present') {
        totalPresent++
        if (payroll.attendance === 'on_time') totalOnTime++
        else totalArrivedLate++

        totalBasePay += payroll.earnedBase
        totalOvertimeHours += payroll.extraHours
        totalOvertimePay += payroll.overtimePay
        totalIncentives += payroll.incentive
        totalDeductions += (payroll.deductions + payroll.lateDeduction)
        totalGrossPayroll += payroll.grossPay
        totalNetPayroll += payroll.netPay

        categoryBreakdown[cat].present++
        categoryBreakdown[cat].basePay += payroll.earnedBase
        categoryBreakdown[cat].overtimePay += payroll.overtimePay
        categoryBreakdown[cat].netPay += payroll.netPay

        contractorBreakdown[contractor].presentWorkers++
        contractorBreakdown[contractor].totalWages += payroll.netPay
      } else {
        totalAbsent++
        categoryBreakdown[cat].absent++
      }
    }

    // Pre-formatted row for 03_Laxmi_Payroll_Accounting / Daily_Payroll
    const finalizedSheetRow = {
      date: sessionDate,
      sessionId: sessionId || `SES-${sessionDate}`,
      totalWorkers,
      presentWorkers: totalPresent,
      onTimeCount: totalOnTime,
      arrivedLateCount: totalArrivedLate,
      absentCount: totalAbsent,
      totalBasePay,
      totalOvertimeHours,
      totalOvertimePay,
      totalIncentives,
      totalDeductions,
      totalGrossPayroll,
      totalNetPayroll,
      finalizedAt: new Date().toISOString()
    }

    return {
      sessionDate,
      summary: finalizedSheetRow,
      categoryBreakdown,
      contractorBreakdown,
      workerPayrolls
    }
  }

  /**
   * Contractor Settlements Engine (100% Client-Side)
   * Calculates commissions, billing amounts, and payout records per agency.
   */
  calculateContractorSettlements(employees = [], contractors = [], options = {}) {
    const { defaultCommissionRate = 5, sessionDate = new Date().toISOString().split('T')[0] } = options

    const contractorMap = new Map()
    for (const c of contractors) {
      const key = (c.name || c.contractor || c.contractorName || '').toLowerCase().trim()
      if (key) {
        contractorMap.set(key, {
          name: c.name || c.contractor || c.contractorName,
          rate: Number(c.commissionRate ?? defaultCommissionRate),
          contact: c.contact || c.phone || ''
        })
      }
    }

    const settlements = []
    const rollups = new Map()

    for (const emp of employees) {
      const agencyName = (emp.contractor || 'Direct').trim()
      if (agencyName.toLowerCase() === 'direct') continue

      if (!rollups.has(agencyName)) {
        const agencyMeta = contractorMap.get(agencyName.toLowerCase()) || {
          name: agencyName,
          rate: defaultCommissionRate,
          contact: ''
        }
        rollups.set(agencyName, {
          contractorName: agencyMeta.name,
          commissionRate: agencyMeta.rate,
          contact: agencyMeta.contact,
          totalRosterWorkers: 0,
          presentWorkers: 0,
          totalWages: 0,
          workers: []
        })
      }

      const record = rollups.get(agencyName)
      record.totalRosterWorkers++

      const payroll = this.calculateWorkerPayroll(emp, options)
      if (payroll.netPay > 0) {
        record.presentWorkers++
        record.totalWages += payroll.netPay
        record.workers.push(payroll)
      }
    }

    for (const [agencyName, data] of rollups.entries()) {
      const commissionAmount = Math.round(data.totalWages * (data.commissionRate / 100))
      const totalPayable = data.totalWages + commissionAmount

      settlements.push({
        settlementId: `SETTL-${sessionDate}-${agencyName.replace(/\s+/g, '_')}`,
        date: sessionDate,
        contractorName: data.contractorName,
        contact: data.contact,
        rosterCount: data.totalRosterWorkers,
        presentCount: data.presentWorkers,
        workerWages: data.totalWages,
        commissionRate: data.commissionRate,
        commissionAmount,
        totalPayable,
        status: 'Calculated',
        updatedAt: new Date().toISOString()
      })
    }

    return settlements
  }

  /**
   * Heavy Fleet Allocation & Packing Optimization (100% Client-Side)
   * Automatically allocates present workers into available vehicles ensuring:
   * - Max 8 capacity per vehicle
   * - 1 Driver + 1 Chalan Man + up to 6 Workers per vehicle
   * - Minimizes number of active vehicles deployed
   */
  optimizeFleetAllocation(presentWorkers = [], vehicles = []) {
    const availableVehicles = vehicles.filter(v => v.active !== false && v.status !== 'maintenance')
    const maxVehicleCap = MAX_VEHICLE_CAPACITY

    const drivers = presentWorkers.filter(w => w.category === 'Drivers' && !w.assignedVehicle)
    const chalanMen = presentWorkers.filter(w => w.category === 'Chalan Men' && !w.assignedVehicle)
    const generalWorkers = presentWorkers.filter(w => w.category !== 'Drivers' && w.category !== 'Chalan Men' && !w.assignedVehicle)

    const proposedAssignments = []
    let driverIdx = 0
    let chalanIdx = 0
    let workerIdx = 0

    for (const veh of availableVehicles) {
      const assignedToVeh = []

      // 1. Assign 1 Driver if available
      if (driverIdx < drivers.length) {
        assignedToVeh.push({ employee: drivers[driverIdx], role: 'Driver' })
        driverIdx++
      }

      // 2. Assign 1 Chalan Man if available
      if (chalanIdx < chalanMen.length) {
        assignedToVeh.push({ employee: chalanMen[chalanIdx], role: 'Chalan Man' })
        chalanIdx++
      }

      // 3. Fill remaining seats (up to 8) with Workers
      while (assignedToVeh.length < maxVehicleCap && workerIdx < generalWorkers.length) {
        assignedToVeh.push({ employee: generalWorkers[workerIdx], role: 'Worker' })
        workerIdx++
      }

      if (assignedToVeh.length > 0) {
        proposedAssignments.push({
          vehicleId: veh.id || veh.number,
          vehicleNumber: veh.number,
          vehicleName: veh.name || veh.number,
          type: veh.type || 'Truck',
          capacity: maxVehicleCap,
          assignedCount: assignedToVeh.length,
          utilizationPercent: Math.round((assignedToVeh.length / maxVehicleCap) * 100),
          passengers: assignedToVeh
        })
      }
    }

    const unassignedCount = (drivers.length - driverIdx) + (chalanMen.length - chalanIdx) + (generalWorkers.length - workerIdx)

    return {
      vehiclesDeployed: proposedAssignments.length,
      totalCapacityAvailable: availableVehicles.length * maxVehicleCap,
      totalAssignedWorkers: presentWorkers.length - unassignedCount,
      unassignedWorkersCount: unassignedCount,
      proposedAssignments
    }
  }

  /**
   * Client-Side Fleet Conflict Detector
   * Runs in milliseconds on the Android tablet / phone during vehicle drag-and-drop.
   */
  detectFleetConflicts(employees = [], vehicles = []) {
    const conflicts = []
    const vehicleAssignmentMap = new Map()

    for (const emp of employees) {
      if (emp.assignedVehicle) {
        const vId = emp.assignedVehicle
        if (!vehicleAssignmentMap.has(vId)) {
          vehicleAssignmentMap.set(vId, [])
        }
        vehicleAssignmentMap.get(vId).push(emp)
      }
    }

    for (const [vehicleId, assignedEmps] of vehicleAssignmentMap.entries()) {
      const veh = vehicles.find(v => (v.id === vehicleId || v.number === vehicleId))
      const cap = (veh && veh.capacity) || MAX_VEHICLE_CAPACITY

      // Capacity violation
      if (assignedEmps.length > cap) {
        conflicts.push({
          type: 'OVER_CAPACITY',
          severity: 'error',
          vehicleId,
          message: `Vehicle ${vehicleId} exceeds max capacity (${assignedEmps.length}/${cap} workers assigned).`
        })
      }

      // Multiple drivers in single vehicle warning
      const driverCount = assignedEmps.filter(e => e.category === 'Drivers').length
      if (driverCount > 1) {
        conflicts.push({
          type: 'MULTIPLE_DRIVERS',
          severity: 'warning',
          vehicleId,
          message: `Vehicle ${vehicleId} has ${driverCount} drivers assigned.`
        })
      }
    }

    return conflicts
  }

  /**
   * High-Speed In-Memory Filtering & Search
   * Allows searching 500+ workforce records on a mobile device CPU without network overhead.
   */
  filterWorkforce(employees = [], filters = {}) {
    const {
      searchQuery = '',
      categoryFilter = 'All',
      attendanceFilter = 'All',
      alphabetFilter = 'All',
      contractorFilter = 'All'
    } = filters

    const q = searchQuery ? searchQuery.toLowerCase().trim() : ''
    const alphabetRanges = {
      'A-D': ['A', 'B', 'C', 'D'],
      'E-H': ['E', 'F', 'G', 'H'],
      'I-L': ['I', 'J', 'K', 'L'],
      'M-P': ['M', 'N', 'O', 'P'],
      'Q-T': ['Q', 'R', 'S', 'T'],
      'U-Z': ['U', 'V', 'W', 'X', 'Y', 'Z']
    }
    const letters = alphabetRanges[alphabetFilter] || null

    return employees.filter((emp) => {
      if (!emp) return false

      // 1. Category Filter
      if (categoryFilter !== 'All' && emp.category !== categoryFilter) {
        return false
      }

      // 2. Attendance Filter
      if (attendanceFilter !== 'All') {
        const att = emp.attendance || emp.status
        if (attendanceFilter === 'Completed' && (att === null || att === undefined)) return false
        if (attendanceFilter === 'Pending' && att !== null && att !== undefined) return false
        if (attendanceFilter === 'Present' && att !== 'on_time' && att !== 'arrived') return false
        if (attendanceFilter === 'Absent' && att !== 'absent') return false
        if (attendanceFilter === 'On Time' && att !== 'on_time') return false
        if (attendanceFilter === 'Arrived' && att !== 'arrived') return false
      }

      // 3. Alphabet Filter
      if (letters) {
        const firstLetter = (emp.name || '').trim().charAt(0).toUpperCase()
        if (!letters.includes(firstLetter)) return false
      }

      // 4. Contractor Filter
      if (contractorFilter !== 'All') {
        const empContractor = emp.contractor || 'Direct'
        if (empContractor.toLowerCase() !== contractorFilter.toLowerCase()) return false
      }

      // 5. Search Query (Name, ID, Phone)
      if (q) {
        const nameMatch = (emp.name || '').toLowerCase().includes(q)
        const idMatch = String(emp.id || emp.employeeId || '').toLowerCase().includes(q)
        const phoneMatch = (emp.phone || '').includes(q)
        if (!nameMatch && !idMatch && !phoneMatch) return false
      }

      return true
    })
  }
}

export const clientComputationService = new ClientComputationService()
export default clientComputationService
