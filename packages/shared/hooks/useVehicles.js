import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restVehicleService } from '../services/restVehicleService.js'
import { authService } from '../services/authService.js'

const VEHICLES_QUERY_KEY = ['vehicles']
const EMPTY_FILTERS = Object.freeze({})

export function useVehicles(filters = EMPTY_FILTERS) {
  const hasFilters = filters && Object.keys(filters).length > 0
  return useQuery({
    queryKey: hasFilters ? [...VEHICLES_QUERY_KEY, filters] : VEHICLES_QUERY_KEY,
    queryFn: () => restVehicleService.fetchVehicles(filters),
    enabled: authService.isAuthenticated(),
  })
}

export function useVehicle(vehicleNumber) {
  return useQuery({
    queryKey: VEHICLES_QUERY_KEY,
    queryFn: () => restVehicleService.fetchVehicle(vehicleNumber),
    enabled: !!vehicleNumber && authService.isAuthenticated(),
  })
}

export function useUpdateVehicleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ vehicleNumber, status }) =>
      restVehicleService.updateStatus(vehicleNumber, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY })
    },
  })
}

export function useAddVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vehicleData) => restVehicleService.addVehicle(vehicleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ vehicleNumber, updateData }) =>
      restVehicleService.updateVehicle(vehicleNumber, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY })
    },
  })
}
