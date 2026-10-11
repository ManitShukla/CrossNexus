const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Tactical JWT Authentication Gate
 * Verifies Bearer token, validates expiry, and attaches authenticated cadet to req.user.
 */
const authenticateJWT = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        status: 'UNAUTHORIZED',
        code: 'MISSING_CREDENTIALS',
        message: 'Tactical authentication token required. Access denied.',
      });
    }

    const secret = process.env.JWT_SECRET || 'TACTICAL_ALPHA_KEY_SECURE_9812739182371982_CROSSNEXUS';
    const decoded = jwt.verify(token, secret);

    let user = null;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id).select('-__v');
      } catch (dbErr) {
        console.warn('[AUTH_DB_FALLBACK] Database lookup failed, using token claims:', dbErr.message);
      }
    }

    // If user not in database (e.g. demo session or degraded offline mode), construct verified session from JWT claims
    if (!user) {
      const fallbackRole = decoded.role || 'student';
      const fallbackBranch = decoded.branch || (fallbackRole === 'admin' ? 'ECE' : 'IT');
      const fallbackSemester = decoded.semester || (fallbackRole === 'admin' ? 3 : 1);
      const fallbackSection = decoded.section || (fallbackRole === 'admin' ? '3' : '1');

      user = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || (fallbackRole === 'admin' ? 'Campus Administrator' : 'Student'),
        email: decoded.email || (fallbackRole === 'admin' ? 'admin@nsut.ac.in' : 'student@nsut.ac.in'),
        role: fallbackRole,
        branch: fallbackBranch,
        semester: fallbackSemester,
        section: fallbackSection,
        isOnboarded: true,
        toTacticalProfile() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            branch: this.branch,
            semester: this.semester,
            section: this.section,
            isOnboarded: this.isOnboarded,
          };
        },
      };
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'SESSION_EXPIRED',
        code: 'TOKEN_EXPIRED',
        message: 'Tactical security session expired. Re-authenticate.',
      });
    }

    return res.status(401).json({
      status: 'SIGNATURE_INVALID',
      code: 'TOKEN_MALFORMED',
      message: 'Cryptographic signature verification failed.',
    });
  }
};

authenticateJWT.authenticateJWT = authenticateJWT;
module.exports = authenticateJWT;
