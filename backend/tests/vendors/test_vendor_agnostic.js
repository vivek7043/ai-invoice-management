const { extractWithRuleBasedAI } = require('./services/aiService');

const testCases = [
  {
    name: '1. Microsoft Noisy OCR Invoice (INR 0.00 & Invoice Date 09/08/2026)',
    text: `
    Microsoft Billing Summary
    Microsoft Corporation India Private Limited
    8th Floor, Tower A, DLF Cyber City
    Gurgaon, Haryana 122002
    
    INVOICE
    Invoice Number: MS-8812304
    Invoice Date 09/08/2026
    
    Billed To: Tech Corp India
    Customer ID: CUST-9921004
    Order ID: ORD-881234
    
    Azure Cloud Subscription            INR 0.00
    Subtotal                            INR 0.00
    GST 18%                             INR 0.00
    Total Amount                        INR 0.00
    `,
    expected: {
      invoiceNumber: 'MS-8812304',
      vendorName: 'Microsoft Corporation India Private Limited',
      invoiceDate: '2026-08-09',
      dueDate: null,
      amount: 0,
      currency: 'INR',
      subtotal: 0,
      tax: 0,
      status: null,
    },
  },
  {
    name: '2. Cloud Infrastructure Invoice (AWS Style - USD)',
    text: `
    Amazon Web Services, Inc.
    410 Terry Avenue North
    Seattle, WA 98109-5210
    
    INVOICE
    Invoice Number: 981240182
    Invoice Date: August 03, 2026
    Total Amount Due: $1,420.50
    
    Summary of Charges
    AWS Cloud Computing Services        $1,200.00
    Subtotal                            $1,200.00
    Estimated Tax                       $220.50
    Total Amount                        $1,420.50
    
    Payment Status: PAID
    `,
    expected: {
      invoiceNumber: '981240182',
      vendorName: 'Amazon Web Services, Inc.',
      invoiceDate: '2026-08-03',
      dueDate: null,
      amount: 1420.5,
      currency: 'USD',
      subtotal: 1200,
      tax: 220.5,
      status: 'PAID',
    },
  },
  {
    name: '3. European Freelance Invoice (EUR - VAT Format)',
    text: `
    TechConsult Europe GmbH
    Friedrichstraße 12
    10117 Berlin, Germany
    
    RECHNUNG / INVOICE
    Bill No: DE-2026-0491
    Issue Date: 15/07/2026
    Payment Due: 15/08/2026
    
    Billed To: ACME Marketing Corp
    
    Services Rendered                  1.500,00 €
    Net Amount                          1.500,00 €
    VAT (19%)                             285,00 €
    Grand Total                         1.785,00 €
    
    Status: UNPAID
    `,
    expected: {
      invoiceNumber: 'DE-2026-0491',
      vendorName: 'TechConsult Europe GmbH',
      invoiceDate: '2026-07-15',
      dueDate: '2026-08-15',
      amount: 1785,
      currency: 'EUR',
      subtotal: 1500,
      tax: 285,
      status: 'UNPAID',
    },
  },
  {
    name: '4. Indian Enterprise GST Invoice (INR - Integrated Tax)',
    text: `
    Reliance Logistics Ltd.
    GSTIN: 24AAACR1234F1ZV
    TAX INVOICE
    Invoice #: RLL/AHM/26-27/0411
    Date of Issue: 01-Aug-2026
    Due Date: 31-Aug-2026
    
    Billed From: Reliance Logistics Ltd.
    Billed To: TechSolutions Pvt Ltd
    
    Taxable Value: ₹ 50,000.00
    Integrated Tax @ 18%: ₹ 9,000.00
    Total Payable: ₹ 59,000.00
    
    Payment Status: PENDING
    `,
    expected: {
      invoiceNumber: 'RLL/AHM/26-27/0411',
      vendorName: 'Reliance Logistics Ltd.',
      invoiceDate: '2026-08-01',
      dueDate: '2026-08-31',
      amount: 59000,
      currency: 'INR',
      subtotal: 50000,
      tax: 9000,
      status: 'PENDING',
    },
  },
  {
    name: '5. UK Utility Bill (GBP - Statement / Pay By)',
    text: `
    British Telecom Services Ltd
    London, United Kingdom
    
    STATEMENT OF ACCOUNT
    Bill Number: BT-991204
    Bill Date: 10 June 2026
    Pay By: 25 June 2026
    
    Subtotal: £85.00
    VAT @ 20%: £17.00
    Balance Due: £102.00
    
    Status: OVERDUE
    `,
    expected: {
      invoiceNumber: 'BT-991204',
      vendorName: 'British Telecom Services Ltd',
      invoiceDate: '2026-06-10',
      dueDate: '2026-06-25',
      amount: 102,
      currency: 'GBP',
      subtotal: 85,
      tax: 17,
      status: 'OVERDUE',
    },
  },
  {
    name: '6. Stripe Subscription SaaS Invoice (USD)',
    text: `
    Stripe Payments UK Ltd
    Invoice Code: INV-STR-88712
    Issued Date: 2026-05-01
    
    Subscription Plan - Enterprise     $299.00
    Amount Due: $299.00
    
    Status: PAID
    `,
    expected: {
      invoiceNumber: 'INV-STR-88712',
      vendorName: 'Stripe Payments UK Ltd',
      invoiceDate: '2026-05-01',
      dueDate: null,
      amount: 299,
      currency: 'USD',
      status: 'PAID',
    },
  },
];

console.log('=== Running Production Vendor-Agnostic AI Field Extraction Test Suite ===\n');

let passedCount = 0;

for (const test of testCases) {
  console.log(`Running Test: ${test.name}`);
  const result = extractWithRuleBasedAI(test.text);
  console.log('Extracted Data:');
  console.log(JSON.stringify(result, null, 2));

  let testPassed = true;
  for (const [key, expVal] of Object.entries(test.expected)) {
    if (result[key] !== expVal) {
      console.error(`  ❌ Mismatch for field '${key}': Expected ${expVal}, got ${result[key]}`);
      testPassed = false;
    }
  }

  if (testPassed) {
    console.log(`  ✅ PASSED (${test.name})\n`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED (${test.name})\n`);
  }
}

console.log(`Results: ${passedCount} / ${testCases.length} tests passed.`);
if (passedCount < testCases.length) {
  process.exit(1);
}
