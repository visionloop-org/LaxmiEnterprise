export function useFilters(employees, vehicles, searchQuery, categoryFilter, attendanceFilter, alphabetFilter) {
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || emp.category === categoryFilter
    
    let matchesAlphabet = true
    if (alphabetFilter !== 'All') {
      const [start, end] = alphabetFilter.split('-')
      const firstChar = emp.name.charAt(0).toUpperCase()
      matchesAlphabet = firstChar >= start && firstChar <= end
    }
    
    let matchesAttendance = true
    if (attendanceFilter === 'Present') {
      matchesAttendance = emp.attendance === 'on_time' || emp.attendance === 'arrived'
    } else if (attendanceFilter === 'Absent') {
      matchesAttendance = emp.attendance === 'absent'
    }

    return matchesSearch && matchesCategory && matchesAlphabet && matchesAttendance
  })

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || categoryFilter === 'Vehicles'
    
    return matchesSearch && matchesCategory
  })

  return { filteredEmployees, filteredVehicles }
}
