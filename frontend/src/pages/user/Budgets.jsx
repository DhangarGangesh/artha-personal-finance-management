import React, { useState, useEffect, useCallback } from 'react';
import { Plus, PieChart, AlertTriangle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { financeService } from '../../services/financeService';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';
import { BudgetPerformanceChart } from '../../components/charts/BudgetPerformanceChart';

export const Budgets = () => {
  const toast = useToast();

  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({ count: 0, overBudget: 0, warning: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);

  const categories = EXPENSE_CATEGORIES;

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getBudgets();
      setBudgets(res.items || []);
      setSummary(res.summary || { count: 0, overBudget: 0, warning: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount('');
    setPeriod('monthly');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBudget(b);
    setCategory(b.category);
    setAmount(String(b.amount));
    setPeriod(b.period || 'monthly');
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive budget amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await financeService.setBudget({
        category,
        amount: parsedAmount,
        period,
      });
      toast.success(editingBudget ? 'Budget updated' : 'Budget created successfully');
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      toast.error(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await financeService.deleteBudget(deleteId);
      toast.success('Budget removed');
      setDeleteId(null);
      fetchBudgets();
    } catch (err) {
      toast.error(err.message || 'Failed to delete budget');
    }
  };

  const formatRupee = (val) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Set Budget Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Budgets
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Track expense category allocations with real-time utilization
          </p>
        </div>

        <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Summary Pills */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Budgets
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{summary.count}</div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Over Budget
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: summary.overBudget > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {summary.overBudget}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem 1.25rem', flex: 1, minWidth: '180px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Near Limit (75-99%)
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--warning)' }}>
            {summary.warning}
          </div>
        </div>
      </div>

      {/* Interactive Budget Performance Chart */}
      {!loading && !error && budgets.length > 0 && (
        <BudgetPerformanceChart budgets={budgets} title="Real-Time Budget Utilization" height={280} />
      )}

      {/* Budgets Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: '160px' }}>
              <Skeleton width="50%" height="20px" style={{ marginBottom: '12px' }} />
              <Skeleton width="100%" height="12px" style={{ marginBottom: '16px' }} />
              <Skeleton width="70%" height="18px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card empty-state">
          <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
          <p>{error}</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3.5rem 1.5rem' }}>
          <PieChart size={48} color="var(--brand-primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No budgets set yet</h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
            Establish categorical spending caps to prevent budget overruns and keep your savings on track.
          </p>
          <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} /> Set Your First Budget
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {budgets.map((b) => {
            const percent = Math.min(100, Math.round(b.percentUsed || 0));
            const isOver = b.status === 'over' || (b.percentUsed || 0) >= 100;
            const isWarning = b.status === 'warning' || b.status === 'critical' || percent >= 75;

            const barColor = isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)';

            return (
              <div key={b.id || b._id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{b.category}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {b.period} Window
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px' }}
                      title="Edit budget"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(b.id || b._id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', color: 'var(--danger)' }}
                      title="Delete budget"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: '8px',
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
                      backgroundColor: barColor,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                {/* Spent & Remaining */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Spent: </span>
                    <span style={{ fontWeight: 700, color: isOver ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {formatRupee(b.spent)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}> of {formatRupee(b.amount)}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: barColor }}>
                    {b.percentUsed !== undefined ? `${Math.round(b.percentUsed)}%` : `${percent}%`}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isOver ? 'Over budget by:' : 'Remaining:'}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: isOver ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {isOver ? formatRupee(b.spent - b.amount) : formatRupee(b.remaining || b.amount - b.spent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Update Budget' : 'Set New Budget'}
      >
        <form onSubmit={handleSaveBudget}>
          <div className="form-group">
            <label className="form-label">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Budget Limit (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-select"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
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
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete Budget"
        maxWidth="400px"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Are you sure you want to delete this budget rule? Tracking for this category will stop.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={() => setDeleteId(null)} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} className="btn btn-danger">
            Delete Budget
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Budgets;
