const mongoose = require('mongoose');

function hasMeaningfulValue(val) {
  if (val === null || val === undefined) return false;
  if (val instanceof Date) return !isNaN(val.getTime());
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '—' || s === '-') return false;
    return true;
  }
  if (typeof val === 'number') return !isNaN(val);
  if (typeof val === 'boolean') return true;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') {
    if (val instanceof mongoose.Types.ObjectId || val._bsontype === 'ObjectId' || val.constructor?.name === 'ObjectId') return true;
    return Object.keys(val).length > 0;
  }
  return true;
}

function cleanData(obj) {
  if (obj === null || obj === undefined) return undefined;

  // Preserve Date instances as ISO strings
  if (obj instanceof Date) {
    return isNaN(obj.getTime()) ? undefined : obj.toISOString();
  }

  // Handle String dates / primitives
  if (typeof obj === 'string') {
    return hasMeaningfulValue(obj) ? obj.trim() : undefined;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return hasMeaningfulValue(obj) ? obj : undefined;
  }

  // Handle Mongoose / BSON ObjectId
  if (obj && (obj instanceof mongoose.Types.ObjectId || obj._bsontype === 'ObjectId' || obj.constructor?.name === 'ObjectId')) {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    const cleanedArr = obj
      .map((item) => (typeof item === 'object' && item !== null ? cleanData(item) : item))
      .filter((item) => hasMeaningfulValue(item));
    return cleanedArr.length > 0 ? cleanedArr : undefined;
  }

  if (typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      let cleanedVal;
      if (val instanceof Date) {
        cleanedVal = isNaN(val.getTime()) ? undefined : val.toISOString();
      } else if (val && (val instanceof mongoose.Types.ObjectId || val._bsontype === 'ObjectId' || val.constructor?.name === 'ObjectId')) {
        cleanedVal = val.toString();
      } else if (typeof val === 'object' && val !== null) {
        cleanedVal = cleanData(val);
      } else {
        cleanedVal = val;
      }

      if (hasMeaningfulValue(cleanedVal)) {
        res[key] = cleanedVal;
      }
    }
    return Object.keys(res).length > 0 ? res : undefined;
  }

  return hasMeaningfulValue(obj) ? obj : undefined;
}

function cleanObjectFields(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (hasMeaningfulValue(val)) {
      cleaned[key] = typeof val === 'string' ? val.trim() : val;
    }
  }
  return cleaned;
}

function getCompanyFilter(req) {
  if (req && req.user && req.user.companyId) {
    return { companyId: req.user.companyId };
  }
  return { companyId: new mongoose.Types.ObjectId() };
}

function normalizeStatus(status) {
  if (!status || typeof status !== 'string') return 'PENDING';
  const clean = status.trim().toUpperCase();
  if (['PAID', 'FULLY_PAID', 'PAYMENT_RECEIVED', 'SETTLED'].includes(clean)) return 'PAID';
  if (['OVERDUE', 'PAST_DUE', 'EXPIRED'].includes(clean)) return 'OVERDUE';
  return 'PENDING';
}

function isInvoiceOverdue(inv) {
  const status = (inv.status || '').toUpperCase();
  const payStatus = (inv.paymentStatus || '').toUpperCase();
  if (status === 'OVERDUE' || payStatus === 'OVERDUE') return true;
  if (status === 'PAID' || payStatus === 'PAID') return false;

  const dueStr = inv.dueDate || inv.paymentDueDate;
  if (dueStr) {
    const dueTime = new Date(dueStr).getTime();
    if (!isNaN(dueTime) && dueTime < Date.now()) {
      return true;
    }
  }
  return false;
}

module.exports = {
  hasMeaningfulValue,
  cleanData,
  cleanObjectFields,
  getCompanyFilter,
  normalizeStatus,
  isInvoiceOverdue,
};
