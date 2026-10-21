import React, { useState } from 'react';
import { Settings, Save, Shield, Sliders, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/common/Toast';

export const AdminSettings = () => {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [paginationLimit, setPaginationLimit] = useState('15');
  const [pollInterval, setPollInterval] = useState('15');
  const [notifyOnCritical, setNotifyOnCritical] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Administrator preferences updated successfully');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '800px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Console Configuration & Preferences
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Manage administrative console defaults, visual density, and operational parameters
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Appearance & Interface */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="var(--brand-primary)" />
            Interface & Display Preferences
          </h3>

          <div className="form-group">
            <label className="form-label">Color Theme Mode</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={toggleTheme}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isDark ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} />}
                <span>Currently {isDark ? 'Dark Mode (Navy / Violet)' : 'Light Mode (Clean Slate)'}</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">User Management Table Page Size</label>
            <select
              value={paginationLimit}
              onChange={(e) => setPaginationLimit(e.target.value)}
              className="form-select"
            >
              <option value="15">15 accounts per page</option>
              <option value="25">25 accounts per page</option>
              <option value="50">50 accounts per page</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Default Infrastructure Health Polling Rate</label>
            <select
              value={pollInterval}
              onChange={(e) => setPollInterval(e.target.value)}
              className="form-select"
            >
              <option value="15">Every 15 seconds</option>
              <option value="30">Every 30 seconds</option>
              <option value="60">Every 60 seconds</option>
              <option value="0">Manual Refresh Only</option>
            </select>
          </div>
        </div>

        {/* Security & Audit Policies */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="var(--brand-secondary)" />
            Governance Retention Policy
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Audit Log Immutability:</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Enforced (Append-Only)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Minimum Retention Period:</span>
              <span style={{ fontWeight: 600 }}>365 Days (Statutory)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Administrative Session Expiry:</span>
              <span style={{ fontWeight: 600 }}>24 Hours (Signed JWT)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary">
            <Save size={18} />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
