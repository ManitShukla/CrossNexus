const express = require('express');
const router = express.Router();
const { getVapidPublicKey, subscribe } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const authenticateJWT = authMiddleware.authenticateJWT || authMiddleware;

// Public route to retrieve VAPID key
router.get('/vapid-key', getVapidPublicKey);

// Optional auth: enroll user ID if available, or allow guest subscription
router.post('/subscribe', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateJWT(req, res, next);
  }
  next();
}, subscribe);

module.exports = router;
