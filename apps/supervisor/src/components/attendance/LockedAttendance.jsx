import { memo } from 'react'
import AttendanceBadge from './AttendanceBadge'

function LockedAttendance({ status, time }) {
  if (!status) {
    return (
      <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
        <button disabled className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-400 border-r border-gray-300">
          On Time
        </button>
        <button disabled className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-400 border-r border-gray-300">
          Arrived
        </button>
        <button disabled className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-400">
          Absent
        </button>
      </div>
    )
  }

  return <AttendanceBadge status={status} time={status === 'arrived' ? time : undefined} />
}

export default memo(LockedAttendance)
