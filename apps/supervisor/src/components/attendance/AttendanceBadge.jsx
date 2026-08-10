import { memo } from 'react'
import { getStatusConfig } from './attendance.utils'

function AttendanceBadge({ status, time }) {
  const config = getStatusConfig(status)
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 ${config.bg} ${config.text} rounded-full text-sm font-medium`}>
      <span>{config.label}</span>
      {status === 'arrived' && time && (
        <>
          <span>•</span>
          <span>{time}</span>
        </>
      )}
    </div>
  )
}

export default memo(AttendanceBadge)
