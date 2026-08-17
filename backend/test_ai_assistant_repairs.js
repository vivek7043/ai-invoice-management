const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');
const { processAssistantQuery } = require('./src/services/assistantServiceCore');

const testQuestions = [
  'Which invoice has the lowest amount?',
  'Which invoice has the highest amount?',
  'Show my latest invoices',
  'Show my overdue invoices',
  'What is my total pending amount?',
  'What is my total overdue amount?',
  'Show my top vendors',
  'Who is VM Technology?',
  'Show invoices from VM Technology',
  'Tell me about invoice VMT-2026-089',
  'Show invoice CORP-2026-786',
  'Show invoice NON-EXISTENT-999',
  'How many invoices do I have?',
  'What is my total invoice amount?',
  'Show my unpaid invoices',
  'Give me a summary of my invoices',
];

async function runTests() {
  console.log('--- STARTING AI ASSISTANT VERIFICATION ---');
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_invoice';
  await mongoose.connect(mongoUrl);
  console.log('✅ Connected to MongoDB');

  const owner = await User.findOne({ role: 'owner' });
  const userId = owner ? owner._id : null;
  const companyId = owner ? owner.companyId : null;

  for (let i = 0; i < testQuestions.length; i++) {
    const q = testQuestions[i];
    console.log(`\n========================================`);
    console.log(`Q${i + 1}: "${q}"`);
    console.log(`----------------------------------------`);
    const res = await processAssistantQuery(userId, q, [], companyId);
    console.log(`AI Response:\n${res.answer}`);
  }

  await mongoose.disconnect();
  console.log('\n========================================');
  console.log('✅ AI ASSISTANT TEST SUITE COMPLETED SUCCESSFULLY');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  mongoose.disconnect();
});
