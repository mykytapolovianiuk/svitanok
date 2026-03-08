import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Stop retrying on auth errors
        if (error?.status === 401 || error?.status === 403) return false;
        if (error?.message?.includes('401') || error?.message?.includes('403')) return false;

        // Retry twice on 500 errors or network failures
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false, // CRITICAL: Stop refetching when switching tabs to prevent race conditions during token refresh
      refetchOnReconnect: false,
    },
  },
});

export { QueryClientProvider } from '@tanstack/react-query';
export { ReactQueryDevtools } from '@tanstack/react-query-devtools';