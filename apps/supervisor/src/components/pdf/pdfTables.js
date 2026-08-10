import jsPDF from 'jspdf'

export const generateTablePages = (doc, employees) => {
  const categories = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
  const statusLabels = { 'on_time': 'On Time', 'arrived': 'Arrived', 'absent': 'Absent', null: 'Pending' }
  const statusOrder = { null: 0, 'on_time': 1, 'arrived': 2, 'absent': 3 }
  
  let y = 25  // Adjusted for header space
  
  categories.forEach(category => {
    const categoryEmployees = employees
      .filter(emp => emp.category === category)
      .sort((a, b) => {
        // Sort by status first (pending first), then by name
        const statusA = statusOrder[a.attendance] ?? 0
        const statusB = statusOrder[b.attendance] ?? 0
        if (statusA !== statusB) return statusA - statusB
        return a.name.localeCompare(b.name)
      })
    
    if (categoryEmployees.length === 0) return
    
    // Category header with prominent divider
    if (y > 250) {
      doc.addPage()
      y = 25
    }
    
    // Draw category divider line
    doc.setDrawColor(100)
    doc.setLineWidth(0.8)
    doc.line(15, y - 5, 180, y - 5)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(category.toUpperCase(), 15, y)
    y += 10
    
    // Table headers
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('ID', 20, y)
    doc.text('Name', 45, y)
    doc.text('Status', 110, y)
    doc.text('Time', 150, y)
    
    // Draw header line
    doc.setDrawColor(150)
    doc.setLineWidth(0.5)
    doc.line(15, y + 2, 180, y + 2)
    
    y += 6
    
    // Employee rows (single table with status column)
    doc.setFont('helvetica', 'normal')
    categoryEmployees.forEach(emp => {
      if (y > 270) {
        doc.addPage()
        y = 25
        
        // Redraw headers on new page
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text('ID', 20, y)
        doc.text('Name', 45, y)
        doc.text('Status', 110, y)
        doc.text('Time', 150, y)
        
        doc.setDrawColor(150)
        doc.setLineWidth(0.5)
        doc.line(15, y + 2, 180, y + 2)
        
        y += 6
        doc.setFont('helvetica', 'normal')
      }
      
      doc.text(emp.id, 20, y)
      doc.text(emp.name, 45, y)
      doc.text(statusLabels[emp.attendance] || 'Pending', 110, y)
      
      // Only show time for Arrived status
      if (emp.attendance === 'arrived') {
        doc.text(emp.arrivalTime || '-', 150, y)
      } else {
        doc.text('-', 150, y)
      }
      
      // Draw row line
      doc.setDrawColor(230)
      doc.setLineWidth(0.2)
      doc.line(15, y + 2, 180, y + 2)
      
      y += 6
    })
    y += 8
  })
  
  return doc
}
