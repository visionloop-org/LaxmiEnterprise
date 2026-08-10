export const ATTENDANCE_STATUS = {
  pending: {
    label: 'Pending',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: null
  },
  on_time: {
    label: 'On Time',
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: 'CheckCircle'
  },
  arrived: {
    label: 'Arrived',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    icon: 'Clock'
  },
  absent: {
    label: 'Absent',
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: 'XCircle'
  }
}

export const ATTENDANCE_COLORS = {
  on_time: {
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    text: 'text-white'
  },
  arrived: {
    bg: 'bg-amber-500',
    hover: 'hover:bg-amber-600',
    text: 'text-white'
  },
  absent: {
    bg: 'bg-red-600',
    hover: 'hover:bg-red-700',
    text: 'text-white'
  },
  default: {
    bg: 'bg-white',
    hover: 'hover:bg-gray-50',
    text: 'text-gray-700'
  }
}

export default {
  ATTENDANCE_STATUS,
  ATTENDANCE_COLORS
}
