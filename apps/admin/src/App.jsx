import { useState, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  useTrips
} from '@laxmi/shared'

import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

const DEFAULT_RATES = {
  Drivers: 800,
  'Chalan Men': 650,
  Workers: 500,
  Office: 750,
  'Extra Labour': 450
}

// ─── Inline error component ───────────────────────────────────────────────────
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

// ─── Login page ───────────────────────────────────────────────────────────────
function LoginPage({ onLoginSuccess }) {
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)
    const formData = new FormData(e.target)
    try {
      await authService.loginWithCredentials(
        formData.get('username'),
        formData.get('password')
      )
      onLoginSuccess()
    } catch (error) {
      setLoginError(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input name="username" placeholder="Username" required disabled={isLoggingIn} />
          <input name="password" type="password" placeholder="Password" required disabled={isLoggingIn} />
          <InlineError message={loginError} />
          <button type="submit" disabled={isLoggingIn} className={isLoggingIn ? 'loading' : ''}>
            {isLoggingIn ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <p className="login-hint">Demo: admin / password123</p>
      </div>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const PAGE_SIZE = 20

function AdminDashboard({ onLogout }) {
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees()
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles()
  const { data: trips = [] } = useTrips()

  const approveEmployeeMutation = useApproveEmployee()
  const rejectEmployeeMutation = useRejectEmployee()
  const updateEmployeeMutation = useUpdateEmployee()
  const deleteEmployeeMutation = useDeleteEmployee()

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const [empSearch, setEmpSearch] = useState('')
  const [vehSearch, setVehSearch] = useState('')

  const [empPage, setEmpPage] = useState(1)
  const [vehPage, setVehPage] = useState(1)

  const [editingEmp, setEditingEmp] = useState(null)
  const [notificationMsg, setNotificationMsg] = useState('')

  const isLoading = isLoadingEmployees || isLoadingVehicles

  if (isLoading) {
    return <LoadingSpinner text="Loading admin dashboard..." />
  }

  // Pending approvals filter
  const pendingEmployees = employees.filter(e => e.status === 'pending_approval')

  // Stats (always from full dataset)
  const totalEmployees = employees.length
  const totalVehicles = vehicles.length
  const presentToday = employees.filter(e => e.attendance === 'arrived' || e.attendance === 'on_time').length
  const vehiclesInUse = vehicles.filter(v => v.status === 'in_use').length

  // Payroll calculation
  let totalBasePay = 0
  let totalExtraDutyPay = 0

  employees.forEach(emp => {
    if (emp.attendance === 'arrived' || emp.attendance === 'on_time') {
      const base = emp.baseRate || DEFAULT_RATES[emp.category] || 500
      const extraH = emp.extraHours || 0
      const extraPay = extraH * (base / 8) * 1.5
      totalBasePay += base
      totalExtraDutyPay += extraPay
    }
  })

  const grandTotalPay = totalBasePay + totalExtraDutyPay

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
    setEmpPage(1)
  }

  const setPreset = (days) => {
    setDateRange({
      startDate: new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })
    setEmpPage(1)
  }

  const handleApprove = async (empId) => {
    try {
      await approveEmployeeMutation.mutateAsync(empId)
      setNotificationMsg('Employee request approved successfully!')
      setTimeout(() => setNotificationMsg(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to approve employee.')
    }
  }

  const handleReject = async (empId) => {
    try {
      await rejectEmployeeMutation.mutateAsync(empId)
      setNotificationMsg('Employee request rejected.')
      setTimeout(() => setNotificationMsg(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to reject employee.')
    }
  }

  const handleDelete = async (empId) => {
    if (window.confirm(`Are you sure you want to delete employee ${empId}? This action is irreversible.`)) {
      try {
        await deleteEmployeeMutation.mutateAsync(empId)
        setNotificationMsg('Employee deleted.')
        setTimeout(() => setNotificationMsg(''), 4000)
      } catch (err) {
        alert(err.message || 'Failed to delete employee.')
      }
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingEmp) return
    try {
      await updateEmployeeMutation.mutateAsync({
        employeeId: editingEmp.id,
        updateData: {
          name: editingEmp.name,
          category: editingEmp.category,
          status: editingEmp.status,
          contractor: editingEmp.contractor
        }
      })
      setEditingEmp(null)
      setNotificationMsg('Employee details updated successfully.')
      setTimeout(() => setNotificationMsg(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to update employee.')
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const searchMatch = !empSearch ||
      (emp.name || '').toLowerCase().includes(empSearch.toLowerCase()) ||
      (emp.id || '').toLowerCase().includes(empSearch.toLowerCase()) ||
      (emp.category || '').toLowerCase().includes(empSearch.toLowerCase())

    const hasDateField = emp.dateRecorded || emp.sessionDate
    const dateField = emp.dateRecorded || emp.sessionDate
    const dateMatch = !hasDateField ||
      (dateField >= dateRange.startDate && dateField <= dateRange.endDate)

    return searchMatch && dateMatch
  })

  const filteredVehicles = vehicles.filter(v =>
    !vehSearch ||
    (v.number || '').toLowerCase().includes(vehSearch.toLowerCase()) ||
    (v.type || '').toLowerCase().includes(vehSearch.toLowerCase()) ||
    (v.status || '').toLowerCase().includes(vehSearch.toLowerCase())
  )

  const empTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE))
  const vehTotalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE))
  const pagedEmployees = filteredEmployees.slice((empPage - 1) * PAGE_SIZE, empPage * PAGE_SIZE)
  const pagedVehicles = filteredVehicles.slice((vehPage - 1) * PAGE_SIZE, vehPage * PAGE_SIZE)

  const exportToCSV = (data, filename) => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(obj =>
      Object.values(obj).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportEmployeeData = () => {
    const exportData = filteredEmployees.map(emp => {
      const base = emp.baseRate || DEFAULT_RATES[emp.category] || 500
      const extraH = emp.extraHours || 0
      const extraPay = extraH * (base / 8) * 1.5
      return {
        ID: emp.id,
        Name: emp.name,
        Category: emp.category,
        Status: emp.status,
        Attendance: emp.attendance || 'Pending',
        ArrivalTime: emp.arrivalTime || 'N/A',
        BasePay: `₹${base}`,
        ExtraHours: extraH,
        ExtraDutyPay: `₹${extraPay.toFixed(2)}`,
        TotalPay: `₹${(base + extraPay).toFixed(2)}`
      }
    })
    exportToCSV(exportData, `employee_payroll_${dateRange.startDate}_to_${dateRange.endDate}.csv`)
  }

  const exportVehicleData = () => {
    const exportData = vehicles.map(vehicle => ({
      Number: vehicle.number,
      Type: vehicle.type,
      Status: vehicle.status,
    }))
    exportToCSV(exportData, `vehicle_status_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const attendanceBadge = (status) => {
    const map = {
      on_time: { label: 'On Time', cls: 'badge-success' },
      arrived: { label: 'Arrived', cls: 'badge-warning' },
      absent: { label: 'Absent', cls: 'badge-error' },
    }
    const b = map[status] || { label: 'Pending', cls: 'badge-neutral' }
    return <span className={`badge ${b.cls}`}>{b.label}</span>
  }

  const statusBadge = (status) => {
    const map = {
      active: { label: 'Active', cls: 'badge-success' },
      pending_approval: { label: 'Pending Approval', cls: 'badge-warning' },
      rejected: { label: 'Rejected', cls: 'badge-error' },
      available: { label: 'Available', cls: 'badge-success' },
      in_use: { label: 'In Use', cls: 'badge-warning' },
      maintenance: { label: 'Maintenance', cls: 'badge-error' },
    }
    const b = map[status] || { label: status, cls: 'badge-neutral' }
    return <span className={`badge ${b.cls}`}>{b.label}</span>
  }

  const [sessionUnlockId, setSessionUnlockId] = useState('')
  const [isUnlockingSession, setIsUnlockingSession] = useState(false)

  const handleUnlockSession = async (e) => {
    e.preventDefault()
    if (!sessionUnlockId) return
    setIsUnlockingSession(true)
    try {
      await restSessionService.unlockSession(sessionUnlockId)
      setNotificationMsg(`Session "${sessionUnlockId}" unlocked successfully! Supervisors can now edit attendance records.`)
      setSessionUnlockId('')
      setTimeout(() => setNotificationMsg(''), 5000)
    } catch (err) {
      alert(err.message || 'Failed to unlock session.')
    } finally {
      setIsUnlockingSession(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Laxmi Enterprise — Admin Portal</h1>
        <button onClick={onLogout}>Logout</button>
      </header>

      {notificationMsg && (
        <div style={{ padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
          ✅ {notificationMsg}
        </div>
      )}

      {/* Reset Finalized Session Control (Admin Exclusive Rights) */}
      <div style={{ background: '#f0f9ff', border: '1.5px solid #0284c7', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
        <h2 style={{ color: '#0369a1', marginTop: 0, fontSize: '1.1rem' }}>
          🔓 Reset Finalized Session (Admin Exclusive Rights)
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#334155', margin: '4px 0 12px 0' }}>
          If edits are needed after a supervisor has finalized a daily attendance sheet, enter the Session ID or date to reset the finalized flag back to in-progress.
        </p>
        <form onSubmit={handleUnlockSession} style={{ display: 'flex', gap: '8px', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="e.g. SES-2026-08-12-Shift A or SES-2026-09-04-Shift A"
            value={sessionUnlockId}
            onChange={e => setSessionUnlockId(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '0.9rem' }}
            required
          />
          <button
            type="submit"
            disabled={isUnlockingSession}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isUnlockingSession ? 'Unlocking...' : 'Reset Finalized Flag'}
          </button>
        </form>
      </div>


      {/* Pending Approvals Section */}
      {pendingEmployees.length > 0 && (
        <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          <h2 style={{ color: '#92400e', marginTop: 0, fontSize: '1.1rem' }}>
            ⚠️ {pendingEmployees.length} Employee Addition Request(s) Awaiting Admin Approval
          </h2>
          <table className="data-table" style={{ marginTop: '12px' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Contractor</th>
                <th>Requested By</th>
                <th>Actions (Admin Only)</th>
              </tr>
            </thead>
            <tbody>
              {pendingEmployees.map(emp => (
                <tr key={emp.id}>
                  <td><strong>{emp.id}</strong></td>
                  <td>{emp.name}</td>
                  <td>{emp.category}</td>
                  <td>{emp.contractor || '—'}</td>
                  <td>{emp.requestedBy || 'Supervisor'}</td>
                  <td>
                    <button
                      onClick={() => handleApprove(emp.id)}
                      style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(emp.id)}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p className="stat-value">{totalEmployees}</p>
        </div>
        <div className="stat-card">
          <h3>Present Today</h3>
          <p className="stat-value" style={{ color: '#059669' }}>{presentToday}</p>
        </div>
        <div className="stat-card">
          <h3>Est. Base Pay</h3>
          <p className="stat-value" style={{ color: '#2563eb' }}>₹{totalBasePay}</p>
        </div>
        <div className="stat-card">
          <h3>Est. Extra Duty Pay (1.5x)</h3>
          <p className="stat-value" style={{ color: '#d97706' }}>₹{totalExtraDutyPay.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Grand Total Payout</h3>
          <p className="stat-value" style={{ color: '#059669', fontWeight: 'bold' }}>₹{grandTotalPay.toFixed(2)}</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="date-filter-section">
        <div className="date-filter">
          <label>
            Start Date:
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => handleDateChange('startDate', e.target.value)}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => handleDateChange('endDate', e.target.value)}
            />
          </label>
          <button onClick={() => setPreset(7)}>Last 7 Days</button>
          <button onClick={() => setPreset(30)}>Last 30 Days</button>
        </div>
      </div>

      {/* Tables */}
      <div className="content-grid">
        {/* Employees */}
        <div className="section">
          <div className="section-header">
            <h2>Employee Management & Payroll</h2>
            <button className="export-button" onClick={exportEmployeeData}>Export Payroll CSV</button>
          </div>

          <div className="table-search">
            <input
              type="text"
              placeholder="Search by name, ID or category…"
              value={empSearch}
              onChange={e => { setEmpSearch(e.target.value); setEmpPage(1) }}
            />
          </div>

          <div className="table-meta">
            Showing {pagedEmployees.length} of {filteredEmployees.length} records
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Base Pay</th>
                <th>Actions (Admin)</th>
              </tr>
            </thead>
            <tbody>
              {pagedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">No records found</td>
                </tr>
              ) : (
                pagedEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td><strong>{emp.id}</strong></td>
                    <td>{emp.name}</td>
                    <td>{emp.category}</td>
                    <td>{statusBadge(emp.status)}</td>
                    <td>₹{emp.baseRate || DEFAULT_RATES[emp.category] || 500}</td>
                    <td>
                      <button
                        onClick={() => setEditingEmp(emp)}
                        style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {empTotalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setEmpPage(p => Math.max(1, p - 1))} disabled={empPage === 1}>← Prev</button>
              <span>Page {empPage} of {empTotalPages}</span>
              <button onClick={() => setEmpPage(p => Math.min(empTotalPages, p + 1))} disabled={empPage === empTotalPages}>Next →</button>
            </div>
          )}
        </div>

        {/* Vehicles */}
        <div className="section">
          <div className="section-header">
            <h2>Vehicle Status</h2>
            <button className="export-button" onClick={exportVehicleData}>Export CSV</button>
          </div>

          <div className="table-search">
            <input
              type="text"
              placeholder="Search by number, type or status…"
              value={vehSearch}
              onChange={e => { setVehSearch(e.target.value); setVehPage(1) }}
            />
          </div>

          <div className="table-meta">
            Showing {pagedVehicles.length} of {filteredVehicles.length} records
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedVehicles.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-row">No records found</td>
                </tr>
              ) : (
                pagedVehicles.map(vehicle => (
                  <tr key={vehicle.id || vehicle.number}>
                    <td>{vehicle.number}</td>
                    <td>{vehicle.type}</td>
                    <td>{statusBadge(vehicle.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {vehTotalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setVehPage(p => Math.max(1, p - 1))} disabled={vehPage === 1}>← Prev</button>
              <span>Page {vehPage} of {vehTotalPages}</span>
              <button onClick={() => setVehPage(p => Math.min(vehTotalPages, p + 1))} disabled={vehPage === vehTotalPages}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Trip & Delivery Overview */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
          🚚 Active & Historical Vehicle Trips ({trips.length})
        </h2>
        <table className="data-table" style={{ marginTop: '12px' }}>
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Vehicle Number</th>
              <th>Driver</th>
              <th>Destination</th>
              <th>Load Details</th>
              <th>Status</th>
              <th>Dispatched At</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">No active vehicle trips recorded</td>
              </tr>
            ) : (
              trips.slice(0, 10).map(t => (
                <tr key={t.id || t._id}>
                  <td><strong>{t.id || t._id}</strong></td>
                  <td>{t.vehicleNumber}</td>
                  <td>{t.driverName || '—'}</td>
                  <td>{t.destinationLocation}</td>
                  <td>{t.productDetails || 'Aggregates'}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>{new Date(t.dispatchedAt || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Edit Modal */}
      {editingEmp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Edit Employee Details</h3>
            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Name</label>
                <input
                  type="text"
                  value={editingEmp.name}
                  onChange={e => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Category</label>
                <select
                  value={editingEmp.category}
                  onChange={e => setEditingEmp({ ...editingEmp, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="Workers">Workers</option>
                  <option value="Drivers">Drivers</option>
                  <option value="Chalan Men">Chalan Men</option>
                  <option value="Office">Office</option>
                  <option value="Extra Labour">Extra Labour</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Status</label>
                <select
                  value={editingEmp.status}
                  onChange={e => setEditingEmp({ ...editingEmp, status: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                  <option value="active">Active</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingEmp(null)} style={{ background: '#9ca3af', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated())

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {isAuthenticated ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

