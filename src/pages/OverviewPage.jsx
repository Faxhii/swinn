import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { IndianRupee, TrendingUp, ShoppingBag, Wallet, Package, UserPlus, ShieldCheck, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';


const CATEGORY_COLORS = {
  Shirts: '#3b82f6',
  Pants: '#22c55e',
  Hoodies: '#a855f7',
  Accessories: '#f59e0b',
};

const BADGE_CLASS = {
  Marketing: 'badge badge-marketing',
  Production: 'badge badge-production',
  Logistics: 'badge badge-logistics',
  Equipment: 'badge badge-equipment',
  Other: 'badge badge-other',
};

function formatINR(num) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy'); } catch { return dateStr; }
}

export default function OverviewPage() {
  const { profiles, orders, expenses, profileMap, dataLoading } = useData();

  const metrics = useMemo(() => {
    const totalRevenue  = orders.reduce((s, o) => s + (o.revenue  || 0), 0);
    const unitsSold     = orders.reduce((s, o) => s + (o.quantity || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount  || 0), 0);
    return { totalRevenue, unitsSold, totalExpenses, netBalance: totalRevenue - totalExpenses };
  }, [orders, expenses]);

  const categories = useMemo(() => {
    const catMap = {};
    orders.forEach((o) => {
      const cat = o.products?.category || 'Other';
      if (!catMap[cat]) catMap[cat] = { units: 0, revenue: 0 };
      catMap[cat].units   += o.quantity || 0;
      catMap[cat].revenue += o.revenue  || 0;
    });
    const ORDER = ['Shirts', 'Pants', 'Hoodies', 'Accessories'];
    return Object.entries(catMap)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
  }, [orders]);

  const partners = useMemo(() => {
    const spendMap = {};
    expenses.forEach((e) => { spendMap[e.partner_id] = (spendMap[e.partner_id] || 0) + (e.amount || 0); });
    return profiles
      .map((p) => ({ ...p, totalSpent: spendMap[p.id] || 0 }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [profiles, expenses]);

  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  // Activity feed: merge expense events + profile join/policy events, sorted by date desc
  const activities = useMemo(() => {
    const items = [];
    expenses.slice(0, 8).forEach((e) => {
      const p = profileMap[e.partner_id];
      items.push({
        id: `exp-${e.id}`,
        type: 'expense',
        actor: p?.name || 'Unknown',
        initials: p?.avatar_initials || '?',
        message: `added a ₹${formatINR(e.amount)} ${e.category} expense`,
        sub: e.note,
        date: e.created_at || e.date,
      });
    });
    profiles.forEach((p) => {
      if (p.joined_at) {
        items.push({
          id: `join-${p.id}`,
          type: 'join',
          actor: p.name,
          initials: p.avatar_initials || '?',
          message: `joined SWIN as ${p.role === 'founder' ? 'a Founder' : 'a Partner'}`,
          date: p.joined_at,
        });
      }
      if (p.policy_accepted_at) {
        items.push({
          id: `policy-${p.id}`,
          type: 'policy',
          actor: p.name,
          initials: p.avatar_initials || '?',
          message: 'accepted the Partner Policy',
          date: p.policy_accepted_at,
        });
      }
    });
    return items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [expenses, profiles, profileMap]);

  if (dataLoading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Your business performance at a glance</p>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <MetricCard id="metric-revenue" label="Total Revenue" value={formatINR(metrics.totalRevenue)}
          icon={<TrendingUp size={20} />} iconBg="var(--green-bg)" iconColor="var(--green)" prefix="₹" />
        <MetricCard id="metric-units" label="Units Sold" value={formatINR(metrics.unitsSold)}
          icon={<ShoppingBag size={20} />} iconBg="var(--blue-bg)" iconColor="var(--blue)" />
        <MetricCard id="metric-expenses" label="Total Expenses" value={formatINR(metrics.totalExpenses)}
          icon={<IndianRupee size={20} />} iconBg="var(--red-bg)" iconColor="var(--red)" prefix="₹" />
        <MetricCard id="metric-balance" label="Net Balance" value={formatINR(Math.abs(metrics.netBalance))}
          icon={<Wallet size={20} />}
          iconBg={metrics.netBalance >= 0 ? 'var(--green-bg)' : 'var(--red-bg)'}
          iconColor={metrics.netBalance >= 0 ? 'var(--green)' : 'var(--red)'}
          prefix="₹"
          valueColor={metrics.netBalance >= 0 ? 'var(--green)' : 'var(--red)'}
          suffix={metrics.netBalance < 0 ? ' deficit' : ''} />
      </div>

      {/* Partner Leaderboard */}
      <div className="section-gap">
        <div className="section-header">
          <h2 className="section-title">Partner Spending Leaderboard</h2>
          <span className="section-count">{partners.length} partners</span>
        </div>
        {partners.length === 0 ? <EmptyState message="No partner data yet." /> : (
          <div className="partners-grid">
            {partners.map((partner, idx) => (
              <div key={partner.id} id={`partner-card-${idx}`} className="partner-card">
                <span className="partner-rank">#{idx + 1}</span>
                <div className="avatar avatar-lg">{partner.avatar_initials || '?'}</div>
                <div className="partner-info">
                  <div className="partner-name">{partner.name}</div>
                  <div className="partner-spent">Spent: <strong>₹{formatINR(partner.totalSpent)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales by Category */}
      <div className="section-gap">
        <div className="section-header">
          <h2 className="section-title">Sales by Category</h2>
        </div>
        {categories.length === 0 ? <EmptyState message="No sales data yet." /> : (
          <div className="categories-grid">
            {categories.map((cat) => (
              <div key={cat.name} id={`cat-${cat.name.toLowerCase()}`} className="category-card">
                <div className="category-label">
                  <span className="category-dot" style={{ background: CATEGORY_COLORS[cat.name] || '#666' }} />
                  {cat.name}
                </div>
                <div className="category-stat">
                  <div className="category-revenue">₹{formatINR(cat.revenue)}</div>
                  <div className="category-units">{formatINR(cat.units)} units sold</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Recent Expenses</h2>
          <span className="section-count">Last 5</span>
        </div>
        {recentExpenses.length === 0 ? <EmptyState message="No expenses yet." /> : (
          <div className="table-wrapper">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Partner</th><th>Amount</th><th>Category</th><th>Note</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense, idx) => {
                  const p = profileMap[expense.partner_id];
                  return (
                    <tr key={expense.id} id={`recent-expense-${idx}`}>
                      <td>
                        <div className="table-partner">
                          <div className="avatar avatar-sm">{p?.avatar_initials || '?'}</div>
                          <span>{p?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td><strong>₹{formatINR(expense.amount)}</strong></td>
                      <td><span className={BADGE_CLASS[expense.category] || 'badge badge-other'}>{expense.category}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{expense.note || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div style={{ marginTop: 8 }}>
        <div className="section-header">
          <h2 className="section-title">Activity Feed</h2>
          <span className="section-count">{activities.length} events</span>
        </div>
        {activities.length === 0 ? (
          <EmptyState message="No activity yet." />
        ) : (
          <div className="activity-feed">
            {activities.map((item, idx) => (
              <ActivityItem key={item.id} item={item} isLast={idx === activities.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ id, label, value, icon, iconBg, iconColor, prefix, valueColor, suffix }) {
  return (
    <div id={id} className="metric-card">
      <div className="metric-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={valueColor ? { color: valueColor } : {}}>
        {prefix && <span className="currency">{prefix}</span>}{value}
        {suffix && <span className="currency" style={{ fontSize: 13 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <Package />
      <p>{message}</p>
    </div>
  );
}

const ACTIVITY_ICONS = {
  expense: <IndianRupee size={13} />,
  join:    <UserPlus   size={13} />,
  policy:  <ShieldCheck size={13} />,
};

function ActivityItem({ item, isLast }) {
  let relTime = '';
  try {
    relTime = formatDistanceToNow(new Date(item.date), { addSuffix: true });
  } catch { relTime = ''; }

  return (
    <div className="activity-item">
      <div className="activity-left">
        <div className="avatar avatar-sm">{item.initials}</div>
        {!isLast && <div className="activity-line" />}
      </div>
      <div className="activity-body">
        <div className="activity-text">
          <span className="activity-actor">{item.actor}</span>
          {' '}{item.message}
        </div>
        {item.sub && (
          <div className="activity-sub">{item.sub}</div>
        )}
        <div className="activity-time">
          <Clock size={10} />{relTime}
        </div>
      </div>
      <div className={`activity-type-dot activity-dot-${item.type}`}>
        {ACTIVITY_ICONS[item.type]}
      </div>
    </div>
  );
}
