const { extractWithRuleBasedAI } = require('./services/aiService');

console.log('=== Comprehensive 17-Category Invoice AI Extraction Test Suite ===\n');

const testCases = [
  {
    name: '1. Indian GST Multi-Line Item Invoice with Taxes & Banking Details',
    text: `Reliance Logistics Ltd.
Registered Office: Plot 42, GIDC Industrial Estate, Vadodara, Gujarat 390010, India
GSTIN: 24AAACR1234F1Z9  PAN: AAACR1234F  CIN: L12345GJ2010PLC054321
Tax Invoice
Invoice No: RLL/AHM/26-27/0411
Invoice Date: 01-08-2026
Due Date: 31-08-2026
PO Number: PO-998822
Place of Supply: Gujarat (24)

Bill To:
Acme Enterprises India Pvt Ltd
GSTIN: 27AAACA9876E1Z5
Address: 101 Corporate Park, Bandra East, Mumbai, Maharashtra 400051

Description               HSN/SAC   Qty   Unit Price    Amount
Transportation Services  996511    10    4000.00       40000.00
Warehousing & Storage     996729    5     2000.00       10000.00

Subtotal: INR 50,000.00
CGST @ 9%: INR 4,500.00
SGST @ 9%: INR 4,500.00
Total Tax: INR 9,000.00
Grand Total: INR 59,000.00

Payment Details:
Bank Name: HDFC Bank Ltd
Account Number: 50200012345678
IFSC / SWIFT: HDFC0000123
UPI: relogistics@hdfcbank
Payment Status: PENDING`,
    assertions: (res) => {
      let passed = true;
      if (res.invoiceNumber !== 'RLL/AHM/26-27/0411') { console.error(`❌ invoiceNumber mismatch: ${res.invoiceNumber}`); passed = false; }
      if (res.vendorName !== 'Reliance Logistics Ltd.') { console.error(`❌ vendorName mismatch: ${res.vendorName}`); passed = false; }
      if (res.GSTIN !== '24AAACR1234F1Z9') { console.error(`❌ GSTIN mismatch: ${res.GSTIN}`); passed = false; }
      if (res.customerName !== 'Acme Enterprises India Pvt Ltd') { console.error(`❌ customerName mismatch: ${res.customerName}`); passed = false; }
      if (res.purchaseOrderNumber !== 'PO-998822') { console.error(`❌ PO number mismatch: ${res.purchaseOrderNumber}`); passed = false; }
      if (res.grandTotal !== 59000 || res.totalAmount !== 59000) { console.error(`❌ totalAmount mismatch: ${res.totalAmount}`); passed = false; }
      if (res.subtotal !== 50000) { console.error(`❌ subtotal mismatch: ${res.subtotal}`); passed = false; }
      if (res.currency !== 'INR') { console.error(`❌ currency mismatch: ${res.currency}`); passed = false; }
      if (!Array.isArray(res.lineItems) || res.lineItems.length < 2) { console.error(`❌ lineItems mismatch: ${res.lineItems.length}`); passed = false; }
      if (!Array.isArray(res.taxes) || res.taxes.length < 2) { console.error(`❌ taxes array mismatch: ${res.taxes.length}`); passed = false; }
      if (res.paymentStatus !== 'PENDING') { console.error(`❌ paymentStatus mismatch: ${res.paymentStatus}`); passed = false; }
      return passed;
    }
  },
  {
    name: '2. European Freelance Invoice with IBAN, SWIFT & VAT Entries',
    text: `TechConsult Europe GmbH
Poststraße 15, 10117 Berlin, Germany
VAT ID: DE123456789

INVOICE
Invoice Number: DE-2026-0491
Date of Issue: 15.07.2026
Payment Due: 15.08.2026

Billed To:
Global Solutions Ltd
London, UK

Services Provided:
Software Architecture Consulting - 1500.00
VAT (19%): 285.00
Total Payable: EUR 1.785,00

Bank Information:
Bank: Deutsche Bank AG
IBAN: DE89370400440532013000
SWIFT/BIC: DEUTDEDBDXX
Status: UNPAID`,
    assertions: (res) => {
      let passed = true;
      if (res.invoiceNumber !== 'DE-2026-0491') { console.error(`❌ invoiceNumber mismatch: ${res.invoiceNumber}`); passed = false; }
      if (res.vendorName !== 'TechConsult Europe GmbH') { console.error(`❌ vendorName mismatch: ${res.vendorName}`); passed = false; }
      if (res.totalAmount !== 1785) { console.error(`❌ totalAmount mismatch: ${res.totalAmount}`); passed = false; }
      if (res.subtotal !== 1500) { console.error(`❌ subtotal mismatch: ${res.subtotal}`); passed = false; }
      if (res.tax !== 285) { console.error(`❌ tax mismatch: ${res.tax}`); passed = false; }
      if (res.currency !== 'EUR') { console.error(`❌ currency mismatch: ${res.currency}`); passed = false; }
      if (res.IBAN !== 'DE89370400440532013000') { console.error(`❌ IBAN mismatch: ${res.IBAN}`); passed = false; }
      if (res.SWIFT !== 'DEUTDEDBDXX') { console.error(`❌ SWIFT mismatch: ${res.SWIFT}`); passed = false; }
      if (res.paymentStatus !== 'UNPAID') { console.error(`❌ paymentStatus mismatch: ${res.paymentStatus}`); passed = false; }
      return passed;
    }
  },
  {
    name: '3. AWS Cloud Invoice with USD Currency & Line Items',
    text: `Amazon Web Services, Inc.
410 Terry Avenue North, Seattle, WA 98109-5210
Invoice Number: 981240182
Invoice Date: August 3, 2026

Customer Account: 1234-5678-9012
Billing Period: July 1, 2026 - July 31, 2026

Itemized Charges:
Amazon Elastic Compute Cloud (EC2)   800.00
Amazon Simple Storage Service (S3)    400.00

Subtotal: $1,200.00
Estimated Tax: $220.50
Total Amount Due: $1,420.50
Status: PAID`,
    assertions: (res) => {
      let passed = true;
      if (res.invoiceNumber !== '981240182') { console.error(`❌ invoiceNumber mismatch: ${res.invoiceNumber}`); passed = false; }
      if (res.vendorName !== 'Amazon Web Services, Inc.') { console.error(`❌ vendorName mismatch: ${res.vendorName}`); passed = false; }
      if (res.totalAmount !== 1420.5) { console.error(`❌ totalAmount mismatch: ${res.totalAmount}`); passed = false; }
      if (res.subtotal !== 1200) { console.error(`❌ subtotal mismatch: ${res.subtotal}`); passed = false; }
      if (res.tax !== 220.5) { console.error(`❌ tax mismatch: ${res.tax}`); passed = false; }
      if (res.currency !== 'USD') { console.error(`❌ currency mismatch: ${res.currency}`); passed = false; }
      if (res.paymentStatus !== 'PAID') { console.error(`❌ paymentStatus mismatch: ${res.paymentStatus}`); passed = false; }
      return passed;
    }
  },
  {
    name: '4. Critical Verification: Acme Corp Invoice (Final Total $3,080 vs Subtotal $2,800 & False Positive Guards)',
    text: `TechConsult Corporation
100 Tech Way, Suite 400, Austin, TX 78701
Invoice Number: INV-2026-9921
Invoice Date: August 12, 2026
Payment Due: August 26, 2026

Billed To: Acme Corporation
Email: doa@acmecorp.com

Services Rendered:
Cloud Development Services          2    $1,400.00    $2,800.00

Subtotal: $2,800.00
Tax (10%): $280.00
Total Amount Due: $3,080.00
Status: UNPAID`,
    assertions: (res) => {
      let passed = true;
      if (res.invoiceNumber !== 'INV-2026-9921') { console.error(`❌ invoiceNumber mismatch: ${res.invoiceNumber}`); passed = false; }
      if (res.vendorName !== 'TechConsult Corporation') { console.error(`❌ vendorName mismatch: expected 'TechConsult Corporation', got '${res.vendorName}'`); passed = false; }
      if (res.customerName !== 'Acme Corporation') { console.error(`❌ customerName mismatch: expected 'Acme Corporation', got '${res.customerName}'`); passed = false; }
      if (res.invoiceDate !== '2026-08-12') { console.error(`❌ invoiceDate mismatch: expected '2026-08-12', got '${res.invoiceDate}'`); passed = false; }
      if (res.dueDate !== '2026-08-26') { console.error(`❌ dueDate mismatch: expected '2026-08-26', got '${res.dueDate}'`); passed = false; }
      if (res.totalAmount !== 3080) { console.error(`❌ totalAmount mismatch: expected 3080, got ${res.totalAmount}`); passed = false; }
      if (res.subtotal !== 2800) { console.error(`❌ subtotal mismatch: expected 2800, got ${res.subtotal}`); passed = false; }
      if (res.tax !== 280) { console.error(`❌ tax mismatch: expected 280, got ${res.tax}`); passed = false; }
      if (res.purchaseOrderNumber !== null) { console.error(`❌ purchaseOrderNumber false positive: expected null, got '${res.purchaseOrderNumber}'`); passed = false; }
      if (res.UPI !== null) { console.error(`❌ UPI false positive: expected null, got '${res.UPI}'`); passed = false; }
      if (res.currency !== 'USD') { console.error(`❌ currency mismatch: expected 'USD', got '${res.currency}'`); passed = false; }
      return passed;
    }
  }
];

let totalPassed = 0;
for (const test of testCases) {
  console.log(`Running Test: ${test.name}`);
  const result = extractWithRuleBasedAI(test.text);
  console.log('Extracted Schema Summary:', JSON.stringify({
    invoiceNumber: result.invoiceNumber,
    vendorName: result.vendorName,
    customerName: result.customerName,
    invoiceDate: result.invoiceDate,
    dueDate: result.dueDate,
    totalAmount: result.totalAmount,
    subtotal: result.subtotal,
    tax: result.tax,
    purchaseOrderNumber: result.purchaseOrderNumber,
    UPI: result.UPI,
    currency: result.currency,
    lineItemsCount: result.lineItems.length,
    paymentStatus: result.paymentStatus,
    extractionConfidence: result.extractionConfidence
  }, null, 2));

  const ok = test.assertions(result);
  if (ok) {
    console.log(`  ✅ PASSED (${test.name})\n`);
    totalPassed++;
  } else {
    console.log(`  ❌ FAILED (${test.name})\n`);
  }
}

console.log(`Results: ${totalPassed} / ${testCases.length} tests passed.`);
if (totalPassed !== testCases.length) {
  process.exit(1);
}
