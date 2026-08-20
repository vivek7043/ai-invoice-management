const fs = require('fs');
const path = require('path');
const os = require('os');
const { createWorker } = require('tesseract.js');
const { pdfToPng } = require('pdf-to-png-converter');
const { extractInvoiceFields } = require('../../src/services/ai.service');

async function runOcrOnPdf(filePath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-ocr-test-'));
  await pdfToPng(filePath, { outputFolder: tempDir, outputFileMask: 'page', viewportScale: 2.0 });
  const imageFiles = fs.readdirSync(tempDir)
    .filter((name) => name.endsWith('.png'))
    .sort((a, b) => Number(a.match(/(\d+)/)?.[1] || 0) - Number(b.match(/(\d+)/)?.[1] || 0))
    .map((name) => path.join(tempDir, name));
  const worker = await createWorker('eng');
  let combinedText = '';
  try {
    for (const imagePath of imageFiles) {
      const result = await worker.recognize(imagePath);
      combinedText += `${result.data.text}\n`;
    }
  } finally {
    await worker.terminate();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  return combinedText.trim();
}

(async () => {
  const invoicesDir = path.join(__dirname, '../../uploads', 'invoices');
  const files = fs.readdirSync(invoicesDir).filter((f) => f.endsWith('G175972857.pdf'));
  const filePath = path.join(invoicesDir, files[0]);

  const text = await runOcrOnPdf(filePath);
  const result = await extractInvoiceFields(text);

  console.log('=== REAL PDF AI EXTRACTION ===');
  console.log(JSON.stringify(result, null, 2));
})();
