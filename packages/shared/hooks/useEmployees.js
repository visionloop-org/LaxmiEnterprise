import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restEmployeeService } from '../services/restEmployeeService'
import { authService } from '../services/authService'

const EMPLOYEES_QUERY_KEY = ['employees']

export function useEmployees(filters = {}) {
  return useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, filters],
    queryFn: () => restEmployeeService.fetchEmployees(filters),
    enabled: authService.isAuthenticated(),
  })
}

export function useEmployee(employeeId) {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: () => restEmployeeService.fetchEmployee(employeeId),
    enabled: !!employeeId && authService.isAuthenticated(),
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, employeeId, status, arrivalTime, remarks }) =>
      restEmployeeService.updateAttendance(sessionId, employeeId, status, arrivalTime, remarks),
    onMutate: async ({ employeeId, status, arrivalTime }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY })

      // Snapshot the previous value
      const previousEmployees = queryClient.getQueryData(EMPLOYEES_QUERY_KEY)

      // Optimistically update to the new value
      queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (old) => {
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

      // Return context with previous value for rollback
      return { previousEmployees }
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousEmployees) {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, context.previousEmployees)
      }
    },
    onSuccess: () => {
      // Invalidate employees query to refetch
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

export function useAddEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeData) => restEmployeeService.addEmployee(employeeData),
    onMutate: async (newEmployee) => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY })
      const previousEmployees = queryClient.getQueryData(EMPLOYEES_QUERY_KEY)

      queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (old) => {
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

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, updateData }) =>
      restEmployeeService.updateEmployee(employeeId, updateData),
    onMutate: async ({ employeeId, updateData }) => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEES_QUERY_KEY })
      const previousEmployees = queryClient.getQueryData(EMPLOYEES_QUERY_KEY)

      queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (old) => {
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
