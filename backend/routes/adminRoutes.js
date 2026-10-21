/**
 * Admin API Routes.
 * All routes mounted here require both authentication and administrator privileges.
 */
const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Strict security: all endpoints require valid authentication AND role === 'admin'
router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/users/export', adminController.exportUsers);
router.get('/users', adminController.getUsers);
router.get('/users/:id/history', adminController.getUserHistory);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/analytics', adminController.getAnalytics);
router.get('/system-health', adminController.getSystemHealth);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/dataset/stats', adminController.getDatasetStats);
router.post('/dataset/seed', adminController.seedDataset);
router.delete('/dataset/demo', adminController.clearDemoDataset);

module.exports = router;

