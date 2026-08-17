const { extractInvoiceFields, extractWithRuleBasedAI } = require('./services/aiService');
const fs = require('fs');
const path = require('path');

async function testRuleBasedExtraction() {
  console.log('=== Test 1: Rule-Based Extraction with Various Formats ===\n');

  const sample1 = `
  ACME Supplies Inc.
  123 Main Street, Suite 400
  TAX INVOICE
  Invoice No: INV-2026-9988
  Date: 2026-08-10
  Due Date: 2026-09-10
  
  Description        Qty    Price     Total
  Office Supplies    1      150.00    150.00
  Shipping           1       25.00     25.00
  
  Grand Total: $175.00
  Status: PAID
  `;

  const result1 = extractWithRuleBasedAI(sample1);
  console.log('Sample 1 Result:');
  console.log(JSON.stringify(result1, null, 2));

  const sample2 = `
  Global Logistics Corp
  Bill No: BL-88412
  Billing Date: 05/12/2026
  Payment Due: 06/12/2026
  
  Amount Due: ₹ 45,200.50
  `;

  const result2 = extractWithRuleBasedAI(sample2);
  console.log('\nSample 2 Result:');
  console.log(JSON.stringify(result2, null, 2));

  const sample3 = `
  Random Scanned Text Without Invoice Fields
  Hello World, this is not an invoice document at all.
  Page 1 of 1
  `;

  const result3 = extractWithRuleBasedAI(sample3);
  console.log('\nSample 3 (Non-invoice text) Result:');
  console.log(JSON.stringify(result3, null, 2));
}

async function testUploadAPI() {
  console.log('\n=== Test 2: Upload API Endpoint Structured Output ===\n');
  
  // Start fresh test server instance to verify fresh invoiceRoutes code
  const express = require('express');
  const app = express();
  const invoiceRoutes = require('./routes/invoiceRoutes');
  app.use(express.json());
  
  // Mock auth route for testing
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test_secret';
  const testToken = jwt.sign({ userId: '123' }, secret);
  
  app.use('/api/invoices', invoiceRoutes);
  
  const server = app.listen(5005);
  const baseUrl = 'http://localhost:5005/api';

  const uploadDir = path.join(__dirname, 'uploads', 'invoices');
  const pdfFiles = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf'));
  
  if (pdfFiles.length === 0) {
    console.log('No PDF found in uploads/invoices, skipping API test.');
    return;
  }

  // Pick a real pdf file that has text
  const targetPdf = pdfFiles.find(f => f.includes('Vivek') || f.includes('MINI')) || pdfFiles[0];
  const samplePath = path.join(uploadDir, targetPdf);
  console.log('Testing upload with file:', targetPdf);

  const fileBuffer = fs.readFileSync(samplePath);
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), targetPdf);

  const uploadRes = await fetch(`${baseUrl}/invoices/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${testToken}` },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log('API Upload Status:', uploadRes.status);
  console.log('API Response payload:');
  console.log(JSON.stringify(uploadData, null, 2));

  server.close();

  if (!uploadData.extractedData) {
    throw new Error('FAILED: extractedData field missing from upload API response');
  }

  console.log('\nSUCCESS: API returned structured extractedData payload!');
}

(async () => {
  try {
    await testRuleBasedExtraction();
    await testUploadAPI();
  } catch (err) {
    console.error('Test execution error:', err && (err.stack || err.message || err));
    process.exit(1);
  }
})();
