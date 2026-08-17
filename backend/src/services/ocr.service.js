const fs = require('fs');
const path = require('path');
const os = require('os');
const { createWorker } = require('tesseract.js');
const pdfPoppler = require('pdf-poppler');

/**
 * OCR pipeline converting PDF pages to high-resolution images and performing Tesseract OCR
 */
async function runOcrPipeline(filePath, initialPageCount = 1) {
  console.log('Running high-resolution OCR pipeline on PDF...');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invoice-ocr-'));
  const options = {
    format: 'png',
    out_dir: tempDir,
    out_prefix: 'page',
    page: null,
    scale: 2048,
  };

  let ocrCombinedText = '';
  let ocrPageCount = initialPageCount;

  const tessDataDir = path.join(__dirname, '../../resources/tessdata');

  try {
    await pdfPoppler.convert(filePath, options);
    const imageFiles = fs.readdirSync(tempDir)
      .filter((name) => name.endsWith('.png'))
      .sort((a, b) => Number(a.match(/(\d+)/)?.[1] || 0) - Number(b.match(/(\d+)/)?.[1] || 0))
      .map((name) => path.join(tempDir, name));

    if (imageFiles.length > 0) {
      ocrPageCount = imageFiles.length;
    }

    const workerOptions = {};
    if (fs.existsSync(path.join(tessDataDir, 'eng.traineddata'))) {
      workerOptions.langPath = tessDataDir;
      workerOptions.cachePath = tessDataDir;
    }

    const worker = await createWorker('eng', 1, workerOptions);
    try {
      for (const imagePath of imageFiles) {
        const result = await worker.recognize(imagePath);
        if (result && result.data && result.data.text) {
          ocrCombinedText += `${result.data.text}\n`;
        }
      }
    } finally {
      await worker.terminate();
    }
  } catch (ocrErr) {
    console.error('OCR processing error:', ocrErr.message);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const finalOcrText = ocrCombinedText.trim();
  if (!finalOcrText) {
    throw new Error('OCR failed: no readable text could be extracted');
  }

  return {
    extractedText: finalOcrText,
    extractionMethod: 'ocr',
    pageCount: ocrPageCount,
  };
}

module.exports = {
  runOcrPipeline,
};
