/**
 * DriveSyncModal Component
 * Modal for setting up and managing Google Drive CSV synchronization
 */

import { useState, useEffect } from 'react'

export default function DriveSyncModal({ isOpen, onClose, driveService }) {
  const [clientId, setClientId] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [domains, setDomains] = useState({})

  useEffect(() => {
    if (driveService) {
      const config = driveService.config
      setClientId(config.clientId || '')
      setIsAuthenticated(driveService.isAuthenticated())
      setIsSetupComplete(!!config.domains && Object.keys(config.domains).length > 0)
      setDomains(config.domains || {})
    }
  }, [driveService, isOpen])

  const handleSaveConfig = async () => {
    if (!clientId) {
      setStatus('error')
      setMessage('Client ID is required')
      return
    }

    setStatus('loading')
    setMessage('Saving configuration...')

    try {
      driveService.saveConfig({ clientId })
      setStatus('success')
      setMessage('Configuration saved successfully')
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const handleSignIn = async () => {
    setStatus('loading')
    setMessage('Signing in with Google...')

    try {
      const result = await driveService.signIn()
      if (result.success) {
        setIsAuthenticated(true)
        setStatus('success')
        setMessage('Signed in successfully')
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const handleSignOut = async () => {
    setStatus('loading')
    setMessage('Signing out...')

    try {
      await driveService.signOut()
      setIsAuthenticated(false)
      setStatus('success')
      setMessage('Signed out successfully')
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const handleSetupDrive = async () => {
    setStatus('loading')
    setMessage('Creating Drive folder structure...')

    try {
      const result = await driveService.setupDriveFolders()
      if (result.success) {
        setIsSetupComplete(true)
        setDomains(result.domains)
        setStatus('success')
        setMessage('Drive folders created successfully')
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const handleSyncFromDrive = async () => {
    setStatus('loading')
    setMessage('Syncing from Google Drive...')

    try {
      const result = await driveService.fetchFromDrive()
      if (result.success) {
        setStatus('success')
        setMessage(`Synced ${Object.keys(result.data).length} tables from Drive`)
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const handleSyncToDrive = async () => {
    setStatus('loading')
    setMessage('Syncing to Google Drive...')

    try {
      const tables = Object.keys(driveService.config.domains || {}).reduce((acc, domainKey) => {
        const domain = driveService.config.domains[domainKey]
        return [...acc, ...(domain.tables || [])]
      }, [])

      let successCount = 0
      for (const table of tables) {
        const result = await driveService.syncTableToDrive(table)
        if (result.success) successCount++
      }

      setStatus('success')
      setMessage(`Synced ${successCount}/${tables.length} tables to Drive`)
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📁 Google Drive CSV Sync</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Status Message */}
          {status !== 'idle' && (
            <div className={`mb-4 p-3 rounded ${status === 'error' ? 'bg-red-100 text-red-700' : status === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {message}
            </div>
          )}

          {/* Step 1: OAuth Configuration */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Step 1: OAuth 2.0 Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="your-client-id.apps.googleusercontent.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your Client ID from{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={status === 'loading'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save Configuration
              </button>
            </div>
          </div>

          {/* Step 2: Authentication */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Step 2: Authentication</h3>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-green-600 font-medium">✓ Signed In</span>
                  <button
                    onClick={handleSignOut}
                    disabled={status === 'loading'}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={status === 'loading' || !clientId}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>

          {/* Step 3: Drive Setup */}
          {isAuthenticated && !isSetupComplete && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Step 3: Setup Drive Folders</h3>
              <p className="text-sm text-gray-600 mb-3">
                This will create the domain folder structure in your Google Drive:
              </p>
              <ul className="text-sm text-gray-600 mb-3 list-disc list-inside">
                <li>Vision Loop - Laxmi Enterprise (root)</li>
                <li>01_Laxmi_HR_Master (employees, contractors, rates, users)</li>
                <li>02_Laxmi_Attendance_Fleet (vehicles, sessions, trips)</li>
                <li>03_Laxmi_Payroll_Accounting (payroll, settlements)</li>
              </ul>
              <button
                onClick={handleSetupDrive}
                disabled={status === 'loading'}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Create Drive Folders
              </button>
            </div>
          )}

          {/* Step 4: Sync Operations */}
          {isAuthenticated && isSetupComplete && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Step 4: Sync Operations</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSyncFromDrive}
                  disabled={status === 'loading'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  📥 Pull from Drive
                </button>
                <button
                  onClick={handleSyncToDrive}
                  disabled={status === 'loading'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  📤 Push to Drive
                </button>
              </div>

              {/* Domain Links */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Domain Folders:</h4>
                <div className="space-y-2">
                  {Object.entries(domains).map(([key, domain]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {domain.icon} {domain.label}
                      </span>
                      {domain.folderId && (
                        <button
                          onClick={() => driveService.openDomainFolder(key)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Open in Drive
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Auto Sync Toggle */}
          {isAuthenticated && isSetupComplete && (
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={driveService?.config?.autoSync}
                  onChange={(e) => driveService?.saveConfig({ autoSync: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Enable automatic sync (every 20s)</span>
              </label>
            </div>
          )}

          {/* Stats */}
          {isAuthenticated && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-semibold mb-2">Status:</h4>
              <div className="text-sm text-gray-600">
                <p>Last Sync: {driveService?.config?.lastSyncTime || 'Never'}</p>
                <p>Local Storage: {Object.keys(driveService?.memoryStore || {}).length} tables</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
