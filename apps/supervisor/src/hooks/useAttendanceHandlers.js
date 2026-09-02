import { googleSheetsService } from '@laxmi/shared'

export function useAttendanceHandlers({
  employees,
  setEmployees,
  vehicles,
  setVehicles,
  arrivalTimes,
  currentTime,
  isAttendanceLocked,
  setEditedEmployees,
  setNewWorker,
  setShowAddWorker,
  setExpandedRow,
  notify,
  showConfirm,
}) {
  const handleVehicleStatusChange = (vehicleId, newStatus) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newHistoryEntry = { status: newStatus, timestamp: new Date().toISOString() }
        const updatedHistory = v.statusHistory ? [...v.statusHistory, newHistoryEntry] : [newHistoryEntry]
        return { ...v, status: newStatus, statusHistory: updatedHistory }
      }
      return v
    }))
  }

  const handleVehicleAssignment = (empId, vehicleId) => {
    const employee = employees.find(e => e.id === empId)
    if (!employee) return

    const previousVehicleId = employee.assignedVehicle

    if (vehicleId && vehicleId !== previousVehicleId) {
      const targetVehicle = vehicles.find(v => v.id === vehicleId)
      if (!targetVehicle) return

      const currentAssignments = employees.filter(e => e.assignedVehicle === vehicleId)
      const driverCount = currentAssignments.filter(e => e.category === 'Drivers').length
      const chalanManCount = currentAssignments.filter(e => e.category === 'Chalan Men').length
      const workerCount = currentAssignments.filter(e =>
        e.category === 'Workers' || e.category === 'Extra Labour'
      ).length

      // Capacity block — return conflict object so caller can show inline error
      if (employee.category === 'Drivers' && driverCount >= 1) {
        notify('error', 'This vehicle already has a driver assigned. Maximum 1 driver per vehicle.')
        return { conflict: { blocked: true } }
      }
      if (employee.category === 'Chalan Men' && chalanManCount >= 1) {
        notify('error', 'This vehicle already has a chalan man assigned. Maximum 1 chalan man per vehicle.')
        return { conflict: { blocked: true } }
      }
      if ((employee.category === 'Workers' || employee.category === 'Extra Labour') && workerCount >= 6) {
        notify('error', 'This vehicle has reached maximum worker capacity (6 workers/labour).')
        return { conflict: { blocked: true } }
      }

      // Check if vehicle is locked
      if (targetVehicle.locked) {
        const conflict = {
          employee,
          vehicle: targetVehicle,
          reason: 'This vehicle is locked and cannot accept new assignments.',
          suggestions: [
            {
              title: 'Unlock Vehicle',
              description: 'Unlock the vehicle to allow additional assignments',
              action: 'unlock',
            },
          ],
        }
        return { conflict }
      }

      // Inform user that this assignment will lock the vehicle (toast, not blocking confirm)
      const wouldHaveDriver = driverCount + (employee.category === 'Drivers' ? 1 : 0) >= 1
      const wouldHaveChalanMan = chalanManCount + (employee.category === 'Chalan Men' ? 1 : 0) >= 1
      const wouldHaveMinWorkers = workerCount + (employee.category === 'Workers' || employee.category === 'Extra Labour' ? 1 : 0) >= 4

      if (wouldHaveDriver && wouldHaveChalanMan && wouldHaveMinWorkers && !targetVehicle.locked) {
        notify('info', `Vehicle ${targetVehicle.number} will be locked after this assignment (1 driver + 1 chalan man + 4+ workers).`)
      }
    }

    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return { ...emp, assignedVehicle: vehicleId || null }
      }
      return emp
    }))

    if (vehicleId && vehicleId !== previousVehicleId) {
      handleVehicleStatusChange(vehicleId, 'in_use')
    }

    if (previousVehicleId && previousVehicleId !== vehicleId) {
      handleVehicleStatusChange(previousVehicleId, 'available')
      googleSheetsService.unassignVehicle('SES-CURRENT', previousVehicleId, empId).catch(() => {})
    }

    if (vehicleId && vehicleId !== previousVehicleId) {
      const role = employee.category === 'Drivers' ? 'Driver' : (employee.category === 'Chalan Men' ? 'Chalan Man' : 'Passenger')
      googleSheetsService.assignVehicle('SES-CURRENT', vehicleId, empId, role).catch(() => {})
    } else if (!vehicleId && previousVehicleId) {
      googleSheetsService.unassignVehicle('SES-CURRENT', previousVehicleId, empId).catch(() => {})
    }

    setEditedEmployees(prev => new Set([...prev, empId]))

    if (vehicleId) {
      checkAndLockVehicle(vehicleId)
    }

    return { success: true }
  }

  const checkAndLockVehicle = (vehicleId) => {
    const currentAssignments = employees.filter(e => e.assignedVehicle === vehicleId)
    const driverCount = currentAssignments.filter(e => e.category === 'Drivers').length
    const chalanManCount = currentAssignments.filter(e => e.category === 'Chalan Men').length
    const workerCount = currentAssignments.filter(e =>
      e.category === 'Workers' || e.category === 'Extra Labour'
    ).length

    const hasDriver = driverCount >= 1
    const hasChalanMan = chalanManCount >= 1
    const hasMinWorkers = workerCount >= 4

    if (hasDriver && hasChalanMan && hasMinWorkers) {
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return { ...v, locked: true }
        }
        return v
      }))
    }
  }

  const handleLabourRequest = (empId, requestType) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return { ...emp, labourRequest: requestType }
      }
      return emp
    }))
    setEditedEmployees(prev => new Set([...prev, empId]))
  }

  const handleAttendance = (empId, status) => {
    if (isAttendanceLocked) return

    const timeToUse = arrivalTimes[empId] || currentTime
    setEmployees(prev => prev.map(emp =>
      emp.id === empId ? { ...emp, attendance: status, arrivalTime: status === 'arrived' ? timeToUse : emp.arrivalTime } : emp
    ))
    setEditedEmployees(prev => new Set([...prev, empId]))

    const arrivalVal = status === 'arrived' ? timeToUse : null
    googleSheetsService.recordAttendance('SES-CURRENT', empId, status, arrivalVal).catch(() => {})
  }

  const handleToggleEditMode = (empId) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          attendance: null,
          arrivalTime: null,
          assignedVehicle: null,
          labourRequest: null,
        }
      }
      return emp
    }))
    setEditedEmployees(prev => {
      const newSet = new Set(prev)
      newSet.delete(empId)
      return newSet
    })
    googleSheetsService.recordAttendance('SES-CURRENT', empId, 'pending', null).catch(() => {})
  }

  const confirmArrival = (empId) => {
    const time = arrivalTimes[empId] || '08:00'
    setEmployees(prev => prev.map(emp =>
      emp.id === empId ? { ...emp, attendance: 'arrived', arrivalTime: time } : emp
    ))
    if (setExpandedRow) setExpandedRow(null)
    setEditedEmployees(prev => new Set([...prev, empId]))
    googleSheetsService.recordAttendance('SES-CURRENT', empId, 'arrived', time).catch(() => {})
  }

  const handleAddWorker = (newWorker) => {
    if (newWorker?.name) {
      const newEmp = {
        id: `EXT${String(employees.filter(e => e.id.startsWith('EXT')).length + 1).padStart(3, '0')}`,
        name: newWorker.name,
        category: 'Extra Labour',
        photo: null,
        attendance: null,
        contractor: newWorker.contractor,
        remarks: newWorker.remarks,
      }
      setEmployees(prev => [...prev, newEmp])
      setNewWorker({ name: '', contractor: '', remarks: '' })
      setShowAddWorker(false)
      googleSheetsService.addEmployee(newEmp).catch(() => {})
    }
  }

  const handleFinalizeAttendance = (completedCount, totalCount) => {
    const completionRate = (completedCount / totalCount) * 100

    if (completionRate < 50) {
      notify('error', `Cannot finalize attendance. At least 50% attendance completion required. Current: ${completionRate.toFixed(1)}%`)
      return false
    }

    return true
  }

  const handleFinalizeSheet = (isAttendanceFinalized) => {
    if (!isAttendanceFinalized) {
      notify('warning', 'Please finalize attendance status before finalizing the full daily sheet.')
      return false
    }
    return true
  }

  const validateVehicleCapacities = () => {
    const violations = []

    vehicles.forEach(vehicle => {
      const assignments = employees.filter(e => e.assignedVehicle === vehicle.id)
      const driverCount = assignments.filter(e => e.category === 'Drivers').length
      const chalanManCount = assignments.filter(e => e.category === 'Chalan Men').length
      const workerCount = assignments.filter(e =>
        e.category === 'Workers' || e.category === 'Extra Labour'
      ).length

      if (driverCount > 1) violations.push({ vehicle: vehicle.number, type: 'driver', count: driverCount, max: 1 })
      if (chalanManCount > 1) violations.push({ vehicle: vehicle.number, type: 'chalan man', count: chalanManCount, max: 1 })
      if (workerCount > 6) violations.push({ vehicle: vehicle.number, type: 'worker', count: workerCount, max: 6 })
    })

    if (violations.length === 0) {
      notify('success', 'All vehicle capacities are within limits.')
    } else {
      const message = violations
        .map(v => `${v.vehicle}: ${v.count} ${v.type}s (max ${v.max})`)
        .join(' · ')
      notify('warning', `Capacity violations: ${message}`)
    }

    return violations
  }

  const handleUnlockVehicle = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    showConfirm({
      message: 'Unlock this vehicle?',
      detail: `This will allow additional assignments to ${vehicle?.number || vehicleId}.`,
      confirmLabel: 'Unlock',
      danger: false,
      onConfirm: () => {
        setVehicles(prev => prev.map(v =>
          v.id === vehicleId ? { ...v, locked: false } : v
        ))
        notify('success', `Vehicle ${vehicle?.number || vehicleId} unlocked.`)
      },
    })
  }

  const handleBulkReassign = (employeeIds, fromVehicleId, toVehicleId) => {
    if (!toVehicleId) {
      notify('warning', 'Please select a target vehicle.')
      return
    }

    if (fromVehicleId === toVehicleId) {
      notify('warning', 'Source and target vehicles cannot be the same.')
      return
    }

    const targetVehicle = vehicles.find(v => v.id === toVehicleId)
    if (!targetVehicle) return

    if (targetVehicle.locked) {
      notify('error', 'Target vehicle is locked. Please unlock it first.')
      return
    }

    const currentAssignments = employees.filter(e => e.assignedVehicle === toVehicleId)
    const driverCount = currentAssignments.filter(e => e.category === 'Drivers').length
    const chalanManCount = currentAssignments.filter(e => e.category === 'Chalan Men').length
    const workerCount = currentAssignments.filter(e =>
      e.category === 'Workers' || e.category === 'Extra Labour'
    ).length

    const employeesToReassign = employees.filter(e => employeeIds.includes(e.id))
    const newDrivers = employeesToReassign.filter(e => e.category === 'Drivers').length
    const newChalanMen = employeesToReassign.filter(e => e.category === 'Chalan Men').length
    const newWorkers = employeesToReassign.filter(e =>
      e.category === 'Workers' || e.category === 'Extra Labour'
    ).length

    if (driverCount + newDrivers > 1) {
      notify('error', 'Target vehicle would exceed driver capacity (max 1).')
      return
    }
    if (chalanManCount + newChalanMen > 1) {
      notify('error', 'Target vehicle would exceed chalan man capacity (max 1).')
      return
    }
    if (workerCount + newWorkers > 6) {
      notify('error', 'Target vehicle would exceed worker capacity (max 6).')
      return
    }

    setEmployees(prev => prev.map(emp => {
      if (employeeIds.includes(emp.id)) {
        return { ...emp, assignedVehicle: toVehicleId }
      }
      return emp
    }))

    if (fromVehicleId) {
      const remainingInSource = employees.filter(e =>
        e.assignedVehicle === fromVehicleId && !employeeIds.includes(e.id)
      ).length
      if (remainingInSource === 0) {
        handleVehicleStatusChange(fromVehicleId, 'available')
      }
    }

    handleVehicleStatusChange(toVehicleId, 'in_use')

    employeeIds.forEach(empId => {
      setEditedEmployees(prev => new Set([...prev, empId]))
    })

    checkAndLockVehicle(toVehicleId)
    notify('success', `${employeeIds.length} employee(s) reassigned to ${targetVehicle.number}.`)
  }

  const handleExportVehicleAssignments = () => {
    const csvContent = [
      ['Vehicle ID', 'Vehicle Number', 'Type', 'Status', 'Employee ID', 'Employee Name', 'Category', 'Attendance'],
    ]

    vehicles.forEach(vehicle => {
      const assignments = employees.filter(e => e.assignedVehicle === vehicle.id)
      if (assignments.length === 0) {
        csvContent.push([vehicle.id, vehicle.number, vehicle.type, vehicle.status, '', '', '', ''])
      } else {
        assignments.forEach(emp => {
          csvContent.push([
            vehicle.id,
            vehicle.number,
            vehicle.type,
            vehicle.status,
            emp.id,
            emp.name,
            emp.category,
            emp.attendance || 'Pending',
          ])
        })
      }
    })

    const csvString = csvContent.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vehicle_assignments_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    notify('success', 'Vehicle assignments exported to CSV.')
  }

  return {
    handleVehicleStatusChange,
    handleVehicleAssignment,
    handleLabourRequest,
    handleAttendance,
    handleToggleEditMode,
    confirmArrival,
    handleAddWorker,
    handleFinalizeAttendance,
    handleFinalizeSheet,
    handleUnlockVehicle,
    handleBulkReassign,
    handleExportVehicleAssignments,
    validateVehicleCapacities,
  }
}
