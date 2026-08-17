const express = require('express');
const vendorController = require('../controllers/vendor.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', vendorController.getVendors);
router.get('/:key', vendorController.getVendorByKey);

module.exports = router;
