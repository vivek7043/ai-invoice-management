const Invoice = require('../models/Invoice');
const { getCompanyFilter, isInvoiceOverdue } = require('../utils/cleanData');
const { normalizeEntityName } = require('../services/ai.service');
const { createAuditLog } = require('../services/auditLog.service');

function getInvoiceDate(inv) {
  const dStr = inv.invoiceDate || inv.createdAt;
  if (!dStr) return new Date();
  const dt = new Date(dStr);
  return isNaN(dt.getTime()) ? new Date() : dt;
}

async function getReportData(req, res) {
  try {
    const { reportType, startDate, endDate } = req.query;
    const filter = getCompanyFilter(req);

    const allInvoices = await Invoice.find(filter).sort({ createdAt: -1 });

    let startBoundary = null;
    let endBoundary = null;

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) {
        startBoundary = new Date(parsedStart.setHours(0, 0, 0, 0));
      }
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) {
        endBoundary = new Date(parsedEnd.setHours(23, 59, 59, 999));
      }
    }

    if (!startBoundary || !endBoundary) {
      const now = new Date();
      endBoundary = new Date(now.setHours(23, 59, 59, 999));

      if (reportType === 'yearly') {
        startBoundary = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      } else {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
        startBoundary = sixMonthsAgo;
      }
    }

    const filteredInvoices = allInvoices.filter((inv) => {
      const invDt = getInvoiceDate(inv);
      if (startBoundary && invDt < startBoundary) return false;
      if (endBoundary && invDt > endBoundary) return false;
      return true;
    });

    const totalInvoices = filteredInvoices.length;
    let totalExpense = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const currencyCounts = {};
    const cleanInvoiceRecords = [];

    for (const rawInv of filteredInvoices) {
      const inv = rawInv.toObject ? rawInv.toObject() : rawInv;
      const amt = Number(inv.amount || inv.totalAmount || 0) || 0;
      totalExpense += amt;

      const currency = inv.currency || (inv.extractedData ? inv.extractedData.currency : null) || 'INR';
      currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;

      const isPaid = (inv.status || '').toUpperCase() === 'PAID' || (inv.paymentStatus || '').toUpperCase() === 'PAID';
      const isOverdue = isInvoiceOverdue(inv);

      let status = 'PENDING';
      if (isPaid) {
        status = 'PAID';
        paidAmount += amt;
        paidCount++;
      } else if (isOverdue) {
        status = 'OVERDUE';
        overdueAmount += amt;
        overdueCount++;
      } else {
        pendingAmount += amt;
        pendingCount++;
      }

      cleanInvoiceRecords.push({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber || inv.fileName,
        vendorName: inv.vendorName || inv.vendorLegalName || 'Unknown Vendor',
        invoiceDate: inv.invoiceDate || inv.createdAt,
        dueDate: inv.dueDate,
        amount: amt,
        currency,
        status,
      });
    }

    let dominantCurrency = 'INR';
    let maxCurrCount = 0;
    for (const [curr, count] of Object.entries(currencyCounts)) {
      if (count > maxCurrCount) {
        maxCurrCount = count;
        dominantCurrency = curr;
      }
    }

    const monthMap = new Map();
    const currMonth = new Date(startBoundary.getFullYear(), startBoundary.getMonth(), 1);
    const endMonth = new Date(endBoundary.getFullYear(), endBoundary.getMonth(), 1);

    while (currMonth <= endMonth) {
      const mKey = currMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthMap.set(mKey, { month: mKey, expense: 0, paid: 0, sortTime: currMonth.getTime() });
      currMonth.setMonth(currMonth.getMonth() + 1);
    }

    for (const invRecord of cleanInvoiceRecords) {
      const dt = new Date(invRecord.invoiceDate);
      if (!isNaN(dt.getTime())) {
        const mKey = dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthMap.has(mKey)) {
          const entry = monthMap.get(mKey);
          entry.expense += invRecord.amount;
          if (invRecord.status === 'PAID') {
            entry.paid += invRecord.amount;
          }
        }
      }
    }

    const monthlyTrend = Array.from(monthMap.values()).map((m) => ({
      month: m.month,
      expense: m.expense,
      paid: m.paid,
    }));

    const vendorSpendMap = new Map();
    for (const invRecord of cleanInvoiceRecords) {
      const vName = invRecord.vendorName;
      const cKey = normalizeEntityName ? (normalizeEntityName(vName) || vName) : vName.trim().toLowerCase();

      if (!vendorSpendMap.has(cKey)) {
        vendorSpendMap.set(cKey, {
          vendor: vName,
          amount: 0,
          invoiceCount: 0,
        });
      }
      const item = vendorSpendMap.get(cKey);
      item.amount += invRecord.amount;
      item.invoiceCount++;
    }

    const topVendors = Array.from(vendorSpendMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const totalCount = totalInvoices || 1;
    const paidPct = Math.round((paidCount / totalCount) * 100);
    const pendingPct = Math.round((pendingCount / totalCount) * 100);
    const overduePct = Math.round((overdueCount / totalCount) * 100);

    const statusDistribution = [
      { name: 'Paid', value: paidCount, percentage: paidPct, amount: paidAmount, fill: '#10B981' },
      { name: 'Pending', value: pendingCount, percentage: pendingPct, amount: pendingAmount, fill: '#F59E0B' },
      { name: 'Overdue', value: overdueCount, percentage: overduePct, amount: overdueAmount, fill: '#EF4444' },
    ];

    await createAuditLog({
      companyId: req.user ? req.user.companyId : null,
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Owner',
      action: 'REPORT_GENERATED',
      entityType: 'Report',
      description: 'Invoice report was generated',
      metadata: { reportType: reportType || 'custom', totalInvoices },
    });

    return res.status(200).json({
      success: true,
      reportType: reportType || 'custom',
      period: {
        startDate: startBoundary.toISOString().split('T')[0],
        endDate: endBoundary.toISOString().split('T')[0],
      },
      summary: {
        totalInvoices,
        totalExpense,
        paidAmount,
        pendingAmount,
        overdueAmount,
        currency: dominantCurrency,
      },
      monthlyTrend,
      topVendors,
      statusDistribution,
      invoices: cleanInvoiceRecords,
    });
  } catch (error) {
    console.error('Error generating report data:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate report data' });
  }
}

