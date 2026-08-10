export default function LeftColumn({
  currentDate,
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
  onLogout
}) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 p-4 flex flex-col">
      {/* Session Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Supervisor Attendance Sheet</h1>
        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
          <span>{currentDate}</span>
          <span className="font-medium text-gray-700">Shift A</span>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded text-center ${
          isAttendanceLocked 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {isAttendanceLocked ? '🟢 Finalized' : '🔄 In Progress'}
        </div>
      </div>

      <div className="border-t border-gray-200 my-3"></div>

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
          {pendingCount === 0 ? 'Finalize Attendance' : `Finalize Anyway\n${pendingCount} Pending`}
        </button>
      )}
    </div>
  )
}
