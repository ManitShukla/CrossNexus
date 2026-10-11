const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Tactical WebSocket Infrastructure: Announcement Sockets
 * Enforces cryptographic handshake authentication and provisions
 * campus broadcast telemetry rooms.
 */
function initAnnouncementSockets(io) {
  // ---------------------------------------------------------------------------
  // AUTHENTICATION SENTRY: HANDSHAKE MIDDLEWARE
  // ---------------------------------------------------------------------------
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token = socket.handshake.auth?.token 
        || (authHeader && authHeader.replace(/^Bearer\s+/i, ''));

      if (!token) {
        console.warn(`[WSS_HANDSHAKE_REJECTED] Socket ${socket.id}: Missing cryptographic token.`);
        return next(new Error('AUTHENTICATION_FAILED: Telemetry token missing.'));
      }

      const jwtSecret = process.env.JWT_SECRET || 'TACTICAL_ALPHA_KEY_SECURE_9812739182371982_NSUT_CONNECT';
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (jwtErr) {
        console.warn(`[WSS_HANDSHAKE_REJECTED] Socket ${socket.id}: JWT verification failed (${jwtErr.message}).`);
        return next(new Error(`AUTHENTICATION_FAILED: ${jwtErr.message}`));
      }

      let cadet;
      if (mongoose.connection.readyState === 1) {
        cadet = await User.findById(decoded.id).select('name email role branch semester section');
        if (!cadet) {
          console.warn(`[WSS_HANDSHAKE_REJECTED] Socket ${socket.id}: Cadet ${decoded.id} not found in database.`);
          return next(new Error('AUTHENTICATION_FAILED: Cadet record not registered.'));
        }
      } else {
        // Resilient development / in-memory session stub
        cadet = {
          _id: decoded.id || 'dev-cadet-socket',
          id: decoded.id || 'dev-cadet-socket',
          name: decoded.name || 'Tactical Cadet',
          email: decoded.email || 'cadet@nsut.ac.in',
          role: decoded.role || 'student',
          branch: decoded.branch || 'ECE',
        };
      }

      // Attach authenticated identity to socket instance
      socket.user = cadet;
      next();
    } catch (err) {
      console.error(`[WSS_AUTH_FATAL] Error in socket handshake:`, err.message);
      return next(new Error(`AUTHENTICATION_FAILED: Internal handshake failure.`));
    }
  });

  // ---------------------------------------------------------------------------
  // CONNECTION MATRIX & CHANNEL MANAGEMENT
  // ---------------------------------------------------------------------------
  io.on('connection', (socket) => {
    const cadet = socket.user;
    console.log(`\x1b[32m%s\x1b[0m`, `[WSS_LINK_ACQUIRED] Terminal Socket: ${socket.id} | Cadet: ${cadet?.email} | Role: ${cadet?.role}`);

    // Automatically assign cadet to universal campus broadcast channel
    socket.join('campus_all');
    console.log(`[WSS_CHANNEL_JOIN] Socket ${socket.id} -> channel 'campus_all'`);

    // Assign to branch-specific telemetry channel if calibrated
    if (cadet?.branch) {
      const branchChannel = `branch_${cadet.branch.toUpperCase()}`;
      socket.join(branchChannel);
      console.log(`[WSS_CHANNEL_JOIN] Socket ${socket.id} -> channel '${branchChannel}'`);
    }

    // Assign admin to administrative command channel
    if (cadet?.role === 'admin') {
      socket.join('channel_command_admin');
      console.log(`[WSS_CHANNEL_JOIN] Socket ${socket.id} -> channel 'channel_command_admin'`);
    }

    // Ping telemetry heartbeat for latency diagnostics
    socket.on('ping_telemetry', (clientTimestamp, callback) => {
      const serverTimestamp = Date.now();
      if (typeof callback === 'function') {
        callback({
          status: 'UPLINK_STABLE',
          serverTimestamp,
          rtt: clientTimestamp ? serverTimestamp - clientTimestamp : null,
        });
      }
    });

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      console.log(`\x1b[33m%s\x1b[0m`, `[WSS_LINK_DROPPED] Terminal Socket: ${socket.id} | Cadet: ${cadet?.email} | Reason: ${reason}`);
    });

    // Handle internal transmission error
    socket.on('error', (err) => {
      console.error(`[WSS_ERROR] Socket ${socket.id} exception:`, err);
    });
  });

  console.log('[WSS_INIT] Announcement WebSocket infrastructure armed.');
}

module.exports = {
  initAnnouncementSockets,
};
