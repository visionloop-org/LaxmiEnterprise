import { memo } from 'react'

export default memo(function RightColumn({
  showRightPanel,
  setShowRightPanel,
  completedCount,
  pendingCount,
  totalCount,
  onTimeCount,
  arrivedCount,
  absentCount,
  attendanceFilter,
  setAttendanceFilter,
  sessionStartTime,
  isAttendanceLocked,
  isAttendanceFinalized,
  searchQuery,
  selectedEmployee,
  setSelectedEmployee,
  handleDownloadPDF,
}) {
  const attendanceDone = isAttendanceFinalized ?? isAttendanceLocked ?? false
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const renderDefaultContent = () => (
    <>
      {/* Real-Time Live Attendance Progress */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Live Shift Progress</span>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <button
            type="button"
            onClick={() => setAttendanceFilter('Completed')}
            className={`cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors border ${
              attendanceFilter === 'Completed' ? 'bg-blue-50 border-blue-300' : 'border-gray-100'
            }`}
          >
            <div className="text-xl font-bold text-gray-900">{completedCount}</div>
            <div className="text-[11px] font-medium text-gray-500">Completed</div>
          </button>
          <button
            type="button"
            onClick={() => setAttendanceFilter('Pending')}
            className={`cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors border ${
              attendanceFilter === 'Pending' ? 'bg-amber-50 border-amber-300' : 'border-gray-100'
            }`}
          >
            <div className="text-xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-[11px] font-medium text-gray-500">Pending</div>
          </button>
          <button
            type="button"
            onClick={() => setAttendanceFilter('All')}
            className={`cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors border ${
              attendanceFilter === 'All' ? 'bg-gray-100 border-gray-300' : 'border-gray-100'
            }`}
          >
            <div className="text-xl font-bold text-gray-900">{totalCount}</div>
            <div className="text-[11px] font-medium text-gray-500">Total</div>
          </button>
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1.5">
          <button
            type="button"
            onClick={() => setAttendanceFilter('On Time')}
            className={`w-full flex justify-between items-center text-xs p-2 rounded-lg hover:bg-emerald-50 transition-colors border ${
              attendanceFilter === 'On Time' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'border-transparent'
            }`}
          >
            <span className="text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>On Time (Present)</span>
            </span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
              {onTimeCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAttendanceFilter('Arrived')}
            className={`w-full flex justify-between items-center text-xs p-2 rounded-lg hover:bg-amber-50 transition-colors border ${
              attendanceFilter === 'Arrived' ? 'bg-amber-50 border-amber-300 font-bold' : 'border-transparent'
            }`}
          >
            <span className="text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Arrived (Late Entry)</span>
            </span>
            <span className="font-mono font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
              {arrivedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAttendanceFilter('Absent')}
            className={`w-full flex justify-between items-center text-xs p-2 rounded-lg hover:bg-rose-50 transition-colors border ${
              attendanceFilter === 'Absent' ? 'bg-rose-50 border-rose-300 font-bold' : 'border-transparent'
            }`}
          >
            <span className="text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Absent</span>
            </span>
            <span className="font-mono font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
              {absentCount}
            </span>
          </button>
        </div>
      </div>

      {/* Session Details */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
        <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">Session Details</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Started</span>
            <span className="text-gray-800 font-medium">{sessionStartTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Shift</span>
            <span className="text-gray-800 font-semibold bg-gray-100 px-2 py-0.5 rounded">Shift A</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Gate Status</span>
            <span className={`font-semibold ${attendanceDone ? 'text-emerald-700' : 'text-blue-700'}`}>
              {attendanceDone ? '✓ Finalized & Locked' : '● Live Gate Open'}
            </span>
          </div>
        </div>
      </div>
    </>
  )

  const renderEmployeeContent = () => (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
      <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">Worker Details</div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-blue-100 text-blue-800 font-bold rounded-full flex items-center justify-center text-sm border border-blue-200">
          {selectedEmployee?.name?.split(' ').map(n => n[0]).join('') || 'EMP'}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm">{selectedEmployee?.name}</div>
          <div className="text-xs text-gray-500 font-mono">{selectedEmployee?.id}</div>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Category</span>
          <span className="text-gray-800 font-semibold bg-slate-100 px-2 py-0.5 rounded">
            {selectedEmployee?.category}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Attendance</span>
          <span className={`font-bold px-2 py-0.5 rounded ${
            selectedEmployee?.attendance === 'on_time' ? 'bg-emerald-100 text-emerald-800' :
            selectedEmployee?.attendance === 'arrived' ? 'bg-amber-100 text-amber-800' :
            selectedEmployee?.attendance === 'absent' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-500'
          }`}>
            {selectedEmployee?.attendance ? (
              selectedEmployee.attendance === 'on_time' ? 'On Time' :
              selectedEmployee.attendance === 'arrived' ? 'Arrived' : 'Absent'
            ) : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  )

  const renderSearchContent = () => (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
      <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Search Results</div>
      <div className="text-sm text-gray-600">
        Filtered by: <span className="font-semibold text-blue-600 font-mono">"{searchQuery}"</span>
      </div>
    </div>
  )

  return (
    <>
      {showRightPanel && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm lg:static lg:bg-transparent lg:z-auto lg:backdrop-blur-none"
          onClick={() => {
            setShowRightPanel(false)
            setSelectedEmployee?.(null)
          }}
        >
          <div 
            className="w-80 sm:w-88 lg:w-64 flex-shrink-0 border-l border-gray-200 p-4 flex flex-col bg-gray-50 h-full overflow-y-auto max-h-screen shadow-2xl lg:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">
                {selectedEmployee ? 'Worker Summary' : 'Live Attendance Telemetry'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowRightPanel(false)
                  setSelectedEmployee?.(null)
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                title="Close panel"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedEmployee ? renderEmployeeContent() : searchQuery ? renderSearchContent() : renderDefaultContent()}

            {/* Download PDF Button */}
            {attendanceDone && !selectedEmployee && !searchQuery && (
              <button
                onClick={handleDownloadPDF}
                className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer text-xs"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Attendance Report
              </button>
            )}

            {/* Auto-save Status */}
            <div className="mt-auto pt-4 text-xs text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Synced</span>
              </div>
              <span className="font-mono text-[11px] text-gray-400">
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Summary Button on Mobile when Panel is Closed */}
      {!showRightPanel && (
        <button
          type="button"
          onClick={() => setShowRightPanel(true)}
          className="lg:hidden fixed right-4 bottom-5 z-40 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-full shadow-lg active:scale-95 transition flex items-center gap-1.5 text-xs font-bold border border-blue-400 cursor-pointer"
          title="Open Live Attendance Summary"
        >
          <span>📊</span>
          <span>Attendance Stats</span>
        </button>
      )}
    </>
  )
})
