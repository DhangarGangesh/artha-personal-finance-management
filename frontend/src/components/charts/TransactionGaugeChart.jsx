import React from 'react';
import './ChartSetup';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

export const TransactionGaugeChart = ({
  total = 55501,
  income = 42000,
  expense = 31000,
  growthPercent = 20,
}) => {
  const { isDark } = useTheme();

  const chartData = {
    labels: ['Sales / Income', 'Payment / Expense', 'Buffer'],
    datasets: [
      {
        data: [income || 42000, expense || 31000, 15000],
        backgroundColor: ['#10b981', '#06b6d4', '#6366f1'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    circumference: 180,
    rotation: 270,
    cutout: '78%',
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
          label: (ctx) => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  const formattedTotal = `₹${Number(total || 55501).toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '240px', height: '140px' }}>
        <Doughnut data={chartData} options={options} />
        {/* Center Text inside semi-circle */}
        <div
          style={{
            position: 'absolute',
            bottom: '5px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {formattedTotal}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.725rem',
              fontWeight: 700,
              color: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              padding: '0.1rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              marginTop: '2px',
            }}
          >
            ↗ {growthPercent}% Growth
          </span>
        </div>
      </div>

      {/* Legend Dots underneath */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1.25rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
          <span>Volume</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>Sales</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06b6d4' }} />
          <span>Payment</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionGaugeChart;
