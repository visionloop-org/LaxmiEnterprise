const OFFLINE_QUEUE_KEY = 'offline_queue'
const SYNC_STATUS_KEY = 'sync_status'

class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue()
    this.listeners = new Set()
    this.isOnline = navigator.onLine
    this.syncInProgress = false

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error('Failed to load offline queue:', e)
      return []
    }
  }

  saveQueue() {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue))
    } catch (e) {
      console.error('Failed to save offline queue:', e)
    }
  }

  add(operation) {
    const queuedItem = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      operation,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    }
    this.queue.push(queuedItem)
    this.saveQueue()
    this.notifyListeners()
    return queuedItem.id
  }

  remove(id) {
    this.queue = this.queue.filter(item => item.id !== id)
    this.saveQueue()
    this.notifyListeners()
  }

  clear() {
    this.queue = []
    this.saveQueue()
    this.notifyListeners()
  }

  getQueue() {
    return [...this.queue]
  }

  getQueueCount() {
    return this.queue.length
  }

  handleOnline() {
    this.isOnline = true
    this.setSyncStatus('syncing')
    this.sync()
  }

  handleOffline() {
    this.isOnline = false
    this.setSyncStatus('offline')
  }

  setSyncStatus(status) {
    localStorage.setItem(SYNC_STATUS_KEY, status)
    this.notifyListeners()
  }

  getSyncStatus() {
    return localStorage.getItem(SYNC_STATUS_KEY) || 'synced'
  }

  async sync() {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return
    }

    this.syncInProgress = true
    this.setSyncStatus('syncing')

    try {
      // Process queue in order
      for (const item of [...this.queue]) {
        try {
          await this.executeOperation(item.operation)
          this.remove(item.id)
        } catch (error) {
          console.error('Failed to sync operation:', item.id, error)
          item.retryCount++
          
          // Remove items that have failed too many times
          if (item.retryCount >= 3) {
            this.remove(item.id)
          }
        }
      }

      if (this.queue.length === 0) {
        this.setSyncStatus('synced')
      } else {
        this.setSyncStatus('partial')
      }
    } catch (error) {
      console.error('Sync failed:', error)
      this.setSyncStatus('error')
    } finally {
      this.syncInProgress = false
    }
  }

  async executeOperation(operation) {
    const { type, service, method, args } = operation
    
    // Import services dynamically to avoid circular dependencies
    const services = await import('./index.js')
    const serviceInstance = services[service]
    
    if (!serviceInstance || !serviceInstance[method]) {
      throw new Error(`Service or method not found: ${service}.${method}`)
    }

    return await serviceInstance[method](...args)
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener({
      queue: this.getQueue(),
      count: this.getQueueCount(),
      status: this.getSyncStatus(),
      isOnline: this.isOnline,
    }))
  }
}

export const offlineQueue = new OfflineQueue()
