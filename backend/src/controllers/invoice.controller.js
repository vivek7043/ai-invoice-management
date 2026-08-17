const mongoose = require('mongoose');
const path = require('path');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { getCompanyFilter, cleanData, hasMeaningfulValue } = require('../utils/cleanData');
const { extractPdfTextAndMetadata } = require('../services/extraction.service');
const { extractInvoiceFields } = require('../services/ai.service');
const { createAuditLog } = require('../services/auditLog.service');
const { createInvoiceUploadNotification } = require('../services/notification.service');

async function getInvoices(req, res) {
  try {
    const filter = getCompanyFilter(req);
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

    const cleanInvoices = invoices.map((inv) => {
      const cleaned = cleanData(inv) || {};
      if (!cleaned.dueDate && !cleaned.paymentDueDate) {
        cleaned.dueDate = 'Not available';
      }
      return cleaned;
    });

    return res.status(200).json({
      success: true,
      count: cleanInvoices.length,
      invoices: cleanInvoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ message: 'Failed to fetch invoices from database' });
  }
}

async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }

    const filter = { _id: id, ...getCompanyFilter(req) };
    const invoiceDoc = await Invoice.findOne(filter);
    if (!invoiceDoc) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const rawObj = invoiceDoc.toObject();
    const invoice = cleanData(rawObj);

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return res.status(500).json({ message: 'Failed to fetch invoice details' });
  }
}

async function uploadInvoice(req, res) {
  const uploadedFile = req.file || (req.files && (req.files.file?.[0] || req.files.invoice?.[0]));
  if (!uploadedFile) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = uploadedFile.path;

  try {
    const { extractedText, extractionMethod, pageCount } = await extractPdfTextAndMetadata(filePath);

    if (!extractedText) {
      return res.status(422).json({
        message: 'OCR failed: no readable text could be extracted',
      });
    }

    const rawExtractedData = await extractInvoiceFields(extractedText);
    const cleanedExtractedData = cleanData(rawExtractedData) || {};

    const amountVal = cleanedExtractedData.amount !== null && cleanedExtractedData.amount !== undefined
      ? cleanedExtractedData.amount
      : (cleanedExtractedData.totalAmount !== null && cleanedExtractedData.totalAmount !== undefined
        ? cleanedExtractedData.totalAmount
        : (cleanedExtractedData.grandTotal !== null && cleanedExtractedData.grandTotal !== undefined ? cleanedExtractedData.grandTotal : null));

    const invoicePayload = {
      user: req.user ? req.user._id : null,
      companyId: req.user ? req.user.companyId : null,
      createdBy: req.user ? req.user._id : null,
      fileName: uploadedFile.filename,
      filePath: `/uploads/invoices/${uploadedFile.filename}`,
      status: cleanedExtractedData.status || cleanedExtractedData.paymentStatus || 'PENDING',
      amount: amountVal,
      extractedData: cleanedExtractedData,
    };

    for (const [key, val] of Object.entries(cleanedExtractedData)) {
      if (hasMeaningfulValue(val)) {
        invoicePayload[key] = val;
      }
    }

    if (cleanedExtractedData.gstin && !invoicePayload.GSTIN) invoicePayload.GSTIN = cleanedExtractedData.gstin;
    if (cleanedExtractedData.vatNumber && !invoicePayload.VATNumber) invoicePayload.VATNumber = cleanedExtractedData.vatNumber;
    if (cleanedExtractedData.pan && !invoicePayload.PAN) invoicePayload.PAN = cleanedExtractedData.pan;
    if (cleanedExtractedData.cin && !invoicePayload.CIN) invoicePayload.CIN = cleanedExtractedData.cin;
    if (cleanedExtractedData.ifscCode && !invoicePayload.IFSC) invoicePayload.IFSC = cleanedExtractedData.ifscCode;
    if (cleanedExtractedData.swiftCode && !invoicePayload.SWIFT) invoicePayload.SWIFT = cleanedExtractedData.swiftCode;
    if (cleanedExtractedData.iban && !invoicePayload.IBAN) invoicePayload.IBAN = cleanedExtractedData.iban;
    if (cleanedExtractedData.upiId && !invoicePayload.UPI) invoicePayload.UPI = cleanedExtractedData.upiId;

    const invoiceDoc = new Invoice(invoicePayload);
    const savedInvoice = await invoiceDoc.save();

    const reviewRequired = !cleanedExtractedData.invoiceNumber || !cleanedExtractedData.amount;
    const currentCompanyId = req.user ? req.user.companyId : null;
    const currentUserId = req.user ? req.user._id : null;
    const currentUserName = req.user ? req.user.name : 'Owner';

    await createAuditLog({
      companyId: currentCompanyId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'PDF_UPLOADED',
      entityType: 'PDF',
      description: 'Invoice PDF was uploaded',
    });

    if (reviewRequired) {
      await createAuditLog({
        companyId: currentCompanyId,
        userId: currentUserId,
        userName: currentUserName,
        action: 'PDF_EXTRACTION_FAILED',
        entityType: 'PDF',
        description: 'Invoice PDF extraction failed and requires review',
      });
    } else {
      await createAuditLog({
        companyId: currentCompanyId,
        userId: currentUserId,
        userName: currentUserName,
        action: 'PDF_EXTRACTION_COMPLETED',
        entityType: 'PDF',
        description: 'Invoice data was successfully extracted',
      });
    }

    const invNum = savedInvoice.invoiceNumber || savedInvoice.fileName || 'Invoice';
    await createAuditLog({
      companyId: currentCompanyId,
      userId: currentUserId,
      userName: currentUserName,
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: String(savedInvoice._id),
      description: `Invoice ${invNum} was created`,
    });

    await createInvoiceUploadNotification(savedInvoice, reviewRequired);

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileName: uploadedFile.filename,
      path: `/uploads/invoices/${uploadedFile.filename}`,
      extractionMethod,
      pageCount,
      extractedData: cleanedExtractedData,
      savedInvoice,
    });
  } catch (error) {
    console.error('Invoice upload processing error:', error);
    return res.status(422).json({
      message: error.message || 'OCR failed: no readable text could be extracted',
    });
  }
}

