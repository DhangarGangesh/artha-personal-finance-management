import React, { useState, useMemo, useRef } from 'react';
import './ChartSetup';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, exportChartAsPNG, prefersReducedMotion } from './ChartTheme';
import { PieChart as PieIcon, BarChart3, Download, AlertCircle } from 'lucide-react';

export const CategorySpendingChart = ({
  categories = [],
  title = 'Spending by Category',
  height = 320,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState('donut'); // 'donut' | 'horizontalBar'

  // Prepare and rank category items
  const { processedCategories, totalSpending } = useMemo(() => {
    const raw = (categories || []).map((c) => ({
      name: c.category || c.name || c._id || 'Other',
      amount: Math.round(Number(c.amount || c.total || c.spent || 0)),
    })).filter((c) => c.amount > 0);

    // Sort descending
    raw.sort((a, b) => b.amount - a.amount);

    const total = raw.reduce((sum, c) => sum + c.amount, 0);

    // If more than 7 categories, collapse very small tail (<2% or beyond 6) into "Other"
    let list = [];
    if (raw.length > 7) {
      const topSix = raw.slice(0, 6);
      const remaining = raw.slice(6);
      const otherAmount = remaining.reduce((sum, c) => sum + c.amount, 0);
      list = [...topSix];
      if (otherAmount > 0) {
        list.push({ name: 'Other Categories', amount: otherAmount });
      }
    } else {
      list = raw;
    }

    const withShare = list.map((item, idx) => ({
      ...item,
      share: total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0',
      color: CHART_PALETTE.categories[idx % CHART_PALETTE.categories.length],
    }));

    return { processedCategories: withShare, totalSpending: total };
  }, [categories]);

  const hasData = processedCategories.length > 0 && totalSpending > 0;

  // Donut chart config
  const donutData = {
    labels: processedCategories.map((c) => c.name),
    datasets: [
      {
        data: processedCategories.map((c) => c.amount),
        backgroundColor: processedCategories.map((c) => c.color),
        borderColor: isDark ? '#111827' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: prefersReducedMotion() ? false : { duration: 600 },
    plugins: {
      legend: {
        display: false, // We render a customized, accessible interactive legend
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
          label: (ctx) => {
            const val = ctx.parsed;
            const pct = totalSpending > 0 ? ((val / totalSpending) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${formatINR(val)} (${pct}%)`;
          },
        },
      },
    },
  };

  // Horizontal bar config (for accurate comparison across many categories)
  const barData = {
    labels: processedCategories.map((c) => c.name),
    datasets: [
      {
        axis: 'y',
        label: 'Spending',
        data: processedCategories.map((c) => c.amount),
        backgroundColor: processedCategories.map((c) => c.color),
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : { duration: 600 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` Spent: ${formatINR(ctx.parsed.x)}`,
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
      {/* Header with Title and Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            {hasData ? `${processedCategories.length} active spending categories` : 'No expenses recorded'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Toggle Donut vs Ranked Bar */}
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
              onClick={() => setChartType('donut')}
              title="Donut Distribution"
              style={{
                border: 'none',
                background: chartType === 'donut' ? 'var(--brand-primary)' : 'transparent',
                color: chartType === 'donut' ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <PieIcon size={13} style={{ marginRight: '4px' }} /> Donut
            </button>
            <button
              type="button"
              onClick={() => setChartType('horizontalBar')}
              title="Ranked Comparison"
              style={{
                border: 'none',
                background: chartType === 'horizontalBar' ? 'var(--brand-primary)' : 'transparent',
                color: chartType === 'horizontalBar' ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <BarChart3 size={13} style={{ marginRight: '4px' }} /> Ranked
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportChartAsPNG(chartRef, 'spending-by-category')}
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

      {hasData ? (
        chartType === 'donut' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.1fr) minmax(200px, 1fr)', gap: '1.25rem', alignItems: 'center' }}>
            {/* Donut Container with Center Text */}
            <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
              <Doughnut ref={chartRef} data={donutData} options={donutOptions} />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                  Total Spent
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {formatINR(totalSpending, true)}
                </span>
              </div>
            </div>

            {/* Custom Interactive Legend with Shares */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: `${height}px`, overflowY: 'auto', paddingRight: '0.25rem' }}>
              {processedCategories.map((cat) => (
                <div
                  key={cat.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.775rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(cat.amount)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', width: '36px', textAlign: 'right' }}>
                      {cat.share}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            <Bar ref={chartRef} data={barData} options={barOptions} />
          </div>
        )
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
          <span>No category spending recorded yet.</span>
          <span style={{ fontSize: '0.75rem' }}>Add expense transactions to see your spending allocation breakdown.</span>
        </div>
      )}
    </div>
  );
};

export default CategorySpendingChart;
