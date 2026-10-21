import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Activity,
  Database,
  Terminal,
  FileText,
  Clock,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { MetricCard } from '../../components/common/MetricCard';
import { Skeleton } from '../../components/common/Skeleton';
import { RegistrationTrendChart } from '../../components/charts/RegistrationTrendChart';
import { AccountStatusChart } from '../../components/charts/AccountStatusChart';
import { useToast } from '../../components/common/Toast';

export const AdminDashboard = () => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const res = await adminService.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch administrator metrics');
      toast.error(err.message || 'Error updating dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const users = data?.users || {};
  const platform = data?.platformActivity || {};
  const summary = data?.summary || {
    totalUsers: users.total || 0,
    activeUsers: users.active || 0,
    suspendedUsers: users.suspended || 0,
    adminUsers: users.admins || 0,
    regularUsers: users.regular || 0,
    totalTransactions: platform.totalTransactions || 0,
    totalBudgets: platform.totalBudgets || 0,
    totalGoals: platform.totalGoals || 0,
    totalAuditLogs: platform.totalAuditLogs || 0,
  };
  const trends = data?.registrationTrends || [];
  const health = data?.systemHealth || {};
  const recentLogs = data?.recentAuditLogs || [];

  const formatUptime = (sec) => {
    if (!sec) return '0s';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="40%" height="32px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: '120px' }}>
              <Skeleton width="60%" height="16px" style={{ marginBottom: '12px' }} />
              <Skeleton width="80%" height="28px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Administrative Overview Unavailable</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button type="button" onClick={() => fetchDashboard()} className="btn btn-primary">
          Retry Request
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            System Administration Overview
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time aggregate platform governance, account metrics, and infrastructure health
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => fetchDashboard(true)}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Privacy Policy Callout Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)',
        }}
      >
        <Lock size={18} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Zero-Knowledge Privacy Mandate:</strong> This console is strictly for platform governance.
          Individual users' income, expenses, transactions, budgets, and savings goals are strictly confidential
          and mathematically isolated from administrative queries.
        </span>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <MetricCard
          label="Total Registered Users"
          value={summary.totalUsers || 0}
          icon={Users}
          iconColor="var(--brand-primary)"
          iconBg="var(--brand-primary-light)"
          subtext={`${summary.regularUsers || 0} regular • ${summary.adminUsers || 0} admins`}
        />
        <MetricCard
          label="Active Accounts"
          value={summary.activeUsers || 0}
          icon={UserCheck}
          iconColor="var(--success)"
          iconBg="var(--success-bg)"
          trend={`${summary.totalUsers ? Math.round(((summary.activeUsers || 0) / summary.totalUsers) * 100) : 0}% Active Rate`}
          trendType="positive"
        />
        <MetricCard
          label="Suspended Accounts"
          value={summary.suspendedUsers || 0}
          icon={UserX}
          iconColor="var(--danger)"
          iconBg="var(--danger-bg)"
          trendType={summary.suspendedUsers > 0 ? 'negative' : 'neutral'}
          subtext="Requires admin review"
        />
        <MetricCard
          label="System Health Status"
          value={health.database?.status === 'connected' ? 'Healthy' : 'Degraded'}
          icon={Activity}
          iconColor={health.database?.status === 'connected' ? 'var(--success)' : 'var(--danger)'}
          iconBg={health.database?.status === 'connected' ? 'var(--success-bg)' : 'var(--danger-bg)'}
          badge={health.database?.pingMs !== null ? `${health.database?.pingMs}ms ping` : 'offline'}
          subtext={`Uptime: ${formatUptime(health.uptimeSeconds)}`}
        />
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">User Registration Velocity</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6-Month Volume</span>
          </div>
          <RegistrationTrendChart trends={trends} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Account Distribution</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active vs Suspended</span>
          </div>
          <AccountStatusChart
            active={summary.activeUsers || 0}
            suspended={summary.suspendedUsers || 0}
          />
        </div>
      </div>

      {/* Aggregate Application Footprint & Recent Audit Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Footprint Counts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Database Aggregate Records</span>
            <span className="badge badge-info">Privacy Preserving</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Financial Transactions</span>
              <span className="mono-num" style={{ fontWeight: 700 }}>{(summary.totalTransactions || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Budget Rules</span>
              <span className="mono-num" style={{ fontWeight: 700 }}>{(summary.totalBudgets || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Savings Goals Created</span>
              <span className="mono-num" style={{ fontWeight: 700 }}>{(summary.totalGoals || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Immutable Audit Log Records</span>
              <span className="mono-num" style={{ fontWeight: 700 }}>{(summary.totalAuditLogs || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent Admin Audit Logs */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Administrative Actions</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest Events</span>
          </div>

          {recentLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p>No administrative activities recorded yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    fontSize: '0.825rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, display: 'block' }}>{log.action}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Category: {log.category} • {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <span
                    className={`badge ${
                      log.outcome === 'success' ? 'badge-success' : 'badge-danger'
                    }`}
                  >
                    {log.outcome}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
