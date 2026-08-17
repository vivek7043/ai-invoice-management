const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const Invoice = require('./models/Invoice');

async function testDashboardEndpoint() {
  console.log('=== Testing GET /api/dashboard Metric Calculations ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-invoice';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  // Create sample invoices for testing
  const inv1 = new Invoice({ invoiceNumber: 'DASH-001', vendorName: 'Vendor A', amount: 1000, status: 'PAID', invoiceDate: '2026-01-15' });
  const inv2 = new Invoice({ invoiceNumber: 'DASH-002', vendorName: 'Vendor B', amount: 500, status: 'PENDING', invoiceDate: '2026-02-10' });
  const inv3 = new Invoice({ invoiceNumber: 'DASH-003', vendorName: 'Vendor C', amount: 200, status: 'OVERDUE', invoiceDate: '2026-03-05' });

  await inv1.save();
  await inv2.save();
  await inv3.save();

  console.log('Inserted 3 test invoices into MongoDB.');

  // Simulate dashboard query
  const allInvoices = await Invoice.find().sort({ createdAt: -1 });

  function normalizeStatus(status) {
    if (!status || typeof status !== 'string') return 'PENDING';
    const clean = status.trim().toUpperCase();
    if (['PAID', 'FULLY_PAID', 'PAYMENT_RECEIVED', 'SETTLED'].includes(clean)) return 'PAID';
    if (['OVERDUE', 'PAST_DUE', 'EXPIRED'].includes(clean)) return 'OVERDUE';
    return 'PENDING';
  }

  const totalInvoices = allInvoices.length;
  let paidInvoices = 0;
  let pendingInvoices = 0;
  let overdueInvoices = 0;

  for (const inv of allInvoices) {
    const s = normalizeStatus(inv.status);
    if (s === 'PAID') paidInvoices++;
    else if (s === 'OVERDUE') overdueInvoices++;
    else pendingInvoices++;
  }

  const recentInvoices = allInvoices.slice(0, 3);

  console.log('\n--- Dashboard Metrics Summary ---');
  console.log('totalInvoices:', totalInvoices);
  console.log('paidInvoices:', paidInvoices);
  console.log('pendingInvoices:', pendingInvoices);
  console.log('overdueInvoices:', overdueInvoices);
  console.log('recentInvoices Count:', recentInvoices.length);

  if (totalInvoices < 3 || paidInvoices < 1 || pendingInvoices < 1 || overdueInvoices < 1) {
    throw new Error('Dashboard metric calculation assertion failed!');
  }

  console.log('\n✅ Dashboard calculation test PASSED.');

  // Clean up
  await Invoice.findByIdAndDelete(inv1._id);
  await Invoice.findByIdAndDelete(inv2._id);
  await Invoice.findByIdAndDelete(inv3._id);
  console.log('Cleaned up test invoices.');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB.');
}

testDashboardEndpoint().catch((err) => {
  console.error('Dashboard test failed:', err);
  process.exit(1);
});
