import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      
      staleTime: 0, 
      
      gcTime: 1000 * 60 * 10, 
      
      retry: 3,
      
      refetchOnWindowFocus: true,
      
      refetchOnReconnect: true,
    },
  },
});


export { QueryClientProvider, ReactQueryDevtools };