async function markInvoicePaid(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID format' });
    }

    const filter = { _id: id, ...getCompanyFilter(req) };
    const invoice = await Invoice.findOne(filter);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const isAlreadyPaid = (invoice.status || '').toUpperCase() === 'PAID' || (invoice.paymentStatus || '').toUpperCase() === 'PAID';
    if (isAlreadyPaid) {
      return res.status(400).json({ success: false, message: 'Invoice is already marked as paid' });
    }

    const total = (invoice.totalAmount !== null && invoice.totalAmount !== undefined && !isNaN(Number(invoice.totalAmount)))
      ? Number(invoice.totalAmount)
      : ((invoice.amount !== null && invoice.amount !== undefined && !isNaN(Number(invoice.amount)))
        ? Number(invoice.amount)
        : ((invoice.grandTotal !== null && invoice.grandTotal !== undefined && !isNaN(Number(invoice.grandTotal))) ? Number(invoice.grandTotal) : 0));

    invoice.status = 'PAID';
    invoice.paymentStatus = 'PAID';
    invoice.amountPaid = total;
    invoice.balanceDue = 0;
    invoice.amountDue = 0;
    invoice.paidAt = new Date();

    const savedInvoice = await invoice.save();

    await Notification.deleteMany({
      invoiceId: invoice._id,
      type: { $in: ['DUE_TOMORROW', 'DUE_TODAY', 'OVERDUE'] },
    });

    const invNum = savedInvoice.invoiceNumber || savedInvoice.fileName || 'Invoice';
    await createAuditLog({
      companyId: req.user ? req.user.companyId : savedInvoice.companyId,
      userId: req.user ? req.user._id : savedInvoice.user,
      userName: req.user ? req.user.name : 'Owner',
      action: 'INVOICE_MARKED_PAID',
      entityType: 'Invoice',
      entityId: String(savedInvoice._id),
      description: `Invoice ${invNum} was marked as paid`,
    });

    return res.status(200).json({
      success: true,
      message: `Invoice ${invNum} marked as paid successfully`,
      invoice: savedInvoice,
    });
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark invoice as paid' });
  }
}

async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const filter = { _id: id, ...getCompanyFilter(req) };
    const invoice = await Invoice.findOne(filter);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const wasPaidBefore = (invoice.status || '').toUpperCase() === 'PAID';
    const isNowPaid = (updateData.status || '').toUpperCase() === 'PAID' || (updateData.paymentStatus || '').toUpperCase() === 'PAID';

    if (isNowPaid && !wasPaidBefore) {
      const total = (updateData.totalAmount !== undefined ? updateData.totalAmount : invoice.totalAmount) ??
                    (updateData.amount !== undefined ? updateData.amount : invoice.amount) ?? 0;
      updateData.amountPaid = total;
      updateData.balanceDue = 0;
      updateData.amountDue = 0;
      updateData.paidAt = new Date();
    }

    const updatedInvoice = await Invoice.findOneAndUpdate(filter, updateData, { new: true });

    const invNum = updatedInvoice.invoiceNumber || updatedInvoice.fileName || 'Invoice';

    if (isNowPaid && !wasPaidBefore) {
      await Notification.deleteMany({
        invoiceId: updatedInvoice._id,
        type: { $in: ['DUE_TOMORROW', 'DUE_TODAY', 'OVERDUE'] },
      });

      await createAuditLog({
        companyId: req.user ? req.user.companyId : updatedInvoice.companyId,
        userId: req.user ? req.user._id : updatedInvoice.user,
        userName: req.user ? req.user.name : 'Owner',
        action: 'INVOICE_MARKED_PAID',
        entityType: 'Invoice',
        entityId: String(updatedInvoice._id),
        description: `Invoice ${invNum} was marked as paid`,
      });
    } else {
      await createAuditLog({
        companyId: req.user ? req.user.companyId : updatedInvoice.companyId,
        userId: req.user ? req.user._id : updatedInvoice.user,
        userName: req.user ? req.user.name : 'Owner',
        action: 'INVOICE_UPDATED',
        entityType: 'Invoice',
        entityId: String(updatedInvoice._id),
        description: `Invoice ${invNum} was updated`,
      });
    }

    return res.status(200).json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({ success: false, message: 'Failed to update invoice' });
  }
}

async function deleteInvoice(req, res) {
  try {
    const { id } = req.params;

    const filter = { _id: id, ...getCompanyFilter(req) };
    const deletedInvoice = await Invoice.findOneAndDelete(filter);
    if (!deletedInvoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invNum = deletedInvoice.invoiceNumber || deletedInvoice.fileName || 'Invoice';
    await createAuditLog({
      companyId: req.user ? req.user.companyId : deletedInvoice.companyId,
      userId: req.user ? req.user._id : deletedInvoice.user,
      userName: req.user ? req.user.name : 'Owner',
      action: 'INVOICE_DELETED',
      entityType: 'Invoice',
      entityId: String(deletedInvoice._id),
      description: `Invoice ${invNum} was deleted`,
    });

    return res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete invoice' });
  }
}

module.exports = {
  getInvoices,
  getInvoiceById,
  uploadInvoice,
  markInvoicePaid,
  updateInvoice,
  deleteInvoice,
};
