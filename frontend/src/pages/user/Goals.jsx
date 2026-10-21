import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Target, CheckCircle2, Clock, Edit2, Trash2, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { financeService } from '../../services/financeService';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

export const Goals = () => {
  const toast = useToast();

  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({ count: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contribute Modal
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getGoals();
      setGoals(res.items || []);
      setSummary(res.summary || { count: 0, active: 0, completed: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setMonthlyContribution('');
    setTargetDate('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setCurrentAmount(String(g.currentAmount || 0));
    setMonthlyContribution(String(g.monthlyContribution || ''));
    setTargetDate(g.targetDate ? new Date(g.targetDate).toISOString().slice(0, 10) : '');
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      toast.error('Please enter a valid positive target amount');
      return;
    }
    if (!name.trim()) {
      toast.error('Goal name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        targetAmount: target,
        currentAmount: parseFloat(currentAmount) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      };

      if (editingGoal) {
        await financeService.updateGoal(editingGoal.id || editingGoal._id, payload);
        toast.success('Savings goal updated');
      } else {
        await financeService.createGoal(payload);
        toast.success('Savings goal created successfully');
      }
      setIsModalOpen(false);
      fetchGoals();
    } catch (err) {
      toast.error(err.message || 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive contribution');
      return;
    }

    try {
      await financeService.contributeToGoal(contributeGoal.id || contributeGoal._id, amount);
      toast.success(`Contributed ₹${amount.toLocaleString('en-IN')} to ${contributeGoal.name}!`);
      setContributeGoal(null);
      setContributionAmount('');
      fetchGoals();
    } catch (err) {
      toast.error(err.message || 'Failed to process contribution');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await financeService.deleteGoal(deleteId);
      toast.success('Goal removed');
      setDeleteId(null);
      fetchGoals();
    } catch (err) {
      toast.error(err.message || 'Failed to delete goal');
    }
  };

  const formatRupee = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Savings Goals
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Plan milestones, track velocity, and calculate projected completion dates
          </p>
        </div>

        <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Summary Pills */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Goals
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{summary.count}</div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active & In Progress
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--brand-primary)' }}>
            {summary.active}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Achieved
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--success)' }}>
            {summary.completed}
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: '180px' }}>
              <Skeleton width="60%" height="22px" style={{ marginBottom: '12px' }} />
              <Skeleton width="100%" height="12px" style={{ marginBottom: '16px' }} />
              <Skeleton width="80%" height="24px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card empty-state">
          <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
          <p>{error}</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3.5rem 1.5rem' }}>
          <Target size={48} color="var(--brand-primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No financial goals yet</h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
            Define targets for emergency funds, vacations, education, or retirement with automated velocity calculations.
          </p>
          <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {goals.map((g) => {
            const percent = Math.min(100, Math.round(g.progress || 0));
            const isCompleted = g.status === 'completed' || percent >= 100;

            return (
              <div key={g.id || g._id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{g.name}</h3>
                    {g.targetDate && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Target: {new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(g)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px' }}
                      title="Edit goal"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(g.id || g._id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', color: 'var(--danger)' }}
                      title="Delete goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: '10px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percent}%`,
                      backgroundColor: isCompleted ? 'var(--success)' : 'var(--brand-primary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                {/* Amount details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Saved: </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatRupee(g.currentAmount)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}> of {formatRupee(g.targetAmount)}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: isCompleted ? 'var(--success)' : 'var(--brand-primary)' }}>
                    {percent}%
                  </div>
                </div>

                {/* Remaining & Action */}
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {isCompleted ? (
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>Goal Completed!</span>
                    ) : (
                      <span>Remaining: <strong style={{ color: 'var(--text-primary)' }}>{formatRupee(g.remaining)}</strong></span>
                    )}
                  </div>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => {
                        setContributeGoal(g);
                        setContributionAmount('');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      <ArrowUpRight size={14} color="var(--brand-primary)" />
                      <span>Contribute</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Goal' : 'Create Savings Goal'}
      >
        <form onSubmit={handleSaveGoal}>
          <div className="form-group">
            <label className="form-label">Goal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Fund, New Laptop, Vacation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 100000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Saved Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Planned Monthly Contribution (₹)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 5000"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Saving...' : editingGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={Boolean(contributeGoal)}
        onClose={() => setContributeGoal(null)}
        title={`Contribute to ${contributeGoal?.name || 'Goal'}`}
        maxWidth="420px"
      >
        <form onSubmit={handleContribute}>
          <div className="form-group">
            <label className="form-label">Contribution Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              placeholder="e.g. 2000"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setContributeGoal(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Contribution
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Goal"
        maxWidth="400px"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Are you sure you want to remove this savings goal? Recorded contributions will remain in your general history.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={() => setDeleteId(null)} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-danger">
            Delete Goal
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Goals;
