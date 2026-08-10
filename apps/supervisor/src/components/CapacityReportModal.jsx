import { memo } from 'react'

function CapacityReportModal({ vehicles, employees, onClose }) {
  const vehicleCapacityData = vehicles.map(vehicle => {
    const assignments = employees.filter(e => e.assignedVehicle === vehicle.id)
    const driverCount = assignments.filter(e => e.category === 'Drivers').length
    const chalanManCount = assignments.filter(e => e.category === 'Chalan Men').length
    const workerCount = assignments.filter(e => 
      e.category === 'Workers' || e.category === 'Extra Labour'
    ).length
    const totalAssignments = assignments.length
    const utilizationPercentage = Math.round((totalAssignments / 8) * 100)
    
    let status = 'optimal'
    if (totalAssignments === 0) status = 'empty'
    else if (totalAssignments < 4) status = 'under'
    else if (totalAssignments >= 8) status = 'full'
    else if (vehicle.locked) status = 'locked'
    
    return {
      vehicle,
      driverCount,
      chalanManCount,
      workerCount,
      totalAssignments,
      utilizationPercentage,
      status,
      assignments
    }
  })

  const emptyVehicles = vehicleCapacityData.filter(v => v.status === 'empty')
  const underUtilizedVehicles = vehicleCapacityData.filter(v => v.status === 'under')
  const optimalVehicles = vehicleCapacityData.filter(v => v.status === 'optimal')
  const fullVehicles = vehicleCapacityData.filter(v => v.status === 'full')
  const lockedVehicles = vehicleCapacityData.filter(v => v.status === 'locked')

  const getStatusColor = (status) => {
    switch (status) {
      case 'empty': return 'bg-gray-100 text-gray-800'
      case 'under': return 'bg-orange-100 text-orange-800'
      case 'optimal': return 'bg-green-100 text-green-800'
      case 'full': return 'bg-red-100 text-red-800'
      case 'locked': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Capacity Report</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-700">{emptyVehicles.length}</div>
              <div className="text-xs text-gray-500">Empty</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{underUtilizedVehicles.length}</div>
              <div className="text-xs text-gray-500">Under Utilized</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{optimalVehicles.length}</div>
              <div className="text-xs text-gray-500">Optimal</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{fullVehicles.length}</div>
              <div className="text-xs text-gray-500">Full</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{lockedVehicles.length}</div>
              <div className="text-xs text-gray-500">Locked</div>
            </div>
          </div>

          {/* Detailed Report */}
          <div className="space-y-4">
            {emptyVehicles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Empty Vehicles ({emptyVehicles.length})</h4>
                <div className="space-y-2">
                  {emptyVehicles.map(({ vehicle }) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{vehicle.number} ({vehicle.type})</span>
                      <span className="text-xs text-gray-500">No assignments</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {underUtilizedVehicles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Under Utilized Vehicles ({underUtilizedVehicles.length})</h4>
                <div className="space-y-2">
                  {underUtilizedVehicles.map(({ vehicle, totalAssignments, assignments }) => (
                    <div key={vehicle.id} className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{vehicle.number} ({vehicle.type})</span>
                        <span className="text-xs text-orange-600 font-medium">{totalAssignments}/8 ({Math.round((totalAssignments / 8) * 100)}%)</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {assignments.map(emp => emp.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optimalVehicles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Optimal Vehicles ({optimalVehicles.length})</h4>
                <div className="space-y-2">
                  {optimalVehicles.map(({ vehicle, totalAssignments, assignments }) => (
                    <div key={vehicle.id} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{vehicle.number} ({vehicle.type})</span>
                        <span className="text-xs text-green-600 font-medium">{totalAssignments}/8 ({Math.round((totalAssignments / 8) * 100)}%)</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {assignments.map(emp => emp.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fullVehicles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Full Capacity Vehicles ({fullVehicles.length})</h4>
                <div className="space-y-2">
                  {fullVehicles.map(({ vehicle, assignments }) => (
                    <div key={vehicle.id} className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{vehicle.number} ({vehicle.type})</span>
                        <span className="text-xs text-red-600 font-medium">8/8 (100%)</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {assignments.map(emp => emp.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lockedVehicles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Locked Vehicles ({lockedVehicles.length})</h4>
                <div className="space-y-2">
                  {lockedVehicles.map(({ vehicle, totalAssignments, assignments }) => (
                    <div key={vehicle.id} className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{vehicle.number} ({vehicle.type})</span>
                        <span className="text-xs text-purple-600 font-medium">{totalAssignments}/8 ({Math.round((totalAssignments / 8) * 100)}%)</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {assignments.map(emp => emp.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(CapacityReportModal)
