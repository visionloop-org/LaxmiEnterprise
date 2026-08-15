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
  isSheetFinalized,
  minDemandCount = 0,
  maxDemandCount = 0,
  searchQuery,
  selectedEmployee,
  setSelectedEmployee,
  handleDownloadPDF,
  assignedVehicles,
  averageVehicleUtilization,
  fullyUtilizedVehicles,
  underUtilizedVehicles,
  lockedVehicles
}) {
  const attendanceDone = isAttendanceFinalized ?? isAttendanceLocked ?? false
  const sheetDone = isSheetFinalized ?? false

  const renderDefaultContent = () => (
    <>
      {/* Unified Session Summary */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-700 mb-2">Today's Progress</div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <button
            onClick={() => setAttendanceFilter('Completed')}
            className={`cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors ${attendanceFilter === 'Completed' ? 'bg-blue-100' : ''}`}
          >
            <div className="text-lg font-semibold text-gray-900">{completedCount}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </button>
          <button
            onClick={() => setAttendanceFilter('Pending')}
            className={`cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors ${attendanceFilter === 'Pending' ? 'bg-blue-100' : ''}`}
          >
            <div className="text-lg font-semibold text-orange-600">{pendingCount}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </button>
          <button
            onClick={() => setAttendanceFilter('All')}
            className={`cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors ${attendanceFilter === 'All' ? 'bg-blue-100' : ''}`}
          >
            <div className="text-lg font-semibold text-gray-900">{totalCount}</div>
            <div className="text-xs text-gray-500">Total</div>
          </button>
        </div>
        <div className="border-t border-gray-200 pt-3 space-y-1">
          <button
            onClick={() => setAttendanceFilter('On Time')}
            className={`w-full flex justify-between text-xs p-1 rounded hover:bg-gray-100 transition-colors ${attendanceFilter === 'On Time' ? 'bg-green-50 font-semibold' : ''}`}
          >
            <span className="text-gray-600">🟢 On Time</span>
            <span className="font-medium text-green-600">{onTimeCount}</span>
          </button>
          <button
            onClick={() => setAttendanceFilter('Arrived')}
            className={`w-full flex justify-between text-xs p-1 rounded hover:bg-gray-100 transition-colors ${attendanceFilter === 'Arrived' ? 'bg-amber-50 font-semibold' : ''}`}
          >
            <span className="text-gray-600">🟡 Arrived</span>
            <span className="font-medium text-amber-600">{arrivedCount}</span>
          </button>
          <button
            onClick={() => setAttendanceFilter('Absent')}
            className={`w-full flex justify-between text-xs p-1 rounded hover:bg-gray-100 transition-colors ${attendanceFilter === 'Absent' ? 'bg-red-50 font-semibold' : ''}`}
          >
            <span className="text-gray-600">🔴 Absent</span>
            <span className="font-medium text-red-600">{absentCount}</span>
          </button>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-700 mb-2">Session Info</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Started</span>
            <span className="text-gray-700">{sessionStartTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Shift</span>
            <span className="text-gray-700">Shift A</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Attendance</span>
            <span className={`font-semibold ${attendanceDone ? 'text-emerald-600' : 'text-blue-600'}`}>
              {attendanceDone ? '✓ Finalized' : 'In Progress'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Daily Sheet</span>
            <span className={`font-semibold ${sheetDone ? 'text-purple-600' : 'text-slate-600'}`}>
              {sheetDone ? '🔒 Finalized' : 'In Progress'}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-1.5">
            <span className="text-gray-500">Labour Demands</span>
            <span className="font-medium text-slate-700">
              Min: {minDemandCount} | Max: {maxDemandCount}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Efficiency Metrics */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-700 mb-2">Vehicle Efficiency</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Assigned</span>
            <span className="text-gray-700">{assignedVehicles?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Avg Utilization</span>
            <span className={`font-medium ${averageVehicleUtilization >= 75 ? 'text-green-600' : averageVehicleUtilization >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {averageVehicleUtilization}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Full Capacity</span>
            <span className="text-gray-700">{fullyUtilizedVehicles}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Under Utilized</span>
            <span className="text-orange-600">{underUtilizedVehicles}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Locked</span>
            <span className="text-red-600">{lockedVehicles}</span>
          </div>
        </div>
      </div>
    </>
  )

  const renderEmployeeContent = () => (
    <>
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-700 mb-2">Employee Details</div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm">
            {selectedEmployee?.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{selectedEmployee?.name}</div>
            <div className="text-xs text-gray-500">{selectedEmployee?.id}</div>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Category</span>
            <span className="text-gray-700">{selectedEmployee?.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Attendance</span>
            <span className={`font-medium ${
              selectedEmployee?.attendance === 'on_time' ? 'text-green-600' :
              selectedEmployee?.attendance === 'arrived' ? 'text-amber-600' :
              selectedEmployee?.attendance === 'absent' ? 'text-red-600' : 'text-gray-400'
            }`}>
              {selectedEmployee?.attendance ? (
                selectedEmployee.attendance === 'on_time' ? 'On Time' :
                selectedEmployee.attendance === 'arrived' ? 'Arrived' : 'Absent'
              ) : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </>
  )

  const renderSearchContent = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="text-xs font-semibold text-gray-700 mb-2">Search Results</div>
      <div className="text-sm text-gray-600">
        Searching for: <span className="font-medium">{searchQuery}</span>
      </div>
    </div>
  )

  const renderFinalizationContent = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="text-xs font-semibold text-gray-700 mb-2">Finalization Status</div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Pending</span>
          <span className="font-medium text-orange-600">{pendingCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ready</span>
          <span className={`font-medium ${pendingCount === 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {pendingCount === 0 ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {showRightPanel && (
        <div className="w-64 flex-shrink-0 border-l border-gray-200 p-4 flex flex-col bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              {selectedEmployee ? 'Employee Details' : 'Session Context'}
            </h2>
            <button
              onClick={() => {
                setShowRightPanel(false)
                setSelectedEmployee?.(null)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedEmployee ? renderEmployeeContent() : searchQuery ? renderSearchContent() : pendingCount > 0 && attendanceDone ? renderFinalizationContent() : renderDefaultContent()}

          {/* Download PDF Button - Available when Sheet or Attendance is finalized */}
          {(sheetDone || attendanceDone) && !selectedEmployee && !searchQuery && (
            <button
              onClick={handleDownloadPDF}
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {sheetDone ? 'Download Finalized Report' : 'Download Attendance Report'}
            </button>
          )}

          {/* Auto-save Status */}
          <div className="mt-auto pt-4 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Saved</span>
            </div>
            <span>{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      )}

      {/* Toggle Right Panel Button */}
      {!showRightPanel && (
        <button
          onClick={() => setShowRightPanel(true)}
          className="fixed right-4 bottom-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </>
  )
})
