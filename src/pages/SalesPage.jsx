import { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { TrendingUp, ShoppingBag } from 'lucide-react';

const CATEGORY_COLORS = {
  Shirts: '#3b82f6',
  Pants: '#22c55e',
  Hoodies: '#a855f7',
  Accessories: '#f59e0b',
};

function formatINR(num) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num || 0);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--text-secondary)' }}>Revenue: <strong style={{ color: 'var(--text-primary)' }}>₹{formatINR(payload[0].value)}</strong></div>
        {payload[1] && <div style={{ color: 'var(--text-secondary)' }}>Units: <strong style={{ color: 'var(--text-primary)' }}>{payload[1].value}</strong></div>}
      </div>
    );
  }
  return null;
};

export default function SalesPage() {
  const { orders, dataLoading } = useData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const filtered = useMemo(() => orders.filter((o) => {
    if (dateFrom && o.date < dateFrom) return false;
    if (dateTo   && o.date > dateTo)   return false;
    return true;
  }), [orders, dateFrom, dateTo]);

  const totalRevenue = useMemo(() => filtered.reduce((s, o) => s + (o.revenue  || 0), 0), [filtered]);
  const totalUnits   = useMemo(() => filtered.reduce((s, o) => s + (o.quantity || 0), 0), [filtered]);

  const catData = useMemo(() => {
    const catMap = {};
    filtered.forEach((o) => {
      const cat = o.products?.category || 'Other';
      if (!catMap[cat]) catMap[cat] = { units: 0, revenue: 0 };
      catMap[cat].units   += o.quantity || 0;
      catMap[cat].revenue += o.revenue  || 0;
    });
    return Object.entries(catMap)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const now    = new Date();
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    return months.map((m) => {
      const label = format(m, 'MMM yy');
      const start = format(startOfMonth(m), 'yyyy-MM-dd');
      const end   = format(endOfMonth(m),   'yyyy-MM-dd');
      const mo    = orders.filter((o) => o.date >= start && o.date <= end);
      return {
        month:   label,
        revenue: mo.reduce((s, o) => s + (o.revenue  || 0), 0),
        units:   mo.reduce((s, o) => s + (o.quantity || 0), 0),
      };
    });
  }, [orders]);

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
        <h1 className="page-title">Sales</h1>
        <p className="page-subtitle">Revenue and units across all products</p>
      </div>

      {/* Top metrics */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 600 }}>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
            <ShoppingBag size={20} />
          </div>
          <div className="metric-label">Total Units Sold</div>
          <div className="metric-value">{formatINR(totalUnits)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value"><span className="currency">₹</span>{formatINR(totalRevenue)}</div>
        </div>
      </div>

      {/* Date filter */}
      <div className="filters-row" style={{ marginBottom: 24 }}>
        <div className="filter-group">
          <label className="filter-label" htmlFor="sales-from">From Date</label>
          <input id="sales-from" type="date" className="filter-input" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="sales-to">To Date</label>
          <input id="sales-to" type="date" className="filter-input" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {(dateFrom || dateTo) && (
          <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
            <label className="filter-label" style={{ visibility: 'hidden' }}>Clear</label>
            <button id="btn-clear-sales-filter" className="btn btn-secondary"
              onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Category breakdown table */}
      <div className="section-gap">
        <div className="section-header">
          <h2 className="section-title">Breakdown by Category</h2>
        </div>
        {catData.length === 0 ? (
          <div className="empty-state"><ShoppingBag /><p>No sales data found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Category</th><th>Units Sold</th><th>Revenue</th><th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {catData.map((cat) => {
                  const pct = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={cat.name} id={`sales-cat-${cat.name.toLowerCase()}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: CATEGORY_COLORS[cat.name] || '#666', flexShrink: 0,
                          }} />
                          <strong>{cat.name}</strong>
                        </div>
                      </td>
                      <td>{formatINR(cat.units)}</td>
                      <td><strong>₹{formatINR(cat.revenue)}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ height: 6, width: 80, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: CATEGORY_COLORS[cat.name] || '#666', borderRadius: 99 }} />
                          </div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly sales trend chart */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Monthly Sales Trend</h2>
          <span className="section-count">Last 6 months</span>
        </div>
        <div className="chart-card">
          {monthlyData.every((m) => m.revenue === 0) ? (
            <div className="empty-state"><TrendingUp /><p>No monthly data available yet.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-dim)' }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={i === monthlyData.length - 1 ? '#ffffff' : '#ffffff33'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
