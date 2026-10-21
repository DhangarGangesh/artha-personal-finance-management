import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

export const AuditLogs = () => {
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAuditLogs({
        search,
        action: actionFilter,
        page,
        limit: 20,
      });

      setLogs(res.logs || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve governance audit trails');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actions = [
    { value: 'all', label: 'All Event Actions' },
    { value: 'STATUS_CHANGED', label: 'Account Status Changed' },
    { value: 'ROLE_CHANGED', label: 'User Role Changed' },
    { value: 'ADMIN_LOGIN', label: 'Admin Login' },
    { value: 'DATASET_SEEDED', label: 'Synthetic Dataset Seeded' },
    { value: 'DATASET_CLEARED', label: 'Demo Records Cleared' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Administrative Audit Trail
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Immutable record of governance activities, moderation actions, and administrative logins
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search actor, target, or keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            {actions.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <Skeleton height="32px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="32px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="32px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="32px" />
          </div>
        ) : error ? (
          <div className="empty-state">
            <AlertTriangle size={36} color="var(--danger)" style={{ marginBottom: '0.75rem' }} />
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No audit log records match the current filters</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="artha-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor (Admin)</th>
                  <th>Action</th>
                  <th>Target User</th>
                  <th>Outcome</th>
                  <th>Reason / Details</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.825rem' }}>{log.adminEmail || 'System'}</span>
                    </td>
                    <td>
                      <span className="badge badge-admin">{log.action}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                        {log.targetUserEmail || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${log.outcome === 'failure' ? 'badge-danger' : 'badge-success'}`}>
                        {log.outcome || 'success'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details?.reason || (log.details ? JSON.stringify(log.details) : '—')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px' }}
                        title="View audit event payload"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total {pagination.total} audit records • Page {page} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Event Details"
        maxWidth="560px"
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Event ID:</span>
              <span className="mono-num" style={{ fontWeight: 600 }}>{selectedLog._id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Action:</span>
              <span className="badge badge-admin">{selectedLog.action}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Admin Actor:</span>
              <span style={{ fontWeight: 600 }}>{selectedLog.adminEmail || 'System'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target User:</span>
              <span>{selectedLog.targetUserEmail || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>IP Address:</span>
              <span className="mono-num">{selectedLog.ipAddress || '127.0.0.1'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Outcome:</span>
              <span className={`badge ${selectedLog.outcome === 'failure' ? 'badge-danger' : 'badge-success'}`}>
                {selectedLog.outcome || 'success'}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Event Payload / Metadata:
              </span>
              <pre
                style={{
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.775rem',
                  overflowX: 'auto',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                }}
              >
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
