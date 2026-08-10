import { memo } from 'react'

function CapacityConflictModal({ conflict, onResolve, onCancel }) {
  const { employee, vehicle, reason, suggestions } = conflict

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Capacity Conflict</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-medium">{reason}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                <p className="text-xs text-gray-500">{employee.category}</p>
              </div>
              <span className="text-xs text-gray-400">→</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{vehicle.number}</p>
                <p className="text-xs text-gray-500">{vehicle.type}</p>
              </div>
            </div>

            {suggestions && suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Solutions</h4>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onResolve(suggestion)}
                      className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-blue-900">{suggestion.title}</p>
                      <p className="text-xs text-blue-700">{suggestion.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Alternative Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => onResolve({ action: 'chooseDifferentVehicle' })}
                  className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">Choose Different Vehicle</p>
                  <p className="text-xs text-gray-600">Select another vehicle with available capacity</p>
                </button>
                <button
                  onClick={() => onResolve({ action: 'swapEmployee' })}
                  className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">Swap with Existing Employee</p>
                  <p className="text-xs text-gray-600">Replace an existing assignment on this vehicle</p>
                </button>
                <button
                  onClick={() => onResolve({ action: 'cancel' })}
                  className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">Cancel Assignment</p>
                  <p className="text-xs text-gray-600">Keep employee unassigned for now</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(CapacityConflictModal)
