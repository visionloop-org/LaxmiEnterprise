import jsPDF from 'jspdf'

export const generatePendingExceptionPage = (doc, employees) => {
  // Add new page
  doc.addPage()
  
  const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
  let y = 45  // Adjusted for header space
  
  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Pending Exception Report', 15, y)
  y += 15
  
  // Divider line
  doc.setDrawColor(150)
  doc.setLineWidth(0.5)
  doc.line(15, y - 5, 180, y - 5)
  
  let totalPending = 0
  
  categories.forEach(category => {
    const pendingEmployees = employees
      .filter(emp => emp.category === category && emp.attendance === null)
      .sort((a, b) => a.name.localeCompare(b.name))
    
    if (pendingEmployees.length === 0) return
    
    totalPending += pendingEmployees.length
    
    // Category header
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`${category} (${pendingEmployees.length})`, 15, y)
    y += 8
    
    // Divider
    doc.setDrawColor(200)
    doc.setLineWidth(0.3)
    doc.line(15, y - 3, 180, y - 3)
    y += 5
    
    // Employee list
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    pendingEmployees.forEach(emp => {
      if (y > 270) {
        doc.addPage()
        y = 45
      }
      doc.text(`${emp.id} ${emp.name}`, 20, y)
      y += 6
    })
    
    y += 8
  })
  
  // Summary at bottom
  if (totalPending === 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('All employees have been marked for attendance.', 15, 100)
  } else {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Pending: ${totalPending}`, 15, y)
    y += 8
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Note: Please complete attendance for all pending employees before finalizing payroll.', 15, y)
  }
  
  return doc
}
