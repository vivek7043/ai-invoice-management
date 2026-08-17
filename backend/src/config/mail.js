const nodemailer = require('nodemailer');
const env = require('./env');

function createTransporter() {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASSWORD;
  const service = env.SMTP_SERVICE;

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

async function verifySmtpConnection() {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASSWORD;
  const service = env.SMTP_SERVICE;

  const isConfigured = Boolean((host && user && pass) || (service && user && pass));
  console.log(`SMTP configured: ${isConfigured}`);

  if (!isConfigured) {
    console.warn('SMTP configuration is incomplete. Email sending will be disabled or fail.');
    return false;
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn('Could not create Nodemailer transporter.');
      return false;
    }
    await transporter.verify();
    console.log('SMTP connection: successful');
    return true;
  } catch (err) {
    console.error(`SMTP connection error: ${err.message}`);
    return false;
  }
}

module.exports = {
  createTransporter,
  verifySmtpConnection,
};
