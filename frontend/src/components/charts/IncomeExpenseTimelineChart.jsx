import React, { useState, useMemo, useRef } from 'react';
import './ChartSetup';
import { Line, Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, getChartOptions, exportChartAsPNG } from './ChartTheme';
import { Download, BarChart2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export const IncomeExpenseTimelineChart = ({
  monthlyData = [],
  recentTransactions = [],
  title = 'Income vs Expenses Overview',
  height = 320,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const [viewMode, setViewMode] = useState('bars'); // 'bars' | 'line'
  const [range, setRange] = useState('6m'); // '7d' | '30d' | '3m' | '6m' | '12m'

  // Filter or aggregate data based on selected range
  const computedSeries = useMemo(() => {
    // For 7d and 30d, compute from recentTransactions if available
    if (range === '7d' || range === '30d') {
      const daysCount = range === '7d' ? 7 : 30;
      const now = new Date();
      const dailyMap = new Map();

      // Initialize days
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = range === '7d' 
          ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
          : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        dailyMap.set(key, { label, income: 0, expense: 0 });
      }

      (recentTransactions || []).forEach((t) => {
        const dateKey = new Date(t.date).toISOString().slice(0, 10);
        if (dailyMap.has(dateKey)) {
          const entry = dailyMap.get(dateKey);
          if (t.type === 'income') entry.income += Number(t.amount || 0);
          if (t.type === 'expense') entry.expense += Number(t.amount || 0);
        }
      });

      const items = Array.from(dailyMap.values());
      const labels = items.map((i) => i.label);
      const income = items.map((i) => Math.round(i.income));
      const expenses = items.map((i) => Math.round(i.expense));
      const netSavings = items.map((i) => Math.round(i.income - i.expense));

      return { labels, income, expenses, netSavings };
    }

    // Monthly ranges (3m, 6m, 12m)
    const count = range === '3m' ? 3 : range === '12m' ? 12 : 6;
    const sliced = (monthlyData || []).slice(-count);

    if (!sliced.length) {
      return { labels: [], income: [], expenses: [], netSavings: [] };
    }

    const labels = sliced.map((m) => {
      if (m.month) {
        const parts = m.month.split('-');
        if (parts.length === 2) {
          const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, 1));
          return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        }
        return m.month;
      }
      return m.label || '';
    });

    const income = sliced.map((m) => Math.round(m.income || 0));
    const expenses = sliced.map((m) => Math.round(m.expense || m.expenditure || 0));
    const netSavings = sliced.map((m, idx) => Math.round((income[idx] || 0) - (expenses[idx] || 0)));

    return { labels, income, expenses, netSavings };
  }, [monthlyData, recentTransactions, range]);

  // Summary statistics for selected range
  const metrics = useMemo(() => {
    const totalIncome = computedSeries.income.reduce((a, b) => a + b, 0);
    const totalExpense = computedSeries.expenses.reduce((a, b) => a + b, 0);
    const totalNet = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0;

    // Period over period change
    const len = computedSeries.expenses.length;
    let momExpenseChange = null;
    let momExpensePercent = null;
    if (len >= 2) {
      const current = computedSeries.expenses[len - 1];
      const previous = computedSeries.expenses[len - 2];
      momExpenseChange = current - previous;
      momExpensePercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
    }

    return { totalIncome, totalExpense, totalNet, savingsRate, momExpenseChange, momExpensePercent };
  }, [computedSeries]);

  const hasData = computedSeries.labels.length > 0 &&
    (metrics.totalIncome > 0 || metrics.totalExpense > 0);

  const chartData = {
    labels: computedSeries.labels,
    datasets: viewMode === 'bars' ? [
      {
        type: 'bar',
        label: 'Income',
        data: computedSeries.income,
        backgroundColor: CHART_PALETTE.income,
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
      },
      {
        type: 'bar',
        label: 'Expenses',
        data: computedSeries.expenses,
        backgroundColor: CHART_PALETTE.expense,
        borderRadius: 6,
        barPercentage: 0.65,
        categoryPercentage: 0.8,
      },
      {
        type: 'line',
        label: 'Net Savings',
        data: computedSeries.netSavings,
        borderColor: CHART_PALETTE.savings,
        backgroundColor: CHART_PALETTE.savingsLight,
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
      },
    ] : [
      {
        label: 'Income',
        data: computedSeries.income,
        borderColor: CHART_PALETTE.income,
        backgroundColor: CHART_PALETTE.incomeLight,
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
      },
      {
        label: 'Expenses',
        data: computedSeries.expenses,
        borderColor: CHART_PALETTE.expense,
        backgroundColor: CHART_PALETTE.expenseLight,
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 4,
      },
      {
        label: 'Net Savings',
        data: computedSeries.netSavings,
        borderColor: CHART_PALETTE.savings,
        borderDash: [5, 5],
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const options = getChartOptions({ isDark, showLegend: true });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.4rem' }}>
      {/* Header with Title, Controls and Metric Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Historical cashflow trends and net savings comparison
          </p>
        </div>

        {/* Controls: Mode Toggle & Range Selector & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Bar / Line toggle */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('bars')}
              title="Grouped Bar View"
              style={{
                border: 'none',
                background: viewMode === 'bars' ? 'var(--brand-primary)' : 'transparent',
                color: viewMode === 'bars' ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <BarChart2 size={13} style={{ marginRight: '4px' }} /> Bars
            </button>
            <button
              type="button"
              onClick={() => setViewMode('line')}
              title="Continuous Trend View"
              style={{
                border: 'none',
                background: viewMode === 'line' ? 'var(--brand-primary)' : 'transparent',
                color: viewMode === 'line' ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <TrendingUp size={13} style={{ marginRight: '4px' }} /> Line
            </button>
          </div>

          {/* Range Dropdown */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
          </select>

          {/* Export PNG */}
          <button
            type="button"
            onClick={() => exportChartAsPNG(chartRef, `income-expense-${range}`)}
            title="Export chart as PNG"
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem 0.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          padding: '0.65rem 0.85rem',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period Income</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: CHART_PALETTE.income }}>
            {formatINR(metrics.totalIncome)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period Expenses</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: CHART_PALETTE.expense }}>
            {formatINR(metrics.totalExpense)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Savings</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: metrics.totalNet >= 0 ? CHART_PALETTE.savings : CHART_PALETTE.expenseDanger }}>
            {formatINR(metrics.totalNet)}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Savings Rate</span>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: metrics.savingsRate >= 20 ? CHART_PALETTE.income : 'var(--text-primary)' }}>
            {metrics.savingsRate}%
          </div>
        </div>
        {metrics.momExpensePercent !== null && (
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MoM Spend Shift</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: metrics.momExpenseChange > 0 ? CHART_PALETTE.expenseDanger : CHART_PALETTE.income }}>
              {metrics.momExpenseChange > 0 ? '↗ +' : '↘ '}
              {metrics.momExpensePercent}%
            </div>
          </div>
        )}
      </div>

      {/* Canvas Chart or Helpful Empty State */}
      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        {hasData ? (
          viewMode === 'bars' ? (
            <Bar ref={chartRef} data={chartData} options={options} />
          ) : (
            <Line ref={chartRef} data={chartData} options={options} />
          )
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={28} style={{ opacity: 0.6 }} />
            <span>No financial activity recorded in the selected period.</span>
            <span style={{ fontSize: '0.75rem' }}>Record transactions to view live income vs expense comparisons.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseTimelineChart;
