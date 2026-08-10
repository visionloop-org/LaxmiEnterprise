import jsPDF from 'jspdf'
import { PDFRenderer } from './PDFRenderer'

export const generateAttendanceReport = (data) => {
  const {
    currentDate,
    sessionStartTime,
    totalCount,
    completedCount,
    pendingCount,
    onTimeCount,
    arrivedCount,
    absentCount,
    employees,
    vehicles,
    assignedVehicles,
    averageVehicleUtilization,
    fullyUtilizedVehicles,
    underUtilizedVehicles,
    lockedVehicles
  } = data

  // Generate report ID
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const reportId = `AT-${dateStr}-A`

  const reportData = {
    currentDate,
    sessionStartTime,
    totalCount,
    completedCount,
    pendingCount,
    onTimeCount,
    arrivedCount,
    absentCount,
    employees,
    vehicles,
    assignedVehicles,
    averageVehicleUtilization,
    fullyUtilizedVehicles,
    underUtilizedVehicles,
    lockedVehicles,
    reportId
  }

  const renderer = new PDFRenderer(reportData)
  const doc = renderer.render()
  
  // Generate filename and save
  const filename = `attendance-report-${dateStr}.pdf`
  renderer.save(filename)
  
  return filename
}
