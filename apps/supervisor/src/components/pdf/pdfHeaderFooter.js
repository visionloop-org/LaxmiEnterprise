import jsPDF from 'jspdf'

export const addHeader = (doc, currentDate, pageTitle, reportId) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header line
  doc.setDrawColor(150)
  doc.setLineWidth(0.5)
  doc.line(15, 35, pageWidth - 15, 35)
  
  // Company name
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('LAXMI ENTERPRISE', 15, 18)
  
  // Report title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Daily Attendance Register', 15, 28)
  
  // Report ID (top right)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Report ID: ${reportId}`, pageWidth - 15, 18, { align: 'right' })
  
  // Page title (center)
  doc.setFontSize(10)
  doc.text(pageTitle, pageWidth / 2, 28, { align: 'center' })
}

export const addFooter = (doc, currentPage, totalPages, sectionName) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Footer line
  doc.setDrawColor(150)
  doc.setLineWidth(0.5)
  doc.line(15, pageHeight - 35, pageWidth - 15, pageHeight - 35)
  
  // Page number with section
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const pageText = sectionName ? `${sectionName} (Page ${currentPage} of ${totalPages})` : `Page ${currentPage} of ${totalPages}`
  doc.text(pageText, pageWidth / 2, pageHeight - 28, { align: 'center' })
  
  // Signature fields
  doc.setFontSize(8)
  doc.text('Prepared By: ________________', 15, pageHeight - 18)
  doc.text('Verified By: ________________', pageWidth / 2, pageHeight - 18, { align: 'center' })
  doc.text('Approved By: ________________', pageWidth - 15, pageHeight - 18, { align: 'right' })
  
  // Copyright and generated date
  doc.setFontSize(7)
  doc.text('© 2026 Laxmi Enterprise - Confidential', 15, pageHeight - 10)
  
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const generatedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  doc.text(`Generated: ${generatedDate} ${generatedTime}`, pageWidth - 15, pageHeight - 10, { align: 'right' })
}

export const addHeadersAndFooters = (doc, currentDate, reportId) => {
  const totalPages = doc.internal.getNumberOfPages()
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    let pageTitle = 'Summary'
    let sectionName = 'Summary'
    
    if (i === totalPages) {
      pageTitle = 'Pending Exceptions'
      sectionName = 'Pending Exceptions'
    } else if (i > 1) {
      pageTitle = 'Employee Details'
      sectionName = 'Employee Details'
    }
    
    addHeader(doc, currentDate, pageTitle, reportId)
    addFooter(doc, i, totalPages, sectionName)
  }
  
  return doc
}
