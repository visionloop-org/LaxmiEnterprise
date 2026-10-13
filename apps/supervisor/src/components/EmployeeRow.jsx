import { memo } from 'react'
import EmployeeAvatar from './EmployeeAvatar'
import AttendanceControl from './AttendanceControl'

function EmployeeRow({
  emp,
  index,
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
    <tr key={emp.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'} hover:bg-amber-50/50 transition-colors border-b border-gray-100`}>
      <td className="px-4 py-3 text-sm font-bold text-gray-500 w-[8%]">{emp.id}</td>
      <td className="px-4 py-3 w-[8%]">
        <EmployeeAvatar photo={emp.photo} name={emp.name} />
      </td>
      <td className="px-4 py-3 text-base font-semibold text-gray-900 w-[30%]">{emp.name}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-600 w-[18%]">
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-md text-xs">
          {emp.category}
        </span>
      </td>
      <td className="px-4 py-3 w-[28%]">
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
      <td className="px-4 py-3 text-right w-[8%]">
        {hasAttendanceMarked && !attendanceLocked && (
          <button
            type="button"
            onClick={() => handleToggleEditMode(emp.id)}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg active:scale-95 transition cursor-pointer"
            title="Reset attendance mark for this employee"
          >
            Reset
          </button>
        )}
      </td>
    </tr>
  )
}

export default memo(EmployeeRow)
