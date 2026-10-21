/**
 * Admin Service: Core business logic for system administration and governance.
 *
 * PRIVACY MANDATE:
 * Administrators must NEVER access individual users' private financial data (transactions,
 * budgets, goals, regression outputs, alerts, or account balances).
 * Only safe account metadata and privacy-preserving aggregate application metrics are provided.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const pythonBridge = require('./pythonBridge');
const AppError = require('../utils/AppError');

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function checkPython() {
  try {
    const res = await pythonBridge.runPython('env_check');
    return {
      available: true,
      version: res.python || null,
      libraries: {
        numpy: res.numpy || null,
        pandas: res.pandas || null,
      },
    };
  } catch (err) {
    return {
      available: false,
      version: null,
      libraries: {},
      error: err.message,
    };
  }
}

/**
 * Returns overall dashboard metadata, aggregate counts, registration trend, and health preview.
 */
async function getDashboard() {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    adminUsers,
    regularUsers,
    totalTransactions,
    totalBudgets,
    totalGoals,
    totalAuditLogs,
    recentAuditLogs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'user' }),
    Transaction.countDocuments(),
    Budget.countDocuments(),
    Goal.countDocuments(),
    AuditLog.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  // Compute 6-month registration trends
  const now = new Date();
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const registrationAggregation = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const registrationMap = new Map();
  registrationAggregation.forEach((item) => {
    const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
    registrationMap.set(key, item.count);
  });

  const registrationTrends = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    registrationTrends.push({
      month: key,
      label: d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      count: registrationMap.get(key) || 0,
    });
  }

  // Quick DB ping test
  let dbPingMs = null;
  let dbStatus = 'disconnected';
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbPingMs = Date.now() - start;
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = 'error';
    }
  }

  // Python status
  const pythonStatus = await checkPython();

  return {
    summary: {
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      regularUsers,
      totalTransactions,
      totalBudgets,
      totalGoals,
      totalAuditLogs,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      admins: adminUsers,
      regular: regularUsers,
    },
    platformActivity: {
      totalTransactions,
      totalBudgets,
      totalGoals,
      totalAuditLogs,
    },
    registrationTrends,
    systemHealth: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      database: {
        status: dbStatus,
        pingMs: dbPingMs,
      },
      python: {
        available: Boolean(pythonStatus && pythonStatus.available),
        version: pythonStatus && pythonStatus.version ? pythonStatus.version : null,
      },
    },
    recentAuditLogs,
  };
}

/**
 * Returns a paginated, filterable list of registered users.
 * STRICT PRIVACY: Returns only safe account metadata.
 */
async function getUsers({
  page = 1,
  limit = 20,
  q = '',
  search = '',
  status = 'all',
  role = 'all',
  sortBy = 'createdAt',
  order = 'desc',
  sortOrder = '',
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const filter = {};

  const queryText = (q || search || '').trim();
  if (queryText) {
    const rx = new RegExp(escapeRegex(queryText), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (role && role !== 'all') {
    filter.role = role;
  }

  const allowedSortFields = ['name', 'email', 'role', 'status', 'createdAt', 'lastLoginAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const effectiveOrder = sortOrder || order;
  const sortDirection = effectiveOrder === 'asc' ? 1 : -1;

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('_id name email role status createdAt updatedAt lastLoginAt')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
  ]);

  return {
    users,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Updates a user's account status (active | suspended).
 * Enforces self-protection: Admin cannot suspend their own account.
 */
async function updateUserStatus(adminUser, targetUserId, newStatus, meta = {}) {
  if (!['active', 'suspended'].includes(newStatus)) {
    throw AppError.badRequest('Status must be either active or suspended');
  }

  if (!mongoose.isValidObjectId(targetUserId)) {
    throw AppError.badRequest('Invalid target user ID');
  }

  if (String(adminUser._id) === String(targetUserId)) {
    throw AppError.badRequest('Administrators cannot suspend their own account');
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    throw AppError.notFound('User not found');
  }

  const previousStatus = target.status;
  if (previousStatus === newStatus) {
    return target;
  }

  target.status = newStatus;
  await target.save();

  await AuditLog.create({
    adminId: adminUser._id,
    adminEmail: adminUser.email,
    action: newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
    targetUserId: target._id,
    targetUserEmail: target.email,
    details: {
      previousStatus,
      newStatus,
      reason: meta.reason || '',
    },
    ipAddress: meta.ip || '',
    userAgent: meta.userAgent || '',
  }).catch(() => {});

  return target;
}

/**
 * Updates a user's role (user | admin).
 * Enforces self-protection and ensures at least one other active admin remains.
 */
async function updateUserRole(adminUser, targetUserId, newRole, meta = {}) {
  if (!['user', 'admin'].includes(newRole)) {
    throw AppError.badRequest('Role must be either user or admin');
  }

  if (!mongoose.isValidObjectId(targetUserId)) {
    throw AppError.badRequest('Invalid target user ID');
  }

  if (String(adminUser._id) === String(targetUserId)) {
    throw AppError.badRequest('Administrators cannot alter their own role');
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    throw AppError.notFound('User not found');
  }

  const previousRole = target.role;
  if (previousRole === newRole) {
    return target;
  }

  if (target.role === 'admin' && newRole === 'user') {
    const activeAdminCount = await User.countDocuments({
      role: 'admin',
      status: 'active',
      _id: { $ne: target._id },
    });
    if (activeAdminCount < 1) {
      throw AppError.badRequest('Cannot demote administrator: at least one other active administrator must remain');
    }
  }

  target.role = newRole;
  await target.save();

  await AuditLog.create({
    adminId: adminUser._id,
    adminEmail: adminUser.email,
    action: 'ROLE_CHANGED',
    targetUserId: target._id,
    targetUserEmail: target.email,
    details: {
      previousRole,
      newRole,
      reason: meta.reason || '',
    },
    ipAddress: meta.ip || '',
    userAgent: meta.userAgent || '',
  }).catch(() => {});

  return target;
}

/**
 * Returns privacy-preserving application analytics and aggregate charts data.
 * Zero individual financial data exposure.
 */
async function getAnalytics() {
  const [
    totalUsers,
    totalTransactions,
    totalBudgets,
    totalGoals,
    categoryPopularity,
    budgetPeriodBreakdown,
    goalStatusAggregation,
  ] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Budget.countDocuments(),
    Goal.countDocuments(),
    // Privacy-preserving: count transactions per category, NO amounts summed!
    Transaction.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    // Budget breakdown by period recurrence
    Budget.aggregate([
      { $group: { _id: '$period', count: { $sum: 1 } } },
    ]),
    // Goal status count (completed vs in progress)
    Goal.aggregate([
      {
        $group: {
          _id: {
            $cond: [{ $gte: ['$currentAmount', '$targetAmount'] }, 'completed', 'in_progress'],
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const categories = categoryPopularity.map((item) => ({
    category: item._id,
    count: item.count,
  }));

  const budgetPeriods = {
    weekly: 0,
    monthly: 0,
    yearly: 0,
  };
  budgetPeriodBreakdown.forEach((item) => {
    if (item._id && budgetPeriods[item._id] !== undefined) {
      budgetPeriods[item._id] = item.count;
    }
  });

  const goalStatuses = {
    completed: 0,
    in_progress: 0,
  };
  goalStatusAggregation.forEach((item) => {
    if (item._id && goalStatuses[item._id] !== undefined) {
      goalStatuses[item._id] = item.count;
    }
  });

  return {
    overview: {
      totalUsers,
      totalTransactions,
      totalBudgets,
      totalGoals,
      avgTransactionsPerUser: totalUsers > 0 ? Number((totalTransactions / totalUsers).toFixed(1)) : 0,
      avgBudgetsPerUser: totalUsers > 0 ? Number((totalBudgets / totalUsers).toFixed(1)) : 0,
      avgGoalsPerUser: totalUsers > 0 ? Number((totalGoals / totalUsers).toFixed(1)) : 0,
    },
    categoryPopularity: categories,
    budgetDistribution: budgetPeriods,
    goalDistribution: goalStatuses,
  };
}

/**
 * Returns comprehensive live diagnostics for backend, database, and Python environment.
 */
async function getSystemHealth() {
  const startTime = Date.now();
  let dbPingMs = null;
  let dbStatus = 'disconnected';

  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping();
      dbPingMs = Date.now() - startTime;
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
    }
  }

  const memory = process.memoryUsage();
  const pythonCheck = await checkPython();

  return {
    server: {
      status: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        rssBytes: memory.rss,
        heapTotalBytes: memory.heapTotal,
        heapUsedBytes: memory.heapUsed,
        externalBytes: memory.external,
      },
    },
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'unknown',
      readyState: mongoose.connection.readyState,
      pingMs: dbPingMs,
    },
    pythonAnalysis: {
      available: Boolean(pythonCheck && pythonCheck.available),
      version: pythonCheck && pythonCheck.version ? pythonCheck.version : null,
      libraries: pythonCheck && pythonCheck.libraries ? pythonCheck.libraries : {},
      error: pythonCheck && pythonCheck.error ? pythonCheck.error : null,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Returns paginated, searchable administrative audit logs.
 */
async function getAuditLogs({
  page = 1,
  limit = 20,
  action = 'all',
  search = '',
  from,
  to,
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const filter = {};

  if (action && action !== 'all') {
    filter.action = action;
  }

  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { adminEmail: rx },
      { targetUserEmail: rx },
      { action: rx },
    ];
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate)) filter.createdAt.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate)) filter.createdAt.$lte = toDate;
    }
  }

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Returns account creation and moderation history for a specific user.
 */
async function getUserHistory(targetUserId) {
  if (!mongoose.isValidObjectId(targetUserId)) {
    throw AppError.badRequest('Invalid user ID');
  }

  const user = await User.findById(targetUserId).select('_id name email role status createdAt lastLoginAt').lean();
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const history = await AuditLog.find({ targetUserId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    user,
    history,
  };
}

/**
 * Generates an authorized, non-sensitive CSV export of registered user accounts.
 * STRICT PRIVACY: Omits passwords, hashes, transactions, budgets, goals, and financial telemetry.
 */
async function exportUsersCsv() {
  const users = await User.find()
    .select('_id name email role status createdAt lastLoginAt')
    .sort({ createdAt: -1 })
    .lean();

  const escapeCsv = (str) => {
    if (str == null) return '';
    const text = String(str);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Registered At', 'Last Login At'];
  const rows = users.map((u) => [
    escapeCsv(u._id),
    escapeCsv(u.name),
    escapeCsv(u.email),
    escapeCsv(u.role),
    escapeCsv(u.status),
    escapeCsv(u.createdAt ? new Date(u.createdAt).toISOString() : ''),
    escapeCsv(u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : 'Never'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Returns statistics about synthetic demonstration data vs total records.
 */
async function getDatasetStats() {
  const demoEmailRegex = /@example\.com$/i;

  const [
    totalUsers,
    demoUsers,
    activeDemoUsers,
    suspendedDemoUsers,
    totalTransactions,
    totalBudgets,
    totalGoals,
    lastSeedLog,
    lastClearLog,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ email: demoEmailRegex }),
    User.countDocuments({ email: demoEmailRegex, status: 'active' }),
    User.countDocuments({ email: demoEmailRegex, status: 'suspended' }),
    Transaction.countDocuments(),
    Budget.countDocuments(),
    Goal.countDocuments(),
    AuditLog.findOne({ action: 'DATASET_SEEDED' }).sort({ createdAt: -1 }).lean(),
    AuditLog.findOne({ action: 'DATASET_CLEARED' }).sort({ createdAt: -1 }).lean(),
  ]);

  // Demo user IDs to calculate demo-specific child entities
  const demoUserDocs = await User.find({ email: demoEmailRegex }).select('_id').lean();
  const demoUserIds = demoUserDocs.map((u) => u._id);

  let demoTransactions = 0;
  let demoBudgets = 0;
  let demoGoals = 0;

  if (demoUserIds.length > 0) {
    [demoTransactions, demoBudgets, demoGoals] = await Promise.all([
      Transaction.countDocuments({ userId: { $in: demoUserIds } }),
      Budget.countDocuments({ userId: { $in: demoUserIds } }),
      Goal.countDocuments({ userId: { $in: demoUserIds } }),
    ]);
  }

  return {
    users: {
      total: totalUsers,
      demo: demoUsers,
      demoActive: activeDemoUsers,
      demoSuspended: suspendedDemoUsers,
      real: totalUsers - demoUsers,
    },
    transactions: {
      total: totalTransactions,
      demo: demoTransactions,
      real: totalTransactions - demoTransactions,
    },
    budgets: {
      total: totalBudgets,
      demo: demoBudgets,
      real: totalBudgets - demoBudgets,
    },
    goals: {
      total: totalGoals,
      demo: demoGoals,
      real: totalGoals - demoGoals,
    },
    lastSeed: lastSeedLog ? {
      timestamp: lastSeedLog.createdAt,
      adminEmail: lastSeedLog.adminEmail,
      details: lastSeedLog.details,
    } : null,
    lastClear: lastClearLog ? {
      timestamp: lastClearLog.createdAt,
      adminEmail: lastClearLog.adminEmail,
      details: lastClearLog.details,
    } : null,
  };
}

/**
 * Triggers synthetic dataset generation via the admin interface.
 */
async function seedDataset(adminUser, meta = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !process.env.ALLOW_SEED_IN_PRODUCTION) {
    throw AppError.forbidden('Seeding synthetic datasets is forbidden in production environment.');
  }

  const { seedDatabase } = require('../seed/seedData');
  const result = await seedDatabase({ quiet: true });

  await AuditLog.create({
    adminId: adminUser._id,
    adminEmail: adminUser.email,
    action: 'DATASET_SEEDED',
    details: {
      usersCount: result.usersCount,
      transactionsCount: result.transactionsCount,
      budgetsCount: result.budgetsCount,
      goalsCount: result.goalsCount,
      reason: meta.reason || 'Admin panel synthetic dataset seed',
    },
    ipAddress: meta.ip || '',
    userAgent: meta.userAgent || '',
  }).catch(() => {});

  return result;
}

/**
 * Safely removes demo users (@example.com) and their child records without affecting real users or admins.
 */
async function clearDemoDataset(adminUser, meta = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !process.env.ALLOW_SEED_IN_PRODUCTION) {
    throw AppError.forbidden('Modifying dataset is forbidden in production environment.');
  }

  // STRICT ADMIN IMMUNITY: Admins can NEVER be deleted by dataset clearing
  const demoUsers = await User.find({ email: /@example\.com$/i, role: { $ne: 'admin' } }).select('_id').lean();
  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length === 0) {
    return {
      removedUsers: 0,
      removedTransactions: 0,
      removedBudgets: 0,
      removedGoals: 0,
    };
  }

  const [txRes, bgRes, glRes, uRes] = await Promise.all([
    Transaction.deleteMany({ userId: { $in: demoUserIds } }),
    Budget.deleteMany({ userId: { $in: demoUserIds } }),
    Goal.deleteMany({ userId: { $in: demoUserIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);

  const removedCounts = {
    removedUsers: uRes.deletedCount,
    removedTransactions: txRes.deletedCount,
    removedBudgets: bgRes.deletedCount,
    removedGoals: glRes.deletedCount,
  };

  await AuditLog.create({
    adminId: adminUser._id,
    adminEmail: adminUser.email,
    action: 'DATASET_CLEARED',
    details: {
      ...removedCounts,
      reason: meta.reason || 'Admin panel demo dataset removal',
    },
    ipAddress: meta.ip || '',
    userAgent: meta.userAgent || '',
  }).catch(() => {});

  return removedCounts;
}

module.exports = {
  getDashboard,
  getUsers,
  getUserHistory,
  exportUsersCsv,
  updateUserStatus,
  updateUserRole,
  getAnalytics,
  getSystemHealth,
  getAuditLogs,
  getDatasetStats,
  seedDataset,
  clearDemoDataset,
};

