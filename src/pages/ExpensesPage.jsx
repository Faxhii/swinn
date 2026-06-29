import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { Plus, X, Trash2, IndianRupee, AlertTriangle, User } from 'lucide-react';

const CATEGORIES = ['Marketing', 'Production', 'Logistics', 'Equipment', 'Other'];

// The 4 partners whose money can be tracked.
// Names must LOOSELY match the name stored in their Supabase profile.
const PARTNER_NAMES = ['Fadhi', 'Hisham', 'Sinan SV', 'Mohammed'];

const BADGE_CLASS = {
  Marketing:  'badge badge-marketing',
  Production: 'badge badge-production',
  Logistics:  'badge badge-logistics',
  Equipment:  'badge badge-equipment',
  Other:      'badge badge-other',
};

function formatINR(num) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy'); } catch { return dateStr; }
}

/**
 * Match a display name (e.g. "Sinan SV") to a profile in Supabase.
 * Tries exact match first, then partial/contains match — case-insensitive.
 */
function matchProfile(profiles, displayName) {
  const lower = displayName.toLowerCase();
  // 1. Exact match
  let found = profiles.find((p) => p.name?.toLowerCase() === lower);
  // 2. Profile name contains the display name
  if (!found) found = profiles.find((p) => p.name?.toLowerCase().includes(lower));
  // 3. Display name contains the profile name
  if (!found) found = profiles.find((p) => lower.includes(p.name?.toLowerCase() || ''));
  return found || null;
}

export default function ExpensesPage() {
  const { expenses, profiles, profileMap, dataLoading, addExpense, deleteExpense } = useData();

  const [showModal, setShowModal] = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);
  const [deleting,  setDeleting]  = useState(false);

  // Filters
  const [filterPartner,  setFilterPartner]  = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth,    setFilterMonth]    = useState('');

  const [form, setForm] = useState({
    partner:  PARTNER_NAMES[0],           // ← NEW: whose money
    amount:   '',
    category: 'Marketing',
    note:     '',
    date:     new Date().toISOString().slice(0, 10),
  });
  const [formError,  setFormError]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => expenses.filter((e) => {
    if (filterPartner  && e.partner_id !== filterPartner)  return false;
    if (filterCategory && e.category   !== filterCategory) return false;
    if (filterMonth    && !e.date?.startsWith(filterMonth)) return false;
    return true;
  }), [expenses, filterPartner, filterCategory, filterMonth]);

  const totalFiltered = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered]);
  const hasFilters = filterPartner || filterCategory || filterMonth;

  function clearFilters() {
    setFilterPartner('');
    setFilterCategory('');
    setFilterMonth('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setFormError('Enter a valid amount.'); return; }
    if (!form.date)             { setFormError('Select a date.');        return; }
    if (!form.note.trim())      { setFormError('Please add a note.');    return; }

    // Match the selected partner name → their Supabase profile ID
    const matchedProfile = matchProfile(profiles, form.partner);
    if (!matchedProfile) {
      setFormError(`No profile found for "${form.partner}". Make sure they are registered in the admin dashboard.`);
      return;
    }

    setSubmitting(true);
    try {
      await addExpense({
        partner_id: matchedProfile.id,
        amount,
        category: form.category,
        note: form.note.trim(),
        date: form.date,
      });
      setShowModal(false);
      setForm({
        partner:  PARTNER_NAMES[0],
        amount:   '',
        category: 'Marketing',
        note:     '',
        date:     new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteExpense(deleteId); }
    finally { setDeleting(false); setDeleteId(null); }
  }

  if (dataLoading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">

      {/* Header */}
      <div className="exp-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track and manage all partner expenses</p>
        </div>
        <button id="btn-add-expense" className="btn btn-primary"
          onClick={() => { setShowModal(true); setFormError(''); }}>
          <Plus size={16} />Add
        </button>
      </div>

      {/* Filters */}
      <div className="exp-filters">
        <select id="filter-partner" className="form-select exp-filter" value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}>
          <option value="">All Partners</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select id="filter-category" className="form-select exp-filter" value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <input id="filter-month" type="month" className="form-input exp-filter" value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)} placeholder="Month" />

        {hasFilters && (
          <button id="btn-clear-filters" className="btn btn-secondary" onClick={clearFilters}
            style={{ gap: 6, flexShrink: 0 }}>
            <X size={13} />Clear
          </button>
        )}
      </div>

      {/* Total */}
      <div className="exp-total-bar">
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {hasFilters ? `Filtered (${filtered.length} of ${expenses.length})` : `Total · ${expenses.length} entries`}
        </span>
        <span style={{ fontSize: 20, fontWeight: 700 }}>₹{formatINR(totalFiltered)}</span>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <IndianRupee />
          <p>{hasFilters ? 'No expenses match your filters.' : 'No expenses yet. Add the first one!'}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrapper exp-table-desktop">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Partner</th><th>Amount</th><th>Category</th><th>Note</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense, idx) => {
                  const p = profileMap[expense.partner_id];
                  return (
                    <tr key={expense.id} id={`expense-row-${idx}`}>
                      <td>
                        <div className="table-partner">
                          <div className="avatar avatar-sm">{p?.avatar_initials || '?'}</div>
                          <span>{p?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td><strong>₹{formatINR(expense.amount)}</strong></td>
                      <td><span className={BADGE_CLASS[expense.category] || 'badge badge-other'}>{expense.category}</span></td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>{expense.note || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span>{formatDate(expense.date)}</span>
                          <button className="btn-icon-danger" title="Delete"
                            onClick={() => setDeleteId(expense.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="exp-cards-mobile">
            {filtered.map((expense) => {
              const p = profileMap[expense.partner_id];
              return (
                <div key={expense.id} className="exp-card">
                  <div className="exp-card-top">
                    <div className="table-partner">
                      <div className="avatar avatar-sm">{p?.avatar_initials || '?'}</div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{p?.name || 'Unknown'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 16 }}>₹{formatINR(expense.amount)}</strong>
                      <button className="btn-icon-danger" onClick={() => setDeleteId(expense.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="exp-card-bottom">
                    <span className={BADGE_CLASS[expense.category] || 'badge badge-other'}>{expense.category}</span>
                    {expense.note && <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{expense.note}</span>}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Add Expense Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn"><X size={18} /></button>
            </div>

            {formError && <div className="auth-error">{formError}</div>}

            <form onSubmit={handleSubmit} id="add-expense-form">

              {/* ── Whose money? dropdown ── */}
              <div className="form-group">
                <label className="form-label" htmlFor="expense-partner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} style={{ color: 'var(--text-muted)' }} />
                    Whose money is this?
                  </div>
                </label>
                <select
                  id="expense-partner"
                  className="form-select"
                  value={form.partner}
                  onChange={(e) => setForm({ ...form, partner: e.target.value })}
                >
                  {PARTNER_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-amount">Amount (₹)</label>
                <input id="expense-amount" type="number" className="form-input" placeholder="0"
                  min="1" step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-category">Category</label>
                <select id="expense-category" className="form-select" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-note">Note</label>
                <textarea id="expense-note" className="form-textarea" placeholder="What was this for?"
                  value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expense-date">Date</label>
                <input id="expense-date" type="date" className="form-input" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>

              {parseFloat(form.amount) > 10000 && (
                <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--amber-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--amber)', marginBottom: 12 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  Expenses above ₹10,000 require approval from another partner.
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="btn-submit-expense" type="submit" className="btn btn-primary"
                  disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? <span className="spinner" /> : `Add for ${form.partner}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={20} style={{ color: 'var(--red)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Delete Expense?</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className="spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
