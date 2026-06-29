import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { Users, Crown, User } from 'lucide-react';

function formatINR(num) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
}

export default function PartnersPage() {
  const { profiles, expenses, dataLoading } = useData();

  const partners = useMemo(() => {
    const spendMap = {};
    expenses.forEach((e) => { spendMap[e.partner_id] = (spendMap[e.partner_id] || 0) + (e.amount || 0); });
    return profiles
      .map((p) => ({ ...p, totalSpent: spendMap[p.id] || 0 }))
      .sort((a, b) => {
        if (a.role === 'founder' && b.role !== 'founder') return -1;
        if (b.role === 'founder' && a.role !== 'founder') return 1;
        return new Date(a.joined_at || 0) - new Date(b.joined_at || 0);
      });
  }, [profiles, expenses]);

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
        <h1 className="page-title">Partners</h1>
        <p className="page-subtitle">All registered SWIN partners</p>
      </div>

      <div style={{ marginBottom: 20, padding: '10px 16px', background: 'var(--accent-dim)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Users size={14} style={{ flexShrink: 0 }} />
        Partner management and removal requires mutual agreement. No partner can remove or change another partner's role from this dashboard.
      </div>

      <div className="partners-page-grid">
        {partners.length === 0 ? (
          <div className="empty-state">
            <Users />
            <p>No partners found.</p>
          </div>
        ) : (
          partners.map((partner) => {
            const isFounder = partner.role === 'founder';
            return (
              <div key={partner.id} id={`partner-profile-${partner.id}`}
                className="partner-profile-card">

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div className={`avatar avatar-xl ${isFounder ? 'avatar-founder' : ''}`}>
                    {partner.avatar_initials || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {partner.name}
                    </div>
                    <div className={`role-badge ${isFounder ? 'role-founder' : 'role-partner'}`}>
                      {isFounder ? <Crown size={11} /> : <User size={11} />}
                      {isFounder ? 'Founder' : 'Partner'}
                    </div>
                  </div>
                </div>

                <div className="partner-profile-details">
                  <div className="partner-detail-row">
                    <span className="partner-detail-label">Email</span>
                    <span className="partner-detail-value" style={{ wordBreak: 'break-word' }}>{partner.email}</span>
                  </div>
                  <div className="partner-detail-row">
                    <span className="partner-detail-label">Joined</span>
                    <span className="partner-detail-value">{formatDate(partner.joined_at)}</span>
                  </div>
                  <div className="partner-detail-row">
                    <span className="partner-detail-label">Total Spent</span>
                    <span className="partner-detail-value" style={{ fontWeight: 600 }}>₹{formatINR(partner.totalSpent)}</span>
                  </div>
                  <div className="partner-detail-row">
                    <span className="partner-detail-label">Policy</span>
                    <span className="partner-detail-value">
                      {partner.policy_accepted_at ? (
                        <span style={{ color: 'var(--green)', fontSize: 12 }}>
                          ✓ Accepted {formatDate(partner.policy_accepted_at)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--amber)', fontSize: 12 }}>Pending</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
