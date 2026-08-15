import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restEmployeeService } from '../services/restEmployeeService.js'
import { authService } from '../services/authService.js'

const EMPLOYEES_QUERY_KEY = ['employees']
const EMPTY_FILTERS = Object.freeze({})

export function useEmployees(filters = EMPTY_FILTERS) {
  const hasFilters = filters && Object.keys(filters).length > 0
  return useQuery({
    queryKey: hasFilters ? [...EMPLOYEES_QUERY_KEY, filters] : EMPLOYEES_QUERY_KEY,
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

export function useApproveEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId) => restEmployeeService.approveEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

export function useRejectEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId) => restEmployeeService.rejectEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId) => restEmployeeService.deleteEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

