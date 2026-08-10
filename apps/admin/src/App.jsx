import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authService, ErrorBoundary, LoadingSpinner, useEmployees, useVehicles } from '@laxmi/shared'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function AdminDashboard() {
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees()
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Admin Login</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.target)
            try {
              await authService.loginWithCredentials(
                formData.get('username'),
                formData.get('password')
              )
              setIsAuthenticated(true)
            } catch (error) {
              alert('Login failed: ' + error.message)
            }
          }}>
            <input name="username" placeholder="Username" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    )
  }

  const isLoading = isLoadingEmployees || isLoadingVehicles

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  // Filter employees by date range (based on arrivalTime if available)
  const filteredEmployees = employees.filter(emp => {
    if (!emp.arrivalTime) return true // Include employees without arrival time
    const arrivalDate = new Date(emp.arrivalTime).toISOString().split('T')[0]
    return arrivalDate >= dateRange.startDate && arrivalDate <= dateRange.endDate
  })

  const totalEmployees = employees.length
  const totalVehicles = vehicles.length
  const presentToday = employees.filter(e => e.attendance === 'arrived' || e.attendance === 'on_time').length
  const vehiclesInUse = vehicles.filter(v => v.status === 'in_use').length

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(',')
    const rows = data.map(obj => Object.values(obj).join(','))
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
    const exportData = filteredEmployees.map(emp => ({
      ID: emp.employeeId,
      Name: emp.name,
      Category: emp.category,
      Attendance: emp.attendance || 'Pending',
      ArrivalTime: emp.arrivalTime || 'N/A'
    }))
    exportToCSV(exportData, `employee_attendance_${dateRange.startDate}_to_${dateRange.endDate}.csv`)
  }

  const exportVehicleData = () => {
    const exportData = vehicles.map(vehicle => ({
      Number: vehicle.number,
      Type: vehicle.type,
      Status: vehicle.status
    }))
    exportToCSV(exportData, `vehicle_status_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Laxmi Enterprise - Admin Dashboard</h1>
        <button onClick={() => authService.logout()}>Logout</button>
      </header>

      <div className="date-filter-section">
        <div className="date-filter">
          <label>
            Start Date:
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </label>
          <button onClick={() => setDateRange({
            startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          })}>
            Last 7 Days
          </button>
          <button onClick={() => setDateRange({
            startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          })}>
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p className="stat-value">{totalEmployees}</p>
        </div>
        <div className="stat-card">
          <h3>Present Today</h3>
          <p className="stat-value">{presentToday}</p>
        </div>
        <div className="stat-card">
          <h3>Total Vehicles</h3>
          <p className="stat-value">{totalVehicles}</p>
        </div>
        <div className="stat-card">
          <h3>Vehicles in Use</h3>
          <p className="stat-value">{vehiclesInUse}</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="section">
          <div className="section-header">
            <h2>Employee Attendance ({filteredEmployees.length} records in range)</h2>
            <button className="export-button" onClick={exportEmployeeData}>
              Export CSV
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Attendance</th>
                <th>Arrival Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.slice(0, 10).map(emp => (
                <tr key={emp.employeeId}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.category}</td>
                  <td>{emp.attendance || 'Pending'}</td>
                  <td>{emp.arrivalTime || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Vehicle Status</h2>
            <button className="export-button" onClick={exportVehicleData}>
              Export CSV
            </button>
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
              {vehicles.slice(0, 10).map(vehicle => (
                <tr key={vehicle.vehicleId}>
                  <td>{vehicle.number}</td>
                  <td>{vehicle.type}</td>
                  <td>{vehicle.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AdminDashboard />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
