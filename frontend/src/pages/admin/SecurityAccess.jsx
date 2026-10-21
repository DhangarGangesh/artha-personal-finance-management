import React from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SecurityAccess = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Security & Access Governance
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Cryptographic token verification, role enforcement controls, and platform privacy architecture
        </p>
      </div>

      {/* Active Session & Identity Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ShieldCheck size={20} color="var(--brand-primary)" />
            Authenticated Identity Verification
          </span>
          <span className="badge badge-admin">Verified Administrator</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Administrator Name
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.name}</div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Authenticated Email
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{user?.email}</div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Role Assignment
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
              {user?.role?.toUpperCase()}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Account Status
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>ACTIVE</div>
          </div>
        </div>
      </div>

      {/* Security Policies Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--brand-primary)" />
            Cryptographic Authentication
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <li style={{ display: 'flex', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>HMAC-SHA256 Signed JWTs:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Stateless tokens carrying tamper-evident signatures, user ID, and verified role claims.
                </p>
              </div>
            </li>
            <li style={{ display: 'flex', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Argon2id / Bcrypt Password Hashing:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Salted credential hashes computed using adaptive cryptographic work factors. Raw passwords are never persisted.
                </p>
              </div>
            </li>
            <li style={{ display: 'flex', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>HTTP 401 Re-Authentication:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Expired tokens trigger automatic session termination and clean client-side re-routing.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--brand-secondary)" />
            Zero-Trust Authorization Safeguards
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <li style={{ display: 'flex', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Express Middleware Enforcement:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Routes under <code>/api/admin/*</code> strictly mandate <code>requireAdmin</code>. Frontend routing alone is never trusted.
                </p>
              </div>
            </li>
            <li style={{ display: 'flex', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Self-Demotion & Lockout Prevention:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Administrators cannot suspend their own account or demote the last remaining active administrator.
                </p>
              </div>
            </li>
            <li style={{ display: 'flex', gap: '0.6rem' }}>
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Zero-Knowledge User Financial Isolation:</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                  Admins cannot view or query personal financial records, transaction values, budgets, or goal amounts of any user.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecurityAccess;
