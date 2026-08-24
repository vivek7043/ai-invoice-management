const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const env = require('./env');

function getResendClient() {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function createSmtpTransporter() {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASSWORD;
  const service = env.SMTP_SERVICE;

  if (service && user && pass) {
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

async function verifyMailConfig() {
  const hasResend = Boolean(env.RESEND_API_KEY);
  const hasSmtp = Boolean((env.SMTP_HOST || env.SMTP_SERVICE) && env.SMTP_USER && env.SMTP_PASSWORD);

  if (hasResend) {
    console.log('Email service configured: Resend HTTP API');
    return true;
  }

  if (hasSmtp) {
    console.log('Email service configured: Nodemailer SMTP');
    try {
      const transporter = createSmtpTransporter();
      if (transporter) {
        await transporter.verify();
        console.log('SMTP connection: successful');
        return true;
      }
    } catch (err) {
      console.warn('SMTP verification warning:', err.message);
    }
    return true;
  }

  console.warn('Email configuration is missing. Neither RESEND_API_KEY nor SMTP credentials are set.');
  return false;
}

module.exports = {
  getResendClient,
  createSmtpTransporter,
  createTransporter: createSmtpTransporter,
  verifyMailConfig,
  verifySmtpConnection: verifyMailConfig,
};
