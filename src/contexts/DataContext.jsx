import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, policyAccepted } = useAuth();

  const [profiles, setProfiles]       = useState([]);
  const [orders, setOrders]           = useState([]);
  const [expenses, setExpenses]       = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataReady, setDataReady]     = useState(false);
  const [toasts, setToasts]           = useState([]);

  // Keep a live ref to profiles so realtime callbacks can read current names
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
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    if (user && policyAccepted) fetchAll();
  }, [user, policyAccepted, fetchAll]);

  // ── Supabase Realtime – live expense sync ──────────────────────
  useEffect(() => {
    if (!user || !policyAccepted || !dataReady) return;

    const channel = supabase
      .channel('swin-expenses-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const incoming = payload.new;
          setExpenses((prev) => {
            if (prev.find((e) => e.id === incoming.id)) return prev; // dedup
            return [incoming, ...prev];
          });
          // Only notify for OTHER partners' additions
          if (incoming.partner_id !== user.id) {
            const name =
              profilesRef.current.find((p) => p.id === incoming.partner_id)?.name ||
              'A partner';
            const amt = Number(incoming.amount).toLocaleString('en-IN');
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
  }, [user, policyAccepted, dataReady, addToast]);

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
      await fetchAll(); // revert on failure
      throw error;
    }
  }

  // ── Derived ────────────────────────────────────────────────────
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  return (
    <DataContext.Provider
      value={{
        profiles, orders, expenses,
        profileMap,
        dataLoading, dataReady,
        addExpense, deleteExpense,
        refreshData: fetchAll,
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
