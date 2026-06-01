import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileSettingsModal from './ProfileSettingsModal';
import ToastContainer from './ToastContainer';
import {
  LayoutDashboard,
  BarChart2,
  Receipt,
  Users,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
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
  const { profile, signOut } = useAuth();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

          <div className="topbar-right">
            <div className="user-chip" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="avatar avatar-sm">{profile?.avatar_initials || '?'}</div>
              <div className="user-chip-info">
                <span className="user-chip-name">{profile?.name || 'Partner'}</span>
                <span className="user-chip-role">{profile?.role === 'founder' ? 'Founder' : 'Partner'}</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{profile?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{profile?.email}</div>
                  </div>

                  {/* Settings */}
                  <button
                    id="btn-open-settings"
                    className="dropdown-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      setShowSettings(true);
                    }}
                  >
                    <Settings size={14} />
                    Profile Settings
                  </button>

                  <button id="btn-nav-policy" className="dropdown-item"
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onNavigate('policy'); }}>
                    <ShieldCheck size={14} />
                    View Policy
                  </button>

                  <div className="divider" />

                  <button id="btn-sign-out" className="dropdown-item danger"
                    onClick={async (e) => { e.stopPropagation(); await signOut(); }}>
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-transition">
          {children}
        </div>
      </div>

      {/* Profile Settings Modal */}
      {showSettings && (
        <ProfileSettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Live toast notifications */}
      <ToastContainer />
    </div>
  );
}
