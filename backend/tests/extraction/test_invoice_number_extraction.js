const { extractWithRuleBasedAI, extractInvoiceNumber, sanitizeInvoiceNumber } = require('./services/aiService');

function runInvoiceNumberExtractionTests() {
  console.log('=== Running Format-Agnostic Invoice Number Extraction Tests ===\n');

  const testCases = [
    {
      name: 'Indian GST Format (Slashes & Hyphens)',
      text: `TAX INVOICE
VM Technology Pvt. Ltd.
GSTIN: 27AABCV1234F1ZB
Tax Invoice No: VMT/2026-27/042
Date: 12-08-2026
Total Amount: ₹2,12,400.00`,
      expected: 'VMT/2026-27/042'
    },
    {
      name: 'Standard Hyphenated Alphanumeric',
      text: `INVOICE
Acme Corporation
Invoice Number: INV-2026-001
Date: August 12, 2026
Amount Due: $1,250.00`,
      expected: 'INV-2026-001'
    },
    {
      name: 'Prefix Hash Symbol',
      text: `INVOICE
Design Studio LLC
Inv #: #94821
Date: 2026-08-12
Total: $500.00`,
      expected: '#94821'
    },
    {
      name: 'Multi-Slash Date Coded Bill',
      text: `BILL OF SUPPLY
Global Telecom Ltd
Bill No: BILL/2026/08/99
Billing Date: 2026-08-01
Grand Total: $89.00`,
      expected: 'BILL/2026/08/99'
    },
    {
      name: 'Pure Numeric Bill Number',
      text: `INVOICE
Water Utility Services
Bill No. 100429
Due Date: 2026-08-30
Amount: $45.50`,
      expected: '100429'
    },
    {
      name: 'Alphanumeric with Suffix Letter',
      text: `RECEIPT / INVOICE
Logistics Express
Doc #: REC-849102-A
Date: 12/08/2026
Total Paid: $320.00`,
      expected: 'REC-849102-A'
    },
    {
      name: 'Dot-Separated Invoice Number',
      text: `INVOICE
Cloud Host Inc
Invoice No. INV.2026.042
Date: 2026-08-10
Subtotal: $150.00`,
      expected: 'INV.2026.042'
    },
    {
      name: 'Next-Line Label Layout (Label on Line 1, Value on Line 2)',
      text: `INVOICE NUMBER
INV-9002
INVOICE DATE
2026-08-12
TOTAL AMOUNT
$1,400.00`,
      expected: 'INV-9002'
    },
    {
      name: 'Multi-Column Table Header Layout',
      text: `Invoice No.        Invoice Date      Total Amount
INV-9082           2026-08-12        $500.00`,
      expected: 'INV-9082'
    },
    {
      name: 'Accidental Label Prefix Captured by OCR',
      text: `Invoice No: INV-7701`,
      expected: 'INV-7701'
    }
  ];

  let passed = 0;
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const extracted = extractInvoiceNumber(tc.text);
    const sanitized = sanitizeInvoiceNumber(extracted, tc.text);

    if (sanitized === tc.expected) {
      console.log(`[PASS ${i+1}/${testCases.length}] ${tc.name}: "${sanitized}"`);
      passed++;
    } else {
      console.log(`[FAIL ${i+1}/${testCases.length}] ${tc.name}: Expected "${tc.expected}", Got "${sanitized}" (raw: "${extracted}")`);
    }
  }

  console.log('\n=== Testing Negative Guards ===\n');

  const negativeCases = [
    { name: 'Section Heading "Invoice"', input: 'Invoice' },
    { name: 'Generic Word "Details"', input: 'Details' },
    { name: 'Date String', input: '2026-08-12' },
    { name: 'GSTIN Number', input: '27AABCV1234F1ZB' },
    { name: 'PAN Number', input: 'ABCDE1234F' },
    { name: 'Currency Amount', input: '$1,200.00' },
    { name: 'Phone Number', input: '9876543210' },
    { name: 'MongoDB ObjectId', input: '67aa1234567890abcdef1234' }
  ];

  let negPassed = 0;
  for (const nc of negativeCases) {
    const res = sanitizeInvoiceNumber(nc.input, '');
    if (res === null) {
      console.log(`[PASS Neg] ${nc.name}: Correctly rejected`);
      negPassed++;
    } else {
      console.log(`[FAIL Neg] ${nc.name}: Accepted "${res}"`);
    }
  }

  console.log(`\nSummary: ${passed}/${testCases.length} Positive | ${negPassed}/${negativeCases.length} Negative`);

  if (passed !== testCases.length || negPassed !== negativeCases.length) {
    process.exit(1);
  }
}

runInvoiceNumberExtractionTests();
