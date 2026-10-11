const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getResources,
  uploadResource,
  toggleVerifyResource,
  deleteResource,
} = require('../controllers/vaultController');
const authMiddleware = require('../middleware/authMiddleware');
const authenticateJWT = authMiddleware.authenticateJWT || authMiddleware;
const { requireAdmin } = require('../middleware/roleMiddleware');

// Configure Multer for streaming file buffers directly in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max tactical limit
  },
});

/**
 * @route   GET /api/vault
 * @desc    Fetch query-filtered academic vault resources
 * @access  Private (Authenticated Cadets)
 */
router.get('/', authenticateJWT, getResources);

/**
 * @route   POST /api/vault/upload
 * @desc    Upload file buffer to Pinata/IPFS and persist cryptographic metadata
 * @access  Private (Authenticated Cadets)
 */
router.post('/upload', authenticateJWT, upload.single('file'), uploadResource);

/**
 * @route   PATCH /api/vault/:id/verify
 * @desc    Toggle cryptographic verification status of a vault resource
 * @access  Private (Admin Role Only)
 */
router.patch('/:id/verify', authenticateJWT, requireAdmin, toggleVerifyResource);

/**
 * @route   DELETE /api/vault/:id
 * @desc    Decommission resource record from the active vault registry
 * @access  Private (Owner Cadet or Admin)
 */
router.delete('/:id', authenticateJWT, deleteResource);

module.exports = router;
