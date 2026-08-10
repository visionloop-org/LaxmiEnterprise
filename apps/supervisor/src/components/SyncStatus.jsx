import { useState, useEffect } from 'react'
import { offlineQueue } from '../services/offlineQueue'

export default function SyncStatus() {
  const [status, setStatus] = useState({
    queue: [],
    count: 0,
    syncStatus: 'synced',
    isOnline: navigator.onLine,
  })

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((newStatus) => {
      setStatus(newStatus)
    })

    // Initial status
    setStatus({
      queue: offlineQueue.getQueue(),
      count: offlineQueue.getQueueCount(),
      syncStatus: offlineQueue.getSyncStatus(),
      isOnline: offlineQueue.isOnline,
    })

    return unsubscribe
  }, [])

  const getStatusColor = () => {
    if (!status.isOnline) return 'bg-red-500'
    if (status.syncStatus === 'syncing') return 'bg-yellow-500'
    if (status.syncStatus === 'error') return 'bg-red-500'
    if (status.syncStatus === 'partial') return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline'
    if (status.syncStatus === 'syncing') return 'Syncing...'
    if (status.syncStatus === 'error') return 'Sync Error'
    if (status.syncStatus === 'partial') return `Syncing (${status.count} pending)`
    return 'Synced'
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-gray-600">{getStatusText()}</span>
      {status.count > 0 && (
        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
          {status.count}
        </span>
      )}
    </div>
  )
}
