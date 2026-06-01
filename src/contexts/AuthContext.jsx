import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setLoading(false);
      })
      .catch(() => setLoading(false)); // never stay stuck if getSession fails

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
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
      setLoading(false); // always unblock the loading screen
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

    // Pass name + initials as metadata so the DB trigger can create the profile
    // even when email confirmation is enabled (no active session yet).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar_initials: initials },
      },
    });
    if (error) throw error;

    // If email confirmation is OFF, a session is returned immediately.
    // Try an upsert so the profile exists (trigger may have already created it).
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
    await supabase.auth.signOut();
  }

  async function acceptPolicy() {
    if (!user) return;
    const now = new Date().toISOString();

    // Optimistically update local state immediately — UI unlocks instantly.
    setProfile((prev) => ({
      ...prev,
      policy_accepted: true,
      policy_accepted_at: now,
    }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ policy_accepted: true, policy_accepted_at: now })
        .eq('id', user.id);
      if (error) throw error;
    } catch (err) {
      // Revert optimistic update if DB write failed
      setProfile((prev) => ({
        ...prev,
        policy_accepted: false,
        policy_accepted_at: null,
      }));
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
