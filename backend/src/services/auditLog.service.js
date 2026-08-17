const AuditLog = require('../models/AuditLog');

async function createAuditLog({
  companyId = null,
  userId = null,
  userName = 'Owner',
  action,
  entityType,
  entityId = null,
  description,
  metadata = {},
}) {
  try {
    if (!action || !entityType || !description) {
      console.warn('Audit log missing required fields:', { action, entityType, description });
      return null;
    }

    const logEntry = new AuditLog({
      companyId,
      userId,
      userName: userName || 'Owner',
      action,
      entityType,
      entityId,
      description,
      metadata,
    });

    const savedLog = await logEntry.save();
    return savedLog;
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
    return null;
  }
}

module.exports = {
  createAuditLog,
};
