import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      // Retry once on transient server errors; never on client errors.
      retry: (failureCount, error) => error instanceof ApiError && error.status >= 500 && failureCount < 1,
    },
    mutations: { retry: false },
  },
})
