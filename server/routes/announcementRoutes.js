const express = require('express');
const {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const authenticateJWT = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// Publicly authenticated reading
router.get('/', authenticateJWT, getAnnouncements);

// Admin-only mutation sentry
router.post('/', authenticateJWT, requireAdmin, createAnnouncement);
router.delete('/:id', authenticateJWT, requireAdmin, deleteAnnouncement);

module.exports = router;