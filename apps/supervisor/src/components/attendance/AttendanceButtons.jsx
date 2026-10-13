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
    <ButtonGroup className="w-full md:w-auto inline-flex items-stretch shadow-sm">
      {/* 1. On Time: Entry at correct time -> Full Day Pay + Incentive */}
      <button
        type="button"
        onClick={onOnTime}
        className={`flex-1 md:flex-none px-2.5 sm:px-3 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 text-xs font-bold md:font-medium transition-colors border-r border-gray-300 cursor-pointer active:scale-95 flex items-center justify-center whitespace-nowrap ${
          selectedStatus === 'on_time'
            ? 'bg-green-600 text-white font-bold'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title="Mark On Time (Full Day Pay + Incentive)"
      >
        On Time
      </button>

      {/* 2. Arrived: Entry after time -> Full Day Pay (No incentive), records arrival time */}
      <button
        type="button"
        onClick={onArrived}
        className={`flex-1 md:flex-none px-2 sm:px-3 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 text-xs font-bold md:font-medium transition-colors border-r border-gray-300 cursor-pointer active:scale-95 flex items-center justify-center whitespace-nowrap ${
          selectedStatus === 'arrived'
            ? 'bg-amber-500 text-white font-bold'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title="Mark Arrived (Full Day Pay, No Incentive)"
      >
        Arrived
      </button>

      {/* 3. Time input for arrival time */}
      <div className="relative border-r border-gray-300 bg-white flex items-center min-h-[44px] md:min-h-0">
        <input
          type="time"
          value={arrivalTime || currentTime}
          onChange={onTimeChange}
          className="w-18 sm:w-20 md:w-auto px-1.5 py-1 text-xs font-medium bg-white text-gray-700 border-0 focus:ring-0 cursor-pointer text-center"
          title="Arrival time (saved to Google Sheets)"
        />
      </div>

      {/* 4. Absent: 0 Pay */}
      <button
        type="button"
        onClick={onAbsent}
        className={`flex-1 md:flex-none px-2.5 sm:px-3 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 text-xs font-bold md:font-medium transition-colors cursor-pointer active:scale-95 flex items-center justify-center whitespace-nowrap ${
          selectedStatus === 'absent'
            ? 'bg-red-600 text-white font-bold'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        title="Mark Absent (0 Pay)"
      >
        Absent
      </button>
    </ButtonGroup>
  )
}

export default memo(AttendanceButtons)
