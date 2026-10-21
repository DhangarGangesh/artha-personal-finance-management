import React from 'react';

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', style = {} }) => {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton width="40%" height="24px" />
      <Skeleton width="70%" height="16px" />
      <Skeleton width="100%" height="120px" borderRadius="var(--radius-md)" />
    </div>
  );
};

export default Skeleton;
