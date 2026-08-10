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

    // If assigning to a new vehicle, check capacity
    if (vehicleId && vehicleId !== previousVehicleId) {
      const targetVehicle = vehicles.find(v => v.id === vehicleId)
      if (!targetVehicle) return

      // Count current assignments to this vehicle by category
      const currentAssignments = employees.filter(e => e.assignedVehicle === vehicleId)
      const driverCount = currentAssignments.filter(e => e.category === 'Drivers').length
      const chalanManCount = currentAssignments.filter(e => e.category === 'Chalan Men').length
      const workerCount = currentAssignments.filter(e => 
        e.category === 'Workers' || e.category === 'Extra Labour'
      ).length

      // Check capacity constraints and provide conflict resolution
      if (employee.category === 'Drivers' && driverCount >= 1) {
        alert('This vehicle already has a driver assigned. Maximum 1 driver per vehicle.')
        return { conflict: { blocked: true } }
      }
      if (employee.category === 'Chalan Men' && chalanManCount >= 1) {
        alert('This vehicle already has a chalan man assigned. Maximum 1 chalan man per vehicle.')
        return { conflict: { blocked: true } }
      }
      if ((employee.category === 'Workers' || employee.category === 'Extra Labour') && workerCount >= 6) {
        alert('This vehicle has reached maximum worker capacity (6 workers/labor).')
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
              action: 'unlock'
            }
          ]
        }
        return { conflict }
      }

      // Warning before lock
      const wouldHaveDriver = driverCount + (employee.category === 'Drivers' ? 1 : 0) >= 1
      const wouldHaveChalanMan = chalanManCount + (employee.category === 'Chalan Men' ? 1 : 0) >= 1
      const wouldHaveMinWorkers = workerCount + (employee.category === 'Workers' || employee.category === 'Extra Labour' ? 1 : 0) >= 4
      
      if (wouldHaveDriver && wouldHaveChalanMan && wouldHaveMinWorkers && !targetVehicle.locked) {
        if (!confirm('This assignment will lock the vehicle (1 driver + 1 chalan man + 4+ workers). Continue?')) {
          return
        }
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
    }

    setEditedEmployees(prev => new Set([...prev, empId]))

    // Check if vehicle should be locked after this assignment
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

    // Lock if capacity is reached (1 driver + 1 chalan man + 4-6 workers)
    const totalCapacity = driverCount + chalanManCount + workerCount
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
  }

  const handleToggleEditMode = (empId) => {
    // Reset all values for this employee to make them editable again
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return { 
          ...emp, 
          attendance: null, 
          arrivalTime: null,
          assignedVehicle: null,
          labourRequest: null
        }
      }
      return emp
    }))
    // Remove from edited set so Edit button appears again
    setEditedEmployees(prev => {
      const newSet = new Set(prev)
      newSet.delete(empId)
      return newSet
    })
    // Clear arrival time for this employee
    setArrivalTimes(prev => {
      const newTimes = { ...prev }
      delete newTimes[empId]
      return newTimes
    })
  }

  const confirmArrival = (empId) => {
    const time = arrivalTimes[empId] || '08:00'
    setEmployees(prev => prev.map(emp => 
      emp.id === empId ? { ...emp, attendance: 'arrived', arrivalTime: time } : emp
    ))
    setExpandedRow(null)
  }

  const handleAddWorker = () => {
    if (newWorker.name) {
      const newEmp = {
        id: `EXT${String(employees.filter(e => e.id.startsWith('EXT')).length + 1).padStart(3, '0')}`,
        name: newWorker.name,
        category: 'Extra Labour',
        photo: null,
        attendance: null,
        contractor: newWorker.contractor,
        remarks: newWorker.remarks
      }
      setEmployees(prev => [...prev, newEmp])
      setNewWorker({ name: '', contractor: '', remarks: '' })
      setShowAddWorker(false)
    }
  }

  const handleFinalizeAttendance = (completedCount, totalCount) => {
    const completionRate = (completedCount / totalCount) * 100
    
    if (completionRate < 50) {
      alert(`Cannot finalize. At least 50% completion required. Current: ${completionRate.toFixed(1)}%`)
      return
    }

    return true // Return success to allow caller to set lock
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

      if (driverCount > 1) {
        violations.push({
          vehicle: vehicle.number,
          type: 'driver',
          count: driverCount,
          max: 1
        })
      }
      if (chalanManCount > 1) {
        violations.push({
          vehicle: vehicle.number,
          type: 'chalan man',
          count: chalanManCount,
          max: 1
        })
      }
      if (workerCount > 6) {
        violations.push({
          vehicle: vehicle.number,
          type: 'worker',
          count: workerCount,
          max: 6
        })
      }
    })

    if (violations.length > 0) {
      const message = violations.map(v => 
        `${v.vehicle}: ${v.count} ${v.type}s (max ${v.max})`
      ).join('\n')
      alert(`Capacity violations detected:\n${message}\n\nPlease reassign employees to fix these violations.`)
    }

    return violations
  }

  const handleUnlockVehicle = (vehicleId) => {
    if (confirm('Are you sure you want to unlock this vehicle? This will allow additional assignments.')) {
      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return { ...v, locked: false }
        }
        return v
      }))
    }
  }

  const handleBulkReassign = (employeeIds, fromVehicleId, toVehicleId) => {
    if (!toVehicleId) {
      alert('Please select a target vehicle')
      return
    }

    if (fromVehicleId === toVehicleId) {
      alert('Source and target vehicles cannot be the same')
      return
    }

    const targetVehicle = vehicles.find(v => v.id === toVehicleId)
    if (!targetVehicle) return

    // Check if target vehicle is locked
    if (targetVehicle.locked) {
      alert('Target vehicle is locked. Please unlock it first.')
      return
    }

    // Count current assignments to target vehicle
    const currentAssignments = employees.filter(e => e.assignedVehicle === toVehicleId)
    const driverCount = currentAssignments.filter(e => e.category === 'Drivers').length
    const chalanManCount = currentAssignments.filter(e => e.category === 'Chalan Men').length
    const workerCount = currentAssignments.filter(e => 
      e.category === 'Workers' || e.category === 'Extra Labour'
    ).length

    // Check if reassignment would exceed capacity
    const employeesToReassign = employees.filter(e => employeeIds.includes(e.id))
    const newDrivers = employeesToReassign.filter(e => e.category === 'Drivers').length
    const newChalanMen = employeesToReassign.filter(e => e.category === 'Chalan Men').length
    const newWorkers = employeesToReassign.filter(e => 
      e.category === 'Workers' || e.category === 'Extra Labour'
    ).length

    if (driverCount + newDrivers > 1) {
      alert('Target vehicle would exceed driver capacity (max 1)')
      return
    }
    if (chalanManCount + newChalanMen > 1) {
      alert('Target vehicle would exceed chalan man capacity (max 1)')
      return
    }
    if (workerCount + newWorkers > 6) {
      alert('Target vehicle would exceed worker capacity (max 6)')
      return
    }

    // Perform reassignment
    setEmployees(prev => prev.map(emp => {
      if (employeeIds.includes(emp.id)) {
        return { ...emp, assignedVehicle: toVehicleId }
      }
      return emp
    }))

    // Update vehicle statuses
    if (fromVehicleId) {
      const remainingInSource = employees.filter(e => 
        e.assignedVehicle === fromVehicleId && !employeeIds.includes(e.id)
      ).length
      if (remainingInSource === 0) {
        handleVehicleStatusChange(fromVehicleId, 'available')
      }
    }

    handleVehicleStatusChange(toVehicleId, 'in_use')

    // Mark employees as edited
    employeeIds.forEach(empId => {
      setEditedEmployees(prev => new Set([...prev, empId]))
    })

    // Check if target vehicle should be locked
    checkAndLockVehicle(toVehicleId)
  }

  const handleExportVehicleAssignments = () => {
    const csvContent = [
      ['Vehicle ID', 'Vehicle Number', 'Type', 'Status', 'Employee ID', 'Employee Name', 'Category', 'Attendance']
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
            emp.attendance || 'Pending'
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
    handleUnlockVehicle,
    handleBulkReassign,
    handleExportVehicleAssignments,
    validateVehicleCapacities,
  }
}
