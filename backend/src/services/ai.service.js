const env = require('../config/env');
const aiCore = require('./aiServiceCore');
const assistantCore = require('./assistantServiceCore');

async function callGeminiRestApi(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API HTTP Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0 || !candidates[0].content || !candidates[0].content.parts) {
    throw new Error('Invalid response structure from Gemini API');
  }

  return candidates[0].content.parts[0].text;
}

module.exports = {
  extractInvoiceFields: aiCore.extractInvoiceFields,
  extractWithRuleBasedAI: aiCore.extractWithRuleBasedAI,
  processAssistantQuery: assistantCore.processAssistantQuery,
  normalizeEntityName: assistantCore.normalizeEntityName,
  detectLanguageFallback: assistantCore.detectLanguageFallback,
  parseIntentRuleBased: assistantCore.parseIntentRuleBased,
  callGeminiRestApi,
};
