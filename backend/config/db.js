/** MongoDB connection management (Mongoose). */
const mongoose = require('mongoose');

// mongoose.connection.readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

function getDbState() {
  return STATES[mongoose.connection.readyState] || 'unknown';
}

const path = require('path');
const fs = require('fs');

let embeddedServer = null;

async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    // Fail within 3s if external MongoDB is unreachable
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    return mongoose.connection;
  } catch (err) {
    // In local development, if external MongoDB is not running, seamlessly start embedded MongoDB
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      try {
        console.log('[db] Local MongoDB service not detected; launching local embedded MongoDB...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const dbPath = path.join(__dirname, '../../.data/db');
        fs.mkdirSync(dbPath, { recursive: true });
        embeddedServer = await MongoMemoryServer.create({
          instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' },
        });
        await mongoose.connect('mongodb://127.0.0.1:27017/artha', { serverSelectionTimeoutMS: 5000 });
        console.log('[db] Local embedded MongoDB ready (persisting data to .data/db)');
        return mongoose.connection;
      } catch (innerErr) {
        throw err;
      }
    }
    throw err;
  }
}

/**
 * Active liveness check. readyState alone can be stale for ~10s after the server
 * dies (the driver only notices on its next heartbeat), so we send a real ping,
 * capped at timeoutMs so a dead database cannot hang the health endpoint.
 */
async function pingDB(timeoutMs = 2000) {
  if (mongoose.connection.readyState !== 1) return false;
  let timer;
  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('ping timeout')), timeoutMs); }),
    ]);
    return true;
  } catch (err) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (embeddedServer) {
    await embeddedServer.stop().catch(() => {});
    embeddedServer = null;
  }
}

module.exports = { connectDB, disconnectDB, getDbState, pingDB };
