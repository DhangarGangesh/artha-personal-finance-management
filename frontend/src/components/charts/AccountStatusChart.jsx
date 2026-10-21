import React from 'react';
import './ChartSetup';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

export const AccountStatusChart = ({ active = 0, suspended = 0 }) => {
  const { isDark } = useTheme();

  const total = active + suspended;

  if (total === 0) {
    return (
      <div
        style={{
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        No user accounts present
      </div>
    );
  }

  const chartData = {
    labels: ['Active Accounts', 'Suspended Accounts'],
    datasets: [
      {
        data: [active, suspended],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 2,
        borderColor: isDark ? '#111827' : '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${Math.round((ctx.parsed / total) * 100)}%)`,
        },
      },
    },
    cutout: '72%',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '240px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default AccountStatusChart;
