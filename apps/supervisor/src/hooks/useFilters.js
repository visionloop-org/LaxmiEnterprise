export function useFilters(employees = [], vehicles = [], searchQuery = '', categoryFilter = 'All', attendanceFilter = 'All', alphabetFilter = 'All') {
  const query = (searchQuery || '').toLowerCase().trim()

  const filteredEmployees = (employees || []).filter(emp => {
    if (!emp) return false

    const empId = String(emp.id || '').toLowerCase()
    const empName = String(emp.name || '').toLowerCase()
    const matchesSearch = !query || empId.includes(query) || empName.includes(query)
    const matchesCategory = categoryFilter === 'All' || emp.category === categoryFilter
    
    let matchesAlphabet = true
    if (alphabetFilter !== 'All' && emp.name) {
      const [start, end] = alphabetFilter.split('-')
      const firstChar = String(emp.name).charAt(0).toUpperCase()
      matchesAlphabet = firstChar >= start && firstChar <= end
    }
    
    let matchesAttendance = true
    if (attendanceFilter === 'Present') {
      matchesAttendance = emp.attendance === 'on_time' || emp.attendance === 'arrived'
    } else if (attendanceFilter === 'Absent') {
      matchesAttendance = emp.attendance === 'absent'
    } else if (attendanceFilter === 'Completed') {
      matchesAttendance = emp.attendance !== null && emp.attendance !== undefined
    } else if (attendanceFilter === 'Pending') {
      matchesAttendance = emp.attendance === null || emp.attendance === undefined
    } else if (attendanceFilter === 'On Time' || attendanceFilter === 'on_time') {
      matchesAttendance = emp.attendance === 'on_time'
    } else if (attendanceFilter === 'Arrived' || attendanceFilter === 'arrived') {
      matchesAttendance = emp.attendance === 'arrived'
    }

    return matchesSearch && matchesCategory && matchesAlphabet && matchesAttendance
  })

  const filteredVehicles = (vehicles || []).filter(vehicle => {
    if (!vehicle) return false

    const vehicleId = String(vehicle.id || '').toLowerCase()
    const vehicleNumber = String(vehicle.number || '').toLowerCase()
    const matchesSearch = !query || vehicleId.includes(query) || vehicleNumber.includes(query)
    const matchesCategory = categoryFilter === 'All' || categoryFilter === 'Vehicles'
    
    return matchesSearch && matchesCategory
  })

  return { filteredEmployees, filteredVehicles }
}
