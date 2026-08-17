import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restTripService } from '../services/restTripService.js'
import { authService } from '../services/authService.js'

/** Base query key for all trip queries */
const TRIPS_QUERY_KEY = ['trips']
const EMPTY_FILTERS = Object.freeze({})

/**
 * Fetches the list of trips, optionally filtered.
 *
 * Trips are near-realtime data — vehicles actively moving to delivery sites.
 * staleTime is short (30s) and refetchInterval polls every 30s by default.
 * The polling keeps dashboards live without WebSocket infrastructure.
 *
 * @param {Object} [filters={}] - Optional filter object (session, vehicle, status)
 * @param {Object} [options={}] - Additional react-query options to override defaults
 * @param {number} [options.refetchInterval] - Override default poll interval (ms)
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<import('../types/api').VehicleTrip>>}
 */
export function useTrips(filters = EMPTY_FILTERS, options = {}) {
  const hasFilters = filters && Object.keys(filters).length > 0
  return useQuery({
    queryKey: hasFilters ? [...TRIPS_QUERY_KEY, filters] : TRIPS_QUERY_KEY,
    queryFn: () => restTripService.fetchTrips(filters),
    enabled: authService.isAuthenticated(),
    staleTime: 30 * 1000,        // 30 seconds — trips change frequently
    gcTime: 5 * 60 * 1000,       // 5 minutes cache
    refetchInterval: 30 * 1000,  // Poll every 30s for live trip updates
    refetchOnWindowFocus: true,   // Refetch when user switches back to tab
    ...options,
  })
}

/**
 * Fetches a single trip by trip ID.
 *
 * @param {string} tripId - The trip's unique identifier
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../types/api').VehicleTrip>}
 */
export function useTrip(tripId) {
  return useQuery({
    queryKey: [...TRIPS_QUERY_KEY, tripId],
    queryFn: () => restTripService.fetchTrip(tripId),
    enabled: !!tripId && authService.isAuthenticated(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * Mutation to dispatch a new vehicle trip.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<import('../types/api').VehicleTrip, Error, Object>}
 */
export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tripData) => restTripService.createTrip(tripData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY })
    },
  })
}

/**
 * Mutation to advance a trip through its lifecycle stages:
 * dispatched → reached_location → delivered → returned/completed
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<import('../types/api').VehicleTrip, Error, {tripId: string, status: string, locationName?: string, receiverName?: string, remarks?: string}>}
 */
export function useUpdateTripStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, status, locationName, receiverName, remarks }) =>
      restTripService.updateTripStatus(tripId, { status, locationName, receiverName, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY })
    },
  })
}
