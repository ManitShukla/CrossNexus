const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'TACTICAL_ALPHA_KEY_SECURE_9812739182371982_NSUT_CONNECT';
const JWT_EXPIRES_IN = '7d';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Generate cryptographically signed tactical JWT
 */
const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      branch: user.branch || null,
      name: user.name || null,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

/**
 * Google OAuth Callback Handler
 * Issues JWT and redirects client terminal to /auth/callback
 */
const handleGoogleCallback = (req, res) => {
  try {
    if (!req.user) {
      console.warn('[AUTH_TX] Google callback received without authenticated user.');
      return res.redirect(`${CLIENT_URL}/login?error=unauthorized_domain`);
    }

    const token = signToken(req.user);
    console.log(`[AUTH_TOKEN_ISSUED] Session generated for: ${req.user.email} (ROLE: ${req.user.role})`);

    return res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('[AUTH_TOKEN_FAILURE] Failed issuing JWT during OAuth callback:', error);
    return res.redirect(`${CLIENT_URL}/login?error=auth_internal_failure`);
  }
};

/**
 * GET /api/auth/me
 * Retrieves active cadet profile and verifies token freshness
 */
const getMe = async (req, res) => {
  try {
    const profile = typeof req.user.toTacticalProfile === 'function' 
      ? req.user.toTacticalProfile() 
      : {
          id: req.user._id || req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          branch: req.user.branch || null,
          semester: req.user.semester || null,
          section: req.user.section || null,
          isOnboarded: !!req.user.isOnboarded,
        };

    return res.status(200).json({
      status: 'AUTHENTICATED',
      user: profile,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'SYSTEM_ERROR',
      message: 'Failed retrieving cadet telemetry.',
    });
  }
};

/**
 * POST /api/auth/logout
 * Stateless session disengagement acknowledgment
 */
const logout = (req, res) => {
  return res.status(200).json({
    status: 'DISENGAGED',
    message: 'Tactical session terminated. Clear local tokens.',
  });
};

/**
 * POST /api/auth/dev-login
 * Developer / Test environment mock authenticator
 * Automatically resolves student vs admin role based on ADMIN_EMAILS whitelist
 */
const devLogin = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      status: 'RESTRICTED',
      message: 'Dev authenticator disabled in production environment.',
    });
  }

  const { email = 'cadet.2024@nsut.ac.in', name = 'Cadet', role } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  // Strict domain enforcement even in test endpoint
  if (!cleanEmail.endsWith('@nsut.ac.in')) {
    return res.status(403).json({
      status: 'ACCESS_DENIED',
      code: 'UNAUTHORIZED_DOMAIN',
      message: 'Domain gate strictly enforced: Email must belong to @nsut.ac.in',
    });
  }

  // Automatic Role Resolution via Whitelist
  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@nsut.ac.in,command@nsut.ac.in,admin.terminal@nsut.ac.in')
    .split(',')
    .map((e) => e.trim().toLowerCase());

  const isInstitutionalAdmin = adminEmails.includes(cleanEmail);
  const assignedRole = isInstitutionalAdmin 
    ? 'admin' 
    : (role && ['student', 'admin'].includes(role) ? role : 'student');

  try {
    let user;

    // Active Database Mode
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = await User.create({
          googleId: `dev-google-${Date.now()}`,
          name,
          email: cleanEmail,
          role: assignedRole,
          isOnboarded: false,
        });
      } else {
        if (isInstitutionalAdmin && user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
        }
      }
    } else {
      // Offline / Pre-cluster Stub Mode for Local Dev Verification
      const mockId = '66b0a1c2' + Buffer.from(cleanEmail).toString('hex').padEnd(16, '0').slice(0, 16);
      user = {
        _id: mockId,
        id: mockId,
        name,
        email: cleanEmail,
        role: assignedRole,
        isOnboarded: false,
        toTacticalProfile() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            branch: this.branch || null,
            semester: this.semester || null,
            section: this.section || null,
            isOnboarded: this.isOnboarded,
          };
        },
      };
    }

    const token = signToken(user);

    return res.status(200).json({
      status: 'AUTHENTICATED',
      token,
      user: user.toTacticalProfile(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'SYSTEM_ERROR',
      message: error.message,
    });
  }
};

module.exports = {
  handleGoogleCallback,
  getMe,
  logout,
  devLogin,
  signToken,
};