/**
 * Google Drive API Client & Sync Operations
 * Handles authentication, folder hierarchy, and media push/pull
 */

import { createLogger } from '../utils/logger.js'
import { serializeToCSV } from '../utils/csvUtils.js'
import { DRIVE_DOMAINS, DEFAULT_SEED_DATA } from './driveConstants.js'

const logger = createLogger('DriveApiClient')

export class DriveApiClient {
  constructor(service) {
    this.service = service
    this.gapiClient = null
    this.tokenClient = null
    this.accessToken = null
  }

  async initializeGoogleAPI() {
    if (typeof gapi === 'undefined') {
      throw new Error('Google API client not loaded. Include the gapi script in your HTML.')
    }

    try {
      await new Promise((resolve) => gapi.load('client:auth2', resolve))
      await gapi.client.init({
        clientId: this.service.config.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
      })
      this.gapiClient = gapi.client
      logger.info('Google API client initialized successfully')
      return true
    } catch (err) {
      logger.logError(err, { operation: 'initializeGoogleAPI' })
      throw err
    }
  }

  async signIn() {
    if (!this.gapiClient) {
      await this.initializeGoogleAPI()
    }

    try {
      const GoogleAuth = gapi.auth2.getAuthInstance()
      const user = await GoogleAuth.signIn()
      this.accessToken = user.getAuthResponse().access_token
      logger.info('User signed in successfully')
      return { success: true, user: user.getBasicProfile() }
    } catch (err) {
      logger.logError(err, { operation: 'signIn' })
      return { success: false, message: err.message }
    }
  }

  async signOut() {
    if (!this.gapiClient) {
      return { success: true }
    }

    try {
      const GoogleAuth = gapi.auth2.getAuthInstance()
      await GoogleAuth.signOut()
      this.accessToken = null
      logger.info('User signed out successfully')
      return { success: true }
    } catch (err) {
      logger.logError(err, { operation: 'signOut' })
      return { success: false, message: err.message }
    }
  }

  isAuthenticated() {
    if (!this.gapiClient) return false
    const GoogleAuth = gapi.auth2.getAuthInstance()
    return GoogleAuth && GoogleAuth.isSignedIn.get()
  }

  async setupDriveFolders() {
    if (!this.isAuthenticated()) {
      return { success: false, message: 'Not authenticated with Google' }
    }

    try {
      const rootFolderId = await this.createFolder('Vision Loop - Laxmi Enterprise')
      const domains = {}
      for (const [key, domain] of Object.entries(DRIVE_DOMAINS)) {
        const folderId = await this.createFolder(domain.name, rootFolderId)
        domains[key] = {
          ...domain,
          folderId,
          configured: true
        }

        for (const table of domain.tables) {
          const csvContent = serializeToCSV(DEFAULT_SEED_DATA[table] || [])
          await this.createFile(`${table}.csv`, csvContent, folderId, 'text/csv')
        }
      }

      this.service.saveConfig({ domains, rootFolderId })
      logger.info('Drive folder structure created successfully')
      return { success: true, domains, rootFolderId }
    } catch (err) {
      logger.logError(err, { operation: 'setupDriveFolders' })
      return { success: false, message: err.message }
    }
  }

  async createFolder(name, parentId = null) {
    try {
      const metadata = { name, mimeType: 'application/vnd.google-apps.folder' }
      if (parentId) metadata.parents = [parentId]
      const response = await gapi.client.drive.files.create({ resource: metadata })
      return response.result.id
    } catch (err) {
      logger.logError(err, { operation: 'createFolder', name })
      throw err
    }
  }

  async createFile(name, content, parentId = null, mimeType = 'text/csv') {
    try {
      const metadata = { name, mimeType }
      if (parentId) metadata.parents = [parentId]

      const boundary = 'foo_bar_baz'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelim = `\r\n--${boundary}--`

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n` +
        content +
        closeDelim

      const response = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
        body: multipartRequestBody
      })

      return response.result.id
    } catch (err) {
      logger.logError(err, { operation: 'createFile', name })
      throw err
    }
  }

  async getFileContent(fileId) {
    try {
      const response = await gapi.client.drive.files.get({ fileId, alt: 'media' })
      return response.body
    } catch (err) {
      logger.logError(err, { operation: 'getFileContent', fileId })
      throw err
    }
  }

  async updateFileContent(fileId, content) {
    try {
      const response = await gapi.client.drive.files.update({
        fileId,
        media: { mimeType: 'text/csv', body: content }
      })
      return response.result
    } catch (err) {
      logger.logError(err, { operation: 'updateFileContent', fileId })
      throw err
    }
  }

  async listFilesInFolder(folderId) {
    try {
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, modifiedTime)'
      })
      return response.result.files
    } catch (err) {
      logger.logError(err, { operation: 'listFilesInFolder', folderId })
      throw err
    }
  }

  async findFileByName(folderId, fileName) {
    try {
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
        fields: 'files(id, name, modifiedTime)'
      })
      const files = response.result.files
      return files && files.length > 0 ? files[0] : null
    } catch (err) {
      logger.logError(err, { operation: 'findFileByName', folderId, fileName })
      throw err
    }
  }
}
