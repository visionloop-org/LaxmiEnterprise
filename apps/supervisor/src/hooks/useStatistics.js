export function useStatistics(employees = [], vehicles = []) {
  const emps = employees || []
  const vechs = vehicles || []

  const completedCount = emps.filter(e => e && e.attendance !== null && e.attendance !== undefined).length
  const totalCount = emps.length
  const pendingCount = totalCount - completedCount
  const onTimeCount = emps.filter(e => e && e.attendance === 'on_time').length
  const arrivedCount = emps.filter(e => e && e.attendance === 'arrived').length
  const absentCount = emps.filter(e => e && e.attendance === 'absent').length

  // Vehicle assignment efficiency metrics
  const assignedVehicles = vechs.filter(v => v && (v.status === 'in_use' || v.status === 'In Use'))
  const totalVehicleCapacity = vechs.length * 8
  const currentVehicleAssignments = emps.filter(e => e && e.assignedVehicle).length
  const averageVehicleUtilization = vechs.length > 0 
    ? Math.round((currentVehicleAssignments / totalVehicleCapacity) * 100) 
    : 0
  const fullyUtilizedVehicles = vechs.filter(v => {
    if (!v) return false
    const assignments = emps.filter(e => e && e.assignedVehicle === v.id)
    return assignments.length >= 8
  }).length
  const underUtilizedVehicles = vechs.filter(v => {
    if (!v) return false
    const assignments = emps.filter(e => e && e.assignedVehicle === v.id)
    return assignments.length > 0 && assignments.length < 4
  }).length
  const lockedVehicles = vechs.filter(v => v && v.locked).length

  // Min / Max Labour Request Metrics
  const chalanMen = emps.filter(e => e && e.category === 'Chalan Men')
  const minDemandCount = chalanMen.filter(e => e.labourRequest === 'minimum').length
  const maxDemandCount = chalanMen.filter(e => e.labourRequest === 'more').length
  const pendingDemandCount = chalanMen.filter(e => (e.attendance === 'on_time' || e.attendance === 'arrived') && !e.labourRequest).length

  const getCategoryCount = (category) => {
    if (category === 'All') return totalCount
    if (category === 'Vehicles' || category === 'vehicles') return vechs.length
    return emps.filter(e => e && e.category === category).length
  }

  const getAttendanceCount = (status) => {
    if (status === 'All') return totalCount
    if (status === 'Present') return onTimeCount + arrivedCount
    if (status === 'Absent') return absentCount
    if (status === 'Completed') return completedCount
    if (status === 'Pending') return pendingCount
    if (status === 'On Time' || status === 'on_time') return onTimeCount
    if (status === 'Arrived' || status === 'arrived') return arrivedCount
    return emps.filter(e => e && e.attendance === status).length
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
    return emps.filter(e => e && e.name && letters.includes(e.name.charAt(0).toUpperCase())).length
  }

  const getSearchCount = (query) => {
    if (!query) return totalCount
    const q = query.toLowerCase()
    return emps.filter(e => 
      e && (
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.id && String(e.id).toLowerCase().includes(q))
      )
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
