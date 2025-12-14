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
  
  try {
    // Set loading state
    setIsLoading(true);
    
    // Debug: Log localStorage before getting session
    if (import.meta.env.DEV) {
      console.log('LocalStorage before getSession:', {...localStorage});
    }
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (import.meta.env.DEV) {
      console.log('Supabase session from getSession:', session);
    }
    
    if (session) {
      // Fetch user profile
      const profile = await fetchUserProfile(session.user.id);
      
      if (import.meta.env.DEV) {
        console.log('User profile:', profile);
      }
      
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
  } catch (error) {
    console.error('Error initializing app:', error);
    // Error logging handled by Sentry in production
    // Clear session and loading state on error
    setSession(null);
    setIsLoading(false);
  }
};

// Setup auth state change listener
let authListenerInitialized = false;

const setupAuthListener = () => {
  // Prevent multiple listeners
  if (authListenerInitialized) {
    return;
  }
  
  const setIsLoading = useUserStore.getState().setIsLoading;
  const setSession = useUserStore.getState().setSession;
  const clearSession = useUserStore.getState().clearSession;
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user.id); // Debug log
    
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
      // Clear session in store
      clearSession();
      
      // Clear Sentry user context
      clearSentryUser();
      
      // Clear cart when user logs out
      const { clearCart } = useCartStore.getState();
      clearCart();
    }
    
    // Clear loading state after auth change
    setIsLoading(false);
  });
  
  authListenerInitialized = true;
};

// Initialize app and setup listener
initializeApp().then(() => {
  setupAuthListener();
  
  // Render the app only after initialization
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
});