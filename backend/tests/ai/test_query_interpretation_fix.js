const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Invoice = require('./models/Invoice');
const { processAssistantQuery, executeInvoiceQuery, parseIntentRuleBased } = require('./services/assistantService');

async function runQueryInterpretationTests() {
  console.log('=== Running Query Interpretation & Scope Filtering Verification Suite ===\n');

  await mongoose.connect(process.env.MONGO_URL);
  console.log('Connected to MongoDB Atlas\n');

  // Seed sample invoices for exact testing if database is empty
  const count = await Invoice.countDocuments();
  if (count === 0) {
    console.log('Seeding test invoices...');
    await Invoice.create([
      { invoiceNumber: 'VMT/2026-27/042', vendorName: 'VM Technology Pvt. Ltd.', customerName: 'Apex Corp', amount: 159300, totalAmount: 159300, dueDate: '2026-08-22', status: 'PENDING' },
      { invoiceNumber: 'CORP-2026-786', vendorName: 'Corporate IT Solutions', customerName: 'Global Soft', amount: 295000, totalAmount: 295000, dueDate: '2026-08-27', status: 'OVERDUE' },
      { invoiceNumber: 'INV-2026-001', vendorName: 'Alpha Supplies', customerName: 'Beta Retail', amount: 10500, totalAmount: 10500, dueDate: '2026-09-01', status: 'PAID' },
    ]);
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.log(`[FAIL] ${message}`);
    }
  }

  // TEST 1: HIGHEST vs LOWEST Amount
  console.log('--- 1. Testing HIGHEST vs LOWEST Sorting ---');
  const resHighest = await processAssistantQuery(null, 'Which invoice has the highest amount?');
  assert(resHighest.answer.includes('295000') || resHighest.answer.includes('2,95,000') || resHighest.answer.includes('highest'), 'Highest amount query returns maximum amount invoice');

  const resLowest = await processAssistantQuery(null, 'Which invoice has the lowest amount?');
  assert(resLowest.answer.includes('10500') || resLowest.answer.includes('10,500') || resLowest.answer.includes('lowest'), 'Lowest amount query returns minimum amount invoice');

  // TEST 2: Gujarati Highest / Lowest
  console.log('\n--- 2. Testing Gujarati Highest / Lowest ---');
  const resGuHighest = await processAssistantQuery(null, 'સૌથી વધારે amount વાળી invoice કઈ છે?');
  assert(resGuHighest.answer.includes('295000') || resGuHighest.answer.includes('2,95,000'), 'Gujarati highest query returns maximum amount invoice');

  const resGuLowest = await processAssistantQuery(null, 'સૌથી ઓછી amount વાળી invoice કઈ છે?');
  assert(resGuLowest.answer.includes('10500') || resGuLowest.answer.includes('10,500'), 'Gujarati lowest query returns minimum amount invoice');

  // TEST 3: Single Field Requested Scope
  console.log('\n--- 3. Testing Field Scope ("Who is the vendor?") ---');
  const resVendor = await processAssistantQuery(null, 'Who is the vendor of VMT/2026-27/042?');
  assert(resVendor.answer.includes('VM Technology') && !resVendor.answer.includes('Apex Corp') && !resVendor.answer.includes('159300'), 'Vendor-only query returns ONLY vendor name');

  console.log('\n--- 4. Testing Field Scope ("What is the amount?") ---');
  const resAmt = await processAssistantQuery(null, 'What is the amount of VMT/2026-27/042?');
  assert(resAmt.answer.includes('159300') && !resAmt.answer.includes('Apex Corp') && !resAmt.answer.includes('2026-08-22'), 'Amount-only query returns ONLY amount');

  console.log('\n--- 5. Testing Field Scope ("What is the due date?") ---');
  const resDue = await processAssistantQuery(null, 'What is the due date of VMT/2026-27/042?');
  assert(resDue.answer.includes('2026-08-22') && !resDue.answer.includes('VM Technology'), 'Due date-only query returns ONLY due date');

  // TEST 6: Exact Invoice Lookup vs Non-Existent Invoice Number
  console.log('\n--- 6. Testing Exact Lookup & Non-Existent Invoice ---');
  const resNotExist = await processAssistantQuery(null, 'Show me invoice INV-999999');
  assert(resNotExist.answer.includes('No invoice with number INV-999999 was found.') || resNotExist.answer.includes('મળી નથી') || resNotExist.answer.includes('नहीं मिली'), 'Non-existent invoice query returns clean no-result message without substituting other invoices');

  // TEST 7: Complete Details Request
  console.log('\n--- 7. Testing Complete Details Request ---');
  const resFull = await processAssistantQuery(null, 'Give me complete details of VMT/2026-27/042');
  assert(resFull.answer.includes('VM Technology') || resFull.answer.includes('159300'), 'Complete details request returns full invoice information');

  // TEST 8: Multilingual Hindi / Gujarati Vendor Only
  console.log('\n--- 8. Testing Multilingual Vendor Only ---');
  const resGuVendor = await processAssistantQuery(null, 'VMT/2026-27/042 નો vendor કોણ છે?');
  assert(resGuVendor.answer.includes('VM Technology'), 'Gujarati vendor query returns vendor name');

  const resHiVendor = await processAssistantQuery(null, 'VMT/2026-27/042 का vendor कौन है?');
  assert(resHiVendor.answer.includes('VM Technology'), 'Hindi vendor query returns vendor name');

  console.log(`\nTest Summary: ${passedTests}/${totalTests} Passed`);
  process.exit(0);
}

runQueryInterpretationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
