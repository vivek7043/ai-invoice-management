const express = require('express');
const auditLogController = require('../controllers/auditLog.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', auditLogController.createManualAuditLog);
router.get('/', auditLogController.getAuditLogs);
router.get('/export', auditLogController.exportAuditLogs);

module.exports = router;
