import { memo } from 'react'

function ArrivedBadge({ time, isEditing, onToggleEdit, onTimeChange, currentTime }) {
  return (
    <div className="relative">
      <div 
        className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium cursor-pointer hover:bg-amber-200"
      >
        <span>🟡 Arrived</span>
        <span>•</span>
        <span className="relative inline-block">
          <span className="cursor-pointer hover:opacity-70">{time}</span>
          <input
            type="time"
            value={time || currentTime}
            onChange={onTimeChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </span>
      </div>
    </div>
  )
}

export default memo(ArrivedBadge)
