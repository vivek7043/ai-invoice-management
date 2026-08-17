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

async function runDynamicInvoiceTests() {
  console.log('=== Testing Dynamic Data-Driven Invoice Architecture ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-invoice';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  // Test 1: Generic Demo Invoice with minimal fields and lots of null/N/A entries
  const dirtyGenericData = {
    invoiceNumber: 'GEN-2026-001',
    vendorName: 'Generic Vendor Ltd',
    amount: 1500.00,
    status: 'PAID',
    invoiceDate: '2026-08-01',
    dueDate: '2026-08-15',
    customerName: null,
    customerTaxId: 'N/A',
    notes: '',
    paymentTerms: undefined,
    taxes: [],
    customField: null,
    lineItems: [
      { description: 'Consulting Services', unitPrice: 1500, lineTotal: 1500, itemCode: null, hsnSac: '' }
    ]
  };

  const cleanGeneric = cleanData(dirtyGenericData);

  console.log('--- Test 1: Cleaned Generic Data ---');
  console.log('Keys in cleanGeneric:', Object.keys(cleanGeneric));
  if (cleanGeneric.customerName !== undefined || cleanGeneric.customerTaxId !== undefined || cleanGeneric.notes !== undefined) {
    throw new Error('cleanData failed: null/empty/N/A fields were not removed!');
  }
  console.log('✅ Cleaned Generic Data successfully stripped all null/N/A/empty entries.');

  const inv1 = new Invoice({
    invoiceNumber: cleanGeneric.invoiceNumber,
    vendorName: cleanGeneric.vendorName,
    amount: cleanGeneric.amount,
    status: cleanGeneric.status,
    extractedData: cleanGeneric
  });
  await inv1.save();

  // Test 2: Indian GST Invoice with GST-specific fields
  const dirtyGstData = {
    invoiceNumber: 'GST-2026-99',
    vendorName: 'VM Technology',
    vendorTaxId: '27AAAAA0000A1Z5',
    gstin: '27AAAAA0000A1Z5',
    cgst: 90.00,
    sgst: 90.00,
    totalTax: 180.00,
    placeOfSupply: 'Maharashtra (27)',
    amount: 1180.00,
    status: 'PENDING',
    paymentMethod: null,
    bankName: '',
    vat: undefined,
    lineItems: [
      { description: 'Hardware Equipment', hsnSac: '8471', quantity: 1, unitPrice: 1000, lineTotal: 1000 }
    ]
  };

  const cleanGst = cleanData(dirtyGstData);
  console.log('\n--- Test 2: Cleaned GST Data ---');
  console.log('Keys in cleanGst:', Object.keys(cleanGst));
  console.log('GST Fields Present:', { csgt: cleanGst.cgst, sgst: cleanGst.sgst, placeOfSupply: cleanGst.placeOfSupply });
  if (cleanGst.paymentMethod !== undefined || cleanGst.bankName !== undefined || cleanGst.vat !== undefined) {
    throw new Error('cleanData failed for GST invoice!');
  }
  console.log('✅ Cleaned GST Data successfully kept GST-specific fields while stripping empty payment/VAT fields.');

  const inv2 = new Invoice({
    invoiceNumber: cleanGst.invoiceNumber,
    vendorName: cleanGst.vendorName,
    amount: cleanGst.amount,
    status: cleanGst.status,
    extractedData: cleanGst
  });
  await inv2.save();

  // Clean up
  await Invoice.findByIdAndDelete(inv1._id);
  await Invoice.findByIdAndDelete(inv2._id);
  console.log('\nCleaned up test MongoDB documents.');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB.');
}

runDynamicInvoiceTests().catch((err) => {
  console.error('Dynamic invoice test failed:', err);
  process.exit(1);
});
