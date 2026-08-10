import { ATTENDANCE_STATUS, ATTENDANCE_COLORS } from './attendance.config'

export const getArrivalTime = (emp, arrivalTimes, currentTime) => {
  return emp.arrivalTime || arrivalTimes[emp.id] || currentTime
}

export const getStatusConfig = (status) => {
  return ATTENDANCE_STATUS[status] || ATTENDANCE_STATUS.pending
}

export const getButtonColorClass = (status, isSelected) => {
  if (isSelected) {
    return ATTENDANCE_COLORS[status] || ATTENDANCE_COLORS.default
  }
  return ATTENDANCE_COLORS.default
}
