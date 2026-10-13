import React, { useState, useEffect } from 'react'
import { googleSheetsService, MULTI_SPREADSHEET_DOMAINS } from '../services/googleSheetsService.js'

export default function GoogleSheetsSyncModal({ isOpen, onClose }) {
  const [scriptUrl, setScriptUrl] = useState('')
  const [sheetId, setSheetId] = useState('')
  const [stats, setStats] = useState(null)
  const [spreadsheets, setSpreadsheets] = useState({})
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [message, setMessage] = useState(null)

  const refreshState = () => {
    const cfg = googleSheetsService.loadConfig()
    setScriptUrl(cfg.scriptUrl || '')
    setSheetId(cfg.sheetId || '')
    setStats(googleSheetsService.getStats())
    setSpreadsheets(googleSheetsService.getSpreadsheets())
  }

  useEffect(() => {
    if (isOpen) {
      refreshState()
      setMessage(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSaveConfig = () => {
    googleSheetsService.saveConfig({
      scriptUrl: scriptUrl.trim(),
      sheetId: sheetId.trim()
    })
    refreshState()
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
        // Also fetch multi-sheet metadata
        await googleSheetsService.fetchMultiSpreadsheetMeta()
        refreshState()
        setMessage({
          type: 'success',
          text: `Connected! Multi-Spreadsheet API is online.${data.multiSheet ? ' (3 Domain Spreadsheets active)' : ''}`
        })
      } else {
        throw new Error(data.message || 'Failed to ping Google Sheets.')
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Connection test failed: ${err.message}` })
    } finally {
      setIsTesting(false)
      refreshState()
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
      refreshState()
    }
  }

  const handlePushToSheets = async () => {
    handleSaveConfig()
    setIsPushing(true)
    setMessage(null)
    try {
      const res = await googleSheetsService.pushAllToGoogleSheets()
      if (res.status === 'success' || res.success) {
        setMessage({ type: 'success', text: 'All workforce, fleet & payroll records synchronized to Google Sheets!' })
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to push to Google Sheets.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsPushing(false)
      refreshState()
    }
  }

  const handleSetupMultiSheets = async () => {
    handleSaveConfig()
    setIsProvisioning(true)
    setMessage(null)
    try {
      const res = await googleSheetsService.setupMultiSpreadsheets()
      if (res.success) {
        setMessage({ type: 'success', text: '🎉 Successfully provisioned 3 domain spreadsheets in Google Drive!' })
      } else {
        setMessage({ type: 'error', text: res.message || 'Provisioning failed.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsProvisioning(false)
      refreshState()
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
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        color: '#f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
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
              width: '38px',
              height: '38px',
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
              <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0 }}>Google Sheets Multi-Database Store</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                100% Serverless • 3 Domain Spreadsheets • Concurrency Safe
              </p>
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

        {/* Scrollable Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Status banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#1e293b',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid #334155'
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
                {isConnected ? 'Google Apps Script Gateway Active' : 'Offline / LocalStorage Fallback'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Last sync: {stats?.googleSheets?.lastSync ? new Date(stats.googleSheets.lastSync).toLocaleTimeString() : 'Never'}
            </span>
          </div>

          {/* Quick Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Employees</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#38bdf8' }}>{stats?.localStore?.total_employees ?? 0}</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Vehicles</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#34d399' }}>{stats?.localStore?.total_vehicles ?? 0}</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Records</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#fbbf24' }}>{stats?.localStore?.total_records ?? 0}</div>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Trips</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#f97316' }}>{stats?.localStore?.total_trips ?? 0}</div>
            </div>
          </div>

          {/* 3 Domain Spreadsheets Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: 0 }}>
                Domain Spreadsheets in Google Drive
              </h3>
              <button
                onClick={handleSetupMultiSheets}
                disabled={isProvisioning || !scriptUrl}
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isProvisioning || !scriptUrl ? 'not-allowed' : 'pointer',
                  opacity: isProvisioning || !scriptUrl ? 0.6 : 1
                }}
                title="Automatically create or link the 3 spreadsheets in Google Drive"
              >
                {isProvisioning ? 'Provisioning...' : '⚡ Provision Multi-Sheets in Drive'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(MULTI_SPREADSHEET_DOMAINS).map(([domKey, domInfo]) => {
                const sheetMeta = spreadsheets[domKey] || {}
                const hasUrl = !!sheetMeta.url
                const directUrl = sheetMeta.url || (sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null)
                const exportXlsx = sheetMeta.exportXlsxUrl || (sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx` : null)

                return (
                  <div
                    key={domKey}
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0' }}>
                      <span style={{ fontSize: '20px' }}>{domInfo.icon}</span>
                      <div style={{ minWidth: '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                            {domInfo.name}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: hasUrl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                            color: hasUrl ? '#34d399' : '#94a3b8'
                          }}>
                            {hasUrl ? 'Synced' : 'Ready'}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {domInfo.description}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {directUrl ? (
                        <a
                          href={directUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Open Sheet ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Unlinked</span>
                      )}
                      {exportXlsx && (
                        <a
                          href={exportXlsx}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#334155',
                            color: '#cbd5e1',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textDecoration: 'none'
                          }}
                          title="Download Excel backup"
                        >
                          XLSX ⬇
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* URL Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Google Apps Script Web App Gateway URL:
            </label>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0b1329',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
              The serverless gateway routes attendance, fleet, and payroll calls to their respective Google Sheets automatically.
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
                {isSyncing ? 'Pulling...' : '⬇️ Pull From Sheets'}
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
                {isPushing ? 'Uploading...' : '⬆️ Push To Sheets'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#090d16'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Zero backend server • Multi-Spreadsheet Sharding • GitHub Pages Ready
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
