import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  PlusCircle,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { MetricCard } from '../../components/common/MetricCard';
import { Skeleton } from '../../components/common/Skeleton';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

export const DatasetManagement = () => {
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal triggers
  const [isSeedOpen, setIsSeedOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isOperating, setIsOperating] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getDatasetStats();
      setStats(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch dataset telemetry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSeed = async () => {
    setIsOperating(true);
    try {
      const res = await adminService.seedDataset();
      toast.success(
        `Synthetic dataset generated: ${res.usersCount} demo accounts, ${res.transactionsCount} transactions.`
      );
      setIsSeedOpen(false);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to seed synthetic dataset');
    } finally {
      setIsOperating(false);
    }
  };

  const handleClear = async () => {
    setIsOperating(true);
    try {
      const res = await adminService.clearDemoDataset();
      toast.success(
        `Demo data removed: ${res.removedUsers} demo users purged. Real accounts preserved.`
      );
      setIsClearOpen(false);
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to clear demo dataset');
    } finally {
      setIsOperating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="40%" height="32px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: '110px' }}><Skeleton height="100%" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Dataset Statistics Unavailable</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button type="button" onClick={fetchStats} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const users = stats?.users || {};
  const transactions = stats?.transactions || {};
  const budgets = stats?.budgets || {};
  const goals = stats?.goals || {};
  const lastSeed = stats?.lastSeed;
  const lastClear = stats?.lastClear;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Operations */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Synthetic Dataset Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Idempotent generation and isolation of demonstration records without altering real user profiles
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setIsSeedOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <PlusCircle size={16} />
            <span>Generate Demo Data</span>
          </button>
          <button
            type="button"
            onClick={() => setIsClearOpen(true)}
            disabled={users.demo === 0}
            className="btn btn-danger btn-sm"
          >
            <Trash2 size={16} />
            <span>Purge Demo Records</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <MetricCard
          label="Synthetic Demo Users"
          value={users.demo || 0}
          icon={Database}
          iconColor="var(--brand-primary)"
          iconBg="var(--brand-primary-light)"
          subtext={`${users.real || 0} production accounts`}
        />
        <MetricCard
          label="Demo Transactions"
          value={(transactions.demo || 0).toLocaleString()}
          icon={Sparkles}
          iconColor="var(--brand-secondary)"
          iconBg="rgba(168, 85, 247, 0.15)"
          subtext={`${(transactions.real || 0).toLocaleString()} real records`}
        />
        <MetricCard
          label="Demo Budgets"
          value={(budgets.demo || 0).toLocaleString()}
          icon={CheckCircle2}
          iconColor="#10b981"
          iconBg="rgba(16, 185, 129, 0.15)"
          subtext={`${(budgets.real || 0).toLocaleString()} real budgets`}
        />
        <MetricCard
          label="Demo Savings Goals"
          value={(goals.demo || 0).toLocaleString()}
          icon={Clock}
          iconColor="#f59e0b"
          iconBg="rgba(245, 158, 11, 0.15)"
          subtext={`${(goals.real || 0).toLocaleString()} real goals`}
        />
      </div>

      {/* Safety Notice & Last Operations */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ShieldAlert size={18} color="var(--brand-primary)" />
            Dataset Safety & Preservation Protocols
          </span>
          <span className="badge badge-success">Safeguards Active</span>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          All synthetic demonstration records use dedicated <code>@example.com</code> email domains and controlled identifier
          prefixes. Seeding is idempotent and will never overwrite administrator accounts or genuine registered users.
          Similarly, purging will <strong>only</strong> delete <code>@example.com</code> accounts and their associated children.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Last Dataset Seeding Event
            </span>
            {lastSeed ? (
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{new Date(lastSeed.timestamp).toLocaleString()}</strong>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Triggered by: {lastSeed.adminEmail}
                </p>
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No record of seed operation</span>
            )}
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Last Dataset Purge Event
            </span>
            {lastClear ? (
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{new Date(lastClear.timestamp).toLocaleString()}</strong>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Triggered by: {lastClear.adminEmail}
                </p>
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No record of purge operation</span>
            )}
          </div>
        </div>
      </div>

      {/* Seed Confirmation Modal */}
      <Modal
        isOpen={isSeedOpen}
        onClose={() => setIsSeedOpen(false)}
        title="Generate Synthetic Dataset"
        maxWidth="480px"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          This operation will generate approximately <strong>50 synthetic user accounts</strong> with varied names,
          realistic expense and income transactions over the past 6 months, categorized budgets, and savings goals.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={() => setIsSeedOpen(false)} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={isOperating}
            onClick={handleSeed}
            className="btn btn-primary"
          >
            {isOperating ? 'Generating Data...' : 'Confirm Generation'}
          </button>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        title="Confirm Demo Record Purge"
        maxWidth="480px"
      >
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            padding: '0.75rem',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            color: 'var(--danger)',
            fontSize: '0.85rem',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>
            You are about to permanently delete all {users.demo} synthetic demo users and their transactions.
            Real accounts and administrator records will <strong>NOT</strong> be affected.
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={() => setIsClearOpen(false)} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={isOperating}
            onClick={handleClear}
            className="btn btn-danger"
          >
            {isOperating ? 'Purging Records...' : 'Purge Demo Data'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DatasetManagement;
