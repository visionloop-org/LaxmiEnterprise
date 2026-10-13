import { memo } from 'react'
import { getStatusConfig } from './attendance.utils'

function AttendanceBadge({ status }) {
  const config = getStatusConfig(status)
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bg} ${config.text} rounded-xl text-xs md:text-sm font-semibold shadow-sm border border-current/20 transition-all hover:scale-[1.02]`}>
      <span>{config.label}</span>
      {config.sublabel && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-white/70 shadow-2xs">
          {config.sublabel}
        </span>
      )}
    </div>
  )
}

export default memo(AttendanceBadge)

