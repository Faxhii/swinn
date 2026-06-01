import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track the last user ID we fetched a profile for — prevents duplicate fetches
  const fetchedForIdRef = useRef(null);

  useEffect(() => {
    // onAuthStateChange fires IMMEDIATELY with the stored session on page load
    // (event = 'INITIAL_SESSION'). No need for a separate getSession() call.
    // Using both getSession + onAuthStateChange was the cause of the double-fetch loop.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const incomingUser = session?.user ?? null;
        setUser(incomingUser);

        if (incomingUser) {
          // Only fetch profile if the user actually changed
          if (fetchedForIdRef.current !== incomingUser.id) {
            fetchedForIdRef.current = incomingUser.id;
            await fetchProfile(incomingUser.id);
          } else {
            // Same user — just make sure loading is cleared
            setLoading(false);
          }
        } else {
          fetchedForIdRef.current = null;
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data ?? null);
    } catch (err) {
      console.warn('fetchProfile error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    } catch (err) {
      console.warn('refreshProfile error:', err);
    }
  }

  async function signUp(email, password, name) {
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar_initials: initials },
      },
    });
    if (error) throw error;

    // If email confirmation is OFF, session is returned immediately — upsert profile
    if (data.session && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        avatar_initials: initials,
        role: 'partner',
        policy_accepted: false,
      }, { onConflict: 'id', ignoreDuplicates: true });
    }

    return data;
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    fetchedForIdRef.current = null;
    await supabase.auth.signOut();
  }

  async function acceptPolicy() {
    if (!user) return;
    const now = new Date().toISOString();

    // Optimistic update — unlock dashboard instantly
    setProfile((prev) => ({ ...prev, policy_accepted: true, policy_accepted_at: now }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ policy_accepted: true, policy_accepted_at: now })
        .eq('id', user.id);
      if (error) throw error;
    } catch (err) {
      // Revert on failure
      setProfile((prev) => ({ ...prev, policy_accepted: false, policy_accepted_at: null }));
      throw err;
    }
  }

  const policyAccepted = profile?.policy_accepted === true;

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, policyAccepted, signUp, signIn, signOut, acceptPolicy, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
