/**
 * ARTHA Financial Chart Design System & Theme Engine
 * 
 * Provides unified theme tokens, accessible financial color palettes,
 * currency formatters, and Chart.js options for light/dark themes.
 */

export const CHART_PALETTE = {
  // Brand accents
  primary: '#6366f1',       // Blue-violet primary accent
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Financial polarity
  income: '#10b981',        // Emerald positive / inflow
  incomeLight: 'rgba(16, 185, 129, 0.25)',
  incomeFaint: 'rgba(16, 185, 129, 0.08)',
  
  expense: '#f59e0b',       // Amber warning / outflow
  expenseLight: 'rgba(245, 158, 11, 0.25)',
  expenseDanger: '#ef4444', // Red critical breach / overspending
  expenseDangerLight: 'rgba(239, 68, 68, 0.25)',
  
  savings: '#06b6d4',       // Cyan wealth / net savings
  savingsLight: 'rgba(6, 182, 212, 0.25)',
  
  forecast: '#8b5cf6',      // Purple predictive / projected
  forecastBand: 'rgba(139, 92, 246, 0.15)',
  
  // Category categorical palette (harmonious HSL hues)
  categories: [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#0ea5e9', // Sky
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#64748b', // Slate / Other
  ],
};

/** Format integer or decimal into Indian Rupee format */
export function formatINR(val, compact = false) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const num = Number(val);
  if (compact && Math.abs(num) >= 100000) {
    if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
  }
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/** Check if reduced motion is requested */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Generate standardized, responsive Chart.js options */
export function getChartOptions({
  isDark = true,
  yPrefix = '₹',
  isPercentage = false,
  compactCurrency = false,
  legendPosition = 'top',
  showLegend = true,
  stacked = false,
} = {}) {
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : { duration: 600, easing: 'easeOutQuart' },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        align: 'end',
        labels: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 8,
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 700 },
        bodyFont: { family: 'Plus Jakarta Sans', size: 11, weight: 500 },
        callbacks: {
          label: (ctx) => {
            const raw = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed;
            if (raw === null || raw === undefined) return '';
            const formatted = isPercentage
              ? `${Number(raw).toFixed(1)}%`
              : formatINR(raw, compactCurrency);
            return ` ${ctx.dataset.label || ctx.label || ''}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 500 },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        stacked,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (v) => {
            if (isPercentage) return `${v}%`;
            return formatINR(v, true);
          },
        },
      },
    },
  };
}

/** Download canvas chart as PNG image */
export function exportChartAsPNG(chartRef, filename = 'artha-financial-chart') {
  if (!chartRef?.current) return;
  const chartInstance = chartRef.current;
  const url = chartInstance.toBase64Image ? chartInstance.toBase64Image() : chartInstance.canvas?.toDataURL('image/png');
  if (!url) return;
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = url;
  link.click();
}
