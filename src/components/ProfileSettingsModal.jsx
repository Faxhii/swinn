import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, User, Lock, Check, Crown } from 'lucide-react';

export default function ProfileSettingsModal({ onClose }) {
  const { profile, refreshProfile } = useAuth();

  // ── Name ───────────────────────────────────────────────────────
  const [name, setName]           = useState(profile?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError]   = useState('');

  // ── Password ───────────────────────────────────────────────────
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError]     = useState('');

  // Live preview of initials as user types
  const previewInitials = name.trim()
    ? name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.avatar_initials || '?');

  async function handleNameSave(e) {
    e.preventDefault();
    if (!name.trim()) { setNameError('Name cannot be empty.'); return; }
    setNameError('');
    setNameSaving(true);
    try {
      const initials = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim(), avatar_initials: initials })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2500);
    } catch (err) {
      setNameError(err.message);
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 6)    { setPwError('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwSuccess(true);
      setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal settings-modal">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Profile Settings</h2>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        {/* Avatar preview */}
        <div className="settings-profile-banner">
          <div className="avatar avatar-xl" style={{ fontSize: 20, fontWeight: 800, border: '2px solid var(--border-light)' }}>
            {previewInitials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
              {name.trim() || profile?.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile?.email}</div>
            <div className={`role-badge ${profile?.role === 'founder' ? 'role-founder' : 'role-partner'}`} style={{ marginTop: 8, display: 'inline-flex' }}>
              {profile?.role === 'founder' ? <Crown size={10} /> : <User size={10} />}
              {profile?.role === 'founder' ? 'Founder' : 'Partner'}
            </div>
          </div>
        </div>

        {/* Section: Display Name */}
        <div className="settings-section">
          <div className="settings-section-label">
            <User size={13} /> Display Name
          </div>
          {nameError   && <div className="auth-error"   style={{ marginBottom: 10, fontSize: 13 }}>{nameError}</div>}
          {nameSuccess && <div className="auth-success" style={{ marginBottom: 10, fontSize: 13 }}>✓ Name updated</div>}
          <form onSubmit={handleNameSave} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={nameSaving} style={{ flexShrink: 0 }}>
              {nameSaving ? <span className="spinner" /> : nameSuccess ? <Check size={16} /> : 'Save'}
            </button>
          </form>
        </div>

        <div className="settings-divider" />

        {/* Section: Password */}
        <div className="settings-section">
          <div className="settings-section-label">
            <Lock size={13} /> Change Password
          </div>
          {pwError   && <div className="auth-error"   style={{ marginBottom: 10, fontSize: 13 }}>{pwError}</div>}
          {pwSuccess && <div className="auth-success" style={{ marginBottom: 10, fontSize: 13 }}>✓ Password changed</div>}
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-newpw">New Password</label>
              <input id="settings-newpw" type="password" className="form-input" placeholder="Min 6 characters"
                value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-confirmpw">Confirm Password</label>
              <input id="settings-confirmpw" type="password" className="form-input" placeholder="Re-enter password"
                value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={pwSaving}
              style={{ justifyContent: 'center', marginTop: 4 }}>
              {pwSaving ? <span className="spinner" /> : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
