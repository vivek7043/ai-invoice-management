const AuditLog = require('../models/AuditLog');
const { getCompanyFilter, cleanData } = require('../utils/cleanData');
const { createAuditLog } = require('../services/auditLog.service');

async function createManualAuditLog(req, res, next) {
  try {
    const { action, entityType, entityId, description, metadata } = req.body;

    if (!action || !entityType || !description) {
      return res.status(400).json({ message: 'action, entityType, and description are required' });
    }

    const companyId = req.user ? req.user.companyId : null;
    const userId = req.user ? req.user._id : null;
    const userName = req.user ? req.user.name : 'Owner';

    const logEntry = await createAuditLog({
      companyId,
      userId,
      userName,
      action,
      entityType,
      entityId,
      description,
      metadata,
    });

    return res.status(201).json({
      success: true,
      log: cleanData(logEntry ? logEntry.toObject() : {}),
    });
  } catch (error) {
    next(error);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const filter = getCompanyFilter(req);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').trim();

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const cleanLogs = logs.map((l) => cleanData(l));

    return res.status(200).json({
      success: true,
      count: cleanLogs.length,
      logs: cleanLogs,
      total,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
}

async function exportAuditLogs(req, res, next) {
  try {
    const filter = getCompanyFilter(req);
    const search = (req.query.search || '').trim();

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).lean();

    let csv = '\uFEFF';
    csv += 'Timestamp,User Name,Action,Entity Type,Entity ID,Description\n';

    for (const log of logs) {
      const time = log.createdAt ? new Date(log.createdAt).toISOString() : '';
      const uName = `"${(log.userName || 'Owner').replace(/"/g, '""')}"`;
      const action = `"${(log.action || '').replace(/"/g, '""')}"`;
      const entityType = `"${(log.entityType || '').replace(/"/g, '""')}"`;
      const entityId = `"${(log.entityId || '').replace(/"/g, '""')}"`;
      const desc = `"${(log.description || '').replace(/"/g, '""')}"`;

      csv += `${time},${uName},${action},${entityType},${entityId},${desc}\n`;
    }

    await createAuditLog({
      companyId: req.user ? req.user.companyId : null,
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Owner',
      action: 'REPORT_EXPORTED',
      entityType: 'Report',
      description: 'Audit logs exported as CSV',
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Audit_Logs.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createManualAuditLog,
  getAuditLogs,
  exportAuditLogs,
};
