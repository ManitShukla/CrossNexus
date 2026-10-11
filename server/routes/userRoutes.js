const express = require('express');
const { onboardUser, getUserProfile } = require('../controllers/userController');
const authenticateJWT = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateJWT);

router.put('/onboard', onboardUser);
router.get('/profile', getUserProfile);

module.exports = router;