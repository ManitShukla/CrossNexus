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

    let user;

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-__v');
      if (!user) {
        return res.status(401).json({
          status: 'ACCESS_REVOKED',
          code: 'USER_NOT_FOUND',
          message: 'Account record does not exist or has been decommissioned.',
        });
      }
    } else {
      // Offline / Dev Stub Fallback
      user = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || 'Test Cadet',
        email: decoded.email || 'cadet@nsut.ac.in',
        role: decoded.role || 'student',
        isOnboarded: false,
        toTacticalProfile() {
          return {
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
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
