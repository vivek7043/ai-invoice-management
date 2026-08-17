const Invoice = require('../models/Invoice');
const env = require('../config/env');
const { isInvoiceOverdue } = require('../utils/cleanData');

function formatINR(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function stripMarkdownFormatting(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectLanguageFallback(text) {
  if (!text) return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  if (/\b(ketlo|ketla|ketli|chhe|karo|bhaad|paasa|samachar)\b/i.test(text)) return 'gu';
  if (/\b(kitna|kitne|kitni|hai|karo|paisa|baaki|dikhao)\b/i.test(text)) return 'hi';
  return 'en';
}

async function callGeminiForAssistant(userQuestion, contextData, apiKey) {
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are a professional, helpful AI Invoice Assistant for a business.
User Question: "${userQuestion}"

Calculated Context Data:
${JSON.stringify(contextData, null, 2)}

STRICT RULES:
1. Answer the user's question directly, naturally, and professionally in plain text.
2. Use Indian currency format (e.g. ₹2,50,000 or ₹1.00).
3. DO NOT include database messages, debug text, or internal status like "Retrieved X invoices".
4. Never mention SQL, MongoDB, backend, controller, API, or query execution.
5. DO NOT use markdown bold/italic asterisks (*, **, ***), headers (##), or code backticks.
6. Format lists cleanly using simple bullet points (•) or numbered lists (1., 2.).
7. Keep the response concise, accurate, and easy to scan.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch (err) {
    console.error('Gemini API call failed in assistant, using natural fallback:', err.message);
    return null;
  }
}

async function processAssistantQuery(userId, question, conversationHistory = [], companyId = null) {
  const rawQ = (question || '').trim();
  const q = rawQ.toLowerCase();
  const lang = detectLanguageFallback(rawQ);

  const queryFilter = companyId ? { companyId } : { user: userId };
  const rawInvoices = await Invoice.find(queryFilter).sort({ createdAt: -1 }).lean();

  const invoices = rawInvoices.map((inv) => {
    const amt = Number(inv.totalAmount || inv.amount || inv.grandTotal || 0) || 0;
    const isPaid = (inv.status || '').toUpperCase() === 'PAID' || (inv.paymentStatus || '').toUpperCase() === 'PAID';
    const isOverdue = isInvoiceOverdue(inv);
    let statusStr = 'PENDING';
    if (isPaid) statusStr = 'PAID';
    else if (isOverdue) statusStr = 'OVERDUE';

    return {
      id: String(inv._id),
      invoiceNumber: inv.invoiceNumber || inv.fileName || 'Invoice',
      vendorName: (inv.vendorName || inv.extractedData?.vendorName || 'Unknown Vendor').trim(),
      amount: amt,
      status: statusStr,
      isPaid,
      isOverdue,
      dueDate: inv.dueDate || inv.paymentDueDate || null,
      createdAt: inv.createdAt || null,
      category: inv.invoiceType || inv.category || 'General',
    };
  });

  // Calculate high level metrics
  const totalCount = invoices.length;
  let totalCompanyAmount = 0;
  let totalPaidAmount = 0;
  let totalPendingAmount = 0;
  let totalOverdueAmount = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  invoices.forEach((inv) => {
    totalCompanyAmount += inv.amount;
    if (inv.isPaid) {
      totalPaidAmount += inv.amount;
      paidCount += 1;
    } else if (inv.isOverdue) {
      totalOverdueAmount += inv.amount;
      overdueCount += 1;
    } else {
      totalPendingAmount += inv.amount;
      pendingCount += 1;
    }
  });

  // Vendor map
  const vendorMap = {};
  invoices.forEach((inv) => {
    const vName = inv.vendorName;
    if (!vendorMap[vName]) {
      vendorMap[vName] = { name: vName, totalAmount: 0, count: 0, paid: 0, pending: 0, overdue: 0 };
    }
    vendorMap[vName].totalAmount += inv.amount;
    vendorMap[vName].count += 1;
    if (inv.isPaid) vendorMap[vName].paid += inv.amount;
    else if (inv.isOverdue) vendorMap[vName].overdue += inv.amount;
    else vendorMap[vName].pending += inv.amount;
  });

  let naturalAnswer = '';
  let contextData = {};

  // INTENT EVALUATION HIERARCHY

  // 1. Min / Lowest / Cheapest Invoice Intent
  if (q.includes('lowest') || q.includes('cheapest') || q.includes('min amount') || q.includes('least expensive') || q.includes('smallest invoice')) {
    if (invoices.length === 0) {
      naturalAnswer = `You currently have no invoices in your records.`;
    } else {
      const lowestInv = [...invoices].sort((a, b) => a.amount - b.amount)[0];
      naturalAnswer = `The invoice with the lowest amount is ${lowestInv.invoiceNumber} from ${lowestInv.vendorName}, with an amount of ${formatINR(lowestInv.amount)}.`;
      contextData = { type: 'lowest_invoice', invoice: lowestInv };
    }
  }
  // 2. Max / Highest / Most Expensive Invoice Intent
  else if (q.includes('highest') || q.includes('most expensive') || q.includes('max amount') || q.includes('biggest expense') || q.includes('largest invoice') || q.includes('highest value')) {
    if (invoices.length === 0) {
      naturalAnswer = `You currently have no invoices in your records.`;
    } else {
      const highestInv = [...invoices].sort((a, b) => b.amount - a.amount)[0];
      naturalAnswer = `Your highest-value invoice is ${highestInv.invoiceNumber} from ${highestInv.vendorName}, with an amount of ${formatINR(highestInv.amount)}. It is currently ${highestInv.status.toLowerCase()}.`;
      contextData = { type: 'highest_invoice', invoice: highestInv };
    }
  }
  // 3. Overdue Invoices Intent
  else if (q.includes('overdue')) {
    const overdueInvoices = invoices.filter((i) => i.isOverdue);
    if (q.includes('amount') || q.includes('total') || q.includes('how much')) {
      naturalAnswer = `Your total overdue amount is ${formatINR(totalOverdueAmount)} across ${overdueCount} overdue invoice(s).`;
    } else if (overdueInvoices.length === 0) {
      naturalAnswer = `You have no overdue invoices right now! All payments are up to date.`;
    } else {
      const listStr = overdueInvoices
        .map((inv) => `• ${inv.invoiceNumber}\n  Vendor: ${inv.vendorName}\n  Amount: ${formatINR(inv.amount)}`)
        .join('\n\n');
      naturalAnswer = `You have ${overdueInvoices.length} overdue invoice(s):\n\n${listStr}`;
    }
    contextData = { type: 'overdue_invoices', count: overdueCount, total: totalOverdueAmount, invoices: overdueInvoices };
  }
  // 4. Pending / Unpaid Invoices Intent
  else if (q.includes('pending') || q.includes('unpaid') || q.includes('outstanding') || q.includes('owe') || q.includes('baaki')) {
    const unpaidInvoices = invoices.filter((i) => !i.isPaid);
    const combinedUnpaidTotal = totalPendingAmount + totalOverdueAmount;

    if (q.includes('amount') || q.includes('total') || q.includes('how much')) {
      naturalAnswer = `Your total pending amount is ${formatINR(combinedUnpaidTotal)} across ${unpaidInvoices.length} unpaid invoice(s).`;
    } else if (unpaidInvoices.length === 0) {
      naturalAnswer = `You currently have no pending or unpaid invoices.`;
    } else {
      const listStr = unpaidInvoices
        .map((inv, idx) => `${idx + 1}. ${inv.invoiceNumber}\n   Vendor: ${inv.vendorName}\n   Amount: ${formatINR(inv.amount)}\n   Status: ${inv.status}`)
        .join('\n\n');
      naturalAnswer = `Here are your pending & unpaid invoices:\n\n${listStr}`;
    }
    contextData = { type: 'pending_invoices', count: unpaidInvoices.length, total: combinedUnpaidTotal, invoices: unpaidInvoices };
  }
  // 5. Paid Invoices Intent
  else if (q.includes('paid') || q.includes('cleared') || q.includes('settled')) {
    const paidInvoices = invoices.filter((i) => i.isPaid);
    if (q.includes('amount') || q.includes('total') || q.includes('how much')) {
      naturalAnswer = `You have paid a total of ${formatINR(totalPaidAmount)} across ${paidCount} paid invoice(s).`;
    } else if (paidInvoices.length === 0) {
      naturalAnswer = `You have not marked any invoices as paid yet.`;
    } else {
      const listStr = paidInvoices
        .map((inv, idx) => `${idx + 1}. ${inv.invoiceNumber} — ${inv.vendorName} — ${formatINR(inv.amount)}`)
        .join('\n');
      naturalAnswer = `Here are your paid invoices:\n\n${listStr}`;
    }
    contextData = { type: 'paid_invoices', count: paidCount, total: totalPaidAmount, invoices: paidInvoices };
  }
  // 6. Latest / Recent Invoices Intent
  else if (q.includes('latest') || q.includes('recent') || q.includes('newest') || q.includes('show invoices') || q.includes('list invoices')) {
    if (invoices.length === 0) {
      naturalAnswer = `You have no invoices stored in your company account yet.`;
    } else {
      const recentList = invoices.slice(0, 5);
      const listStr = recentList
        .map((inv, idx) => `${idx + 1}. ${inv.invoiceNumber}\n   Vendor: ${inv.vendorName}\n   Amount: ${formatINR(inv.amount)}\n   Status: ${inv.status}`)
        .join('\n\n');
      naturalAnswer = `Here are your latest invoices:\n\n${listStr}`;
    }
    contextData = { type: 'recent_invoices', invoices: invoices.slice(0, 5) };
  }
  // 7. Top Vendors Intent
  else if (q.includes('top vendor') || q.includes('top vendors') || q.includes('highest spending vendor') || q.includes('highest spend vendor') || q.includes('compare vendors') || q.includes('vendor ranking')) {
    const sortedVendors = Object.values(vendorMap).sort((a, b) => b.totalAmount - a.totalAmount);
    if (sortedVendors.length === 0) {
      naturalAnswer = `You currently have no recorded vendors.`;
    } else {
      const listStr = sortedVendors
        .slice(0, 5)
        .map((v, i) => `${i + 1}. ${v.name} — ${formatINR(v.totalAmount)} across ${v.count} invoice(s)`)
        .join('\n');
      naturalAnswer = `Your top vendors by total invoice amount are:\n\n${listStr}`;
    }
    contextData = { type: 'top_vendors', vendors: sortedVendors };
  }
  // 8. Specific Invoice Lookup Intent (Only if explicit number/code requested)
  else if (
    q.includes('tell me about invoice') ||
    q.includes('show invoice') ||
    q.includes('details of invoice') ||
    q.includes('detail of') ||
    q.includes('search invoice') ||
    q.includes('find invoice') ||
    /^(vmt|corp|inv|[a-z]{2,6})-\d{4}-\d{3,6}$/i.test(rawQ) ||
    invoices.some((inv) => inv.invoiceNumber.toLowerCase() === q || inv.invoiceNumber.replace(/[^a-z0-9]/gi, '').toLowerCase() === q.replace(/[^a-z0-9]/gi, ''))
  ) {
    const cleanedSearchTerm = rawQ.replace(/(tell me about|show me|show|details of|details|invoice|search for|find|about|the)/gi, '').trim();
    const normalizedTerm = cleanedSearchTerm.replace(/[^a-z0-9]/gi, '').toLowerCase();

    const targetedInvoice = invoices.find((inv) => {
      const normInvNum = inv.invoiceNumber.replace(/[^a-z0-9]/gi, '').toLowerCase();
      return normInvNum === normalizedTerm || (normalizedTerm.length >= 3 && normInvNum.includes(normalizedTerm));
    });

    if (targetedInvoice) {
      const dueStr = targetedInvoice.dueDate ? formatDate(targetedInvoice.dueDate) : 'Not specified';
      naturalAnswer = `Here are the details for ${targetedInvoice.invoiceNumber}:\n\n• Invoice Number: ${targetedInvoice.invoiceNumber}\n• Vendor: ${targetedInvoice.vendorName}\n• Amount: ${formatINR(targetedInvoice.amount)}\n• Status: ${targetedInvoice.status}\n• Due Date: ${dueStr}`;
      contextData = { type: 'specific_invoice', invoice: targetedInvoice };
    } else {
      naturalAnswer = `I couldn't find an invoice with the number "${cleanedSearchTerm || rawQ}" in your company records. You can check the invoice number or vendor name and try again.`;
      contextData = { type: 'not_found_invoice', term: cleanedSearchTerm || rawQ };
    }
  }
  // 9. Specific Vendor Lookup Intent (e.g. "Who is VM Technology?", "Show invoices from VM Technology")
  else if (q.includes('vendor') || q.includes('who is') || Object.keys(vendorMap).some((v) => v.toLowerCase() === q.replace(/(who is|show|tell me about|invoices from|vendor|invoices)/gi, '').trim())) {
    const targetVendorTerm = rawQ.replace(/(who is|show invoices from|show|tell me about|vendor|invoices from|invoices|my)/gi, '').trim();
    const matchedVendorKey = Object.keys(vendorMap).find((v) => v.toLowerCase().includes(targetVendorTerm.toLowerCase()));

    if (matchedVendorKey) {
      const v = vendorMap[matchedVendorKey];
      naturalAnswer = `${v.name} is one of your vendors.\n\nYou currently have ${v.count} invoice(s) from this vendor with a combined amount of ${formatINR(v.totalAmount)}.\n\n• Pending: ${formatINR(v.pending)}\n• Overdue: ${formatINR(v.overdue)}\n• Paid: ${formatINR(v.paid)}`;
      contextData = { type: 'vendor_details', vendor: v };
    } else if (targetVendorTerm && targetVendorTerm.length > 2) {
      naturalAnswer = `I couldn't find any invoices for "${targetVendorTerm}" in your current company records.`;
      contextData = { type: 'not_found_vendor', term: targetVendorTerm };
    }
  }
  // 10. Totals & Counts
  else if (q.includes('how many') || q.includes('total count') || q.includes('count of invoices')) {
    naturalAnswer = `You currently have ${totalCount} invoice(s) recorded in your company account.`;
    contextData = { type: 'invoice_count', count: totalCount };
  } else if (q.includes('total amount') || q.includes('total spend') || q.includes('total value')) {
    naturalAnswer = `Your total recorded invoice value is ${formatINR(totalCompanyAmount)} across ${totalCount} invoice(s).`;
    contextData = { type: 'total_amount', total: totalCompanyAmount, count: totalCount };
  }
  // 11. General / Fallback Summary
  else {
    if (invoices.length === 0) {
      naturalAnswer = `I couldn't find any matching invoices in your records.`;
    } else {
      const topV = Object.values(vendorMap).sort((a, b) => b.totalAmount - a.totalAmount)[0]?.name || 'N/A';
      naturalAnswer = `Here is a summary of your company invoices:\n\n• Total Invoices: ${totalCount}\n• Total Amount: ${formatINR(totalCompanyAmount)}\n• Paid: ${formatINR(totalPaidAmount)} (${paidCount})\n• Pending: ${formatINR(totalPendingAmount)} (${pendingCount})\n• Overdue: ${formatINR(totalOverdueAmount)} (${overdueCount})\n• Top Vendor: ${topV}`;
    }
    contextData = { type: 'general_summary', totalCount, totalCompanyAmount, invoices: invoices.slice(0, 5) };
  }

  // Attempt Gemini REST call if GEMINI_API_KEY is available
  const apiKey = env.GEMINI_API_KEY;
  if (apiKey) {
    const aiGeneratedText = await callGeminiForAssistant(rawQ, { ...contextData, invoicesSample: invoices.slice(0, 10) }, apiKey);
    if (aiGeneratedText && aiGeneratedText.length > 10 && !aiGeneratedText.toLowerCase().includes('retrieved')) {
      naturalAnswer = aiGeneratedText;
    }
  }

  const finalCleanAnswer = stripMarkdownFormatting(naturalAnswer);

  return {
    answer: finalCleanAnswer,
    detectedLanguage: lang,
    summary: {
      totalCount,
      totalCompanyAmount,
    },
  };
}

module.exports = {
  detectLanguageFallback,
  stripMarkdownFormatting,
  processAssistantQuery,
};
