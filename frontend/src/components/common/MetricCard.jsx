import React from 'react';
import { motion } from 'framer-motion';

export const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = 'var(--brand-primary)',
  iconBg = 'var(--brand-primary-light)',
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  badge,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="stat-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {Icon && (
          <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
            <Icon size={22} />
          </div>
        )}
        {badge && <span className="badge badge-info">{badge}</span>}
      </div>

      <span className="stat-label">{label}</span>
      <div className="stat-value">{value}</div>

      {(subtext || trend) && (
        <div className="stat-subtext">
          {trend && (
            <span
              style={{
                fontWeight: 600,
                color:
                  trendType === 'positive'
                    ? 'var(--success)'
                    : trendType === 'negative'
                    ? 'var(--danger)'
                    : 'var(--text-secondary)',
              }}
            >
              {trend}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;
