const { getResendClient, createSmtpTransporter } = require('../config/mail');
const env = require('../config/env');

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
}

async function sendResetOtpEmail(toEmail, otp) {
  const cleanEmail = toEmail.trim().toLowerCase();
  const masked = maskEmail(cleanEmail);

  console.log(`Password reset OTP generated for user: ${masked}`);
  console.log('OTP email sending started.');

  const resend = getResendClient();
  const smtpTransporter = createSmtpTransporter();

  if (!resend && !smtpTransporter) {
    throw new Error('Email configuration is missing. Please provide RESEND_API_KEY or SMTP credentials.');
  }

  const fromAddress = env.MAIL_FROM || env.SMTP_USER;
  if (!fromAddress) {
    throw new Error('MAIL_FROM configuration error: Sender email address is missing in environment variables.');
  }

  const formattedFrom = fromAddress.includes('<')
    ? fromAddress
    : `AI Invoice Support <${fromAddress}>`;

  const subject = 'Your Password Reset Verification Code - AI Invoice Portal';
  const text = `Your verification code for password reset is: ${otp}\n\nThis code will expire in 5 minutes.\nIf you did not request a password reset, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4F46E5; margin-top: 0;">Password Reset Request</h2>
      <p>You requested a password reset for your AI Invoice Portal account.</p>
      <p>Your 6-digit verification code is:</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #6B7280; font-size: 14px;">This verification code will expire in 5 minutes.</p>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px;">If you did not request this password reset, please ignore this email.</p>
    </div>
  `;

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: formattedFrom,
        to: [cleanEmail],
        subject,
        text,
        html,
      });

      if (error) {
        const errorMsg = typeof error === 'object' ? error.message || JSON.stringify(error) : String(error);
        throw new Error(errorMsg);
      }

      const messageId = data ? data.id : 'unknown';
      console.log(`OTP email sent successfully via Resend. Message ID: ${messageId}`);
      return data;
    } catch (err) {
      console.error(`Failed to send OTP email via Resend to ${masked}: ${err.message}`);
      throw new Error(`Failed to send OTP email: ${err.message}`);
    }
  }

  try {
    const info = await smtpTransporter.sendMail({
      from: formattedFrom,
      to: cleanEmail,
      subject,
      text,
      html,
    });
    console.log(`OTP email sent successfully via SMTP. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`Failed to send OTP email via SMTP to ${masked}: ${err.message}`);
    throw new Error(`Failed to send OTP email: ${err.message}`);
  }
}

module.exports = {
  maskEmail,
  sendResetOtpEmail,
};
