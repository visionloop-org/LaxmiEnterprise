import { useState } from 'react'
import './App.css'
import LeftColumn from './components/LeftColumn'
import RightColumn from './components/RightColumn'
import EmployeeTable from './components/EmployeeTable'
import VehicleAssignmentHistory from './components/VehicleAssignmentHistory'
import CapacityConflictModal from './components/CapacityConflictModal'
import CapacityReportModal from './components/CapacityReportModal'
import CategoryTabs from './components/CategoryTabs'
import FilterChips from './components/FilterChips'
import VehicleTable from './components/VehicleTable'
import LoginModal from './components/LoginModal'
import { generateAttendanceReport } from './components/pdf/pdfHandler'
import { useAttendanceState } from './hooks/useAttendanceState'
import { useAttendanceHandlers } from './hooks/useAttendanceHandlers'
import { useFilters } from './hooks/useFilters'
import { useStatistics } from './hooks/useStatistics'
import { useTableSort } from './hooks/useTableSort'
import { authService } from '@laxmi/shared'

function App() {
  // State management
  const state = useAttendanceState()
  
  // Event handlers
  const handlers = useAttendanceHandlers(state)
  
  // Filter logic
  const { filteredEmployees, filteredVehicles } = useFilters(
    state.employees,
    state.vehicles,
    state.searchQuery,
    state.categoryFilter,
    state.attendanceFilter,
    state.alphabetFilter
  )
  
  // Statistics
  const statistics = useStatistics(state.employees, state.vehicles)

  // Table sorting
  const { sortConfig, handleSort, sortData } = useTableSort()
  const sortedEmployees = sortData(filteredEmployees, state.categoryFilter, state.employees)
  const sortedVehicles = sortData(filteredVehicles, 'Vehicles', state.employees)

  // Conflict modal state
  const [conflict, setConflict] = useState(null)
  
  // Capacity report modal state
  const [showCapacityReport, setShowCapacityReport] = useState(false)
  
  // Vehicle assignments expansion state
  const [expandedVehicleId, setExpandedVehicleId] = useState(null)

  const categories = ['All', 'Workers', 'Drivers', 'Chalan Men', 'Extra Labour', 'Office', 'Vehicles']
  const attendanceFilters = ['All', 'Present', 'Absent']
  const alphabetFilters = ['All', 'A-D', 'E-H', 'I-L', 'M-P', 'Q-T', 'U-Z']

  const resetFilters = () => {
    state.setSearchQuery('')
    state.setCategoryFilter('All')
    state.setAttendanceFilter('All')
    state.setAlphabetFilter('All')
  }

  const handleDownloadPDF = () => {
    generateAttendanceReport({
      currentDate: state.currentDate,
      sessionStartTime: state.sessionStartTime,
      totalCount: statistics.totalCount,
      completedCount: statistics.completedCount,
      pendingCount: statistics.pendingCount,
      onTimeCount: statistics.onTimeCount,
      arrivedCount: statistics.arrivedCount,
      absentCount: statistics.absentCount,
      employees: state.employees,
      vehicles: state.vehicles,
      assignedVehicles: statistics.assignedVehicles,
      averageVehicleUtilization: statistics.averageVehicleUtilization,
      fullyUtilizedVehicles: statistics.fullyUtilizedVehicles,
      underUtilizedVehicles: statistics.underUtilizedVehicles,
      lockedVehicles: statistics.lockedVehicles
    })
  }

  const handleFinalizeAttendance = () => {
    if (handlers.handleFinalizeAttendance(statistics.completedCount, statistics.totalCount)) {
      state.setIsAttendanceLocked(true)
    }
  }

  const handleLoginSuccess = () => {
    // Reload the page or trigger a state update to fetch data
    window.location.reload()
  }

  const handleLogout = () => {
    authService.logout()
    window.location.reload()
  }

  // Show login modal if not authenticated
  if (!state.isAuthenticated && !state.isLoading) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />
  }

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <LeftColumn
        currentDate={state.currentDate}
        isAttendanceLocked={state.isAttendanceLocked}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        attendanceFilter={state.attendanceFilter}
        setAttendanceFilter={state.setAttendanceFilter}
        attendanceFilters={attendanceFilters}
        alphabetFilter={state.alphabetFilter}
        setAlphabetFilter={state.setAlphabetFilter}
        alphabetFilters={alphabetFilters}
        resetFilters={resetFilters}
        pendingCount={statistics.pendingCount}
        handleFinalizeAttendance={handleFinalizeAttendance}
        onLogout={handleLogout}
      />

      {/* Center Column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CategoryTabs 
          categories={categories}
          categoryFilter={state.categoryFilter}
          setCategoryFilter={state.setCategoryFilter}
          getCategoryCount={statistics.getCategoryCount}
        />

        <FilterChips 
          categoryFilter={state.categoryFilter}
          attendanceFilter={state.attendanceFilter}
          alphabetFilter={state.alphabetFilter}
          searchQuery={state.searchQuery}
          setCategoryFilter={state.setCategoryFilter}
          setAttendanceFilter={state.setAttendanceFilter}
          setAlphabetFilter={state.setAlphabetFilter}
          setSearchQuery={state.setSearchQuery}
          setShowAddWorker={state.setShowAddWorker}
          isAttendanceLocked={state.isAttendanceLocked}
          statistics={statistics}
          filteredCount={state.categoryFilter === 'Vehicles' ? filteredVehicles.length : filteredEmployees.length}
          totalCount={state.categoryFilter === 'Vehicles' ? state.vehicles.length : statistics.totalCount}
          isVehicles={state.categoryFilter === 'Vehicles'}
        />

        {/* Table Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {state.categoryFilter === 'Vehicles' ? (
            <VehicleTable
              vehicles={sortedVehicles}
              employees={state.employees}
              sortConfig={sortConfig}
              onSort={handleSort}
              expandedVehicleId={expandedVehicleId}
              setExpandedVehicleId={setExpandedVehicleId}
              handlers={handlers}
              setSelectedEmployee={state.setSelectedEmployee}
              setShowCapacityReport={setShowCapacityReport}
              setEmployees={state.setEmployees}
            />
          ) : (
            <EmployeeTable
              filteredEmployees={sortedEmployees}
              isAttendanceLocked={state.isAttendanceLocked}
              handleAttendance={handlers.handleAttendance}
              arrivalTimes={state.arrivalTimes}
              setArrivalTimes={state.setArrivalTimes}
              currentTime={state.currentTime}
              vehicles={state.vehicles}
              handleVehicleAssignment={handlers.handleVehicleAssignment}
              handleLabourRequest={handlers.handleLabourRequest}
              resetFilters={resetFilters}
              showAddWorker={state.showAddWorker}
              setShowAddWorker={state.setShowAddWorker}
              newWorker={state.newWorker}
              setNewWorker={state.setNewWorker}
              handleAddWorker={handlers.handleAddWorker}
              categoryFilter={state.categoryFilter}
              editedEmployees={state.editedEmployees}
              handleToggleEditMode={handlers.handleToggleEditMode}
              employees={state.employees}
              onConflict={setConflict}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )}
        </div>
      </div>

      <RightColumn
        showRightPanel={state.showRightPanel}
        setShowRightPanel={state.setShowRightPanel}
        completedCount={statistics.completedCount}
        pendingCount={statistics.pendingCount}
        totalCount={statistics.totalCount}
        onTimeCount={statistics.onTimeCount}
        arrivedCount={statistics.arrivedCount}
        absentCount={statistics.absentCount}
        handleDownloadPDF={handleDownloadPDF}
        assignedVehicles={statistics.assignedVehicles}
        averageVehicleUtilization={statistics.averageVehicleUtilization}
        fullyUtilizedVehicles={statistics.fullyUtilizedVehicles}
        underUtilizedVehicles={statistics.underUtilizedVehicles}
        lockedVehicles={statistics.lockedVehicles}
      />

      {state.selectedEmployee && state.categoryFilter === 'Vehicles' && (
        <VehicleAssignmentHistory
          vehicle={state.selectedEmployee}
          employees={state.employees}
          onClose={() => state.setSelectedEmployee(null)}
        />
      )}

      {conflict && (
        <CapacityConflictModal
          conflict={conflict}
          onResolve={(resolution) => {
            if (resolution.action === 'swap' && resolution.targetEmployeeId) {
              // Swap employees
              const targetVehicleId = conflict.vehicle.id
              const newEmployeeId = conflict.employee.id
              const oldEmployeeId = resolution.targetEmployeeId
              
              // Remove old employee from vehicle
              state.setEmployees(prev => prev.map(emp => 
                emp.id === oldEmployeeId ? { ...emp, assignedVehicle: null } : emp
              ))
              
              // Assign new employee to vehicle
              const result = handlers.handleVehicleAssignment(newEmployeeId, targetVehicleId)
              if (!result?.conflict) {
                setConflict(null)
              }
            } else if (resolution.action === 'unlock') {
              handlers.handleUnlockVehicle(conflict.vehicle.id)
              setConflict(null)
            } else if (resolution.action === 'chooseDifferentVehicle') {
              setConflict(null)
            } else if (resolution.action === 'cancel') {
              setConflict(null)
            }
          }}
          onCancel={() => setConflict(null)}
        />
      )}

      {showCapacityReport && (
        <CapacityReportModal
          vehicles={state.vehicles}
          employees={state.employees}
          onClose={() => setShowCapacityReport(false)}
        />
      )}
    </div>
  )
}

export default App
