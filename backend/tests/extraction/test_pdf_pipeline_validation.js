const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const samplePdfPath = path.join(__dirname, 'uploads', 'invoices', '1786524384032-977918345-invoice_INV-2026-001.pdf');

async function testPipeline() {
  console.log('=== Testing PDF Text Extraction Pipeline ===');
  console.log('Target PDF File:', samplePdfPath);

  if (!fs.existsSync(samplePdfPath)) {
    console.error('ERROR: Target PDF file does not exist at:', samplePdfPath);
    process.exit(1);
  }

  const dataBuffer = fs.readFileSync(samplePdfPath);
  const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
  const textResult = await parser.getText({ pageJoiner: '\n' });
  await parser.destroy();

  const directText = textResult && textResult.text ? textResult.text.trim() : '';
  const pageCount = textResult && textResult.pages ? textResult.pages.length : 1;
  const isUsableText = directText && directText.length >= 20 && /[a-zA-Z0-9]/.test(directText);
  const extractionMethod = isUsableText ? 'direct-text' : 'ocr';

  console.log('\n--- EXTRACTION METADATA ---');
  console.log('Extraction Method:', extractionMethod);
  console.log('Page Count:', pageCount);
  console.log('Extracted Text Length:', directText.length);

  console.log('\n--- EXTRACTED TEXT CONTENT ---');
  console.log(directText);

  // Validation Criteria Checks
  const requirements = [
    { name: 'Invoice Number (#INV-2026-001)', regex: /#?INV-2026-001/i },
    { name: 'Invoice Date (August 12, 2026)', regex: /August\s+12,?\s+2026/i },
    { name: 'Payment Due Date (August 26, 2026)', regex: /August\s+26,?\s+2026/i },
    { name: 'Line Item: Website Redesign & Development', regex: /Website\s+Redesign\s*&\s*Development/i },
    { name: 'Line Item: UI/UX Consulting & Mockups', regex: /UI\/UX\s+Consulting\s*&\s*Mockups/i },
    { name: 'Line Item: Monthly Hosting & Maintenance', regex: /Monthly\s+Hosting\s*&\s*Maintenance/i },
    { name: 'Subtotal ($2,800.00)', regex: /Subtotal:\s*\$2,800\.00/i },
    { name: 'Tax (10%: $280.00)', regex: /Tax\s*\(\s*10%\s*\):\s*\$280\.00/i },
    { name: 'Total Amount Due ($3,080.00)', regex: /Total\s+Amount\s+Due:\s*\$3,080/i }
  ];

  console.log('\n--- VALIDATION CHECKLIST ---');
  let allPassed = true;
  for (const req of requirements) {
    const passed = req.regex.test(directText);
    if (passed) {
      console.log(`  ✅ PASSED: ${req.name}`);
    } else {
      console.log(`  ❌ FAILED: ${req.name}`);
      allPassed = false;
    }
  }

  if (extractionMethod !== 'direct-text') {
    console.log(`  ❌ FAILED: Extraction method should be "direct-text", got "${extractionMethod}"`);
    allPassed = false;
  } else {
    console.log(`  ✅ PASSED: Extraction method is "direct-text"`);
  }

  console.log('\n--- FINAL RESULT ---');
  if (allPassed) {
    console.log('🎉 ALL PDF EXTRACTION PIPELINE CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.error('💥 SOME VALIDATION CHECKS FAILED!');
    process.exit(1);
  }
}

testPipeline().catch((err) => {
  console.error('Unhandled Test Error:', err);
  process.exit(1);
});
