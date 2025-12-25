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


initSentry();


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
    
    return null;
  }
};


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


initializeApp().then(() => {
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
});