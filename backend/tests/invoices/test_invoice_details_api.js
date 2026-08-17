const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const Invoice = require('./models/Invoice');

async function testInvoiceDetailsAPI() {
  console.log('=== Testing GET /api/invoices/:id Endpoint ===\n');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-invoice';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  const sampleData = {
    invoiceNumber: 'INV-DETAILS-TEST-2026',
    vendorName: 'Acme Systems Pvt Ltd',
    amount: 5400.00,
    status: 'PAID',
    invoiceDate: '2026-08-12',
    dueDate: '2026-08-26',
    fileName: 'test_invoice_details.pdf',
    filePath: '/uploads/invoices/test_invoice_details.pdf',
    extractedData: {
      invoiceNumber: 'INV-DETAILS-TEST-2026',
      invoiceType: 'Commercial Invoice',
      invoiceDate: '2026-08-12',
      dueDate: '2026-08-26',
      status: 'PAID',
      currency: 'USD',
      vendorName: 'Acme Systems Pvt Ltd',
      vendorLegalName: 'Acme Systems Private Limited',
      vendorAddress: '123 Tech Park, Bangalore, KA, India',
      vendorEmail: 'billing@acmesystems.com',
      vendorPhone: '+91-9876543210',
      vendorTaxId: '29ABCDE1234F1Z5',
      customerName: 'Global Enterprises Inc',
      customerLegalName: 'Global Enterprises Corporation',
      customerAddress: '456 Business Way, New York, NY, USA',
      customerEmail: 'ap@globalenterprises.com',
      customerPhone: '+1-800-555-0199',
      customerTaxId: 'US-987654321',
      billTo: 'Global Enterprises Inc',
      billingAddress: '456 Business Way, New York, NY, USA',
      shippingAddress: '456 Business Way, New York, NY, USA',
      lineItems: [
        {
          description: 'Cloud Server Hosting & Infrastructure Services',
          itemCode: 'SKU-CS-01',
          hsnSac: '998313',
          quantity: 2,
          unit: 'Units',
          unitPrice: 2000,
          discount: 0,
          taxRate: 18,
          taxAmount: 720,
          lineTotal: 4720,
        },
        {
          description: 'Technical Support & SLA Coverage',
          itemCode: 'SKU-TS-02',
          hsnSac: '998314',
          quantity: 1,
          unit: 'Month',
          unitPrice: 680,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          lineTotal: 680,
        },
      ],
      subtotal: 4680,
      discount: 0,
      shippingCharges: 0,
      otherCharges: 0,
      totalTax: 720,
      totalAmount: 5400,
      paymentStatus: 'PAID',
      paymentMethod: 'Bank Wire Transfer',
      paymentTerms: 'Net 14',
      bankName: 'HDFC Bank',
      accountNumber: '998877665544',
      ifscCode: 'HDFC0001234',
    },
  };

  const invoice = new Invoice(sampleData);
  await invoice.save();
  console.log('Saved test invoice with ID:', invoice._id.toString());

  // Query by ID
  const found = await Invoice.findById(invoice._id);
  if (!found) {
    throw new Error('Failed to find invoice by ID in MongoDB!');
  }

  console.log('\nRetrieved Invoice Details:');
  console.log('- invoiceNumber:', found.invoiceNumber);
  console.log('- vendorName:', found.vendorName);
  console.log('- amount:', found.amount);
  console.log('- status:', found.status);
  console.log('- lineItems count:', found.extractedData.lineItems.length);
  console.log('- lineItem #1:', found.extractedData.lineItems[0].description);

  // Clean up
  await Invoice.findByIdAndDelete(invoice._id);
  console.log('\nCleaned up test invoice.');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB.');
}

testInvoiceDetailsAPI().catch((err) => {
  console.error('Invoice details API test failed:', err);
  process.exit(1);
});
