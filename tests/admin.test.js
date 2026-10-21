/**
 * Admin Panel & Security Suite:
 * - Role-Based Access Control (RBAC): requireAdmin and 401/403 verification
 * - Strict Privacy Requirement: Zero access to individual users' financial data
 * - Public Registration Protection: Mass-assignment of role/status is prevented
 * - User Suspension Security: Suspended users are locked out from login and active tokens
 * - Admin Operations: Dashboard, User moderation, Analytics, System Health, Audit Logging
 * - Self-Protection: Admin cannot suspend self or demote sole administrator
 */
const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../backend/app');
const User = require('../backend/models/User');
const AuditLog = require('../backend/models/AuditLog');
const Transaction = require('../backend/models/Transaction');
const Budget = require('../backend/models/Budget');
const Goal = require('../backend/models/Goal');
const { connectTestDb, clearTestDb, closeTestDb } = require('./helpers/testDb');
const { registerUser, client } = require('./helpers/authHelper');
const { signToken } = require('../backend/services/authService');

const app = createApp();

beforeAll(connectTestDb, 180000);
afterAll(closeTestDb, 15000);
beforeEach(clearTestDb);

async function createAdminUser(name = 'Admin User', email = 'admin@example.com') {
  const user = await User.create({
    name,
    email,
    passwordHash: 'dummyhash123',
    role: 'admin',
    status: 'active',
  });
  const token = signToken(user._id);
  return { id: user._id, email, token, user };
}

describe('Admin Panel API: Authentication & Authorization (RBAC)', () => {
  test('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const endpoints = [
      ['get', '/api/admin/dashboard'],
      ['get', '/api/admin/users'],
      ['get', '/api/admin/analytics'],
      ['get', '/api/admin/system-health'],
      ['get', '/api/admin/audit-logs'],
    ];

    for (const [method, url] of endpoints) {
      const res = await request(app)[method](url);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    }
  });

  test('rejects authenticated regular users (role: user) with 403 Forbidden', async () => {
    const user = await registerUser(app, 'Normal User');
    const c = client(app, user.token);

    const forbiddenCalls = [
      c.get('/api/admin/dashboard'),
      c.get('/api/admin/users'),
      c.patch(`/api/admin/users/${user.id}/status`, { status: 'suspended' }),
      c.patch(`/api/admin/users/${user.id}/role`, { role: 'admin' }),
      c.get('/api/admin/analytics'),
      c.get('/api/admin/system-health'),
      c.get('/api/admin/audit-logs'),
    ];

    for (const promise of forbiddenCalls) {
      const res = await promise;
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toMatch(/Administrator privileges required/i);
    }
  });
});

describe('Admin Panel API: Public Registration & Mass-Assignment Protection', () => {
  test('public registration strictly forces role: user and status: active', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker Attempt',
        email: 'hacker@example.com',
        password: 'Passw0rdSecured1',
        role: 'admin',
        status: 'suspended',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.status).toBe('active');

    // Confirm in database directly
    const stored = await User.findById(res.body.data.user._id);
    expect(stored.role).toBe('user');
    expect(stored.status).toBe('active');
  });
});

describe('Admin Panel API: Account Suspension Enforcement', () => {
  test('suspended user cannot log in and receives 403 Forbidden', async () => {
    const email = 'suspended@example.com';
    const password = 'Passw0rdLogin1';
    await request(app).post('/api/auth/register').send({ name: 'To Suspend', email, password });

    // Suspend user in DB
    await User.updateOne({ email }, { status: 'suspended' });

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toMatch(/suspended/i);
  });

  test('active token is rejected immediately once user is suspended', async () => {
    const user = await registerUser(app, 'Active Token User');
    const c = client(app, user.token);

    // Initial call succeeds
    const check1 = await c.get('/api/transactions');
    expect(check1.status).toBe(200);

    // Suspend user
    await User.updateOne({ _id: user.id }, { status: 'suspended' });

    // Subsequent request with the same valid JWT token is rejected
    const check2 = await c.get('/api/transactions');
    expect(check2.status).toBe(403);
    expect(check2.body.message).toMatch(/suspended/i);
  });
});

describe('Strict Privacy Requirement: Administrator Isolation from Financial Data', () => {
  test('administrators CANNOT access other users transactions, budgets, goals, or analytics', async () => {
    const admin = await createAdminUser('SysAdmin', 'sysadmin@example.com');
    const regular = await registerUser(app, 'Private User');

    const regClient = client(app, regular.token);
    const adminClient = client(app, admin.token);

    // Regular user creates private financial data
    const txRes = await regClient.post('/api/transactions', {
      type: 'expense',
      category: 'Food',
      amount: 500,
      date: '2026-08-15',
      description: 'Private confidential grocery',
    });
    expect(txRes.status).toBe(201);
    const txId = txRes.body.data.transaction._id;

    const bgRes = await regClient.post('/api/budgets', {
      category: 'Food',
      amount: 5000,
      period: 'monthly',
    });
    expect(bgRes.status).toBe(201);
    const bgId = bgRes.body.data.budget._id;

    const glRes = await regClient.post('/api/goals', {
      name: 'Private Emergency Fund',
      targetAmount: 20000,
    });
    expect(glRes.status).toBe(201);
    const glId = glRes.body.data.goal._id;

    // 1. Admin querying transaction list sees ZERO transactions (scoped to admin, not regular user)
    const adminTxList = await adminClient.get('/api/transactions');
    expect(adminTxList.status).toBe(200);
    expect(adminTxList.body.data.items).toHaveLength(0);

    // 2. Admin attempting to view regular user's transaction by ID receives 404 Not Found
    const adminTxGet = await adminClient.get(`/api/transactions/${txId}`);
    expect(adminTxGet.status).toBe(404);

    // 3. Admin attempting to view regular user's budget receives 404
    const adminBgGet = await adminClient.get(`/api/budgets/${bgId}`);
    expect(adminBgGet.status).toBe(404);

    // 4. Admin attempting to view regular user's goal receives 404
    const adminGlGet = await adminClient.get(`/api/goals/${glId}`);
    expect(adminGlGet.status).toBe(404);

    // 5. Admin calling /api/admin/users gets safe metadata ONLY (no financial records, no balances)
    const adminUsersRes = await adminClient.get('/api/admin/users');
    expect(adminUsersRes.status).toBe(200);
    const targetUserInList = adminUsersRes.body.data.users.find((u) => u.email === regular.email);
    expect(targetUserInList).toBeDefined();
    expect(targetUserInList.name).toBe('Private User');
    expect(targetUserInList.email).toBe(regular.email);
    // Explicit assertion: No financial properties leaked
    expect(targetUserInList.transactions).toBeUndefined();
    expect(targetUserInList.balance).toBeUndefined();
    expect(targetUserInList.budgets).toBeUndefined();
    expect(targetUserInList.goals).toBeUndefined();
  });
});

describe('Admin Panel Operations: Dashboard, Moderation, Analytics, Health & Audit Logs', () => {
  test('admin dashboard returns platform activity counts, registration trends, and health', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    await registerUser(app, 'User A');
    await registerUser(app, 'User B');

    const res = await adminClient.get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.users.total).toBe(3); // 1 admin + 2 users
    expect(data.users.admins).toBe(1);
    expect(data.users.regular).toBe(2);
    expect(data.platformActivity).toHaveProperty('totalTransactions');
    expect(data.platformActivity).toHaveProperty('totalBudgets');
    expect(data.platformActivity).toHaveProperty('totalGoals');
    expect(Array.isArray(data.registrationTrends)).toBe(true);
    expect(data.systemHealth).toHaveProperty('nodeVersion');
    expect(data.systemHealth.database.status).toBe('connected');
  });

  test('admin can search and filter users', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    const u1 = await registerUser(app, 'Alice Johnson');
    const u2 = await registerUser(app, 'Bob Smith');
    await User.updateOne({ _id: u2.id }, { status: 'suspended' });

    // Search by query 'Alice'
    const searchRes = await adminClient.get('/api/admin/users?q=Alice');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.users).toHaveLength(1);
    expect(searchRes.body.data.users[0].name).toBe('Alice Johnson');

    // Filter by status 'suspended'
    const suspendedRes = await adminClient.get('/api/admin/users?status=suspended');
    expect(suspendedRes.status).toBe(200);
    expect(suspendedRes.body.data.users).toHaveLength(1);
    expect(suspendedRes.body.data.users[0].name).toBe('Bob Smith');

    // Filter by role 'admin'
    const adminListRes = await adminClient.get('/api/admin/users?role=admin');
    expect(adminListRes.status).toBe(200);
    expect(adminListRes.body.data.users).toHaveLength(1);
    expect(adminListRes.body.data.users[0].email).toBe(admin.email);
  });

  test('admin can suspend and reactivate users, producing audit log entries', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);
    const target = await registerUser(app, 'To Moderated');

    // 1. Suspend
    const suspendRes = await adminClient.patch(`/api/admin/users/${target.id}/status`, {
      status: 'suspended',
      reason: 'Spam activity',
    });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.user.status).toBe('suspended');

    const log1 = await AuditLog.findOne({ targetUserId: target.id, action: 'USER_SUSPENDED' });
    expect(log1).toBeDefined();
    expect(log1.adminEmail).toBe(admin.email);
    expect(log1.details.reason).toBe('Spam activity');

    // 2. Reactivate
    const activateRes = await adminClient.patch(`/api/admin/users/${target.id}/status`, {
      status: 'active',
      reason: 'Appealed successfully',
    });
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.user.status).toBe('active');

    const log2 = await AuditLog.findOne({ targetUserId: target.id, action: 'USER_ACTIVATED' });
    expect(log2).toBeDefined();
    expect(log2.details.reason).toBe('Appealed successfully');
  });

  test('admin can promote and demote user roles', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);
    const target = await registerUser(app, 'Future Admin');

    // Promote
    const promoteRes = await adminClient.patch(`/api/admin/users/${target.id}/role`, {
      role: 'admin',
      reason: 'Appointed as co-admin',
    });
    expect(promoteRes.status).toBe(200);
    expect(promoteRes.body.data.user.role).toBe('admin');

    const log = await AuditLog.findOne({ targetUserId: target.id, action: 'ROLE_CHANGED' });
    expect(log).toBeDefined();
    expect(log.details.newRole).toBe('admin');

    // Demote
    const demoteRes = await adminClient.patch(`/api/admin/users/${target.id}/role`, {
      role: 'user',
      reason: 'Role expired',
    });
    expect(demoteRes.status).toBe(200);
    expect(demoteRes.body.data.user.role).toBe('user');
  });

  test('self-protection safeguards prevent self-suspension and sole admin demotion', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    // Cannot suspend self
    const selfSuspendRes = await adminClient.patch(`/api/admin/users/${admin.id}/status`, {
      status: 'suspended',
    });
    expect(selfSuspendRes.status).toBe(400);
    expect(selfSuspendRes.body.message).toMatch(/cannot suspend their own account/i);

    // Cannot alter own role
    const selfRoleRes = await adminClient.patch(`/api/admin/users/${admin.id}/role`, {
      role: 'user',
    });
    expect(selfRoleRes.status).toBe(400);
    expect(selfRoleRes.body.message).toMatch(/cannot alter their own role/i);
  });

  test('admin analytics endpoint returns privacy-preserving aggregates and category popularity', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    const user = await registerUser(app, 'Data Contributor');
    const uClient = client(app, user.token);

    // Add multiple transactions across categories
    await uClient.post('/api/transactions', { type: 'expense', category: 'Food', amount: 150, date: '2026-08-01' });
    await uClient.post('/api/transactions', { type: 'expense', category: 'Food', amount: 200, date: '2026-08-02' });
    await uClient.post('/api/transactions', { type: 'expense', category: 'Transport', amount: 80, date: '2026-08-03' });
    await uClient.post('/api/budgets', { category: 'Food', amount: 5000, period: 'monthly' });
    await uClient.post('/api/goals', { name: 'Trip', targetAmount: 10000 });

    const res = await adminClient.get('/api/admin/analytics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { overview, categoryPopularity, budgetDistribution, goalDistribution } = res.body.data;
    expect(overview.totalTransactions).toBe(3);
    expect(overview.totalBudgets).toBe(1);
    expect(overview.totalGoals).toBe(1);

    // Category popularity shows count = 2 for Food, count = 1 for Transport
    const foodCat = categoryPopularity.find((c) => c.category === 'Food');
    expect(foodCat).toBeDefined();
    expect(foodCat.count).toBe(2);

    expect(budgetDistribution.monthly).toBe(1);
    expect(goalDistribution.in_progress).toBe(1);
  });

  test('system health endpoint reports operational metrics and ping latency', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    const res = await adminClient.get('/api/admin/system-health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { server, database, pythonAnalysis } = res.body.data;
    expect(server.status).toBe('healthy');
    expect(typeof server.uptimeSeconds).toBe('number');
    expect(typeof server.memory.heapUsedBytes).toBe('number');
    expect(database.status).toBe('connected');
    expect(typeof database.pingMs).toBe('number');
    expect(pythonAnalysis).toHaveProperty('available');
  });

  test('audit logs endpoint supports pagination and filtering by action', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    // Create 2 audit log records
    await AuditLog.create({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'USER_SUSPENDED',
      targetUserEmail: 'u1@example.com',
      details: { reason: 'Test 1' },
    });
    await AuditLog.create({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ROLE_CHANGED',
      targetUserEmail: 'u2@example.com',
      details: { reason: 'Test 2' },
    });

    // Fetch all logs
    const allLogs = await adminClient.get('/api/admin/audit-logs');
    expect(allLogs.status).toBe(200);
    expect(allLogs.body.data.logs.length).toBeGreaterThanOrEqual(2);

    // Filter by action 'USER_SUSPENDED'
    const filteredLogs = await adminClient.get('/api/admin/audit-logs?action=USER_SUSPENDED');
    expect(filteredLogs.status).toBe(200);
    expect(filteredLogs.body.data.logs.every((l) => l.action === 'USER_SUSPENDED')).toBe(true);
  });
});

describe('Admin Panel API: User History, CSV Export & Dataset Management', () => {
  test('GET /api/admin/users/:id/history returns audit events for target user', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);
    const targetUser = await registerUser(app, 'Target User');

    await AuditLog.create({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'USER_SUSPENDED',
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      details: { reason: 'Violation of policy' },
    });

    const res = await adminClient.get(`/api/admin/users/${targetUser.id}/history`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user._id).toBe(targetUser.id);
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.history[0].action).toBe('USER_SUSPENDED');
  });

  test('GET /api/admin/users/export returns CSV file with safe headers', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);
    await registerUser(app, 'Test Export User');

    const res = await adminClient.get('/api/admin/users/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('User ID,Name,Email,Role,Status,Registered At,Last Login At');
    expect(res.text).toContain('Test Export User');
    // Ensure no password hashes or sensitive fields exist in CSV
    expect(res.text).not.toContain('passwordHash');
    expect(res.text).not.toContain('dummyhash');
  });

  test('GET /api/admin/dataset/stats returns demonstration dataset counts', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    const res = await adminClient.get('/api/admin/dataset/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.transactions).toBeDefined();
    expect(res.body.data.budgets).toBeDefined();
    expect(res.body.data.goals).toBeDefined();
  });

  test('POST /api/admin/dataset/seed seeds demo data and creates audit log', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    const res = await adminClient.post('/api/admin/dataset/seed', { reason: 'Automated test seed' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.usersCount).toBe(50);
    expect(res.body.data.transactionsCount).toBeGreaterThan(500);

    // Verify audit log entry was created
    const log = await AuditLog.findOne({ action: 'DATASET_SEEDED' });
    expect(log).not.toBeNull();
    expect(log.details.usersCount).toBe(50);
  });

  test('DELETE /api/admin/dataset/demo removes demo users and preserves admin', async () => {
    const admin = await createAdminUser();
    const adminClient = client(app, admin.token);

    // Clean demo records
    const res = await adminClient.delete('/api/admin/dataset/demo', { reason: 'Automated test cleanup' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify admin is still intact
    const adminCheck = await User.findById(admin.id);
    expect(adminCheck).not.toBeNull();
    expect(adminCheck.email).toBe(admin.email);
  });
});

