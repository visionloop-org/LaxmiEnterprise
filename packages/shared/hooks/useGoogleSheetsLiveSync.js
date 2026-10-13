/**
 * useGoogleSheetsLiveSync Hook
 * 
 * Provides real-time synchronization between Google Sheets and the frontend.
 * - Subscribes to GoogleSheetsService sync events.
 * - Automatically invalidates React Query caches (employees, vehicles, trips, etc.) when new data arrives.
 * - Manages background interval polling and window focus / visibility change listeners.
 * - Exposes manual `syncNow()` trigger and current sync status.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { googleSheetsService } from '../services/googleSheetsService.js'

let activeSubscribersCount = 0

export function useGoogleSheetsLiveSync({
  autoSync = true,
  intervalMs = 20000,
  onSyncSuccess = null,
  onSyncError = null
} = {}) {
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(() => googleSheetsService.config?.lastSyncTime || null)
  const [syncError, setSyncError] = useState(null)
  const [isConfigured, setIsConfigured] = useState(() => !!googleSheetsService.config?.scriptUrl)

  const callbacksRef = useRef({ onSyncSuccess, onSyncError })
  callbacksRef.current = { onSyncSuccess, onSyncError }

  const invalidateAppQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['employees'] })
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    queryClient.invalidateQueries({ queryKey: ['attendance'] })
    queryClient.invalidateQueries({ queryKey: ['payroll'] })
    queryClient.invalidateQueries({ queryKey: ['contractors'] })
  }, [queryClient])

  useEffect(() => {
    // 1. Subscribe to GoogleSheetsService events
    const unsubscribe = googleSheetsService.subscribe((eventType, payload) => {
      if (eventType === 'SYNC_COMPLETED') {
        setIsSyncing(false)
        setSyncError(null)
        setLastSyncTime(payload.timestamp || new Date().toISOString())
        invalidateAppQueries()
        callbacksRef.current.onSyncSuccess?.(payload)
      } else if (eventType === 'SYNC_ERROR') {
        setIsSyncing(false)
        setSyncError(payload.error || 'Sync failed')
        callbacksRef.current.onSyncError?.(payload.error)
      } else if (eventType === 'MUTATION_COMPLETED') {
        setLastSyncTime(new Date().toISOString())
        invalidateAppQueries()
      }
    })

    // 2. Start auto-sync if requested
    if (autoSync) {
      activeSubscribersCount++
      if (activeSubscribersCount === 1) {
        googleSheetsService.startAutoSync(intervalMs)
      }
    }

    return () => {
      unsubscribe()
      if (autoSync) {
        activeSubscribersCount = Math.max(0, activeSubscribersCount - 1)
        if (activeSubscribersCount === 0) {
          googleSheetsService.stopAutoSync()
        }
      }
    }
  }, [autoSync, intervalMs, invalidateAppQueries])

  // Manual forced refresh
  const syncNow = useCallback(async () => {
    if (isSyncing) return { success: false, message: 'Sync already in progress' }
    setIsSyncing(true)
    setSyncError(null)

    try {
      const result = await googleSheetsService.fetchFromGoogleSheets()
      setIsSyncing(false)
      if (result.success) {
        const time = new Date().toISOString()
        setLastSyncTime(time)
        setIsConfigured(true)
        invalidateAppQueries()
        callbacksRef.current.onSyncSuccess?.(result)
        return { success: true, timestamp: time, data: result.data }
      } else {
        setSyncError(result.message)
        callbacksRef.current.onSyncError?.(result.message)
        return { success: false, message: result.message }
      }
    } catch (err) {
      setIsSyncing(false)
      setSyncError(err.message)
      callbacksRef.current.onSyncError?.(err.message)
      return { success: false, message: err.message }
    }
  }, [isSyncing, invalidateAppQueries])

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    isConfigured,
    syncNow,
    invalidateCache: invalidateAppQueries
  }
}

export default useGoogleSheetsLiveSync
