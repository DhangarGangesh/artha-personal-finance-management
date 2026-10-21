import React from 'react';
import './ChartSetup';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

export const AssetsCurveChart = ({ data = [], timeFrame = 'Daily' }) => {
  const { isDark } = useTheme();

  let labels = data.map((d) => d.label || d.month || '');
  let incomeValues = data.map((d) => d.income || 0);
  let expenseValues = data.map((d) => d.expense || 0);

  // If no data provided, provide realistic curve data based on timeFrame
  if (!labels.length) {
    if (timeFrame === 'Daily') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      incomeValues = [280, 420, 390, 560, 480, 620, 590];
      expenseValues = [180, 310, 260, 410, 340, 380, 420];
    } else if (timeFrame === 'Weekly') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      incomeValues = [18500, 22400, 19800, 24300];
      expenseValues = [12100, 14200, 13800, 15900];
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      incomeValues = [65000, 72000, 68000, 85000, 79000, 92000, 88000];
      expenseValues = [34000, 41000, 39000, 45000, 42000, 48000, 44000];
    }
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeValues,
        borderColor: '#10b981',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.45,
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
      {
        label: 'Expense',
        data: expenseValues,
        borderColor: '#f59e0b',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.45,
        borderWidth: 3,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // Custom legend in dashboard header
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5],
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (v) => `₹${v.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '270px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default AssetsCurveChart;
