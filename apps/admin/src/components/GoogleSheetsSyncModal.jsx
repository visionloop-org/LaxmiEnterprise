import React, { useState, useEffect } from 'react'
import { googleSheetsService } from '@laxmi/shared'

export default function GoogleSheetsSyncModal({ isOpen, onClose }) {
  const [scriptUrl, setScriptUrl] = useState('')
  const [sheetId, setSheetId] = useState('')
  const [stats, setStats] = useState(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (isOpen) {
      const cfg = googleSheetsService.loadConfig()
      setScriptUrl(cfg.scriptUrl || '')
      setSheetId(cfg.sheetId || '')
      setStats(googleSheetsService.getStats())
      setMessage(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSaveConfig = () => {
    googleSheetsService.saveConfig({
      scriptUrl: scriptUrl.trim(),
      sheetId: sheetId.trim()
    })
    setStats(googleSheetsService.getStats())
    setMessage({ type: 'success', text: 'Configuration saved successfully!' })
  }

  const handleTestConnection = async () => {
    handleSaveConfig()
    setIsTesting(true)
    setMessage(null)
    try {
      if (!scriptUrl.trim()) {
        throw new Error('Please enter your Google Apps Script Web App URL first.')
      }
      const res = await fetch(`${scriptUrl.trim()}?action=ping`)
      const data = await res.json()
      if (data.status === 'success') {
        setMessage({ type: 'success', text: `Connected! ${data.sheetName ? `Spreadsheet: ${data.sheetName}` : 'Google Sheets API is active.'}` })
      } else {
        throw new Error(data.message || 'Failed to ping Google Sheets.')
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Connection test failed: ${err.message}` })
    } finally {
      setIsTesting(false)
      setStats(googleSheetsService.getStats())
    }
  }

  const handlePullFromSheets = async () => {
    handleSaveConfig()
    setIsSyncing(true)
    setMessage(null)
    try {
      const res = await googleSheetsService.fetchFromGoogleSheets()
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Pulled latest data from Google Sheets!' })
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to pull from Google Sheets.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSyncing(false)
      setStats(googleSheetsService.getStats())
    }
  }

  const handlePushToSheets = async () => {
    handleSaveConfig()
    setIsPushing(true)
    setMessage(null)
    try {
      const res = await googleSheetsService.pushAllToGoogleSheets()
      if (res.status === 'success' || res.success) {
        setMessage({ type: 'success', text: 'All local attendance, employee & fleet records uploaded to Google Sheets!' })
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to push to Google Sheets.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsPushing(false)
      setStats(googleSheetsService.getStats())
    }
  }

  const isConnected = !!stats?.googleSheets?.configured

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        color: '#f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        animation: 'modalSlideIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📊
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Google Sheets Data Store</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Serverless Cloud Storage &amp; Live Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#1e293b',
            borderRadius: '10px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
              }} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>
                {isConnected ? 'Google Sheets Web App Connected' : 'Offline / Standalone Local Storage'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Last sync: {stats?.googleSheets?.lastSync ? new Date(stats.googleSheets.lastSync).toLocaleTimeString() : 'Never'}
            </span>
          </div>

          {/* Quick Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Employees</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8' }}>{stats?.localStore?.total_employees ?? 0}</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Vehicles</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#34d399' }}>{stats?.localStore?.total_vehicles ?? 0}</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Attendance Records</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#fbbf24' }}>{stats?.localStore?.total_records ?? 0}</div>
            </div>
          </div>

          {/* URL Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Google Apps Script Web App URL:
            </label>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
              Deployed from your Google Sheet (Extensions &gt; Apps Script &gt; Deploy as Web App).
            </p>
          </div>

          {/* Notification Message */}
          {message && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '12px',
              backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: message.type === 'success' ? '#34d399' : '#f87171'
            }}>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {isTesting ? 'Testing...' : '⚡ Test Connection'}
              </button>
              <button
                onClick={handleSaveConfig}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💾 Save Config
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handlePullFromSheets}
                disabled={isSyncing}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isSyncing ? 'Pulling...' : '⬇️ Pull From Google Sheets'}
              </button>
              <button
                onClick={handlePushToSheets}
                disabled={isPushing}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isPushing ? 'Uploading...' : '⬆️ Push To Google Sheets'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#090d16'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Zero backend server • Stored in Google Sheets • GitHub Pages Ready
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
