/**
 * CLI runner for Artha development seed script.
 *
 * Usage:
 *   npm run seed
 *   node scripts/seed.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { config, validateEnv } = require('../backend/config/env');
const { connectDB, disconnectDB } = require('../backend/config/db');
const { seedDatabase } = require('../backend/seed/seedData');

async function main() {
  try {
    validateEnv(config);
  } catch (err) {
    console.error(`Configuration error: ${err.message}`);
    process.exit(1);
  }

  try {
    console.log(`Connecting to database at ${config.mongoUri}...`);
    await connectDB(config.mongoUri);

    const stats = await seedDatabase();

    console.log('\n======================================================');
    console.log('✨ ARTHA SYNTHETIC DATASET SEED COMPLETE');
    console.log('======================================================');
    console.log(`Total Users Seeded : ${stats.usersCount} (${stats.activeUsersCount} Active, ${stats.suspendedUsersCount} Suspended)`);
    console.log(`Transactions       : ${stats.transactionsCount} multi-month records`);
    console.log(`Budgets            : ${stats.budgetsCount} category limits`);
    console.log(`Savings Goals      : ${stats.goalsCount} goals`);
    console.log('------------------------------------------------------');
    console.log('🔑 DEMO USER CREDENTIALS FOR TESTING:');
    console.log(`  Active User Email    : ${stats.sampleUserEmail}`);
    console.log(`  Password             : ${stats.demoPassword}`);
    console.log(`  Suspended User Email : pooja.reddy@example.com`);
    console.log(`  Password             : ${stats.demoPassword}`);
    console.log('------------------------------------------------------');
    console.log('🛡️ ADMIN CREDENTIALS:');
    console.log('  Admin Email          : admin@artha.local');
    console.log('  Admin Password       : AdminPassword123');
    console.log('======================================================\n');
  } catch (err) {
    console.error(`\n❌ Seeding failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB().catch(() => {});
    process.exit();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
