const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const { executeInvoiceQuery, parseIntentRuleBased, generateFallbackResponse } = require('./services/assistantService');

async function testFast() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('Connected to MongoDB');

  const tests = [
    { name: '1. Highest Amount', q: 'Which invoice has the highest amount?' },
    { name: '2. Lowest Amount', q: 'Which invoice has the lowest amount?' },
    { name: '3. Gujarati Highest', q: 'સૌથી વધારે amount વાળી invoice કઈ છે?' },
    { name: '4. Gujarati Lowest', q: 'સૌથી ઓછી amount વાળી invoice કઈ છે?' },
    { name: '5. Vendor Only', q: 'Who is the vendor of VMT/2026-27/042?' },
    { name: '6. Amount Only', q: 'What is the amount of VMT/2026-27/042?' },
    { name: '7. Due Date Only', q: 'What is the due date of VMT/2026-27/042?' },
    { name: '8. Non Existent Invoice', q: 'Show me invoice INV-999999' },
    { name: '9. Full Details', q: 'Give me complete details of VMT/2026-27/042' },
    { name: '10. Gujarati Vendor', q: 'VMT/2026-27/042 નો vendor કોણ છે?' },
    { name: '11. Hindi Vendor', q: 'VMT/2026-27/042 का vendor कौन है?' },
  ];

  let output = '';
  for (const t of tests) {
    const intent = parseIntentRuleBased(t.q);
    const dbRes = await executeInvoiceQuery(null, intent);
    const ans = generateFallbackResponse(t.q, dbRes, intent.detectedLanguage);
    output += '=== ' + t.name + ' ===\nQ: ' + t.q + '\nA:\n' + ans + '\n\n';
  }

  fs.writeFileSync('fast_res.txt', output, 'utf8');
  console.log('Wrote fast_res.txt successfully');
  process.exit(0);
}

testFast().catch((err) => {
  console.error(err);
  process.exit(1);
});
