import { useState, useMemo, useRef } from 'react'
import {
  authService,
  restSessionService,
  ErrorBoundary,
  LoadingSpinner,
  useEmployees,
  useVehicles,
  useApproveEmployee,
  useRejectEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useBulkUpdateCompensation,
  useTrips
} from '@laxmi/shared'
import GoogleSheetsSyncModal from './components/GoogleSheetsSyncModal'

import './App.css'

const DEFAULT_RATES = {
  Drivers: 800, 'Chalan Men': 650, Workers: 500, Office: 750, 'Extra Labour': 450
}
const CATEGORIES = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
const PAGE_SIZE = 25

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEffectiveBase(emp) {
  return emp.baseRate !== null && emp.baseRate !== undefined
    ? emp.baseRate
    : (DEFAULT_RATES[emp.category] || 500)
}

function calcPayroll(emp) {
  const base   = getEffectiveBase(emp)
  const extraH = emp.extraHours || 0
  const extra  = extraH * (base / 8) * 1.5
  const inc    = emp.incentive || 0
  return { base, extraH, extra, inc, total: base + extra + inc }
}

function exportToCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(obj =>
    Object.values(obj).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
  const url  = window.URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  window.URL.revokeObjectURL(url)
}

// ─── InlineError ──────────────────────────────────────────────────────────────
function InlineError({ message }) {
  if (!message) return null
  return (
    <div className="login-error" role="alert">
      <svg className="login-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLoginSuccess }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.target)
    try {
      await authService.loginWithCredentials(fd.get('username'), fd.get('password'))
      onLoginSuccess()
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏢</div>
        <h2>Laxmi Enterprise</h2>
        <p className="login-desc">Admin &amp; Payroll Portal</p>
        <form onSubmit={handleSubmit}>
          <input name="username" placeholder="Username" required disabled={loading} />
          <input name="password" type="password" placeholder="Password" required disabled={loading} />
          <InlineError message={error} />
          <button type="submit" disabled={loading} className={loading ? 'loading' : ''}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="login-hint">Demo: admin / password123</p>
      </div>
    </div>
  )
}

// ─── ChevronIcon ──────────────────────────────────────────────────────────────
function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active:           { label: 'Active',          cls: 'badge-success' },
  pending_approval: { label: 'Pending',         cls: 'badge-warning' },
  rejected:         { label: 'Rejected',        cls: 'badge-error'   },
  inactive:         { label: 'Inactive',        cls: 'badge-neutral' },
  available:        { label: 'Available',       cls: 'badge-success' },
  in_use:           { label: 'In Use',          cls: 'badge-warning' },
  maintenance:      { label: 'Maintenance',     cls: 'badge-error'   },
  dispatched:       { label: 'Dispatched',      cls: 'badge-blue'    },
  reached_location: { label: 'At Site',         cls: 'badge-warning' },
  delivered:        { label: 'Delivered',       cls: 'badge-success' },
  returned:         { label: 'Returned',        cls: 'badge-neutral' },
}
function StatusBadge({ status }) {
  const b = STATUS_MAP[status] || { label: status || '—', cls: 'badge-neutral' }
  return <span className={`badge ${b.cls}`}>{b.label}</span>
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const { data: employees = [], isLoading: loadEmp }  = useEmployees()
  const { data: vehicles  = [], isLoading: loadVeh }  = useVehicles()
  const { data: trips     = [] }                       = useTrips()

  const approveMut  = useApproveEmployee()
  const rejectMut   = useRejectEmployee()
  const updateMut   = useUpdateEmployee()
  const deleteMut   = useDeleteEmployee()
  const bulkMut     = useBulkUpdateCompensation()

  const fileInputRef = useRef(null)

  // ── Toolbar state ──────────────────────────────────────────────────────────
  const [empSearch,  setEmpSearch]  = useState('')
  const [empCat,     setEmpCat]     = useState('All')
  const [empPage,    setEmpPage]    = useState(1)

  const [vehSearch,  setVehSearch]  = useState('')
  const [vehPage,    setVehPage]    = useState(1)

  const [toast, setToast]  = useState(null)
  const showToast = (msg, type = 'success') => {
    setToast(typeof msg === 'object' ? msg : { message: msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Collapsible panel state ───────────────────────────────────────────────
  const [showSessionPanel,  setShowSessionPanel]  = useState(false)
  const [showContractor,    setShowContractor]    = useState(true)
  const [showTrips,         setShowTrips]         = useState(false)

  // ── Session unlock ────────────────────────────────────────────────────────
  const [sessionId,      setSessionId]      = useState('')
  const [unlocking,      setUnlocking]      = useState(false)
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false)

  // ── Edit modal ────────────────────────────────────────────────────────────
  const [editingEmp, setEditingEmp] = useState(null)

  // ── Bulk state ────────────────────────────────────────────────────────────
  const [bulkOpen,       setBulkOpen]       = useState(false)
  const [bulkDraft,      setBulkDraft]      = useState({})
  const [bulkSearch,     setBulkSearch]     = useState('')
  const [bulkCat,        setBulkCat]        = useState('All')
  const [batchCat,       setBatchCat]       = useState('All')
  const [batchBase,      setBatchBase]      = useState('')
  const [batchExtra,     setBatchExtra]     = useState('')
  const [batchIncentive, setBatchIncentive] = useState('')

  // ─── Derived stats ──────────────────────────────────────────────────────
  const pendingEmps  = employees.filter(e => e.status === 'pending_approval')
  const totalEmps    = employees.length
  const totalVehs    = vehicles.length
  const presentCount = employees.filter(e => e.attendance === 'arrived' || e.attendance === 'on_time').length
  const inUseVehs    = vehicles.filter(v => v.status === 'in_use').length

  let totalBase = 0, totalOvertime = 0, totalIncentives = 0
  employees.forEach(emp => {
    if (emp.attendance === 'arrived' || emp.attendance === 'on_time') {
      const p = calcPayroll(emp)
      totalBase      += p.base
      totalOvertime  += p.extra
      totalIncentives += p.inc
    }
  })
  const grandTotal = totalBase + totalOvertime + totalIncentives

  // ─── Contractor aggregation ─────────────────────────────────────────────
  const contractorSummary = useMemo(() => {
    const map = {}
    employees.forEach(emp => {
      const key = (emp.contractor?.trim()) || 'In-House / Direct'
      if (!map[key]) map[key] = { name: key, workers: 0, present: 0, base: 0, extraH: 0, extra: 0, inc: 0, total: 0 }
      map[key].workers++
      if (emp.attendance === 'arrived' || emp.attendance === 'on_time') {
        const p = calcPayroll(emp)
        map[key].present++
        map[key].base   += p.base
        map[key].extraH += p.extraH
        map[key].extra  += p.extra
        map[key].inc    += p.inc
        map[key].total  += p.total
      }
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [employees])

  // ─── Filtered employees ─────────────────────────────────────────────────
  const filteredEmps = useMemo(() => {
    return employees.filter(emp => {
      const catMatch = empCat === 'All' || emp.category === empCat
      const q = empSearch.toLowerCase()
      const searchMatch = !q ||
        emp.name?.toLowerCase().includes(q) ||
        emp.id?.toLowerCase().includes(q) ||
        emp.contractor?.toLowerCase().includes(q)
      return catMatch && searchMatch
    })
  }, [employees, empSearch, empCat])

  const empTotalPages = Math.max(1, Math.ceil(filteredEmps.length / PAGE_SIZE))
  const pagedEmps     = filteredEmps.slice((empPage - 1) * PAGE_SIZE, empPage * PAGE_SIZE)

  // ─── Filtered vehicles ──────────────────────────────────────────────────
  const filteredVehs = useMemo(() => {
    const q = vehSearch.toLowerCase()
    return !q ? vehicles : vehicles.filter(v =>
      v.number?.toLowerCase().includes(q) || v.type?.toLowerCase().includes(q) || v.status?.toLowerCase().includes(q)
    )
  }, [vehicles, vehSearch])
  const vehTotalPages = Math.max(1, Math.ceil(filteredVehs.length / PAGE_SIZE))
  const pagedVehs     = filteredVehs.slice((vehPage - 1) * PAGE_SIZE, vehPage * PAGE_SIZE)

  // ─── Action handlers ────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try { await approveMut.mutateAsync(id); showToast('Employee approved ✓') }
    catch (err) { alert(err.message || 'Approval failed.') }
  }
  const handleReject = async (id) => {
    try { await rejectMut.mutateAsync(id); showToast('Employee request rejected.') }
    catch (err) { alert(err.message || 'Rejection failed.') }
  }
  const handleDelete = async (id) => {
    if (!window.confirm(`Delete employee ${id}? This is irreversible.`)) return
    try { await deleteMut.mutateAsync(id); showToast('Employee deleted.') }
    catch (err) { alert(err.message || 'Delete failed.') }
  }
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingEmp) return
    try {
      await updateMut.mutateAsync({
        employeeId: editingEmp.id,
        updateData: {
          name:      editingEmp.name,
          category:  editingEmp.category,
          status:    editingEmp.status,
          contractor: editingEmp.contractor,
          baseRate:  editingEmp.baseRate   ? parseFloat(editingEmp.baseRate)   : null,
          extraHours: editingEmp.extraHours ? parseFloat(editingEmp.extraHours) : 0,
          incentive:  editingEmp.incentive  ? parseFloat(editingEmp.incentive)  : 0,
        }
      })
      setEditingEmp(null)
      showToast('Employee updated ✓')
    } catch (err) { alert(err.message || 'Update failed.') }
  }

  const handleUnlockSession = async (e) => {
    e.preventDefault()
    if (!sessionId) return
    setUnlocking(true)
    try {
      await restSessionService.unlockSession(sessionId)
      showToast(`Session "${sessionId}" reset & unlocked — supervisors can now edit.`, 'success')
      setSessionId('')
    } catch (err) {
      showToast(err.message || 'Unlock failed.', 'error')
    }
    finally { setUnlocking(false) }
  }

  // ─── Bulk editor ────────────────────────────────────────────────────────
  const openBulkEditor = () => {
    const draft = {}
    employees.forEach(emp => {
      draft[emp.id] = {
        baseRate:   getEffectiveBase(emp),
        extraHours: emp.extraHours || 0,
        incentive:  emp.incentive  || 0,
        modified:   false,
      }
    })
    setBulkDraft(draft)
    setBulkOpen(true)
  }

  const setDraftField = (id, field, raw) => {
    const val = raw === '' ? '' : (parseFloat(raw) || 0)
    setBulkDraft(prev => ({ ...prev, [id]: { ...prev[id], [field]: val, modified: true } }))
  }

  const applyBatchPreset = () => {
    setBulkDraft(prev => {
      const next = { ...prev }
      employees.forEach(emp => {
        if (batchCat !== 'All' && emp.category !== batchCat) return
        const cur = { ...(next[emp.id] || { baseRate: getEffectiveBase(emp), extraHours: 0, incentive: 0 }) }
        let changed = false
        if (batchBase      !== '') { cur.baseRate   = parseFloat(batchBase)      || 0; changed = true }
        if (batchExtra     !== '') { cur.extraHours = parseFloat(batchExtra)     || 0; changed = true }
        if (batchIncentive !== '') { cur.incentive  = parseFloat(batchIncentive) || 0; changed = true }
        if (changed) cur.modified = true
        next[emp.id] = cur
      })
      return next
    })
    showToast(`Preset applied to "${batchCat}". Review then click Save.`)
  }

  const saveBulk = async () => {
    const items = Object.entries(bulkDraft)
      .filter(([, r]) => r.modified)
      .map(([id, r]) => ({
        employeeId: id,
        baseRate:   r.baseRate   !== '' ? parseFloat(r.baseRate)   : 0,
        extraHours: r.extraHours !== '' ? parseFloat(r.extraHours) : 0,
        incentive:  r.incentive  !== '' ? parseFloat(r.incentive)  : 0,
      }))
    if (!items.length) { setBulkOpen(false); return }
    try {
      await bulkMut.mutateAsync(items)
      setBulkOpen(false)
      showToast(`Saved compensation for ${items.length} employee(s) ✓`)
    } catch (err) { alert(err.message || 'Bulk save failed.') }
  }

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim())
      if (lines.length <= 1) { alert('CSV is empty or missing data.'); return }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,'').toLowerCase())
      const idIdx   = headers.findIndex(h => h.includes('id')      || h.includes('employee'))
      const bIdx    = headers.findIndex(h => h.includes('base')    || h.includes('rate'))
      const eIdx    = headers.findIndex(h => h.includes('extra')   || h.includes('hour'))
      const iIdx    = headers.findIndex(h => h.includes('incentive')|| h.includes('bonus'))
      if (idIdx === -1) { alert('No Employee ID column found (expected: EmployeeID).'); return }
      let count = 0
      setBulkDraft(prev => {
        const next = { ...prev }
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g,''))
          const id   = cols[idIdx]; if (!id) continue
          const cur  = next[id] || {}
          const base  = bIdx !== -1 && cols[bIdx] ? parseFloat(cols[bIdx]) : cur.baseRate
          const extra = eIdx !== -1 && cols[eIdx] ? parseFloat(cols[eIdx]) : cur.extraHours
          const inc   = iIdx !== -1 && cols[iIdx] ? parseFloat(cols[iIdx]) : cur.incentive
          next[id] = {
            baseRate:   isNaN(base)  ? (cur.baseRate  || 500) : base,
            extraHours: isNaN(extra) ? (cur.extraHours|| 0)   : extra,
            incentive:  isNaN(inc)   ? (cur.incentive || 0)   : inc,
            modified: true
          }
          count++
        }
        return next
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast(`Parsed ${count} records from CSV. Review and save.`)
    }
    reader.readAsText(file)
  }

  // ─── CSV exports ────────────────────────────────────────────────────────
  const exportPayroll = () => {
    exportToCSV(filteredEmps.map(emp => {
      const p = calcPayroll(emp)
      return {
        ID: emp.id, Name: emp.name, Category: emp.category,
        Contractor: emp.contractor || 'In-House',
        Status: emp.status,
        Attendance: emp.attendance || 'Pending',
        BaseRate: p.base, ExtraHours: p.extraH,
        ExtraDutyPay: p.extra.toFixed(2), IncentiveBonus: p.inc.toFixed(2),
        TotalPay: p.total.toFixed(2)
      }
    }), `payroll_${new Date().toISOString().split('T')[0]}.csv`)
  }
  const exportContractor = () => {
    exportToCSV(contractorSummary.map(c => ({
      Contractor: c.name, Workers: c.workers, Present: c.present,
      BasePay: c.base.toFixed(2), ExtraHours: c.extraH,
      OvertimePay: c.extra.toFixed(2), IncentiveBonus: c.inc.toFixed(2),
      NetPayable: c.total.toFixed(2)
    })), `contractor_${new Date().toISOString().split('T')[0]}.csv`)
  }
  const exportVehicles = () => {
    exportToCSV(vehicles.map(v => ({ Number: v.number, Type: v.type, Status: v.status })),
      `vehicles_${new Date().toISOString().split('T')[0]}.csv`)
  }
  const downloadTemplate = () => {
    exportToCSV(employees.map(emp => ({
      EmployeeID: emp.id, Name: emp.name, Category: emp.category,
      Contractor: emp.contractor || 'In-House',
      BaseRate: getEffectiveBase(emp),
      ExtraDutyHours: emp.extraHours || 0,
      IncentiveBonus: emp.incentive  || 0,
    })), 'compensation_template.csv')
  }

  const modifiedCount = Object.values(bulkDraft).filter(r => r.modified).length

  const bulkFiltered = employees.filter(emp => {
    const catOk = bulkCat === 'All' || emp.category === bulkCat
    const q = bulkSearch.toLowerCase()
    const searchOk = !q || emp.name?.toLowerCase().includes(q) || emp.id?.toLowerCase().includes(q)
    return catOk && searchOk
  })

  if (loadEmp || loadVeh) return <LoadingSpinner text="Loading dashboard…" />

  return (
    <div className="admin-dashboard">

      {/* ── Top Nav ── */}
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
            👤 <span style={{ color: '#f8fafc', fontWeight: '600' }}>{authService.getUser()?.name || authService.getUser()?.username || 'Ruhil Jaiswal'}</span>
            <span style={{
              marginLeft: '6px',
              padding: '2px 6px',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700'
            }}>
              {(authService.getUser()?.role || 'Developer').toUpperCase()}
            </span>
          </div>
          <button className="btn-primary" style={{ background: '#059669', borderColor: '#047857' }} onClick={() => setIsSheetsModalOpen(true)}>📊 Google Sheets Sync</button>
          <button className="btn-primary" onClick={openBulkEditor}>⚡ Bulk Wage Editor</button>
          <button className="btn-danger"  onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-body">

        {/* ── Toast ── */}
        {toast && (
          <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : ''}`} style={toast.type === 'error' ? { background: '#ef4444', color: '#ffffff' } : {}}>
            {toast.type === 'error' ? '❌' : '✅'} {toast.message || toast.msg || toast}
          </div>
        )}

        {/* ── Pending Approvals Banner ── */}
        {pendingEmps.length > 0 && (
          <div className="alert-banner alert-warning">
            <h3>⚠️ {pendingEmps.length} Employee Request(s) Awaiting Approval</h3>
            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Category</th><th>Contractor</th><th>Requested By</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEmps.map(emp => (
                    <tr key={emp.id}>
                      <td className="text-mono font-bold">{emp.id}</td>
                      <td>{emp.name}</td>
                      <td><StatusBadge status="active" /><span style={{marginLeft:4}}>{emp.category}</span></td>
                      <td>{emp.contractor || '—'}</td>
                      <td>{emp.requestedBy || 'Supervisor'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-green" onClick={() => handleApprove(emp.id)}>✓ Approve</button>
                          <button className="btn btn-sm btn-red"   onClick={() => handleReject(emp.id)}>✗ Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── KPI Stats ── */}
        <div className="stats-grid">
          <div className="stat-card stat-card--total">
            <h3>Total Workforce</h3>
            <p className="stat-value">{totalEmps}</p>
          </div>
          <div className="stat-card stat-card--present">
            <h3>Present Today</h3>
            <p className="stat-value">{presentCount}</p>
          </div>
          <div className="stat-card stat-card--wages">
            <h3>Regular Wages</h3>
            <p className="stat-value">₹{totalBase.toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card stat-card--overtime">
            <h3>Overtime (1.5×)</h3>
            <p className="stat-value">₹{Math.round(totalOvertime).toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card stat-card--incentive">
            <h3>Incentives</h3>
            <p className="stat-value">₹{Math.round(totalIncentives).toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card stat-card--total-pay">
            <h3>Net Payroll</h3>
            <p className="stat-value">₹{Math.round(grandTotal).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* ── Secondary stat row: Vehicles ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ flex: '1 1 160px', '--accent': '#0ea5e9' }}>
            <h3>Total Vehicles</h3>
            <p className="stat-value" style={{ color: '#0ea5e9' }}>{totalVehs}</p>
          </div>
          <div className="stat-card" style={{ flex: '1 1 160px', '--accent': '#f59e0b' }}>
            <h3>Fleet In Use</h3>
            <p className="stat-value" style={{ color: '#f59e0b' }}>{inUseVehs}</p>
          </div>
          <div className="stat-card" style={{ flex: '1 1 160px', '--accent': '#10b981' }}>
            <h3>Active Trips</h3>
            <p className="stat-value" style={{ color: '#10b981' }}>{trips.length}</p>
          </div>
          <div className="stat-card" style={{ flex: '1 1 160px', '--accent': '#6366f1' }}>
            <h3>Pending Approvals</h3>
            <p className="stat-value" style={{ color: pendingEmps.length > 0 ? '#d97706' : '#6366f1' }}>
              {pendingEmps.length}
            </p>
          </div>
        </div>

        {/* ── Contractor Settlement Panel ── */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">🏢 Contractor Payroll &amp; Settlement</h2>
              <p className="panel-subtitle">Daily wages, overtime &amp; incentives grouped by contractor</p>
            </div>
            <div className="panel-actions">
              <button className="export-button" onClick={exportContractor}>↓ Export CSV</button>
              <button
                className={`panel-toggle ${showContractor ? 'open' : ''}`}
                onClick={() => setShowContractor(v => !v)}
              >
                {showContractor ? 'Collapse' : 'Expand'} <ChevronDown />
              </button>
            </div>
          </div>
          {showContractor && (
            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contractor</th>
                    <th>Workers</th>
                    <th>Present</th>
                    <th>Base Pay</th>
                    <th>Overtime (1.5×)</th>
                    <th>Incentives</th>
                    <th>Net Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {contractorSummary.length === 0 ? (
                    <tr><td colSpan="7" className="empty-row">No contractor data — attendance not yet recorded today.</td></tr>
                  ) : (
                    contractorSummary.map(c => (
                      <tr key={c.name}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.workers}</td>
                        <td><span className="badge badge-success">{c.present} present</span></td>
                        <td>₹{c.base.toLocaleString('en-IN')}</td>
                        <td>₹{Math.round(c.extra).toLocaleString('en-IN')} <span className="text-muted">({c.extraH}h)</span></td>
                        <td>₹{c.inc.toLocaleString('en-IN')}</td>
                        <td><strong className="text-success">₹{Math.round(c.total).toLocaleString('en-IN')}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Employee & Vehicle Tables ── */}
        <div className="content-grid">

          {/* Employee Table */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">👷 Employee Master &amp; Compensation</h2>
                <p className="panel-subtitle">{filteredEmps.length} of {totalEmps} employees</p>
              </div>
              <div className="panel-actions">
                <button className="btn btn-sm btn-indigo" onClick={openBulkEditor}>⚡ Bulk Edit</button>
                <button className="export-button" onClick={exportPayroll}>↓ Export CSV</button>
              </div>
            </div>

            <div className="toolbar">
              <input
                className="search-input"
                type="text"
                placeholder="Search name, ID or contractor…"
                value={empSearch}
                onChange={e => { setEmpSearch(e.target.value); setEmpPage(1) }}
              />
              <select
                className="select-filter"
                value={empCat}
                onChange={e => { setEmpCat(e.target.value); setEmpPage(1) }}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="toolbar-spacer" />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {pagedEmps.length} of {filteredEmps.length} shown
              </span>
            </div>

            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Contractor</th>
                    <th>Base Rate</th>
                    <th>Extra (h)</th>
                    <th>Incentive</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmps.length === 0 ? (
                    <tr><td colSpan="9" className="empty-row">No employees match your search.</td></tr>
                  ) : (
                    pagedEmps.map(emp => {
                      const base = getEffectiveBase(emp)
                      return (
                        <tr key={emp.id}>
                          <td className="text-mono font-bold">{emp.id}</td>
                          <td>{emp.name}</td>
                          <td><span className="badge badge-neutral">{emp.category}</span></td>
                          <td className="text-muted">{emp.contractor || 'In-House'}</td>
                          <td>₹{base}</td>
                          <td>{emp.extraHours || 0}h</td>
                          <td>₹{emp.incentive || 0}</td>
                          <td><StatusBadge status={emp.status} /></td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-xs btn-blue" onClick={() => setEditingEmp(emp)}>Edit</button>
                              <button className="btn btn-xs btn-red"  onClick={() => handleDelete(emp.id)}>Del</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {empTotalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setEmpPage(p => Math.max(1, p - 1))}        disabled={empPage === 1}>← Prev</button>
                <span>Page {empPage} / {empTotalPages}</span>
                <button onClick={() => setEmpPage(p => Math.min(empTotalPages, p + 1))} disabled={empPage === empTotalPages}>Next →</button>
              </div>
            )}
          </div>

          {/* Vehicle Table */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">🚛 Fleet Status</h2>
                <p className="panel-subtitle">{inUseVehs} in use · {totalVehs - inUseVehs} available</p>
              </div>
              <div className="panel-actions">
                <button className="export-button" onClick={exportVehicles}>↓ Export CSV</button>
              </div>
            </div>

            <div className="toolbar">
              <input
                className="search-input"
                type="text"
                placeholder="Search vehicle number or type…"
                value={vehSearch}
                onChange={e => { setVehSearch(e.target.value); setVehPage(1) }}
              />
              <span className="toolbar-spacer" />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {filteredVehs.length} records
              </span>
            </div>

            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Number</th><th>Type</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {pagedVehs.length === 0 ? (
                    <tr><td colSpan="3" className="empty-row">No vehicles found.</td></tr>
                  ) : (
                    pagedVehs.map(v => (
                      <tr key={v.id || v.number}>
                        <td className="font-bold">{v.number}</td>
                        <td>{v.type}</td>
                        <td><StatusBadge status={v.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {vehTotalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setVehPage(p => Math.max(1, p - 1))}         disabled={vehPage === 1}>← Prev</button>
                <span>Page {vehPage} / {vehTotalPages}</span>
                <button onClick={() => setVehPage(p => Math.min(vehTotalPages, p + 1))} disabled={vehPage === vehTotalPages}>Next →</button>
              </div>
            )}

            {/* Vehicle Breakdown mini-stats */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['available','in_use','maintenance'].map(s => {
                const count = vehicles.filter(v => v.status === s).length
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StatusBadge status={s} />
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Vehicle Trips — Collapsible ── */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">🚚 Active Vehicle Trips {trips.length > 0 && <span className="badge badge-blue" style={{marginLeft:6}}>{trips.length}</span>}</h2>
              <p className="panel-subtitle">Dispatch → site arrival → delivery → receiver confirmation</p>
            </div>
            <button
              className={`panel-toggle ${showTrips ? 'open' : ''}`}
              onClick={() => setShowTrips(v => !v)}
            >
              {showTrips ? 'Collapse' : 'Show Trips'} <ChevronDown />
            </button>
          </div>
          {showTrips && (
            <div className="table-scroll-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trip ID</th><th>Vehicle</th><th>Driver</th>
                    <th>Destination</th><th>Product</th><th>Status</th>
                    <th>Received By</th><th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.length === 0 ? (
                    <tr><td colSpan="8" className="empty-row">No active trips recorded today.</td></tr>
                  ) : (
                    trips.slice(0, 20).map(t => (
                      <tr key={t.id || t._id}>
                        <td className="text-mono">{(t.id || t._id || '').slice(-8)}</td>
                        <td className="font-bold">{t.vehicleNumber}</td>
                        <td>{t.driverName || '—'}</td>
                        <td>{t.destinationLocation}</td>
                        <td className="text-muted">{t.productDetails || 'Aggregates'}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>
                          {t.receiverName
                            ? <span className="font-bold text-success">{t.receiverName}</span>
                            : <span className="text-muted">—</span>
                          }
                        </td>
                        <td className="text-muted">
                          {t.dispatchedAt || t.createdAt
                            ? new Date(t.dispatchedAt || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Admin Tools — Collapsible ── */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">🔧 Admin Tools</h2>
              <p className="panel-subtitle">Reset finalized sessions &amp; other admin-exclusive actions</p>
            </div>
            <button
              className={`panel-toggle ${showSessionPanel ? 'open' : ''}`}
              onClick={() => setShowSessionPanel(v => !v)}
            >
              {showSessionPanel ? 'Collapse' : 'Expand'} <ChevronDown />
            </button>
          </div>
          {showSessionPanel && (
            <div className="panel-body">
              <div className="alert-banner alert-info" style={{ marginBottom: 0 }}>
                <h3>🔓 Reset a Finalized Attendance Session</h3>
                <p>
                  If edits are required after a supervisor has finalized a daily session, enter the
                  Session ID to reopen it for editing. This action is logged.
                </p>
                <form className="session-unlock-form" onSubmit={handleUnlockSession}>
                  <input
                    type="text"
                    placeholder="Session ID, e.g. SES-2026-08-16-Shift-A"
                    value={sessionId}
                    onChange={e => setSessionId(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-sky"
                    disabled={unlocking}
                  >
                    {unlocking ? 'Unlocking…' : '🔓 Reset Session'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

      </div>{/* end dashboard-body */}


      {/* ═══════════════════════════════════════════════════════════════════
          BULK COMPENSATION & INCENTIVE EDITOR MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {bulkOpen && (
        <div className="modal-overlay">
          <div className="modal-sheet">

            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2>⚡ Bulk Compensation &amp; Incentive Editor</h2>
                <p>Adjust Base Rate (₹), Extra Duty Hours, and Incentive Bonus (₹) for all employees</p>
              </div>
              <button className="modal-close" onClick={() => setBulkOpen(false)}>✕</button>
            </div>

            {/* Batch Preset & CSV Row */}
            <div className="modal-toolbar">
              <div className="modal-toolbar-left">
                <span className="batch-label">Batch preset:</span>
                <select
                  className="select-filter"
                  value={batchCat}
                  onChange={e => setBatchCat(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="batch-input" type="number" placeholder="Base Rate (₹)"   value={batchBase}      onChange={e => setBatchBase(e.target.value)} />
                <input className="batch-input" type="number" placeholder="Extra (h)"        value={batchExtra}     onChange={e => setBatchExtra(e.target.value)} />
                <input className="batch-input" type="number" placeholder="Incentive (₹)"   value={batchIncentive} onChange={e => setBatchIncentive(e.target.value)} />
                <button className="btn btn-indigo btn-sm" onClick={applyBatchPreset}>Apply Preset</button>
              </div>
              <div className="modal-toolbar-right">
                <button className="btn btn-sky btn-sm"   onClick={downloadTemplate}>📥 Download Template</button>
                <label  className="btn btn-green btn-sm" style={{ cursor: 'pointer' }}>
                  📤 Upload CSV
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Filter bar */}
            <div className="modal-filter-bar">
              <div className="flex items-center gap-2">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Filter employees…"
                  value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                />
                <select
                  className="select-filter"
                  value={bulkCat}
                  onChange={e => setBulkCat(e.target.value)}
                >
                  <option value="All">All ({employees.length})</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                {modifiedCount > 0
                  ? <span className="modified-counter">⚠️ {modifiedCount} employee(s) modified</span>
                  : <span className="no-changes-counter">No changes yet</span>
                }
              </div>
            </div>

            {/* Editable table */}
            <div className="modal-body">
              <table className="data-table sticky-header">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Category</th><th>Contractor</th>
                    <th>Base Rate (₹)</th><th>Extra Duty (h)</th><th>Incentive (₹)</th>
                    <th>Est. Day Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkFiltered.map(emp => {
                    const row    = bulkDraft[emp.id] || { baseRate: getEffectiveBase(emp), extraHours: 0, incentive: 0 }
                    const base   = parseFloat(row.baseRate)   || 0
                    const extraH = parseFloat(row.extraHours) || 0
                    const inc    = parseFloat(row.incentive)  || 0
                    const total  = base + extraH * (base / 8) * 1.5 + inc
                    return (
                      <tr key={emp.id} className={row.modified ? 'row-modified' : ''}>
                        <td className="text-mono font-bold">{emp.id}</td>
                        <td>{emp.name}</td>
                        <td><span className="badge badge-neutral">{emp.category}</span></td>
                        <td className="text-muted">{emp.contractor || 'In-House'}</td>
                        <td>
                          <input
                            className="cell-input"
                            type="number" min="0"
                            value={row.baseRate}
                            onChange={e => setDraftField(emp.id, 'baseRate', e.target.value)}
                            style={{ fontWeight: 700 }}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            type="number" min="0" step="0.5"
                            value={row.extraHours}
                            onChange={e => setDraftField(emp.id, 'extraHours', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            type="number" min="0"
                            value={row.incentive}
                            onChange={e => setDraftField(emp.id, 'incentive', e.target.value)}
                            style={{ color: '#7c3aed' }}
                          />
                        </td>
                        <td>
                          <strong className="text-success">₹{Math.round(total).toLocaleString('en-IN')}</strong>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <span className="modal-footer-tip">
                Tip: Use "Apply Preset" for category-wide changes, or edit cells individually.
              </span>
              <div className="modal-footer-actions">
                <button className="btn btn-gray" onClick={() => setBulkOpen(false)}>Cancel</button>
                <button
                  className="btn btn-green"
                  onClick={saveBulk}
                  disabled={bulkMut.isPending}
                >
                  {bulkMut.isPending ? 'Saving…' : `💾 Save Changes (${modifiedCount})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════════
          INDIVIDUAL EMPLOYEE EDIT MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {editingEmp && (
        <div className="modal-overlay">
          <div className="edit-modal-sheet">
            <h3>✏️ Edit Employee — {editingEmp.name}</h3>
            <form onSubmit={handleSaveEdit}>

              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  type="text"
                  value={editingEmp.name}
                  onChange={e => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={editingEmp.category}
                  onChange={e => setEditingEmp({ ...editingEmp, category: e.target.value })}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Contractor / Agency</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Jai Bhavani Labour (or leave blank for In-House)"
                  value={editingEmp.contractor || ''}
                  onChange={e => setEditingEmp({ ...editingEmp, contractor: e.target.value })}
                />
              </div>

              <div className="form-row" style={{ marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Base Rate (₹)</label>
                  <input
                    className="form-control"
                    type="number" min="0"
                    value={editingEmp.baseRate ?? getEffectiveBase(editingEmp)}
                    onChange={e => setEditingEmp({ ...editingEmp, baseRate: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Extra Duty (h)</label>
                  <input
                    className="form-control"
                    type="number" min="0" step="0.5"
                    value={editingEmp.extraHours ?? 0}
                    onChange={e => setEditingEmp({ ...editingEmp, extraHours: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Incentive (₹)</label>
                  <input
                    className="form-control"
                    type="number" min="0"
                    value={editingEmp.incentive ?? 0}
                    onChange={e => setEditingEmp({ ...editingEmp, incentive: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={editingEmp.status}
                  onChange={e => setEditingEmp({ ...editingEmp, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Live preview */}
              {(() => {
                const b = editingEmp.baseRate ? parseFloat(editingEmp.baseRate) : getEffectiveBase(editingEmp)
                const h = parseFloat(editingEmp.extraHours) || 0
                const i = parseFloat(editingEmp.incentive)  || 0
                const t = b + h * (b / 8) * 1.5 + i
                return (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 12px', marginBottom: 12, fontSize: '0.82rem', color: '#15803d' }}>
                    <strong>Est. Daily Pay:</strong> ₹{b} base + ₹{Math.round(h * (b/8) * 1.5)} overtime + ₹{i} incentive = <strong>₹{Math.round(t)}</strong>
                  </div>
                )
              })()}

              <div className="form-actions">
                <button type="submit" className="btn btn-blue" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn btn-gray" onClick={() => setEditingEmp(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Google Sheets Sync Modal ── */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
// QueryClientProvider and ErrorBoundary are provided by main.jsx
function App() {
  const [authed, setAuthed] = useState(() => authService.isAuthenticated())
  const logout = () => { authService.logout(); setAuthed(false) }

  return (
    authed
      ? <AdminDashboard onLogout={logout} />
      : <LoginPage onLoginSuccess={() => setAuthed(true)} />
  )
}

export default App
