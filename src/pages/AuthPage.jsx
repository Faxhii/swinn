import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!regName.trim()) { setError('Please enter your full name.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signUp(regEmail, regPassword, regName.trim());
      setSuccess('Account created! Check your email to confirm, then log in.');
      setTab('login');
      setLoginEmail(regEmail);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">SWIN</div>
        <div className="auth-tagline">Partner Dashboard</div>

        <div className="auth-tabs">
          <button id="tab-login" className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>
            Log In
          </button>
          <button id="tab-register" className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setSuccess(''); }}>
            Register
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input id="login-email" type="email" className="form-input" placeholder="you@example.com"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input id="login-password" type="password" className="form-input" placeholder="••••••••"
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <button id="btn-login" type="submit" className="btn btn-primary w-full"
              style={{ justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Log In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} id="register-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input id="reg-name" type="text" className="form-input" placeholder="Your Name"
                value={regName} onChange={(e) => setRegName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
                value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="form-input" placeholder="Min 6 characters"
                value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button id="btn-register" type="submit" className="btn btn-primary w-full"
              style={{ justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <ShieldCheck size={16} style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            First-time partners must read and accept the SWIN Partner Policy before accessing the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
