const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'PDF_UPLOADED',
        'PDF_EXTRACTION_COMPLETED',
        'PDF_EXTRACTION_FAILED',
        'INVOICE_CREATED',
        'INVOICE_UPDATED',
        'INVOICE_MARKED_PAID',
        'INVOICE_DELETED',
        'PROFILE_UPDATED',
        'COMPANY_SETTINGS_UPDATED',
        'PASSWORD_CHANGED',
        'USER_REGISTERED',
        'USER_LOGGED_IN',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'REPORT_GENERATED',
        'REPORT_EXPORTED',
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Invoice', 'User', 'Company', 'PDF', 'Report', 'Auth'],
    },
    entityId: { type: String, default: null },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
