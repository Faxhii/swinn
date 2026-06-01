import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/AppLayout';
import OverviewPage from './pages/OverviewPage';
import SalesPage from './pages/SalesPage';
import ExpensesPage from './pages/ExpensesPage';
import PartnersPage from './pages/PartnersPage';
import PolicyPage from './pages/PolicyPage';
import './index.css';

function AppInner() {
  const { user, loading, policyAccepted } = useAuth();
  const [activePage, setActivePage] = useState('overview');

  // 1. Auth still loading
  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.4em', textAlign: 'center', marginBottom: 20, color: 'var(--text-primary)' }}>
            SWIN
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        </div>
      </div>
    );
  }

  // 2. Not logged in
  if (!user) return <AuthPage />;

  // 3. Logged in — DataProvider is ALWAYS mounted here so AppLayout's
  //    ToastContainer never crashes (DataContext always available)
  return (
    <DataProvider>
      {!policyAccepted ? (
        // Force policy page for new users who haven't accepted yet
        <AppLayout activePage="policy" onNavigate={() => {}}>
          <PolicyPage onAccepted={() => setActivePage('overview')} />
        </AppLayout>
      ) : (
        // Full dashboard
        <AppLayout activePage={activePage} onNavigate={setActivePage}>
          <div key={activePage} className="page-fade">
            {activePage === 'overview'  && <OverviewPage />}
            {activePage === 'sales'     && <SalesPage />}
            {activePage === 'expenses'  && <ExpensesPage />}
            {activePage === 'partners'  && <PartnersPage />}
            {activePage === 'policy'    && <PolicyPage />}
          </div>
        </AppLayout>
      )}
    </DataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
