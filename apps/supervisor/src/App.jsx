import { useState, useCallback, lazy, Suspense, useEffect } from 'react'
import './App.css'

// ─── Eagerly loaded components ───────────────────────────────────────────────
import LeftColumn from './components/LeftColumn'
import RightColumn from './components/RightColumn'
import EmployeeTable from './components/EmployeeTable'
import CategoryTabs from './components/CategoryTabs'
import FilterChips from './components/FilterChips'
import LoginModal from './components/LoginModal'
import Toast from './components/ui/Toast'
import ConfirmModal from './components/ui/ConfirmModal'

// ─── Lazily loaded modals (code-split) ─────────────────────────────────────────
const RequestEmployeeModal = lazy(() => import('./components/RequestEmployeeModal'))
const CameraQrScannerModal = lazy(() => import('./components/CameraQrScannerModal'))

import { useAttendanceState } from './hooks/useAttendanceState'
import { useAttendanceHandlers } from './hooks/useAttendanceHandlers'
import { useFilters } from './hooks/useFilters'
import { useStatistics } from './hooks/useStatistics'
import { useTableSort } from './hooks/useTableSort'
import { authService, ArrivedTimeModal, GoogleSheetsSyncModal, createLogger, getPerformanceMonitor } from '@laxmi/shared'

const logger = typeof createLogger === 'function' ? createLogger('SupervisorApp') : console
const performanceMonitor = typeof getPerformanceMonitor === 'function' ? getPerformanceMonitor() : null

