import React, { useMemo, useRef } from 'react';
import './ChartSetup';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, exportChartAsPNG, prefersReducedMotion } from './ChartTheme';
import { Download, PiggyBank, Target, AlertCircle } from 'lucide-react';

export const SavingsPerformanceChart = ({
  monthlyData = [],
  title = 'Savings Performance & Rate Trajectory',
  targetRate = 20, // Recommended standard healthy 20% savings rate
  height = 300,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);

  const series = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return { labels: [], savings: [], savingsRates: [], targetSavings: [] };
    }

    const labels = monthlyData.map((m) => {
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

    const savings = monthlyData.map((m) => Math.round(Number(m.savings !== undefined ? m.savings : (m.income || 0) - (m.expense || m.expenditure || 0))));
    const savingsRates = monthlyData.map((m) => {
      const inc = Number(m.income || 0);
      const sav = Math.round(Number(m.savings !== undefined ? m.savings : inc - (m.expense || m.expenditure || 0)));
      return inc > 0 ? Math.round((sav / inc) * 100) : 0;
    });

    // 20% Target Savings line based on each month's income
    const targetSavings = monthlyData.map((m) => Math.round(Number(m.income || 0) * (targetRate / 100)));

    return { labels, savings, savingsRates, targetSavings };
  }, [monthlyData, targetRate]);

  const hasData = series.labels.length > 0 && series.savings.some((s) => s !== 0);

  const chartData = {
    labels: series.labels,
    datasets: [
      {
        label: 'Actual Net Savings',
        data: series.savings,
        borderColor: CHART_PALETTE.savings,
        backgroundColor: CHART_PALETTE.savingsLight,
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: CHART_PALETTE.savings,
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: `Target Savings (${targetRate}% Benchmark)`,
        data: series.targetSavings,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.35)',
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : { duration: 600 },
    interaction: { mode: 'index', intersect: false },
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
          label: (ctx) => ` ${ctx.dataset.label}: ${formatINR(ctx.parsed.y)}`,
          afterBody: (itemsArr) => {
            const idx = itemsArr[0]?.dataIndex;
            if (idx === undefined) return '';
            const rate = series.savingsRates[idx];
            return [`Monthly Savings Rate: ${rate}% of income`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (v) => formatINR(v, true),
        },
      },
    },
  };

  // Average savings metric
  const avgSavings = useMemo(() => {
    if (!series.savings.length) return 0;
    const sum = series.savings.reduce((a, b) => a + b, 0);
    return Math.round(sum / series.savings.length);
  }, [series]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Monthly surplus (Income minus Expenses) vs {targetRate}% ideal savings rate
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Monthly Surplus</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: avgSavings >= 0 ? CHART_PALETTE.income : CHART_PALETTE.expenseDanger }}>
              {formatINR(avgSavings)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => exportChartAsPNG(chartRef, 'savings-performance')}
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
        <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
          <Line ref={chartRef} data={chartData} options={options} />
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
          <span>No historical savings data recorded.</span>
          <span style={{ fontSize: '0.75rem' }}>Record income and expense transactions to view monthly net savings curves.</span>
        </div>
      )}
    </div>
  );
};

export default SavingsPerformanceChart;
