import { useState } from 'react';
import ToastContainer from './ToastContainer';
import {
  LayoutDashboard,
  BarChart2,
  Receipt,
  Users,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'sales',     label: 'Sales',     icon: BarChart2 },
  { id: 'expenses',  label: 'Expenses',  icon: Receipt },
  { id: 'partners',  label: 'Partners',  icon: Users },
  { id: 'policy',    label: 'Policy',    icon: ShieldCheck },
];

const PAGE_TITLES = {
  overview: 'Dashboard Overview',
  sales:    'Sales',
  expenses: 'Expenses',
  partners: 'Partners',
  policy:   'Partner Policy',
};

export default function AppLayout({ activePage, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-name">SWIN</div>
          <div className="brand-sub">Partner Dashboard</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`nav-${id}`}
              className={`nav-link ${activePage === id ? 'active' : ''}`}
              onClick={() => { onNavigate(id); setSidebarOpen(false); }}
            >
              <Icon />
              {label}
              {activePage === id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            © 2025 SWIN
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-8">
            <button id="btn-mobile-menu" className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span className="topbar-title">{PAGE_TITLES[activePage]}</span>
          </div>

          {/* Simple branding badge — no login required */}
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}>
            SWIN
          </div>
        </header>

        <div className="page-transition">
          {children}
        </div>
      </div>

      {/* Live toast notifications */}
      <ToastContainer />
    </div>
  );
}
