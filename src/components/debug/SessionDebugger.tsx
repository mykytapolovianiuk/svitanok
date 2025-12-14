import { useEffect, useState } from 'react';
import { useUserStore } from '../../features/auth/useUserStore';
import { supabase } from '../../lib/supabase';

export default function SessionDebugger() {
  const { session, isLoading } = useUserStore();
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({});
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get localStorage items
    const items: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorageItems(items);

    // Get Supabase session directly
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setSupabaseSession(data.session);
        }
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 bg-red-100 border border-red-400 text-red-700 p-4 m-4 rounded z-50 max-w-md">
      <h3 className="font-bold mb-2">Session Debugger</h3>
      
      {error && (
        <div className="mb-2">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="mb-2">
        <strong>Loading:</strong> {isLoading ? 'true' : 'false'}
      </div>
      
      <div className="mb-2">
        <strong>User Store Session:</strong>
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      <div className="mb-2">
        <strong>Supabase Direct Session:</strong>
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(supabaseSession, null, 2)}
        </pre>
      </div>
      
      <div>
        <strong>LocalStorage Items:</strong>
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(localStorageItems, null, 2)}
        </pre>
      </div>
    </div>
  );
}