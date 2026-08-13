import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { restTripService } from '../services/restTripService'
import { authService } from '../services/authService'

const TRIPS_QUERY_KEY = ['trips']

export function useTrips(filters = {}) {
  return useQuery({
    queryKey: [...TRIPS_QUERY_KEY, filters],
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
    mutationFn: ({ tripId, status, locationName, remarks }) =>
      restTripService.updateTripStatus(tripId, { status, locationName, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY })
    },
  })
}
