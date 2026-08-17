const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadSettings } = require('../middleware/upload.middleware');

const router = express.Router();

// Public auth endpoints
router.post('/register', uploadSettings.single('profileImage'), authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Protected auth endpoints
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/profile', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logoutUser);

module.exports = router;
