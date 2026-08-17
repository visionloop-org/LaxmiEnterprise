import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { AuthError, authService } from '@laxmi/shared'

/**
 * Shared React Query client for the Admin application.
 *
 * Default query behavior:
 * - staleTime: 5 minutes  — analytics data doesn't need to refresh every second
 * - gcTime: 10 minutes    — unused cache retained (TanStack Query v5 renamed cacheTime → gcTime)
 * - retry: smart retry    — no retry on 4xx client errors, up to 2 retries otherwise
 * - refetchOnWindowFocus: false — admin portal avoids noisy re-fetches on tab focus
 * - refetchOnMount: false — rely on staleTime; don't refetch on every component mount
 * - refetchOnReconnect: true — refresh data when network reconnects
 *
 * Global error handling:
 * - AuthError on any query or mutation → logout + reload
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: (failureCount, error) => {
        // Never retry 4xx client errors (not our fault to retry)
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AuthError) {
        authService.logout()
        window.location.reload()
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof AuthError) {
        authService.logout()
        window.location.reload()
      }
    },
  }),
})

export default queryClient
