import React from 'react';
import './ChartSetup';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

export const IncomeExpenseChart = ({ data = [] }) => {
  const { isDark } = useTheme();

  const labels = data.map((d) => d.month || d.label || '');
  const incomeValues = data.map((d) => d.income || 0);
  const expenseValues = data.map((d) => d.expense || 0);

  const chartData = {
    labels: labels.length ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: labels.length ? incomeValues : [0, 0, 0, 0, 0, 0],
        backgroundColor: '#10b981',
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Expense',
        data: labels.length ? expenseValues : [0, 0, 0, 0, 0, 0],
        backgroundColor: '#ef4444',
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#94a3b8' : '#475569',
          font: { family: 'Plus Jakarta Sans', weight: 600, size: 12 },
          boxWidth: 12,
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
          label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
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
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
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
    <div style={{ position: 'relative', width: '100%', height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default IncomeExpenseChart;
