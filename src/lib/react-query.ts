import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a Query Client instance with default configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Garbage collect data after 10 minutes of inactivity
      gcTime: 1000 * 60 * 10, // 10 minutes
      // Retry failed queries 3 times by default
      retry: 3,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
  },
});

// Export provider components for easy use
export { QueryClientProvider, ReactQueryDevtools };