/**
 * SEKALARUPA STUDIO - Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.get('/setup-status', authController.getSetupStatus);
router.post('/setup', authController.setupInitialAdmin);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/change-password', requireAuth, authController.changePassword);

module.exports = router;
