export default function LeftColumn({
  currentDate,
  selectedDate,
  setSelectedDate,
  onLoadDayValues,
  isAttendanceLocked,
  isAttendanceFinalized,
  isSheetFinalized,
  searchQuery,
  setSearchQuery,
  attendanceFilter,
  setAttendanceFilter,
  attendanceFilters,
  alphabetFilter,
  setAlphabetFilter,
  alphabetFilters,
  resetFilters,
  pendingCount,
  handleFinalizeAttendance,
  handleResetAttendanceFinalization,
  handleFinalizeSheet,
  minDemandCount = 0,
  maxDemandCount = 0,
  pendingDemandCount = 0,
  assignedVehiclesCount = 0,
  onLogout,
  onOpenAddEmployeeModal,
  onOpenTripTracker
}) {
  const attendanceDone = isAttendanceFinalized ?? isAttendanceLocked ?? false
  const sheetDone = isSheetFinalized ?? false

  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 p-4 flex flex-col overflow-y-auto max-h-screen scrollbar-thin">
      {/* Session Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Supervisor Attendance</h1>
        
        {/* Odoo 18 Backend Status Badge */}
        <div className="mb-2 px-2.5 py-1.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold text-purple-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Odoo 18 ERP Backend</span>
          </div>
          <a
            href="http://localhost:8069"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-purple-700 hover:text-purple-900 font-bold underline"
            title="Open Odoo ERP Kiosk & HR Attendance"
          >
            Kiosk Mode ↗
          </a>
        </div>

        {/* Date Selector for Date-wise Tracking */}
        <div className="mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200 shadow-sm">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Date:</label>
          <input
            type="date"
            value={selectedDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-900 bg-white mb-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => onLoadDayValues && onLoadDayValues(selectedDate)}
            className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
            title="Click to fetch expected day attendance values for selected date"
          >
            <span>📥 Load Expected Day Values</span>
          </button>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
          <span className="font-semibold text-blue-700">{selectedDate || currentDate}</span>
          <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">Shift A</span>
        </div>

        {/* Dual Status Card */}
        <div className="space-y-1.5 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Attendance:</span>
            <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
              attendanceDone
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {attendanceDone ? '✓ Finalized' : 'In Progress'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Daily Sheet:</span>
            <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
              sheetDone
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : attendanceDone
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {sheetDone ? '🔒 Finalized' : attendanceDone ? '📝 Open' : '⏳ Pending'}
            </span>
          </div>
        </div>

      </div>

      {/* Add Employee Request Button (Supervisor Rights) */}
      <button
        onClick={onOpenAddEmployeeModal}
        className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors mb-2 flex items-center justify-center gap-1 shadow-sm"
      >
        <span>➕ Request New Employee</span>
      </button>

      {/* Vehicle Trip Lifecycle Button */}
      <button
        onClick={onOpenTripTracker}
        className="w-full px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors mb-3 flex items-center justify-center gap-1 shadow-sm"
      >
        <span>🚚 Vehicle Trip Tracking</span>
      </button>

      <div className="border-t border-gray-200 my-2"></div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Attendance Filter */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
        <select
          value={attendanceFilter}
          onChange={(e) => setAttendanceFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {attendanceFilters.map(filter => (
            <option key={filter} value={filter}>{filter}</option>
          ))}
        </select>
      </div>

      {/* Alphabet Filter */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-700 mb-1">Alphabet</label>
        <select
          value={alphabetFilter}
          onChange={(e) => setAlphabetFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          {alphabetFilters.map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>
      </div>

      {/* Reset Filters */}
      <button
        onClick={resetFilters}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors mb-4"
      >
        Reset Filters
      </button>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full px-3 py-2 border border-red-300 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors mb-4"
      >
        Logout
      </button>

      <div className="border-t border-gray-200 my-2"></div>

      {/* ─── TWO-CATEGORY FINALIZATION CONTROLS ─── */}
      <div className="space-y-3 mt-auto pt-2">
        {/* Category 1: Attendance Finalization */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>📋</span> 1. Attendance
            </span>
            {attendanceDone && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                Fixed &amp; Locked
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Fixes attendance marks (Present/Arrived/Absent).
          </p>

          {!attendanceDone ? (
            <button
              onClick={handleFinalizeAttendance}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm ${
                pendingCount === 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {pendingCount === 0 ? (
                'Finalize Attendance'
              ) : (
                <span>Finalize Attendance ({pendingCount} Pending)</span>
              )}
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="text-center py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
                ✓ Attendance Finalized
              </div>
              {handleResetAttendanceFinalization && (
                <button
                  type="button"
                  onClick={handleResetAttendanceFinalization}
                  className="w-full py-1.5 px-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  title="Unlock and reset attendance finalization so supervisors can edit"
                >
                  <span>🔓</span> Reset / Unlock Finalization
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category 2: Sheet Finalization */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>📑</span> 2. Daily Sheet
            </span>
            {sheetDone && (
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-300">
                Full Lock
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Locks Min/Max labour requests and vehicle assignments.
          </p>

          {/* Min/Max Status Summary Widget */}
          <div className="bg-white rounded-lg p-2 border border-slate-200 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Min / Max Demands:</span>
              <span className="font-semibold text-slate-800">
                Min: {minDemandCount} · Max: {maxDemandCount}
              </span>
            </div>
            {pendingDemandCount > 0 && !sheetDone && (
              <div className="text-[10px] text-amber-600 font-medium">
                ⚠️ {pendingDemandCount} Chalan Men demand pending
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Assigned Vehicles:</span>
              <span className="font-semibold text-slate-800">{assignedVehiclesCount}</span>
            </div>
          </div>

          {!sheetDone ? (
            <button
              onClick={handleFinalizeSheet}
              disabled={!attendanceDone}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm ${
                attendanceDone
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!attendanceDone ? 'Finalize attendance first' : 'Finalize full daily sheet'}
            >
              {attendanceDone ? 'Finalize Daily Sheet' : 'Finalize Attendance First'}
            </button>
          ) : (
            <div className="text-center py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
              🔒 Sheet Finalized &amp; Locked
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
