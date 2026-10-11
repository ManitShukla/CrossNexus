const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * WebSocket Infrastructure: Announcement Sockets
 * Enforces authentication and provisions
 * campus broadcast notification channels.
 */
function initAnnouncementSockets(io) {
  // ---------------------------------------------------------------------------
  // AUTHENTICATION: HANDSHAKE MIDDLEWARE
  // ---------------------------------------------------------------------------
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token = socket.handshake.auth?.token 
        || (authHeader && authHeader.replace(/^Bearer\s+/i, ''));

      if (!token) {
        console.warn(`[WSS_HANDSHAKE_REJECTED] Socket ${socket.id}: Missing token.`);
        return next(new Error('AUTHENTICATION_FAILED: Session token missing.'));
      }

      const jwtSecret = process.env.JWT_SECRET || 'TACTICAL_ALPHA_KEY_SECURE_9812739182371982_NSUT_CONNECT';
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (jwtErr) {
        console.warn(`[WSS_HANDSHAKE_REJECTED] Socket ${socket.id}: JWT verification failed (${jwtErr.message}).`);
        return next(new Error(`AUTHENTICATION_FAILED: ${jwtErr.message}`));
      }

      let userRecord;
      if (mongoose.connection.readyState === 1) {
        userRecord = await User.findById(decoded.id).select('name email role branch semester section');
        if (!userRecord) {
          console.warn(`[WSS_HANDSHAKE_REJECTED] Socket ${socket.id}: User ${decoded.id} not found in database.`);
          return next(new Error('AUTHENTICATION_FAILED: User record not registered.'));
        }
      } else {
        // Resilient development / in-memory session stub
        userRecord = {
          _id: decoded.id || 'dev-user-socket',
          id: decoded.id || 'dev-user-socket',
          name: decoded.name || 'Student',
          email: decoded.email || 'student@nsut.ac.in',
          role: decoded.role || 'student',
          branch: decoded.branch || 'ECE',
        };
      }

      // Attach authenticated identity to socket instance
      socket.user = userRecord;
      next();
    } catch (err) {
      console.error(`[WSS_AUTH_FATAL] Error in socket handshake:`, err.message);
      return next(new Error(`AUTHENTICATION_FAILED: Internal handshake failure.`));
    }
  });

  // ---------------------------------------------------------------------------
  // CONNECTION & CHANNEL MANAGEMENT
  // ---------------------------------------------------------------------------
  io.on('connection', (socket) => {
    const userRecord = socket.user;
    console.log(`\x1b[32m%s\x1b[0m`, `[WSS_CONNECTED] Socket: ${socket.id} | User: ${userRecord?.email} | Role: ${userRecord?.role}`);

    // Automatically assign user to universal campus broadcast channel
    socket.join('campus_all');
    console.log(`[WSS_CHANNEL_JOIN] Socket ${socket.id} -> channel 'campus_all'`);

    // Assign to branch-specific channel if profile has branch
    if (userRecord?.branch) {
      const branchChannel = `branch_${userRecord.branch.toUpperCase()}`;
      socket.join(branchChannel);
      console.log(`[WSS_CHANNEL_JOIN] Socket ${socket.id} -> channel '${branchChannel}'`);
    }

    // Assign admin to administrative channel
    if (userRecord?.role === 'admin') {
      socket.join('channel_command_admin');
      console.log(`[WSS_CHANNEL_JOIN] Socket ${socket.id} -> channel 'channel_command_admin'`);
    }

    // Ping telemetry heartbeat for latency diagnostics
    socket.on('ping_telemetry', (clientTimestamp, callback) => {
      const serverTimestamp = Date.now();
      if (typeof callback === 'function') {
        callback({
          status: 'LIVE',
          serverTimestamp,
          rtt: clientTimestamp ? serverTimestamp - clientTimestamp : null,
        });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      console.log(`\x1b[33m%s\x1b[0m`, `[WSS_DISCONNECTED] Socket: ${socket.id} | User: ${userRecord?.email} | Reason: ${reason}`);
    });

    // Handle internal socket error
    socket.on('error', (err) => {
      console.error(`[WSS_ERROR] Socket ${socket.id} exception:`, err);
    });
  });

  console.log('[WSS_INIT] Announcement WebSocket infrastructure initialized.');
}

module.exports = {
  initAnnouncementSockets,
};
