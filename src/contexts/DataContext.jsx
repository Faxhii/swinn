import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [profiles,    setProfiles]    = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [expenses,    setExpenses]    = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataReady,   setDataReady]   = useState(false);
  const [toasts,      setToasts]      = useState([]);

  const hasFetchedRef = useRef(false);

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
  const fetchAll = useCallback(async () => {
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
  }, []);

  // Fetch once on mount (auth is handled by AuthProvider auto-login)
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchAll();
  }, [fetchAll]);

  // ── Supabase Realtime – live expense sync ──────────────────────
  useEffect(() => {
    if (!dataReady) return;

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
          // Show toast for all new expenses
          const name = profilesRef.current.find((p) => p.id === incoming.partner_id)?.name || incoming.partner_id;
          const amt  = Number(incoming.amount).toLocaleString('en-IN');
          addToast(`${name} added a ₹${amt} ${incoming.category} expense`, 'expense');
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
  }, [dataReady, addToast]);

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
      fetchAll();
      throw error;
    }
  }

  // useMemo prevents profileMap from being a new object reference on every render
  const profileMap = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles]
  );

  return (
    <DataContext.Provider
      value={{
        profiles, orders, expenses,
        profileMap,
        dataLoading, dataReady,
        addExpense, deleteExpense,
        refreshData: () => { hasFetchedRef.current = false; fetchAll(); },
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