function App() {
  useEffect(() => {
    logger?.info?.('Supervisor attendance app initialized')
    performanceMonitor?.initialize?.()
    return () => {
      performanceMonitor?.cleanup?.()
    }
  }, [])

  // ─── Inline notification & modal state ──────────────────────────────────────
  const [notification, setNotification] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false)
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [isSheetsSyncOpen, setIsSheetsSyncOpen] = useState(false)
  const [arrivedEmployee, setArrivedEmployee] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const notify = useCallback((type, message) => {
    setNotification({ type, message })
  }, [])

  const showConfirm = useCallback((opts) => {
    setConfirmModal({
      ...opts,
      onCancel: () => setConfirmModal(null),
    })
  }, [])

  // ─── Core state & handlers ──────────────────────────────────────────────────
  const state = useAttendanceState()
  const handlers = useAttendanceHandlers({ ...state, notify, showConfirm })

  // ─── Filters & Statistics ───────────────────────────────────────────────────
  const { filteredEmployees } = useFilters(
    state.employees,
    state.vehicles,
    state.searchQuery,
    state.categoryFilter,
    state.attendanceFilter,
    state.alphabetFilter
  )

  const statistics = useStatistics(state.employees, state.vehicles)

  // ─── Sorting ────────────────────────────────────────────────────────────────
  const { sortConfig, handleSort, sortData } = useTableSort()
  const sortedEmployees = sortData(filteredEmployees, state.categoryFilter, state.employees)

  // Pure attendance categories
  const categories = ['All', 'Workers', 'Drivers', 'Chalan Men', 'Extra Labour', 'Office']
  const attendanceFilters = ['All', 'Present', 'Absent']
  const alphabetFilters = ['All', 'A-D', 'E-H', 'I-L', 'M-P', 'Q-T', 'U-Z']

  const resetFilters = () => {
    state.setSearchQuery('')
    state.setCategoryFilter('All')
    state.setAttendanceFilter('All')
    state.setAlphabetFilter('All')
  }

  const handleDownloadPDF = async () => {
    try {
      notify('info', 'Generating PDF report, please wait...')
      const { generateAttendanceReport } = await import('./components/pdf/pdfHandler')
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
      })
      notify('success', 'PDF attendance report downloaded!')
    } catch (err) {
      logger.error('Failed to generate PDF', { error: err.message })
      notify('error', 'Failed to generate PDF report.')
    }
  }

  const handleFinalizeAttendance = () => {
    const success = handlers.handleFinalizeAttendance(statistics.completedCount, statistics.totalCount)
    if (success) {
      state.setIsAttendanceFinalized(true)
      notify('success', 'Attendance finalized and locked for this shift.')
    }
  }

  const handleResetAttendanceFinalization = () => {
    state.setIsAttendanceFinalized(false)
    state.setIsSheetFinalized(false)
    notify('success', 'Attendance unlocked! Supervisors can now edit marks.')
  }

  const handleLoginSuccess = () => {
    logger.info('User login successful')
    window.location.reload()
  }

  const handleLogout = () => {
    logger.info('User logout')
    authService.logout()
    window.location.reload()
  }

  const handleLoadDayValues = useCallback((dateStr) => {
    if (!dateStr) return
    const parts = dateStr.split('-')
    const formattedDDMMYYYY = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr
    notify('success', `Loaded expected attendance values for ${formattedDDMMYYYY}`)
  }, [notify])

  // ─── Auth & Loading Gates ───────────────────────────────────────────────────
  if (!state.isAuthenticated && !state.isLoading) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading live attendance system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden">
      {/* ── Toast notification ── */}
      <Toast notification={notification} onDismiss={() => setNotification(null)} />

      {/* ── Inline confirm modal ── */}
      <ConfirmModal confirmModal={confirmModal} />

      {/* ── Mobile Top Header Bar ── */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 text-xs font-bold border border-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <span>☰</span>
          <span>Filters</span>
        </button>
        <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
          <span>📱 Live Attendance</span>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
            {statistics.onTimeCount + statistics.arrivedCount}/{statistics.totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => state.setShowRightPanel(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1 text-xs font-bold border border-slate-700 active:scale-95 transition-transform cursor-pointer"
            title="Live Stats"
          >
            <span>📊</span>
            <span>Stats</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSheetsSyncOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold active:scale-95 transition-transform cursor-pointer"
            title="Google Sheets Cloud Sync"
          >
            ⚙ Sync
          </button>
        </div>
      </div>

      {/* ── Desktop Sidebar (Always Visible on >= md) ── */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <LeftColumn
          currentDate={state.currentDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onLoadDayValues={handleLoadDayValues}
          isAttendanceLocked={state.isAttendanceLocked}
          isAttendanceFinalized={state.isAttendanceFinalized}
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
          onMarkAllPendingAbsent={handlers.handleMarkAllPendingAbsent}
          onLogout={handleLogout}
          onOpenAddEmployeeModal={() => setIsAddEmployeeModalOpen(true)}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
          onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
        />
      </div>

      {/* ── Mobile Drawer Sidebar ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 h-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <LeftColumn
              currentDate={state.currentDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onLoadDayValues={handleLoadDayValues}
              isAttendanceLocked={state.isAttendanceLocked}
              isAttendanceFinalized={state.isAttendanceFinalized}
              searchQuery={state.searchQuery}
              setSearchQuery={state.setSearchQuery}
              attendanceFilter={state.attendanceFilter}
              setAttendanceFilter={(f) => { state.setAttendanceFilter(f); setMobileMenuOpen(false); }}
              attendanceFilters={attendanceFilters}
              alphabetFilter={state.alphabetFilter}
              setAlphabetFilter={(a) => { state.setAlphabetFilter(a); setMobileMenuOpen(false); }}
              alphabetFilters={alphabetFilters}
              resetFilters={() => { resetFilters(); setMobileMenuOpen(false); }}
              pendingCount={statistics.pendingCount}
              handleFinalizeAttendance={handleFinalizeAttendance}
              handleResetAttendanceFinalization={handleResetAttendanceFinalization}
              onMarkAllPendingAbsent={() => { handlers.handleMarkAllPendingAbsent(); setMobileMenuOpen(false); }}
              onLogout={handleLogout}
              onOpenAddEmployeeModal={() => { setIsAddEmployeeModalOpen(true); setMobileMenuOpen(false); }}
              onOpenQrScanner={() => { setIsQrScannerOpen(true); setMobileMenuOpen(false); }}
              onOpenSheetsSync={() => { setIsSheetsSyncOpen(true); setMobileMenuOpen(false); }}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <Suspense fallback={null}>
        <RequestEmployeeModal
          isOpen={isAddEmployeeModalOpen}
          onClose={() => setIsAddEmployeeModalOpen(false)}
          notify={notify}
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

      {/* ── Center Column: Attendance Table ── */}
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
          filteredCount={filteredEmployees.length}
          totalCount={statistics.totalCount}
          isVehicles={false}
        />

        {/* Pure Attendance Table */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <EmployeeTable
            filteredEmployees={sortedEmployees}
            isAttendanceLocked={state.isAttendanceLocked}
            isAttendanceFinalized={state.isAttendanceFinalized}
            handleAttendance={handlers.handleAttendance}
            arrivalTimes={state.arrivalTimes}
            setArrivalTimes={state.setArrivalTimes}
            currentTime={state.currentTime}
            resetFilters={resetFilters}
            showAddWorker={state.showAddWorker}
            setShowAddWorker={state.setShowAddWorker}
            newWorker={state.newWorker}
            setNewWorker={state.setNewWorker}
            handleAddWorker={handlers.handleAddWorker}
            categoryFilter={state.categoryFilter}
            handleToggleEditMode={handlers.handleToggleEditMode}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* ── Right Column: Live Attendance Stats ── */}
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
        searchQuery={state.searchQuery}
        selectedEmployee={state.selectedEmployee}
        setSelectedEmployee={state.setSelectedEmployee}
        handleDownloadPDF={handleDownloadPDF}
      />

      <GoogleSheetsSyncModal
        isOpen={isSheetsSyncOpen}
        onClose={() => {
          logger.info('Google Sheets sync modal closed')
          setIsSheetsSyncOpen(false)
        }}
      />

      <Suspense fallback={null}>
        <CameraQrScannerModal
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          employees={state.employees}
          onScanSuccess={(empId, match) => {
            if (handlers.handleAttendance) {
              const now = new Date()
              const hours = now.getHours()
              const status = hours < 9 ? 'on_time' : 'arrived'
              const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              handlers.handleAttendance(empId, status, timeStr)
              notify('success', `✓ ${match ? match.name : empId} checked in (${status === 'on_time' ? 'On Time' : 'Arrived'})`)
            }
          }}
        />
      </Suspense>
    </div>
  )
}

export default App
