import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  AlertCircle,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import '../../components/charts/ChartSetup';
import { financeService } from '../../services/financeService';
import { MetricCard } from '../../components/common/MetricCard';
import { Skeleton } from '../../components/common/Skeleton';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR } from '../../components/charts/ChartTheme';
import { ExpenseDistributionChart } from '../../components/charts/ExpenseDistributionChart';
import { CategorySpendingChart } from '../../components/charts/CategorySpendingChart';
import { BivariateScatterChart } from '../../components/charts/BivariateScatterChart';
import { BudgetPerformanceChart } from '../../components/charts/BudgetPerformanceChart';
import { CashFlowChart } from '../../components/charts/CashFlowChart';
import { SavingsPerformanceChart } from '../../components/charts/SavingsPerformanceChart';

export const Analytics = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchAnalytics = useCallback(async (date) => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getAnalytics(date);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to compute analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(asOfDate);
  }, [fetchAnalytics]);

  const handlePeriodSubmit = (e) => {
    e.preventDefault();
    fetchAnalytics(asOfDate);
  };

  const overview = data?.overview || {};
  const univariate = data?.univariate || {};
  const bivariate = data?.bivariate || {};
  const multivariate = data?.multivariate || {};
  const monthly = data?.monthly || [];
  const preprocessing = data?.preprocessing || {};

  // Formatted correlation helper
  const formatCorrelation = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 'Not enough variation';
    return Number(val).toFixed(2);
  };

  // Map budget vs actual items for BudgetPerformanceChart
  const mappedBudgets = useMemo(() => {
    const rawList = bivariate?.budgetVsActual || [];
    return rawList
      .filter((b) => b.budget > 0 || (b.actual !== null && b.actual > 0))
      .map((b) => ({
        id: b.category,
        category: b.category,
        period: b.period || 'monthly',
        amount: Number(b.budget || 0),
        spent: Number(b.actual || 0),
      }));
  }, [bivariate?.budgetVsActual]);

  // Export monthly statement table to CSV
  const exportMonthlyTableCSV = () => {
    if (!monthly.length) return;
    const headers = ['Month', 'Income (INR)', 'Expenditure (INR)', 'Net Savings (INR)', 'Savings Rate (%)', 'MoM Expense Change (%)'];
    const rows = monthly.map((m) => [
      m.month,
      m.income,
      m.expenditure,
      m.savings,
      m.savingsRate ?? '',
      m.expenseChangePercent ?? '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `artha-monthly-statement-${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="40%" height="32px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: '110px' }}>
              <Skeleton width="60%" height="16px" style={{ marginBottom: '12px' }} />
              <Skeleton width="80%" height="28px" />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ height: '320px' }}>
            <Skeleton width="100%" height="100%" />
          </div>
          <div className="card" style={{ height: '320px' }}>
            <Skeleton width="100%" height="100%" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={36} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Unable to generate statistical analysis</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button type="button" onClick={() => fetchAnalytics(asOfDate)} className="btn btn-primary">
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title & As-Of Date Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--brand-primary-light)',
              color: 'var(--brand-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            <Sparkles size={14} />
            Python Statistical Engine (Pandas & NumPy)
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Exploratory Financial Analytics
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Univariate, bivariate, and multivariate distributional statistics computed from verified records
          </p>
        </div>

        {/* As-Of Date Form */}
        <form onSubmit={handlePeriodSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <Calendar size={15} />
            <span>As of:</span>
          </div>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="form-input"
            style={{ width: '150px', padding: '0.35rem 0.65rem' }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Apply
          </button>
        </form>
      </div>

      {/* SECTION 01: Overview Totals */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          01 / OVERVIEW
        </p>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Financial Totals & Preprocessing
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1rem' }}>
          <MetricCard
            label="Total Income Recorded"
            value={formatINR(overview.totalIncome)}
            icon={TrendingUp}
            iconColor="#10b981"
            iconBg="rgba(16, 185, 129, 0.15)"
          />
          <MetricCard
            label="Total Expenditure"
            value={formatINR(overview.totalExpenditure)}
            icon={BarChart3}
            iconColor="#ef4444"
            iconBg="rgba(239, 68, 68, 0.15)"
          />
          <MetricCard
            label="Aggregate Net Savings"
            value={formatINR(overview.totalSavings)}
            icon={Activity}
            iconColor="var(--brand-primary)"
            iconBg="var(--brand-primary-light)"
            trendType={overview.totalSavings >= 0 ? 'positive' : 'negative'}
          />
          <MetricCard
            label="Effective Savings Rate"
            value={overview.savingsRate !== null ? `${overview.savingsRate}%` : 'N/A'}
            icon={PieChart}
            iconColor="var(--brand-secondary)"
            iconBg="rgba(168, 85, 247, 0.15)"
          />
        </div>

        {/* Preprocessing Summary Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--brand-primary)" />
            <span>
              <strong>{preprocessing.transactionsUsed || 0}</strong> valid transactions verified;{' '}
              <strong>{preprocessing.transactionsDropped || 0}</strong> anomalous or incomplete records omitted by preprocessing filters.
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dataset completeness: {preprocessing.transactionsUsed > 0 ? '100% verified' : 'No records'}
          </span>
        </div>
      </div>

      {/* SECTION 02: Univariate Expenditure Profile */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          02 / UNIVARIATE
        </p>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Expenditure Profile & Dispersion
        </h2>

        {/* Upgraded Univariate Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Chart 1: Expense Distribution Histogram with Count vs Percent Switch */}
          <ExpenseDistributionChart
            distribution={univariate?.expenditure?.distribution}
            stats={univariate?.expenditure}
            title="Expense Distribution Profile"
            height={280}
          />

          {/* Chart 2: Category-Wise Spending Breakdown with Donut vs Horizontal Bars Switch */}
          <CategorySpendingChart
            categories={univariate?.categorySpending}
            title="Category-Wise Spending Breakdown"
            height={280}
          />
        </div>
      </div>

      {/* SECTION 03: Bivariate Relationships */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          03 / BIVARIATE
        </p>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Relationships Between Core Financial Measures
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Chart 3: Income vs Expenditure Scatter & Trend */}
          <BivariateScatterChart
            points={bivariate?.incomeVsExpenditure?.points}
            xKey="income"
            yKey="expenditure"
            xLabel="Monthly Income"
            yLabel="Monthly Expenditure"
            correlation={bivariate?.incomeVsExpenditure?.correlation}
            pointColor={CHART_PALETTE.primary}
            title="Income vs. Expenditure"
            subtitle="Monthly observation points & spending drift"
            height={270}
          />

          {/* Chart 4: Income vs Net Savings Scatter with 20% Target Guideline */}
          <BivariateScatterChart
            points={bivariate?.incomeVsSavings?.points}
            xKey="income"
            yKey="savings"
            xLabel="Monthly Income"
            yLabel="Monthly Net Savings"
            correlation={bivariate?.incomeVsSavings?.correlation}
            showBenchmark={true}
            benchmarkLabel="20% Target Savings Guide"
            pointColor={CHART_PALETTE.income}
            title="Income vs. Net Savings"
            subtitle="Marginal propensity to save & target benchmark"
            height={270}
          />
        </div>

        {/* Chart 5: Budget vs Actual Spending Variance */}
        <BudgetPerformanceChart
          budgets={mappedBudgets}
          title="Budget vs. Actual Spending Variance"
          height={280}
        />
      </div>

      {/* SECTION 04: Monthly Cashflow Over Time */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          04 / MONTHLY
        </p>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Cash Flow & Savings Trajectory Over Time
        </h2>

        {/* Chart 6 & Chart 7 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Chart 6: Cash Flow Chart with Inflows vs Outflows & Net Flow Line */}
          <CashFlowChart
            monthlyData={monthly}
            title="Monthly Cashflow Dynamics"
            height={270}
          />

          {/* Chart 7: Savings Performance Chart with Net Savings & 20% Benchmark Target */}
          <SavingsPerformanceChart
            monthlyData={monthly}
            title="Monthly Savings Trajectory & Benchmark"
            targetRate={20}
            height={270}
          />
        </div>

        {/* Monthly Summary Data Table with CSV Export */}
        <div className="card">
          <div
            className="card-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
          >
            <div>
              <h3 className="card-title">Monthly Financial Statement Table</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {monthly.length} recorded monthly cycles with comparative shifts
              </span>
            </div>

            <button
              type="button"
              onClick={exportMonthlyTableCSV}
              className="btn btn-secondary btn-xs"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Download statement as CSV"
            >
              <FileSpreadsheet size={13} />
              Export CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="artha-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Month</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Income</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Expenditure</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Net Savings</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Savings Rate</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>MoM Expense Change</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No monthly records available
                    </td>
                  </tr>
                ) : (
                  monthly.map((row, idx) => {
                    const isSurplus = row.savings >= 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>{row.month}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                          {formatINR(row.income)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                          {formatINR(row.expenditure)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>
                          <span style={{ color: isSurplus ? '#10b981' : '#ef4444' }}>
                            {formatINR(row.savings)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {row.savingsRate !== null ? (
                            <span
                              className={`badge ${row.savingsRate >= 20 ? 'badge-success' : row.savingsRate >= 10 ? 'badge-info' : 'badge-warning'}`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {row.savingsRate}%
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {row.expenseChangePercent !== null && row.expenseChangePercent !== undefined ? (
                            <span
                              style={{
                                color: row.expenseChangePercent > 0 ? '#ef4444' : '#10b981',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                              }}
                            >
                              {row.expenseChangePercent > 0 ? '+' : ''}
                              {row.expenseChangePercent}%
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 05: Multivariate Category Relationships */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          05 / MULTIVARIATE
        </p>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          Category & Cross-Metric Correlation Matrix
        </h2>

        {/* Correlation Matrix Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Income vs. Expenditure</span>
              <span className="badge badge-info" style={{ fontSize: '0.725rem' }}>
                r = {formatCorrelation(multivariate?.monthlyCorrelations?.incomeExpenditure)}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Measures lifestyle inflation: How strongly expenditure scales when income expands.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Income vs. Net Savings</span>
              <span className="badge badge-success" style={{ fontSize: '0.725rem' }}>
                r = {formatCorrelation(multivariate?.monthlyCorrelations?.incomeSavings)}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Measures marginal propensity to save: Demonstrates how effectively additional income is retained.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Expenditure vs. Net Savings</span>
              <span className="badge badge-warning" style={{ fontSize: '0.725rem' }}>
                r = {formatCorrelation(multivariate?.monthlyCorrelations?.expenditureSavings)}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Measures spending sensitivity: Negative correlation confirms spending directly depresses net savings.
            </p>
          </div>
        </div>

        {/* Category Relationships Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Category Cross-Sectional Breakdown</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Income, Expenditure, Net & Budget Targets</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="artha-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Income</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Expenditure</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Net by Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Budget Tracking</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {(multivariate?.categoryRelationships || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No category relationships available yet
                    </td>
                  </tr>
                ) : (
                  multivariate.categoryRelationships.map((cat, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>{cat.category}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                        {formatINR(cat.income)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                        {formatINR(cat.expenditure)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>
                        <span style={{ color: cat.net >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatINR(cat.net)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {cat.budgets?.length ? (
                          cat.budgets.map((b, bIdx) => (
                            <span key={bIdx} className="badge badge-info" style={{ marginRight: '4px', fontSize: '0.7rem' }}>
                              Cap: {formatINR(b.budget || b.amount)}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No budget limit</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        {cat.transactionCount || cat.transactions || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
