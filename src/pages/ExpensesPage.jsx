import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Plus, X, Trash2, IndianRupee, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Marketing', 'Production', 'Logistics', 'Equipment', 'Other'];

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

export default function ExpensesPage() {
  const { user, profile } = useAuth();
  const { expenses, profiles, profileMap, dataLoading, addExpense, deleteExpense } = useData();

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const [filterPartner,  setFilterPartner]  = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFrom,     setFilterFrom]     = useState('');
  const [filterTo,       setFilterTo]       = useState('');

  const [form, setForm] = useState({
    amount: '', category: 'Marketing', note: '', date: new Date().toISOString().slice(0, 10),
  });
  const [formError,   setFormError]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const filtered = useMemo(() => expenses.filter((e) => {
    if (filterPartner  && e.partner_id !== filterPartner)  return false;
    if (filterCategory && e.category   !== filterCategory) return false;
    if (filterFrom     && e.date < filterFrom)             return false;
    if (filterTo       && e.date > filterTo)               return false;
    return true;
  }), [expenses, filterPartner, filterCategory, filterFrom, filterTo]);

  const totalFiltered = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered]);
  const hasFilters = filterPartner || filterCategory || filterFrom || filterTo;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setFormError('Enter a valid amount.'); return; }
    if (!form.date)              { setFormError('Select a date.');        return; }
    if (!form.note.trim())       { setFormError('Please add a note.');    return; }

    setSubmitting(true);
    try {
      await addExpense({
        partner_id: user.id, amount, category: form.category,
        note: form.note.trim(), date: form.date,
      });
      setShowModal(false);
      setForm({ amount: '', category: 'Marketing', note: '', date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track and manage all partner expenses</p>
        </div>
        <button id="btn-add-expense" className="btn btn-primary"
          onClick={() => { setShowModal(true); setFormError(''); }}>
          <Plus size={16} />Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-partner">Partner</label>
          <select id="filter-partner" className="filter-select" value={filterPartner}
            onChange={(e) => setFilterPartner(e.target.value)}>
            <option value="">All Partners</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-category">Category</label>
          <select id="filter-category" className="filter-select" value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-from">From</label>
          <input id="filter-from" type="date" className="filter-input" value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-to">To</label>
          <input id="filter-to" type="date" className="filter-input" value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)} />
        </div>
        {hasFilters && (
          <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
            <label className="filter-label" style={{ visibility: 'hidden' }}>Clear</label>
            <button id="btn-clear-filters" className="btn btn-secondary"
              onClick={() => { setFilterPartner(''); setFilterCategory(''); setFilterFrom(''); setFilterTo(''); }}>
              <X size={14} />Clear
            </button>
          </div>
        )}
      </div>

      {/* Total bar */}
      <div className="total-bar">
        <span className="total-bar-label">
          {hasFilters ? `Filtered Total (${filtered.length} of ${expenses.length})` : 'Total Expenses'}
        </span>
        <span className="total-bar-value">₹{formatINR(totalFiltered)}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="table-wrapper">
          <div className="empty-state">
            <IndianRupee />
            <p>No expenses found.{hasFilters ? ' Try clearing filters.' : ' Add your first expense.'}</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Partner</th><th>Amount</th><th>Category</th><th>Note</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense, idx) => {
                const p     = profileMap[expense.partner_id];
                const isOwn = expense.partner_id === user?.id;
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
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 240 }}>{expense.note || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</td>
                    <td>
                      {isOwn && (
                        <button id={`btn-delete-expense-${idx}`} className="btn-icon-danger"
                          title="Delete this expense" onClick={() => setDeleteId(expense.id)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Expense</h2>
              <button id="btn-close-modal" onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: 14, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
              Adding as: <strong style={{ color: 'var(--text-primary)' }}>{profile?.name}</strong>
            </div>
            {formError && <div className="auth-error">{formError}</div>}
            <form onSubmit={handleSubmit} id="add-expense-form">
              <div className="form-group">
                <label className="form-label" htmlFor="expense-amount">Amount (₹)</label>
                <input id="expense-amount" type="number" className="form-input" placeholder="0" min="1" step="0.01"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
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
                <textarea id="expense-note" className="form-textarea" placeholder="What was this money used for?"
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
                  Per policy, expenses above ₹10,000 require approval from at least one other partner.
                </div>
              )}
              <div className="modal-actions">
                <button id="btn-cancel-expense" type="button" className="btn btn-secondary"
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button id="btn-submit-expense" type="submit" className="btn btn-primary"
                  disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? <span className="spinner" /> : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={22} style={{ color: 'var(--red)' }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Delete Expense?</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button id="btn-cancel-delete" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setDeleteId(null)}>Cancel</button>
              <button id="btn-confirm-delete" className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
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
