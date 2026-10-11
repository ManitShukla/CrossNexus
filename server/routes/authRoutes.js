const express = require('express');
const passport = require('passport');
const {
  handleGoogleCallback,
  getMe,
  logout,
  devLogin,
} = require('../controllers/authController');
const authenticateJWT = require('../middleware/authMiddleware');

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// -----------------------------------------------------------------------------
// GOOGLE OAUTH 2.0 PROTOCOL ENTRY
// -----------------------------------------------------------------------------
router.get('/google', (req, res, next) => {
  // Check if strategy is registered
  if (!passport._strategy('google')) {
    return res.status(503).json({
      status: 'GATEWAY_UNAVAILABLE',
      code: 'GOOGLE_AUTH_UNCONFIGURED',
      message: 'Google OAuth 2.0 credentials not yet initialized in server/.env telemetry.',
      guidance: 'Populate GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET or use /api/auth/dev-login in development.',
    });
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
  })(req, res, next);
});

// -----------------------------------------------------------------------------
// GOOGLE OAUTH 2.0 CALLBACK INTERCEPTOR
// -----------------------------------------------------------------------------
router.get(
  '/google/callback',
  (req, res, next) => {
    if (!passport._strategy('google')) {
      return res.redirect(`${CLIENT_URL}/login?error=oauth_unconfigured`);
    }

    passport.authenticate('google', {
      session: false,
      failureRedirect: `${CLIENT_URL}/login?error=unauthorized_domain`,
    })(req, res, next);
  },
  handleGoogleCallback
);

// -----------------------------------------------------------------------------
// CADET SESSION TELEMETRY
// -----------------------------------------------------------------------------
router.get('/me', authenticateJWT, getMe);
router.post('/logout', authenticateJWT, logout);

// -----------------------------------------------------------------------------
// TEST & DEV HARNESS (NON-PRODUCTION ONLY)
// -----------------------------------------------------------------------------
router.post('/dev-login', devLogin);

module.exports = router;