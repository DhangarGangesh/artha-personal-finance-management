import React from 'react';

export const ArthaLogo = ({
  size = 'md',
  showText = true,
  subtitle = 'PERSONAL WEALTH',
  variant = 'default',
}) => {
  // Dimensions map
  const dimensions = {
    sm: { icon: 28, titleSize: '1rem', subSize: '0.55rem', gap: '0.5rem' },
    md: { icon: 38, titleSize: '1.25rem', subSize: '0.625rem', gap: '0.75rem' },
    lg: { icon: 48, titleSize: '1.5rem', subSize: '0.7rem', gap: '0.85rem' },
    xl: { icon: 60, titleSize: '2rem', subSize: '0.8rem', gap: '1rem' },
  };

  const dim = dimensions[size] || dimensions.md;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: dim.gap, userSelect: 'none' }}>
      {/* Modern Geometric SVG Logo Mark */}
      <svg
        width={dim.icon}
        height={dim.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.35))' }}
      >
        <defs>
          {/* Main Primary Gradient: Indigo to Violet */}
          <linearGradient id="artha-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Accent Gold / Emerald Gradient for Wealth & Growth */}
          <linearGradient id="artha-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="artha-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagon / Shield Frame */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          fill="#131728"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />

        {/* Stylized Modern "A" with Growth Arrow Path */}
        {/* Left ascending diagonal */}
        <path
          d="M14 34L24 12L34 34"
          stroke="url(#artha-grad-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ascending upward dynamic chevron bar */}
        <path
          d="M17 26L24 20L31 26"
          stroke="url(#artha-grad-accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Luminous Central Diamond / Wealth Node */}
        <polygon
          points="24,10 27,15 24,20 21,15"
          fill="url(#artha-grad-accent)"
        />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: dim.titleSize,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: variant === 'dark' ? 'unset' : 'text',
                WebkitTextFillColor: variant === 'dark' ? 'inherit' : 'transparent',
                color: variant === 'dark' ? 'var(--text-primary)' : '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              ARTHA
            </span>
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
          </div>
          {subtitle && (
            <span
              style={{
                fontSize: dim.subSize,
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ArthaLogo;
