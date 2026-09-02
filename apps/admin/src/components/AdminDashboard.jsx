/**
 * AdminDashboard Component
 * Assembles modular subcomponents for payroll, fleet, contractor, and employee management
 */

import { useState, useMemo, useRef } from 'react'
import {
  restSessionService,
  LoadingSpinner,
  GoogleSheetsSyncModal,
  useEmployees,
  useVehicles,
  useApproveEmployee,
  useRejectEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useBulkUpdateCompensation,
  useTrips
} from '@laxmi/shared'

import AdminHeader from './AdminHeader.jsx'
import PendingApprovalsBanner from './PendingApprovalsBanner.jsx'
import StatsOverview from './StatsOverview.jsx'
import ContractorPayrollPanel from './ContractorPayrollPanel.jsx'
import EmployeeManagementTable from './EmployeeManagementTable.jsx'
import FleetManagementTable from './FleetManagementTable.jsx'
import SessionUnlockPanel from './SessionUnlockPanel.jsx'
import BulkCompensationModal from './BulkCompensationModal.jsx'
import EditEmployeeModal from './EditEmployeeModal.jsx'

const DEFAULT_RATES = {
  Drivers: 800, 'Chalan Men': 650, Workers: 500, Office: 750, 'Extra Labour': 450
}
const PAGE_SIZE = 25

function getEffectiveBase(emp) {
  return emp.baseRate !== null && emp.baseRate !== undefined
    ? emp.baseRate
    : (DEFAULT_RATES[emp.category] || 500)
}

function calcPayroll(emp) {
  const base = getEffectiveBase(emp)
  const extraH = emp.extraHours || 0
  const extra = extraH * (base / 8) * 1.5
  const inc = emp.incentive || 0
  return { base, extraH, extra, inc, total: base + extra + inc }
}

function exportToCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(obj =>
    Object.values(obj).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  window.URL.revokeObjectURL(url)
}

