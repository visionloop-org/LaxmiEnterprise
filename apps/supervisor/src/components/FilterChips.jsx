import { memo } from 'react'

function FilterChips({ 
  categoryFilter, 
  attendanceFilter, 
  alphabetFilter, 
  searchQuery, 
  setCategoryFilter, 
  setAttendanceFilter, 
  setAlphabetFilter, 
  setSearchQuery, 
  setShowAddWorker, 
  isAttendanceLocked,
  statistics,
  filteredCount,
  totalCount,
  isVehicles
}) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-700">
          Showing {filteredCount} of {totalCount} {isVehicles ? 'vehicles' : 'employees'}
        </span>
        {categoryFilter === 'Extra Labour' && !isAttendanceLocked && (
          <button
            onClick={() => setShowAddWorker(true)}
            className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Add Worker
          </button>
        )}
        {categoryFilter !== 'All' && (
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <span className="text-xs font-medium text-blue-600">Category:</span>
            <span>{categoryFilter} ({statistics.getCategoryCount(categoryFilter)})</span>
            <button
              onClick={() => setCategoryFilter('All')}
              className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {attendanceFilter !== 'All' && (
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
            <span className="text-xs font-medium text-orange-600">Status:</span>
            <span>{attendanceFilter} ({statistics.getAttendanceCount(attendanceFilter)})</span>
            <button
              onClick={() => setAttendanceFilter('All')}
              className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {alphabetFilter !== 'All' && (
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            <span className="text-xs font-medium text-purple-600">Alphabet:</span>
            <span>{alphabetFilter} ({statistics.getAlphabetCount(alphabetFilter)})</span>
            <button
              onClick={() => setAlphabetFilter('All')}
              className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {searchQuery && (
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-600">Search:</span>
            <span>{searchQuery} ({statistics.getSearchCount(searchQuery)})</span>
            <button
              onClick={() => setSearchQuery('')}
              className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {categoryFilter === 'All' && attendanceFilter === 'All' && alphabetFilter === 'All' && !searchQuery && (
          <span className="text-sm text-gray-400 italic">No Active Filters</span>
        )}
      </div>
    </div>
  )
}

export default memo(FilterChips)
