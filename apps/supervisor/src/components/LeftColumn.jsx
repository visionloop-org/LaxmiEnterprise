import { InstallAppButton, useGoogleSheetsLiveSync, authService } from '@laxmi/shared'

export default function LeftColumn({
  currentDate,
  selectedDate,
  setSelectedDate,
  onLoadDayValues,
  isAttendanceLocked,
  isAttendanceFinalized,
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
  onMarkAllPendingAbsent,
  onLogout,
  onOpenAddEmployeeModal,
  onOpenQrScanner,
  onOpenSheetsSync,
  onCloseMobile
}) {
  const currentUser = authService.getUser()
  const attendanceDone = isAttendanceFinalized ?? isAttendanceLocked ?? false

  const { isSyncing, lastSyncTime, syncNow } = useGoogleSheetsLiveSync({
    autoSync: true,
    intervalMs: 20000
  })

  return (
    <div className="w-72 md:w-64 flex-shrink-0 border-r border-gray-200 p-4 flex flex-col overflow-y-auto max-h-screen scrollbar-thin bg-white">
      {/* Session Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900">Live Attendance</h1>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 text-sm font-bold cursor-pointer"
              title="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Active Authorized User Profile Pill */}
        <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs shadow-sm">
          <span className="text-sm">👤</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white truncate text-[11px]">
              {currentUser?.name || 'Ruhil Jaiswal'}
            </div>
            <div className="text-[10px] text-sky-400 font-medium">Shift Supervisor</div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/40 uppercase">
            Live
          </span>
        </div>
        
        {/* PWA Install Button & Google Sheets Cloud Status */}
        <div className="mb-2 flex flex-col gap-1.5">
          <InstallAppButton
            label="Install Tablet App"
            variant="slate"
            className="w-full text-center"
            style={{ width: '100%', justifyContent: 'center' }}
          />

          <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-sky-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span>{isSyncing ? 'Syncing...' : 'Google Sheets'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => syncNow()}
                disabled={isSyncing}
                className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded border border-emerald-300 cursor-pointer flex items-center gap-1"
                title={`Pull latest updates directly from Google Sheets${lastSyncTime ? ` (Last: ${new Date(lastSyncTime).toLocaleTimeString()})` : ''}`}
              >
                <span className={isSyncing ? 'animate-spin inline-block' : ''}>🔄</span>
                <span>{isSyncing ? 'Sync' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenSheetsSync}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline bg-transparent border-0 cursor-pointer p-0"
                title="Open Google Sheets Sync & Status Settings"
              >
                ⚙
              </button>
            </div>
          </div>
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

        {/* Attendance Status Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Attendance Gate:</span>
            <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
              attendanceDone
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {attendanceDone ? '✓ Finalized & Locked' : '● Live Gate Open'}
            </span>
          </div>
        </div>
      </div>

      {/* Camera QR Scanner Gate Check-in */}
      <button
        onClick={onOpenQrScanner}
        className="w-full px-3 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors mb-2 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
        title="Scan worker ID badge using device camera"
      >
        <span>📷 Camera QR Gate Check-in</span>
      </button>

      {/* Quick Action: Mark All Remaining Pending as Absent */}
      {pendingCount > 0 && !attendanceDone && (
        <button
          type="button"
          onClick={onMarkAllPendingAbsent}
          className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors mb-2 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          title="Mark all unpunched workers as absent"
        >
          <span>🔴</span>
          <span>Mark Remaining Absent ({pendingCount})</span>
        </button>
      )}

      {/* Add Employee Request Button (Supervisor Rights) */}
      <button
        onClick={onOpenAddEmployeeModal}
        className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors mb-3 flex items-center justify-center gap-1 shadow-sm"
      >
        <span>➕ Request New Employee</span>
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
            placeholder="Search workers..."
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
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors mb-2"
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

      {/* ─── ATTENDANCE FINALIZATION CONTROLS ─── */}
      <div className="mt-auto pt-2">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>📋</span> Attendance Gate
            </span>
            {attendanceDone && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                Fixed &amp; Locked
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Fixes all attendance marks (Present/Arrived/Absent) for the shift.
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
              <div className="text-center py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded border border-emerald-200">
                ✓ Attendance Finalized
              </div>
              {handleResetAttendanceFinalization && (
                <button
                  type="button"
                  onClick={handleResetAttendanceFinalization}
                  className="w-full py-1.5 px-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  title="Unlock attendance so supervisors can edit"
                >
                  <span>🔓</span> Unlock Attendance
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
