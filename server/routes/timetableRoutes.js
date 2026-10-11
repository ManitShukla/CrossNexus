const express = require('express');
const router = express.Router();
const { getTimetable, upsertTimetable } = require('../controllers/timetableController');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

/**
 * @route   GET /api/timetable
 * @desc    Fetch cohort schedule matrix with query fallback
 * @access  Private (Authenticated Cadets)
 */
router.get('/', authenticateJWT, getTimetable);

/**
 * @route   POST /api/timetable
 * @desc    Bulk upsert cohort schedule matrix
 * @access  Private (Admin Only)
 */
router.post('/', authenticateJWT, requireAdmin, upsertTimetable);

module.exports = router;
