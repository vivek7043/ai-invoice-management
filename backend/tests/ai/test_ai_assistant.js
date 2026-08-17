require('dotenv').config();
const { detectLanguageFallback, parseIntentRuleBased } = require('./services/assistantService');

function runAssistantTests() {
  console.log('=== Running Multilingual AI Assistant Intent & Language Tests ===\n');

  const testCases = [
    {
      name: '1. English Total Pending Query',
      question: 'What is my total pending amount?',
      expectedLang: 'en',
      expectedStatus: 'PENDING',
      expectedAgg: 'sum_amount',
    },
    {
      name: '2. Hindi Script Pending Query',
      question: 'मेरी कितनी invoices pending हैं?',
      expectedLang: 'hi',
      expectedStatus: 'PENDING',
    },
    {
      name: '3. Gujarati Script Pending Query',
      question: 'મારી કેટલી invoices pending છે?',
      expectedLang: 'gu',
      expectedStatus: 'PENDING',
    },
    {
      name: '4. Hinglish Baaki Query',
      question: 'कितना पैसा अभी बाकी है?',
      expectedLang: 'hi',
      expectedStatus: 'PENDING',
      expectedAgg: 'sum_amount',
    },
    {
      name: '5. Gujlish Ketlo Chhe Query',
      question: 'Pending amount ketlo chhe?',
      expectedLang: 'gu',
      expectedStatus: 'PENDING',
      expectedAgg: 'sum_amount',
    },
    {
      name: '6. Overdue Invoices Query',
      question: 'Show overdue invoices',
      expectedLang: 'en',
      expectedStatus: 'OVERDUE',
      expectedOverdue: true,
    },
    {
      name: '7. Context Follow-up Max Amount',
      question: 'Which one has the highest amount?',
      history: [
        { from: 'user', text: 'Show pending invoices' },
        { from: 'bot', text: 'Found 3 pending invoices.' }
      ],
      expectedLang: 'en',
      expectedStatus: 'PENDING',
      expectedAgg: 'max_amount',
    },
  ];

  let passed = 0;

  testCases.forEach((tc) => {
    const lang = detectLanguageFallback(tc.question);
    const parsed = parseIntentRuleBased(tc.question, tc.history);

    const langMatch = lang === tc.expectedLang;
    const statusMatch = tc.expectedStatus ? parsed.filter.status === tc.expectedStatus : true;
    const aggMatch = tc.expectedAgg ? parsed.aggregation === tc.expectedAgg : true;
    const overdueMatch = tc.expectedOverdue ? parsed.filter.isOverdue === tc.expectedOverdue : true;

    const isPass = langMatch && statusMatch && aggMatch && overdueMatch;

    if (isPass) {
      passed++;
      console.log(`[PASS] ${tc.name} -> Lang: "${lang}", Status: "${parsed.filter.status}", Agg: "${parsed.aggregation}"`);
    } else {
      console.log(`[FAIL] ${tc.name} -> Got Lang: "${lang}" (Exp: ${tc.expectedLang}), Status: "${parsed.filter.status}" (Exp: ${tc.expectedStatus}), Agg: "${parsed.aggregation}" (Exp: ${tc.expectedAgg})`);
    }
  });

  console.log(`\nTest Summary: ${passed}/${testCases.length} Passed`);
  process.exit(passed === testCases.length ? 0 : 1);
}

runAssistantTests();
