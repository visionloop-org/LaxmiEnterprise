import { memo } from 'react'
import EmployeeAvatar from './EmployeeAvatar'
import AttendanceControl from './AttendanceControl'

function EmployeeCard({
  emp,
  isAttendanceLocked,
  isAttendanceFinalized,
  handleAttendance,
  arrivalTimes,
  setArrivalTimes,
  currentTime,
  handleToggleEditMode,
}) {
  const attendanceLocked = isAttendanceFinalized ?? isAttendanceLocked ?? false
  const hasAttendanceMarked = !!emp.attendance

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm space-y-3 transition-shadow hover:shadow-md">
      {/* Card Header: Avatar, Name, ID, Category & Reset Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <EmployeeAvatar photo={emp.photo} name={emp.name} />
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-gray-900 truncate leading-tight">
              {emp.name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
              <span className="font-mono font-semibold text-gray-600">{emp.id}</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                {emp.category}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Reset Button on Mobile if employee has marked attendance */}
        {hasAttendanceMarked && !attendanceLocked && (
          <button
            type="button"
            onClick={() => handleToggleEditMode(emp.id)}
            className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg active:scale-95 transition cursor-pointer flex-shrink-0"
            title="Edit / Reset status"
          >
            Reset
          </button>
        )}
      </div>

      {/* Attendance Control: Full width with large touch targets */}
      <div className="pt-1 flex justify-center">
        <AttendanceControl
          emp={emp}
          isAttendanceLocked={attendanceLocked}
          handleAttendance={handleAttendance}
          handleToggleEditMode={handleToggleEditMode}
          arrivalTimes={arrivalTimes}
          setArrivalTimes={setArrivalTimes}
          currentTime={currentTime}
        />
      </div>
    </div>
  )
}

export default memo(EmployeeCard)
