const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Invoice = require('./models/Invoice');

async function testMongoDBSave() {
  console.log('=== Testing MongoDB Invoice Storage ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-invoice';
  console.log('Connecting to MongoDB at:', mongoUri);

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  const sampleData = {
    invoiceNumber: 'TEST-INV-2026-999',
    vendorName: 'Test Vendor Solutions Ltd',
    amount: 1500.50,
    status: 'PENDING',
    invoiceDate: '2026-08-12',
    dueDate: '2026-08-26',
    fileName: 'sample_test_invoice.pdf',
    filePath: '/uploads/invoices/sample_test_invoice.pdf',
  };

  const invoiceDoc = new Invoice(sampleData);
  const saved = await invoiceDoc.save();

  console.log('\nSaved Document ID:', saved._id.toString());
  console.log('Saved invoiceNumber:', saved.invoiceNumber);
  console.log('Saved vendorName:', saved.vendorName);
  console.log('Saved amount:', saved.amount);
  console.log('Saved status:', saved.status);
  console.log('Saved invoiceDate:', saved.invoiceDate);
  console.log('Saved dueDate:', saved.dueDate);
  console.log('Saved createdAt:', saved.createdAt);
  console.log('Saved updatedAt:', saved.updatedAt);

  const found = await Invoice.findById(saved._id);
  if (!found) {
    throw new Error('Invoice document not found in MongoDB after save!');
  }

  console.log('\n✅ Successfully retrieved invoice document from MongoDB collection "invoices"');

  // Clean up test document
  await Invoice.findByIdAndDelete(saved._id);
  console.log('Cleaned up test document.');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB.');
}

testMongoDBSave().catch((err) => {
  console.error('MongoDB test failed:', err);
  process.exit(1);
});
