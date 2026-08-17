const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const { executeInvoiceQuery, parseIntentRuleBased, generateFallbackResponse } = require('./services/assistantService');

async function testValidInvoice() {
  await mongoose.connect(process.env.MONGO_URL);

  const tests = [
    { name: '1. Vendor Only', q: 'Who is the vendor of EMR-2026-404?' },
    { name: '2. Amount Only', q: 'What is the amount of EMR-2026-404?' },
    { name: '3. Due Date Only', q: 'What is the due date of EMR-2026-404?' },
    { name: '4. Full Details', q: 'Give me complete details of EMR-2026-404' },
  ];

  let output = '';
  for (const t of tests) {
    const intent = parseIntentRuleBased(t.q);
    const dbRes = await executeInvoiceQuery(null, intent);
    const ans = generateFallbackResponse(t.q, dbRes, intent.detectedLanguage);
    output += '=== ' + t.name + ' ===\nQ: ' + t.q + '\nA:\n' + ans + '\n\n';
  }

  fs.writeFileSync('valid_res.txt', output, 'utf8');
  console.log('Wrote valid_res.txt successfully');
  process.exit(0);
}

testValidInvoice().catch((err) => {
  console.error(err);
  process.exit(1);
});
