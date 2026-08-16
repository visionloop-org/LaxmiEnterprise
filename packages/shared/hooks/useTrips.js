import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restTripService } from '../services/restTripService.js'
import { authService } from '../services/authService.js'

const TRIPS_QUERY_KEY = ['trips']
const EMPTY_FILTERS = Object.freeze({})

export function useTrips(filters = EMPTY_FILTERS) {
  const hasFilters = filters && Object.keys(filters).length > 0
  return useQuery({
    queryKey: hasFilters ? [...TRIPS_QUERY_KEY, filters] : TRIPS_QUERY_KEY,
    queryFn: () => restTripService.fetchTrips(filters),
    enabled: authService.isAuthenticated(),
    refetchInterval: 10000, // Poll every 10 seconds for realtime trip updates
  })
}

export function useTrip(tripId) {
  return useQuery({
    queryKey: [...TRIPS_QUERY_KEY, tripId],
    queryFn: () => restTripService.fetchTrip(tripId),
    enabled: !!tripId && authService.isAuthenticated(),
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tripData) => restTripService.createTrip(tripData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY })
    },
  })
}

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
