import { QueryClient, QueryCache } from '@tanstack/react-query'
import { AuthError, authService } from '@laxmi/shared'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof AuthError) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AuthError) {
        // Handle auth errors globally
        authService.logout()
        window.location.reload()
      }
    },
  }),
})

export default queryClient
