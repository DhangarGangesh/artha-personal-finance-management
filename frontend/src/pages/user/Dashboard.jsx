import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MoreHorizontal,
  ChevronDown,
  AlertTriangle,
  PieChart,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeService } from '../../services/financeService';
import { Skeleton } from '../../components/common/Skeleton';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { IncomeExpenseTimelineChart } from '../../components/charts/IncomeExpenseTimelineChart';
import { CategorySpendingChart } from '../../components/charts/CategorySpendingChart';
import { CashFlowChart } from '../../components/charts/CashFlowChart';
import { BudgetPerformanceChart } from '../../components/charts/BudgetPerformanceChart';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../../constants/categories';
import { formatINR } from '../../components/charts/ChartTheme';

export const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Quick Add Transaction Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newType, setNewType] = useState('expense');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTypeSwitch = (type) => {
    setNewType(type);
    const validCats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!validCats.includes(newCategory)) {
      setNewCategory(validCats[0]);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    if (!newDescription.trim()) {
      toast.error('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await financeService.createTransaction({
        type: newType,
        amount: parsedAmount,
        category: newCategory,
        description: newDescription.trim(),
        date: new Date(newDate).toISOString(),
      });
      toast.success('Transaction recorded successfully');
      setIsAddOpen(false);
      setNewAmount('');
      setNewDescription('');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = data?.summary || {};
  const recent = data?.recentTransactions || [];
  const monthlyData = useMemo(() => {
    if (!data?.charts?.monthlyIncomeExpense) return [];
    const { labels = [], income = [], expenses = [] } = data.charts.monthlyIncomeExpense;
    return labels.map((month, idx) => ({
      month,
      income: income[idx] || 0,
      expense: expenses[idx] || 0,
      savings: (income[idx] || 0) - (expenses[idx] || 0),
    }));
  }, [data]);

  const categorySpending = useMemo(() => {
    if (!data?.charts?.expenseByCategory) return [];
    const { labels = [], values = [] } = data.charts.expenseByCategory;
    return labels.map((cat, idx) => ({
      category: cat,
      amount: values[idx] || 0,
    }));
  }, [data]);

  const budgetItems = useMemo(() => {
    if (!data?.charts?.budgetVsActual) return [];
    const { labels = [], budget = [], actual = [] } = data.charts.budgetVsActual;
    return labels.map((label, idx) => {
      // Label may be "Food (monthly)"
      const match = label.match(/^(.*?)(?:\s*\((.*?)\))?$/);
      const category = match ? match[1].trim() : label;
      const period = match && match[2] ? match[2].trim() : 'monthly';
      return {
        id: idx,
        category,
        period,
        amount: budget[idx] || 0,
        spent: actual[idx] || 0,
      };
    });
  }, [data]);

  // Dynamic user greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  const getAvatarBg = (desc = '') => {
    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    let hash = 0;
    for (let i = 0; i < desc.length; i++) hash = desc.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="40%" height="36px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: '110px' }}><Skeleton height="100%" /></div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="card" style={{ height: '360px' }}><Skeleton height="100%" /></div>
          <div className="card" style={{ height: '360px' }}><Skeleton height="100%" /></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Failed to load dashboard metrics</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button type="button" onClick={fetchDashboardData} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Welcome Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {getGreeting()}, {userName}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time financial overview and personal wealth telemetry
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <NavLink to="/analytics" className="btn btn-secondary btn-sm" style={{ padding: '0.45rem 0.85rem' }}>
            <TrendingUp size={14} /> Analytics
          </NavLink>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.45rem 0.95rem' }}
          >
            <Plus size={15} /> Record Transaction
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards (Real Values, No Mockups) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Card 1: Total Income (Emerald Accent) */}
        <div
          className="card"
          style={{
            borderTop: '4px solid #10b981',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Income
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownRight size={16} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {formatINR(summary.totalIncome || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            All recorded historical earnings
          </div>
        </div>

        {/* Card 2: Total Expenses (Amber Accent) */}
        <div
          className="card"
          style={{
            borderTop: '4px solid #f59e0b',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Expenses
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={16} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {formatINR(summary.totalExpenses || 0)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            {summary.monthlyExpenseChange?.percent !== null && summary.monthlyExpenseChange?.percent !== undefined ? (
              <>
                <span
                  style={{
                    fontWeight: 700,
                    color: summary.monthlyExpenseChange.amount > 0 ? '#ef4444' : '#10b981',
                  }}
                >
                  {summary.monthlyExpenseChange.amount > 0 ? '↗ +' : '↘ '}
                  {summary.monthlyExpenseChange.percent}%
                </span>
                <span style={{ color: 'var(--text-muted)' }}>vs previous month</span>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Baseline recorded</span>
            )}
          </div>
        </div>

        {/* Card 3: Net Savings (Cyan Accent) */}
        <div
          className="card"
          style={{
            borderTop: '4px solid #06b6d4',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Net Savings Surplus
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PiggyBank size={16} color="#06b6d4" />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: (summary.netSavings || 0) >= 0 ? '#06b6d4' : '#ef4444',
              marginBottom: '0.4rem',
            }}
          >
            {formatINR(summary.netSavings || 0)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
            {summary.savingsRate !== null && summary.savingsRate !== undefined ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontWeight: 700,
                  color: summary.savingsRate >= 20 ? '#10b981' : '#f59e0b',
                  backgroundColor: summary.savingsRate >= 20 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {summary.savingsRate}% Savings Rate
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No savings rate computed</span>
            )}
          </div>
        </div>

        {/* Card 4: Budget Adherence / Health */}
        <div
          className="card"
          style={{
            borderTop: '4px solid #6366f1',
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Budget Adherence
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="#6366f1" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {summary.budgetUtilization !== undefined && summary.budgetUtilization !== null
              ? `${summary.budgetUtilization}%`
              : '0%'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            {summary.overBudgetCount > 0 ? (
              <span style={{ color: '#ef4444', fontWeight: 700 }}>
                ⚠️ {summary.overBudgetCount} budget limit exceeded
              </span>
            ) : (
              <span style={{ color: '#10b981', fontWeight: 600 }}>
                ✓ All budgets within healthy limits
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Primary Timeline Chart + Right Category Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.75fr) minmax(320px, 1fr)',
          gap: '1.5rem',
        }}
        className="dashboard-main-grid"
      >
        <style>{`
          @media (max-width: 1024px) {
            .dashboard-main-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* LEFT COLUMN: Interactive Income/Expense Timeline & Latest Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Chart Component */}
          <IncomeExpenseTimelineChart
            monthlyData={monthlyData}
            recentTransactions={recent}
            title="Cashflow & Spending Dynamics"
            height={320}
          />

          {/* Latest Transactions Table */}
          <div className="card" style={{ padding: '1.25rem 1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Recent Activity</h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Latest verified transactions
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NavLink
                  to="/transactions"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--brand-primary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  View All <ArrowRight size={13} />
                </NavLink>
              </div>
            </div>

            {recent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                No recent transactions recorded. Click "Record Transaction" to add your first entry.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.65rem 0.5rem', fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '0.65rem 0.5rem', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '0.65rem 0.5rem', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '0.65rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.slice(0, 5).map((tx) => {
                      const isIncome = tx.type === 'income';
                      const formattedDate = new Date(tx.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <tr key={tx._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: getAvatarBg(tx.description),
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.775rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {(tx.description || 'T')[0].toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                {tx.description}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.08)',
                                color: isIncome ? '#10b981' : 'var(--text-primary)',
                                fontSize: '0.725rem',
                                fontWeight: 600,
                              }}
                            >
                              {tx.category}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                            {formattedDate}
                          </td>
                          <td
                            style={{
                              padding: '0.75rem 0.5rem',
                              textAlign: 'right',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: isIncome ? '#10b981' : '#f59e0b',
                            }}
                          >
                            {isIncome ? '+' : '-'} {formatINR(tx.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Spending by Category & Cash Flow Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Spending by Category Donut & Ranked Bar */}
          <CategorySpendingChart
            categories={categorySpending}
            title="Category Allocation"
            height={260}
          />

          {/* Cash Flow Streams */}
          <CashFlowChart
            monthlyData={monthlyData}
            title="Monthly Cash Flow"
            height={220}
          />

          {/* Quick Budget Progress if budgets exist */}
          {budgetItems.length > 0 && (
            <BudgetPerformanceChart
              budgets={budgetItems.slice(0, 4)}
              title="Budget Limits Quick View"
              height={220}
            />
          )}
        </div>
      </div>

      {/* Quick Add Transaction Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Transaction">
        <form onSubmit={handleAddTransaction}>
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`btn ${newType === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`btn ${newType === 'income' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="form-select"
            >
              {(newType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly grocery restock"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
