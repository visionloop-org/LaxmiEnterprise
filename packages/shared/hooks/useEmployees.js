import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restEmployeeService } from '../services/restEmployeeService.js'
import { authService } from '../services/authService.js'

/** Base query key for all employee queries */
const EMPLOYEES_QUERY_KEY = ['employees']
const EMPTY_FILTERS = Object.freeze({})

/**
 * Fetches the list of employees, optionally filtered.
 *
 * Stale time is 5 minutes — employee lists rarely change mid-session.
 * Cache (gcTime) is 10 minutes — keep data alive in the background.
 *
 * @param {Object} [filters={}] - Optional filter object (category, status, etc.)
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<import('../types/api').Employee>>}
 */
export function useEmployees(filters = EMPTY_FILTERS) {
  const hasFilters = filters && Object.keys(filters).length > 0
  return useQuery({
    queryKey: hasFilters ? [...EMPLOYEES_QUERY_KEY, filters] : EMPLOYEES_QUERY_KEY,
    queryFn: () => restEmployeeService.fetchEmployees(filters),
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000,   // 5 minutes — list data stays fresh
    gcTime: 10 * 60 * 1000,     // 10 minutes — keep in cache after unmount
    refetchOnWindowFocus: false, // avoid noisy refetches on tab switch
  })
}

/**
 * Fetches a single employee by ID.
 * Uses a unique query key scoped to the employee ID to avoid colliding with
 * the list cache.
 *
 * @param {string} employeeId - The employee's unique identifier
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../types/api').Employee>}
 */
export function useEmployee(employeeId) {
  return useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, employeeId],
    queryFn: () => restEmployeeService.fetchEmployee(employeeId),
    enabled: !!employeeId && authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Mutation to update an employee's attendance status.
 * Performs an optimistic update and rolls back on error.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, {sessionId: string, employeeId: string, status: string, arrivalTime?: string, remarks?: string}>}
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, employeeId, status, arrivalTime, remarks }) =>
      restEmployeeService.updateAttendance(sessionId, employeeId, status, arrivalTime, remarks),
    onMutate: async ({ employeeId, status, arrivalTime }) => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY })
      const previousEmployees = queryClient.getQueryData(EMPLOYEES_QUERY_KEY)

      queryClient.setQueriesData({ queryKey: EMPLOYEES_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map(emp => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              attendance: status,
              arrivalTime: arrivalTime || emp.arrivalTime,
            }
          }
          return emp
        })
      })

      return { previousEmployees }
    },
    onError: (err, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, context.previousEmployees)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to add a new employee.
 * Performs an optimistic append to the list and rolls back on error.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<import('../types/api').Employee, Error, Object>}
 */
export function useAddEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeData) => restEmployeeService.addEmployee(employeeData),
    onMutate: async (newEmployee) => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY })
      const previousEmployees = queryClient.getQueryData(EMPLOYEES_QUERY_KEY)

      queryClient.setQueriesData({ queryKey: EMPLOYEES_QUERY_KEY }, (old) => {
        if (!old) return [newEmployee]
        return [...old, newEmployee]
      })

      return { previousEmployees }
    },
    onError: (err, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, context.previousEmployees)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to update an existing employee's data.
 * Performs an optimistic update by merging `updateData` into the cached employee.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<import('../types/api').Employee, Error, {employeeId: string, updateData: Object}>}
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, updateData }) =>
      restEmployeeService.updateEmployee(employeeId, updateData),
    onMutate: async ({ employeeId, updateData }) => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY })
      const previousEmployees = queryClient.getQueryData(EMPLOYEES_QUERY_KEY)

      queryClient.setQueriesData({ queryKey: EMPLOYEES_QUERY_KEY }, (old) => {
        if (!old) return old
        return old.map(emp => {
          if (emp.id === employeeId) {
            return { ...emp, ...updateData }
          }
          return emp
        })
      })

      return { previousEmployees }
    },
    onError: (err, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, context.previousEmployees)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to bulk-update employee compensation rates.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, Array<{employeeId: string, baseRate: number}>>}
 */
export function useBulkUpdateCompensation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items) => restEmployeeService.bulkUpdateCompensation(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to approve a pending employee request.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, string>}
 */
export function useApproveEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId) => restEmployeeService.approveEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to reject a pending employee request.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, string>}
 */
export function useRejectEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId) => restEmployeeService.rejectEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to permanently delete an employee record.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, string>}
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId) => restEmployeeService.deleteEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to explicitly synchronize all employees live from Odoo ERP hr.employee
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<Object, Error, void>}
 */
export function useSyncEmployeesFromOdoo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => restEmployeeService.syncEmployeesFromOdoo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

