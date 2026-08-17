const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Upload directory for invoice PDFs
const invoiceUploadDir = path.join(__dirname, '../../storage/uploads/invoices');
if (!fs.existsSync(invoiceUploadDir)) {
  fs.mkdirSync(invoiceUploadDir, { recursive: true });
}

const invoiceStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, invoiceUploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const uploadInvoice = multer({
  storage: invoiceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed'));
  },
});

// 2. Upload directory for settings (profile images & company logos)
const settingsUploadDir = path.join(__dirname, '../../storage/uploads/settings');
if (!fs.existsSync(settingsUploadDir)) {
  fs.mkdirSync(settingsUploadDir, { recursive: true });
}

const settingsStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, settingsUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname || 'upload';
    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});

const uploadSettings = multer({
  storage: settingsStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

module.exports = {
  uploadInvoice,
  uploadSettings,
  invoiceUploadDir,
  settingsUploadDir,
};
