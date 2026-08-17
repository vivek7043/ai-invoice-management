const env = require('../config/env');

const DEFAULT_FIELDS = {
  invoiceNumber: null,
  invoiceDate: null,
  dueDate: null,
  vendorName: null,
  vendorAddress: null,
  vendorEmail: null,
  vendorPhone: null,
  customerName: null,
  customerAddress: null,
  customerEmail: null,
  customerPhone: null,
  amount: null,
  tax: null,
  cgst: null,
  sgst: null,
  igst: null,
  vat: null,
  subtotal: null,
  discount: null,
  grandTotal: null,
  totalAmount: null,
  balanceDue: null,
  amountPaid: null,
  amountDue: null,
  status: 'PENDING',
  paymentStatus: null,
  currency: 'INR',
  purchaseOrderNumber: null,
  paymentTerms: null,
  bankName: null,
  accountNumber: null,
  ifscCode: null,
  swiftCode: null,
  iban: null,
  upiId: null,
  gstin: null,
  vatNumber: null,
  pan: null,
  cin: null,
  lineItems: [],
  taxes: [],
};

function normalizeDate(rawStr) {
  if (!rawStr) return null;
  const s = rawStr.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const [, y, mon, d] = m;
    return `${y}-${mon.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const [, d, mon, y] = m;
    return `${y}-${mon.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return dt.toISOString().split('T')[0];
  }
  return null;
}

function parseAmount(valStr) {
  if (!valStr) return null;
  const cleaned = String(valStr).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function detectCurrency(text) {
  if (!text) return 'INR';
  if (/₹|\bINR\b|\bRs\.?\b/i.test(text)) return 'INR';
  if (/\$|\bUSD\b/i.test(text)) return 'USD';
  if (/€|\bEUR\b/i.test(text)) return 'EUR';
  if (/£|\bGBP\b/i.test(text)) return 'GBP';
  return 'INR';
}

function extractVendorName(lines) {
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/\b(INVOICE|TAX INVOICE|BILL|RECEIPT|STATEMENT|PURCHASE ORDER|QUOTATION)\b/i.test(line)) continue;
    if (/\b(Date|Invoice No|Bill No|PO No|GSTIN|PAN|Phone|Email|Bill To|Ship To)\b/i.test(line)) continue;
    if (line.length > 2 && line.length < 60) {
      return line;
    }
  }
  return null;
}

function extractInvoiceNumber(text) {
  const match = text.match(/(?:Invoice\s*(?:No|Num|#|Number)?|Inv\s*#?|Bill\s*(?:No|Num|#)?)\s*[:.-]?\s*([A-Z0-9/-]{3,30})/i);
  return match ? match[1].trim() : null;
}

function extractInvoiceDate(text) {
  const match = text.match(/(?:Invoice\s*Date|Bill\s*Date|Date)\s*[:.-]?\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/i);
  return match ? normalizeDate(match[1]) : null;
}

function extractDueDate(text) {
  const match = text.match(/(?:Due\s*Date|Payment\s*Due|Pay\s*By)\s*[:.-]?\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/i);
  return match ? normalizeDate(match[1]) : null;
}

function extractAmount(text) {
  const match = text.match(/(?:Grand\s*Total|Total\s*Amount|Total|Amount\s*Due)\s*[:.-]?\s*([₹$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
  return match ? parseAmount(match[1]) : null;
}

function extractGSTIN(text) {
  const match = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}\b/);
  return match ? match[0] : null;
}

function extractPAN(text) {
  const match = text.match(/\b[A-Z]{5}\d{4}[A-Z]{1}\b/);
  return match ? match[0] : null;
}

function extractWithRuleBasedAI(text) {
  if (!text || typeof text !== 'string') {
    return { ...DEFAULT_FIELDS };
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const result = { ...DEFAULT_FIELDS };

  result.currency = detectCurrency(text);
  result.vendorName = extractVendorName(lines);
  result.invoiceNumber = extractInvoiceNumber(text);
  result.invoiceDate = extractInvoiceDate(text);
  result.dueDate = extractDueDate(text);
  result.amount = extractAmount(text);
  result.totalAmount = result.amount;
  result.grandTotal = result.amount;
  result.gstin = extractGSTIN(text);
  result.pan = extractPAN(text);

  if (/PAID|FULLY PAID/i.test(text)) {
    result.status = 'PAID';
    result.paymentStatus = 'PAID';
  } else if (/OVERDUE|PAST DUE/i.test(text)) {
    result.status = 'OVERDUE';
    result.paymentStatus = 'OVERDUE';
  }

  return result;
}

async function extractInvoiceFields(text) {
  const apiKey = env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `Extract standard invoice JSON fields from the text below. Return ONLY a valid JSON object with keys: invoiceNumber, invoiceDate, dueDate, vendorName, vendorAddress, vendorEmail, vendorPhone, customerName, customerAddress, customerEmail, customerPhone, amount, tax, cgst, sgst, igst, vat, subtotal, discount, grandTotal, totalAmount, balanceDue, amountPaid, amountDue, status, paymentStatus, currency, purchaseOrderNumber, paymentTerms, bankName, accountNumber, ifscCode, swiftCode, iban, upiId, gstin, vatNumber, pan, cin.\n\nText:\n${text}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const cleanJson = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return { ...DEFAULT_FIELDS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Gemini extraction fallback to rule-based parser:', e.message);
    }
  }

  return extractWithRuleBasedAI(text);
}

module.exports = {
  DEFAULT_FIELDS,
  extractWithRuleBasedAI,
  extractInvoiceFields,
};
