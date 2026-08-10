// Report service for server-side agent communication
import { agentClient } from './agentClient.js'

class ReportService {
  /**
   * Generate attendance PDF report
   * @param {string} sessionId - Session ID
   * @param {object} reportData - Report data (employees, stats, etc.)
   * @param {object} options - Report options (format, include graphs, etc.)
   * @returns {Promise<object>} Generated report info (download URL, etc.)
   */
  async generateAttendanceReport(sessionId, reportData, options = {}) {
    return await agentClient.sendAction('generate_attendance_report', {
      sessionId,
      reportData,
      options,
    })
  }

  /**
   * Generate vehicle status report
   * @param {string} sessionId - Session ID
   * @param {object} reportData - Vehicle data
   * @returns {Promise<object>} Generated report info
   */
  async generateVehicleReport(sessionId, reportData) {
    return await agentClient.sendAction('generate_vehicle_report', {
      sessionId,
      reportData,
    })
  }

  /**
   * Generate labour request report (Chalan Men)
   * @param {string} sessionId - Session ID
   * @param {object} reportData - Labour request data
   * @returns {Promise<object>} Generated report info
   */
  async generateLabourReport(sessionId, reportData) {
    return await agentClient.sendAction('generate_labour_report', {
      sessionId,
      reportData,
    })
  }

  /**
   * Generate summary report (all categories)
   * @param {string} sessionId - Session ID
   * @param {object} reportData - Complete session data
   * @returns {Promise<object>} Generated report info
   */
  async generateSummaryReport(sessionId, reportData) {
    return await agentClient.sendAction('generate_summary_report', {
      sessionId,
      reportData,
    })
  }

  /**
   * Download generated report
   * @param {string} reportId - Report ID
   * @returns {Promise<Blob>} Report file blob
   */
  async downloadReport(reportId) {
    return await agentClient.sendAction('download_report', { reportId })
  }

  /**
   * Get report status
   * @param {string} reportId - Report ID
   * @returns {Promise<object>} Report status (pending, completed, failed)
   */
  async getReportStatus(reportId) {
    return await agentClient.sendAction('get_report_status', { reportId })
  }

  /**
   * List available reports for session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of reports
   */
  async listReports(sessionId) {
    return await agentClient.sendAction('list_reports', { sessionId })
  }

  /**
   * Delete report
   * @param {string} reportId - Report ID
   * @returns {Promise<object>} Deletion confirmation
   */
  async deleteReport(reportId) {
    return await agentClient.sendAction('delete_report', { reportId })
  }

  /**
   * Export data to CSV
   * @param {string} sessionId - Session ID
   * @param {string} dataType - Data type ('employees', 'vehicles', 'all')
   * @returns {Promise<object>} Export info (download URL, etc.)
   */
  async exportToCSV(sessionId, dataType = 'all') {
    return await agentClient.sendAction('export_to_csv', {
      sessionId,
      dataType,
    })
  }

  /**
   * Export data to Excel
   * @param {string} sessionId - Session ID
   * @param {string} dataType - Data type ('employees', 'vehicles', 'all')
   * @returns {Promise<object>} Export info
   */
  async exportToExcel(sessionId, dataType = 'all') {
    return await agentClient.sendAction('export_to_excel', {
      sessionId,
      dataType,
    })
  }
}

export const reportService = new ReportService()
