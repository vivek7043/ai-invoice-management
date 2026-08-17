const { extractDueDate } = require('./services/aiService');

function runDueDateTests() {
  const testCases = [
    {
      name: '1. Payment Due Label (Full Month)',
      text: `TAX INVOICE
Acme Corp
Invoice Date: 12-08-2026
Payment Due: August 26, 2026
Total: $500.00`,
      expected: '2026-08-26'
    },
    {
      name: '2. Short Due Label',
      text: `INVOICE
Design Studio LLC
Invoice Date: 2026-08-12
Due: August 26, 2026`,
      expected: '2026-08-26'
    },
    {
      name: '3. Pay By Label (Hyphenated Month)',
      text: `BILL OF SUPPLY
Telecom Ltd
Bill Date: 12/08/2026
Pay By: 26-Aug-2026`,
      expected: '2026-08-26'
    },
    {
      name: '4. Payment Deadline Label (Numeric Slash)',
      text: `INVOICE
Water Utility
Date: 12/08/2026
Payment Deadline: 26/08/2026`,
      expected: '2026-08-26'
    },
    {
      name: '5. Date Due Label (ISO Format)',
      text: `INVOICE
Cloud Host Inc
Date of Issue: 2026-08-12
Date Due: 2026-08-26`,
      expected: '2026-08-26'
    },
    {
      name: '6. Amount Due By Label (Ordinal Day Suffix)',
      text: `INVOICE
Logistics Express
Amount Due By: 26th August 2026`,
      expected: '2026-08-26'
    },
    {
      name: '7. Next-Line Stacked Layout',
      text: `INVOICE
Global Tech
PAYMENT DEADLINE
26/08/2026
INVOICE DATE
12/08/2026`,
      expected: '2026-08-26'
    },
    {
      name: '8. Multi-Column Table Layout Header Matching',
      text: `Invoice Date        Due Date          Total Amount
12/08/2026          26/08/2026        $500.00`,
      expected: '2026-08-26'
    },
    {
      name: '9. Natural Language Pay Before',
      text: `INVOICE
Pay Before 26th Aug 2026 to avoid penalty charges.`,
      expected: '2026-08-26'
    },
    {
      name: '10. Expiry Date Label',
      text: `SUBSCRIPTION INVOICE
Billing Date: 2026-08-12
Expiry Date: 2026-08-26`,
      expected: '2026-08-26'
    }
  ];

  let passed = 0;
  console.log('=== Running Format-Independent Due Date Extraction Tests ===\n');

  testCases.forEach((tc) => {
    const extracted = extractDueDate(tc.text);
    const isPass = extracted === tc.expected;

    if (isPass) {
      passed++;
      console.log(`[PASS] ${tc.name} -> "${extracted}"`);
    } else {
      console.log(`[FAIL] ${tc.name} -> Got: "${extracted}" (Expected: "${tc.expected}")`);
    }
  });

  console.log(`\nTest Summary: ${passed}/${testCases.length} Passed`);
  process.exit(passed === testCases.length ? 0 : 1);
}

runDueDateTests();
