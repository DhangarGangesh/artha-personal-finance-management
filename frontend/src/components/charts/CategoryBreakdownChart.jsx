import React from 'react';
import './ChartSetup';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

const PALETTE = [
  '#6366f1',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#06b6d4',
  '#f97316',
  '#64748b',
];

export const CategoryBreakdownChart = ({ categories = [] }) => {
  const { isDark } = useTheme();

  const labels = categories.map((c) => c.category || c.name || 'Other');
  const values = categories.map((c) => c.amount || c.total || 0);

  if (categories.length === 0 || values.every((v) => v === 0)) {
    return (
      <div
        style={{
          height: '260px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        <span>No category spending recorded yet.</span>
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length),
        borderWidth: 2,
        borderColor: isDark ? '#111827' : '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: isDark ? '#94a3b8' : '#475569',
          font: { family: 'Plus Jakarta Sans', size: 12 },
          boxWidth: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}`,
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '260px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default CategoryBreakdownChart;
