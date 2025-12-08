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
  
  try {
    // Set loading state
    setIsLoading(true);
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Fetch user profile
      const profile = await fetchUserProfile(session.user.id);
      
      // Set session in store
      const setSession = useUserStore.getState().setSession;
      setSession({
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        profile,
      });
    } else {
      // Clear loading state if no session
      setIsLoading(false);
    }
  } catch (error) {
    // Error logging handled by Sentry in production
    // Clear loading state on error
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
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      // Fetch user profile
      const profile = await fetchUserProfile(session.user.id);
      
      // Set session in store
      const setSession = useUserStore.getState().setSession;
      setSession({
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        profile,
      });
    } else {
      // Clear session in store
      const clearSession = useUserStore.getState().clearSession;
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
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)