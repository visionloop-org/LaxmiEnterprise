/**
 * PDF Service for Laxmi Enterprise
 * Handles PDF generation and Google Drive upload
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('PDFService')

class PDFService {
  constructor(googleSheetsService) {
    this.googleSheetsService = googleSheetsService
  }

  /**
   * Generate and optionally upload PDF to Google Drive
   * @param {Object} data - Attendance/data for PDF generation
   * @param {Object} options - PDF generation and upload options
   * @returns {Promise<Object>} PDF data and upload result
   */
  async generateAndUploadPDF(data, options = {}) {
    logger.info('Generating PDF', { 
      hasData: !!data, 
      autoUpload: options.autoUpload,
      filename: options.filename 
    })

    try {
      // Generate PDF (delegated to existing PDF handler)
      const pdfData = await this.generatePDF(data, options)
      
      // Upload if requested
      if (options.autoUpload) {
        logger.info('Uploading PDF to Google Drive', { filename: options.filename })
        const uploadResult = await this.uploadPDF(pdfData, {
          filename: options.filename || `attendance_${Date.now()}.pdf`,
          year: options.year,
          month: options.month,
          day: options.day,
          sessionId: data.sessionId
        })
        
        logger.info('PDF upload completed', { 
          fileId: uploadResult.fileId,
          success: uploadResult.status === 'success'
        })
        
        return {
          pdfData,
          uploadResult
        }
      }
      
      return { pdfData }
    } catch (error) {
      logger.logError(error, { operation: 'generateAndUploadPDF' })
      throw error
    }
  }

  /**
   * Generate PDF from data (delegates to existing PDF handler)
   * @param {Object} data - Data for PDF generation
   * @param {Object} options - PDF generation options
   * @returns {Promise<string>} Base64 encoded PDF data
   */
  async generatePDF(data, options = {}) {
    // This delegates to the existing PDF handler in the supervisor app
    // For now, return a placeholder - the actual implementation would call the existing PDF generation
    logger.info('Delegating PDF generation to existing handler')
    
    // In a real implementation, this would call the existing PDF generation logic
    // For now, we'll assume the PDF data is passed in or generated elsewhere
    if (options.pdfData) {
      return options.pdfData
    }
    
    throw new Error('PDF data must be provided or PDF generation must be implemented')
  }

  /**
   * Upload PDF to Google Drive
   * @param {string} base64Data - Base64 encoded PDF data
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result
   */
  async uploadPDF(base64Data, metadata) {
    const maxRetries = 3
    let lastError

    logger.info('Starting PDF upload with retry logic', { 
      maxRetries,
      filename: metadata.filename 
    })

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.googleSheetsService.uploadReportToDrive(base64Data, metadata)
        
        if (result.status === 'success') {
          logger.info('PDF upload successful', { 
            attempt: attempt + 1,
            fileId: result.fileId 
          })
          return result
        } else {
          throw new Error(result.message || 'Upload failed')
        }
      } catch (error) {
        lastError = error
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        
        logger.warn(`PDF upload attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: error.message,
          attempt: attempt + 1
        })
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    logger.logError(lastError, { 
      operation: 'uploadPDF',
      totalAttempts: maxRetries,
      filename: metadata.filename
    })
    
    throw lastError
  }

  /**
   * Convert PDF blob to base64
   * @param {Blob} blob - PDF blob
   * @returns {Promise<string>} Base64 encoded data
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Generate attendance report filename
   * @param {Object} data - Attendance data
   * @returns {string} Generated filename
   */
  generateFilename(data) {
    const date = data.currentDate || new Date().toISOString().split('T')[0]
    const session = data.sessionId || 'attendance'
    return `attendance_${date}_${session}.pdf`
  }

  /**
   * Extract date components for folder structure
   * @param {string} dateString - ISO date string
   * @returns {Object} Year, month, day components
   */
  extractDateComponents(dateString) {
    const date = new Date(dateString)
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    }
  }
}

export { PDFService }
export default PDFService