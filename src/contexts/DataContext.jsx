import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, policyAccepted } = useAuth();

  const [profiles,    setProfiles]    = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [expenses,    setExpenses]    = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataReady,   setDataReady]   = useState(false);
  const [toasts,      setToasts]      = useState([]);

  // Prevent re-fetching when user object reference changes but ID hasn't changed
  const fetchedForIdRef  = useRef(null);
  // Keep live reference to profiles for realtime callbacks
  const profilesRef = useRef([]);
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  // ── Toast helpers ──────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Initial data fetch ─────────────────────────────────────────
  // Defined WITHOUT user in deps — we pass userId explicitly to avoid re-creation on user ref change
  const fetchAll = useCallback(async (userId) => {
    if (!userId) return;
    setDataLoading(true);
    const [profilesRes, ordersRes, expensesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, email, avatar_initials, role, joined_at, policy_accepted, policy_accepted_at'),
      supabase
        .from('orders')
        .select('id, quantity, revenue, date, products(id, name, category)')
        .order('date', { ascending: true }),
      supabase
        .from('expenses')
        .select('id, partner_id, amount, category, note, date, created_at')
        .order('created_at', { ascending: false }),
    ]);
    setProfiles(profilesRes.data  || []);
    setOrders(ordersRes.data      || []);
    setExpenses(expensesRes.data  || []);
    setDataLoading(false);
    setDataReady(true);
  }, []); // ← no deps: stable reference forever

  useEffect(() => {
    const uid = user?.id;
    if (!uid || !policyAccepted) return;

    // Only fetch if this is a new user ID (prevents loops from object reference changes)
    if (fetchedForIdRef.current === uid) return;
    fetchedForIdRef.current = uid;

    fetchAll(uid);
  }, [user?.id, policyAccepted, fetchAll]);

  // ── Supabase Realtime – live expense sync ──────────────────────
  useEffect(() => {
    if (!user?.id || !policyAccepted || !dataReady) return;

    const channel = supabase
      .channel('swin-expenses-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const incoming = payload.new;
          setExpenses((prev) => {
            if (prev.find((e) => e.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
          if (incoming.partner_id !== user.id) {
            const name = profilesRef.current.find((p) => p.id === incoming.partner_id)?.name || 'A partner';
            const amt  = Number(incoming.amount).toLocaleString('en-IN');
            addToast(`${name} added a ₹${amt} ${incoming.category} expense`, 'expense');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        (payload) => {
          setExpenses((prev) => prev.filter((e) => e.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id, policyAccepted, dataReady, addToast]);

  // ── Optimistic mutations ───────────────────────────────────────
  async function addExpense(expense) {
    const { data, error } = await supabase.from('expenses').insert(expense).select().single();
    if (error) throw error;
    setExpenses((prev) => {
      if (prev.find((e) => e.id === data.id)) return prev;
      return [data, ...prev];
    });
    return data;
  }

  async function deleteExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      fetchAll(user.id);
      throw error;
    }
  }

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  return (
    <DataContext.Provider
      value={{
        profiles, orders, expenses,
        profileMap,
        dataLoading, dataReady,
        addExpense, deleteExpense,
        refreshData: () => {
          fetchedForIdRef.current = null; // allow a manual re-fetch
          fetchAll(user?.id);
        },
        toasts, addToast, removeToast,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
