require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const { initAnnouncementSockets } = require('./sockets/announcementSockets');


// Establish MongoDB connection uplink
connectDB();

// Initialize Passport authentication strategies
configurePassport();

const app = express();
const server = http.createServer(app);

// Whitelist origins for local dev and configured deployment
const configuredClient = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  configuredClient,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// -----------------------------------------------------------------------------
// REAL-TIME PROTOCOL: SOCKET.IO INITIALIZATION
// -----------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin rejected by tactical policy'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Initialize secure JWT-authenticated announcement sockets
initAnnouncementSockets(io);

// Attach Socket.io to Express request pipeline
app.use((req, res, next) => {
  req.io = io;
  next();
});

// -----------------------------------------------------------------------------
// DEFENSE MATRIX: SECURITY HEADERS & DEFENSIVE MIDDLEWARE
// -----------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ...allowedOrigins, 'ws:', 'wss:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Tactical CORS policy
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for untrusted origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Interface'],
  })
);

// Tactical rate limiting: prevent API abuse and brute-force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'THROTTLED',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Tactical link throttled. Max requests exceeded for current window.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

app.use('/api/', apiLimiter);

// Payload parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport middleware
app.use(passport.initialize());

// -----------------------------------------------------------------------------
// API ROUTE CHANNELS
// -----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/vault', vaultRoutes);

// -----------------------------------------------------------------------------
// TELEMETRY & SYSTEM HEALTH ENDPOINTS
// -----------------------------------------------------------------------------
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.status(200).json({
    status: 'OPERATIONAL',
    system: 'NSUT_CONNECT_TACTICAL_CORE',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    database: {
      state: ['DISCONNECTED', 'CONNECTED', 'CONNECTING', 'DISCONNECTING'][mongoose.connection.readyState] || 'UNKNOWN',
    },
    socketClients: io.engine.clientsCount,
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    platform: 'NSUT Connect FUI Platform',
    version: '1.0.0-TACTICAL',
    spec: 'MIL-SPEC HUD CAMPUS PROTOCOL',
    status: 'GRID_ACTIVE',
  });
});

// -----------------------------------------------------------------------------
// EXCEPTION HANDLING & TERMINAL ROUTING
// -----------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// -----------------------------------------------------------------------------
// RUNTIME INITIALIZATION & GRACEFUL TEARDOWN
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', '==================================================');
  console.log('\x1b[32m%s\x1b[0m', `[SYS_ONLINE] NSUT Connect Core Server listening on port: ${PORT}`);
  console.log('\x1b[32m%s\x1b[0m', `[SYS_ONLINE] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\x1b[32m%s\x1b[0m', `[SYS_ONLINE] Allowed Client Origins: ${allowedOrigins.join(', ')}`);
  console.log('\x1b[36m%s\x1b[0m', '==================================================');
});

const handleGracefulShutdown = (signal) => {
  console.log(`\n[${signal}] Initiating tactical system shutdown...`);
  io.close(() => {
    console.log('[WSS] Socket server terminated.');
  });
  server.close(() => {
    console.log('[HTTP] Express listener disengaged.');
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      console.log('[DB] MongoDB uplink severed.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('\x1b[31m%s\x1b[0m', `[TACTICAL_ASYNC_WARN] Unhandled Rejection:`, reason);
});

process.on('uncaughtException', (error) => {
  console.error('\x1b[31m%s\x1b[0m', `[TACTICAL_FATAL_EXCEPTION] Uncaught Exception:`, error);
});

module.exports = { app, server, io };
