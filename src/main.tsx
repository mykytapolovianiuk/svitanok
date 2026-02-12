import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabase';
import { useUserStore } from './features/auth/useUserStore';
import { initSentry, setSentryUser } from './lib/sentry';

// Initialize Sentry before anything else
initSentry();

// Function to fetch user profile
const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    // Error logging handled by Sentry in production
    return null;
  }
};

// Initialize session and setup auth listener
const initializeApp = async () => {
  const setIsLoading = useUserStore.getState().setIsLoading;
  const setSession = useUserStore.getState().setSession;
  const setIsInitialized = useUserStore.getState().setIsInitialized;

  try {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const profile = await fetchUserProfile(session.user.id);
      setSession({
        user: {
          id: session.user.id,
          email: session.user.email || '',
          phone: session.user.phone || '',
        },
        profile,
      });
      setSentryUser({
        id: session.user.id,
        email: session.user.email || '',
        role: profile?.role
      });
    } else {
      setSession(null);
    }

    setIsLoading(false);
    setIsInitialized(true);
  } catch (error) {
    console.error('Error initializing app:', error);
    setSession(null);
    setIsLoading(false);
    setIsInitialized(true);
  }
};

// Configure QueryClient with global error handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: async (error: any) => {
      // If we get an Auth error, forcefully refresh the session under the hood
      if (error?.message?.includes('JWT') || error?.code === '401' || error?.status === 401) {
        console.warn('Token expired detected globally, forcing refresh...');
        await supabase.auth.refreshSession();
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Keep true to fetch fresh data when user returns
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Retry up to 3 times. If it's an auth error, the onError cache handler 
        // will refresh the token between retries!
        if (failureCount < 3) return true;
        return false;
      },
      retryDelay: 1000, // wait 1s between retries to let token refresh
    },
  },
});

// Initialize app and setup listener
initializeApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  )
});