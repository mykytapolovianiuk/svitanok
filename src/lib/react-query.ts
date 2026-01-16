import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // CRITICAL: Stop retrying on errors immediately
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false, // Stop refetching when switching tabs
      refetchOnReconnect: false,
    },
  },
});

// Export provider components for easy use
export { QueryClientProvider } from '@tanstack/react-query';
export { ReactQueryDevtools } from '@tanstack/react-query-devtools';