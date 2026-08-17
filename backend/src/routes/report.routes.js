const express = require('express');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', reportController.getReportData);
router.get('/data', reportController.getReportData);
router.get('/export/excel', reportController.exportReportExcel);
router.get('/export/pdf', reportController.exportReportPdf);

module.exports = router;
