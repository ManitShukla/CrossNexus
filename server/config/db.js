const mongoose = require('mongoose');

// Disable indefinite query buffering to prevent 10s request freeze if connection drops
mongoose.set('bufferCommands', false);

/**
 * Tactical Database Connection Interface
 * Connects to MongoDB Atlas cluster with auto-retry and lifecycle event monitors.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoURI || mongoURI.includes('<username>')) {
    console.warn('\x1b[33m%s\x1b[0m', '[SYS_WARN] Valid MONGODB_URI or MONGO_URI not detected in environment.');
    console.warn('\x1b[33m%s\x1b[0m', '[SYS_WARN] Running server in OFFLINE/STUB database mode. Hydrate environment variables with Atlas credentials.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log('\x1b[32m%s\x1b[0m', `[DB_UPLINK_ESTABLISHED] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[DB_UPLINK_FAILURE] Critical failure connecting to MongoDB: ${error.message}`);
    console.warn('\x1b[33m%s\x1b[0m', '[DB_ACTION_REQUIRED] If deploying on Render/cloud, ensure 0.0.0.0/0 is added to MongoDB Atlas Network Access.');
    console.warn('\x1b[33m%s\x1b[0m', '[DB_STATUS] Operating in resilient fallback mode. API & Demo access remain operational.');
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('\x1b[33m%s\x1b[0m', '[DB_STATUS] MongoDB connection terminated/disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('\x1b[32m%s\x1b[0m', '[DB_STATUS] MongoDB re-established active uplink.');
});

module.exports = connectDB;