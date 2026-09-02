import { useState, useCallback, lazy, Suspense } from 'react'
import './App.css'

// ─── Eagerly loaded — rendered immediately on page load ──────────────────────
import LeftColumn from './components/LeftColumn'
import RightColumn from './components/RightColumn'
import EmployeeTable from './components/EmployeeTable'
import CategoryTabs from './components/CategoryTabs'
import FilterChips from './components/FilterChips'
import VehicleTable from './components/VehicleTable'
import LoginModal from './components/LoginModal'
import Toast from './components/ui/Toast'
import ConfirmModal from './components/ui/ConfirmModal'

// ─── Lazily loaded — only needed when modals/panels are opened ───────────────
// Splitting these reduces the initial JS bundle by ~60-80KB
const TripTrackerModal = lazy(() => import('./components/TripTrackerModal'))
const CapacityConflictModal = lazy(() => import('./components/CapacityConflictModal'))
const CapacityReportModal = lazy(() => import('./components/CapacityReportModal'))
const VehicleAssignmentHistory = lazy(() => import('./components/VehicleAssignmentHistory'))
const RequestEmployeeModal = lazy(() => import('./components/RequestEmployeeModal'))

import { generateAttendanceReport } from './components/pdf/pdfHandler'
import { useAttendanceState } from './hooks/useAttendanceState'
import { useAttendanceHandlers } from './hooks/useAttendanceHandlers'
import { useFilters } from './hooks/useFilters'
import { useStatistics } from './hooks/useStatistics'
import { useTableSort } from './hooks/useTableSort'
import { authService, ArrivedTimeModal, LoadingSpinner, GoogleSheetsSyncModal } from '@laxmi/shared'

function App() {
  // ─── Inline notification state (replaces alert()) ───────────────────────────
  const [notification, setNotification] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false)
  const [isTripTrackerOpen, setIsTripTrackerOpen] = useState(false)
  const [isSheetsSyncOpen, setIsSheetsSyncOpen] = useState(false)
  const [arrivedEmployee, setArrivedEmployee] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])


  const notify = useCallback((type, message) => {
    setNotification({ type, message })
  }, [])

  const showConfirm = useCallback((opts) => {
    setConfirmModal({
      ...opts,
      onCancel: () => setConfirmModal(null),
    })
  }, [])

  // ─── Core state ─────────────────────────────────────────────────────────────
  const state = useAttendanceState()

  // ─── Handlers (now receive notify + showConfirm instead of using alert/confirm)
  const handlers = useAttendanceHandlers({ ...state, notify, showConfirm })

  // ─── Filters ────────────────────────────────────────────────────────────────
  const { filteredEmployees, filteredVehicles } = useFilters(
    state.employees,
    state.vehicles,
    state.searchQuery,
    state.categoryFilter,
    state.attendanceFilter,
    state.alphabetFilter
  )

  // ─── Statistics ─────────────────────────────────────────────────────────────
  const statistics = useStatistics(state.employees, state.vehicles)

  // ─── Table sorting ──────────────────────────────────────────────────────────
  const { sortConfig, handleSort, sortData } = useTableSort()
  const sortedEmployees = sortData(filteredEmployees, state.categoryFilter, state.employees)
  const sortedVehicles = sortData(filteredVehicles, 'Vehicles', state.employees)

  // ─── Modal states ───────────────────────────────────────────────────────────
  const [conflict, setConflict] = useState(null)
  const [showCapacityReport, setShowCapacityReport] = useState(false)
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
      lockedVehicles: statistics.lockedVehicles,
    })
  }

  const handleFinalizeAttendance = () => {
    const success = handlers.handleFinalizeAttendance(statistics.completedCount, statistics.totalCount)
    if (success) {
      state.setIsAttendanceFinalized(true)
      notify('success', 'Attendance status finalized and locked.')
    }
  }

  const handleResetAttendanceFinalization = () => {
    state.setIsAttendanceFinalized(false)
    state.setIsSheetFinalized(false)
    notify('success', 'Attendance finalization unlocked! You can now edit attendance and assignments.')
  }

  const handleFinalizeSheet = () => {
    const success = handlers.handleFinalizeSheet(state.isAttendanceFinalized)
    if (success) {
      state.setIsSheetFinalized(true)
      notify('success', 'Daily attendance sheet finalized! Vehicle assignments and Min/Max demands are now locked.')
    }
  }

  const handleLoginSuccess = () => {
    window.location.reload()
  }

  const handleLogout = () => {
    authService.logout()
    window.location.reload()
  }

  const handleLoadDayValues = useCallback((dateStr) => {
    if (!dateStr) return
    const parts = dateStr.split('-')
    const formattedDDMMYYYY = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr
    notify('success', `Loaded expected day attendance values for ${formattedDDMMYYYY} (${dateStr})`)
  }, [notify])

  // ─── Auth / loading gates ───────────────────────────────────────────────────
  if (!state.isAuthenticated && !state.isLoading) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />
  }

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
      {/* ── Toast notification (replaces alert()) ── */}
      <Toast notification={notification} onDismiss={() => setNotification(null)} />

      {/* ── Inline confirm modal (replaces confirm()) ── */}
      <ConfirmModal confirmModal={confirmModal} />

      <LeftColumn
        currentDate={state.currentDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onLoadDayValues={handleLoadDayValues}
        isAttendanceLocked={state.isAttendanceLocked}
        isAttendanceFinalized={state.isAttendanceFinalized}
        isSheetFinalized={state.isSheetFinalized}
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
        handleResetAttendanceFinalization={handleResetAttendanceFinalization}
        handleFinalizeSheet={handleFinalizeSheet}
        minDemandCount={statistics.minDemandCount}
        maxDemandCount={statistics.maxDemandCount}
        pendingDemandCount={statistics.pendingDemandCount}
        assignedVehiclesCount={statistics.assignedVehicles?.length || 0}
        onLogout={handleLogout}
        onOpenAddEmployeeModal={() => setIsAddEmployeeModalOpen(true)}
        onOpenTripTracker={() => setIsTripTrackerOpen(true)}
        onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
      />

      <Suspense fallback={null}>
        <RequestEmployeeModal
          isOpen={isAddEmployeeModalOpen}
          onClose={() => setIsAddEmployeeModalOpen(false)}
          notify={notify}
        />
      </Suspense>

      <Suspense fallback={null}>
        <TripTrackerModal
          isOpen={isTripTrackerOpen}
          onClose={() => setIsTripTrackerOpen(false)}
          sessionId={`SES-${selectedDate}`}
        />
      </Suspense>

      <ArrivedTimeModal
        isOpen={!!arrivedEmployee}
        employee={arrivedEmployee}
        onClose={() => setArrivedEmployee(null)}
        onConfirm={({ employeeId, arrivalTime, remarks }) => {
          handlers.handleAttendance(employeeId, 'arrived', arrivalTime, remarks)
          notify('success', `Recorded arrival time for employee`)
        }}
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
          isSheetFinalized={state.isSheetFinalized}
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
              isAttendanceFinalized={state.isAttendanceFinalized}
              isSheetFinalized={state.isSheetFinalized}
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
        attendanceFilter={state.attendanceFilter}
        setAttendanceFilter={state.setAttendanceFilter}
        sessionStartTime={state.sessionStartTime}
        isAttendanceLocked={state.isAttendanceLocked}
        isAttendanceFinalized={state.isAttendanceFinalized}
        isSheetFinalized={state.isSheetFinalized}
        minDemandCount={statistics.minDemandCount}
        maxDemandCount={statistics.maxDemandCount}
        searchQuery={state.searchQuery}
        selectedEmployee={state.selectedEmployee}
        setSelectedEmployee={state.setSelectedEmployee}
        handleDownloadPDF={handleDownloadPDF}
        assignedVehicles={statistics.assignedVehicles}
        averageVehicleUtilization={statistics.averageVehicleUtilization}
        fullyUtilizedVehicles={statistics.fullyUtilizedVehicles}
        underUtilizedVehicles={statistics.underUtilizedVehicles}
        lockedVehicles={statistics.lockedVehicles}
      />

      {state.selectedEmployee && state.categoryFilter === 'Vehicles' && (
        <Suspense fallback={<LoadingSpinner />}>
          <VehicleAssignmentHistory
            vehicle={state.selectedEmployee}
            employees={state.employees}
            onClose={() => state.setSelectedEmployee(null)}
          />
        </Suspense>
      )}

      {conflict && (
        <Suspense fallback={<LoadingSpinner />}>
          <CapacityConflictModal
            conflict={conflict}
            onResolve={(resolution) => {
              if (resolution.action === 'swap' && resolution.targetEmployeeId) {
                const targetVehicleId = conflict.vehicle.id
                const newEmployeeId = conflict.employee.id
                const oldEmployeeId = resolution.targetEmployeeId

                state.setEmployees(prev => prev.map(emp =>
                  emp.id === oldEmployeeId ? { ...emp, assignedVehicle: null } : emp
                ))

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
        </Suspense>
      )}

      {showCapacityReport && (
        <Suspense fallback={<LoadingSpinner />}>
          <CapacityReportModal
            vehicles={state.vehicles}
            employees={state.employees}
            onClose={() => setShowCapacityReport(false)}
          />
        </Suspense>
      )}

      <GoogleSheetsSyncModal
        isOpen={isSheetsSyncOpen}
        onClose={() => setIsSheetsSyncOpen(false)}
      />
    </div>
  )
}

export default App
