const { extractWithRuleBasedAI, isSectionHeading, isVendorTagline, isGenericLabel } = require('./services/aiService');

async function testSemanticValidation() {
  console.log('=== Testing Generic Semantic Validation & Extraction Pipeline ===\n');

  // Test 1: Guard Function Unit Tests
  console.log('--- TEST 1: Guard Function Unit Tests ---');
  if (!isSectionHeading('INFORMATION') || !isSectionHeading('SUMMARY') || !isSectionHeading('BUYER')) {
    throw new Error('Section heading guard failed');
  }
  if (!isVendorTagline('IT SOLUTIONS & SOFTWARE CONSULTING')) {
    throw new Error('Vendor tagline guard failed');
  }
  if (!isGenericLabel('(BUYER)') || !isGenericLabel('(SELLER)')) {
    throw new Error('Generic label guard failed');
  }
  console.log('✅ Guard function unit tests PASSED.\n');

  // Test 2: Document with Heading Collisions & Multi-Tax
  console.log('--- TEST 2: Extraction with Heading Collisions & Multi-Tax ---');
  const mockText = `
TAX INVOICE
Acme Tech Corporation Pvt Ltd
IT SOLUTIONS & SOFTWARE CONSULTING
Registered Office: 100 Innovation Way, Tech Park, City 560001
GSTIN: 29AAAAA0000A1Z5

Invoice Number: INFORMATION
Ref #INV-2026-8899

Invoice Date: 12-08-2026
Due Date: 26-08-2026
Payment Terms: Net 30
Status: PAID

Billed To: (BUYER)
Global Retails Limited
GSTIN: 27BBBBB1111B1Z2

LINE ITEMS:
Description                        SAC      Qty  Unit   Rate        Total
Software License Subscription      998313   2    Pcs    1000.00     2000.00
Cloud Infrastructure Hosting       998315   1    Pcs    800.00      800.00

Subtotal: 2800.00
CGST (9%): 252.00
SGST (9%): 252.00
Total Tax: 504.00
Total Amount Due: 3304.00
  `.trim();

  const result = extractWithRuleBasedAI(mockText);

  console.log('Extracted Invoice Number:', result.invoiceNumber);
  console.log('Extracted Vendor Name:', result.vendorName);
  console.log('Extracted Customer Name:', result.customerName);
  console.log('Extracted Payment Terms:', result.paymentTerms);
  console.log('Extracted Payment Status:', result.paymentStatus);
  console.log('Extracted Total Tax:', result.totalTax);
  console.log('Extracted Line Items Count:', result.lineItems.length);
  console.log('Extraction Confidence:', result.extractionConfidence);

  if (result.invoiceNumber === 'INFORMATION') {
    throw new Error('invoiceNumber returned section heading INFORMATION');
  }
  if (result.invoiceNumber !== 'INV-2026-8899') {
    throw new Error(`invoiceNumber expected INV-2026-8899, got ${result.invoiceNumber}`);
  }
  console.log('✅ PASSED: invoiceNumber correctly skipped heading "INFORMATION" and captured "INV-2026-8899"');

  if (result.vendorName === 'IT SOLUTIONS & SOFTWARE CONSULTING') {
    throw new Error('vendorName returned tagline IT SOLUTIONS & SOFTWARE CONSULTING');
  }
  if (result.vendorName !== 'Acme Tech Corporation Pvt Ltd') {
    throw new Error(`vendorName expected Acme Tech Corporation Pvt Ltd, got ${result.vendorName}`);
  }
  console.log('✅ PASSED: vendorName correctly skipped tagline and captured "Acme Tech Corporation Pvt Ltd"');

  if (result.customerName === '(BUYER)') {
    throw new Error('customerName returned generic label (BUYER)');
  }
  if (result.customerName !== 'Global Retails Limited') {
    throw new Error(`customerName expected Global Retails Limited, got ${result.customerName}`);
  }
  console.log('✅ PASSED: customerName correctly skipped label "(BUYER)" and captured "Global Retails Limited"');

  if (result.totalTax !== 504) {
    throw new Error(`totalTax expected sum of taxes 504, got ${result.totalTax}`);
  }
  console.log('✅ PASSED: totalTax correctly equals sum of CGST + SGST (504)');

  if (result.paymentTerms !== 'Net 30') {
    throw new Error(`paymentTerms expected Net 30, got ${result.paymentTerms}`);
  }
  console.log('✅ PASSED: paymentTerms correctly captured explicit Net 30');

  if (result.paymentStatus !== 'PAID') {
    throw new Error(`paymentStatus expected PAID, got ${result.paymentStatus}`);
  }
  console.log('✅ PASSED: paymentStatus correctly captured explicit PAID');

  if (!result.lineItems || result.lineItems.length < 2) {
    throw new Error(`lineItems count expected >= 2, got ${result.lineItems ? result.lineItems.length : 0}`);
  }
  const item1 = result.lineItems[0];
  if (item1.SAC !== '998313' || item1.quantity !== 2 || item1.unit !== 'Pcs' || item1.unitPrice !== 1000 || item1.lineTotal !== 2000) {
    throw new Error(`Line item 1 mapping incorrect: ${JSON.stringify(item1)}`);
  }
  console.log('✅ PASSED: Line item 1 structural columns (SAC, Qty, Unit, Rate, LineTotal) mapped accurately');

  console.log('\n🎉 ALL SEMANTIC VALIDATION CHECKS PASSED SUCCESSFULLY!');
}

testSemanticValidation().catch((err) => {
  console.error('Test Error:', err.message);
  process.exit(1);
});
