import React, { useMemo, useRef } from 'react';
import './ChartSetup';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, exportChartAsPNG, prefersReducedMotion } from './ChartTheme';
import { Download, Sparkles, Info, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

export const FinancialTrendForecastChart = ({
  historicalData = [],
  fittedValues = [],
  forecast = null,
  title = 'Historical Spending & Calibrated Forecast Horizon',
  height = 320,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);

  const isForecastAvailable = forecast?.status === 'available' && Array.isArray(forecast?.projections) && forecast.projections.length > 0;

  // Stitch historical months with forecast months
  const chartPackage = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return { labels: [], actual: [], fitted: [], projected: [], lower: [], upper: [] };
    }

    const histLabels = historicalData.map((h) => {
      if (h.month) {
        const parts = h.month.split('-');
        if (parts.length === 2) {
          const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, 1));
          return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        }
        return h.month;
      }
      return h.label || '';
    });

    const histActual = historicalData.map((h) => Math.round(Number(h.expenditure || h.expense || 0)));
    const histFitted = fittedValues.map((f) => (f !== null && f !== undefined ? Math.round(Number(f)) : null));

    if (!isForecastAvailable) {
      return {
        labels: histLabels,
        actual: histActual,
        fitted: histFitted,
        projected: [],
        lower: [],
        upper: [],
      };
    }

    // Append future projection months
    const projLabels = forecast.projections.map((p) => {
      const parts = (p.month || '').split('-');
      if (parts.length === 2) {
        const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, 1));
        return `${d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })} (Proj)`;
      }
      return `${p.month} (Proj)`;
    });

    const allLabels = [...histLabels, ...projLabels];

    // Align series arrays with null padding so lines connect cleanly
    const fullActual = [...histActual, ...new Array(projLabels.length).fill(null)];
    const fullFitted = [...histFitted, ...new Array(projLabels.length).fill(null)];

    // Projected line starts at last historical actual so the dashed trajectory is continuous
    const lastHistActual = histActual[histActual.length - 1];
    const projPad = new Array(Math.max(0, histActual.length - 1)).fill(null);
    const fullProjected = [...projPad, lastHistActual, ...forecast.projections.map((p) => Math.round(p.projected))];
    const fullLower = [...projPad, lastHistActual, ...forecast.projections.map((p) => Math.round(p.lowerBound))];
    const fullUpper = [...projPad, lastHistActual, ...forecast.projections.map((p) => Math.round(p.upperBound))];

    return {
      labels: allLabels,
      actual: fullActual,
      fitted: fullFitted,
      projected: fullProjected,
      lower: fullLower,
      upper: fullUpper,
    };
  }, [historicalData, fittedValues, forecast, isForecastAvailable]);

  const hasData = chartPackage.labels.length >= 3;

  const chartData = {
    labels: chartPackage.labels,
    datasets: [
      {
        label: 'Actual Historical Spend',
        data: chartPackage.actual,
        borderColor: CHART_PALETTE.expense,
        backgroundColor: CHART_PALETTE.expenseLight,
        fill: false,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: CHART_PALETTE.expense,
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Historical Trend Line (OLS)',
        data: chartPackage.fitted,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
      ...(isForecastAvailable ? [
        {
          label: 'OLS Trend Forecast (+3 Months)',
          data: chartPackage.projected,
          borderColor: CHART_PALETTE.forecast,
          borderDash: [6, 4],
          borderWidth: 2.5,
          tension: 0.3,
          pointBackgroundColor: CHART_PALETTE.forecast,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
        },
        {
          label: '95% Prediction Interval (Upper)',
          data: chartPackage.upper,
          borderColor: 'transparent',
          backgroundColor: CHART_PALETTE.forecastBand,
          fill: '+1', // Fill down to lower bound
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: '95% Prediction Interval (Lower)',
          data: chartPackage.lower,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          tension: 0.3,
        },
      ] : []),
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
          filter: (item) => !item.text.includes('Interval'), // Hide interval bounding datasets from legend clutter
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
          label: (ctx) => {
            if (ctx.parsed.y === null || ctx.parsed.y === undefined) return '';
            if (ctx.dataset.label.includes('Interval')) return '';
            return ` ${ctx.dataset.label}: ${formatINR(ctx.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: 'Plus Jakarta Sans', size: 10 } },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {title}
            </h3>
            {isForecastAvailable && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#8b5cf6',
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  padding: '0.1rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <Sparkles size={11} /> 95% Confidence Band
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            {forecast?.method || 'Ordinary Least Squares Linear Regression'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportChartAsPNG(chartRef, 'trend-forecast-horizon')}
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
        <>
          <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            <Line ref={chartRef} data={chartData} options={options} />
          </div>

          {/* Statistical Assumptions & Limitations Disclosure */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.06)' : 'rgba(99, 102, 241, 0.04)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              <Info size={14} color="#8b5cf6" />
              <span>Statistical Methodology & Limitations Notice</span>
            </div>
            <p style={{ margin: '0 0 0.25rem 0' }}>
              <strong>Assumptions:</strong> {forecast?.assumptions || 'Assumes historical spending slope continues without sudden structural income disruptions.'}
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              <strong>Limitations:</strong> {forecast?.limitations || 'Linear extrapolation cannot anticipate emergency one-time expenditures or seasonal anomalies. Projections represent empirical trend lines, not guaranteed financial advice.'}
            </p>
          </div>
        </>
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
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <AlertCircle size={28} style={{ opacity: 0.6 }} />
          <span>Insufficient historical data for trend forecasting.</span>
          <span style={{ fontSize: '0.75rem', maxWidth: '380px' }}>
            At least 3 consecutive months of recorded transactions are required to calculate a mathematically valid OLS regression trend line (currently analyzed {historicalData.length} months).
          </span>
        </div>
      )}
    </div>
  );
};

export default FinancialTrendForecastChart;
