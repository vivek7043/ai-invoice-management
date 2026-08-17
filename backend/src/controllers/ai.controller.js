const { processAssistantQuery } = require('../services/ai.service');

async function processAiQuery(req, res) {
  try {
    const { question, conversationHistory } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ message: 'Question string is required' });
    }

    const userId = req.user._id || req.user.id;
    const companyId = req.user.companyId;

    const responseData = await processAssistantQuery(userId, question, conversationHistory || [], companyId);

    return res.status(200).json({
      success: true,
      answer: responseData.answer,
      detectedLanguage: responseData.detectedLanguage,
      summary: responseData.summary,
    });
  } catch (err) {
    console.error('AI Assistant Query Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI assistant request',
      error: err.message,
    });
  }
}

module.exports = {
  processAiQuery,
};
