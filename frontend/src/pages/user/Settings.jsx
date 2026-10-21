import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Wallet,
  Globe,
  Download,
  CheckCircle2,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/common/Toast';

export const Settings = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile State
  const [name, setName] = useState(user?.name || 'Ethan Cole');
  const [email] = useState(user?.email || 'ethan.cole@example.com');
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // Notifications State
  const [notifyBudget, setNotifyBudget] = useState(true);
  const [notifyIncome, setNotifyIncome] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(false);
  const [notifySecurity, setNotifySecurity] = useState(true);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Financial Thresholds
  const [budgetThreshold, setBudgetThreshold] = useState('85');
  const [autoCategorization, setAutoCategorization] = useState(true);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success('Profile preferences updated successfully');
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter both your current and new password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    toast.success('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleExportData = () => {
    const dummyExport = {
      user: { name, email, currency },
      exportDate: new Date().toISOString(),
      note: 'Artha Personal Finance Management Data Export',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dummyExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `artha_financial_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Financial data exported to JSON');
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Regional', icon: User },
    { id: 'financial', label: 'Financial Preferences', icon: Wallet },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Account Settings
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Manage your personal profile, alert preferences, regional currency, and account security
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
                backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile & Regional */}
      {activeTab === 'profile' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Personal Profile</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Your identity across the personal finance portal
              </p>
            </div>
            <span className="badge badge-info">{user?.role?.toUpperCase() || 'USER'}</span>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="form-input"
                  style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--bg-subtle)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Display Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="form-select"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="form-select"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/24/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Financial Preferences */}
      {activeTab === 'financial' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Budgeting & Analytics Rules</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Tune automated alerts and forecasting parameters
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Budget Warning Threshold
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Receive visual warnings when an expense category surpasses this percentage of its budget
                </p>
              </div>
              <select
                value={budgetThreshold}
                onChange={(e) => {
                  setBudgetThreshold(e.target.value);
                  toast.success(`Budget threshold set to ${e.target.value}%`);
                }}
                className="form-select"
                style={{ width: '120px' }}
              >
                <option value="75">75%</option>
                <option value="80">80%</option>
                <option value="85">85%</option>
                <option value="90">90%</option>
                <option value="95">95%</option>
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Rule-based Auto-categorization
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Automatically classify recurring transactions based on merchant patterns
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoCategorization}
                onChange={(e) => {
                  setAutoCategorization(e.target.checked);
                  toast.success(`Auto-categorization ${e.target.checked ? 'enabled' : 'disabled'}`);
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Export Financial Records
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Download all verified transactions, budgets, and savings goals as an encrypted JSON backup
                </p>
              </div>
              <button type="button" onClick={handleExportData} className="btn btn-secondary">
                <Download size={15} />
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Notification Channels</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Select when and how you wish to receive financial updates
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Budget Threshold Exceeded
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Instant push notification when spending crosses your configured cap
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyBudget}
                onChange={(e) => {
                  setNotifyBudget(e.target.checked);
                  toast.success('Preference saved');
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Income & Deposits
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Notification when new salary, freelance, or investment revenue is logged
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyIncome}
                onChange={(e) => {
                  setNotifyIncome(e.target.checked);
                  toast.success('Preference saved');
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Weekly Financial Digest
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  A summarized email on Monday mornings highlighting trends and savings progress
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyWeeklyReport}
                onChange={(e) => {
                  setNotifyWeeklyReport(e.target.checked);
                  toast.success('Preference saved');
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Security & Login Alerts
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  High-priority alerts for new device logins and password modifications
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifySecurity}
                onChange={(e) => {
                  setNotifySecurity(e.target.checked);
                  toast.success('Preference saved');
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Privacy */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Change Password</h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Protect your account with a strong, unique password
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 characters"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-type new password"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                Update Password
              </button>
            </form>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Two-Factor Authentication (2FA)
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Add an extra layer of security using an authenticator app (Google Authenticator, Authy)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  toast.success(`Two-factor authentication ${!twoFactorEnabled ? 'activated' : 'deactivated'}`);
                }}
                className={`btn ${twoFactorEnabled ? 'btn-danger' : 'btn-secondary'}`}
              >
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
