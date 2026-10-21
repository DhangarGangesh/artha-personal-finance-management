import React, { useMemo, useRef } from 'react';
import './ChartSetup';
import { Chart } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, exportChartAsPNG, prefersReducedMotion } from './ChartTheme';
import { Download, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';

export const CashFlowChart = ({
  monthlyData = [],
  title = 'Cash Flow & Liquidity Streams',
  height = 280,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);

  const series = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return { labels: [], inflows: [], outflows: [], netFlows: [] };
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

    const inflows = monthlyData.map((m) => Math.round(Number(m.income || 0)));
    const outflows = monthlyData.map((m) => Math.round(Number(m.expense || m.expenditure || 0)));
    const netFlows = monthlyData.map((m, idx) => Math.round((inflows[idx] || 0) - (outflows[idx] || 0)));

    return { labels, inflows, outflows, netFlows };
  }, [monthlyData]);

  const hasData = series.labels.length > 0 &&
    (series.inflows.some((v) => v > 0) || series.outflows.some((v) => v > 0));

  const totalInflows = useMemo(() => series.inflows.reduce((a, b) => a + b, 0), [series]);
  const totalOutflows = useMemo(() => series.outflows.reduce((a, b) => a + b, 0), [series]);
  const totalNet = totalInflows - totalOutflows;

  const chartData = {
    labels: series.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Inflows (Income)',
        data: series.inflows,
        backgroundColor: CHART_PALETTE.income,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        type: 'bar',
        label: 'Outflows (Expenditure)',
        data: series.outflows,
        backgroundColor: CHART_PALETTE.expense,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        type: 'line',
        label: 'Net Cash Flow',
        data: series.netFlows,
        borderColor: CHART_PALETTE.savings,
        backgroundColor: CHART_PALETTE.savingsLight,
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
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

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Periodic inflows, outflows, and net liquidity delta
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowDownLeft size={14} color={CHART_PALETTE.income} />
              <span style={{ color: 'var(--text-muted)' }}>In:</span>
              <strong style={{ color: CHART_PALETTE.income }}>{formatINR(totalInflows, true)}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowUpRight size={14} color={CHART_PALETTE.expense} />
              <span style={{ color: 'var(--text-muted)' }}>Out:</span>
              <strong style={{ color: CHART_PALETTE.expense }}>{formatINR(totalOutflows, true)}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => exportChartAsPNG(chartRef, 'cash-flow-breakdown')}
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
          <Chart ref={chartRef} type="bar" data={chartData} options={options} />
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
          <span>No cash flow records in this period.</span>
          <span style={{ fontSize: '0.75rem' }}>Record incoming and outgoing funds to analyze cash flow liquidity.</span>
        </div>
      )}
    </div>
  );
};

export default CashFlowChart;