export default function AdminDashboard({ onLogout }) {
  const { data: employees = [], isLoading: loadEmp } = useEmployees()
  const { data: vehicles = [], isLoading: loadVeh } = useVehicles()
  const { data: trips = [] } = useTrips()

  const approveMut = useApproveEmployee()
  const rejectMut = useRejectEmployee()
  const updateMut = useUpdateEmployee()
  const deleteMut = useDeleteEmployee()
  const bulkMut = useBulkUpdateCompensation()

  const fileInputRef = useRef(null)

  // ── Toolbar state ──────────────────────────────────────────────────────────
  const [empSearch, setEmpSearch] = useState('')
  const [empCat, setEmpCat] = useState('All')
  const [empPage, setEmpPage] = useState(1)

  const [vehSearch, setVehSearch] = useState('')
  const [vehPage, setVehPage] = useState(1)

  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToast(typeof msg === 'object' ? msg : { message: msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Collapsible panels & modals ───────────────────────────────────────────
  const [showSessionPanel, setShowSessionPanel] = useState(false)
  const [showContractor, setShowContractor] = useState(true)
  const [showTrips, setShowTrips] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false)
  const [editingEmp, setEditingEmp] = useState(null)

  // ── Bulk state ────────────────────────────────────────────────────────────
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDraft, setBulkDraft] = useState({})
  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkCat, setBulkCat] = useState('All')
  const [batchCat, setBatchCat] = useState('All')
  const [batchBase, setBatchBase] = useState('')
  const [batchExtra, setBatchExtra] = useState('')
  const [batchIncentive, setBatchIncentive] = useState('')

  // ── Derived statistics ────────────────────────────────────────────────────
  const pendingEmps = employees.filter(e => e.status === 'pending_approval')
  const totalEmps = employees.length
  const totalVehs = vehicles.length
  const presentCount = employees.filter(e => e.attendance === 'arrived' || e.attendance === 'on_time').length
  const inUseVehs = vehicles.filter(v => v.status === 'in_use').length

  let totalBase = 0, totalOvertime = 0, totalIncentives = 0
  employees.forEach(emp => {
    if (emp.attendance === 'arrived' || emp.attendance === 'on_time') {
      const p = calcPayroll(emp)
      totalBase += p.base
      totalOvertime += p.extra
      totalIncentives += p.inc
    }
  })
  const grandTotal = totalBase + totalOvertime + totalIncentives

  // ── Contractor Summary ───────────────────────────────────────────────────
  const contractorSummary = useMemo(() => {
    const map = {}
    employees.forEach(emp => {
      const isPresent = emp.attendance === 'arrived' || emp.attendance === 'on_time'
      const cName = emp.contractor?.trim() || 'In-House Workforce'
      if (!map[cName]) {
        map[cName] = { name: cName, workers: 0, present: 0, base: 0, extra: 0, extraH: 0, inc: 0, total: 0 }
      }
      map[cName].workers++
      if (isPresent) {
        map[cName].present++
        const p = calcPayroll(emp)
        map[cName].base += p.base
        map[cName].extra += p.extra
        map[cName].extraH += p.extraH
        map[cName].inc += p.inc
        map[cName].total += p.total
      }
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [employees])

  // ── Filtered and Paged lists ──────────────────────────────────────────────
  const filteredEmps = useMemo(() => {
    return employees.filter(emp => {
      const catOk = empCat === 'All' || emp.category === empCat
      const q = empSearch.toLowerCase()
      const searchOk = !q || emp.name?.toLowerCase().includes(q)
        || emp.id?.toLowerCase().includes(q)
        || emp.contractor?.toLowerCase().includes(q)
      return catOk && searchOk
    })
  }, [employees, empCat, empSearch])

  const pagedEmps = useMemo(() => {
    const start = (empPage - 1) * PAGE_SIZE
    return filteredEmps.slice(start, start + PAGE_SIZE)
  }, [filteredEmps, empPage])

  const filteredVehs = useMemo(() => {
    return vehicles.filter(v => {
      const q = vehSearch.toLowerCase()
      return !q || v.number?.toLowerCase().includes(q) || v.type?.toLowerCase().includes(q)
    })
  }, [vehicles, vehSearch])

  const pagedVehs = useMemo(() => {
    const start = (vehPage - 1) * PAGE_SIZE
    return filteredVehs.slice(start, start + PAGE_SIZE)
  }, [filteredVehs, vehPage])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await approveMut.mutateAsync(id)
      showToast(`Employee ${id} approved ✓`)
    } catch (err) {
      showToast(err.message || 'Approval failed.', 'error')
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm(`Reject employee ${id}?`)) return
    try {
      await rejectMut.mutateAsync(id)
      showToast(`Employee ${id} rejected.`, 'warning')
    } catch (err) {
      showToast(err.message || 'Rejection failed.', 'error')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name} (${id}) from database? This cannot be undone.`)) return
    try {
      await deleteMut.mutateAsync(id)
      showToast(`Deleted ${name} (${id})`)
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error')
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      await updateMut.mutateAsync({
        employeeId: editingEmp.id,
        updates: {
          name: editingEmp.name,
          category: editingEmp.category,
          contractor: editingEmp.contractor || null,
          baseRate: editingEmp.baseRate ? parseFloat(editingEmp.baseRate) : getEffectiveBase(editingEmp),
          extraHours: editingEmp.extraHours ? parseFloat(editingEmp.extraHours) : 0,
          incentive: editingEmp.incentive ? parseFloat(editingEmp.incentive) : 0,
          status: editingEmp.status,
        }
      })
      showToast(`Updated ${editingEmp.name} ✓`)
      setEditingEmp(null)
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error')
    }
  }

  const handleUnlockSession = async (e) => {
    e.preventDefault()
    if (!sessionId.trim()) return
    setUnlocking(true)
    try {
      const res = await restSessionService.unlockSession(sessionId.trim())
      showToast(res.message || `Session ${sessionId} unlocked!`, 'success')
      setSessionId('')
    } catch (err) {
      showToast(err.message || 'Failed to unlock session.', 'error')
    } finally {
      setUnlocking(false)
    }
  }

  // ── Bulk Editor Handlers ──────────────────────────────────────────────────
  const openBulkEditor = () => {
    const draft = {}
    employees.forEach(emp => {
      draft[emp.id] = {
        baseRate: getEffectiveBase(emp),
        extraHours: emp.extraHours || 0,
        incentive: emp.incentive || 0,
        modified: false,
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
        if (batchBase !== '') { cur.baseRate = parseFloat(batchBase) || 0; changed = true }
        if (batchExtra !== '') { cur.extraHours = parseFloat(batchExtra) || 0; changed = true }
        if (batchIncentive !== '') { cur.incentive = parseFloat(batchIncentive) || 0; changed = true }
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
        baseRate: r.baseRate !== '' ? parseFloat(r.baseRate) : 0,
        extraHours: r.extraHours !== '' ? parseFloat(r.extraHours) : 0,
        incentive: r.incentive !== '' ? parseFloat(r.incentive) : 0,
      }))
    if (!items.length) { setBulkOpen(false); return }
    try {
      await bulkMut.mutateAsync(items)
      setBulkOpen(false)
      showToast(`Saved compensation for ${items.length} employee(s) ✓`)
    } catch (err) {
      alert(err.message || 'Bulk save failed.')
    }
  }

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim())
      if (lines.length <= 1) { alert('CSV is empty or missing data.'); return }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
      const idIdx = headers.findIndex(h => h.includes('id'))
      const baseIdx = headers.findIndex(h => h.includes('base'))
      const extraIdx = headers.findIndex(h => h.includes('extra') || h.includes('overtime'))
      const incIdx = headers.findIndex(h => h.includes('incentive') || h.includes('bonus'))

      if (idIdx === -1) { alert('CSV must have an "EmployeeID" or "ID" column.'); return }

      let updated = 0
      setBulkDraft(prev => {
        const next = { ...prev }
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
          const empId = cols[idIdx]
          if (!empId || !next[empId]) continue
          const cur = { ...next[empId] }
          if (baseIdx !== -1 && cols[baseIdx] !== '') cur.baseRate = parseFloat(cols[baseIdx]) || 0
          if (extraIdx !== -1 && cols[extraIdx] !== '') cur.extraHours = parseFloat(cols[extraIdx]) || 0
          if (incIdx !== -1 && cols[incIdx] !== '') cur.incentive = parseFloat(cols[incIdx]) || 0
          cur.modified = true
          next[empId] = cur
          updated++
        }
        return next
      })
      showToast(`Loaded CSV: ${updated} employee(s) updated in draft. Click Save to persist.`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── CSV Export Routines ───────────────────────────────────────────────────
  const exportPayroll = () => {
    exportToCSV(employees.map(emp => {
      const p = calcPayroll(emp)
      return {
        EmployeeID: emp.id, Name: emp.name, Category: emp.category,
        Contractor: emp.contractor || 'In-House',
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
      IncentiveBonus: emp.incentive || 0,
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
      <AdminHeader
        onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
        onLogout={onLogout}
      />

      {toast && (
        <div className={`toast toast-${toast.type}`} style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8,
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#10b981',
          color: '#fff', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {toast.message}
        </div>
      )}

      <div className="dashboard-body">
        <PendingApprovalsBanner
          pendingEmps={pendingEmps}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <StatsOverview
          totalEmps={totalEmps}
          presentCount={presentCount}
          totalBase={totalBase}
          totalOvertime={totalOvertime}
          totalIncentives={totalIncentives}
          grandTotal={grandTotal}
          totalVehs={totalVehs}
          inUseVehs={inUseVehs}
          activeTripsCount={trips.length}
        />

        <ContractorPayrollPanel
          contractorSummary={contractorSummary}
          showContractor={showContractor}
          setShowContractor={setShowContractor}
          onExportCsv={exportContractor}
        />

        <div className="content-grid">
          <EmployeeManagementTable
            employees={employees}
            filteredEmps={filteredEmps}
            pagedEmps={pagedEmps}
            empSearch={empSearch}
            setEmpSearch={setEmpSearch}
            empCat={empCat}
            setEmpCat={setEmpCat}
            empPage={empPage}
            setEmpPage={setEmpPage}
            onOpenBulkEditor={openBulkEditor}
            onExportPayroll={exportPayroll}
            onEditEmployee={setEditingEmp}
            onDeleteEmployee={handleDelete}
            getEffectiveBase={getEffectiveBase}
          />

          <FleetManagementTable
            vehicles={vehicles}
            filteredVehs={filteredVehs}
            pagedVehs={pagedVehs}
            vehSearch={vehSearch}
            setVehSearch={setVehSearch}
            vehPage={vehPage}
            setVehPage={setVehPage}
            trips={trips}
            showTrips={showTrips}
            setShowTrips={setShowTrips}
            onExportVehicles={exportVehicles}
          />
        </div>

        <SessionUnlockPanel
          showSessionPanel={showSessionPanel}
          setShowSessionPanel={setShowSessionPanel}
          sessionId={sessionId}
          setSessionId={setSessionId}
          unlocking={unlocking}
          onUnlockSession={handleUnlockSession}
        />
      </div>

      <BulkCompensationModal
        bulkOpen={bulkOpen}
        setBulkOpen={setBulkOpen}
        bulkDraft={bulkDraft}
        setDraftField={setDraftField}
        batchCat={batchCat}
        setBatchCat={setBatchCat}
        batchBase={batchBase}
        setBatchBase={setBatchBase}
        batchExtra={batchExtra}
        setBatchExtra={setBatchExtra}
        batchIncentive={batchIncentive}
        setBatchIncentive={setBatchIncentive}
        applyBatchPreset={applyBatchPreset}
        bulkSearch={bulkSearch}
        setBulkSearch={setBulkSearch}
        bulkCat={bulkCat}
        setBulkCat={setBulkCat}
        bulkFiltered={bulkFiltered}
        modifiedCount={modifiedCount}
        saveBulk={saveBulk}
        downloadTemplate={downloadTemplate}
        fileInputRef={fileInputRef}
        handleCsvUpload={handleCsvUpload}
        getEffectiveBase={getEffectiveBase}
        totalEmployeesCount={employees.length}
      />

      <EditEmployeeModal
        editingEmp={editingEmp}
        setEditingEmp={setEditingEmp}
        onSaveEdit={handleSaveEdit}
        getEffectiveBase={getEffectiveBase}
      />

      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  )
}