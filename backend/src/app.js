const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const vendorRoutes = require('./routes/vendor.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const settingsRoutes = require('./routes/settings.routes');
const aiRoutes = require('./routes/ai.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const storageUploadsDir = path.join(__dirname, '../storage/uploads');
const legacyUploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(storageUploadsDir)) {
  fs.mkdirSync(storageUploadsDir, { recursive: true });
}
if (!fs.existsSync(legacyUploadsDir)) {
  fs.mkdirSync(legacyUploadsDir, { recursive: true });
}

// Serve static uploaded files
app.use('/uploads', express.static(storageUploadsDir));
app.use('/uploads', express.static(legacyUploadsDir));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai-assistant', aiRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend service operational' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
