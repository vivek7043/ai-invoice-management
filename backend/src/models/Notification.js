const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    type: {
      type: String,
      enum: ['DUE_TOMORROW', 'DUE_TODAY', 'OVERDUE', 'UPLOAD_SUCCESS', 'REVIEW_REQUIRED', 'PAYMENT_RECEIVED', 'INFO'],
      required: true,
    },
    eventId: { type: String, default: undefined },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ companyId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index(
  { eventId: 1 },
  {
    unique: true,
    partialFilterExpression: { eventId: { $type: 'string' } },
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
