import { memo, Fragment } from 'react'

function VehicleTable({
  vehicles,
  employees,
  sortConfig,
  onSort,
  expandedVehicleId,
  setExpandedVehicleId,
  handlers,
  setSelectedEmployee,
  setShowCapacityReport,
  setEmployees
}) {
  return (
    <>
      {/* Vehicle Table Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex justify-between items-center px-4 py-2">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th 
                onClick={() => onSort('id')}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 w-[15%] cursor-pointer hover:bg-gray-100"
              >
                ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => onSort('number')}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 w-[20%] cursor-pointer hover:bg-gray-100"
              >
                Number {sortConfig.key === 'number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => onSort('type')}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 w-[15%] cursor-pointer hover:bg-gray-100"
              >
                Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => onSort('status')}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 w-[15%] cursor-pointer hover:bg-gray-100"
              >
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => onSort('capacity')}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 w-[25%] cursor-pointer hover:bg-gray-100"
              >
                Capacity {sortConfig.key === 'capacity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 w-[10%]">Actions</th>
            </tr>
          </thead>
        </table>
        <button
          onClick={handlers.validateVehicleCapacities}
          className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
        >
          Validate Capacities
        </button>
      </div>

      <table className="w-full">
        <tbody>
          {vehicles.map(vehicle => {
            const assignments = employees.filter(e => e.assignedVehicle === vehicle.id)
            const driverCount = assignments.filter(e => e.category === 'Drivers').length
            const chalanManCount = assignments.filter(e => e.category === 'Chalan Men').length
            const workerCount = assignments.filter(e => 
              e.category === 'Workers' || e.category === 'Extra Labour'
            ).length
            const totalAssignments = assignments.length
            const utilizationPercentage = Math.round((totalAssignments / 8) * 100)

            const hasDriverViolation = driverCount > 1
            const hasChalanViolation = chalanManCount > 1
            const hasWorkerViolation = workerCount > 6
            const hasViolation = hasDriverViolation || hasChalanViolation || hasWorkerViolation

            const isExpanded = expandedVehicleId === vehicle.id

            return (
              <Fragment key={vehicle.id}>
                <tr className={`border-b border-gray-200 hover:bg-gray-50 ${vehicle.locked ? 'bg-red-50' : ''} ${hasViolation ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-2 text-sm text-gray-500">{vehicle.id}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{vehicle.number}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{vehicle.type}</td>
                  <td className="px-4 py-2">
                    <select
                      value={vehicle.status}
                      onChange={(e) => handlers.handleVehicleStatusChange(vehicle.id, e.target.value)}
                      disabled={vehicle.locked}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border-0 focus:ring-0 ${
                        vehicle.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : vehicle.status === 'in_use'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      } disabled:opacity-50`}
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="font-medium">D:</span> 
                          <span className={driverCount > 1 ? 'text-red-600 font-bold' : driverCount >= 1 ? 'text-green-600' : 'text-gray-400'}>{driverCount}/1</span>
                          <span className="font-medium ml-2">C:</span> 
                          <span className={chalanManCount > 1 ? 'text-red-600 font-bold' : chalanManCount >= 1 ? 'text-green-600' : 'text-gray-400'}>{chalanManCount}/1</span>
                          <span className="font-medium ml-2">W:</span> 
                          <span className={workerCount > 6 ? 'text-red-600 font-bold' : workerCount >= 4 ? (workerCount >= 6 ? 'text-red-600' : 'text-yellow-600') : 'text-gray-400'}>{workerCount}/6</span>
                          <span className="ml-2 text-gray-400">({utilizationPercentage}%)</span>
                        </div>
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              totalAssignments >= 8 ? 'bg-red-500' : totalAssignments >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((totalAssignments / 8) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      {hasViolation && (
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedVehicleId(null)
                            } else {
                              setExpandedVehicleId(vehicle.id)
                            }
                          }}
                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            isExpanded 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                          title={isExpanded ? "Violations fixed" : "View and fix capacity violations"}
                        >
                          {isExpanded ? '✓ Fixed' : 'Fix Violations'}
                        </button>
                      )}
                      {vehicle.locked && (
                        <button
                          onClick={() => handlers.handleUnlockVehicle(vehicle.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors"
                          title="Unlock vehicle to allow more assignments"
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedVehicleId(isExpanded ? null : vehicle.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {isExpanded ? 'Hide' : 'Show'} Assignments
                      </button>
                      <button
                        onClick={() => setSelectedEmployee(vehicle)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View History
                      </button>
                      <button
                        onClick={handlers.handleExportVehicleAssignments}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        title="Export all vehicle assignments to CSV"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => setShowCapacityReport(true)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        title="View capacity report"
                      >
                        Report
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan="6" className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700 mb-2">
                          Assigned Employees ({assignments.length})
                        </div>
                        {assignments.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">No employees assigned</p>
                        ) : (
                          <div className="space-y-1">
                            {assignments.map(emp => (
                              <div key={emp.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-900">{emp.name}</span>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    emp.category === 'Drivers' ? 'bg-blue-100 text-blue-800' :
                                    emp.category === 'Chalan Men' ? 'bg-purple-100 text-purple-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {emp.category}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setEmployees(prev => prev.map(e => 
                                      e.id === emp.id ? { ...e, assignedVehicle: null } : e
                                    ))
                                    const remainingAssignments = employees.filter(e => 
                                      e.assignedVehicle === vehicle.id && e.id !== emp.id
                                    ).length
                                    if (remainingAssignments === 0) {
                                      handlers.handleVehicleStatusChange(vehicle.id, 'available')
                                    }
                                  }}
                                  className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

export default memo(VehicleTable)
