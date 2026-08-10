import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEmployees, useVehicles, authService } from '@laxmi/shared'

const EMPLOYEES_QUERY_KEY = ['employees']
const VEHICLES_QUERY_KEY = ['vehicles']

export function useAttendanceState() {
  const queryClient = useQueryClient()
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [attendanceFilter, setAttendanceFilter] = useState('All')
  const [alphabetFilter, setAlphabetFilter] = useState('All')

  // UI states
  const [viewMode, setViewMode] = useState('employees')
  const [expandedRow, setExpandedRow] = useState(null)
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  // Data states
  const [arrivalTimes, setArrivalTimes] = useState(() => {
    const savedState = localStorage.getItem('attendanceAppState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        return parsed.arrivalTimes || {}
      } catch (e) {
        return {}
      }
    }
    return {}
  })

  const [newWorker, setNewWorker] = useState({ name: '', contractor: '', remarks: '' })
  const [editedEmployees, setEditedEmployees] = useState(new Set())

  // Session states
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
  const [sessionStartTime] = useState(() => {
    const savedState = localStorage.getItem('attendanceAppState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        return parsed.sessionStartTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      } catch (e) {
        return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      }
    }
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  })

  const [isAttendanceLocked, setIsAttendanceLocked] = useState(() => {
    const savedState = localStorage.getItem('attendanceAppState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        return parsed.isAttendanceLocked || false
      } catch (e) {
        return false
      }
    }
    return false
  })

  // Use React Query for data fetching
  const { data: employees = [], isLoading: isLoadingEmployees, error: employeesError } = useEmployees()
  const { data: vehicles = [], isLoading: isLoadingVehicles, error: vehiclesError } = useVehicles()

  const isLoading = isLoadingEmployees || isLoadingVehicles
  const isAuthenticated = authService.isAuthenticated()

  // Create setters that work with React Query cache
  const setEmployees = (updater) => {
    queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (prev) => {
      if (!prev) return updater([])
      return updater(prev)
    })
  }

  const setVehicles = (updater) => {
    queryClient.setQueryData(VEHICLES_QUERY_KEY, (prev) => {
      if (!prev) return updater([])
      return updater(prev)
    })
  }

  // Time update effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toTimeString().slice(0, 5))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Save state to localStorage
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const stateToSave = {
      employees,
      vehicles,
      arrivalTimes,
      isAttendanceLocked,
      sessionStartTime,
    }
    localStorage.setItem('attendanceAppState', JSON.stringify(stateToSave))
  }, [employees, vehicles, arrivalTimes, isAttendanceLocked, sessionStartTime])

  return {
    // Filter states
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
    attendanceFilter, setAttendanceFilter,
    alphabetFilter, setAlphabetFilter,
    
    // UI states
    viewMode, setViewMode,
    expandedRow, setExpandedRow,
    showAddWorker, setShowAddWorker,
    showRightPanel, setShowRightPanel,
    selectedEmployee, setSelectedEmployee,
    
    // Data states
    arrivalTimes, setArrivalTimes,
    newWorker, setNewWorker,
    editedEmployees, setEditedEmployees,
    employees, setEmployees,
    vehicles, setVehicles,
    
    // Session states
    currentTime,
    currentDate,
    sessionStartTime,
    isAttendanceLocked, setIsAttendanceLocked,
    
    // Loading and auth states
    isLoading,
    isAuthenticated,
    
    // Error states
    employeesError,
    vehiclesError,
  }
}
