/**
 * Development & Demonstration Synthetic Dataset Generator for Artha.
 *
 * Populates MongoDB with ~50 realistic synthetic Indian user profiles and multi-month
 * financial records (transactions, budgets, goals) to demonstrate the Admin Panel,
 * User Management, Telemetry, and Analytics.
 *
 * IDEMPOTENCY & SAFETY:
 * - Only seeds accounts ending in @example.com (never touches admin or real user accounts).
 * - Protected against execution in production environments (checks NODE_ENV).
 * - Rerunning the seed replaces only demo records, guaranteeing zero duplicates.
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES } = require('../utils/categories');
const { round2 } = require('../utils/money');

// 50 realistic Indian fictional names
const DEMO_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Iyer', 'Vikram Singh',
  'Neha Gupta', 'Aditya Joshi', 'Kavita Nair', 'Siddharth Mehta', 'Pooja Reddy',
  'Rajesh Kulkarni', 'Sneha Deshmukh', 'Rahul Banerjee', 'Meera Nambiar', 'Amit Choudhury',
  'Divya Pillai', 'Karan Malhotra', 'Ritu Agarwal', 'Nikhil Saxena', 'Shreya Bhattacharya',
  'Varun Kapoor', 'Deepika Rao', 'Gaurav Bhatia', 'Tanvi Kulkarni', 'Manish Tiwari',
  'Sunita Menon', 'Kunal Singhania', 'Swati Mahajan', 'Alok Sengupta', 'Preeti Hegde',
  'Vivek Chauhan', 'Rashmi Varma', 'Harish Venkatesh', 'Shilpa Mukherjee', 'Sandeep Pandey',
  'Aarti Ranganathan', 'Tarun Goswami', 'Pallavi Nadkarni', 'Devendra Sheth', 'Nandini Das',
  'Abhinav Shukla', 'Jyoti Chawla', 'Chetan Somani', 'Malini Krishnan', 'Prateek Jain',
  'Shalini Trivedi', 'Mohit Bhasin', 'Smriti Kaul', 'Yashraj Dixit', 'Anjali Sundaram',
];

// 5 users marked suspended to showcase account status moderation in admin panel
const SUSPENDED_INDICES = new Set([9, 19, 29, 39, 49]);

// 4 distinct financial personas
const PERSONAS = [
  {
    type: 'tech_professional',
    baseSalary: 110000,
    salaryVariation: 20000,
    hasFreelance: true,
    budgetCategories: ['Food', 'Transport', 'Entertainment', 'Shopping'],
    budgetAmounts: { Food: 18000, Transport: 6000, Entertainment: 8000, Shopping: 12000 },
    goals: [
      { name: 'Emergency Fund', target: 200000, current: 140000, monthly: 15000, monthsAhead: 5 },
      { name: 'MacBook Pro M3', target: 150000, current: 150000, monthly: 20000, monthsAhead: 1 }, // completed
    ],
  },
  {
    type: 'early_career',
    baseSalary: 42000,
    salaryVariation: 5000,
    hasFreelance: false,
    budgetCategories: ['Food', 'Transport', 'Utilities', 'Entertainment'],
    budgetAmounts: { Food: 9000, Transport: 3500, Utilities: 2500, Entertainment: 4000 },
    goals: [
      { name: 'Goa Vacation', target: 35000, current: 20000, monthly: 5000, monthsAhead: 3 },
    ],
  },
  {
    type: 'consultant_freelancer',
    baseSalary: 75000,
    salaryVariation: 25000,
    hasFreelance: true,
    budgetCategories: ['Food', 'Transport', 'Shopping', 'Utilities'],
    budgetAmounts: { Food: 14000, Transport: 5000, Shopping: 8000, Utilities: 3500 },
    goals: [
      { name: 'Home Office Setup', target: 80000, current: 55000, monthly: 10000, monthsAhead: 3 },
      { name: 'Retirement Corpus', target: 500000, current: 180000, monthly: 20000, monthsAhead: 18 },
    ],
  },
  {
    type: 'family_household',
    baseSalary: 85000,
    salaryVariation: 10000,
    hasFreelance: false,
    budgetCategories: ['Food', 'Rent', 'Education', 'Utilities', 'Health'],
    budgetAmounts: { Food: 22000, Rent: 25000, Education: 12000, Utilities: 4500, Health: 6000 },
    goals: [
      { name: 'Children Education Fund', target: 300000, current: 120000, monthly: 12000, monthsAhead: 15 },
      { name: 'Car Down Payment', target: 250000, current: 90000, monthly: 15000, monthsAhead: 11 },
    ],
  },
];

function generateEmail(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@example.com';
}

/**
 * Returns a date relative to now in UTC.
 * @param {number} monthsAgo Number of months in the past (0 = current month)
 * @param {number} dayOfMonth Day of month (1 to 28)
 */
