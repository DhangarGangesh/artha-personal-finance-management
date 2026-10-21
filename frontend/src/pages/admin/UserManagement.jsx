import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  History,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

export const UserManagement = () => {
  const { user: currentAdmin } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Status Modal State
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('active');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Role Modal State
  const [roleTarget, setRoleTarget] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [roleReason, setRoleReason] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // History Modal State
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
        page,
        limit: 15,
      });

      setUsers(res.users || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Status Change Handler
  const handleOpenStatusModal = (user, targetStatus) => {
    if (String(currentAdmin?._id) === String(user._id)) {
      toast.warning('Administrators cannot suspend their own account.');
      return;
    }
    setStatusTarget(user);
    setNewStatus(targetStatus);
    setStatusReason('');
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    if (!statusReason.trim()) {
      toast.error('A reason is required for account status modifications.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await adminService.updateUserStatus(statusTarget._id, {
        status: newStatus,
        reason: statusReason.trim(),
      });
      toast.success(`Account status for ${statusTarget.name} updated to ${newStatus}`);
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to change status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Role Change Handler
  const handleOpenRoleModal = (user) => {
    const targetRole = user.role === 'admin' ? 'user' : 'admin';
    if (String(currentAdmin?._id) === String(user._id) && targetRole === 'user') {
      toast.warning('Self-demotion is restricted to prevent loss of admin access.');
      return;
    }
    setRoleTarget(user);
    setNewRole(targetRole);
    setRoleReason('');
  };

  const handleConfirmRoleChange = async (e) => {
    e.preventDefault();
    if (!roleReason.trim()) {
      toast.error('A governance reason is required for administrative role changes.');
      return;
    }

    setIsUpdatingRole(true);
    try {
      await adminService.updateUserRole(roleTarget._id, {
        role: newRole,
        reason: roleReason.trim(),
      });
      toast.success(`Role for ${roleTarget.name} updated to ${newRole}`);
      setRoleTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to change role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // History Inspection
  const handleViewHistory = async (user) => {
    setHistoryTarget(user);
    setLoadingHistory(true);
    try {
      const res = await adminService.getUserHistory(user._id);
      setHistoryData(res.history || res.logs || []);
    } catch (err) {
      toast.error('Failed to load user audit history');
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      toast.info('Generating CSV export...');
      await adminService.exportUsersCsv({
        search,
        role: roleFilter,
        status: statusFilter,
      });
      toast.success('User export downloaded');
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV');
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            User Account Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Search, moderate, filter, and audit all platform accounts with verifiable security trails
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={handleExportCsv} className="btn btn-secondary btn-sm">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button type="button" onClick={() => fetchUsers()} className="btn btn-secondary btn-sm" title="Refresh list">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            <option value="all">All Roles (Admin & User)</option>
            <option value="admin">Administrators Only</option>
            <option value="user">Regular Users Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
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
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No user accounts matched the given search or filter criteria</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="artha-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Name <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('email')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Email <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('createdAt')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Registered <ArrowUpDown size={12} />
                    </span>
                  </th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrent = String(currentAdmin?._id) === String(u._id);
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: u.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                              color: u.role === 'admin' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            {isCurrent && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                        {u.email}
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-info'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isSuspended ? 'badge-danger' : 'badge-success'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {/* Status Toggle (Activate/Suspend) */}
                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(u, 'active')}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--success)' }}
                              title="Activate account"
                            >
                              <UserCheck size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => handleOpenStatusModal(u, 'suspended')}
                              className="btn btn-ghost btn-sm"
                              style={{ color: isCurrent ? 'var(--text-muted)' : 'var(--danger)' }}
                              title={isCurrent ? 'Cannot suspend own account' : 'Suspend account'}
                            >
                              <UserX size={16} />
                            </button>
                          )}

                          {/* Role Toggle */}
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleOpenRoleModal(u)}
                            className="btn btn-ghost btn-sm"
                            title={isCurrent ? 'Self-demotion restricted' : `Change role to ${u.role === 'admin' ? 'user' : 'admin'}`}
                          >
                            <Shield size={16} color="var(--brand-primary)" />
                          </button>

                          {/* History */}
                          <button
                            type="button"
                            onClick={() => handleViewHistory(u)}
                            className="btn btn-ghost btn-sm"
                            title="View moderation history"
                          >
                            <History size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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
              Total {pagination.total} accounts • Page {page} of {pagination.totalPages}
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

      {/* Account Status Confirmation Modal */}
      <Modal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title={`${newStatus === 'active' ? 'Activate' : 'Suspend'} Account`}
        maxWidth="460px"
      >
        <form onSubmit={handleConfirmStatusChange}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            You are about to change the status of <strong>{statusTarget?.name}</strong> ({statusTarget?.email}) to{' '}
            <strong style={{ color: newStatus === 'active' ? 'var(--success)' : 'var(--danger)' }}>
              {newStatus.toUpperCase()}
            </strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Reason for Action (Required for Audit Trail)</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Terms of service violation, user requested reactivation, administrative review"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setStatusTarget(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingStatus}
              className={`btn ${newStatus === 'active' ? 'btn-primary' : 'btn-danger'}`}
            >
              {isUpdatingStatus ? 'Updating...' : `Confirm ${newStatus === 'active' ? 'Activation' : 'Suspension'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Role Change Confirmation Modal */}
      <Modal
        isOpen={Boolean(roleTarget)}
        onClose={() => setRoleTarget(null)}
        title="Modify Administrator Role"
        maxWidth="460px"
      >
        <form onSubmit={handleConfirmRoleChange}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Change role for <strong>{roleTarget?.name}</strong> from <code>{roleTarget?.role}</code> to{' '}
            <code style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{newRole}</code>.
          </p>

          <div className="form-group">
            <label className="form-label">Governance Justification (Required)</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Assigned to administrative duty, demoted following audit review"
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setRoleTarget(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isUpdatingRole} className="btn btn-primary">
              {isUpdatingRole ? 'Updating...' : 'Confirm Role Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Account History Inspection Modal */}
      <Modal
        isOpen={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title={`Audit History: ${historyTarget?.name || 'Account'}`}
        maxWidth="600px"
      >
        {loadingHistory ? (
          <div style={{ padding: '1rem 0' }}>
            <Skeleton height="24px" style={{ marginBottom: '8px' }} />
            <Skeleton height="24px" style={{ marginBottom: '8px' }} />
            <Skeleton height="24px" />
          </div>
        ) : historyData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <p>No historical moderation or status records for this account.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
            {historyData.map((item, idx) => (
              <div
                key={item._id || idx}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.action || item.type || 'Moderation Event'}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(item.createdAt || item.timestamp).toLocaleString()}
                  </span>
                </div>
                {item.details?.reason && (
                  <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Reason: <em>"{item.details.reason}"</em>
                  </p>
                )}
                {item.details?.previousStatus && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Status shifted: {item.details.previousStatus} → {item.details.newStatus}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
