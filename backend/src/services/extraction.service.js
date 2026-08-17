const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { runOcrPipeline } = require('./ocr.service');

/**
 * Robust PDF Text Extraction Pipeline combining pdf-parse and fallback Tesseract OCR
 */
async function extractPdfTextAndMetadata(filePath) {
  let directText = '';
  let pageCount = 1;

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
    const textResult = await parser.getText({ pageJoiner: '\n' });
    if (textResult) {
      if (textResult.pages && Array.isArray(textResult.pages)) {
        pageCount = textResult.pages.length;
      }
      if (textResult.text && textResult.text.trim()) {
        directText = textResult.text.trim();
      }
    }
    await parser.destroy();
  } catch (parseErr) {
    console.log('Direct PDF text extraction exception/warning:', parseErr.message);
  }

  const isUsableText = directText && directText.length >= 20 && /[a-zA-Z0-9]/.test(directText);

  if (isUsableText) {
    return {
      extractedText: directText,
      extractionMethod: 'direct-text',
      pageCount,
    };
  }

  console.log('PDF does not contain usable direct text. Running OCR fallback...');
  return await runOcrPipeline(filePath, pageCount);
}

module.exports = {
  extractPdfTextAndMetadata,
};
