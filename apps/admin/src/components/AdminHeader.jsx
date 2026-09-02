/**
 * AdminHeader Component
 * Application top bar with portal title, user badge, Google Sheets sync trigger, and logout
 */

import { authService, googleSheetsService } from '@laxmi/shared'

export default function AdminHeader({ onOpenSheetsSync, onLogout }) {
  const user = authService.getUser()
  const userName = user?.name || user?.username || 'Admin'
  const isSyncConfigured = !!googleSheetsService.loadConfig()?.scriptUrl

  return (
    <header className="admin-header">
      <div>
        <h1>🏢 Laxmi Enterprise Admin</h1>
        <p className="header-subtitle">Payroll · Contractor Settlements · Fleet · Bulk Compensation</p>
      </div>
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        <button
          className="btn btn-sm"
          style={{
            backgroundColor: isSyncConfigured ? '#047857' : '#d97706',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
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
