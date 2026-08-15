export function useStatistics(employees, vehicles) {
  const completedCount = employees.filter(e => e.attendance !== null).length
  const totalCount = employees.length
  const pendingCount = totalCount - completedCount
  const onTimeCount = employees.filter(e => e.attendance === 'on_time').length
  const arrivedCount = employees.filter(e => e.attendance === 'arrived').length
  const absentCount = employees.filter(e => e.attendance === 'absent').length

  // Vehicle assignment efficiency metrics
  const assignedVehicles = vehicles.filter(v => v.status === 'in_use')
  const totalVehicleCapacity = vehicles.length * 8
  const currentVehicleAssignments = employees.filter(e => e.assignedVehicle).length
  const averageVehicleUtilization = vehicles.length > 0 
    ? Math.round((currentVehicleAssignments / totalVehicleCapacity) * 100) 
    : 0
  const fullyUtilizedVehicles = vehicles.filter(v => {
    const assignments = employees.filter(e => e.assignedVehicle === v.id)
    return assignments.length >= 8
  }).length
  const underUtilizedVehicles = vehicles.filter(v => {
    const assignments = employees.filter(e => e.assignedVehicle === v.id)
    return assignments.length > 0 && assignments.length < 4
  }).length
  const lockedVehicles = vehicles.filter(v => v.locked).length

  // Min / Max Labour Request Metrics
  const chalanMen = employees.filter(e => e.category === 'Chalan Men')
  const minDemandCount = chalanMen.filter(e => e.labourRequest === 'minimum').length
  const maxDemandCount = chalanMen.filter(e => e.labourRequest === 'more').length
  const pendingDemandCount = chalanMen.filter(e => (e.attendance === 'on_time' || e.attendance === 'arrived') && !e.labourRequest).length

  const getCategoryCount = (category) => {
    if (category === 'All') return totalCount
    return employees.filter(e => e.category === category).length
  }

  const getAttendanceCount = (status) => {
    if (status === 'All') return totalCount
    if (status === 'Present') return onTimeCount + arrivedCount
    if (status === 'Absent') return absentCount
    if (status === 'Completed') return completedCount
    if (status === 'Pending') return pendingCount
    if (status === 'On Time' || status === 'on_time') return onTimeCount
    if (status === 'Arrived' || status === 'arrived') return arrivedCount
    return employees.filter(e => e.attendance === status).length
  }

  const getAlphabetCount = (range) => {
    if (range === 'All') return totalCount
    const ranges = {
      'A-D': ['A', 'B', 'C', 'D'],
      'E-H': ['E', 'F', 'G', 'H'],
      'I-L': ['I', 'J', 'K', 'L'],
      'M-P': ['M', 'N', 'O', 'P'],
      'Q-T': ['Q', 'R', 'S', 'T'],
      'U-Z': ['U', 'V', 'W', 'X', 'Y', 'Z']
    }
    const letters = ranges[range] || []
    return employees.filter(e => letters.includes(e.name.charAt(0).toUpperCase())).length
  }

  const getSearchCount = (query) => {
    if (!query) return totalCount
    return employees.filter(e => 
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.id.toLowerCase().includes(query.toLowerCase())
    ).length
  }

  return {
    completedCount,
    totalCount,
    pendingCount,
    onTimeCount,
    arrivedCount,
    absentCount,
    getCategoryCount,
    getAttendanceCount,
    getAlphabetCount,
    getSearchCount,
    // Vehicle metrics
    assignedVehicles,
    totalVehicleCapacity,
    currentVehicleAssignments,
    averageVehicleUtilization,
    fullyUtilizedVehicles,
    underUtilizedVehicles,
    lockedVehicles,
    // Min/Max labour demand metrics
    minDemandCount,
    maxDemandCount,
    pendingDemandCount,
    chalanMenCount: chalanMen.length
  }
}
