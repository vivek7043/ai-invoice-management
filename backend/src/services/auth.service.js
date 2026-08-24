const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const PasswordReset = require('../models/PasswordReset');
const env = require('../config/env');
const { sendResetOtpEmail } = require('./email.service');
const { createAuditLog } = require('./auditLog.service');

async function registerOwner({ name, email, password, profileImage }) {
  const cleanEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newCompany = new Company({
    companyName: `${name.trim()}'s Company`,
    logo: profileImage || null,
  });

  const newUser = new User({
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    role: 'OWNER',
    companyId: newCompany._id,
    profileImage: profileImage || null,
    isActive: true,
  });

  newCompany.ownerId = newUser._id;

  await newCompany.save();
  const savedUser = await newUser.save();

  const token = jwt.sign(
    { id: savedUser._id, role: savedUser.role, companyId: savedUser.companyId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  await createAuditLog({
    companyId: savedUser.companyId,
    userId: savedUser._id,
    userName: savedUser.name,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: String(savedUser._id),
    description: `New Owner ${savedUser.name} registered and workspace initialized`,
  });

  return {
    user: {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      companyId: savedUser.companyId,
      profileImage: savedUser.profileImage,
    },
    company: {
      id: newCompany._id,
      companyName: newCompany.companyName,
      logo: newCompany.logo,
    },
    token,
  };
}

async function loginUser({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: cleanEmail });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  let company = null;
  if (user.companyId) {
    company = await Company.findById(user.companyId);
  }
  if (!company) {
    company = await Company.findOne({ ownerId: user._id });
  }

  if (!company) {
    company = await Company.create({
      companyName: `${user.name}'s Company`,
      ownerId: user._id,
      logo: user.profileImage || null,
    });
    user.companyId = company._id;
    await user.save();
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, companyId: company._id },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  await createAuditLog({
    companyId: company._id,
    userId: user._id,
    userName: user.name,
    action: 'USER_LOGGED_IN',
    entityType: 'User',
    entityId: String(user._id),
    description: `Owner ${user.name} logged in successfully`,
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: company._id,
      profileImage: user.profileImage || null,
    },
    company: {
      id: company._id,
      companyName: company.companyName,
      logo: company.logo || null,
    },
    token,
  };
}

async function forgotPassword(email) {
  const cleanEmail = email.trim().toLowerCase();

  console.log("Searching email:", cleanEmail);
  const user = await User.findOne({ email: cleanEmail });
  console.log("User found:", Boolean(user));

  if (!user) {
    throw new Error('No registered account found with this email address');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await PasswordReset.deleteMany({ email: cleanEmail });

  await PasswordReset.create({
    userId: user._id,
    email: cleanEmail,
    otpHash,
    expiresAt,
    isVerified: false,
  });

  await sendResetOtpEmail(cleanEmail, otp);

  await createAuditLog({
    companyId: user.companyId,
    userId: user._id,
    userName: user.name,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'Auth',
    entityId: String(user._id),
    description: 'Password reset OTP generated and sent to email',
  });

  return { message: 'A 6-digit verification OTP code has been sent to your email.' };
}

async function verifyResetOtp(email, otp) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const resetRecord = await PasswordReset.findOne({ email: cleanEmail }).sort({ createdAt: -1 });

  if (!resetRecord) {
    throw new Error('No password reset request found. Please request a new OTP.');
  }

  if (resetRecord.expiresAt < new Date()) {
    throw new Error('Verification OTP code has expired. Please request a new code.');
  }

  const isMatch = await bcrypt.compare(cleanOtp, resetRecord.otpHash);
  if (!isMatch) {
    throw new Error('Invalid verification OTP code. Please enter the correct code.');
  }

  resetRecord.isVerified = true;
  resetRecord.verifiedAt = new Date();
  await resetRecord.save();

  return { message: 'OTP verified successfully. You may now reset your password.' };
}

async function resetPassword(email, newPassword) {
  const cleanEmail = email.trim().toLowerCase();

  const resetRecord = await PasswordReset.findOne({
    email: cleanEmail,
    isVerified: true,
  }).sort({ createdAt: -1 });

  if (!resetRecord) {
    throw new Error('OTP verification required before resetting password.');
  }

  if (resetRecord.expiresAt < new Date()) {
    throw new Error('Password reset session has expired. Please request a new OTP.');
  }

  const user = await User.findById(resetRecord.userId);
  if (!user) {
    throw new Error('Associated user account not found.');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  await PasswordReset.deleteMany({ email: cleanEmail });

  await createAuditLog({
    companyId: user.companyId,
    userId: user._id,
    userName: user.name,
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'Auth',
    entityId: String(user._id),
    description: 'User password successfully reset via OTP',
  });

  return { message: 'Password reset successfully. You can now log in with your new password.' };
}

module.exports = {
  registerOwner,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};
