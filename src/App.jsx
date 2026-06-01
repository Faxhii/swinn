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

  if (!user) return <AuthPage />;

  // Force policy page until accepted
  if (!policyAccepted) {
    return (
      <AppLayout activePage="policy" onNavigate={() => {}}>
        <PolicyPage onAccepted={() => setActivePage('overview')} />
      </AppLayout>
    );
  }

  return (
    <DataProvider>
      <AppLayout activePage={activePage} onNavigate={setActivePage}>
        <div key={activePage} className="page-fade">
          {activePage === 'overview'  && <OverviewPage />}
          {activePage === 'sales'     && <SalesPage />}
          {activePage === 'expenses'  && <ExpensesPage />}
          {activePage === 'partners'  && <PartnersPage />}
          {activePage === 'policy'    && <PolicyPage />}
        </div>
      </AppLayout>
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
