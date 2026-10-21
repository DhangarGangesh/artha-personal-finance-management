import React, { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { financeService } from '../../services/financeService';
import { Skeleton } from '../../components/common/Skeleton';

export const InsightsAlerts = () => {
  const [data, setData] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getAlerts();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load financial alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const summary = data?.summary || { totalAlerts: 0, critical: 0, warning: 0, info: 0 };
  const allAlerts = data?.alerts || [];

  const filteredAlerts =
    filterSeverity === 'ALL'
      ? allAlerts
      : allAlerts.filter((a) => a.severity?.toUpperCase() === filterSeverity);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="40%" height="32px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: '90px' }}><Skeleton height="100%" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <AlertCircle size={36} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>Unable to fetch financial alerts</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button type="button" onClick={fetchAlerts} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Insights & Financial Alerts
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Rule-based anomaly detection evaluating budget breaches, overspending, and savings milestones
        </p>
      </div>

      {/* Summary Pills */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterSeverity('ALL')}
          className={`card ${filterSeverity === 'ALL' ? 'active-pill' : ''}`}
          style={{
            padding: '1rem 1.25rem',
            flex: 1,
            minWidth: '160px',
            cursor: 'pointer',
            border: filterSeverity === 'ALL' ? '2px solid var(--brand-primary)' : undefined,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ALERTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{summary.totalAlerts}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterSeverity('CRITICAL')}
          className="card"
          style={{
            padding: '1rem 1.25rem',
            flex: 1,
            minWidth: '160px',
            cursor: 'pointer',
            border: filterSeverity === 'CRITICAL' ? '2px solid var(--danger)' : undefined,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>CRITICAL</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--danger)' }}>
            {summary.critical}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterSeverity('WARNING')}
          className="card"
          style={{
            padding: '1rem 1.25rem',
            flex: 1,
            minWidth: '160px',
            cursor: 'pointer',
            border: filterSeverity === 'WARNING' ? '2px solid var(--warning)' : undefined,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>WARNINGS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--warning)' }}>
            {summary.warning}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterSeverity('INFO')}
          className="card"
          style={{
            padding: '1rem 1.25rem',
            flex: 1,
            minWidth: '160px',
            cursor: 'pointer',
            border: filterSeverity === 'INFO' ? '2px solid var(--info)' : undefined,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--info)', fontWeight: 600 }}>INFORMATIONAL</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--info)' }}>
            {summary.info}
          </div>
        </button>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3.5rem 1.5rem' }}>
          <ShieldCheck size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>All Clear!</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
            No financial risk alerts or budget breaches detected in your account. You're in good financial health!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAlerts.map((alert, index) => {
            const severity = alert.severity?.toUpperCase();
            const isCritical = severity === 'CRITICAL';
            const isWarning = severity === 'WARNING';

            const borderColor = isCritical
              ? 'var(--danger-border)'
              : isWarning
              ? 'var(--warning-border)'
              : 'var(--info-border)';

            const badgeClass = isCritical
              ? 'badge-danger'
              : isWarning
              ? 'badge-warning'
              : 'badge-info';

            const Icon = isCritical ? AlertCircle : isWarning ? AlertTriangle : Info;

            return (
              <div
                key={alert.id || index}
                className="card"
                style={{
                  borderLeft: `4px solid ${isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--info)'}`,
                  borderColor: borderColor,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isCritical
                      ? 'var(--danger-bg)'
                      : isWarning
                      ? 'var(--warning-bg)'
                      : 'var(--info-bg)',
                    color: isCritical
                      ? 'var(--danger)'
                      : isWarning
                      ? 'var(--warning)'
                      : 'var(--info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span className={`badge ${badgeClass}`}>{severity}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{alert.title}</h3>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    {alert.message}
                  </p>

                  {alert.recommendation && (
                    <div
                      style={{
                        padding: '0.5rem 0.85rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        display: 'inline-block',
                      }}
                    >
                      💡 <strong>Action:</strong> {alert.recommendation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InsightsAlerts;
