import React, { useState, useMemo, useRef } from 'react';
import './ChartSetup';
import {
  Chart as ChartJS,
  ScatterController,
  LineController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { CHART_PALETTE, formatINR, exportChartAsPNG, prefersReducedMotion } from './ChartTheme';
import { Download, TrendingUp, AlertCircle, Compass, Target } from 'lucide-react';

ChartJS.register(
  ScatterController,
  LineController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export const BivariateScatterChart = ({
  points = [],
  xKey = 'income',
  yKey = 'expenditure',
  xLabel = 'Monthly Income',
  yLabel = 'Monthly Expenditure',
  correlation = null,
  showBenchmark = false,
  benchmarkLabel = '20% Target Savings Guide',
  pointColor = CHART_PALETTE.primary,
  title = 'Bivariate Scatter Relationship',
  subtitle = 'Monthly observation coordinates',
  height = 290,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const [showTrendline, setShowTrendline] = useState(true);
  const [showBenchmarkLine, setShowBenchmarkLine] = useState(showBenchmark);

  const rawPoints = Array.isArray(points) ? points : [];
  const hasData = rawPoints.length > 0;

  // Compute correlation interpretation
  const corrInfo = useMemo(() => {
    if (correlation === null || correlation === undefined || isNaN(correlation)) {
      return { text: 'Insufficient variation', badgeClass: 'badge-neutral', desc: 'Need diverse values to calculate linear correlation.' };
    }
    const r = Number(correlation);
    if (r >= 0.7) {
      return { text: `Strong Positive (r = ${r.toFixed(2)})`, badgeClass: 'badge-success', desc: `${yLabel} expands substantially as ${xLabel} grows.` };
    } else if (r >= 0.3) {
      return { text: `Moderate Positive (r = ${r.toFixed(2)})`, badgeClass: 'badge-info', desc: `${yLabel} tends to rise moderately alongside ${xLabel}.` };
    } else if (r <= -0.7) {
      return { text: `Strong Inverse (r = ${r.toFixed(2)})`, badgeClass: 'badge-warning', desc: `${yLabel} drops sharply as ${xLabel} increases.` };
    } else if (r <= -0.3) {
      return { text: `Moderate Inverse (r = ${r.toFixed(2)})`, badgeClass: 'badge-warning', desc: `${yLabel} shows an inverse trend against ${xLabel}.` };
    }
    return { text: `Weak / Inelastic (r = ${r.toFixed(2)})`, badgeClass: 'badge-neutral', desc: `${yLabel} behaves independently of ${xLabel}.` };
  }, [correlation, xLabel, yLabel]);

  // Extract clean coordinates
  const cleanPoints = useMemo(() => {
    if (!hasData) return [];
    return rawPoints
      .map((p) => ({
        x: Number(p[xKey] ?? p.x ?? 0),
        y: Number(p[yKey] ?? p.y ?? 0),
        month: p.month || p.label || '',
      }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));
  }, [rawPoints, xKey, yKey, hasData]);

  // Compute OLS Linear Fit: y = beta1 * x + beta0
  const trendlinePoints = useMemo(() => {
    if (cleanPoints.length < 2) return [];
    const n = cleanPoints.length;
    const xVals = cleanPoints.map((p) => p.x);
    const yVals = cleanPoints.map((p) => p.y);

    const xMean = xVals.reduce((a, b) => a + b, 0) / n;
    const yMean = yVals.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xVals[i] - xMean) * (yVals[i] - yMean);
      den += (xVals[i] - xMean) ** 2;
    }

    if (den === 0) return [];
    const slope = num / den;
    const intercept = yMean - slope * xMean;

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);

    return [
      { x: minX, y: Math.max(0, slope * minX + intercept) },
      { x: maxX, y: Math.max(0, slope * maxX + intercept) },
    ];
  }, [cleanPoints]);

  // Compute Benchmark Guide line (e.g. 20% savings)
  const benchmarkGuidePoints = useMemo(() => {
    if (!showBenchmark || cleanPoints.length === 0) return [];
    const minX = 0;
    const maxX = Math.max(...cleanPoints.map((p) => p.x));
    return [
      { x: minX, y: 0 },
      { x: maxX, y: Math.round(maxX * 0.2) },
    ];
  }, [showBenchmark, cleanPoints]);

  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';

  const datasets = [
    {
      type: 'scatter',
      label: 'Monthly Observation',
      data: cleanPoints,
      backgroundColor: pointColor,
      borderColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 9,
    },
  ];

  if (showTrendline && trendlinePoints.length === 2) {
    datasets.push({
      type: 'line',
      label: 'OLS Linear Fit',
      data: trendlinePoints,
      borderColor: '#f59e0b',
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0,
    });
  }

  if (showBenchmarkLine && benchmarkGuidePoints.length === 2) {
    datasets.push({
      type: 'line',
      label: benchmarkLabel,
      data: benchmarkGuidePoints,
      borderColor: CHART_PALETTE.income,
      borderDash: [3, 3],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0,
    });
  }

  const chartData = { datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : { duration: 500, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        display: showTrendline || showBenchmarkLine,
        position: 'top',
        align: 'end',
        labels: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 10, weight: 600 },
          boxWidth: 8,
          usePointStyle: true,
          padding: 8,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: textColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items) => {
            if (!items.length) return '';
            const pt = cleanPoints[items[0].dataIndex] || {};
            return pt.month ? `Observation Period: ${pt.month}` : 'Observation';
          },
          label: (ctx) => {
            if (ctx.dataset.type === 'line') {
              return ` ${ctx.dataset.label}: ${formatINR(ctx.parsed?.y)}`;
            }
            const lines = [
              ` ${xLabel}: ${formatINR(ctx.parsed?.x)}`,
              ` ${yLabel}: ${formatINR(ctx.parsed?.y)}`,
            ];
            if (yKey === 'savings' && ctx.parsed?.x > 0) {
              const rate = Math.round((ctx.parsed.y / ctx.parsed.x) * 100);
              lines.push(` Savings Rate: ${rate}%`);
            } else if (yKey === 'expenditure' && ctx.parsed?.x !== undefined) {
              const net = Number(ctx.parsed.x || 0) - Number(ctx.parsed.y || 0);
              lines.push(` Net Balance: ${formatINR(net)} (${net >= 0 ? 'Surplus' : 'Deficit'})`);
            }
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: xLabel, color: textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 } },
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 10 },
          callback: (v) => formatINR(v, true),
        },
      },
      y: {
        type: 'linear',
        title: { display: true, text: yLabel, color: textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 } },
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 10 },
          callback: (v) => formatINR(v, true),
        },
      },
    },
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        className="card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            {title}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Correlation Badge */}
          <span className={`badge ${corrInfo.badgeClass}`} style={{ fontSize: '0.725rem' }}>
            {corrInfo.text}
          </span>

          {/* Toggle Trendline */}
          <button
            type="button"
            onClick={() => setShowTrendline(!showTrendline)}
            className={`btn btn-xs ${showTrendline ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            title="Toggle OLS linear fit trendline"
          >
            Trendline
          </button>

          {/* Toggle Benchmark (if applicable) */}
          {showBenchmark && (
            <button
              type="button"
              onClick={() => setShowBenchmarkLine(!showBenchmarkLine)}
              className={`btn btn-xs ${showBenchmarkLine ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              title="Toggle 20% target savings guide line"
            >
              20% Target
            </button>
          )}

          {/* Export PNG */}
          <button
            type="button"
            onClick={() => exportChartAsPNG(chartRef, `${xKey}-vs-${yKey}-scatter`)}
            className="btn btn-secondary btn-xs"
            title="Export chart as PNG"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Correlation Context Pill */}
      {corrInfo.desc && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            marginBottom: '0.75rem',
            borderLeft: `3px solid ${pointColor}`,
          }}
        >
          {corrInfo.desc}
        </div>
      )}

      {/* Main Chart Canvas */}
      <div style={{ height: `${height}px`, position: 'relative', width: '100%' }}>
        {hasData ? (
          <Chart ref={chartRef} type="scatter" data={chartData} options={options} />
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
            <span>Insufficient monthly points for bivariate analysis</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default BivariateScatterChart;
