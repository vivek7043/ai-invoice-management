const express = require('express');
const invoiceController = require('../controllers/invoice.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadInvoice } = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/upload', uploadInvoice.fields([{ name: 'file', maxCount: 1 }, { name: 'invoice', maxCount: 1 }]), invoiceController.uploadInvoice);
router.patch('/:id/pay', invoiceController.markInvoicePaid);
router.patch('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
