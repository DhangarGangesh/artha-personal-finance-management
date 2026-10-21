import React, { useState, useMemo, useRef } from 'react';
import './ChartSetup';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, exportChartAsPNG, prefersReducedMotion } from './ChartTheme';
import { Download, BarChart2, Percent, Layers, AlertCircle, Info } from 'lucide-react';

export const ExpenseDistributionChart = ({
  distribution = { edges: [], counts: [] },
  stats = {},
  title = 'Expense Distribution Profile',
  height = 290,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const [viewMode, setViewMode] = useState('count'); // 'count' | 'percent'

  const counts = distribution?.counts || [];
  const edges = distribution?.edges || [];
  const totalCount = useMemo(() => counts.reduce((a, b) => a + b, 0), [counts]);

  const hasData = counts.length > 0 && totalCount > 0;

  // Format labels & values
  const { labels, dataValues, percentages } = useMemo(() => {
    if (!hasData) return { labels: [], dataValues: [], percentages: [] };

    const lbls = counts.map((_, idx) => {
      const start = formatINR(edges[idx]);
      const end = formatINR(edges[idx + 1]);
      return `${start} - ${end}`;
    });

    const pcts = counts.map((c) => (totalCount > 0 ? ((c / totalCount) * 100).toFixed(1) : '0.0'));
    const vals = viewMode === 'percent' ? pcts.map(Number) : counts;

    return { labels: lbls, dataValues: vals, percentages: pcts };
  }, [counts, edges, totalCount, viewMode, hasData]);

  // Skewness analysis
  const skewAnalysis = useMemo(() => {
    const avg = Number(stats?.average || 0);
    const med = Number(stats?.median || 0);
    if (!avg || !med) return null;

    const ratio = avg / med;
    if (ratio >= 1.2) {
      return {
        label: 'Right-Skewed (High Outliers)',
        description: 'Mean is significantly higher than median, indicating infrequent high-value purchases pull up the average.',
        badgeClass: 'badge-warning',
      };
    } else if (ratio <= 0.8) {
      return {
        label: 'Left-Skewed (Low Outliers)',
        description: 'Median is higher than mean, indicating frequent regular expenses with small minor entries.',
        badgeClass: 'badge-info',
      };
    }
    return {
      label: 'Symmetric Distribution',
      description: 'Mean and median are well-aligned, indicating consistent everyday spending sizing.',
      badgeClass: 'badge-success',
    };
  }, [stats]);

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';

  const chartData = {
    labels,
    datasets: [
      {
        label: viewMode === 'percent' ? 'Share of Expenses (%)' : 'Transaction Count',
        data: dataValues,
        backgroundColor: CHART_PALETTE.expense,
        hoverBackgroundColor: '#d97706',
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : { duration: 500, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: textColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items) => (items.length ? `Range: ${items[0].label}` : ''),
          label: (ctx) => {
            const idx = ctx.dataIndex;
            const count = counts[idx] || 0;
            const pct = percentages[idx] || '0';
            return [` Transactions: ${count}`, ` Share: ${pct}% of total records`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 10, weight: 500 },
          maxRotation: 35,
          minRotation: 15,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (v) => (viewMode === 'percent' ? `${v}%` : v),
        },
      },
    },
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with Title, Mode Switcher, and Export */}
      <div
        className="card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            {title}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Empirical frequency histogram grouped into {counts.length} statistical bins
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* View Mode Toggle: Count vs Percent */}
          <div
            style={{
              display: 'inline-flex',
              padding: '2px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('count')}
              className={`btn btn-xs ${viewMode === 'count' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <BarChart2 size={12} />
              Count
            </button>
            <button
              type="button"
              onClick={() => setViewMode('percent')}
              className={`btn btn-xs ${viewMode === 'percent' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <Percent size={12} />
              Share %
            </button>
          </div>

          {/* Export PNG */}
          <button
            type="button"
            onClick={() => exportChartAsPNG(chartRef, 'expense-distribution-histogram')}
            className="btn btn-secondary btn-xs"
            title="Export chart as PNG"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Dispersion Summary Chips */}
      {hasData && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            fontSize: '0.75rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Average: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatINR(stats?.average)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Median: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatINR(stats?.median)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Min / Max: </span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatINR(stats?.minimum)} – {formatINR(stats?.maximum)}
            </strong>
          </div>
          {skewAnalysis && (
            <span className={`badge ${skewAnalysis.badgeClass}`} style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
              {skewAnalysis.label}
            </span>
          )}
        </div>
      )}

      {/* Main Chart Canvas */}
      <div style={{ height: `${height}px`, position: 'relative', width: '100%' }}>
        {hasData ? (
          <Bar ref={chartRef} data={chartData} options={options} />
        ) : (
          <div
            className="empty-state"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <AlertCircle size={28} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <span>No expense distribution records available</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default ExpenseDistributionChart;
