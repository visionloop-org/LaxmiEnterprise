import jsPDF from 'jspdf'
import {
  CONTENT_TOP,
  CONTENT_BOTTOM,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  PAGE_MARGIN_LEFT,
  PAGE_MARGIN_RIGHT,
  PAGE_MARGIN_TOP,
  PAGE_MARGIN_BOTTOM
} from './pdfLayoutConstants'

export class LayoutManager {
  constructor(doc, reportData) {
    this.doc = doc
    this.reportData = reportData
    this.currentPage = 1
    this.currentY = CONTENT_TOP
    this.totalPages = 1
    this.sectionName = 'Summary'
  }

  getRemainingSpace() {
    return CONTENT_BOTTOM - this.currentY
  }

  ensureSpace(requiredHeight, minHeight = 0) {
    const remaining = this.getRemainingSpace()
    const needed = requiredHeight + minHeight
    
    if (remaining < needed) {
      this.addPage()
    }
  }

  addPage() {
    this.doc.addPage()
    this.currentPage++
    this.totalPages++
    this.currentY = CONTENT_TOP
    this.renderPageHeader()
  }

  renderPageHeader() {
    const pageWidth = this.doc.internal.pageSize.getWidth()
    
    // Header line
    this.doc.setDrawColor(150)
    this.doc.setLineWidth(0.5)
    this.doc.line(PAGE_MARGIN_LEFT, PAGE_MARGIN_TOP + HEADER_HEIGHT, pageWidth - PAGE_MARGIN_RIGHT, PAGE_MARGIN_TOP + HEADER_HEIGHT)
    
    // Company name
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('LAXMI ENTERPRISE', PAGE_MARGIN_LEFT, PAGE_MARGIN_TOP + 3)
    
    // Report title
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Daily Attendance Register', PAGE_MARGIN_LEFT, PAGE_MARGIN_TOP + 13)
    
    // Report ID (top right)
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Report ID: ${this.reportData.reportId}`, pageWidth - PAGE_MARGIN_RIGHT, PAGE_MARGIN_TOP + 3, { align: 'right' })
    
    // Page title (center)
    this.doc.setFontSize(10)
    const pageTitle = this.sectionName
    this.doc.text(pageTitle, pageWidth / 2, PAGE_MARGIN_TOP + 13, { align: 'center' })
  }

  renderFooter(isFinalPage = false) {
    const pageWidth = this.doc.internal.pageSize.getWidth()
    const pageHeight = this.doc.internal.pageSize.getHeight()
    const footerY = pageHeight - PAGE_MARGIN_BOTTOM
    
    // Footer line
    this.doc.setDrawColor(150)
    this.doc.setLineWidth(0.5)
    this.doc.line(PAGE_MARGIN_LEFT, footerY - FOOTER_HEIGHT, pageWidth - PAGE_MARGIN_RIGHT, footerY - FOOTER_HEIGHT)
    
    // Page number with section
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    const pageText = this.sectionName ? `${this.sectionName} (Page ${this.currentPage} of ${this.totalPages})` : `Page ${this.currentPage} of ${this.totalPages}`
    this.doc.text(pageText, pageWidth / 2, footerY - 28, { align: 'center' })
    
    if (isFinalPage) {
      // Signature fields on final page
      this.doc.setFontSize(8)
      this.doc.text('Prepared By: ________________', PAGE_MARGIN_LEFT, footerY - 18)
      this.doc.text('Verified By: ________________', pageWidth / 2, footerY - 18, { align: 'center' })
      this.doc.text('Approved By: ________________', pageWidth - PAGE_MARGIN_RIGHT, footerY - 18, { align: 'right' })
    }
    
    // Copyright and generated date
    this.doc.setFontSize(7)
    this.doc.text('© 2026 Laxmi Enterprise - Confidential', PAGE_MARGIN_LEFT, footerY - 10)
    
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const generatedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    this.doc.text(`Generated: ${generatedDate} ${generatedTime}`, pageWidth - PAGE_MARGIN_RIGHT, footerY - 10, { align: 'right' })
  }

  setSectionName(name) {
    this.sectionName = name
  }

  advanceCursor(amount) {
    this.currentY += amount
  }

  getCursor() {
    return this.currentY
  }

  getCurrentPage() {
    return this.currentPage
  }

  getTotalPages() {
    return this.totalPages
  }

  finalize() {
    // Render footers on all pages
    for (let i = 1; i <= this.totalPages; i++) {
      this.doc.setPage(i)
      const isFinalPage = (i === this.totalPages)
      this.renderFooter(isFinalPage)
    }
  }
}
