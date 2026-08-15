import { memo } from 'react'
import EmployeeAvatar from './EmployeeAvatar'
import AttendanceControl from './AttendanceControl'
import VehicleSelect from './ui/VehicleSelect'
import LabourRequestButtons from './ui/LabourRequestButtons'

function EmployeeRow({
  emp,
  index,
  isAttendanceLocked,
  isAttendanceFinalized,
  isSheetFinalized,
  handleAttendance,
  arrivalTimes,
  setArrivalTimes,
  currentTime,
  vehicles,
  handleVehicleAssignment,
  handleLabourRequest,
  editedEmployees,
  handleToggleEditMode,
  employees,
  onConflict
}) {
  const attendanceLocked = isAttendanceFinalized ?? isAttendanceLocked ?? false
  const sheetLocked = isSheetFinalized ?? false

  const isEligibleForVehicle = ['Workers', 'Drivers', 'Chalan Men', 'Extra Labour'].includes(emp.category)
  const isPresent = emp.attendance === 'on_time' || emp.attendance === 'arrived'
  const isChalanMan = emp.category === 'Chalan Men'
  const hasBeenEdited = editedEmployees.has(emp.id)
  const canAssignVehicle = isEligibleForVehicle && isPresent && !sheetLocked && (hasBeenEdited || attendanceLocked)
  const canRequestLabour = isChalanMan && isPresent && !sheetLocked
  const availableVehicles = vehicles.filter(v => v.status === 'available')
  // Include currently assigned vehicle in the list so it displays in select
  const selectableVehicles = emp.assignedVehicle 
    ? [...availableVehicles, ...(vehicles.filter(v => v.id === emp.assignedVehicle))]
    : availableVehicles
  // Disable vehicle select if already assigned or sheet locked
  const vehicleSelectDisabled = sheetLocked || !!emp.assignedVehicle
  // Show Reset button if employee has any values set (attendance, vehicle, labour request) and sheet not finalized
  const hasAnyValueSet = emp.attendance || emp.assignedVehicle || emp.labourRequest

  return (
    <tr key={emp.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
      <td className="px-4 py-1 text-sm text-gray-500">{emp.id}</td>
      <td className="px-4 py-1">
        <EmployeeAvatar photo={emp.photo} name={emp.name} />
      </td>
      <td className="px-4 py-1 text-base font-semibold text-gray-900">{emp.name}</td>
      <td className="px-4 py-1 text-sm text-gray-600">{emp.category}</td>
      <td className="px-4 py-1">
        <AttendanceControl
          emp={emp}
          isAttendanceLocked={attendanceLocked}
          handleAttendance={handleAttendance}
          handleToggleEditMode={handleToggleEditMode}
          arrivalTimes={arrivalTimes}
          setArrivalTimes={setArrivalTimes}
          currentTime={currentTime}
        />
      </td>
      <td className="px-4 py-1">
        <div className="flex gap-2 items-center justify-end">
          {/* Min / Max (Labour Request) Buttons and Status */}
          {canRequestLabour && (
            <LabourRequestButtons
              value={emp.labourRequest}
              onChange={(value) => handleLabourRequest(emp.id, value)}
              disabled={sheetLocked}
            />
          )}
          {sheetLocked && emp.labourRequest && (
            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm ${
              emp.labourRequest === 'minimum' 
                ? 'bg-blue-100 text-blue-800 border-blue-300' 
                : 'bg-orange-100 text-orange-800 border-orange-300'
            }`}>
              {emp.labourRequest === 'minimum' ? 'Min Demand' : 'More/Max Demand'}
            </span>
          )}
          {canAssignVehicle && (
            <VehicleSelect
              value={emp.assignedVehicle}
              onChange={(value) => {
                const result = handleVehicleAssignment(emp.id, value)
                if (result?.conflict && !result.conflict.blocked) {
                  onConflict(result.conflict)
                }
              }}
              vehicles={selectableVehicles}
              disabled={vehicleSelectDisabled}
              employees={employees}
              employeeCategory={emp.category}
            />
          )}
          {emp.assignedVehicle && (!canAssignVehicle || sheetLocked) && (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg border border-gray-300">
              {vehicles.find(v => v.id === emp.assignedVehicle)?.number || emp.assignedVehicle}
            </span>
          )}
          {hasAnyValueSet && !sheetLocked && (
            <button
              onClick={() => handleToggleEditMode(emp.id)}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Reset all values for this employee"
            >
              Reset
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default memo(EmployeeRow)
