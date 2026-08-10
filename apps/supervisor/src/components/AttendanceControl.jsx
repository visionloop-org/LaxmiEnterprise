import { memo, useCallback } from 'react'
import { getArrivalTime } from './attendance/attendance.utils'
import LockedAttendance from './attendance/LockedAttendance'
import AttendanceBadge from './attendance/AttendanceBadge'
import AttendanceButtons from './attendance/AttendanceButtons'
import ArrivedBadge from './attendance/ArrivedBadge'

function AttendanceControl({
  emp,
  isAttendanceLocked,
  handleAttendance,
  arrivalTimes,
  setArrivalTimes,
  currentTime
}) {
  const displayTime = arrivalTimes[emp.id] ?? emp.arrivalTime ?? currentTime

  const handleOnTime = useCallback(() => {
    handleAttendance(emp.id, 'on_time')
  }, [emp.id, handleAttendance])

  const handleArrived = useCallback(() => {
    handleAttendance(emp.id, 'arrived')
  }, [emp.id, handleAttendance])

  const handleAbsent = useCallback(() => {
    handleAttendance(emp.id, 'absent')
  }, [emp.id, handleAttendance])

  const handleTimeChange = useCallback((e) => {
    setArrivalTimes(prev => ({ ...prev, [emp.id]: e.target.value }))
  }, [emp.id, setArrivalTimes])

  if (isAttendanceLocked) {
    return <LockedAttendance status={emp.attendance} time={displayTime} />
  }

  switch (emp.attendance) {
    case null:
    case undefined:
      return (
        <AttendanceButtons
          selectedStatus={emp.attendance}
          onOnTime={handleOnTime}
          onArrived={handleArrived}
          onAbsent={handleAbsent}
          arrivalTime={arrivalTimes[emp.id]}
          onTimeChange={handleTimeChange}
          currentTime={currentTime}
        />
      )
    case 'on_time':
      return <AttendanceBadge status="on_time" />
    case 'arrived':
      return (
        <ArrivedBadge
          time={displayTime}
          onTimeChange={handleTimeChange}
          currentTime={currentTime}
        />
      )
    case 'absent':
      return <AttendanceBadge status="absent" />
    default:
      return null
  }
}

export default memo(AttendanceControl)
