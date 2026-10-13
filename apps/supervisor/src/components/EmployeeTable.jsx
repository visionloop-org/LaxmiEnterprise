import { memo } from 'react'
import EmployeeRow from './EmployeeRow'
import EmployeeCard from './EmployeeCard'

function EmployeeTable({
  filteredEmployees,
  isAttendanceLocked,
  isAttendanceFinalized,
  handleAttendance,
  arrivalTimes,
  setArrivalTimes,
  currentTime,
  resetFilters,
  showAddWorker,
  setShowAddWorker,
  newWorker,
  setNewWorker,
  handleAddWorker,
  categoryFilter,
  handleToggleEditMode,
  sortConfig,
  onSort
}) {
  const commonProps = {
    isAttendanceLocked,
    isAttendanceFinalized,
    handleAttendance,
    arrivalTimes,
    setArrivalTimes,
    currentTime,
    handleToggleEditMode,
  }

  return (
    <div>
      {/* ── Mobile Layout (< md): Touch-Friendly Employee Cards ── */}
      <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
        {/* Extra Labour Inline Worker Add on Mobile */}
        {categoryFilter === 'Extra Labour' && showAddWorker && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2.5 shadow-sm">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Add Temporary Worker (Today)
            </h4>
            <input
              type="text"
              placeholder="Worker Name *"
              value={newWorker.name}
              onChange={(e) => setNewWorker(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Contractor (Optional)"
              value={newWorker.contractor}
              onChange={(e) => setNewWorker(prev => ({ ...prev, contractor: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Remarks (Optional)"
              value={newWorker.remarks}
              onChange={(e) => setNewWorker(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddWorker}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold active:scale-95 transition"
              >
                ✓ Save Worker
              </button>
              <button
                type="button"
                onClick={() => setShowAddWorker(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold active:scale-95 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {filteredEmployees.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-base font-bold text-gray-900 mb-1">No employees found</h3>
            <p className="text-xs text-gray-500 mb-4">Try adjusting your filters or category</p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold active:scale-95 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              {...commonProps}
            />
          ))
        )}
      </div>

      {/* ── Desktop & Tablet Layout (>= md): Pure Attendance Table ── */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
            <tr className="bg-gray-50">
              <th 
                onClick={() => onSort('id')}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[8%] cursor-pointer hover:bg-gray-100"
              >
                ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[8%]">Photo</th>
              <th 
                onClick={() => onSort('name')}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[30%] cursor-pointer hover:bg-gray-100"
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => onSort('category')}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[18%] cursor-pointer hover:bg-gray-100"
              >
                Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => onSort('attendance')}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-[28%] cursor-pointer hover:bg-gray-100"
              >
                Attendance {sortConfig.key === 'attendance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-[8%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search query</p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, index) => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  index={index}
                  {...commonProps}
                />
              ))
            )}

            {/* Extra Labour Add Worker for Desktop */}
            {categoryFilter === 'Extra Labour' && showAddWorker && (
              <tr className="bg-blue-50 border-b border-gray-200">
                <td colSpan="4" className="px-4 py-4">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Worker Name"
                      value={newWorker.name}
                      onChange={(e) => setNewWorker(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Contractor (optional)"
                      value={newWorker.contractor}
                      onChange={(e) => setNewWorker(prev => ({ ...prev, contractor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      value={newWorker.remarks}
                      onChange={(e) => setNewWorker(prev => ({ ...prev, remarks: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddWorker}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Add Worker
                      </button>
                      <button
                        onClick={() => setShowAddWorker(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </td>
                <td colSpan="2" className="px-4 py-4">
                  <div className="text-sm text-gray-500">
                    Adding temporary worker for today
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default memo(EmployeeTable)
