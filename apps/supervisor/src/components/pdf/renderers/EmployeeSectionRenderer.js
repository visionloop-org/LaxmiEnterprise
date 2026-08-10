import { PAGE_MARGIN_LEFT, TABLE_COL_WIDTHS, TABLE_COL_STARTS, TITLE_MARGIN, ROW_HEIGHT, TABLE_HEADER_HEIGHT } from '../layout/pdfLayoutConstants'

export class EmployeeSectionRenderer {
  constructor(layoutManager, reportData) {
    this.layoutManager = layoutManager
    this.reportData = reportData
    this.statusLabels = { 'on_time': 'On Time', 'arrived': 'Arrived', 'absent': 'Absent', null: 'Pending' }
    this.statusOrder = { null: 0, 'on_time': 1, 'arrived': 2, 'absent': 3 }
  }

  measureSectionHeight(categoryEmployees) {
    // Section header + table header + rows
    return TITLE_MARGIN + TABLE_HEADER_HEIGHT + (categoryEmployees.length * ROW_HEIGHT) + TITLE_MARGIN
  }

  render() {
    const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
    
    categories.forEach(category => {
      const categoryEmployees = this.reportData.employees
        .filter(emp => emp.category === category)
        .sort((a, b) => {
          const statusA = this.statusOrder[a.attendance] ?? 0
          const statusB = this.statusOrder[b.attendance] ?? 0
          if (statusA !== statusB) return statusA - statusB
          return a.name.localeCompare(b.name)
        })
      
      if (categoryEmployees.length === 0) return
      
      this.renderCategorySection(category, categoryEmployees)
    })
    
    return this.layoutManager.getCursor()
  }

  renderCategorySection(category, employees) {
    const doc = this.layoutManager.doc
    const sectionHeight = this.measureSectionHeight(employees)
    
    // Check if section can fit with minimum 3 rows
    const minRequiredHeight = TITLE_MARGIN + TABLE_HEADER_HEIGHT + (3 * ROW_HEIGHT) + TITLE_MARGIN
    const remainingSpace = this.layoutManager.getRemainingSpace()
    
    if (remainingSpace < minRequiredHeight) {
      this.layoutManager.addPage()
    }
    
    const currentY = this.layoutManager.getCursor()
    
    // Category header with prominent divider
    doc.setDrawColor(100)
    doc.setLineWidth(0.8)
    doc.line(PAGE_MARGIN_LEFT, currentY - 5, 180, currentY - 5)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(category.toUpperCase(), PAGE_MARGIN_LEFT, currentY)
    
    this.layoutManager.advanceCursor(TITLE_MARGIN)
    const tableY = this.layoutManager.getCursor()
    
    // Table headers
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('ID', TABLE_COL_STARTS.ID, tableY)
    doc.text('Name', TABLE_COL_STARTS.NAME, tableY)
    doc.text('Status', TABLE_COL_STARTS.STATUS, tableY)
    doc.text('Time', TABLE_COL_STARTS.TIME, tableY)
    
    // Draw header line
    doc.setDrawColor(150)
    doc.setLineWidth(0.5)
    doc.line(PAGE_MARGIN_LEFT, tableY + 2, 180, tableY + 2)
    
    this.layoutManager.advanceCursor(TABLE_HEADER_HEIGHT)
    
    // Employee rows
    this.renderEmployeeRows(employees)
    
    this.layoutManager.advanceCursor(TITLE_MARGIN)
  }

  renderEmployeeRows(employees) {
    const doc = this.layoutManager.doc
    
    employees.forEach(emp => {
      // Check if row can fit
      if (this.layoutManager.getRemainingSpace() < ROW_HEIGHT) {
        this.layoutManager.addPage()
        this.renderTableHeader()
      }
      
      const currentY = this.layoutManager.getCursor()
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(emp.id, TABLE_COL_STARTS.ID, currentY)
      doc.text(emp.name, TABLE_COL_STARTS.NAME, currentY)
      doc.text(this.statusLabels[emp.attendance] || 'Pending', TABLE_COL_STARTS.STATUS, currentY)
      
      // Only show time for Arrived status
      if (emp.attendance === 'arrived') {
        doc.text(emp.arrivalTime || '-', TABLE_COL_STARTS.TIME, currentY)
      } else {
        doc.text('-', TABLE_COL_STARTS.TIME, currentY)
      }
      
      // Draw row line
      doc.setDrawColor(230)
      doc.setLineWidth(0.2)
      doc.line(PAGE_MARGIN_LEFT, currentY + 2, 180, currentY + 2)
      
      this.layoutManager.advanceCursor(ROW_HEIGHT)
    })
  }

  renderTableHeader() {
    const doc = this.layoutManager.doc
    const currentY = this.layoutManager.getCursor()
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('ID', TABLE_COL_STARTS.ID, currentY)
    doc.text('Name', TABLE_COL_STARTS.NAME, currentY)
    doc.text('Status', TABLE_COL_STARTS.STATUS, currentY)
    doc.text('Time', TABLE_COL_STARTS.TIME, currentY)
    
    doc.setDrawColor(150)
    doc.setLineWidth(0.5)
    doc.line(PAGE_MARGIN_LEFT, currentY + 2, 180, currentY + 2)
    
    this.layoutManager.advanceCursor(TABLE_HEADER_HEIGHT)
  }
}
