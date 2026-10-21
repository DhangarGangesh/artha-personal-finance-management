import React from 'react';
import './ChartSetup';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

export const RegistrationTrendChart = ({ trends = [] }) => {
  const { isDark } = useTheme();

  const labels = trends.map((t) => t.label || t.month);
  const dataPoints = trends.map((t) => t.count);

  const chartData = {
    labels: labels.length ? labels : ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
    datasets: [
      {
        label: 'New Registrations',
        data: labels.length ? dataPoints : [0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: isDark ? '#111827' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} users joined`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          precision: 0,
          color: isDark ? '#64748b' : '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 },
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '260px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RegistrationTrendChart;