async function exportReportExcel(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const filter = getCompanyFilter(req);
    const allInvoices = await Invoice.find(filter).sort({ createdAt: -1 });

    let startBoundary = startDate ? new Date(startDate) : new Date(2000, 0, 1);
    let endBoundary = endDate ? new Date(endDate) : new Date(2099, 11, 31);
    if (!isNaN(startBoundary.getTime())) startBoundary.setHours(0, 0, 0, 0);
    if (!isNaN(endBoundary.getTime())) endBoundary.setHours(23, 59, 59, 999);

    const filtered = allInvoices.filter((inv) => {
      const invDt = getInvoiceDate(inv);
      return invDt >= startBoundary && invDt <= endBoundary;
    });

    let csv = '\uFEFF';
    csv += 'INVOICE EXPENSE REPORT\n';
    csv += `Generated Date,${new Date().toLocaleDateString()}\n`;
    csv += `Period,${startDate || 'All Time'} to ${endDate || 'Present'}\n`;
    csv += `Total Invoices,${filtered.length}\n`;
    csv += '\n';

    csv += 'Invoice Number,Vendor Name,Invoice Date,Due Date,Amount,Currency,Status\n';

    for (const rawInv of filtered) {
      const inv = rawInv.toObject ? rawInv.toObject() : rawInv;
      const invNum = `"${(inv.invoiceNumber || inv.fileName || '').replace(/"/g, '""')}"`;
      const vName = `"${(inv.vendorName || inv.vendorLegalName || 'Unknown Vendor').replace(/"/g, '""')}"`;
      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '';
      const dueDate = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '';
      const amt = Number(inv.amount || inv.totalAmount || 0) || 0;
      const currency = inv.currency || (inv.extractedData ? inv.extractedData.currency : null) || 'INR';

      const isPaid = (inv.status || '').toUpperCase() === 'PAID' || (inv.paymentStatus || '').toUpperCase() === 'PAID';
      const isOverdue = isInvoiceOverdue(inv);
      const status = isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'PENDING');

      csv += `${invNum},${vName},${invDate},${dueDate},${amt},${currency},${status}\n`;
    }

    await createAuditLog({
      companyId: req.user ? req.user.companyId : null,
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Owner',
      action: 'REPORT_EXPORTED',
      entityType: 'Report',
      description: 'Invoice report was exported as Excel',
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Invoice_Report.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting Excel report:', error);
    return res.status(500).json({ success: false, message: 'Failed to export Excel report' });
  }
}

