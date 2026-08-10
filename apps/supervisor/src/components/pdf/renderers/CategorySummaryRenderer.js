import { PAGE_MARGIN_LEFT, CATEGORY_TABLE_COL_WIDTHS, CATEGORY_TABLE_COL_STARTS, TITLE_MARGIN, ROW_HEIGHT, TABLE_HEADER_HEIGHT } from '../layout/pdfLayoutConstants'

export class CategorySummaryRenderer {
  constructor(layoutManager, reportData) {
    this.layoutManager = layoutManager
    this.reportData = reportData
  }

  measureHeight() {
    const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
    let rowCount = 0
    
    categories.forEach(category => {
      const categoryEmployees = this.reportData.employees.filter(emp => emp.category === category)
      if (categoryEmployees.length > 0) rowCount++
    })
    
    return TITLE_MARGIN + TABLE_HEADER_HEIGHT + (rowCount * ROW_HEIGHT) + TITLE_MARGIN
  }

  render() {
    const doc = this.layoutManager.doc
    const currentY = this.layoutManager.getCursor()
    
    // Category Summary title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Category Summary', PAGE_MARGIN_LEFT, currentY)
    
    // Table headers
    const tableY = currentY + TITLE_MARGIN
    const headers = ['Category', 'Total', 'On Time', 'Arrived', 'Absent', 'Pending']
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    headers.forEach((header, i) => {
      doc.text(header, CATEGORY_TABLE_COL_STARTS[i], tableY)
    })
    
    // Draw header line
    doc.setDrawColor(150)
    doc.setLineWidth(0.3)
    doc.line(PAGE_MARGIN_LEFT, tableY + 3, 170, tableY + 3)
    
    // Table rows
    const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
    let y = tableY + 8
    
    categories.forEach(category => {
      const categoryEmployees = this.reportData.employees.filter(emp => emp.category === category)
      const categoryTotal = categoryEmployees.length
      if (categoryTotal === 0) return
      
      const categoryOnTime = categoryEmployees.filter(emp => emp.attendance === 'on_time').length
      const categoryArrived = categoryEmployees.filter(emp => emp.attendance === 'arrived').length
      const categoryAbsent = categoryEmployees.filter(emp => emp.attendance === 'absent').length
      const categoryPending = categoryEmployees.filter(emp => emp.attendance === null).length
      const categoryCompleted = categoryEmployees.filter(emp => emp.attendance !== null).length
      const completionPercent = ((categoryCompleted / categoryTotal) * 100).toFixed(1)
      
      doc.setFont('helvetica', 'normal')
      doc.text(category, CATEGORY_TABLE_COL_STARTS[0], y)
      doc.text(`${categoryTotal} (${completionPercent}%)`, CATEGORY_TABLE_COL_STARTS[1], y)
      doc.text(categoryOnTime.toString(), CATEGORY_TABLE_COL_STARTS[2], y)
      doc.text(categoryArrived.toString(), CATEGORY_TABLE_COL_STARTS[3], y)
      doc.text(categoryAbsent.toString(), CATEGORY_TABLE_COL_STARTS[4], y)
      doc.text(categoryPending.toString(), CATEGORY_TABLE_COL_STARTS[5], y)
      
      // Draw row line
      doc.setDrawColor(230)
      doc.setLineWidth(0.2)
      doc.line(PAGE_MARGIN_LEFT, y + 2, 170, y + 2)
      
      y += ROW_HEIGHT
    })
    
    this.layoutManager.advanceCursor(this.measureHeight())
    return this.layoutManager.getCursor()
  }
}
