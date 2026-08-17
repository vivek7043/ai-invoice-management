const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { extractInvoiceFields } = require('./services/aiService');

const samplePdfPath = path.join(__dirname, 'uploads', 'invoices', '1786524384032-977918345-invoice_INV-2026-001.pdf');

async function testE2E() {
  console.log('=== End-to-End PDF Extraction & AI Parsing Test ===');

  const dataBuffer = fs.readFileSync(samplePdfPath);
  const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
  const textResult = await parser.getText({ pageJoiner: '\n' });
  await parser.destroy();

  const directText = textResult.text.trim();
  console.log('Direct Extracted Text Length:', directText.length);

  const extractedData = await extractInvoiceFields(directText);
  console.log('\n--- AI EXTRACTED SCHEMA RESULT ---');
  console.log(JSON.stringify({
    invoiceNumber: extractedData.invoiceNumber,
    vendorName: extractedData.vendorName,
    customerName: extractedData.customerName,
    invoiceDate: extractedData.invoiceDate,
    dueDate: extractedData.dueDate,
    totalAmount: extractedData.totalAmount,
    subtotal: extractedData.subtotal,
    tax: extractedData.tax,
    currency: extractedData.currency,
    lineItemsCount: extractedData.lineItems ? extractedData.lineItems.length : 0,
    extractionConfidence: extractedData.extractionConfidence
  }, null, 2));

  let passed = true;
  if (extractedData.invoiceNumber !== 'INV-2026-001') {
    console.error(`❌ Invoice number mismatch: expected INV-2026-001, got ${extractedData.invoiceNumber}`);
    passed = false;
  }
  if (extractedData.totalAmount !== 3080) {
    console.error(`❌ totalAmount mismatch: expected 3080, got ${extractedData.totalAmount}`);
    passed = false;
  }
  if (extractedData.subtotal !== 2800) {
    console.error(`❌ subtotal mismatch: expected 2800, got ${extractedData.subtotal}`);
    passed = false;
  }
  if (extractedData.tax !== 280) {
    console.error(`❌ tax mismatch: expected 280, got ${extractedData.tax}`);
    passed = false;
  }

  if (passed) {
    console.log('\n🎉 END-TO-END PDF EXTRACTION AND AI PARSING PASSED SUCCESSFULLY!');
  } else {
    console.error('\n💥 END-TO-END VERIFICATION FAILED');
    process.exit(1);
  }
}

testE2E().catch((err) => {
  console.error('E2E Error:', err);
  process.exit(1);
});
