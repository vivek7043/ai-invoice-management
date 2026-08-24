const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { createAuditLog } = require('./auditLog.service');

function formatDateKey(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const lastSyncMap = new Map();

async function syncInvoiceNotifications(userId = null, companyId = null) {
  try {
    const cacheKey = String(companyId || userId || 'global');
    const nowMs = Date.now();
    const lastSync = lastSyncMap.get(cacheKey) || 0;
    if (nowMs - lastSync < 10000) {
      // Synced within last 10 seconds for this workspace, skip redundant query loop
      return;
    }
    lastSyncMap.set(cacheKey, nowMs);

    const filter = companyId
      ? { companyId }
      : (userId ? { user: userId } : { companyId: new mongoose.Types.ObjectId() });

    const invoices = await Invoice.find(filter).lean();
    if (!invoices || invoices.length === 0) return;

    // Single bulk query for existing notifications to avoid N+1 queries
    const notifFilter = companyId
      ? { companyId }
      : (userId ? { userId } : {});
    const existingNotifs = await Notification.find(notifFilter).select('eventId invoiceId type').lean();

    const existingEventIds = new Set(existingNotifs.map((n) => n.eventId).filter(Boolean));
    const existingInvoiceTypeKeys = new Set(
      existingNotifs.map((n) => (n.invoiceId ? `${n.invoiceId}_${n.type}` : null)).filter(Boolean)
    );

    const today = new Date();
    const todayStr = formatDateKey(today);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    for (const inv of invoices) {
      const isPaid = (inv.status || '').toUpperCase() === 'PAID' || (inv.paymentStatus || '').toUpperCase() === 'PAID';
      if (isPaid) continue;

      const dueStr = inv.dueDate || inv.paymentDueDate;
      if (!dueStr) continue;

      const dueDt = new Date(dueStr);
      if (isNaN(dueDt.getTime())) continue;

      const dueMidnight = new Date(dueDt.getFullYear(), dueDt.getMonth(), dueDt.getDate()).getTime();
      const diffMs = dueMidnight - todayMidnight;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      const invNumber = inv.invoiceNumber || inv.fileName || 'Invoice';
      let notificationType = null;
      let notificationTitle = '';
      let notificationMsg = '';

      if (diffDays === 1) {
        notificationType = 'DUE_TOMORROW';
        notificationTitle = 'Payment Due Tomorrow';
        notificationMsg = `Invoice ${invNumber} is due tomorrow. Please make the payment.`;
      } else if (diffDays === 0) {
        notificationType = 'DUE_TODAY';
        notificationTitle = 'Payment Due Today';
        notificationMsg = `Invoice ${invNumber} is due today. Please make the payment.`;
      } else if (diffDays < 0) {
        notificationType = 'OVERDUE';
        notificationTitle = 'Invoice Overdue';
        notificationMsg = `Invoice ${invNumber} is overdue.`;
      }

      if (notificationType) {
        const eventId = `reminder_${inv._id}_${notificationType}_${todayStr}`;
        const invTypeKey = `${inv._id}_${notificationType}`;

        const exists = existingEventIds.has(eventId) || existingInvoiceTypeKeys.has(invTypeKey);

        if (!exists) {
          try {
            const newNotif = new Notification({
              companyId: inv.companyId || companyId,
              userId: inv.user || userId,
              type: notificationType,
              eventId,
              invoiceId: inv._id,
              title: notificationTitle,
              message: notificationMsg,
              isRead: false,
            });
            await newNotif.save();

            existingEventIds.add(eventId);
            existingInvoiceTypeKeys.add(invTypeKey);

            await createAuditLog({
              companyId: inv.companyId || companyId,
              userId: inv.user || userId,
              userName: 'System',
              action: 'PAYMENT_REMINDER_SENT',
              entityType: 'Invoice',
              entityId: String(inv._id),
              description: `Payment reminder sent for invoice ${invNumber}`,
            });
          } catch (err) {
            console.error(`Error saving invoice notification (type: ${notificationType}, invoiceId: ${inv._id}):`, err.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error syncing invoice notifications:', error.message);
  }
}

async function createInvoiceUploadNotification(invoiceDoc, reviewRequired = false) {
  try {
    if (!invoiceDoc || !invoiceDoc._id) return;

    const invNumber = invoiceDoc.invoiceNumber || invoiceDoc.fileName || 'Invoice';
    const type = reviewRequired ? 'REVIEW_REQUIRED' : 'UPLOAD_SUCCESS';
    const title = reviewRequired ? 'Invoice Review Required' : 'Invoice Uploaded';
    const message = reviewRequired
      ? `Invoice ${invNumber} needs review because some information could not be extracted.`
      : `New invoice ${invNumber} has been added.`;
    const eventId = `upload_${invoiceDoc._id}_${type}`;

    console.log('Creating upload notification:', {
      invoiceId: String(invoiceDoc._id),
      type,
      eventId,
      eventIdType: typeof eventId,
    });

    const existing = await Notification.findOne({
      $or: [
        { eventId },
        { invoiceId: invoiceDoc._id, type },
      ],
    });

    if (!existing) {
      const notif = new Notification({
        companyId: invoiceDoc.companyId || null,
        userId: invoiceDoc.user || null,
        type,
        eventId,
        invoiceId: invoiceDoc._id,
        title,
        message,
        isRead: false,
      });

      console.log('Notification eventId before save:', notif.eventId);

      await notif.save();
    }
  } catch (err) {
    console.error(`Error creating invoice upload notification (invoiceId: ${invoiceDoc?._id}):`, err.message);
  }
}

async function ensureNotificationIndexes() {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: 'notifications' }).toArray();
    if (collections.length === 0) {
      await Notification.createCollection();
    }

    const indexList = await Notification.collection.listIndexes().toArray();
    console.log('Current notifications collection indexes:', indexList.map((i) => i.name));

    const eventIdIndex = indexList.find((idx) => idx.name === 'eventId_1');

    if (eventIdIndex) {
      const isUnique = !!eventIdIndex.unique;
      const partialExpr = eventIdIndex.partialFilterExpression;
      const hasCorrectPartial = !!(
        partialExpr &&
        partialExpr.eventId &&
        (partialExpr.eventId.$type === 'string' || partialExpr.eventId['$type'] === 'string')
      );

      if (!isUnique || !hasCorrectPartial) {
        console.log(`⚠️ Incompatible eventId_1 index found (isUnique: ${isUnique}, hasCorrectPartial: ${hasCorrectPartial}). Dropping index...`);
        await Notification.collection.dropIndex('eventId_1');
        console.log('✅ Dropped incompatible eventId_1 index successfully.');
      } else {
        console.log('✅ Existing eventId_1 index is already a unique index with correct partialFilterExpression.');
      }
    }

    await Notification.syncIndexes();
    console.log('✅ Notification indexes synchronized (eventId_1 partial unique index).');
  } catch (err) {
    console.error('Error during notification index verification:', err.message);
  }
}

module.exports = {
  syncInvoiceNotifications,
  createInvoiceUploadNotification,
  ensureNotificationIndexes,
};
