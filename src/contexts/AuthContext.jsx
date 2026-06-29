import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Try to auto-sign in with the shared dashboard account from env.
    // If already signed in (token in localStorage) onAuthStateChange gives us
    // INITIAL_SESSION immediately, so we just wait for that.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') return;

        if (session) {
          // Already authenticated — go straight to dashboard
          setReady(true);
        } else {
          // No active session — try auto-login with shared account
          const email    = import.meta.env.VITE_SHARED_EMAIL;
          const password = import.meta.env.VITE_SHARED_PASSWORD;

          if (email && password) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
              console.warn('[auto-login] shared account sign-in failed:', error.message);
            }
            // onAuthStateChange will fire again with SIGNED_IN → setReady(true)
          } else {
            // No credentials configured — just open dashboard anyway
            // (works if Supabase RLS is set to public/anon access)
            setReady(true);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
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
