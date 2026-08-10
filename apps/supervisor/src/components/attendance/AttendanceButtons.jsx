import { memo } from 'react'
import ButtonGroup from '../ui/ButtonGroup'

function AttendanceButtons({ 
  selectedStatus, 
  onOnTime, 
  onArrived, 
  onAbsent,
  arrivalTime,
  onTimeChange,
  currentTime
}) {
  return (
    <ButtonGroup>
      <button
        onClick={onOnTime}
        className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-300 ${
          selectedStatus === 'on_time'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        On Time
      </button>
      <button
        onClick={onArrived}
        className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-300 ${
          selectedStatus === 'arrived'
            ? 'bg-amber-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Arrived
      </button>
      <div className="relative flex-1">
        <input
          type="time"
          value={arrivalTime || currentTime}
          onChange={onTimeChange}
          className="w-full px-2 py-1.5 text-xs font-medium bg-white text-gray-700 border-0 focus:ring-0"
        />
      </div>
      <button
        onClick={onAbsent}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          selectedStatus === 'absent'
            ? 'bg-red-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Absent
      </button>
    </ButtonGroup>
  )
}

export default memo(AttendanceButtons)
