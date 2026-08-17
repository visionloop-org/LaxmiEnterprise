import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restVehicleService } from '../services/restVehicleService.js'
import { authService } from '../services/authService.js'

/** Base query key for all vehicle queries */
const VEHICLES_QUERY_KEY = ['vehicles']
const EMPTY_FILTERS = Object.freeze({})

/**
 * Fetches the list of vehicles, optionally filtered.
 *
 * Stale time is 3 minutes — vehicle status changes more frequently than
 * employee data (assignments, trips, status changes).
 *
 * @param {Object} [filters={}] - Optional filter object (status, etc.)
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<import('../types/api').Vehicle>>}
 */
export function useVehicles(filters = EMPTY_FILTERS) {
  const hasFilters = filters && Object.keys(filters).length > 0
  return useQuery({
    queryKey: hasFilters ? [...VEHICLES_QUERY_KEY, filters] : VEHICLES_QUERY_KEY,
    queryFn: () => restVehicleService.fetchVehicles(filters),
    enabled: authService.isAuthenticated(),
    staleTime: 3 * 60 * 1000,   // 3 minutes — vehicles change more often
    gcTime: 10 * 60 * 1000,     // 10 minutes — keep in cache after unmount
    refetchOnWindowFocus: false,
  })
}

/**
 * Fetches a single vehicle by vehicle number.
 * Uses a unique query key scoped to the vehicle number to avoid colliding
 * with the list cache.
 *
 * @param {string} vehicleNumber - The vehicle's unique identifier/number
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../types/api').Vehicle>}
 */
export function useVehicle(vehicleNumber) {
  return useQuery({
    queryKey: [...VEHICLES_QUERY_KEY, vehicleNumber],
    queryFn: () => restVehicleService.fetchVehicle(vehicleNumber),
    enabled: !!vehicleNumber && authService.isAuthenticated(),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Mutation to update a vehicle's operational status.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, {vehicleNumber: string, status: string}>}
 */
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

/**
 * Mutation to add a new vehicle to the fleet.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<import('../types/api').Vehicle, Error, Object>}
 */
export function useAddVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vehicleData) => restVehicleService.addVehicle(vehicleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY })
    },
  })
}

/**
 * Mutation to update an existing vehicle's details.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<import('../types/api').Vehicle, Error, {vehicleNumber: string, updateData: Object}>}
 */
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