function getDate(monthsAgo, dayOfMonth = 1) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() - monthsAgo;
  return new Date(Date.UTC(year, month, Math.min(dayOfMonth, 28), 10, 0, 0));
}

/**
 * Main seeding function. Idempotent and safe.
 */
async function seedDatabase(options = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !process.env.ALLOW_SEED_IN_PRODUCTION) {
    throw new Error(
      'Execution blocked: Seeding is forbidden in production environment. Set ALLOW_SEED_IN_PRODUCTION=1 only if intentional.'
    );
  }

  const quiet = Boolean(options.quiet);
  const log = (msg) => { if (!quiet) console.log(msg); };

  log('🌱 Starting Artha synthetic dataset generation...');

  // 1. Precompute demo password hash for high speed
  const demoPassword = options.demoPassword || 'DemoUser123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  // 2. Determine all demo emails to ensure idempotency
  const demoEmails = DEMO_NAMES.map((name) => generateEmail(name));

  // 3. Clean up any existing demo records (leaving admins and real users untouched!)
  const existingDemoUsers = await User.find({ email: { $in: demoEmails }, role: { $ne: 'admin' } }).select('_id');
  const existingDemoUserIds = existingDemoUsers.map((u) => u._id);

  if (existingDemoUserIds.length > 0) {
    log(`🧹 Removing ${existingDemoUserIds.length} previous demo accounts for clean idempotent seeding...`);
    await Promise.all([
      Transaction.deleteMany({ userId: { $in: existingDemoUserIds } }),
      Budget.deleteMany({ userId: { $in: existingDemoUserIds } }),
      Goal.deleteMany({ userId: { $in: existingDemoUserIds } }),
      User.deleteMany({ _id: { $in: existingDemoUserIds } }),
    ]);
  }

  // 4. Generate the 50 user documents with progressive registration dates across 6 months
  const now = new Date();
  const usersToInsert = [];

  for (let i = 0; i < DEMO_NAMES.length; i++) {
    const name = DEMO_NAMES[i];
    const email = demoEmails[i];
    const isSuspended = SUSPENDED_INDICES.has(i);

    // Distribution across last 6 months (5 months ago to 0 months ago)
    // Results in organic user growth curve for admin registration trend chart
    let monthsAgo;
    if (i < 6) monthsAgo = 5;
    else if (i < 13) monthsAgo = 4;
    else if (i < 22) monthsAgo = 3;
    else if (i < 32) monthsAgo = 2;
    else if (i < 43) monthsAgo = 1;
    else monthsAgo = 0;

    const registrationDay = (i % 25) + 2;
    const createdAt = getDate(monthsAgo, registrationDay);

    // Realistic last login
    let lastLoginAt = null;
    if (!isSuspended) {
      const daysSinceLogin = (i % 12) + 1;
      lastLoginAt = new Date(now.getTime() - daysSinceLogin * 24 * 60 * 60 * 1000);
    } else {
      // Suspended user last logged in over a month ago
      lastLoginAt = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    }

    usersToInsert.push({
      _id: new mongoose.Types.ObjectId(),
      name,
      email,
      passwordHash,
      role: 'user', // Strictly user role (never administrator)
      status: isSuspended ? 'suspended' : 'active',
      lastLoginAt,
      createdAt,
      updatedAt: createdAt,
    });
  }

  const createdUsers = await User.insertMany(usersToInsert);
  log(`✅ Created ${createdUsers.length} synthetic demo users (${createdUsers.length - SUSPENDED_INDICES.size} active, ${SUSPENDED_INDICES.size} suspended).`);

  // 5. Generate realistic transactions, budgets, and goals for each user
  const transactionsToInsert = [];
  const budgetsToInsert = [];
  const goalsToInsert = [];

  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    const persona = PERSONAS[i % PERSONAS.length];

    // Determine how many months this user has been active based on registration
    const userMonthsActive = Math.min(5, Math.max(0, Math.floor((now - user.createdAt) / (30 * 24 * 60 * 60 * 1000))));

    // --- A. Transactions across active months ---
    for (let m = userMonthsActive; m >= 0; m--) {
      // 1. Monthly Salary (Income)
      const salaryAmount = round2(persona.baseSalary + ((i * 137) % persona.salaryVariation));
      transactionsToInsert.push({
        userId: user._id,
        type: 'income',
        category: 'Salary',
        amount: salaryAmount,
        date: getDate(m, 1),
        description: 'Monthly salary compensation',
      });

      // 2. Occasional Freelance / Investment Income
      if (persona.hasFreelance && (m + i) % 2 === 0) {
        transactionsToInsert.push({
          userId: user._id,
          type: 'income',
          category: 'Freelance',
          amount: round2(15000 + ((i * 231) % 20000)),
          date: getDate(m, 14),
          description: 'Client consulting milestone',
        });
      }

      // 3. Regular Monthly Expenses
      // Rent / Housing
      if (persona.budgetAmounts.Rent) {
        transactionsToInsert.push({
          userId: user._id,
          type: 'expense',
          category: 'Rent',
          amount: persona.budgetAmounts.Rent,
          date: getDate(m, 3),
          description: 'Apartment monthly rent',
        });
      }

      // Food / Groceries (split into 3-4 transactions per month)
      const foodTotal = persona.budgetAmounts.Food || 12000;
      transactionsToInsert.push(
        {
          userId: user._id,
          type: 'expense',
          category: 'Food',
          amount: round2(foodTotal * 0.35),
          date: getDate(m, 5),
          description: 'Supermarket weekly grocery stocking',
        },
        {
          userId: user._id,
          type: 'expense',
          category: 'Food',
          amount: round2(foodTotal * 0.35),
          date: getDate(m, 16),
          description: 'Mid-month grocery replenishment',
        },
        {
          userId: user._id,
          type: 'expense',
          category: 'Food',
          amount: round2(foodTotal * 0.25),
          date: getDate(m, 22),
          description: 'Weekend dinner with friends',
        }
      );

      // Transport
      if (persona.budgetAmounts.Transport) {
        transactionsToInsert.push({
          userId: user._id,
          type: 'expense',
          category: 'Transport',
          amount: round2(persona.budgetAmounts.Transport * 0.85),
          date: getDate(m, 10),
          description: 'Metro smart card recharge and cabs',
        });
      }

      // Utilities
      if (persona.budgetAmounts.Utilities) {
        transactionsToInsert.push({
          userId: user._id,
          type: 'expense',
          category: 'Utilities',
          amount: round2(persona.budgetAmounts.Utilities * 0.95),
          date: getDate(m, 7),
          description: 'Electricity and fiber broadband bills',
        });
      }

      // Shopping / Entertainment
      if (persona.budgetAmounts.Shopping && (m + i) % 2 === 0) {
        transactionsToInsert.push({
          userId: user._id,
          type: 'expense',
          category: 'Shopping',
          amount: round2(persona.budgetAmounts.Shopping * 0.75),
          date: getDate(m, 18),
          description: 'Clothing and personal accessories',
        });
      }

      if (persona.budgetAmounts.Entertainment) {
        transactionsToInsert.push({
          userId: user._id,
          type: 'expense',
          category: 'Entertainment',
          amount: round2(persona.budgetAmounts.Entertainment * 0.7),
          date: getDate(m, 24),
          description: 'Movie tickets and streaming subscriptions',
        });
      }
    }

    // --- B. Budgets (2 to 4 budgets per user) ---
    for (const cat of persona.budgetCategories) {
      const budgetAmount = persona.budgetAmounts[cat] || 10000;
      // Mostly monthly, with some weekly and yearly for distribution demo
      let period = 'monthly';
      if (cat === 'Transport' && i % 6 === 0) period = 'weekly';
      if (cat === 'Education' && i % 4 === 0) period = 'yearly';

      budgetsToInsert.push({
        userId: user._id,
        category: cat,
        amount: period === 'weekly' ? round2(budgetAmount / 4) : budgetAmount,
        period,
        createdAt: user.createdAt,
      });
    }

    // --- C. Goals (1 to 2 goals per user) ---
    for (const g of persona.goals) {
      const targetDate = new Date(now.getTime() + g.monthsAhead * 30 * 24 * 60 * 60 * 1000);
      goalsToInsert.push({
        userId: user._id,
        name: g.name,
        targetAmount: g.target,
        currentAmount: g.current,
        monthlyContribution: g.monthly,
        targetDate,
        createdAt: user.createdAt,
      });
    }
  }

  // Insert financial entities in batches
  const [txResult, bgResult, glResult] = await Promise.all([
    Transaction.insertMany(transactionsToInsert),
    Budget.insertMany(budgetsToInsert),
    Goal.insertMany(goalsToInsert),
  ]);

  log(`✅ Seeded ${txResult.length} transactions across supported categories.`);
  log(`✅ Seeded ${bgResult.length} category budgets.`);
  log(`✅ Seeded ${glResult.length} savings goals.`);
  log(`🎉 Synthetic dataset successfully populated!`);

  return {
    usersCount: createdUsers.length,
    activeUsersCount: createdUsers.length - SUSPENDED_INDICES.size,
    suspendedUsersCount: SUSPENDED_INDICES.size,
    transactionsCount: txResult.length,
    budgetsCount: bgResult.length,
    goalsCount: glResult.length,
    demoPassword,
    sampleUserEmail: demoEmails[0],
  };
}

module.exports = { seedDatabase, DEMO_NAMES, PERSONAS };
