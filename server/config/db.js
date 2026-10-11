const mongoose = require('mongoose');

/**
 * Tactical Database Connection Interface
 * Connects to MongoDB Atlas cluster with auto-retry and lifecycle event monitors.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes('<username>')) {
    console.warn('\x1b[33m%s\x1b[0m', '[SYS_WARN] Valid MONGODB_URI not detected in environment telemetry.');
    console.warn('\x1b[33m%s\x1b[0m', '[SYS_WARN] Running server in OFFLINE/STUB database mode. Hydrate server/.env with Atlas credentials to establish live uplink.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('\x1b[32m%s\x1b[0m', `[DB_UPLINK_ESTABLISHED] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[DB_UPLINK_FAILURE] Critical failure connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('\x1b[33m%s\x1b[0m', '[DB_STATUS] MongoDB connection terminated/disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('\x1b[32m%s\x1b[0m', '[DB_STATUS] MongoDB re-established active uplink.');
});

module.exports = connectDB;