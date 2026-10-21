/**
 * Admin Controller: HTTP handlers for administrative endpoints.
 * All handlers are protected by authenticate and requireAdmin middleware.
 */
const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');

function extractMeta(req) {
  return {
    ip: req.ip || req.connection.remoteAddress || '',
    userAgent: req.get('user-agent') || '',
    reason: req.body && req.body.reason ? String(req.body.reason).trim() : '',
  };
}

/** GET /api/admin/dashboard */
exports.getDashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard();
  res.status(200).json({ success: true, data });
});

/** GET /api/admin/users */
exports.getUsers = asyncHandler(async (req, res) => {
  const data = await adminService.getUsers(req.query);
  res.status(200).json({ success: true, data });
});

/** PATCH /api/admin/users/:id/status */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const data = await adminService.updateUserStatus(req.user, req.params.id, status, extractMeta(req));
  res.status(200).json({
    success: true,
    data: { user: data },
    message: `User status successfully updated to ${data.status}`,
  });
});

/** PATCH /api/admin/users/:id/role */
exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  const data = await adminService.updateUserRole(req.user, req.params.id, role, extractMeta(req));
  res.status(200).json({
    success: true,
    data: { user: data },
    message: `User role successfully updated to ${data.role}`,
  });
});

/** GET /api/admin/analytics */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const data = await adminService.getAnalytics();
  res.status(200).json({ success: true, data });
});

/** GET /api/admin/system-health */
exports.getSystemHealth = asyncHandler(async (req, res) => {
  const data = await adminService.getSystemHealth();
  res.status(200).json({ success: true, data });
});

/** GET /api/admin/audit-logs */
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const data = await adminService.getAuditLogs(req.query);
  res.status(200).json({ success: true, data });
});

/** GET /api/admin/users/:id/history */
exports.getUserHistory = asyncHandler(async (req, res) => {
  const data = await adminService.getUserHistory(req.params.id);
  res.status(200).json({ success: true, data });
});

/** GET /api/admin/users/export */
exports.exportUsers = asyncHandler(async (req, res) => {
  const csv = await adminService.exportUsersCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="artha-users-export.csv"');
  res.status(200).send(csv);
});

/** GET /api/admin/dataset/stats */
exports.getDatasetStats = asyncHandler(async (req, res) => {
  const data = await adminService.getDatasetStats();
  res.status(200).json({ success: true, data });
});

/** POST /api/admin/dataset/seed */
exports.seedDataset = asyncHandler(async (req, res) => {
  const data = await adminService.seedDataset(req.user, extractMeta(req));
  res.status(200).json({
    success: true,
    data,
    message: `Synthetic dataset successfully seeded: ${data.usersCount} users, ${data.transactionsCount} transactions.`,
  });
});

/** DELETE /api/admin/dataset/demo */
exports.clearDemoDataset = asyncHandler(async (req, res) => {
  const data = await adminService.clearDemoDataset(req.user, extractMeta(req));
  res.status(200).json({
    success: true,
    data,
    message: `Demo records removed: ${data.removedUsers} users, ${data.removedTransactions} transactions.`,
  });
});

