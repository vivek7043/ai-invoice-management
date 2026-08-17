const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { cleanData } = require('./src/utils/cleanData');
const User = require('./src/models/User');
const Invoice = require('./src/models/Invoice');
const AuditLog = require('./src/models/AuditLog');
const Notification = require('./src/models/Notification');

async function testRepairs() {
  console.log('--- STARTING VERIFICATION TEST ---');
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_invoice';
  await mongoose.connect(mongoUrl);
  console.log('✅ Connected to MongoDB:', mongoUrl);

  // 1. Test cleanData
  const sampleDoc = {
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date('2026-08-17T08:55:02.822Z'),
    dueDate: '2026-08-22',
    vendorName: 'Acme Corp',
    amount: 1500,
    status: 'PENDING',
  };
  const cleanedSample = cleanData(sampleDoc);
  console.log('\n--- 1. Testing cleanData ---');
  console.log('Cleaned createdAt:', cleanedSample.createdAt);
  console.log('Cleaned _id:', cleanedSample._id);
  console.log('Cleaned dueDate:', cleanedSample.dueDate);
  if (typeof cleanedSample.createdAt === 'string' && typeof cleanedSample._id === 'string' && cleanedSample.dueDate === '2026-08-22') {
    console.log('PASSED: cleanData preserves Date and ObjectId!');
  } else {
    console.error('FAILED: cleanData output unexpected', cleanedSample);
  }

  // 2. Test Invoices in DB
  console.log('\n--- 2. Checking Invoices in Database ---');
  const invoices = await Invoice.find().sort({ createdAt: -1 }).lean();
  console.log(`Found ${invoices.length} invoices in database.`);
  invoices.forEach((inv, i) => {
    const cleaned = cleanData(inv);
    console.log(`Invoice #${i + 1}: ID=${cleaned._id}, Number=${cleaned.invoiceNumber}, Vendor=${cleaned.vendorName}, DueDate=${cleaned.dueDate || 'Not available'}, Amount=${cleaned.amount}`);
  });

  // 3. Test Audit Logs in DB
  console.log('\n--- 3. Checking Audit Logs in Database ---');
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(5).lean();
  console.log(`Found ${logs.length} recent audit logs.`);
  logs.forEach((log, i) => {
    const cleaned = cleanData(log);
    console.log(`Log #${i + 1}: Action=${cleaned.action}, Time=${cleaned.createdAt}, Description=${cleaned.description}`);
  });

  // 4. Test Sync & Check Notifications
  console.log('\n--- 4. Checking Notifications in Database ---');
  const { syncInvoiceNotifications } = require('./src/services/notification.service');
  const owner = await User.findOne({ role: 'owner' });
  if (owner) {
    await syncInvoiceNotifications(owner._id, owner.companyId);
    const notifications = await Notification.find({ companyId: owner.companyId }).sort({ createdAt: -1 }).lean();
    console.log(`Found ${notifications.length} notifications for company ${owner.companyId}:`);
    notifications.forEach((n, i) => {
      const cleaned = cleanData(n);
      console.log(`Notif #${i + 1}: Type=${cleaned.type}, Title="${cleaned.title}", Time=${cleaned.createdAt}, Msg="${cleaned.message}"`);
    });
  } else {
    console.log('No owner user found.');
  }

  await mongoose.disconnect();
  console.log('\n--- VERIFICATION FINISHED SUCCESSFULLY ---');
}

testRepairs().catch((err) => {
  console.error('Verification failed:', err);
  mongoose.disconnect();
});
