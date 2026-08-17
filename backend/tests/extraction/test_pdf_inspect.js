const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const samplePdfPath = path.join(__dirname, 'uploads', 'invoices', '1786524384032-977918345-invoice_INV-2026-001.pdf');

async function main() {
  const dataBuffer = fs.readFileSync(samplePdfPath);
  const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
  const textResult = await parser.getText({ pageJoiner: '\n' });
  await parser.destroy();

  const lines = textResult.text.split('\n');
  console.log('LINE COUNT:', lines.length);
  lines.forEach((l, idx) => console.log(`${idx + 1}: ${JSON.stringify(l)}`));
}

main();
