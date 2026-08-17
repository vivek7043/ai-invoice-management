const express = require('express');
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadSettings } = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', settingsController.getProfile);
router.put('/profile', uploadSettings.single('profileImage'), settingsController.updateProfile);
router.get('/company', settingsController.getCompanySettings);
router.put('/company', uploadSettings.single('companyLogo'), settingsController.updateCompanySettings);
router.put('/password', settingsController.changePassword);

module.exports = router;
