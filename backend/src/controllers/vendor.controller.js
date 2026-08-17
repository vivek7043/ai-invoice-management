const Invoice = require('../models/Invoice');
const { getCompanyFilter, cleanData } = require('../utils/cleanData');

async function getVendors(req, res) {
  try {
    const filter = getCompanyFilter(req);
    const invoices = await Invoice.find(filter).lean();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').trim().toLowerCase();

    const vendorMap = {};

    let globalTotalInvoices = 0;
    let globalTotalVendorSpend = 0;
    let globalPendingVendorAmount = 0;
    let globalOverdueVendorAmount = 0;

    for (const inv of invoices) {
      const rawVendorName = inv.vendorName || inv.extractedData?.vendorName;
      if (!rawVendorName || typeof rawVendorName !== 'string' || !rawVendorName.trim()) {
        continue;
      }

      const cleanVendorName = rawVendorName.trim();
      const vendorKey = cleanVendorName.toLowerCase();

      const totalAmt = Number(inv.totalAmount || inv.amount || inv.grandTotal || 0) || 0;
      const isPaid = (inv.status || '').toUpperCase() === 'PAID' || (inv.paymentStatus || '').toUpperCase() === 'PAID';
      const isOverdue = (inv.status || '').toUpperCase() === 'OVERDUE' || (inv.paymentStatus || '').toUpperCase() === 'OVERDUE';

      globalTotalInvoices += 1;
      globalTotalVendorSpend += totalAmt;

      if (!isPaid) {
        if (isOverdue) {
          globalOverdueVendorAmount += totalAmt;
        } else {
          globalPendingVendorAmount += totalAmt;
        }
      }

      if (!vendorMap[vendorKey]) {
        vendorMap[vendorKey] = {
          id: vendorKey,
          _id: vendorKey,
          vendorKey,
          vendorName: cleanVendorName,
          vendorLegalName: inv.vendorLegalName || inv.extractedData?.vendorLegalName || cleanVendorName,
          vendorEmail: inv.vendorEmail || inv.extractedData?.vendorEmail || null,
          vendorPhone: inv.vendorPhone || inv.extractedData?.vendorPhone || null,
          taxId: inv.taxId || inv.GSTIN || inv.extractedData?.taxId || null,
          GSTIN: inv.GSTIN || inv.extractedData?.GSTIN || null,
          invoiceCount: 0,
          totalInvoicesCount: 0,
          paidInvoicesCount: 0,
          pendingInvoicesCount: 0,
          overdueInvoicesCount: 0,
          totalAmount: 0,
          totalSpend: 0,
          paidAmount: 0,
          totalPaid: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          totalOutstanding: 0,
          lastInvoiceDate: null,
          lastInvoiceId: null,
          invoices: [],
        };
      }

      const v = vendorMap[vendorKey];
      v.invoiceCount += 1;
      v.totalInvoicesCount += 1;
      v.totalAmount += totalAmt;
      v.totalSpend += totalAmt;

      if (isPaid) {
        v.paidInvoicesCount += 1;
        v.paidAmount += totalAmt;
        v.totalPaid += totalAmt;
      } else if (isOverdue) {
        v.overdueInvoicesCount += 1;
        v.overdueAmount += totalAmt;
        v.totalOutstanding += totalAmt;
      } else {
        v.pendingInvoicesCount += 1;
        v.pendingAmount += totalAmt;
        v.totalOutstanding += totalAmt;
      }

      const invDateStr = inv.invoiceDate || inv.createdAt;
      if (invDateStr) {
        if (!v.lastInvoiceDate || new Date(invDateStr) > new Date(v.lastInvoiceDate)) {
          v.lastInvoiceDate = invDateStr;
          v.lastInvoiceId = inv._id;
        }
      }

      v.invoices.push({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber || inv.fileName,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        amount: totalAmt,
        status: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING',
      });
    }

    let allVendors = Object.values(vendorMap).map((v) => cleanData(v));

    if (search) {
      allVendors = allVendors.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(search) ||
          (v.vendorEmail && v.vendorEmail.toLowerCase().includes(search)) ||
          (v.vendorLegalName && v.vendorLegalName.toLowerCase().includes(search))
      );
    }

    const totalVendors = allVendors.length;
    const totalPages = Math.ceil(totalVendors / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedVendors = allVendors.slice(startIndex, startIndex + limit);

    const summary = {
      totalVendors,
      totalInvoices: globalTotalInvoices,
      totalVendorSpend: globalTotalVendorSpend,
      pendingVendorAmount: globalPendingVendorAmount,
      overdueVendorAmount: globalOverdueVendorAmount,
    };

    const pagination = {
      page,
      limit,
      totalCount: totalVendors,
      totalPages,
    };

    return res.status(200).json({
      success: true,
      count: paginatedVendors.length,
      summary,
      vendors: paginatedVendors,
      pagination,
    });
  } catch (error) {
    console.error('Error fetching vendors list:', error);
    return res.status(500).json({ message: 'Failed to aggregate vendors data' });
  }
}

async function getVendorByKey(req, res) {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ message: 'Vendor key is required' });
    }

    const filter = getCompanyFilter(req);
    const invoices = await Invoice.find(filter).lean();

    const targetKey = decodeURIComponent(key).trim().toLowerCase();
    const vendorInvoices = invoices.filter((inv) => {
      const vName = (inv.vendorName || inv.extractedData?.vendorName || '').trim().toLowerCase();
      return vName === targetKey;
    });

    if (vendorInvoices.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const firstInv = vendorInvoices[0];
    const cleanVendorName = firstInv.vendorName || firstInv.extractedData?.vendorName || 'Vendor';

    const vendorDetails = {
      vendorKey: targetKey,
      vendorName: cleanVendorName,
      vendorEmail: firstInv.vendorEmail || firstInv.extractedData?.vendorEmail || null,
      vendorPhone: firstInv.vendorPhone || firstInv.extractedData?.vendorPhone || null,
      vendorAddress: firstInv.vendorAddress || firstInv.extractedData?.vendorAddress || null,
      taxId: firstInv.taxId || firstInv.GSTIN || firstInv.extractedData?.taxId || null,
      GSTIN: firstInv.GSTIN || firstInv.extractedData?.GSTIN || null,
      totalInvoicesCount: vendorInvoices.length,
      invoices: vendorInvoices.map((inv) => cleanData(inv)),
    };

    return res.status(200).json({
      success: true,
      vendor: cleanData(vendorDetails),
    });
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    return res.status(500).json({ message: 'Failed to fetch vendor details' });
  }
}

module.exports = {
  getVendors,
  getVendorByKey,
};
