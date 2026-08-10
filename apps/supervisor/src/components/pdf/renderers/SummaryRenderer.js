import { PAGE_MARGIN_LEFT, SUMMARY_BOX_WIDTH, SUMMARY_BOX_HEIGHT, SUMMARY_BOX_GAP, TITLE_MARGIN } from '../layout/pdfLayoutConstants'

export class SummaryRenderer {
  constructor(layoutManager, reportData) {
    this.layoutManager = layoutManager
    this.reportData = reportData
  }

  measureHeight() {
    // Title + 4 summary boxes + spacing
    return TITLE_MARGIN + SUMMARY_BOX_HEIGHT + TITLE_MARGIN + SUMMARY_BOX_HEIGHT + TITLE_MARGIN
  }

  render() {
    const doc = this.layoutManager.doc
    const currentY = this.layoutManager.getCursor()
    const startX = PAGE_MARGIN_LEFT
    const startY = currentY + TITLE_MARGIN

    // Summary title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', startX, startY)

    // Summary Card Layout - Four compact boxes
    const boxes = [
      { label: 'Employees', value: this.reportData.totalCount.toString(), x: startX },
      { label: 'Completed', value: this.reportData.completedCount.toString(), x: startX + SUMMARY_BOX_WIDTH + SUMMARY_BOX_GAP },
      { label: 'Pending', value: this.reportData.pendingCount.toString(), x: startX + (SUMMARY_BOX_WIDTH + SUMMARY_BOX_GAP) * 2 },
      { label: 'Completion', value: `${((this.reportData.completedCount / this.reportData.totalCount) * 100).toFixed(1)}%`, x: startX + (SUMMARY_BOX_WIDTH + SUMMARY_BOX_GAP) * 3 }
    ]

    const boxStartY = startY + 10

    boxes.forEach(box => {
      // Draw box border
      doc.setDrawColor(150)
      doc.setLineWidth(0.5)
      doc.rect(box.x, boxStartY, SUMMARY_BOX_WIDTH, SUMMARY_BOX_HEIGHT)

      // Draw label
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(box.label, box.x + SUMMARY_BOX_WIDTH / 2, boxStartY + 10, { align: 'center' })

      // Draw value
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(box.value, box.x + SUMMARY_BOX_WIDTH / 2, boxStartY + 25, { align: 'center' })
    })

    // Status breakdown boxes
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    const statusStartY = boxStartY + SUMMARY_BOX_HEIGHT + TITLE_MARGIN
    doc.text('Status Breakdown', startX, statusStartY)

    const statusBoxes = [
      { label: 'On Time', value: this.reportData.onTimeCount.toString(), x: startX },
      { label: 'Arrived', value: this.reportData.arrivedCount.toString(), x: startX + SUMMARY_BOX_WIDTH + SUMMARY_BOX_GAP },
      { label: 'Absent', value: this.reportData.absentCount.toString(), x: startX + (SUMMARY_BOX_WIDTH + SUMMARY_BOX_GAP) * 2 }
    ]

    const statusBoxStartY = statusStartY + 10

    statusBoxes.forEach(box => {
      // Draw box border
      doc.setDrawColor(150)
      doc.setLineWidth(0.5)
      doc.rect(box.x, statusBoxStartY, SUMMARY_BOX_WIDTH, SUMMARY_BOX_HEIGHT)

      // Draw label
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(box.label, box.x + SUMMARY_BOX_WIDTH / 2, statusBoxStartY + 10, { align: 'center' })

      // Draw value
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(box.value, box.x + SUMMARY_BOX_WIDTH / 2, statusBoxStartY + 25, { align: 'center' })
    })

    this.layoutManager.advanceCursor(this.measureHeight())
    return this.layoutManager.getCursor()
  }
}
