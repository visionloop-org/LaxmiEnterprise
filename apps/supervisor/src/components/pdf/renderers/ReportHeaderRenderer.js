import { PAGE_MARGIN_LEFT, PAGE_MARGIN_RIGHT, TITLE_MARGIN } from '../layout/pdfLayoutConstants'

export class ReportHeaderRenderer {
  constructor(layoutManager, reportData) {
    this.layoutManager = layoutManager
    this.reportData = reportData
  }

  measureHeight() {
    return 35  // Fixed height for report header section
  }

  render() {
    const doc = this.layoutManager.doc
    const currentY = this.layoutManager.getCursor()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Report info section
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date: ${this.reportData.currentDate}`, PAGE_MARGIN_LEFT, currentY)
    doc.text(`Shift: A`, PAGE_MARGIN_LEFT, currentY + 10)
    doc.text(`Session: Morning`, PAGE_MARGIN_LEFT, currentY + 20)
    doc.text(`Supervisor: _____________`, PAGE_MARGIN_LEFT, currentY + 30)

    // Report ID and version info on right
    doc.text(`Report ID: ${this.reportData.reportId}`, pageWidth - PAGE_MARGIN_RIGHT, currentY, { align: 'right' })
    doc.text(`Version: 1.0`, pageWidth - PAGE_MARGIN_RIGHT, currentY + 10, { align: 'right' })
    const generatedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    doc.text(`Generated: ${generatedTime}`, pageWidth - PAGE_MARGIN_RIGHT, currentY + 20, { align: 'right' })

    this.layoutManager.advanceCursor(this.measureHeight())
    return this.layoutManager.getCursor()
  }
}
