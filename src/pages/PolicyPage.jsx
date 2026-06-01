import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { POLICY_VERSION, POLICY_UPDATED, POLICY_SECTIONS, POLICY_FOOTER } from '../lib/policyText';
import { ShieldCheck, CheckCircle } from 'lucide-react';

export default function PolicyPage({ onAccepted }) {
  const { profile, acceptPolicy } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [error,     setError]     = useState('');

  const alreadyAccepted = profile?.policy_accepted === true;

  async function handleAccept() {
    setError('');
    setAccepting(true);
    try {
      await acceptPolicy();
      if (onAccepted) onAccepted();
    } catch (err) {
      setError(err.message || 'Failed to accept policy. Please try again.');
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Partner Policy</h1>
        <p className="page-subtitle">Read carefully before accessing the dashboard</p>
      </div>

      <div className="policy-card">

        {/* Policy document header */}
        <div className="policy-doc-header">
          <div className="policy-doc-title">SWIN PARTNER POLICY</div>
          <div className="policy-meta-row">
            <span className="policy-meta-item">
              <span className="policy-meta-label">Version</span>
              <span className="policy-meta-value">{POLICY_VERSION}</span>
            </span>
            <span className="policy-meta-sep">·</span>
            <span className="policy-meta-item">
              <span className="policy-meta-label">Last Updated</span>
              <span className="policy-meta-value">{POLICY_UPDATED}</span>
            </span>
          </div>
          <p className="policy-intro">
            This policy applies to all founding and active partners of SWIN.
            By accessing this dashboard you agree to the following terms.
          </p>
        </div>

        {/* Policy content — flows naturally, NO inner scroll box */}
        <div className="policy-body">
          {POLICY_SECTIONS.map((section) => (
            <div key={section.number} className="policy-section">
              <div className="policy-section-title">
                {section.number}. {section.title}
              </div>
              <p className="policy-section-body">{section.body}</p>
            </div>
          ))}
          <div className="policy-footer-text">{POLICY_FOOTER}</div>
        </div>

        {/* Accept / Already accepted bar */}
        <div className="policy-action-bar">
          {alreadyAccepted ? (
            <div className="policy-accepted-banner">
              <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span>
                You accepted this policy on{' '}
                <strong>
                  {profile?.policy_accepted_at
                    ? format(new Date(profile.policy_accepted_at), 'MMMM d, yyyy')
                    : '—'}
                </strong>
              </span>
            </div>
          ) : (
            <>
              {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}
              <button
                id="btn-accept-policy"
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center' }}
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? <span className="spinner" /> : (
                  <>
                    <ShieldCheck size={16} />
                    I Accept the SWIN Partner Policy
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
