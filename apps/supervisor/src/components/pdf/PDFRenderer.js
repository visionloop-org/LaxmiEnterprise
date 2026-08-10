import jsPDF from 'jspdf'
import { LayoutManager } from './layout/LayoutManager'
import { ReportHeaderRenderer } from './renderers/ReportHeaderRenderer'
import { SummaryRenderer } from './renderers/SummaryRenderer'
import { CategorySummaryRenderer } from './renderers/CategorySummaryRenderer'
import { EmployeeSectionRenderer } from './renderers/EmployeeSectionRenderer'
import { VehicleSectionRenderer } from './renderers/VehicleSectionRenderer'
import { ExceptionReportRenderer } from './renderers/ExceptionReportRenderer'

export class PDFRenderer {
  constructor(reportData) {
    this.reportData = reportData
    this.doc = new jsPDF()
    this.layoutManager = new LayoutManager(this.doc, reportData)
  }

  render() {
    // Render initial page header
    this.layoutManager.renderPageHeader()
    
    // Render report header
    const reportHeaderRenderer = new ReportHeaderRenderer(this.layoutManager, this.reportData)
    reportHeaderRenderer.render()
    
    // Render summary
    this.layoutManager.setSectionName('Summary')
    const summaryRenderer = new SummaryRenderer(this.layoutManager, this.reportData)
    summaryRenderer.render()
    
    // Render category summary
    const categorySummaryRenderer = new CategorySummaryRenderer(this.layoutManager, this.reportData)
    categorySummaryRenderer.render()
    
    // Add new page for employee details
    this.layoutManager.addPage()
    this.layoutManager.setSectionName('Employee Details')
    
    // Render employee sections
    const employeeSectionRenderer = new EmployeeSectionRenderer(this.layoutManager, this.reportData)
    employeeSectionRenderer.render()
    
    // Render vehicle assignments section
    const vehicleSectionRenderer = new VehicleSectionRenderer(this.layoutManager, this.reportData)
    vehicleSectionRenderer.render()
    
    // Render exception report
    const exceptionReportRenderer = new ExceptionReportRenderer(this.layoutManager, this.reportData)
    exceptionReportRenderer.render()
    
    // Finalize (render footers on all pages)
    this.layoutManager.finalize()
    
    return this.doc
  }

  save(filename) {
    this.doc.save(filename)
  }
}
