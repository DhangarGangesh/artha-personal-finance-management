import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Database,
  Cpu,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Layers,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

export const SystemMonitoring = () => {
  const toast = useToast();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealth = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const res = await adminService.getSystemHealth();
      setHealth(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch infrastructure health');
      if (isSilent) toast.error('Health poll failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchHealth(true);
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const formatUptime = (sec) => {
    if (!sec) return '0s';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const formatMB = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton width="40%" height="32px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: '200px' }}><Skeleton height="100%" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card empty-state">
        <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3>System Diagnostics Unavailable</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <button type="button" onClick={() => fetchHealth()} className="btn btn-primary">
          Retry Diagnostics
        </button>
      </div>
    );
  }

  const server = health?.server || {};
  const db = health?.database || {};
  const py = health?.pythonAnalysis || {};

  const isDbHealthy = db.status === 'connected';
  const isPyHealthy = py.available;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            System Infrastructure & Diagnostics
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Live status of backend node process, MongoDB cluster connectivity, and Python engine
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Auto-poll (15s)</span>
          </label>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchHealth(true)}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Polling...' : 'Refresh Now'}</span>
          </button>
        </div>
      </div>

      {/* Primary Diagnostic Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Node Server Health */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Server size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Express API Server</h3>
            </div>
            <span className="badge badge-success">
              <CheckCircle2 size={12} /> Operational
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Node.js Runtime</span>
              <span className="mono-num" style={{ fontWeight: 600 }}>{server.nodeVersion || 'v20+'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Process Uptime</span>
              <span className="mono-num" style={{ fontWeight: 600 }}>{formatUptime(server.uptimeSeconds)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Operating Platform</span>
              <span style={{ fontWeight: 600 }}>{server.platform} ({server.arch})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Process ID (PID)</span>
              <span className="mono-num" style={{ fontWeight: 600 }}>{server.pid}</span>
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Database size={20} color="var(--brand-secondary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>MongoDB Cluster</h3>
            </div>
            <span className={`badge ${isDbHealthy ? 'badge-success' : 'badge-danger'}`}>
              {isDbHealthy ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {isDbHealthy ? 'Operational' : 'Disconnected'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection Status</span>
              <span style={{ fontWeight: 600, color: isDbHealthy ? 'var(--success)' : 'var(--danger)' }}>
                {db.status?.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Ping Latency</span>
              <span className="mono-num" style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                {db.pingMs !== null ? `${db.pingMs} ms` : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Database</span>
              <span style={{ fontWeight: 600 }}>{db.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ready State Code</span>
              <span className="mono-num" style={{ fontWeight: 600 }}>{db.readyState} (1 = Ready)</span>
            </div>
          </div>
        </div>

        {/* Python Statistical Engine */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Terminal size={20} color="#ec4899" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Python Analysis Engine</h3>
            </div>
            <span className={`badge ${isPyHealthy ? 'badge-success' : 'badge-warning'}`}>
              {isPyHealthy ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {isPyHealthy ? 'Engine Active' : 'Degraded'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Python Version</span>
              <span className="mono-num" style={{ fontWeight: 600 }}>{py.version || 'Python 3.10+'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>NumPy Scientific Library</span>
              <span style={{ fontWeight: 600, color: py.libraries?.numpy ? 'var(--success)' : 'var(--text-muted)' }}>
                {py.libraries?.numpy ? `Available (${py.libraries.numpy})` : 'Installed'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Pandas DataFrames</span>
              <span style={{ fontWeight: 600, color: py.libraries?.pandas ? 'var(--success)' : 'var(--text-muted)' }}>
                {py.libraries?.pandas ? `Available (${py.libraries.pandas})` : 'Installed'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subprocess Bridge</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>JSON Stdio Protocol</span>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Allocation Diagnostics */}
      {server.memory && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Memory Allocation Profile</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Last sampled: {new Date(health.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Resident Set Size (RSS)
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {formatMB(server.memory.rssBytes)}
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                V8 Heap Used
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
                {formatMB(server.memory.heapUsedBytes)}
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                V8 Heap Total
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {formatMB(server.memory.heapTotalBytes)}
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                External Bindings
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                {formatMB(server.memory.externalBytes)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitoring;
