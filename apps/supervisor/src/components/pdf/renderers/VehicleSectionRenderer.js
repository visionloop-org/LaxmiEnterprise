export class VehicleSectionRenderer {
  constructor(layoutManager, reportData) {
    this.layoutManager = layoutManager
    this.reportData = reportData
  }

  render() {
    const { vehicles, employees, assignedVehicles, averageVehicleUtilization, fullyUtilizedVehicles, underUtilizedVehicles, lockedVehicles } = this.reportData

    if (!vehicles || vehicles.length === 0) return

    // Add new page for vehicle details
    this.layoutManager.addPage()
    this.layoutManager.setSectionName('Vehicle Assignments')

    const doc = this.layoutManager.doc
    const y = this.layoutManager.currentY

    // Section title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Vehicle Assignments', 20, y)
    this.layoutManager.currentY += 15

    // Vehicle efficiency summary
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Assigned Vehicles: ${assignedVehicles?.length || 0}`, 20, this.layoutManager.currentY)
    this.layoutManager.currentY += 7
    doc.text(`Average Utilization: ${averageVehicleUtilization || 0}%`, 20, this.layoutManager.currentY)
    this.layoutManager.currentY += 7
    doc.text(`Full Capacity Vehicles: ${fullyUtilizedVehicles || 0}`, 20, this.layoutManager.currentY)
    this.layoutManager.currentY += 7
    doc.text(`Under Utilized Vehicles: ${underUtilizedVehicles || 0}`, 20, this.layoutManager.currentY)
    this.layoutManager.currentY += 7
    doc.text(`Locked Vehicles: ${lockedVehicles || 0}`, 20, this.layoutManager.currentY)
    this.layoutManager.currentY += 15

    // Vehicle table header
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Vehicle ID', 20, this.layoutManager.currentY)
    doc.text('Number', 60, this.layoutManager.currentY)
    doc.text('Type', 100, this.layoutManager.currentY)
    doc.text('Status', 140, this.layoutManager.currentY)
    doc.text('Capacity', 180, this.layoutManager.currentY)
    this.layoutManager.currentY += 8

    // Draw header line
    doc.setLineWidth(0.5)
    doc.line(20, this.layoutManager.currentY, 190, this.layoutManager.currentY)
    this.layoutManager.currentY += 5

    // Vehicle rows
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    vehicles.forEach((vehicle, index) => {
      const assignments = employees.filter(e => e.assignedVehicle === vehicle.id)
      const driverCount = assignments.filter(e => e.category === 'Drivers').length
      const chalanManCount = assignments.filter(e => e.category === 'Chalan Men').length
      const workerCount = assignments.filter(e => e.category === 'Workers' || e.category === 'Extra Labour').length
      const totalAssignments = assignments.length

      // Check page break
      if (this.layoutManager.currentY > 270) {
        this.layoutManager.addPage()
        this.layoutManager.setSectionName('Vehicle Assignments (continued)')
      }

      doc.text(vehicle.id, 20, this.layoutManager.currentY)
      doc.text(vehicle.number, 60, this.layoutManager.currentY)
      doc.text(vehicle.type, 100, this.layoutManager.currentY)
      doc.text(vehicle.status, 140, this.layoutManager.currentY)
      doc.text(`${totalAssignments}/8 (D:${driverCount}, C:${chalanManCount}, W:${workerCount})`, 180, this.layoutManager.currentY)
      this.layoutManager.currentY += 7
    })

    // Capacity violations section
    const violations = []
    vehicles.forEach(vehicle => {
      const assignments = employees.filter(e => e.assignedVehicle === vehicle.id)
      const driverCount = assignments.filter(e => e.category === 'Drivers').length
      const chalanManCount = assignments.filter(e => e.category === 'Chalan Men').length
      const workerCount = assignments.filter(e => e.category === 'Workers' || e.category === 'Extra Labour').length

      if (driverCount > 1) violations.push(`${vehicle.number}: ${driverCount} drivers (max 1)`)
      if (chalanManCount > 1) violations.push(`${vehicle.number}: ${chalanManCount} chalan men (max 1)`)
      if (workerCount > 6) violations.push(`${vehicle.number}: ${workerCount} workers (max 6)`)
    })

    if (violations.length > 0) {
      this.layoutManager.currentY += 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Capacity Violations', 20, this.layoutManager.currentY)
      this.layoutManager.currentY += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(200, 0, 0)
      violations.forEach(violation => {
        doc.text(`⚠ ${violation}`, 20, this.layoutManager.currentY)
        this.layoutManager.currentY += 6
      })
      doc.setTextColor(0, 0, 0)
    }
  }
}
