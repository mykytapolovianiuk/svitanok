import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { supabase } from './lib/supabase'
import { useUserStore } from './features/auth/useUserStore'
import { useCartStore } from './store/cartStore'
import { initSentry, setSentryUser, clearSentryUser } from './lib/sentry'

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
  const setIsInitialized = useUserStore.getState().setIsInitialized; // Added for race condition fix
  
  try {
    // Set loading state
    setIsLoading(true);
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Fetch user profile
      const profile = await fetchUserProfile(session.user.id);
      
      // Set session in store
      setSession({
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        profile,
      });
      
      // Set Sentry user context
      setSentryUser({
        id: session.user.id,
        email: session.user.email || '',
        role: profile?.role
      });
    } else {
      // Clear session in store if no session
      setSession(null);
    }
    
    // Always clear loading state after initialization
    setIsLoading(false);
    setIsInitialized(true); // Added for race condition fix
  } catch (error) {
    console.error('Error initializing app:', error);
    // Error logging handled by Sentry in production
    // Clear session and loading state on error
    setSession(null);
    setIsLoading(false);
    setIsInitialized(true); // Added for race condition fix
  }
};

// Initialize app and setup listener
initializeApp().then(() => {
  // Render the app only after initialization
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
});