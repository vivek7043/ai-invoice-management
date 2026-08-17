const { createTransporter } = require('../config/mail');
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

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('SMTP configuration is missing or incomplete. Cannot send OTP email.');
  }

  const fromAddress = env.MAIL_FROM || env.SMTP_USER;

  const mailOptions = {
    from: `"AI Invoice Support" <${fromAddress}>`,
    to: cleanEmail,
    subject: 'Your Password Reset Verification Code - AI Invoice Portal',
    text: `Your verification code for password reset is: ${otp}\n\nThis code will expire in 5 minutes.\nIf you did not request a password reset, please ignore this email.`,
    html: `
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
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully. Message ID: ${info.messageId}, Accepted: ${JSON.stringify(info.accepted)}`);
    return info;
  } catch (error) {
    console.error(`Failed to send OTP email to ${masked}: ${error.message}`);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

module.exports = {
  maskEmail,
  sendResetOtpEmail,
};
