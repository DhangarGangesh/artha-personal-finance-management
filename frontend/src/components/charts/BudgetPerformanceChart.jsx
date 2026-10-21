import React, { useMemo, useRef } from 'react';
import './ChartSetup';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, exportChartAsPNG, prefersReducedMotion } from './ChartTheme';
import { Download, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export const BudgetPerformanceChart = ({
  budgets = [],
  title = 'Budget vs Actual Performance',
  height = 300,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);

  const { items, overBudgetCount } = useMemo(() => {
    const list = (budgets || []).map((b) => {
      const budgetAmount = Number(b.amount || 0);
      const spent = Number(b.spent || 0);
      const remaining = Math.max(0, budgetAmount - spent);
      const utilization = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      const isOver = spent > budgetAmount;
      const isNear = utilization >= 80 && !isOver;

      // Color coding: Red if exceeded, Amber if >=80%, Emerald if healthy
      const barColor = isOver
        ? CHART_PALETTE.expenseDanger
        : isNear
        ? CHART_PALETTE.expense
        : CHART_PALETTE.income;

      // Calculate days remaining in period
      const now = new Date();
      let daysRemaining = 0;
      const period = b.period || 'monthly';
      if (period === 'monthly') {
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        daysRemaining = Math.max(0, lastDay - now.getDate());
      } else if (period === 'weekly') {
        daysRemaining = Math.max(0, 7 - now.getDay());
      } else {
        const lastDayYear = new Date(now.getFullYear(), 11, 31);
        daysRemaining = Math.max(0, Math.ceil((lastDayYear - now) / (1000 * 60 * 60 * 24)));
      }

      return {
        id: b.id || b._id,
        category: b.category,
        period,
        budgetAmount,
        spent,
        remaining,
        utilization: Math.round(utilization),
        isOver,
        isNear,
        barColor,
        daysRemaining,
      };
    });

    // Sort by utilization descending to put at-risk budgets at the top
    list.sort((a, b) => b.utilization - a.utilization);
    const overCount = list.filter((i) => i.isOver).length;

    return { items: list, overBudgetCount: overCount };
  }, [budgets]);

  const hasData = items.length > 0;

  const chartData = {
    labels: items.map((i) => `${i.category} (${i.period})`),
    datasets: [
      {
        label: 'Actual Spent',
        data: items.map((i) => i.spent),
        backgroundColor: items.map((i) => i.barColor),
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Budget Limit',
        data: items.map((i) => i.budgetAmount),
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
        borderDash: [3, 3],
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : { duration: 600 },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
          boxWidth: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          afterTitle: (itemsArr) => {
            const idx = itemsArr[0]?.dataIndex;
            if (idx === undefined) return '';
            const item = items[idx];
            return `Status: ${item.isOver ? 'Exceeded Budget' : item.isNear ? 'Warning (>=80%)' : 'On Track'} (${item.utilization}%)`;
          },
          label: (ctx) => ` ${ctx.dataset.label}: ${formatINR(ctx.parsed.x)}`,
          afterBody: (itemsArr) => {
            const idx = itemsArr[0]?.dataIndex;
            if (idx === undefined) return '';
            const item = items[idx];
            return [
              `Remaining: ${item.isOver ? '₹0 (Deficit)' : formatINR(item.remaining)}`,
              `Days Left in Period: ${item.daysRemaining} days`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 10 },
          callback: (v) => formatINR(v, true),
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: isDark ? '#cbd5e1' : '#334155',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
        },
      },
    },
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {title}
            </h3>
            {overBudgetCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <AlertTriangle size={11} /> {overBudgetCount} Exceeded
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Allocated spending limits vs actual real-time expenditure
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportChartAsPNG(chartRef, 'budget-vs-actual')}
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

      {hasData ? (
        <div style={{ position: 'relative', width: '100%', height: `${Math.max(height, items.length * 48)}px` }}>
          <Bar ref={chartRef} data={chartData} options={options} />
        </div>
      ) : (
        <div
          style={{
            height: `${height}px`,
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
          <span>No active budgets configured.</span>
          <span style={{ fontSize: '0.75rem' }}>Set category spending limits to track real-time utilization.</span>
        </div>
      )}
    </div>
  );
};

export default BudgetPerformanceChart;
