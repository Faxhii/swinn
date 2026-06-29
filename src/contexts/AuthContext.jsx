import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // 1. Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isMounted) setReady(true);
          return;
        }

        // 2. No session? Try to sign in silently with the shared account
        const email = import.meta.env.VITE_SHARED_EMAIL;
        const password = import.meta.env.VITE_SHARED_PASSWORD;

        if (email && password) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            console.warn('[SWIN] Auto-login failed:', error.message);
          }
        }
      } catch (err) {
        console.warn('[SWIN] Auth initialization error:', err);
      } finally {
        // 3. ALWAYS set ready to true, even if login failed!
        // This ensures the spinner disappears and the app actually loads.
        if (isMounted) setReady(true);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