async function exportReportPdf(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const filter = getCompanyFilter(req);
    const allInvoices = await Invoice.find(filter).sort({ createdAt: -1 });

    let startBoundary = startDate ? new Date(startDate) : new Date(2000, 0, 1);
    let endBoundary = endDate ? new Date(endDate) : new Date(2099, 11, 31);
    if (!isNaN(startBoundary.getTime())) startBoundary.setHours(0, 0, 0, 0);
    if (!isNaN(endBoundary.getTime())) endBoundary.setHours(23, 59, 59, 999);

    const filtered = allInvoices.filter((inv) => {
      const invDt = getInvoiceDate(inv);
      return invDt >= startBoundary && invDt <= endBoundary;
    });

    let totalExpense = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    for (const inv of filtered) {
      const amt = Number(inv.amount || inv.totalAmount || 0) || 0;
      totalExpense += amt;
      const isPaid = (inv.status || '').toUpperCase() === 'PAID' || (inv.paymentStatus || '').toUpperCase() === 'PAID';
      const isOverdue = isInvoiceOverdue(inv);
      if (isPaid) paidAmount += amt;
      else if (isOverdue) overdueAmount += amt;
      else pendingAmount += amt;
    }

    const reportText = `
================================================================================
                           INVOICE EXPENSE REPORT
================================================================================
Generated Date: ${new Date().toLocaleDateString()}
Report Period:  ${startDate || 'All Time'} to ${endDate || 'Present'}

SUMMARY METRICS:
--------------------------------------------------------------------------------
Total Invoices:     ${filtered.length}
Total Expense:      ₹${totalExpense.toLocaleString('en-IN')}
Paid Amount:        ₹${paidAmount.toLocaleString('en-IN')}
Pending Amount:     ₹${pendingAmount.toLocaleString('en-IN')}
Overdue Amount:     ₹${overdueAmount.toLocaleString('en-IN')}

INVOICE BREAKDOWN:
--------------------------------------------------------------------------------
${filtered
  .map(
    (i) =>
      `• Invoice: ${(i.invoiceNumber || i.fileName || '').padEnd(20)} Vendor: ${(i.vendorName || 'Unknown').padEnd(25)} Amount: ₹${(i.amount || 0).toLocaleString('en-IN').padEnd(12)} Status: ${i.status || 'PENDING'}`
  )
  .join('\n')}
================================================================================
`;

    await createAuditLog({
      companyId: req.user ? req.user.companyId : null,
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'Owner',
      action: 'REPORT_EXPORTED',
      entityType: 'Report',
      description: 'Invoice report was exported as PDF',
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Invoice_Report.txt"');
    return res.status(200).send(reportText);
  } catch (error) {
    console.error('Error exporting PDF report:', error);
    return res.status(500).json({ success: false, message: 'Failed to export PDF report' });
  }
}

module.exports = {
  getReportData,
  exportReportExcel,
  exportReportPdf,
};
