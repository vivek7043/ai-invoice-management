const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const Invoice = require('./models/Invoice');

function hasMeaningfulValue(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '—' || s === '-') return false;
    return true;
  }
  if (typeof val === 'number') return !isNaN(val);
  if (typeof val === 'boolean') return true;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return true;
}

function cleanData(obj) {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    const cleanedArr = obj
      .map((item) => (typeof item === 'object' ? cleanData(item) : item))
      .filter((item) => hasMeaningfulValue(item));
    return cleanedArr.length > 0 ? cleanedArr : undefined;
  }
  if (typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const cleanedVal = (typeof val === 'object' && val !== null) ? cleanData(val) : val;
      if (hasMeaningfulValue(cleanedVal)) {
        res[key] = cleanedVal;
      }
    }
    return Object.keys(res).length > 0 ? res : undefined;
  }
  return hasMeaningfulValue(obj) ? obj : undefined;
}

async function runComprehensiveSchemaTests() {
  console.log('=== Testing Comprehensive Invoice Mongoose Schema & Save ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-invoice';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  // Test VM Technology GST Invoice payload
  const vmInvoicePayload = {
    invoiceNumber: 'VMT/2026-27/042',
    vendorName: 'VM Technology Pvt. Ltd.',
    GSTIN: '27AABCV1234F1ZB',
    customerName: 'Apex Global Solutions',
    subtotal: 180000,
    cgst: 16200,
    sgst: 16200,
    totalTax: 32400,
    totalAmount: 212400,
    amount: 212400,
    status: 'PENDING',
    placeOfSupply: 'Maharashtra (27)',
    bankName: 'HDFC Bank',
    accountNumber: '50200012345678',
    IFSC: 'HDFC0000123',
    UPI: 'vmtech@hdfcbank',
    lineItems: [
      {
        description: 'Server Rack Installation & Config',
        HSN: '8471',
        quantity: 2,
        unitPrice: 90000,
        taxRate: 18,
        taxAmount: 32400,
        lineTotal: 212400
      }
    ]
  };

  const invoiceDoc = new Invoice(vmInvoicePayload);
  const savedInvoice = await invoiceDoc.save();

  console.log('✅ Saved VM Technology Invoice to MongoDB with ID:', savedInvoice._id.toString());
  console.log('Saved document fields check:', {
    invoiceNumber: savedInvoice.invoiceNumber,
    vendorName: savedInvoice.vendorName,
    GSTIN: savedInvoice.GSTIN,
    customerName: savedInvoice.customerName,
    subtotal: savedInvoice.subtotal,
    totalAmount: savedInvoice.totalAmount,
    bankName: savedInvoice.bankName,
    UPI: savedInvoice.UPI,
    IFSC: savedInvoice.IFSC,
    lineItemsCount: savedInvoice.lineItems.length
  });

  // Verify cleaned GET object
  const cleanedResult = cleanData(savedInvoice.toObject());
  console.log('\nKeys returned in cleaned object:', Object.keys(cleanedResult));

  if (cleanedResult.VATNumber !== undefined || cleanedResult.customerVATNumber !== undefined || cleanedResult.shippingMethod !== undefined) {
    throw new Error('cleanData failed: unpopulated schema fields were not cleaned from GET response!');
  }

  console.log('✅ Cleaned GET response contains only populated fields.');

  // Clean up
  await Invoice.findByIdAndDelete(savedInvoice._id);
  console.log('Cleaned up test document.');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB.');
}

runComprehensiveSchemaTests().catch((err) => {
  console.error('Comprehensive schema test failed:', err);
  process.exit(1);
});
