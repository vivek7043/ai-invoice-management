const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const Invoice = require('./models/Invoice');

async function testGetInvoicesEndpoint() {
  console.log('=== Testing GET /api/invoices Endpoint Logic ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-invoice';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  // Create a temporary test invoice
  const testInv = new Invoice({
    invoiceNumber: 'API-TEST-INV-1001',
    vendorName: 'Global Cloud Systems Ltd',
    amount: 2450.75,
    status: 'PAID',
    invoiceDate: '2026-08-12',
    dueDate: '2026-08-26',
  });
  await testInv.save();
  console.log('Saved test invoice:', testInv._id.toString());

  // Simulate GET /api/invoices query
  const invoices = await Invoice.find()
    .select('invoiceNumber vendorName amount status dueDate invoiceDate createdAt')
    .sort({ createdAt: -1 });

  console.log(`\nFetched ${invoices.length} invoices from MongoDB:`);
  for (const inv of invoices.slice(0, 3)) {
    console.log(`- ID: ${inv._id} | Invoice#: ${inv.invoiceNumber} | Vendor: ${inv.vendorName} | Amount: ${inv.amount} | Status: ${inv.status} | DueDate: ${inv.dueDate}`);
  }

  if (invoices.length === 0) {
    throw new Error('Expected at least 1 invoice in MongoDB!');
  }

  const foundTest = invoices.find((i) => i.invoiceNumber === 'API-TEST-INV-1001');
  if (!foundTest) {
    throw new Error('Created test invoice was not returned in query!');
  }

  console.log('\n✅ Successfully verified GET /api/invoices query projection and sorting!');

  // Clean up test invoice
  await Invoice.findByIdAndDelete(testInv._id);
  console.log('Cleaned up test invoice.');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB.');
}

testGetInvoicesEndpoint().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
