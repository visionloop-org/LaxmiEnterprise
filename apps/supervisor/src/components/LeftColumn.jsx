export default function LeftColumn({
  currentDate,
  selectedDate,
  setSelectedDate,
  onLoadDayValues,
  isAttendanceLocked,
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
  onLogout,
  onOpenAddEmployeeModal,
  onOpenTripTracker
}) {

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 p-4 flex flex-col">
      {/* Session Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Supervisor Attendance</h1>
        
        {/* Date Selector for Date-wise Tracking */}
        <div className="mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
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
        <div className={`text-xs font-medium px-2 py-1.5 rounded text-center leading-snug ${
          isAttendanceLocked 
            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {isAttendanceLocked ? '🔒 Finalized (Edits Locked — Admin Reset Required)' : '🔄 In Progress'}
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

      <div className="border-t border-gray-200 my-3"></div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full px-3 py-2 border border-red-300 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors mb-4"
      >
        Logout
      </button>

      <div className="border-t border-gray-200 my-3"></div>

      {/* Finalize Button */}
      {!isAttendanceLocked && (
        <button
          onClick={handleFinalizeAttendance}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            pendingCount === 0
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {pendingCount === 0 ? (
            'Finalize Attendance'
          ) : (
            <span className="flex flex-col leading-tight">
              <span>Finalize Anyway</span>
              <span className="text-xs opacity-80">{pendingCount} Pending</span>
            </span>
          )}
        </button>
      )}
    </div>
  )
}
