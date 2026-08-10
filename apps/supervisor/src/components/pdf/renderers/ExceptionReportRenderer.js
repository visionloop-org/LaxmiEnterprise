import { PAGE_MARGIN_LEFT, TITLE_MARGIN, ROW_HEIGHT } from '../layout/pdfLayoutConstants'

export class ExceptionReportRenderer {
  constructor(layoutManager, reportData) {
    this.layoutManager = layoutManager
    this.reportData = reportData
  }

  measureHeight() {
    const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
    let pendingCount = 0
    
    categories.forEach(category => {
      const pendingEmployees = this.reportData.employees
        .filter(emp => emp.category === category && emp.attendance === null)
      pendingCount += pendingEmployees.length
    })
    
    if (pendingCount === 0) return TITLE_MARGIN + 20
    
    return TITLE_MARGIN + 15 + (pendingCount * ROW_HEIGHT) + TITLE_MARGIN + 20
  }

  render() {
    const doc = this.layoutManager.doc
    
    // Add new page for exception report
    this.layoutManager.addPage()
    this.layoutManager.setSectionName('Pending Exceptions')
    
    const currentY = this.layoutManager.getCursor()
    
    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Pending Exception Report', PAGE_MARGIN_LEFT, currentY)
    
    const startY = currentY + TITLE_MARGIN
    
    // Divider line
    doc.setDrawColor(150)
    doc.setLineWidth(0.5)
    doc.line(PAGE_MARGIN_LEFT, startY - 5, 180, startY - 5)
    
    let y = startY + 10
    
    const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
    let totalPending = 0
    
    categories.forEach(category => {
      const pendingEmployees = this.reportData.employees
        .filter(emp => emp.category === category && emp.attendance === null)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      if (pendingEmployees.length === 0) return
      
      totalPending += pendingEmployees.length
      
      // Category header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${category} (${pendingEmployees.length})`, PAGE_MARGIN_LEFT, y)
      y += 8
      
      // Divider
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.line(PAGE_MARGIN_LEFT, y - 3, 180, y - 3)
      y += 5
      
      // Employee list
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      pendingEmployees.forEach(emp => {
        if (this.layoutManager.getRemainingSpace() < ROW_HEIGHT) {
          this.layoutManager.addPage()
          y = this.layoutManager.getCursor()
        }
        doc.text(`${emp.id} ${emp.name}`, PAGE_MARGIN_LEFT + 5, y)
        y += ROW_HEIGHT
      })
      
      y += 8
    })
    
    // Summary at bottom
    if (totalPending === 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('All employees have been marked for attendance.', PAGE_MARGIN_LEFT, y)
    } else {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total Pending: ${totalPending}`, PAGE_MARGIN_LEFT, y)
      y += 8
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Note: Please complete attendance for all pending employees before finalizing payroll.', PAGE_MARGIN_LEFT, y)
    }
    
    this.layoutManager.advanceCursor(this.measureHeight())
    return this.layoutManager.getCursor()
  }
}
