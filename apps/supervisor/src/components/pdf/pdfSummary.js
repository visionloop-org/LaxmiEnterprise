import jsPDF from 'jspdf'

export const generateSummaryPage = (doc, currentDate, sessionStartTime, totalCount, completedCount, pendingCount, onTimeCount, arrivedCount, absentCount, employees, reportId) => {
  // Report info section (below header)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${currentDate}`, 15, 50)
  doc.text(`Shift: A`, 15, 60)
  doc.text(`Session: Morning`, 15, 70)
  doc.text(`Supervisor: _____________`, 15, 80)
  
  // Report ID and version info on right
  doc.text(`Report ID: ${reportId}`, 180, 50, { align: 'right' })
  doc.text(`Version: 1.0`, 180, 60, { align: 'right' })
  const generatedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  doc.text(`Generated: ${generatedTime}`, 180, 70, { align: 'right' })
  
  // Summary Card Layout - Four compact boxes
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 15, 100)
  
  const boxWidth = 40
  const boxHeight = 35
  const startX = 15
  const startY = 110
  const gap = 5
  
  const boxes = [
    { label: 'Employees', value: totalCount.toString(), x: startX },
    { label: 'Completed', value: completedCount.toString(), x: startX + boxWidth + gap },
    { label: 'Pending', value: pendingCount.toString(), x: startX + (boxWidth + gap) * 2 },
    { label: 'Completion', value: `${((completedCount / totalCount) * 100).toFixed(1)}%`, x: startX + (boxWidth + gap) * 3 }
  ]
  
  boxes.forEach(box => {
    // Draw box border
    doc.setDrawColor(150)
    doc.setLineWidth(0.5)
    doc.rect(box.x, startY, boxWidth, boxHeight)
    
    // Draw label
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(box.label, box.x + boxWidth / 2, startY + 10, { align: 'center' })
    
    // Draw value
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(box.value, box.x + boxWidth / 2, startY + 25, { align: 'center' })
  })
  
  // Status breakdown boxes
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Status Breakdown', 15, 160)
  
  const statusBoxes = [
    { label: 'On Time', value: onTimeCount.toString(), x: startX },
    { label: 'Arrived', value: arrivedCount.toString(), x: startX + boxWidth + gap },
    { label: 'Absent', value: absentCount.toString(), x: startX + (boxWidth + gap) * 2 }
  ]
  
  const statusStartY = 170
  
  statusBoxes.forEach(box => {
    // Draw box border
    doc.setDrawColor(150)
    doc.setLineWidth(0.5)
    doc.rect(box.x, statusStartY, boxWidth, boxHeight)
    
    // Draw label
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(box.label, box.x + boxWidth / 2, statusStartY + 10, { align: 'center' })
    
    // Draw value
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(box.value, box.x + boxWidth / 2, statusStartY + 25, { align: 'center' })
  })
  
  // Category Summary Table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Category Summary', 15, 225)
  
  // Table headers
  const tableY = 235
  const colWidths = [30, 25, 25, 25, 25, 25]
  const colX = [15, 45, 70, 95, 120, 145]
  const headers = ['Category', 'Total', 'On Time', 'Arrived', 'Absent', 'Pending']
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  headers.forEach((header, i) => {
    doc.text(header, colX[i], tableY)
  })
  
  // Draw header line
  doc.setDrawColor(150)
  doc.setLineWidth(0.3)
  doc.line(15, tableY + 3, 170, tableY + 3)
  
  // Table rows
  const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
  let y = tableY + 8
  
  categories.forEach(category => {
    const categoryEmployees = employees.filter(emp => emp.category === category)
    const categoryTotal = categoryEmployees.length
    if (categoryTotal === 0) return
    
    const categoryOnTime = categoryEmployees.filter(emp => emp.attendance === 'on_time').length
    const categoryArrived = categoryEmployees.filter(emp => emp.attendance === 'arrived').length
    const categoryAbsent = categoryEmployees.filter(emp => emp.attendance === 'absent').length
    const categoryPending = categoryEmployees.filter(emp => emp.attendance === null).length
    const categoryCompleted = categoryEmployees.filter(emp => emp.attendance !== null).length
    const completionPercent = ((categoryCompleted / categoryTotal) * 100).toFixed(1)
    
    doc.setFont('helvetica', 'normal')
    doc.text(category, colX[0], y)
    doc.text(`${categoryTotal} (${completionPercent}%)`, colX[1], y)
    doc.text(categoryOnTime.toString(), colX[2], y)
    doc.text(categoryArrived.toString(), colX[3], y)
    doc.text(categoryAbsent.toString(), colX[4], y)
    doc.text(categoryPending.toString(), colX[5], y)
    
    // Draw row line
    doc.setDrawColor(230)
    doc.setLineWidth(0.2)
    doc.line(15, y + 2, 170, y + 2)
    
    y += 7
  })
  
  return doc
}
