import { useState, useMemo, useRef } from 'react'
import {
  useEmployees,
  useVehicles,
  useApproveEmployee,
  useRejectEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useBulkUpdateCompensation,
  useTrips
} from '@laxmi/shared'
import { LoadingSpinner } from '@laxmi/shared'

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
  const base = getEffectiveBase(emp)
  const extraH = emp.extraHours || 0
  const extra = extraH * (DEFAULT_RATES[emp.category] || 500) / 8
  const inc = emp.incentive || 0
  return { base, extraH, extra, inc, total: base + extra + inc }
}

function calcContractorPayroll(employees) {
  if (!employees.length) return 0
  let total = 0
  employees.forEach(emp => {
    if (emp.attendance === 'arrived' || emp.attendance === 'on_time') {
      total += calcPayroll(emp).total
    }
  })
  return total
}

function InlineError({ message }) {
  if (!message) return null
  return (
    <div className="error-message" style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
      {message}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active:           { label: 'Active',          cls: 'badge-success' },
  pending_approval: { label: 'Pending',         cls: 'badge-warning' },
  rejected:         { label: 'Rejected',        cls: 'badge-error'   },
  inactive:         { label: 'Inactive',        cls: 'badge-neutral' },
  returned:         { label: 'Returned',        cls: 'badge-neutral' },
}

function StatusBadge({ status }) {
  const b = STATUS_MAP[status] || { label: status, cls: 'badge-neutral' }
  return <span className={`badge ${b.cls}`}>{b.label}</span>
}

// ─── ChevronIcon ──────────────────────────────────────────────────────────────
function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Admin Dashboard Component ───────────────────────────────────────────────
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

  // ─── Toolbar state ─────────────────────────────────────────────────────────
  const [empSearch,  setEmpSearch]  = useState('')
  const [empCat,     setEmpCat]     = useState('All')
  const [empPage,    setEmpPage]    = useState(1)

  const [vehSearch,  setVehSearch]  = useState('')
  const [vehPage,    setVehPage]    = useState(1)

  const [toast, setToast]  = useState('')
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  // ─── Collapsible panel state ───────────────────────────────────────────────
  const [showSessionPanel,  setShowSessionPanel]  = useState(false)
  const [showContractor,    setShowContractor]    = useState(true)
  const [showTrips,         setShowTrips]         = useState(false)

  // ─── Session unlock ───────────────────────────────────────────────────────
  const [sessionId,      setSessionId]      = useState('')
  const [unlocking,      setUnlocking]      = useState(false)

  // ─── Edit modal ───────────────────────────────────────────────────────────
  const [editingEmp, setEditingEmp] = useState(null)

  // ─── Bulk state ───────────────────────────────────────────────────────────
  const [bulkOpen,       setBulkOpen]       = useState(false)
  const [bulkDraft,      setBulkDraft]      = useState({})
  const [bulkSearch,     setBulkSearch]     = useState('')
  const [bulkCat,        setBulkCat]        = useState('All')
  const [batchCat,       setBatchCat]       = useState('All')
  const [batchBase,      setBatchBase]      = useState('')
  const [batchExtra,     setBatchExtra]     = useState('')
  const [batchIncentive, setBatchIncentive] = useState('')

  // ─── Derived stats ─────────────────────────────────────────────────────────
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

  // ─── Contractor aggregation ────────────────────────────────────────────────
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

  // ─── Filtered employees ───────────────────────────────────────────────────
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

  // ─── Filtered vehicles ───────────────────────────────────────────────────
  const filteredVehs = useMemo(() => {
    return !vehSearch ? vehicles : vehicles.filter(v =>
      v.vehicleNumber?.toLowerCase().includes(vehSearch.toLowerCase()) ||
      v.type?.toLowerCase().includes(vehSearch.toLowerCase())
    )
  }, [vehicles, vehSearch])

  const vehTotalPages = Math.max(1, Math.ceil(filteredVehs.length / PAGE_SIZE))
  const pagedVehs     = filteredVehs.slice((vehPage - 1) * PAGE_SIZE, vehPage * PAGE_SIZE)

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    if (!window.confirm(`Approve employee ${id}?`)) return
    try {
      await approveMut.mutateAsync(id)
      showToast(`Employee ${id} approved ✓`)
    } catch (err) { alert(err.message || 'Approval failed.') }
  }

  const handleReject = async (id) => {
    if (!window.confirm(`Reject employee ${id}? This is irreversible.`)) return
    try {
      await rejectMut.mutateAsync(id)
      showToast(`Employee ${id} rejected ✓`)
    } catch (err) { alert(err.message || 'Rejection failed.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete employee ${id}? This is irreversible.`)) return
    try {
      await deleteMut.mutateAsync(id)
      showToast(`Employee ${id} deleted ✓`)
    } catch (err) { alert(err.message || 'Deletion failed.') }
  }

  const openEditModal = (emp) => {
    setEditingEmp({ ...emp })
  }

  const saveEdit = async () => {
    if (!editingEmp) return
    try {
      await updateMut.mutateAsync({
        employeeId: editingEmp.id,
        updates: {
          name: editingEmp.name,
          category: editingEmp.category,
          contractor: editingEmp.contractor,
          baseRate: editingEmp.baseRate !== '' ? parseFloat(editingEmp.baseRate) : null,
          extraHours: editingEmp.extraHours !== '' ? parseFloat(editingEmp.extraHours) : 0,
          incentive: editingEmp.incentive !== '' ? parseFloat(editingEmp.incentive) : 0,
        }
      })
      setEditingEmp(null)
      showToast(`Employee ${editingEmp.id} updated ✓`)
    } catch (err) { alert(err.message || 'Update failed.') }
  }

  const openBulkEditor = () => {
    setBulkDraft(prev => {
      const draft = {}
      employees.forEach(emp => {
        draft[emp.id] = {
          baseRate: emp.baseRate || '',
          extraHours: emp.extraHours || '',
          incentive: emp.incentive || '',
          modified: false
        }
      })
      return draft
    })
    setBulkOpen(true)
  }

  const applyBatch = () => {
    const base  = batchBase !== '' ? parseFloat(batchBase) : null
    const extra = batchExtra !== '' ? parseFloat(batchExtra) : null
    const inc   = batchIncentive !== '' ? parseFloat(batchIncentive) : null

    setBulkDraft(prev => {
      const next = { ...prev }
      employees.forEach(emp => {
        if (batchCat !== 'All' && emp.category !== batchCat) return
        next[emp.id] = {
          baseRate:   base !== null ? base : next[emp.id].baseRate,
          extraHours: extra !== null ? extra : next[emp.id].extraHours,
          incentive:  inc !== null ? inc : next[emp.id].incentive,
          modified: true
        }
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
        showToast(`Imported ${count} rows from CSV ✓`)
        return next
      })
    }
    reader.readAsText(file)
  }

  const handleUnlockSession = async () => {
    if (!sessionId) return
    setUnlocking(true)
    try {
      const { restSessionService } = await import('@laxmi/shared')
      await restSessionService.unlockSession(sessionId)
      showToast(`Session ${sessionId} unlocked ✓`)
      setSessionId('')
    } catch (err) {
      alert(err.message || 'Unlock failed.')
    } finally {
      setUnlocking(false)
    }
  }

  if (loadEmp || loadVeh) return <LoadingSpinner text="Loading dashboard…" />

  return (
    <div className="admin-dashboard">
      {/* ── Top Nav ── */}
      <header className="admin-header">
        <div>
          <h1>🏢 Laxmi Enterprise Admin</h1>
          <p className="header-subtitle">Payroll · Contractor Settlements · Fleet · Bulk Compensation</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={openBulkEditor}>⚡ Bulk Wage Editor</button>
          <button className="btn-danger"  onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{totalEmps}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{presentCount}</div>
          <div className="stat-label">Present Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalVehs}</div>
          <div className="stat-label">Total Vehicles</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{inUseVehs}</div>
          <div className="stat-label">In Use</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{grandTotal.toLocaleString()}</div>
          <div className="stat-label">Daily Payroll</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{pendingEmps}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && <div className="toast">{toast}</div>}

      {/* ── Main Content Grid ── */}
      <div className="content-grid">
        {/* ── Left Column: Employees ── */}
        <div className="main-column">
          <div className="panel">
            <div className="panel-header">
              <h2>👥 Employees</h2>
              <div className="toolbar">
                <input
                  placeholder="Search by name, ID, contractor..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                />
                <select value={empCat} onChange={e => setEmpCat(e.target.value)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="panel-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Contractor</th>
                    <th>Status</th>
                    <th>Attendance</th>
                    <th>Base Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmps.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td>{emp.name}</td>
                      <td>{emp.category}</td>
                      <td>{emp.contractor || '-'}</td>
                      <td><StatusBadge status={emp.status} /></td>
                      <td><StatusBadge status={emp.attendance} /></td>
                      <td>₹{getEffectiveBase(emp)}</td>
                      <td>
                        <button onClick={() => openEditModal(emp)}>✏️</button>
                        {emp.status === 'pending_approval' && (
                          <>
                            <button onClick={() => handleApprove(emp.id)}>✅</button>
                            <button onClick={() => handleReject(emp.id)}>❌</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(emp.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pagination">
                <button onClick={() => setEmpPage(Math.max(1, empPage - 1))} disabled={empPage === 1}>← Prev</button>
                <span>Page {empPage} of {empTotalPages}</span>
                <button onClick={() => setEmpPage(Math.min(empTotalPages, empPage + 1))} disabled={empPage === empTotalPages}>Next →</button>
              </div>
            </div>
          </div>

          {/* ── Vehicles Panel ── */}
          <div className="panel">
            <div className="panel-header">
              <h2>🚗 Vehicles</h2>
              <div className="toolbar">
                <input
                  placeholder="Search by number, type..."
                  value={vehSearch}
                  onChange={e => setVehSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="panel-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle Number</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Assigned Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedVehs.map(veh => (
                    <tr key={veh.vehicleNumber}>
                      <td>{veh.vehicleNumber}</td>
                      <td>{veh.type}</td>
                      <td><StatusBadge status={veh.status} /></td>
                      <td>{veh.assignedDriver || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pagination">
                <button onClick={() => setVehPage(Math.max(1, vehPage - 1))} disabled={vehPage === 1}>← Prev</button>
                <span>Page {vehPage} of {vehTotalPages}</span>
                <button onClick={() => setVehPage(Math.min(vehTotalPages, vehPage + 1))} disabled={vehPage === vehTotalPages}>Next →</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Details ── */}
        <div className="side-column">
          {/* ── Contractor Summary ── */}
          <div className="panel collapsible">
            <div className="panel-header clickable" onClick={() => setShowContractor(!showContractor)}>
              <h2>🏗️ Contractor Settlements</h2>
              <ChevronDown />
            </div>
            {showContractor && (
              <div className="panel-body">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>Contractor</th>
                      <th>Workers</th>
                      <th>Present</th>
                      <th>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractorSummary.map(c => (
                      <tr key={c.name}>
                        <td>{c.name}</td>
                        <td>{c.workers}</td>
                        <td>{c.present}</td>
                        <td>₹{c.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Session Unlock ── */}
          <div className="panel collapsible">
            <div className="panel-header clickable" onClick={() => setShowSessionPanel(!showSessionPanel)}>
              <h2>🔓 Session Unlock</h2>
              <ChevronDown />
            </div>
            {showSessionPanel && (
              <div className="panel-body">
                <input
                  placeholder="Session ID"
                  value={sessionId}
                  onChange={e => setSessionId(e.target.value)}
                />
                <button onClick={handleUnlockSession} disabled={unlocking}>
                  {unlocking ? 'Unlocking...' : 'Unlock Session'}
                </button>
              </div>
            )}
          </div>

          {/* ── Trips Panel ── */}
          <div className="panel collapsible">
            <div className="panel-header clickable" onClick={() => setShowTrips(!showTrips)}>
              <h2>🛣️ Trips</h2>
              <ChevronDown />
            </div>
            {showTrips && (
              <div className="panel-body">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Vehicle</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.slice(0, 5).map(trip => (
                      <tr key={trip.id}>
                        <td>{trip.id}</td>
                        <td>{trip.vehicleNumber}</td>
                        <td><StatusBadge status={trip.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingEmp && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Employee: {editingEmp.id}</h3>
            <label>Name:
              <input value={editingEmp.name} onChange={e => setEditingEmp({...editingEmp, name: e.target.value})} />
            </label>
            <label>Category:
              <select value={editingEmp.category} onChange={e => setEditingEmp({...editingEmp, category: e.target.value})}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </label>
            <label>Contractor:
              <input value={editingEmp.contractor || ''} onChange={e => setEditingEmp({...editingEmp, contractor: e.target.value})} />
            </label>
            <label>Base Rate:
              <input type="number" value={editingEmp.baseRate || ''} onChange={e => setEditingEmp({...editingEmp, baseRate: e.target.value})} />
            </label>
            <label>Extra Hours:
              <input type="number" value={editingEmp.extraHours || ''} onChange={e => setEditingEmp({...editingEmp, extraHours: e.target.value})} />
            </label>
            <label>Incentive:
              <input type="number" value={editingEmp.incentive || ''} onChange={e => setEditingEmp({...editingEmp, incentive: e.target.value})} />
            </label>
            <div className="modal-actions">
              <button onClick={saveEdit}>Save</button>
              <button onClick={() => setEditingEmp(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Editor Modal ── */}
      {bulkOpen && (
        <div className="modal-overlay bulk-modal">
          <div className="modal bulk-modal-content">
            <h3>⚡ Bulk Wage Editor</h3>
            
            <div className="bulk-toolbar">
              <input placeholder="Search employees..." value={bulkSearch} onChange={e => setBulkSearch(e.target.value)} />
              <select value={bulkCat} onChange={e => setBulkCat(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="batch-preset">
              <h4>Batch Preset</h4>
              <select value={batchCat} onChange={e => setBatchCat(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input placeholder="Base Rate" type="number" value={batchBase} onChange={e => setBatchBase(e.target.value)} />
              <input placeholder="Extra Hours" type="number" value={batchExtra} onChange={e => setBatchExtra(e.target.value)} />
              <input placeholder="Incentive" type="number" value={batchIncentive} onChange={e => setBatchIncentive(e.target.value)} />
              <button onClick={applyBatch}>Apply</button>
            </div>

            <div className="bulk-csv">
              <h4>Import CSV</h4>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvUpload} />
              <button onClick={() => fileInputRef.current?.click()}>Select CSV</button>
            </div>

            <div className="bulk-grid">
              {employees
                .filter(emp => {
                  const catOk = bulkCat === 'All' || emp.category === bulkCat
                  const q = bulkSearch.toLowerCase()
                  const searchOk = !q || emp.name?.toLowerCase().includes(q) || emp.id?.toLowerCase().includes(q)
                  return catOk && searchOk
                })
                .map(emp => (
                  <div key={emp.id} className={`bulk-row ${bulkDraft[emp.id]?.modified ? 'modified' : ''}`}>
                    <div className="bulk-row-header">
                      <strong>{emp.id}</strong>
                      <span>{emp.name}</span>
                    </div>
                    <input
                      placeholder="Base"
                      type="number"
                      value={bulkDraft[emp.id]?.baseRate || ''}
                      onChange={e => setBulkDraft(prev => ({
                        ...prev,
                        [emp.id]: { ...prev[emp.id], baseRate: e.target.value, modified: true }
                      }))}
                    />
                    <input
                      placeholder="Extra"
                      type="number"
                      value={bulkDraft[emp.id]?.extraHours || ''}
                      onChange={e => setBulkDraft(prev => ({
                        ...prev,
                        [emp.id]: { ...prev[emp.id], extraHours: e.target.value, modified: true }
                      }))}
                    />
                    <input
                      placeholder="Incentive"
                      type="number"
                      value={bulkDraft[emp.id]?.incentive || ''}
                      onChange={e => setBulkDraft(prev => ({
                        ...prev,
                        [emp.id]: { ...prev[emp.id], incentive: e.target.value, modified: true }
                      }))}
                    />
                  </div>
                ))}
            </div>

            <div className="modal-actions">
              <button onClick={saveBulk}>Save All Changes</button>
              <button onClick={() => setBulkOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard