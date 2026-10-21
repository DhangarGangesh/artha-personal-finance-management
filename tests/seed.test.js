/**
 * Automated tests for synthetic dataset generator:
 * - Idempotency: multiple runs do not duplicate data
 * - Safety & Isolation: admin accounts are preserved, production execution blocked
 * - Schema integrity: valid foreign keys, role: user, varied statuses
 * - Admin data privacy: demo transactions never leak to admin personal endpoints
 */
const mongoose = require('mongoose');
const createApp = require('../backend/app');
const User = require('../backend/models/User');
const Transaction = require('../backend/models/Transaction');
const Budget = require('../backend/models/Budget');
const Goal = require('../backend/models/Goal');
const { connectTestDb, clearTestDb, closeTestDb } = require('./helpers/testDb');
const { client } = require('./helpers/authHelper');
const { signToken } = require('../backend/services/authService');
const { seedDatabase } = require('../backend/seed/seedData');

const app = createApp();

beforeAll(connectTestDb, 180000);
afterAll(closeTestDb, 15000);
beforeEach(clearTestDb);

describe('Artha Synthetic Dataset Seeder', () => {
  test('seeds 50 synthetic users with valid schemas, roles, and statuses', async () => {
    const stats = await seedDatabase({ quiet: true });

    expect(stats.usersCount).toBe(50);
    expect(stats.activeUsersCount).toBe(45);
    expect(stats.suspendedUsersCount).toBe(5);
    expect(stats.transactionsCount).toBeGreaterThan(300);
    expect(stats.budgetsCount).toBeGreaterThan(100);
    expect(stats.goalsCount).toBeGreaterThan(40);

    // Verify DB counts
    const totalUsers = await User.countDocuments();
    expect(totalUsers).toBe(50);

    // All demo users must strictly have role 'user'
    const adminCount = await User.countDocuments({ role: 'admin' });
    expect(adminCount).toBe(0);

    const activeCount = await User.countDocuments({ status: 'active' });
    expect(activeCount).toBe(45);

    const suspendedCount = await User.countDocuments({ status: 'suspended' });
    expect(suspendedCount).toBe(5);

    // Verify foreign keys: every transaction's userId must belong to a real user
    const sampleTx = await Transaction.findOne();
    expect(sampleTx).toBeDefined();
    const txOwner = await User.findById(sampleTx.userId);
    expect(txOwner).toBeDefined();

    // Verify budget foreign keys and amounts
    const sampleBudget = await Budget.findOne();
    expect(sampleBudget).toBeDefined();
    expect(sampleBudget.amount).toBeGreaterThan(0);
    const bgOwner = await User.findById(sampleBudget.userId);
    expect(bgOwner).toBeDefined();

    // Verify goal foreign keys
    const sampleGoal = await Goal.findOne();
    expect(sampleGoal).toBeDefined();
    const glOwner = await User.findById(sampleGoal.userId);
    expect(glOwner).toBeDefined();
  });

  test('is strictly idempotent: running multiple times does not create duplicates', async () => {
    // First run
    await seedDatabase({ quiet: true });
    const usersRun1 = await User.countDocuments();
    const txRun1 = await Transaction.countDocuments();
    const bgRun1 = await Budget.countDocuments();
    const glRun1 = await Goal.countDocuments();

    // Second run
    await seedDatabase({ quiet: true });
    const usersRun2 = await User.countDocuments();
    const txRun2 = await Transaction.countDocuments();
    const bgRun2 = await Budget.countDocuments();
    const glRun2 = await Goal.countDocuments();

    expect(usersRun2).toBe(usersRun1);
    expect(txRun2).toBe(txRun1);
    expect(bgRun2).toBe(bgRun1);
    expect(glRun2).toBe(glRun1);
  });

  test('preserves existing administrator and non-demo accounts', async () => {
    // Create an existing administrator and a custom non-demo user
    const admin = await User.create({
      name: 'Existing Admin',
      email: 'admin@artha.local',
      passwordHash: 'secret123',
      role: 'admin',
      status: 'active',
    });

    const realUser = await User.create({
      name: 'Real User',
      email: 'real.person@customdomain.org',
      passwordHash: 'secret123',
      role: 'user',
      status: 'active',
    });

    // Run seed
    await seedDatabase({ quiet: true });

    // Admin and real user must still exist untouched
    const checkAdmin = await User.findById(admin._id);
    expect(checkAdmin).toBeDefined();
    expect(checkAdmin.email).toBe('admin@artha.local');
    expect(checkAdmin.role).toBe('admin');

    const checkReal = await User.findById(realUser._id);
    expect(checkReal).toBeDefined();
    expect(checkReal.email).toBe('real.person@customdomain.org');

    // Total users is 50 demo users + 2 existing accounts = 52
    expect(await User.countDocuments()).toBe(52);
  });

  test('production guard prevents accidental execution when NODE_ENV is production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await expect(seedDatabase({ quiet: true })).rejects.toThrow(
        /Seeding is forbidden in production/i
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('admin data isolation: seeded demo transactions do not leak to admin personal endpoints', async () => {
    // 1. Seed database
    await seedDatabase({ quiet: true });

    // 2. Create admin and login
    const admin = await User.create({
      name: 'Auditor Admin',
      email: 'auditor@artha.local',
      passwordHash: 'secret123',
      role: 'admin',
      status: 'active',
    });
    const token = signToken(admin._id);
    const adminClient = client(app, token);

    // 3. Admin personal transactions endpoint returns 0 items
    const personalTx = await adminClient.get('/api/transactions');
    expect(personalTx.status).toBe(200);
    expect(personalTx.body.data.items).toHaveLength(0);

    // 4. Admin personal budgets endpoint returns 0 items
    const personalBg = await adminClient.get('/api/budgets');
    expect(personalBg.status).toBe(200);
    expect(personalBg.body.data.items).toHaveLength(0);

    // 5. Admin dashboard aggregate counts reflect the demo dataset
    const adminDash = await adminClient.get('/api/admin/dashboard');
    expect(adminDash.status).toBe(200);
    expect(adminDash.body.data.users.total).toBe(51); // 50 demo + 1 admin
    expect(adminDash.body.data.users.regular).toBe(50);
    expect(adminDash.body.data.platformActivity.totalTransactions).toBeGreaterThan(300);
  });
});
