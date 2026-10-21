/**
 * Administrator Bootstrap Script for Artha.
 *
 * Securely creates or promotes an administrator account.
 * NEVER hardcodes credentials. Reads credentials from CLI arguments or environment variables.
 *
 * Usage:
 *   node scripts/create-admin.js --email=admin@example.com --password=YourSecurePassword1 --name="System Admin"
 *
 * Or via environment variables:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourSecurePassword1 ADMIN_NAME="System Admin" node scripts/create-admin.js
 *
 * Or via npm script:
 *   npm run admin:create -- --email=admin@example.com --password=YourSecurePassword1 --name="System Admin"
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { config, validateEnv } = require('../backend/config/env');
const { connectDB, disconnectDB } = require('../backend/config/db');
const User = require('../backend/models/User');
const AuditLog = require('../backend/models/AuditLog');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      args[key] = rest.join('=');
    }
  });
  return args;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function bootstrap() {
  const args = parseArgs();
  const email = (args.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = args.password || process.env.ADMIN_PASSWORD || '';
  const name = (args.name || process.env.ADMIN_NAME || 'Artha Administrator').trim();

  if (!email || !EMAIL_RE.test(email)) {
    console.error('Error: A valid email address is required.');
    console.error('Usage: node scripts/create-admin.js --email=admin@example.com --password=YourSecurePassword1 --name="Admin Name"');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error('Error: Password must contain at least one letter and one number.');
    process.exit(1);
  }

  try {
    validateEnv(config);
  } catch (err) {
    console.error(`Configuration error: ${err.message}`);
    process.exit(1);
  }

  try {
    console.log(`Connecting to MongoDB...`);
    await connectDB(config.mongoUri);

    let user = await User.findOne({ email }).select('+passwordHash');
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    if (user) {
      console.log(`User ${email} already exists. Promoting to administrator and updating credentials...`);
      user.name = name || user.name;
      user.role = 'admin';
      user.status = 'active';
      user.passwordHash = passwordHash;
      await user.save();
      console.log(`Successfully promoted ${email} to Administrator.`);
    } else {
      console.log(`Creating new Administrator account for ${email}...`);
      user = await User.create({
        name,
        email,
        passwordHash,
        role: 'admin',
        status: 'active',
      });
      console.log(`Successfully created Administrator account for ${email}.`);
    }

    await AuditLog.create({
      adminId: user._id,
      adminEmail: user.email,
      action: 'ADMIN_BOOTSTRAP',
      details: {
        message: 'Administrator account bootstrapped via CLI script',
        assignedRole: 'admin',
      },
      ipAddress: '127.0.0.1 (cli)',
      userAgent: 'Artha-CLI-Bootstrap',
    }).catch(() => {});

    console.log(`Admin user ID: ${user._id}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
  } catch (err) {
    console.error(`Failed to bootstrap admin: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB().catch(() => {});
    process.exit();
  }
}

if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };
