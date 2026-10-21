import api from './api';

export const adminService = {
  // Admin dashboard metrics & charts
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  // User management with search, filter, pagination, sorting
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    const searchTerm = params.search || params.q;
    if (searchTerm) query.set('q', searchTerm);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    const order = params.sortOrder || params.order;
    if (order) query.set('order', order);

    const queryString = query.toString();
    const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
    const res = await api.get(url);
    return res.data;
  },

  // User status/moderation history
  async getUserHistory(userId) {
    const res = await api.get(`/admin/users/${userId}/history`);
    return res.data;
  },

  // Update user account status (active / suspended) with required reason
  async updateUserStatus(userId, { status, reason }) {
    const res = await api.patch(`/admin/users/${userId}/status`, {
      status,
      reason,
    });
    return res.data;
  },

  // Update user role (user / admin) with safeguard confirmation and reason
  async updateUserRole(userId, { role, reason }) {
    const res = await api.patch(`/admin/users/${userId}/role`, {
      role,
      reason,
    });
    return res.data;
  },

  // Export authorized metadata to CSV
  async exportUsersCsv(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);

    const queryString = query.toString();
    const url = `/admin/users/export${queryString ? `?${queryString}` : ''}`;
    const blob = await api.get(url);

    // Trigger browser download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `artha-users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // System monitoring & infrastructure health
  async getSystemHealth() {
    const res = await api.get('/admin/system-health');
    return res.data;
  },

  // Audit logs with search, categories, and pagination
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.outcome) query.set('outcome', params.outcome);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const queryString = query.toString();
    const url = `/admin/audit-logs${queryString ? `?${queryString}` : ''}`;
    const res = await api.get(url);
    return res.data;
  },

  // Dataset management & synthetic demo data
  async getDatasetStats() {
    const res = await api.get('/admin/dataset/stats');
    return res.data;
  },

  async seedDataset(options = {}) {
    const res = await api.post('/admin/dataset/seed', options);
    return res.data;
  },

  async clearDemoDataset() {
    const res = await api.del('/admin/dataset/demo');
    return res.data;
  },
};

export default adminService;
