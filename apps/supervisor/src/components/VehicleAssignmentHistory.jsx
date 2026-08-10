import { memo } from 'react'

function VehicleAssignmentHistory({ vehicle, employees, onClose }) {
  const assignments = employees.filter(e => e.assignedVehicle === vehicle.id)
  const driverCount = assignments.filter(e => e.category === 'Drivers').length
  const chalanManCount = assignments.filter(e => e.category === 'Chalan Men').length
  const workerCount = assignments.filter(e => 
    e.category === 'Workers' || e.category === 'Extra Labour'
  ).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {vehicle.number} ({vehicle.type})
            </h3>
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
        
        <div className="px-6 py-4">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Assignments:</span>
              <span className="font-semibold">{assignments.length}/8</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className={`h-full rounded-full ${
                  assignments.length >= 8 ? 'bg-red-500' : assignments.length >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((assignments.length / 8) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Current Assignments</h4>
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No employees assigned</p>
            ) : (
              assignments.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    emp.category === 'Drivers' ? 'bg-blue-100 text-blue-800' :
                    emp.category === 'Chalan Men' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {emp.category}
                  </span>
                </div>
              ))
            )}
          </div>

          {vehicle.statusHistory && vehicle.statusHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Status History</h4>
              <div className="max-h-32 overflow-y-auto">
                {vehicle.statusHistory.slice().reverse().map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-gray-100">
                    <span className={`font-medium ${
                      entry.status === 'available' ? 'text-green-600' :
                      entry.status === 'in_use' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {entry.status}
                    </span>
                    <span className="text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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

export default memo(VehicleAssignmentHistory)
