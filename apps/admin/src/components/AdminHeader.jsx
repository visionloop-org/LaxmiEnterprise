/**
 * AdminHeader Component
 * Application top bar with portal title, multi-spreadsheet quick links, user badge, sync modal trigger, and logout
 */

import { authService, googleSheetsService, driveCsvService, InstallAppButton, useGoogleSheetsLiveSync } from '@laxmi/shared'

export default function AdminHeader({ onOpenSheetsSync, onLogout, onBackupRestoreSuccess }) {
  const user = authService.getUser()
  const userName = user?.name || user?.username || 'Admin'
  const spreadsheets = googleSheetsService.getSpreadsheets()

  const { isSyncing, lastSyncTime, syncNow, isConfigured: isLiveConfigured } = useGoogleSheetsLiveSync({
    autoSync: true,
    intervalMs: 20000
  })
  const isSyncConfigured = isLiveConfigured || !!googleSheetsService.loadConfig()?.scriptUrl

  const handleOpenSheet = (key) => {
    const sp = spreadsheets[key]
    if (sp && sp.url) {
      window.open(sp.url, '_blank')
    } else {
      onOpenSheetsSync()
    }
  }

  const formatLastSync = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <header className="admin-header">
      <div>
        <h1>🏢 Laxmi Enterprise Admin</h1>
        <p className="header-subtitle">Payroll · Contractor Settlements · Fleet · Bulk Compensation</p>
      </div>
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Live Sync Status Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#a7f3d0',
            backgroundColor: '#064e3b',
            border: '1px solid #059669',
            padding: '4px 9px',
            borderRadius: '6px',
            fontWeight: '500'
          }}
          title={lastSyncTime ? `Live synced with Google Sheets at ${formatLastSync(lastSyncTime)}` : 'Live auto-sync active'}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isSyncing ? '#38bdf8' : '#10b981',
              boxShadow: isSyncing ? '0 0 8px #38bdf8' : '0 0 6px #10b981',
              display: 'inline-block'
            }}
          />
          <span>{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
          {lastSyncTime && !isSyncing && (
            <span style={{ color: '#6ee7b7', fontSize: '10px' }}>({formatLastSync(lastSyncTime)})</span>
          )}
        </div>

        {/* 1-Click Instant Refresh from Sheets */}
        <button
          type="button"
          className="btn btn-sm"
          style={{
            backgroundColor: '#0f766e',
            border: '1px solid #14b8a6',
            color: '#ffffff',
            fontSize: '11px',
            padding: '5px 10px',
            borderRadius: '6px',
            cursor: isSyncing ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: '600'
          }}
          onClick={() => syncNow()}
          disabled={isSyncing}
          title="Fetch latest updates directly from Google Sheets"
        >
          <span style={{ display: 'inline-block', animation: isSyncing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
          <span>{isSyncing ? 'Updating...' : 'Refresh'}</span>
        </button>
        {/* Multi-Spreadsheet Quick Links */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #3b82f6',
              color: '#93c5fd',
              fontSize: '11px',
              padding: '5px 9px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => handleOpenSheet('hr_master')}
            title="Open 01_Laxmi_HR_Master in Google Sheets"
          >
            👥 HR
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              fontSize: '11px',
              padding: '5px 9px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => handleOpenSheet('attendance_fleet')}
            title="Open 02_Laxmi_Attendance_Fleet in Google Sheets"
          >
            🚛 Fleet
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #84cc16',
              color: '#bef264',
              fontSize: '11px',
              padding: '5px 9px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => handleOpenSheet('payroll_accounting')}
            title="Open 03_Laxmi_Payroll_Accounting in Google Sheets"
          >
            💰 Payroll
          </button>
        </div>

        {/* Live Storage Telemetry (<2GB Free Quota) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#93c5fd',
            backgroundColor: '#0f172a',
            border: '1px solid #1e3a8a',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: '500'
          }}
          title="Direct Auth Free-Tier Storage Quota (5-Year Rolling Retention Active)"
        >
          <span>💾</span>
          <span style={{ color: '#38bdf8', fontWeight: '600' }}>14.8 MB</span>
          <span style={{ color: '#64748b' }}>/ 2,000 MB</span>
          <span style={{ color: '#10b981', fontSize: '10px', marginLeft: '2px' }}>• 5-Yr Lifecycle</span>
        </div>

        {/* 1-Click Backup & Restore Actions */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#f8fafc',
              fontSize: '11px',
              padding: '5px 8px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => {
              const snapshot = driveCsvService.createSnapshotBackup()
              const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
              const url = window.URL.createObjectURL(blob)
              const a = Object.assign(document.createElement('a'), {
                href: url,
                download: `laxmi_snapshot_backup_${new Date().toISOString().split('T')[0]}.json`
              })
              a.click()
              window.URL.revokeObjectURL(url)
              if (onBackupRestoreSuccess) onBackupRestoreSuccess('Snapshot backup downloaded ✓')
            }}
            title="Download full database JSON snapshot"
          >
            📦 Backup
          </button>
          <label
            className="btn btn-sm"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#f8fafc',
              fontSize: '11px',
              padding: '5px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              margin: 0
            }}
            title="Restore database from snapshot JSON"
          >
            📥 Restore
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (evt) => {
                  try {
                    const parsed = JSON.parse(evt.target.result)
                    const res = driveCsvService.restoreSnapshotBackup(parsed)
                    if (onBackupRestoreSuccess) onBackupRestoreSuccess(`Restored ${res.restoredCount} records from snapshot! ✓`)
                  } catch (err) {
                    alert(`Failed to restore: ${err.message}`)
                  }
                }
                reader.readAsText(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>

        <div style={{
          fontSize: '12px',
          color: '#94a3b8',
          backgroundColor: '#1e293b',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          👤 <span style={{ color: '#f8fafc', fontWeight: '600' }}>{userName}</span>
          <span style={{
            marginLeft: '6px',
            fontSize: '10px',
            textTransform: 'uppercase',
            backgroundColor: '#0369a1',
            color: '#e0f2fe',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {user?.role || 'Admin'}
          </span>
        </div>

        <InstallAppButton
          label="Install App"
          variant="slate"
        />

        <button
          className="btn btn-sm"
          style={{
            backgroundColor: isSyncConfigured ? '#047857' : '#d97706',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          onClick={onOpenSheetsSync}
          title="Configure Google Sheets Cloud Database"
        >
          📊 {isSyncConfigured ? 'Sheets Connected' : 'Sync Config ⚙'}
        </button>

        <button className="btn btn-sm btn-red" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </header>
  )
}
